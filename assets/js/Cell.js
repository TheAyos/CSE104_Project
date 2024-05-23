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

export class Cell {
    constructor(canvas, i, j, size, type = CellType.FREE) {
        this.ctx = canvas.getContext("2d");
        this.i = i;
        this.j = j;
        this.size = size;
        this.type = type;

        // pathfinding-related
        this.pathParent = null;
        this.distance = Infinity;
    }

    get y() {
        return this.i * this.size;
    }
    get x() {
        return this.j * this.size;
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
