"use strict;";

const getRandIntMinMax = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const getRandomChoiceFromArr = (arr) => arr[getRandIntMinMax(0, arr.length - 1)];

export class TrailBits {
    static lastX = 0;
    static lastY = 0;
    static lastTime = new Date().getTime();

    static spawnBitAtPos = (pos, size) => {
        const halo = document.createElement("div");
        halo.className = "halo";
        halo.style.left = `${pos.x}px`;
        halo.style.top = `${pos.y}px`;
        halo.style.boxShadow = `0rem 0rem ${size}px ${size / 2}px rgba(212, 115, 212, 1)`;

        halo.style.animationDuration = "300ms";
        halo.style.animationFillMode = "forwards";
        halo.style.animationTimingFunction = "ease";
        halo.style.animationName = "fade";

        document.body.appendChild(halo);
        setTimeout(() => document.body.removeChild(halo), 300);

        const deltaT = new Date().getTime() - this.lastTime;
        // sqrt not needed + speed gain
        const deltaDist = Math.pow(this.lastX - pos.x, 2) + Math.pow(this.lastY - pos.y, 2); // pythagore !

        // prevent spawning too many bits
        if (deltaT < 150 && deltaDist < 400) return;
        const bit = document.createElement("div");

        bit.className = "trailbit";
        bit.style.left = `${pos.x}px`;
        bit.style.top = `${pos.y}px`;

        bit.textContent = getRandomChoiceFromArr(["0", "1", ")", "!"]);
        bit.style.color = `#fff6a9`;
        bit.style.fontSize = `${size}px`;
        bit.style.textShadow = `0 0 6px #ffa400,
                                0 0 10px #ff8d00,
                                0 0 16px #ffa400,
                                0 0 24px #ffa400,
                                0 0 36px #ffa400,
                                0 0 60px #ff0000ff,
                                0 0 80px #ff000001,
                                0 0 100px #ff0000`;

        bit.style.animationDuration = "1600ms";
        bit.style.animationFillMode = "forwards";
        bit.style.animationTimingFunction = "ease";
        bit.style.animationName = getRandomChoiceFromArr(["dance", "dance-alt"]);

        document.body.appendChild(bit);

        setTimeout(() => document.body.removeChild(bit), 1600);

        this.lastTime = new Date().getTime();
        this.lastX = pos.x;
        this.lastY = pos.y;
    };
}
