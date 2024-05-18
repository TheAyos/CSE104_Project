"use strict;";

const CellType = {
    FREE: "free",
    START: "start",
    END: "end",
    OBSTACLE: "obstacle",
    VISITED: "visited",
    PATH: "path",
};

CellType._COLORS = {
    // "free": "", // not needed, Cell.draw() just skips
    start: "rgba(0,255,0,0.3)",
    end: "rgba(255,0,0,0.3)",
    obstacle: "rgba(0,0,255,0.3)",
    visited: "rgba(166, 172, 175,0.3)",
    path: "rgba(212, 115, 212,0.3)",
};

export { CellType };

// import { initGrid, drawGridUnit, bfs } from "./helper.js";
import { bfs } from "./algorithms.js";

// const MIN_CELL_SIZE = 20; // used to create array representing the cells (chose constant size for performance reasons)
// let cellSize = 42; // maybe use dict if conflict

//TODO: fix bugs in input state variables when alt-tabbing from the window

let isMouseDown = false;
let isShiftDown = false;

let isStartSet = false;
let isEndSet = false;

// matrix : level 1 is y
//          level 2 is x
// at [y][x] contains {type: /CellType.OBSTACLE, CellType.FREE, CellType.START, "finish"/}

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

const startRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#start');
const endRadio = document.querySelector('.control-panel>div>input[name="cell_type"]#end');
const clearBtn = document.getElementById("btn_clear_grid");

const getActiveRadio = () => document.querySelector('.control-panel>div>input[name="cell_type"]:checked');

const cellSizeSlider = document.querySelector('.control-panel>div>input[name="cell_size"]');
const getCellSize = () => cellSizeSlider.value;

//TODO: add current mouse pos+selected cell type hover highlight on grid

class Cell {
    constructor(canvas, i, j, size, type = CellType.FREE) {
        this.ctx = canvas.getContext("2d");

        this.y = i * size; // row direction
        this.x = j * size; // column direction
        this.size = size;
        this.type = type;
    }

    draw() {
        if (this.type === CellType.FREE) return;

        if (!Object.values(CellType).includes(this.type)) {
            console.log("[ERROR]: using unrecognized CellType");
            return;
        }

        this.ctx.beginPath();

        this.ctx.fillStyle = CellType._COLORS[this.type] || "black";

        this.ctx.fillRect(this.x, this.y, this.size, this.size);
        this.ctx.closePath();
    }
}

class Grid {
    constructor(canvas, rows, cols, pixelSize) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        this.rows = rows;
        this.cols = cols;
        this.pixelSize = pixelSize;

        this.pixelArray = [];
        this.startPixel = null;
        this.endPixel = null;

        this.clearGrid();
    }

    clearGrid() {
        initControls();

        this.pixelArray = [];

        for (let i = 0; i < this.rows; i++) {
            this.pixelArray.push([]);
            for (let j = 0; j < this.cols; j++) {
                this.pixelArray[i].push(new Cell(this.canvas, i, j, this.pixelSize, CellType.FREE));
            }
        }
    }

    setStart() {}
    setEnd() {}

    setGridSize(rows, cols) {
        this.rows = rows;
        this.cols = cols;

        this.clearGrid();
    }

    setPixelSize(x) {
        this.pixelSize = x;

        //FIXME: better way to do this?
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.pixelArray[i][j].size = this.pixelSize;
            }
        }
        this.clearGrid();
    }

    // window-to-canvas coordinate mapping
    getPixelFromWindowCoords(x, y) {
        const r = this.canvas.getBoundingClientRect();
        const insideCanvasMouseY = y - r.top;
        const insideCanvasMouseX = x - r.left;

        if (insideCanvasMouseY < 0 || insideCanvasMouseY > r.height) return undefined;
        if (insideCanvasMouseX < 0 || insideCanvasMouseX > r.width) return undefined;

        const pixelRow = Math.floor(insideCanvasMouseY / this.pixelSize);
        const pixelCol = Math.floor(insideCanvasMouseX / this.pixelSize);

        // avoid errors when testing with unusual grid sizes
        if (pixelRow >= this.rows || pixelCol > this.cols) return undefined;

        const currentPixel = this.pixelArray[pixelRow][pixelCol];
        console.log(currentPixel);
        return currentPixel;
    }

    draw() {
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = "1";

        for (let y = 0; y < this.rows + 1; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.pixelSize);
            this.ctx.lineTo(this.cols * this.pixelSize, y * this.pixelSize);
            this.ctx.stroke();

            for (let x = 0; x < this.cols + 1; x++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x * this.pixelSize, 0);
                this.ctx.lineTo(x * this.pixelSize, this.rows * this.pixelSize);
                this.ctx.stroke();
            }
        }

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.pixelArray[i][j].draw();
            }
        }
    }
}

