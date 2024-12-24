let canvas = document.getElementById("scratch");
let context = canvas.getContext("2d");

const init = () => {
  // Create Christmas pattern
  let gradientColor = context.createLinearGradient(0, 0, 135, 135);
  gradientColor.addColorStop(0, "#D42426");  // Christmas red
  gradientColor.addColorStop(0.5, "#F4B81A"); // Gold
  gradientColor.addColorStop(1, "#165B33");   // Christmas green

  context.fillStyle = gradientColor;
  context.fillRect(0, 0, 200, 200);

  // Add some festive patterns
  for(let i = 0; i < 10; i++) {
    drawSnowflake(
      Math.random() * 200,
      Math.random() * 200,
      Math.random() * 10 + 5
    );
  }
};

const drawSnowflake = (x, y, size) => {
  context.save();
  context.translate(x, y);
  context.fillStyle = "rgba(255, 255, 255, 0.3)";

  for(let i = 0; i < 6; i++) {
    context.rotate(Math.PI / 3);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(size, 0);
    context.lineTo(size * 0.7, size * 0.2);
    context.closePath();
    context.fill();
  }
  context.restore();
};

//initially mouse X and mouse Y positions are 0
let mouseX = 0;
let mouseY = 0;
let isDragged = false;

//Events for touch and mouse
let events = {
  mouse: {
    down: "mousedown",
    move: "mousemove",
    up: "mouseup",
  },
  touch: {
    down: "touchstart",
    move: "touchmove",
    up: "touchend",
  },
};

let deviceType = "";

//Detect touch device
const isTouchDevice = () => {
  try {
    document.createEvent("TouchEvent");
    deviceType = "touch";
    return true;
  } catch (e) {
    deviceType = "mouse";
    return false;
  }
};

//Get left and top of canvas
let rectLeft = canvas.getBoundingClientRect().left;
let rectTop = canvas.getBoundingClientRect().top;

//Exact x and y position of mouse/touch
const getXY = (e) => {
  mouseX = (!isTouchDevice() ? e.pageX : e.touches[0].pageX) - rectLeft;
  mouseY = (!isTouchDevice() ? e.pageY : e.touches[0].pageY) - rectTop;
};

isTouchDevice();

//Start Scratch
canvas.addEventListener(events[deviceType].down, (event) => {
  isDragged = true;
  getXY(event);
  scratch(mouseX, mouseY);
});

//mousemove/touchmove
canvas.addEventListener(events[deviceType].move, (event) => {
  if (!isTouchDevice()) {
    event.preventDefault();
  }
  if (isDragged) {
    getXY(event);
    scratch(mouseX, mouseY);
  }
});

//stop drawing
canvas.addEventListener(events[deviceType].up, () => {
  isDragged = false;
});

//If mouse leaves the square
canvas.addEventListener("mouseleave", () => {
  isDragged = false;
});

const scratch = (x, y) => {
  context.globalCompositeOperation = "destination-out";
  context.beginPath();
  context.arc(x, y, 12, 0, 2 * Math.PI);
  context.fill();
};

window.onload = init();