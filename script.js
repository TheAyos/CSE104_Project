"use strict;";

import { initGrid, drawGridUnit, bfs } from "./helper.js";

const MIN_CELL_SIZE = 20; // used to create array representing the cells (chose constant size for performance reasons)
let cellSize = 42; // maybe use dict if conflict

//TODO: fix bugs in input state variables when alt-tabbing from the window

// TODO: refactor later into obj
let isMouseDown = false;
let isShiftDown = false;

let isStartSet = false;
let isEndSet = false;

// const state = {
//   isMouseDown: false,
//   isShiftDown: false,

//   isStartSet: false,
//   isEndSet: false,
// };

let pixelArray = [];
// matrix : level 1 is y
//          level 2 is x
// at [y][x] contains {type: /"obstacle", "free", "start", "finish"/}

const canvas = document.getElementById("here");
const ctx = canvas.getContext("2d");

const startRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#start');
const endRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#end');
const clearBtn = document.getElementById("btn_clear_grid");

const getActiveRadio = () => document.querySelector('.control-panel>div>input[name="cell_type"]:checked');
const getCellSize = () => document.querySelector('.control-panel>div>input[name="cell_size"]').value;

init();

function init() {
    handleResize();

    initControls();
    pixelArray = initGrid(pixelArray, canvas, MIN_CELL_SIZE);
    initEvents();

    draw();
}

function initControls() {
    // reset control panel state
    isStartSet = false;
    startRadio.disabled = false;
    startRadio.checked = true;

    endRadio.disabled = false;
    isEndSet = false;
}

function clearGrid() {
    initControls();
    pixelArray = initGrid(pixelArray, canvas, MIN_CELL_SIZE);
}

function initEvents() {
    window.addEventListener("resize", handleResize, false);

    window.addEventListener("mouseup", handleMouse, false);
    window.addEventListener("mousedown", handleMouse, false);
    window.addEventListener("mousemove", handleMouse, false);
    // disable right click context menu
    window.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });

    window.addEventListener("keydown", handleKeys, false);
    window.addEventListener("keyup", handleKeys, false);

    clearBtn.addEventListener("click", clearGrid);
}

function handleResize() {
    // make grid look nice (no unfinished grid cells)
    let wantedW = (window.innerWidth * 3) / 4;
    let wantedH = (window.innerHeight * 3) / 4;

    let fixedW = wantedW - (wantedW % cellSize);
    let fixedH = wantedH - (wantedH % cellSize);

    canvas.width = fixedW;
    canvas.height = fixedH;
}

function handleKeys(e) {
    isShiftDown = e.type === "keydown" && e.key === "Shift";

    if (e.type === "keydown" && e.key === "c") clearGrid();

    if (e.type === "keydown" && e.key === " ") {
        // TODO: OOP Pixels class with methods like getStartCell() ... !!!!
        let startX = -1;
        let startY = -1;
        console.log(pixelArray, startX);
        for (let y = 0; y < pixelArray.length; y++) {
            for (let x = 0; x < pixelArray[0].length; x++) {
                console.log(y, x);
                if (pixelArray[y][x].type === "start") {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (startX !== -1) break;
        }

        console.log("fini !, j'ai:", startX, startY);

        bfs(pixelArray, startX, startY);
    }
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

function getPixelFromWindowCoords(x, y) {
    // window-to-canvas coordinate mapping
    const r = canvas.getBoundingClientRect();
    let insideCanvasMouseX = x - r.left;
    let insideCanvasMouseY = y - r.top;
    // do nothing if mouse outside of canvas ??? is it the behaviour i want ?
    if (insideCanvasMouseX < 0 || insideCanvasMouseX > r.width) insideCanvasMouseX = undefined;
    if (insideCanvasMouseY < 0 || insideCanvasMouseY > r.height) insideCanvasMouseY = undefined;

    if (insideCanvasMouseX !== undefined && insideCanvasMouseY !== undefined) {
        const cellIndexY = Math.floor(insideCanvasMouseY / cellSize);
        const cellIndexX = Math.floor(insideCanvasMouseX / cellSize);
        const currentPixel = pixelArray[cellIndexY][cellIndexX];
        return currentPixel;
    } else {
        return undefined;
    }
}

function handleMouse(e) {
    if (e.type === "mousedown") {
        isMouseDown = true;
    } else if (e.type === "mouseup") {
        isMouseDown = false;
    }

    if (!isMouseDown) return;

    const currentPixel = getPixelFromWindowCoords(e.clientX, e.clientY);
    if (!currentPixel) return; // mouse out of grid

    if (isShiftDown) {
        if (currentPixel.type === "start") {
            isStartSet = false;
            startRadio.disabled = false;
        } else if (currentPixel.type === "end") {
            isEndSet = false;
            endRadio.disabled = false;
        }
        currentPixel.type = "free";
        return;
    }

    if (currentPixel.type === "start" || currentPixel.type === "end") return; // do not override start and end

    const radioType = getActiveRadio().value;

    // paint cell type
    if (radioType === "start") {
        if (!isStartSet) {
            currentPixel.type = radioType;
            isStartSet = true;
            startRadio.disabled = true;
            // WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
            document.querySelectorAll('.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)')[0].checked = true;
        }
    } else if (radioType === "end") {
        if (!isEndSet) {
            currentPixel.type = radioType;
            isEndSet = true;
            endRadio.disabled = true;
            // WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
            document.querySelectorAll('.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)')[0].checked = true;
        }
    } else {
        currentPixel.type = radioType;
        return;
    }
}
