"use strict;";

//TODONEXT:
//TODO: finish frontier
//TODO: maybe add frontier viz(nodes in queue)
//FIXME: add basic minimalist UI

//TODO: add stats on html display (quick inspi from video?)
//TODO: maze generating
//FIXME: add minesweeper bomb pixel (to be évité by weighted algos)
//TODO: add weighted node (mud or sth) : pressing while painting for weighted algos : + (for unweighted, just replace by normal obstacles before running)

//TODO: notif system useful for alert (need end&start !) / what key you pressed àlamacos..;
//TODO: add simple button to randomly fill maze grid
//TODO: add comparison two algos parallel
//XTRAFEATS:
//TODO: save cell size and speed in localstorage
//TODO: add nice sleek scrollbar
//TODO: block controls when algoviz start
//TODO: animate clear grid button - unlocks back controls
//TODO: make cancel button inplace of start button when algoviz started
//TODO: fix bugs in input state variables when alt-tabbing from the window
//TODO: add current mouse pos+selected cell type hover highlight on grid ???

// PRIO !!!!
//FIXME: prepare report
//TODO: add html short descriptions of algos with main pros & cons
//FIXME: clearing path causes 1fois/2 no path viz (not for a* tho ?
//FIXME: clearPath + restart algo (V+space) quick causes no path visualized ?

//TODOEND:
//FIXME: add controls explanation
//TODO: add stats panel for UI html
//TODO: html validate
//TODO: check "use strict;"; all js files

import { CellType } from "./Pixel.js";
import { Grid } from "./Grid.js";
import { reconstructPath, sleep, bfsdfs, dijkstra, astar } from "./algorithms.js";
import { TrailBits } from "./js/TrailBits.js";

export { startRadio, endRadio, plainResize };

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
const getCellSize = () => cellSizeSlider.value;
cellSizeSlider.addEventListener("change", () => grid.setPixelSize(getCellSize()));

const algoSpeedSlider = document.querySelector('.control-panel>div>input[name="algo_speed"]');
const getAlgoSpeed = () => algoSpeedSlider.value;
algoSpeedSlider.addEventListener("change", () => (grid.algoSpeed = getAlgoSpeed()));

const getSelectedAlgo = () => document.querySelector(".control-panel>select#algorithm").value;

/* -------------------------------------------------------------------------- */
/*                                  Main code                                 */
/* -------------------------------------------------------------------------- */

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
// arbitrary size, real size computed by handleResize() in init()
const grid = new Grid(canvas, 32, 32, getCellSize());

let isMouseDown = false,
    isShiftDown = false;

init();

function init() {
    initEvents();
    plainResize();
    mainLoop();
}

function mainLoop() {
    // background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillStyle = "rgba(58, 18, 153,0.5)";
    // ctx.fillStyle = "rgba(1, 33, 105,0.1)";
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
    if (e.type === "keydown" && e.key === " ") {
        // check ready for algo
        if (!grid.startPixel || !grid.endPixel) {
            alert("need to set start & end");
            return;
        }

        const algo = getSelectedAlgo();
        startPathfinding(algo);
    }
}

const lerp = (a, b, progress) => (1 - progress) * a + progress * b;

async function startPathfinding(algo) {
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

        // paint path pixels
        // for (const pixel of path) {
        //     pixel.type = CellType.PATH;
        // }

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

        console.log("total visited nodes:", visited.length);
        console.log("path length:", path.length + 2); // count start & end too
        console.log("algoRes:", algoResults);
    }
}
