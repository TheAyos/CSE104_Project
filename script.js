"use strict;";

const MIN_CELL_SIZE = 20; // used to create array representing the cells (chose constant size for performance reasons)

let cellSize = 42; // maybe use dict if conflict

//TODO: fix bugs in input state variables when alt-tabbing from the window

// TODO: refactor later into obj
let isMouseDown = false;
let isShiftDown = false;

let isStartSet = false;
let isEndSet = false;

let pixelArray = [];
// matrix : level 1 is y
//          level 2 is x
// at [y][x] contains {type: /"obstacle", "free", "start", "finish"/}

const canvas = document.getElementById("here");
const ctx = canvas.getContext("2d");

const startRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#start');
const endRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#end');

const getActiveRadio = () => document.querySelector('.control-panel>div>input[name="cell_type"]:checked');
const getCellSize = () => document.querySelector('.control-panel>div>input[name="cell_size"]').value;
init();

function init() {
  handleResize();

  initControls();
  initGrid();
  initEvents();

  draw();
}

function initControls() {
  // reset control panel state
  isStartSet = false;
  isEndSet = false;
  startRadio.disabled = false;
  endRadio.disabled = false;
  startRadio.checked = true;
}

function initGrid() {
  // (re)construct array
  pixelArray = [];
  ySize = canvas.height / MIN_CELL_SIZE;
  xSize = canvas.width / MIN_CELL_SIZE;
  for (let y = 0; y <= ySize; y++) {
    pixelArray.push([]);
    for (let x = 0; x <= xSize; x++) {
      pixelArray[y].push({ type: "free" });
    }
  }
}

function initEvents() {
  window.addEventListener("resize", handleResize, false);

  window.addEventListener("mouseup", handleMouse, false);
  window.addEventListener("mousedown", handleMouse, false);
  window.addEventListener("mousemove", handleMouse, false);

  window.addEventListener("keydown", handleKeys, false);
  window.addEventListener("keyup", handleKeys, false);
}

function draw() {
  // clear canvas
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < pixelArray.length; y++) {
    for (let x = 0; x < pixelArray[0].length; x++) {
      cellSize = getCellSize();
      drawGridUnit(ctx, x * cellSize, y * cellSize, cellSize, pixelArray[y][x].type);
    }
  }

  requestAnimationFrame(draw);
}

function drawGridUnit(ctx, x, y, size, state) {
  // separate function should allow for easy rendering customization
  ctx.beginPath();

  // draw grid
  ctx.strokeStyle = "black";
  ctx.lineWidth = "1";
  ctx.strokeRect(x, y, x + size, y + size);

  if (state !== "free") {
    if (state === "obstacle") {
      ctx.fillStyle = "rgba(0,0,255,0.3)";
    } else if (state === "start") {
      ctx.fillStyle = "rgba(0,255,0,0.3)";
    } else if (state === "end") {
      ctx.fillStyle = "rgba(255,0,0,0.3)";
    }
    ctx.fillRect(x, y, size, size);
  }
  ctx.closePath();
}

function handleMouse(e) {
  // window-to-canvas coordinate mapping
  const r = canvas.getBoundingClientRect();
  let insideCanvasMouseX = e.clientX - r.left;
  let insideCanvasMouseY = e.clientY - r.top;

  // do nothing if mouse outside of canvas ??? is it the behaviour i want ?
  if (insideCanvasMouseX < 0 || insideCanvasMouseX > r.width) insideCanvasMouseX = undefined;
  if (insideCanvasMouseY < 0 || insideCanvasMouseY > r.height) insideCanvasMouseY = undefined;

  // actual handling
  if (
    ((e.type === "mousemove" && isMouseDown) || e.type === "mousedown") &&
    insideCanvasMouseX !== undefined &&
    insideCanvasMouseY !== undefined
  ) {
    // console.log(insideCanvasMouseX, insideCanvasMouseY)

    cellIndexY = Math.floor(insideCanvasMouseY / cellSize);
    cellIndexX = Math.floor(insideCanvasMouseX / cellSize);
    // console.log(cellIndexY, cellIndexX)

    const currentPixel = pixelArray[cellIndexY][cellIndexX];

    if (isShiftDown) {
      console.log("shifting");
      if (currentPixel.type === "start") {
        isStartSet = false;
        startRadio.disabled = false;
      } else if (currentPixel.type === "end") {
        isEndSet = false;
        endRadio.disabled = false;
      }
      currentPixel.type = "free";
    }
    // do not override start and end
    else if (currentPixel.type !== "start" && currentPixel.type != "end") {
      console.log("not shifting");
      const type = getActiveRadio().value;
      if (type === "start") {
        if (!isStartSet) {
          currentPixel.type = type;
          isStartSet = true;
          startRadio.disabled = true;
          document.querySelectorAll(
            '.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)'
          )[0].checked = true; // WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
        }
      } else if (type === "end") {
        if (!isEndSet) {
          currentPixel.type = type;
          isEndSet = true;
          endRadio.disabled = true;
          document.querySelectorAll(
            '.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)'
          )[0].checked = true; // WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
        }
      } else {
        currentPixel.type = type;
      }
    }
  }

  if (e.type === "mousedown") {
    isMouseDown = true;
  } else if (e.type === "mouseup") {
    isMouseDown = false;
  }
}

function handleKeys(e) {
  // if (e.key === ) {

  // }
  isShiftDown = e.type === "keydown";
}

function handleResize() {
  // make grid look nice (no unfinished grid cells)
  let wantedW = (window.innerWidth * 2) / 3;
  let wantedH = (window.innerHeight * 2) / 3;

  // // // // +3 allows to see full border lines of last row and last col grid cells
  let fixedW = wantedW - (wantedW % cellSize);
  let fixedH = wantedH - (wantedH % cellSize);

  canvas.width = fixedW;
  canvas.height = fixedH;
}
