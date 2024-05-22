"use strict;";

import { startRadio, endRadio, handleResize } from "./script.js";
import { Pixel, CellType } from "./Pixel.js";

export class Grid {
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

        this.runningPathfinding = false;
        this.algoSpeed = 15;
    }

    // reset control panel state
    resetControls() {
        this.startPixel = null;

        startRadio.disabled = false;
        startRadio.checked = true;

        endRadio.disabled = false;
        this.endPixel = null;
    }

    clearGrid(pathOnly = false) {
        this.runningPathfinding = false;

        if (!pathOnly) this.resetControls();

        const savedObstacles = Array.from(Array(this.rows), () => Array.from(Array(this.cols), () => null));

        const newPixelArray = [];

        for (let i = 0; i < this.rows; i++) {
            newPixelArray.push([]);
            for (let j = 0; j < this.cols; j++) {
                if (this.pixelArray.length !== 0 && this.pixelArray[i][j].type === CellType.OBSTACLE) savedObstacles[i][j] = this.pixelArray[i][j];
                newPixelArray[i].push(new Pixel(this, i, j, this.pixelSize, CellType.FREE));
            }
        }

        this.pixelArray = newPixelArray;

        // 'restore' saved pixels & deal with start/end pixels accordingly
        if (pathOnly) {
            for (let i = 0; i < savedObstacles.length; i++) {
                for (let j = 0; j < savedObstacles[0].length; j++) {
                    if (savedObstacles[i][j] !== null) this.pixelArray[i][j] = savedObstacles[i][j];
                }
            }

            [this.startPixel, this.endPixel].forEach((pixel) => {
                if (pixel) {
                    pixel.pathParent = null;
                    this.pixelArray[pixel.i][pixel.j] = pixel;
                }
            });
        } else {
            this.startPixel = null;
            this.endPixel = null;
        }

        console.log("[clearGrid] just created a pixelArray of size", this.pixelArray.length, this.pixelArray[0].length);
    }

    clearPath() {
        this.clearGrid(true);
    }

    setStart(currentPixel) {
        currentPixel.type = CellType.START;
        this.startPixel = currentPixel;
        startRadio.disabled = true;
        // FIXME: WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
        document.querySelectorAll('.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)')[0].checked = true;
    }
    setEnd(currentPixel) {
        currentPixel.type = CellType.END;
        this.endPixel = currentPixel;
        endRadio.disabled = true;
        // FIXME: WATCH OUT, list could be empty (ok as long as i don't disable the obstacle radio)
        document.querySelectorAll('.control-panel>div>input[name="cell_type"]:not(:checked):not(:disabled)')[0].checked = true;
    }
    setFree(currentPixel) {
        if (currentPixel.type === CellType.START) {
            this.startPixel = null;
            startRadio.disabled = false;
        } else if (currentPixel.type === CellType.END) {
            this.endPixel = null;
            endRadio.disabled = false;
        }

        currentPixel.type = CellType.FREE;
    }

    setGridSize(rows, cols) {
        this.rows = rows;
        this.cols = cols;

        this.clearGrid();
    }

    setPixelSize(x) {
        this.pixelSize = x;
        handleResize();

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
        if (pixelRow >= this.rows || pixelCol >= this.cols) return undefined;

        const currentPixel = this.pixelArray[pixelRow][pixelCol];
        // console.log("getPixelFromWindowCoords", currentPixel);
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
