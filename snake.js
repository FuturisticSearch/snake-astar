// ================== UTILS ==================
function Utils(params) {
  var blockSize = params.blockSize;
  var ctx = document.querySelector("canvas").getContext("2d");

  function drawStroke(start, end, color) {
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.moveTo((start[0] * blockSize) + (blockSize / 2), (start[1] * blockSize) + (blockSize / 2));
    ctx.lineTo((end[0] * blockSize) + (blockSize / 2), (end[1] * blockSize) + (blockSize / 2));
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  this.distance = (line1, line2, color) => {
    drawStroke(line1, line2, color);
  }

  this.distanceCount = (line1, line2, color) => {
    let d = Math.abs(line1[0] - line2[0]) + Math.abs(line1[1] - line2[1]);
    ctx.fillStyle = color;
    ctx.font = "15px Arial";
    ctx.fillText(d, line2[0] * blockSize, (line2[1] * blockSize) - 10);
  }

  this.distancePerpendicular = (line1, line2, line3, line4, color) => {
    ctx.fillStyle = color;
    ctx.font = "15px Arial";
    drawStroke(line1, line2, color);
    ctx.fillText([line2], line2[0] * blockSize, (line2[1] * blockSize) - 30);
    drawStroke(line3, line4, color);
    ctx.fillText([line4], line4[0] * blockSize, (line4[1] * blockSize) + 30);
  }
}

// ================== GAME ==================
function Game(params) {
  var utils = typeof params.utils === "object" ? params.utils : {};
  var interval, timeInterval;
  var aStar = params.aStar;
  var aStarBlock = [];
  var move = [];
  var ctx = document.querySelector("canvas").getContext("2d");
  var size = params.size;
  var blockSize = params.blockSize;
  var totalBlock = Math.floor(size / blockSize);
  var fps = params.fps;
  var snake = [[1, 0], [0, 0]];
  var direction = aStar ? false : 39;
  var food = [];
  var scoreEl = document.querySelector("#score");
  var score = 0;

  var eatedSound, gameOverSound;
  function setSound() {
    eatedSound = new Sound("sound/eated.mp3");
    gameOverSound = new Sound("sound/gameover.mp3");
  }

  function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = () => this.sound.play();
    this.stop = () => this.sound.pause();
  }

  function gameOver() {
    clearInterval(interval);
    clearInterval(timeInterval);
    gameOverSound.play();
  }

  function drawBoard() {
    ctx.canvas.width = ctx.canvas.height = size;
  }

  function drawGrid() {
    for (var x = 0; x < totalBlock; x++) {
      for (var y = 0; y < totalBlock; y++) {
        ctx.strokeStyle = "#DDD";
        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }

  function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockSize, blockSize);
  }

  function drawSnake() {
    for (var i = 1; i < snake.length; i++) {
      ctx.strokeStyle = "#DDD";
      ctx.strokeRect(snake[i][0] * blockSize, snake[i][1] * blockSize, blockSize, blockSize);
      drawRect(snake[i][0] * blockSize, snake[i][1] * blockSize, "#000");
    }
    drawRect(snake[0][0] * blockSize, snake[0][1] * blockSize, "green");
  }

  function randomFood() {
    food = [Math.floor(Math.random() * totalBlock), Math.floor(Math.random() * totalBlock)];
    snake.forEach(x => { if (x[0] === food[0] && x[1] === food[1]) randomFood(); });
  }

  function drawFood() {
    drawRect(food[0] * blockSize, food[1] * blockSize, "red");
  }

  function eated() {
    eatedSound.play();
    score += 1;
    scoreEl.innerHTML = score;
    snake.push(food);
  }

  function snakeMove() {
    document.onkeydown = function(e) {
      if (direction - e.keyCode !== 2 && direction - e.keyCode !== -2) direction = e.keyCode;
    }

    move = [snake[0][0], snake[0][1]];

    if (aStar) {
      if (aStarBlock[1] - move[0] === 1) direction = 39; // right
      else if (aStarBlock[1] - move[0] === -1) direction = 37; // left
      else if (aStarBlock[0] - move[1] === 1) direction = 40; // down
      else if (aStarBlock[0] - move[1] === -1) direction = 38; // up
    }

    switch (direction) {
      case 37: move[0] -= 1; break;
      case 38: move[1] -= 1; break;
      case 39: move[0] += 1; break;
      case 40: move[1] += 1; break;
    }

    if (move[0] < 0 || move[0] >= totalBlock || move[1] < 0 || move[1] >= totalBlock) gameOver();
    snake.forEach(x => { if (x[0] === move[0] && x[1] === move[1]) gameOver(); });
    if (move[0] === food[0] && move[1] === food[1]) { eated(); randomFood(); }
    snake.unshift(move);
    snake.pop();
  }

  // ============== IMPROVED A* =================
  function runAStar(snakePos) {
    var board = [];
    for (var y = 0; y < totalBlock; y++) {
      board[y] = [];
      for (var x = 0; x < totalBlock; x++) board[y][x] = 1;
    }
    for (var i = 0; i < snake.length - 1; i++) board[snake[i][1]][snake[i][0]] = 0;

    var graph = new Graph(board);
    var start = graph.grid[snakePos[1]][snakePos[0]];
    var end = graph.grid[food[1]][food[0]];
    var path = astar.search(graph, start, end);

    if (path.length > 0) {
      aStarBlock = [path[0].x, path[0].y];
    } else {
      // fallback to tail
      var tail = snake[snake.length - 1];
      var tailNode = graph.grid[tail[1]][tail[0]];
      var pathToTail = astar.search(graph, start, tailNode);
      if (pathToTail.length > 0) aStarBlock = [pathToTail[0].x, pathToTail[0].y];
      else {
        var neighbors = graph.neighbors(start).filter(n => !n.isWall());
        aStarBlock = neighbors.length > 0 ? [neighbors[0].x, neighbors[0].y] : [start.x, start.y];
      }
    }
  }

  // ================= INIT =================
  setSound();
  utils.showGrid && drawGrid();
  drawSnake();
  randomFood();
  drawFood();
  runAStar(snake[0]);
  var utilities = new Utils({ blockSize: blockSize });

  function update() {
    snakeMove();
    drawBoard();
    utils.showGrid && drawGrid();
    drawSnake();
    drawFood();
    utils.distance && utilities.distance(snake[0], food, "blue");
    utils.distanceCount && utilities.distanceCount(snake[0], food, "blue");
    utils.distancePerpendicular && utilities.distancePerpendicular(snake[0], [food[0], snake[0][1]], snake[0], [snake[0][0], food[1]], "blue");
    aStar && runAStar(move);
  }

  this.play = () => {
    interval = setInterval(update, 1000 / fps);
    timeInterval = setInterval(() => {
      var timeEl = document.querySelector("#time");
      timeEl.innerHTML = +timeEl.innerHTML + 1;
    }, 1000);
  }

  this.pause = () => {
    clearInterval(interval);
    clearInterval(timeInterval);
  }
}

