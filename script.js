"use strict;";

import { CellType } from "./assets/js/Pixel.js";
import { Grid } from "./assets/js/Grid.js";
import { reconstructPath, sleep, bfsdfs, dijkstra, astar } from "./assets/js/algorithms.js";
import { TrailBits } from "./assets/js/TrailBits.js";

export { startRadio, endRadio, plainResize };

/* -------------------------------------------------------------------------- */
/*                                  Controls                                  */
/* -------------------------------------------------------------------------- */

const startRadio = document.querySelector('.control__panel>div>input[name="cell_type"]#start');
const endRadio = document.querySelector('.control__panel>div>input[name="cell_type"]#end');
const getCellTypeActiveRadio = () => document.querySelector('.control__panel>div>input[name="cell_type"]:checked');

document
    .getElementById("btn_clear_grid") //
    .addEventListener("click", () => grid.clearGrid());

document
    .getElementById("btn_clear_path") //
    .addEventListener("click", () => grid.clearPath());

document
    .getElementById("btn_start_pathfinding") //
    .addEventListener("click", () => startPathfinding());

const cellSizeSlider = document.querySelector('.control__panel>div>input[name="cell_size"]');
const getPixelSize = () => cellSizeSlider.value;
cellSizeSlider.addEventListener("change", () => grid.setPixelSize(getPixelSize()));

const algoSpeedSlider = document.querySelector('.control__panel>div>input[name="algo_speed"]');
// convert to sleep interval
const getAlgoSpeed = () => 30 - algoSpeedSlider.value;
algoSpeedSlider.addEventListener("change", () => (grid.algoSpeed = getAlgoSpeed()));

const algoCard = document.getElementById("algorithm__card");

const algoSelectDropdown = document.querySelector(".control__panel>select#algorithm");
const getSelectedAlgo = () => algoSelectDropdown.value;
const updateAlgoCard = () => {
    const cardElements = algoCard.children;
    [...cardElements].forEach((e) => (e.style.display = "none"));
    algoCard.children[getSelectedAlgo()].style.display = "flex";
};
algoSelectDropdown.addEventListener("change", () => updateAlgoCard());

/* ------------------------------ Info display ------------------------------ */

const infoDisplayEl = document.getElementById("info__display");
const clearInfoDisplay = () => (infoDisplayEl.innerHTML = "");
const showInfoMsg = (m, error = false) => {
    const p = document.createElement("p");
    p.style.color = error ? "red" : "white";
    p.textContent = m;
    infoDisplayEl.appendChild(p);

    p.style.animation = "fade-text linear 1s forwards";
    p.style.animationDelay = "9000ms";
    setTimeout(() => infoDisplayEl.removeChild(p), 10000);
};
const showErrorMsg = (m) => showInfoMsg(m, true);

/* -------------------------------------------------------------------------- */
/*                                  Main code                                 */
/* -------------------------------------------------------------------------- */

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
// arbitrary size, real size computed by handleResize() in init()
const grid = new Grid(canvas, 32, 32, getPixelSize());

let isMouseDown = false,
    isShiftDown = false;

init();

function init() {
    // fix for the fact that firefox saves the last selected item on reload
    updateAlgoCard();
    initEvents();
    plainResize();
    mainLoop();
}

function mainLoop() {
    // background
    ctx.fillStyle = "rgba(58, 18, 153,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.draw();
    requestAnimationFrame(mainLoop);
}

