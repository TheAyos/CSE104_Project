"use strict;";
export class Queue {
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
export class Stack {
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
