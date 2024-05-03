"use strict;"
const GRID_SIZE = 42; // maybe use dict if conflict 


const pixelArray = []
const canvas = document.getElementById('here');
const ctx = canvas.getContext("2d");
init();

function init() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  ySize = canvas.height / GRID_SIZE
  xSize = canvas.width / GRID_SIZE
  for (let y = 0; y <= ySize; y++) {
    pixelArray.push([])
    for (let x = 0; x <= xSize; x++) {
      pixelArray[y].push(0)
    }
  }

  window.addEventListener('mousemove', handleMouse, false);

  window.addEventListener('resize', handleResize, false);
  handleResize(canvas, ctx);
}

function draw() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < pixelArray.length; y++) {
    for (let x = 0; x < pixelArray[0].length; x++) {
      console.log(pixelArray[0][0])
      drawGridUnit(ctx, x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, pixelArray[y][x])
    }
  }

  console.log(pixelArray)

}

function handleMouse(e) {
  pixelArray[0][1]=1

  // console.log(e.clientX, e.clientY)
  // console.log(e.offsetX, e.offsetY)
  let r = canvas.getBoundingClientRect();
  let insideCanvasMouseX = e.clientX - r.left;
  let insideCanvasMouseY = e.clientY - r.top;

  if (insideCanvasMouseX < 0 || insideCanvasMouseX > r.width) {
    insideCanvasMouseX = -1;
  }
  if (insideCanvasMouseY < 0 || insideCanvasMouseY > r.height) {
    insideCanvasMouseY = -1;
  }
  console.log(insideCanvasMouseX, insideCanvasMouseY)
}

function drawGridUnit(ctx, x, y, size, state) {
  // separate function should allow for easy rendering customization
  if (state === 1) {
    ctx.fillStyle = 'black';
    ctx.fillRect(x+2, y+2, x + size, y + size);
  } else {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = '2';
    ctx.strokeRect(x+2, y+2, x + size, y + size);
  }
}

function handleResize(canvas, ctx) {
  // make grid look nice (no unfinished grid cells)
  let wantedW = window.innerWidth * 2 / 3;
  let wantedH = window.innerHeight * 2 / 3;

  // +3 allows to see full border lines of last row and last col grid cells
  let fixedW = wantedW - (wantedW % GRID_SIZE) + 3;
  let fixedH = wantedH - (wantedH % GRID_SIZE) + 3;
  
  canvas.width = fixedW;
  canvas.height = fixedH;

  // canvas.width = 400;
  // canvas.height = 200;
  draw(canvas, ctx);
}

requestAnimationFrame(draw)