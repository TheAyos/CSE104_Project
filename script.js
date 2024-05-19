"use strict;";

// TODO: block controls when algoviz start
// TODO: animate clear grid button - unlocks back controls
// TODO: make cancel button inplace of start button when algoviz started
// TODO: fix bugs in input state variables when alt-tabbing from the window
// TODO: add current mouse pos+selected cell type hover highlight on grid ???
// TODO: maybe add frontier viz(nodes in queue)

import { CellType } from "./Cell.js";
import { Grid } from "./Grid.js";
import { bfsdfs, dijkstra } from "./algorithms.js";

let isMouseDown = false;
let isShiftDown = false;

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

export { startRadio, endRadio };

// Controls setup
const startRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#start');
const endRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#end');
const getCellTypeActiveRadio = () => document.querySelector('.control-panel>div>input[name="cell_type"]:checked');

const clearGridBtn = document.getElementById("btn_clear_grid");
clearGridBtn.addEventListener("click", () => grid.clearGrid());

const clearPathBtn = document.getElementById("btn_clear_path");
clearPathBtn.addEventListener("click", () => grid.clearPath());

const cellSizeSlider = document.querySelector('.control-panel>div>input[name="cell_size"]');
cellSizeSlider.addEventListener("change", () => grid.setPixelSize(getCellSize()));
// cellSizeSlider.addEventListener("input", () => grid.setPixelSize(getCellSize())); // changes as the mouse slides, not ideal
const getCellSize = () => cellSizeSlider.value;

const algoSpeedSlider = document.querySelector('.control-panel>div>input[name="algo_speed"]');
algoSpeedSlider.addEventListener("change", () => (grid.algoSpeed = algoSpeedSlider.value));

const algoDropdown = document.querySelector(".control-panel>select");
const getSelectedAlgo = () => algoDropdown.value;

// arbitrary size, real size computed by handleResize() in init()
const grid = new Grid(canvas, 32, 32, getCellSize());

init();

function mainDraw() {
    // background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.draw();
    requestAnimationFrame(mainDraw);
}

function init() {
    handleResize();

    initEvents();

    mainDraw();
}

function initEvents() {
    window.addEventListener("resize", debouncedResize);

    window.addEventListener("mouseup", handleMouse);
    window.addEventListener("mousedown", handleMouse);
    window.addEventListener("mousemove", handleMouse);
    // disable right click context menu
    window.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });

    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeys);
}

let resizeTimeout;

function debouncedResize() {
    // don't start resizing grid until user has stopped resizing window
    // eliminates lag during resizing
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 25);
}

function handleResize() {
    let wantedH = window.innerHeight * 0.8;
    let wantedW = window.innerWidth * 0.8;

    // make grid look nice (no unfinished grid cells)
    const divWidth = getCellSize();
    let fixedH = wantedH - (wantedH % divWidth);
    let fixedW = wantedW - (wantedW % divWidth);

    canvas.height = fixedH;
    canvas.width = fixedW;

    let rows = Math.floor(canvas.height / divWidth);
    let cols = Math.floor(canvas.width / divWidth);

    console.log(canvas.height / divWidth, canvas.height, rows * divWidth);

    grid.setGridSize(rows, cols);
}

async function handleKeys(e) {
    isShiftDown = e.type === "keydown" && e.key === "Shift";

    if (e.type === "keydown" && e.key.toLowerCase() === "c") grid.clearGrid();
    if (e.type === "keydown" && e.key.toLowerCase() === "v") grid.clearPath();

    // skip if pathfinding still running
    if (grid.runningPathfinding) return;

    // start algo
    if (e.type === "keydown" && e.key === " ") {
        const algo = getSelectedAlgo();
        let algoResults;
        grid.runningPathfinding = true;

        switch (algo) {
            case "bfs":
                algoResults = await bfsdfs(grid, false);
                break;

            case "dfs":
                algoResults = await bfsdfs(grid, true);
                break;

            case "dijkstra":
                algoResults = await dijkstra(grid);
                break;
            default:
                alert("Not implemented yet !");
                break;
        }

        console.log("algo found ?", algoResults);
        console.log(grid.rows, grid.cols);
    }
}

function handleMouse(e) {
    // skip if pathfinding still running
    if (grid.runningPathfinding) return;

    // update state variables
    if (e.type === "mousedown") isMouseDown = true;
    else if (e.type === "mouseup") isMouseDown = false;

    if (!isMouseDown) return;

    const currentPixel = grid.getPixelFromWindowCoords(e.clientX, e.clientY);

    // mouse out of grid
    if (!currentPixel) return;

    // unpaint cells on shift & return
    if (isShiftDown) {
        grid.setFree(currentPixel);
        return;
    }

    // paint cells
    // do not override start and end
    if (currentPixel.type === CellType.START || currentPixel.type === CellType.END) return;

    const radioType = getCellTypeActiveRadio().value;

    if (radioType === CellType.START) {
        if (!grid.startPixel) grid.setStart(currentPixel);
    } else if (radioType === CellType.END) {
        if (!grid.endPixel) grid.setEnd(currentPixel);
    } else {
        currentPixel.type = radioType;
    }
}
