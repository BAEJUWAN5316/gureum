// entities/player.js

import { applyGravity, applyFriction, updatePosition } from '../systems/physics.js';

export class Player {
    constructor(x, y, assetLoader) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 150; // pixels per second
        this.jumpPower = 400; // pixels per second
        this.width = 32; // Placeholder size
        this.height = 32; // Placeholder size
        this.facing = 'right'; // 'left' or 'right'
        this.isGrounded = false;
        this.interactRadius = 50; // Distance for interaction with NPCs/doors
        this.state = 'idle'; // 'idle', 'run', 'jump', 'fall', 'talk'
        this.image = assetLoader.getImage('player'); // Get player image
        console.log('Player image:', this.image);
    }

    update(deltaTime, input, world, soundManager) {
        // Horizontal movement
        if (input.left) {
            this.vx = -this.speed;
            this.facing = 'left';
            this.state = 'run';
        } else if (input.right) {
            this.vx = this.speed;
            this.facing = 'right';
            this.state = 'run';
        } else {
            this.vx = 0;
            this.state = 'idle';
        }

        // Jump
        if (input.up && this.isGrounded) {
            this.vy = -this.jumpPower;
            this.isGrounded = false; // Will be reset by physics/collision later
            if (this.state !== 'jump') this.state = 'jump';
            soundManager.playSound('jump');
        }

        applyGravity(this, deltaTime);
        applyFriction(this);

        // Calculate potential new position
        const targetX = this.x + this.vx * deltaTime;
        const targetY = this.y + this.vy * deltaTime;

        // Use world for collision detection and resolution
        world.checkCollision(this, targetX, targetY);

        // Update state based on vertical velocity
        if (!this.isGrounded) {
            if (this.vy > 0) {
                this.state = 'fall';
            } else if (this.vy < 0) {
                this.state = 'jump';
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        if (this.image) {
            ctx.drawImage(this.image, this.x - cameraX, this.y - cameraY, this.width, this.height);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
        }
    }
}