const grid = new Grid(canvas, 9, 16, 20);

init();

// function initGrid(pixelArray, canvas) {
//     // (re)construct array
//     pixelArray = [];
//     let rowSize = Math.floor(canvas.height / getCellSize());
//     let colSize = Math.floor(canvas.width / getCellSize());
//     console.log("init grid with size", rowSize, colSize);
//     for (let y = 0; y <= rowSize; y++) {
//         pixelArray.push([]);
//         for (let x = 0; x <= colSize; x++) {
//             pixelArray[y].push(new Cell(x, y, getCellSize(), CellType.FREE));
//         }
//     }
//     return pixelArray;
// }

// function clearGrid() {
// initControls
//     pixelArray = initGrid(pixelArray, canvas, getCellSize());
// }

function mainDraw() {
    // background
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    grid.draw();
    requestAnimationFrame(mainDraw);
}

function init() {
    handleResize();

    initControls();
    // pixelArray = initGrid(pixelArray, canvas, getCellSize());
    initEvents();

    mainDraw();
}

function initControls() {
    // reset control panel state
    isStartSet = false;
    startRadio.disabled = false;
    startRadio.checked = true;

    endRadio.disabled = false;
    isEndSet = false;
}

function initEvents() {
    window.addEventListener("resize", handleResize);

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

    clearBtn.addEventListener("click", grid.clearGrid);

    cellSizeSlider.addEventListener("change", () => {
        grid.clearGrid();
    });
}

function handleResize() {
    // make grid look nice (no unfinished grid cells)
    let wantedW = (window.innerWidth * 3) / 4;
    let wantedH = (window.innerHeight * 3) / 4;

    let fixedW = wantedW - (wantedW % getCellSize());
    let fixedH = wantedH - (wantedH % getCellSize());

    canvas.width = fixedW;
    canvas.height = fixedH;

    let rows = Math.floor(canvas.height / getCellSize());
    let cols = Math.floor(canvas.width / getCellSize());

    grid.setGridSize(rows, cols);
}

function handleKeys(e) {
    isShiftDown = e.type === "keydown" && e.key === "Shift";

    if (e.type === "keydown" && e.key === "c") grid.clearGrid();

    if (e.type === "keydown" && e.key === " ") {
        // TODO: OOP Pixels class with methods like getStartCell() ... !!!!
        let startX = -1;
        let startY = -1;
        for (let y = 0; y < grid.pixelArray.length; y++) {
            for (let x = 0; x < grid.pixelArray[0].length; x++) {
                console.log(y, x);
                if (grid.pixelArray[y][x].type === CellType.START) {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (startX !== -1) break;
        }

        console.log("fini !, j'ai:", startX, startY);

        bfs(grid.pixelArray, startX, startY);
    }
}

function handleMouse(e) {
    if (e.type === "mousedown") {
        isMouseDown = true;
    } else if (e.type === "mouseup") {
        isMouseDown = false;
    }

    if (!isMouseDown) return;

    const currentPixel = grid.getPixelFromWindowCoords(e.clientX, e.clientY);
    if (!currentPixel) return; // mouse out of grid

    if (isShiftDown) {
        if (currentPixel.type === CellType.START) {
            isStartSet = false;
            startRadio.disabled = false;
        } else if (currentPixel.type === CellType.END) {
            isEndSet = false;
            endRadio.disabled = false;
        }
        currentPixel.type = CellType.FREE;
        return;
    }

    if (currentPixel.type === CellType.START || currentPixel.type === CellType.END) return; // do not override start and end

    const radioType = getActiveRadio().value;

    // paint cell type
    if (radioType === CellType.START) {
        if (!isStartSet) {
            currentPixel.type = radioType;
            isStartSet = true;
            startRadio.disabled = true;
            // WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
            document.querySelectorAll('.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)')[0].checked = true;
        }
    } else if (radioType === CellType.END) {
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
