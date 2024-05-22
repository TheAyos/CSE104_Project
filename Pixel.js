"use strict;";

export const CellType = {
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

export class Pixel {
    constructor(grid, i, j, size, type = CellType.FREE) {
        this.ctx = grid.canvas.getContext("2d");
        this.grid = grid;

        this.i = i;
        this.j = j;
        this.size = size;
        this.type = type;

        // pathfinding-related
        this.pathParent = null;
        this.distance = Infinity; // for dijkstra
    }

    get y() {
        return this.i * this.size;
    }
    get x() {
        return this.j * this.size;
    }

    get legalNeighbors() {
        // bottom right up left  --- [dY, dX] --- [dI, dJ]
        const neighborVectors = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // prettier-ignore

        const n = [];
        for (let k = 0; k < 4; k++) {
            let nI = this.i + neighborVectors[k][0];
            let nJ = this.j + neighborVectors[k][1];

            // only add legal neighbors
            if (nI < 0 || nJ < 0 || nI > this.grid.rows - 1 || nJ > this.grid.cols - 1) continue;

            n.push(this.grid.pixelArray[nI][nJ]);
        }
        return n;
    }

    draw() {
        if (this.type === CellType.FREE) return;

        if (!Object.values(CellType).includes(this.type)) {
            console.log(`[ERROR]: using unrecognized CellType :${this.type}`);
            return;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = CellType._COLORS[this.type] || "black";
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
        this.ctx.closePath();
    }
}
