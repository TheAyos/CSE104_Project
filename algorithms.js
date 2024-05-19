import { CellType } from "./Cell.js";

export { bfsdfs, dijkstra };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function bfsdfs(grid, dfs = false) {
    // bottom right up left  --- [dY, dX]
    const neighborVectors = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
    ];
    const queue = [grid.startPixel];

    let totalVisited = 0;

    let found = false;
    while (queue.length != 0 && !found && grid.runningPathfinding) {
        totalVisited++;
        // var to access outside of the while
        var currentPixel;
        if (dfs) currentPixel = queue.pop();
        else currentPixel = queue.shift();

        // sanity checks
        if (currentPixel.type === CellType.VISITED) continue;
        if (currentPixel.type === CellType.OBSTACLE) continue;

        // reconstruct path if done
        if (currentPixel.type === CellType.END) {
            found = true;
            break;
        }

        currentPixel.type = CellType.VISITED;

        // queue/stack next neighbors
        for (let k = 0; k < 4; k++) {
            let nextI = currentPixel.i + neighborVectors[k][0];
            let nextJ = currentPixel.j + neighborVectors[k][1];

            // only add legal neighbors
            if (nextI < 0 || nextJ < 0 || nextI > grid.rows - 1 || nextJ > grid.cols - 1) continue;

            const child = grid.pixelArray[nextI][nextJ];

            if (child.type !== CellType.VISITED && child.type !== CellType.OBSTACLE && !child.pathParent) {
                child.pathParent = currentPixel;
                queue.push(child);
            }
        }

        await sleep(grid.algoSpeed);
    }
    if (!found) return false;

    let pathLength = 0;
    let current = currentPixel;
    while (current && current.pathParent) {
        pathLength++;
        current.type = CellType.PATH;
        current = current.pathParent;
    }

    grid.startPixel.type = CellType.START;
    grid.endPixel.type = CellType.END;

    return [true, pathLength, totalVisited]; // found path //FIXME: clean exit tho ?
}

async function dijkstra(grid) {
    //left bottom right up  --- [dY, dX]
    const neighborVectors = [
        [1, 0],
        [0, -1],
        [-1, 0],
        [0, 1],
    ];
    // //left bottom right up  --- [dY, dX]
    // const neighborVectors = [
    //     [0, -1],
    //     [1, 0],
    //     [0, 1],
    //     [-1, 0],
    // ];
    const queue = [grid.startPixel];

    let totalVisited = 0;

    let found = false;
    while (queue.length != 0 && !found && grid.runningPathfinding) {
        totalVisited++;
        // var to access outside of the while
        var currentPixel;
        if (dfs) currentPixel = queue.pop();
        else currentPixel = queue.shift();

        // sanity checks
        if (currentPixel.type === CellType.VISITED) continue;
        if (currentPixel.type === CellType.OBSTACLE) continue;

        // reconstruct path if done
        if (currentPixel.type === CellType.END) {
            found = true;
            break;
        }

        currentPixel.type = CellType.VISITED;
        // currentPixel.pathParent = parent;

        // queue/stack next neighbors
        for (let k = 0; k < 4; k++) {
            let nextI = currentPixel.i + neighborVectors[k][0];
            let nextJ = currentPixel.j + neighborVectors[k][1];

            // only add legal neighbors
            if (nextI < 0 || nextJ < 0 || nextI > grid.rows - 1 || nextJ > grid.cols - 1) continue;

            const child = grid.pixelArray[nextI][nextJ];

            if (child.type !== CellType.VISITED && child.type !== CellType.OBSTACLE && !child.pathParent) {
                child.pathParent = currentPixel;
                queue.push(child);
            }
        }

        await sleep(grid.algoSpeed);
    }
    if (!found) return false;

    let pathLength = 0;
    let current = currentPixel;
    while (current && current.pathParent) {
        pathLength++;
        current.type = CellType.PATH;
        current = current.pathParent;
    }

    grid.startPixel.type = CellType.START;
    grid.endPixel.type = CellType.END;

    return [true, pathLength, totalVisited]; // found path //FIXME: clean exit tho ?
}
