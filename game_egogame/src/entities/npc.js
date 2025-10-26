// entities/npc.js

export class NPC {
    constructor(id, name, x, y, dialogue, speed = 100, assetLoader, imageID) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 32; // Placeholder size
        this.height = 32; // Placeholder size
        this.dialogue = dialogue;
        this.isRecruited = false;
        this.state = 'idle'; // 'idle', 'run', 'jump', 'fall', 'talk'
        this.speed = speed; // Movement speed for following
        this.image = assetLoader.getImage(imageID); // Get specific NPC image
        console.log('NPC imageID:', imageID, 'Loaded image:', this.image);
    }

    update(deltaTime) {
        // NPC-specific update logic
    }

    draw(ctx, cameraX, cameraY) {
        if (this.image) {
            ctx.drawImage(this.image, this.x - cameraX, this.y - cameraY, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
        }
    }
}
