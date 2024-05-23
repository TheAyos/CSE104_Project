"use strict;";

export const CellType = {
    FREE: "free",
    START: "start",
    END: "end",
    OBSTACLE: "obstacle",
    VISITED: "visited",
    FRONTIER: "frontier",
    PATH: "path",
};

const cellColorOpacity = "0.8";

CellType._COLORS = {
    // "free": "", // not needed, Cell.draw() just skips
    start: `rgba(0,255,0,${cellColorOpacity})`,
    end: `rgba(255,0,0,${cellColorOpacity})`,
    obstacle: `rgba(0,0,255,${cellColorOpacity})`,
    visited: `rgba(166, 172, 175,${cellColorOpacity})`,
    frontier: `rgba(201, 207, 210,${cellColorOpacity})`,
    path: `rgba(212, 115, 212,${cellColorOpacity})`,
};

export class Pixel {
    constructor(grid, i, j, size, type = CellType.FREE) {
        this.grid = grid;

        this.i = i;
        this.j = j;
        this.size = size;
        this.type = type;

        // pathfinding-related
        this.pathParent = null;
        this.distance = Infinity; // for dijkstra
    }

    get y() { return this.i * this.size } // prettier-ignore
    get x() { return this.j * this.size } // prettier-ignore

    // canvas-to-window coordinate mappings
    get windowX() { return this.x + this.grid.canvas.getBoundingClientRect().left } // prettier-ignore
    get windowY() { return this.y + this.grid.canvas.getBoundingClientRect().top } // prettier-ignore

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

        this.grid.ctx.beginPath();
        this.grid.ctx.fillStyle = CellType._COLORS[this.type] || "black";
        this.grid.ctx.fillRect(this.x, this.y, this.size, this.size);
        this.grid.ctx.closePath();
    }
}
