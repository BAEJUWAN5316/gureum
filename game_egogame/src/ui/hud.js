// ui/hud.js

export class HUD {
    constructor(gameWidth, gameHeight, assetLoader) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.assetLoader = assetLoader;
        this.allyCount = 0;
        this.maxAllies = 3;
        this.padding = 10;
        this.fontSize = 20;

        // Sound icon properties
        this.soundOn = true;
        this.soundIconImgOn = this.assetLoader.getImage('sound_on');
        this.soundIconImgOff = this.assetLoader.getImage('sound_off');
        this.soundIconSize = 32; // Assuming the image is 32x32
        this.soundIconX = this.gameWidth - this.soundIconSize - this.padding;
        this.soundIconY = this.padding;
    }

    updateAllyCount(count) {
        this.allyCount = count;
    }

    toggleSound() {
        this.soundOn = !this.soundOn;
    }

    draw(ctx) {
        // Draw ally count
        ctx.fillStyle = 'white';
        ctx.font = `${this.fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`함께하는 친구들: ${this.allyCount}/${this.maxAllies}`, this.padding, this.padding + this.fontSize);

        // Draw sound icon
        this.drawSoundIcon(ctx);
    }

    drawSoundIcon(ctx) {
        const image = this.soundOn ? this.soundIconImgOn : this.soundIconImgOff;
        if (image) {
            ctx.drawImage(image, this.soundIconX, this.soundIconY, this.soundIconSize, this.soundIconSize);
        }
    }

    // Method to check if the click was on the sound icon
    isSoundIconClicked(mouseX, mouseY) {
        return (
            mouseX >= this.soundIconX &&
            mouseX <= this.soundIconX + this.soundIconSize &&
            mouseY >= this.soundIconY &&
            mouseY <= this.soundIconY + this.soundIconSize
        );
    }
}
