"use strict;";

import { CellType } from "./Cell.js";

export { bfsdfs, dijkstra };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Stack {
    #stack; // private
    constructor(initElts = []) {
        this.#stack = initElts;
    }

    isEmpty() {
        return this.#stack.length === 0;
    }

    push(x) {
        this.#stack.push(x);
    }

    pop() {
        // LIFO: remove and return the last added element
        if (this.isEmpty()) throw new Error("Stack is empty");
        return this.#stack.pop();
    }
}

class Queue {
    #queue; // private
    constructor(initElts = []) {
        this.#queue = initElts;
    }

    isEmpty() {
        return this.#queue.length === 0;
    }

    push(x) {
        this.#queue.push(x);
    }

    pop() {
        // FIFO: remove and return the first added element
        if (this.isEmpty()) throw new Error("Queue is empty");
        return this.#queue.shift();
    }
}

function reconstructAndVisualizePath(grid) {
    // /!\ assumes that a path has been found (uses pixel.pathParent)
    const path = [];
    let currentPixel = grid.endPixel;

    while (!!currentPixel && !!currentPixel.pathParent) {
        path.unshift(currentPixel);
        currentPixel.type = CellType.PATH;
        currentPixel = currentPixel.pathParent;
    }

    grid.startPixel.type = CellType.START;
    grid.endPixel.type = CellType.END;
    return path;
}

async function bfsdfs(grid, dfs = false) {
    const visited = [],
        toVisit = new (dfs ? Stack : Queue)();
    toVisit.push(grid.startPixel);

    let found = false;
    while (!toVisit.isEmpty() != 0 && !found && grid.runningPathfinding) {
        // var to access outside of the while
        // pop behaves according to data structure (dfs:stack & bfs:queue)
        var currentPixel = toVisit.pop();

        // sanity checks
        if (currentPixel.type === CellType.VISITED) continue;
        if (currentPixel.type === CellType.OBSTACLE) continue;

        // reconstruct path if done
        if (currentPixel.type === CellType.END) found = true;

        currentPixel.type = CellType.VISITED;
        visited.push(currentPixel);

        // process next neighbors
        for (const child of currentPixel.legalNeighbors) {
            if (child.type !== CellType.VISITED && child.type !== CellType.OBSTACLE && !child.pathParent) {
                child.pathParent = currentPixel;
                toVisit.push(child);
            }
        }
        await sleep(grid.algoSpeed);
    }
    if (!found) return [false];

    const path = reconstructAndVisualizePath(grid);
    return [true, path, visited];
}

// TODO: further improvement: implement heap data structure instead of sorting
async function dijkstra(grid) {
    grid.startPixel.distance = 0;

    const visited = [],
        toVisit = [];
    for (const row of grid.pixelArray) for (const pixel of row) toVisit.push(pixel);

    let found = false;
    while (toVisit.length && !found && grid.runningPathfinding) {
        // sort by ascending distance to choose next pixel to visit
        toVisit.sort((x, y) => x.distance - y.distance);

        // var to access outside of the while
        var closestPixel = toVisit.shift();

        // sanity checks
        // if (closestPixel.type === CellType.VISITED) continue;
        if (closestPixel.type === CellType.OBSTACLE) continue;

        // nothing left to explore
        if (closestPixel.distance === Infinity) return false;

        closestPixel.type = CellType.VISITED;
        visited.push(closestPixel);

        if (closestPixel === grid.endPixel) found = true;

        // update neighbors' distances according to dijkstra's logic
        for (const child of closestPixel.legalNeighbors) {
            if (child.type === CellType.VISITED) continue;

            child.distance = closestPixel.distance + child.j; // WEIGHT IS 1111111 //TODO: add weighted nodes
            child.pathParent = closestPixel;
        }

        await sleep(grid.algoSpeed);
    }

    if (!found) return [false];

    const path = reconstructAndVisualizePath(grid);

    return [true, path, visited];
}