// ================= ASTAR LIBRARY =================
(function(definition) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = definition();
  } else if (typeof define === 'function' && define.amd) {
    define([], definition);
  } else {
    var exports = definition();
    window.astar = exports.astar;
    window.Graph = exports.Graph;
  }
})(function() {
  function pathTo(node) {
    var curr = node;
    var path = [];
    while (curr.parent) { path.unshift(curr); curr = curr.parent; }
    return path;
  }

  function getHeap() {
    return new BinaryHeap(function(node){ return node.f; });
  }

  var astar = {
    search: function(graph, start, end, options) {
      graph.cleanDirty();
      options = options || {};
      var heuristic = options.heuristic || astar.heuristics.manhattan;
      var openHeap = getHeap();
      var closestNode = start;
      var closedList = [];
      start.h = heuristic(start, end);
      openHeap.push(start);

      while(openHeap.size() > 0) {
        var currentNode = openHeap.pop();
        if(currentNode === end) {
          while(closedList.length>0) closedList.pop().closed=false;
          return pathTo(currentNode);
        }
        currentNode.closed = true;
        closedList.push(currentNode);
        var neighbors = graph.neighbors(currentNode);
        for(var i=0;i<neighbors.length;i++){
          var neighbor = neighbors[i];
          if(neighbor.closed || neighbor.isWall()) continue;
          var gScore = currentNode.g + neighbor.getCost(currentNode);
          var beenVisited = neighbor.visited;
          if(!beenVisited || gScore < neighbor.g){
            neighbor.visited = true;
            neighbor.parent = currentNode;
            neighbor.h = neighbor.h || heuristic(neighbor,end);
            neighbor.g = gScore;
            neighbor.f = neighbor.g + neighbor.h;
            graph.markDirty(neighbor);
            if(!beenVisited) openHeap.push(neighbor);
            else openHeap.rescoreElement(neighbor);
          }
        }
      }
      while(closedList.length>0) closedList.pop().closed=false;
      return [];
    },
    heuristics: {
      manhattan: function(pos0,pos1){ return Math.abs(pos1.x-pos0.x)+Math.abs(pos1.y-pos0.y); }
    },
    cleanNode: function(node){ node.f=0; node.g=0; node.h=0; node.visited=false; node.closed=false; node.parent=null; }
  };

  function Graph(gridIn, options){
    options = options||{};
    this.nodes = [];
    this.diagonal = !!options.diagonal;
    this.grid = [];
    for(var x=0;x<gridIn.length;x++){
      this.grid[x] = [];
      for(var y=0;y<gridIn[x].length;y++){
        var node = new GridNode(x,y,gridIn[x][y]);
        this.grid[x][y] = node;
        this.nodes.push(node);
      }
    }
    this.init();
  }

  Graph.prototype.init = function() {
    this.dirtyNodes=[];
    for(var i=0;i<this.nodes.length;i++) astar.cleanNode(this.nodes[i]);
  }

  Graph.prototype.cleanDirty = function() {
    for(var i=0;i<this.dirtyNodes.length;i++) astar.cleanNode(this.dirtyNodes[i]);
    this.dirtyNodes=[];
  }

  Graph.prototype.markDirty = function(node) { this.dirtyNodes.push(node); }

  Graph.prototype.neighbors = function(node){
    var ret=[];
    var x=node.x, y=node.y, grid=this.grid;
    if(grid[x-1] && grid[x-1][y]) ret.push(grid[x-1][y]);
    if(grid[x+1] && grid[x+1][y]) ret.push(grid[x+1][y]);
    if(grid[x][y-1]) ret.push(grid[x][y-1]);
    if(grid[x][y+1]) ret.push(grid[x][y+1]);
    if(this.diagonal){
      if(grid[x-1] && grid[x-1][y-1]) ret.push(grid[x-1][y-1]);
      if(grid[x+1] && grid[x+1][y-1]) ret.push(grid[x+1][y-1]);
      if(grid[x-1] && grid[x-1][y+1]) ret.push(grid[x-1][y+1]);
      if(grid[x+1] && grid[x+1][y+1]) ret.push(grid[x+1][y+1]);
    }
    return ret;
  };

  function GridNode(x,y,weight){ this.x=x; this.y=y; this.weight=weight; }
  GridNode.prototype.getCost = function(fromNeighbor){ return (fromNeighbor && fromNeighbor.x!=this.x && fromNeighbor.y!=this.y)?this.weight*1.41421:this.weight; }
  GridNode.prototype.isWall = function(){ return this.weight===0; }

  function BinaryHeap(scoreFunction){ this.content=[]; this.scoreFunction=scoreFunction; }
  BinaryHeap.prototype = {
    push: function(e){ this.content.push(e); this.sinkDown(this.content.length-1); },
    pop: function(){ var result=this.content[0]; var end=this.content.pop(); if(this.content.length>0){this.content[0]=end; this.bubbleUp(0);} return result; },
    remove: function(node){ var i=this.content.indexOf(node); var end=this.content.pop(); if(i!==this.content.length){this.content[i]=end; if(this.scoreFunction(end)<this.scoreFunction(node)) this.sinkDown(i); else this.bubbleUp(i); } },
    size: function(){ return this.content.length; },
    rescoreElement: function(node){ this.sinkDown(this.content.indexOf(node)); },
    sinkDown: function(n){ var element=this.content[n]; while(n>0){ var parentN=((n+1)>>1)-1; var parent=this.content[parentN]; if(this.scoreFunction(element)<this.scoreFunction(parent)){ this.content[parentN]=element; this.content[n]=parent; n=parentN;} else break; } },
    bubbleUp: function(n){ var length=this.content.length; var element=this.content[n]; var elemScore=this.scoreFunction(element); while(true){ var child2N=(n+1)<<1; var child1N=child2N-1; var swap=null; if(child1N<length){ var child1=this.content[child1N]; if(this.scoreFunction(child1)<elemScore) swap=child1N;} if(child2N<length){ var child2=this.content[child2N]; if(this.scoreFunction(child2)<(swap===null?elemScore:this.scoreFunction(this.content[swap]))) swap=child2N;} if(swap!==null){ this.content[n]=this.content[swap]; this.content[swap]=element; n=swap; }else break;} }
  };

  return { astar: astar, Graph: Graph };
});
