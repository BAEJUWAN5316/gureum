// systems/camera.js

export class Camera {
    constructor(gameWidth, gameHeight) {
        this.x = 0;
        this.y = 0;
        this.width = gameWidth;
        this.height = gameHeight;
        this.lerpFactor = 0.1; // Smoothness of camera movement
    }

    update(targetX, targetY, worldWidth, worldHeight) {
        // Calculate the desired camera position (center on target)
        const desiredX = targetX - this.width / 2;
        const desiredY = targetY - this.height / 2;

        // Apply lerp for smooth movement
        this.x += (desiredX - this.x) * this.lerpFactor;
        this.y += (desiredY - this.y) * this.lerpFactor;

        // Clamp camera to world boundaries
        this.x = Math.max(0, Math.min(this.x, worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, worldHeight - this.height));
    }

    // Get the camera's current position (top-left corner of the viewport)
    getPosition() {
        return { x: this.x, y: this.y };
    }
}

// Simple linear interpolation function
function lerp(start, end, amount) {
    return start * (1 - amount) + end * amount;
}