function initEvents() {
    canvas.addEventListener("mouseleave", () => (isMouseDown = false)); // fixes some bugs
    window.addEventListener("resize", handleResizeDebounced);

    ["keydown", "keyup"] //
        .forEach((e) => window.addEventListener(e, handleKeys));

    ["mousedown", "mouseup", "mousemove"] //
        .forEach((e) => window.addEventListener(e, handleMouse));

    window.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // disable right click context menu
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

function plainResize() {
    const canvasContainerR = document.querySelector(".canvas__container").getBoundingClientRect();
    let wantedH = Math.floor(canvasContainerR.height);
    let wantedW = Math.floor(canvasContainerR.width);

    // make grid look nice (no unfinished grid cells)
    const pixelSize = getPixelSize();
    let fixedH = wantedH - (wantedH % pixelSize);
    let fixedW = wantedW - (wantedW % pixelSize);

    canvas.height = fixedH;
    canvas.width = fixedW;
    const fillingBorderWidth = `${Math.abs(canvas.width - canvasContainerR.width) / 2}px`;
    const fillingBorderHeight = `${Math.abs(canvas.height - canvasContainerR.height) / 2}px`;
    canvas.style.borderLeftWidth = fillingBorderWidth;
    canvas.style.borderRightWidth = fillingBorderWidth;
    canvas.style.borderTopWidth = fillingBorderHeight;
    canvas.style.borderBottomWidth = fillingBorderHeight;

    let rows = Math.floor(canvas.height / pixelSize);
    let cols = Math.floor(canvas.width / pixelSize);

    grid.setGridSize(rows, cols);
}

/* -------------------------------------------------------------------------- */
/*                               Input handlers                               */
/* -------------------------------------------------------------------------- */

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
    } //
    else if (radioType === CellType.END) {
        if (!grid.endPixel) grid.setEnd(currentPixel);
    } //
    else {
        currentPixel.type = radioType;
    }
}

function handleKeys(e) {
    isShiftDown = e.type === "keydown" && e.key === "Shift";

    if (e.type === "keydown" && e.key.toLowerCase() === "c") grid.clearGrid();
    if (e.type === "keydown" && e.key.toLowerCase() === "v") grid.clearPath();

    // skip if pathfinding still running
    if (grid.runningPathfinding) return;

    // algo
    if (e.type === "keydown" && e.key === " ") startPathfinding();
}

const lerp = (a, b, progress) => (1 - progress) * a + progress * b;

async function startPathfinding() {
    clearInfoDisplay();

    // check ready for algo
    if (!grid.startPixel || !grid.endPixel) {
        showErrorMsg("You need to have a starting point and an ending point at the least !");
        return;
    }

    const algo = getSelectedAlgo();
    grid.algoSpeed = getAlgoSpeed();

    let algoResults = null;
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
        case "astar":
            algoResults = await astar(grid);
            break;
        default:
            grid.runningPathfinding = false;
            console.log("[handleKeys::switch(algo)]: requested unimplemented algo !");
            break;
    }

    // restore start & end overwritten by algo for proper visualization
    if (grid.startPixel) grid.startPixel.type = CellType.START;
    if (grid.endPixel) grid.endPixel.type = CellType.END;

    //TODO: replace by notif on html
    if (!algoResults) {
        alert("no path found");
        return;
    }
    const [found, visited] = algoResults;

    if (found) {
        const path = reconstructPath(grid);

        // summon trail effect along path
        for (let i = 0; i < path.length - 1; i++) {
            // stop trail animation on clear
            if (!grid.runningPathfinding) return;
            const first = path[i];
            var second = path[i + 1];

            // interpolate bits positions to get consistent trail + adjusted for size
            for (let p = 0; p <= 1; p += grid.pixelSize / 80) {
                let nowx = lerp(first.windowX, second.windowX, p),
                    nowy = lerp(first.windowY, second.windowY, p);
                TrailBits.spawnBitAtPos({ x: nowx, y: nowy }, grid.pixelSize);

                // makes trail go faster for longer paths
                const consistentTrailSpeed = Math.floor(Math.min(10, 30 / Math.sqrt(path.length)));
                await sleep(consistentTrailSpeed);
            }
            first.type = CellType.PATH;
        }

        showInfoMsg(`Path found !`);
        showInfoMsg(`Path length: ${path.length + 2}`); // count start & end too
        showInfoMsg(`Total visited nodes: ${visited.length}`);
    }
}
