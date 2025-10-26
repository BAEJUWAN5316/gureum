// input.js

const pressedKeys = {};

window.addEventListener('keydown', (e) => {
    pressedKeys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    pressedKeys[e.code] = false;
});

export function isKeyDown(keyCode) {
    return pressedKeys[keyCode] || false;
}
