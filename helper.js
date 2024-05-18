function initGrid(pixelArray, canvas, minCellSize) {
    // (re)construct array
    pixelArray = [];
    let ySize = canvas.height / minCellSize;
    let xSize = canvas.width / minCellSize;
    for (let y = 0; y <= ySize; y++) {
        pixelArray.push([]);
        for (let x = 0; x <= xSize; x++) {
            pixelArray[y].push({ type: CellType.FREE });
        }
    }
    return pixelArray;
}

function drawGridUnit(ctx, x, y, size, state) {
    // separate function should allow for easy rendering customization
    ctx.beginPath();

    // draw grid
    ctx.strokeStyle = "black";
    ctx.lineWidth = "1";
    ctx.strokeRect(x, y, x + size, y + size);

    if (state !== CellType.FREE) {
        if (state === CellType.OBSTACLE) {
            ctx.fillStyle = "rgba(0,0,255,0.3)";
        } else if (state === CellType.START) {
            ctx.fillStyle = "rgba(0,255,0,0.3)";
        } else if (state === CellType.END) {
            ctx.fillStyle = "rgba(255,0,0,0.3)";
        } else if (state === CellType.VISITED) {
            ctx.fillStyle = "rgba(166, 172, 175,0.3)";
        }
        ctx.fillRect(x, y, size, size);
    }
    ctx.closePath();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export { initGrid, drawGridUnit};
