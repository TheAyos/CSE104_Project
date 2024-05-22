"use strict;";

// TODO: block controls when algoviz start
// TODO: animate clear grid button - unlocks back controls
// TODO: make cancel button inplace of start button when algoviz started
// TODO: fix bugs in input state variables when alt-tabbing from the window
// TODO: add current mouse pos+selected cell type hover highlight on grid ???
// TODO: maybe add frontier viz(nodes in queue)

// nicetodo:
// xtra, less prio:
// TODO: add weights with 12356 pressing while painting for weighted algos

/* -------------------------------------------------------------------------- */
/*                                  todo next                                 */
/* -------------------------------------------------------------------------- */
//TODO:
//TODO: add A*
//TODO: add stats on html display (quick inspi from video?)
//TODO: add noice trail effect on path reconstruction !
//TODO:
//TODO:
//TODO:
//TODO:
//TODOXTRAFEATS:
//TODO: add comparison two algos parallel
//TODO: add nice sleek scrollbar
//TODOEND:
//TODO: check using

import { CellType } from "./Pixel.js";
import { Grid } from "./Grid.js";
import { reconstructAndVisualizePath, bfsdfs, dijkstra } from "./algorithms.js";

export { startRadio, endRadio, plainResize as handleResize };

/* -------------------------------------------------------------------------- */
/*                               Controls setup                               */
/* -------------------------------------------------------------------------- */
const startRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#start');
const endRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#end');
const getCellTypeActiveRadio = () => document.querySelector('.control-panel>div>input[name="cell_type"]:checked');

document
    .getElementById("btn_clear_grid") //
    .addEventListener("click", () => grid.clearGrid());

document
    .getElementById("btn_clear_path") //
    .addEventListener("click", () => grid.clearPath());

const cellSizeSlider = document.querySelector('.control-panel>div>input[name="cell_size"]');
cellSizeSlider.addEventListener("change", () => grid.setPixelSize(getCellSize()));
const getCellSize = () => cellSizeSlider.value;

document
    .querySelector('.control-panel>div>input[name="algo_speed"]') //
    .addEventListener("change", (e) => (grid.algoSpeed = e.target.value));

const getSelectedAlgo = () => document.querySelector(".control-panel>select#algorithm").value;

/* -------------------------------------------------------------------------- */
/*                                  Main code                                 */
/* -------------------------------------------------------------------------- */
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
const grid = new Grid(canvas, 32, 32, getCellSize());

let isMouseDown = false,
    isShiftDown = false;
// arbitrary size, real size computed by handleResize() in init()

init();

function init() {
    initEvents();
    plainResize();
    mainLoop();
}

function mainLoop() {
    // background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.draw();
    requestAnimationFrame(mainLoop);
}

function initEvents() {
    window.addEventListener("resize", handleResizeDebounced);

    ["keydown", "keyup"] //
        .forEach((e) => window.addEventListener(e, handleKeys));

    ["mousedown", "mouseup", "mousemove"] //
        .forEach((e) => window.addEventListener(e, handleMouse));

    // disable right click context menu
    window.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });
}

let resizeTimeout;

function handleResizeDebounced() {
    // don't start resizing grid until user has stopped
    // resizing window to eliminate lag during resizing
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(plainResize, 25);
}

// FIXME: this changes canvas size !! need appropriate css to not look bad when resizing on pixelsize change
function plainResize() {
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
    // console.log(canvas.height / divWidth, canvas.height, rows * divWidth);
    grid.setGridSize(rows, cols);
}

async function handleKeys(e) {
    isShiftDown = e.type === "keydown" && e.key === "Shift";

    if (e.type === "keydown" && e.key.toLowerCase() === "c") grid.clearGrid();
    if (e.type === "keydown" && e.key.toLowerCase() === "v") grid.clearPath();

    // skip if pathfinding still running
    if (grid.runningPathfinding) return;

    // algo
    if (e.type === "keydown" && e.key === " ") {
        // check ready for algo
        if (!grid.startPixel || !grid.endPixel) {
            alert("need to set start & end");
        }
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
                grid.runningPathfinding = false;
                alert("Not implemented yet !");
                break;
        }

        // eslint-disable-next-line no-unused-vars
        const [found, visited] = algoResults;

        if (found) {
            // eslint-disable-next-line no-unused-vars
            const path = reconstructAndVisualizePath(grid);
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
