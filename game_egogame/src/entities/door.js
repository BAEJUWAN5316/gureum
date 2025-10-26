// entities/door.js

export class Door {
    constructor(x, y, assetLoader) {
        this.x = x;
        this.y = y;
        this.width = 64; // Placeholder size
        this.height = 96; // Placeholder size
        this.isOpen = false;
        this.interactRadius = 50; // Distance for interaction
        this.image = assetLoader.getImage('ui'); // Assuming door is part of ui.png for now
        console.log('Door image:', this.image);
        // If door is a separate image, it would be: this.image = assetLoader.getImage('door');
    }

    canOpen(partyCount) {
        return partyCount >= 3;
    }

    open() {
        this.isOpen = true;
        console.log('Door is now open!');
    }

    draw(ctx, cameraX, cameraY) {
        if (this.image) {
            // Assuming the door is a specific section of the ui.png or a full image
            // For now, drawing a placeholder section from ui.png or the whole image
            ctx.drawImage(this.image, this.x - cameraX, this.y - cameraY, this.width, this.height);
        } else {
            ctx.fillStyle = this.isOpen ? 'gold' : 'brown';
            ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(this.isOpen ? 'OPEN' : 'CLOSED', this.x - cameraX + 10, this.y - cameraY + this.height / 2);
        }
    }
}
