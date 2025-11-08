// ================== UTILS ==================
function Utils(params) {
  const blockSize = params.blockSize;
  const ctx = document.querySelector("canvas").getContext("2d");

  function drawLine(start, end, color) {
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.moveTo(start[0] * blockSize + blockSize / 2, start[1] * blockSize + blockSize / 2);
    ctx.lineTo(end[0] * blockSize + blockSize / 2, end[1] * blockSize + blockSize / 2);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  this.distance = (from, to, color) => drawLine(from, to, color);

  this.distanceCount = (from, to, color) => {
    const d = Math.abs(from[0] - to[0]) + Math.abs(from[1] - to[1]);
    ctx.fillStyle = color;
    ctx.font = "15px Arial";
    ctx.fillText(d, to[0] * blockSize, to[1] * blockSize - 10);
  }
}

// ================== GAME ==================
function Game(params) {
  const canvas = params.canvas;
  const ctx = canvas.getContext("2d");

  const size = params.size;
  const blockSize = params.blockSize;
  const totalBlock = Math.floor(size / blockSize);
  const fps = params.fps;

  const snakeColor = params.snakeColor || "#4caf50";
  const snakeStroke = params.snakeStroke || "#388e3c";
  const foodColor = params.foodColor || "#f44336";
  const foodStroke = params.foodStroke || "#c62828";

  const utils = params.utils || {};
  let interval, timeInterval;

  let snake = [[1, 0], [0, 0]];
  let direction = params.aStar ? false : 39;
  let food = [];
  let score = 0;

  let aStar = params.aStar;
  let aStarBlock = [];

  const scoreEl = document.querySelector("#score");

  // ================== SOUND ==================
  function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.preload = "auto";
    this.sound.controls = false;
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = () => this.sound.play();
    this.stop = () => this.sound.pause();
  }

  const eatedSound = new Sound("sound/eated.mp3");
  const gameOverSound = new Sound("sound/gameover.mp3");

  function gameOver() {
    clearInterval(interval);
    clearInterval(timeInterval);
    gameOverSound.play();
    alert(`Game Over! Score: ${score}`);
  }

  // ================== DRAW ==================
  function drawRect(x, y, color, stroke) {
    ctx.fillStyle = color;
    ctx.strokeStyle = stroke || color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, blockSize, blockSize, 4); // rounded corners
    ctx.fill();
    ctx.stroke();
  }

  function drawSnake() {
    for (let i = 1; i < snake.length; i++) {
      drawRect(snake[i][0] * blockSize, snake[i][1] * blockSize, "#000", "#222");
    }
    drawRect(snake[0][0] * blockSize, snake[0][1] * blockSize, snakeColor, snakeStroke);
  }

  function drawFood() {
    drawRect(food[0] * blockSize, food[1] * blockSize, foodColor, foodStroke);
  }

  function randomFood() {
    food = [Math.floor(Math.random() * totalBlock), Math.floor(Math.random() * totalBlock)];
    snake.forEach(cell => {
      if (cell[0] === food[0] && cell[1] === food[1]) randomFood();
    });
  }

  function eated() {
    eatedSound.play();
    score += 1;
    scoreEl.innerHTML = score;
    snake.push([...food]);
  }

  // ================== SNAKE MOVE ==================
  function snakeMove() {
    if (!aStar) {
      document.onkeydown = function(e) {
        if (Math.abs(direction - e.keyCode) !== 2) direction = e.keyCode;
      }
    }

    let move = [snake[0][0], snake[0][1]];

    if (aStar && aStarBlock.length === 2) {
      if (aStarBlock[1] - move[0] === 1) direction = 39;
      else if (aStarBlock[1] - move[0] === -1) direction = 37;
      else if (aStarBlock[0] - move[1] === 1) direction = 40;
      else if (aStarBlock[0] - move[1] === -1) direction = 38;
    }

    switch (direction) {
      case 37: move[0] -= 1; break;
      case 38: move[1] -= 1; break;
      case 39: move[0] += 1; break;
      case 40: move[1] += 1; break;
    }

    if (move[0] < 0 || move[0] >= totalBlock || move[1] < 0 || move[1] >= totalBlock) gameOver();
    snake.forEach(cell => { if (cell[0] === move[0] && cell[1] === move[1]) gameOver(); });

    if (move[0] === food[0] && move[1] === food[1]) { eated(); randomFood(); }

    snake.unshift(move);
    snake.pop();
  }

  // ================== SMART A* ==================
  function runAStar(snakePos) {
    const board = Array.from({length: totalBlock}, () => Array(totalBlock).fill(1));
    snake.slice(0, -1).forEach(cell => board[cell[1]][cell[0]] = 0);

    const graph = new Graph(board);
    const start = graph.grid[snakePos[1]][snakePos[0]];
    const end = graph.grid[food[1]][food[0]];

    let path = astar.search(graph, start, end);

    // Safety check: can snake reach tail after moving?
    const tail = snake[snake.length-1];
    const tailNode = graph.grid[tail[1]][tail[0]];

    function safePath(path) {
      if (path.length === 0) return false;
      const simulatedSnake = [[...snakePos], ...snake.slice(0, -1)];
      for (let step of path) {
        simulatedSnake.unshift([step.x, step.y]);
        simulatedSnake.pop();
      }
      const simBoard = Array.from({length: totalBlock}, () => Array(totalBlock).fill(1));
      simulatedSnake.slice(0, -1).forEach(c => simBoard[c[1]][c[0]] = 0);
      const simGraph = new Graph(simBoard);
      const simStart = simGraph.grid[simulatedSnake[0][1]][simulatedSnake[0][0]];
      const simPathToTail = astar.search(simGraph, simStart, simGraph.grid[tail[1]][tail[0]]);
      return simPathToTail.length > 0;
    }

    if (safePath(path)) aStarBlock = [path[0].x, path[0].y];
    else {
      const pathToTail = astar.search(graph, start, tailNode);
      if (pathToTail.length > 0) aStarBlock = [pathToTail[0].x, pathToTail[0].y];
      else {
        const neighbors = graph.neighbors(start).filter(n => !n.isWall());
        aStarBlock = neighbors.length > 0 ? [neighbors[0].x, neighbors[0].y] : [start.x, start.y];
      }
    }
  }

  // ================== INIT ==================
  randomFood();
  drawSnake();
  drawFood();
  const utilities = new Utils({ blockSize });
  if (aStar) runAStar(snake[0]);

  function update() {
    snakeMove();
    ctx.clearRect(0, 0, size, size);
    drawSnake();
    drawFood();
    if (aStar) runAStar(snake[0]);
  }

  this.play = () => {
    interval = setInterval(update, 1000 / fps);
    timeInterval = setInterval(() => {
      const timeEl = document.querySelector("#time");
      timeEl.innerHTML = +timeEl.innerHTML + 1;
    }, 1000);
  }

  this.pause = () => {
    clearInterval(interval);
    clearInterval(timeInterval);
  }
}

