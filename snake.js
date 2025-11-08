/*
Blue Snake with optional AI
*/

const cvs = document.getElementById("snake");
const ctx = cvs.getContext("2d");

// create the unit
const box = 32;

// load images
const ground = new Image();
ground.src = "img/ground.png";

const foodImg = new Image();
foodImg.src = "img/food.png";

// load audio
let dead = new Audio("audio/dead.mp3");
let eat = new Audio("audio/eat.mp3");
let up = new Audio("audio/up.mp3");
let right = new Audio("audio/right.mp3");
let left = new Audio("audio/left.mp3");
let down = new Audio("audio/down.mp3");

// snake
let snake = [];
snake[0] = { x: 9 * box, y: 10 * box };

// food
let food = {
    x: Math.floor(Math.random() * 17 + 1) * box,
    y: Math.floor(Math.random() * 15 + 3) * box
};

// score
let score = 0;

// direction
let d = "RIGHT";
let aiDirection = "RIGHT";

// AI checkbox
const useAI = document.getElementById("useAI");

// keyboard control
document.addEventListener("keydown", direction);
function direction(event) {
    if (useAI.checked) return; // ignore manual control when AI is on
    let key = event.keyCode;
    if (key == 37 && d != "RIGHT") { d = "LEFT"; left.play(); }
    else if (key == 38 && d != "DOWN") { d = "UP"; up.play(); }
    else if (key == 39 && d != "LEFT") { d = "RIGHT"; right.play(); }
    else if (key == 40 && d != "UP") { d = "DOWN"; down.play(); }
}

// collision detection
function collision(head, array) {
    return array.some(segment => head.x === segment.x && head.y === segment.y);
}

// AI function
function getAIMove() {
    if (!useAI.checked) return d;

    let head = snake[0];
    let moves = [];

    // valid moves
    if (head.x - box > 0 && !collision({ x: head.x - box, y: head.y }, snake)) moves.push("LEFT");
    if (head.x + box < 18 * box && !collision({ x: head.x + box, y: head.y }, snake)) moves.push("RIGHT");
    if (head.y - box > 3 * box && !collision({ x: head.x, y: head.y - box }, snake)) moves.push("UP");
    if (head.y + box < 18 * box && !collision({ x: head.x, y: head.y + box }, snake)) moves.push("DOWN");

    // choose closest to food
    moves.sort((a, b) => distanceToFood(a) - distanceToFood(b));
    return moves[0] || d;
}

// Manhattan distance to food
function distanceToFood(direction) {
    let head = snake[0];
    let nx = head.x, ny = head.y;
    if (direction === "LEFT") nx -= box;
    if (direction === "RIGHT") nx += box;
    if (direction === "UP") ny -= box;
    if (direction === "DOWN") ny += box;
    return Math.abs(nx - food.x) + Math.abs(ny - food.y);
}

// draw everything
function draw() {
    ctx.drawImage(ground, 0, 0);

    // draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "blue" : "lightblue";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "darkblue";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    // draw food
    ctx.drawImage(foodImg, food.x, food.y);

    // AI decision
    aiDirection = getAIMove();
    d = aiDirection;

    // old head position
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // move
    if (d === "LEFT") snakeX -= box;
    if (d === "RIGHT") snakeX += box;
    if (d === "UP") snakeY -= box;
    if (d === "DOWN") snakeY += box;

    // eat food
    if (snakeX === food.x && snakeY === food.y) {
        score++;
        eat.play();
        food = {
            x: Math.floor(Math.random() * 17 + 1) * box,
            y: Math.floor(Math.random() * 15 + 3) * box
        };
    } else {
        snake.pop(); // remove tail
    }

    // new head
    let newHead = { x: snakeX, y: snakeY };

    // game over
    if (snakeX < box || snakeX > 17 * box || snakeY < 3 * box || snakeY > 17 * box || collision(newHead, snake)) {
        clearInterval(game);
        dead.play();
    }

    snake.unshift(newHead);

    // draw score
    ctx.fillStyle = "black";
    ctx.font = "45px Changa one";
    ctx.fillText(score, 2 * box, 1.6 * box);
}

// slower speed for AI
let game = setInterval(draw, 150);