// ================== ASTAR LIBRARY ==================
(function(definition) {
  if (typeof module === 'object' && typeof module.exports === 'object') module.exports = definition();
  else if (typeof define === 'function' && define.amd) define([], definition);
  else { const exports = definition(); window.astar = exports.astar; window.Graph = exports.Graph; }
})(function() {
  function pathTo(node) {
    const path = [];
    while (node.parent) { path.unshift(node); node = node.parent; }
    return path;
  }

  function getHeap() { return new BinaryHeap(n => n.f); }

  const astar = {
    search: function(graph, start, end) {
      graph.cleanDirty();
      start.h = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
      const openHeap = getHeap();
      const closedList = [];
      openHeap.push(start);

      while (openHeap.size() > 0) {
        const current = openHeap.pop();
        if (current === end) { while(closedList.length) closedList.pop().closed=false; return pathTo(current); }
        current.closed = true;
        closedList.push(current);

        graph.neighbors(current).forEach(neighbor => {
          if (neighbor.closed || neighbor.isWall()) return;
          const gScore = current.g + neighbor.getCost(current);
          if (!neighbor.visited || gScore < neighbor.g) {
            neighbor.visited = true;
            neighbor.parent = current;
            neighbor.h = neighbor.h || Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
            neighbor.g = gScore;
            neighbor.f = neighbor.g + neighbor.h;
            graph.markDirty(neighbor);
            if (!neighbor.visited) openHeap.push(neighbor);
            else openHeap.rescoreElement(neighbor);
          }
        });
      }
      while(closedList.length) closedList.pop().closed=false;
      return [];
    }
  };

  function Graph(gridIn) {
    this.grid = [];
    this.nodes = [];
    for (let y = 0; y < gridIn.length; y++) {
      this.grid[y] = [];
      for (let x = 0; x < gridIn[y].length; x++) {
        const node = new GridNode(x, y, gridIn[y][x]);
        this.grid[y][x] = node;
        this.nodes.push(node);
      }
    }
    this.dirtyNodes = [];
  }
  Graph.prototype.cleanDirty = function() { this.dirtyNodes.forEach(n => { n.f=0;n.g=0;n.h=0;n.visited=false;n.closed=false;n.parent=null }); this.dirtyNodes=[]; }
  Graph.prototype.markDirty = function(node){ this.dirtyNodes.push(node); }
  Graph.prototype.neighbors = function(node){
    const ret = [];
    const x = node.x, y = node.y;
    if(this.grid[y-1] && this.grid[y-1][x]) ret.push(this.grid[y-1][x]);
    if(this.grid[y+1] && this.grid[y+1][x]) ret.push(this.grid[y+1][x]);
    if(this.grid[y][x-1]) ret.push(this.grid[y][x-1]);
    if(this.grid[y][x+1]) ret.push(this.grid[y][x+1]);
    return ret;
  }

  function GridNode(x,y,w){ this.x=x; this.y=y; this.weight=w; this.f=0; this.g=0; this.h=0; this.visited=false; this.closed=false; this.parent=null; }
  GridNode.prototype.getCost = function(from){ return (from && from.x!==this.x && from.y!==this.y)?this.weight*1.41421:this.weight; }
  GridNode.prototype.isWall = function(){ return this.weight===0; }

  function BinaryHeap(scoreFunc){ this.content=[]; this.scoreFunction=scoreFunc; }
  BinaryHeap.prototype.push = function(e){ this.content.push(e); this.sinkDown(this.content.length-1); }
  BinaryHeap.prototype.pop = function(){
    const result = this.content[0];
    const end = this.content.pop();
    if(this.content.length){ this.content[0]=end; this.bubbleUp(0); }
    return result;
  }
  BinaryHeap.prototype.sinkDown = function(n){
    const e = this.content[n];
    while(n>0){
      const parentN = ((n+1)>>1)-1, parent=this.content[parentN];
      if(this.scoreFunction(e)<this.scoreFunction(parent)){ this.content[parentN]=e; this.content[n]=parent; n=parentN; } else break;
    }
  }
  BinaryHeap.prototype.bubbleUp=function(n){
    const l=this.content.length,e=this.content[n],s=this.scoreFunction(e);
    while(true){
      const c2=(n+1)<<1,c1=c2-1; let swap=null;
      if(c1<l){ const child=this.content[c1]; if(this.scoreFunction(child)<s) swap=c1; }
      if(c2<l){ const child=this.content[c2]; if(this.scoreFunction(child)<(swap===null?s:this.scoreFunction(this.content[swap]))) swap=c2; }
      if(swap!==null){ this.content[n]=this.content[swap]; this.content[swap]=e; n=swap; } else break;
    }
  }

  return { astar, Graph };
});
