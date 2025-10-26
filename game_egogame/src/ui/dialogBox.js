// ui/dialogBox.js

export class DialogBox {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.padding = 10;
        this.boxHeight = 80;
        this.boxY = this.gameHeight - this.boxHeight - this.padding;
        this.boxX = this.padding;
        this.boxWidth = this.gameWidth - (this.padding * 2);

        this.nameFont = 'bold 18px Arial';
        this.dialogueFont = '16px Arial';
        this.hintFont = '14px Arial';
    }

    draw(ctx, dialogue) {
        if (!dialogue) return;

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.boxX, this.boxY, this.boxWidth, this.boxHeight);

        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = this.nameFont;
        ctx.fillText(dialogue.name, this.boxX + this.padding, this.boxY + this.padding + 18);

        // Draw dialogue sentence
        ctx.font = this.dialogueFont;
        ctx.fillText(dialogue.sentence, this.boxX + this.padding, this.boxY + this.padding + 18 + 25);

        // Draw hint for next sentence
        if (dialogue.hasNext) {
            ctx.font = this.hintFont;
            ctx.textAlign = 'right';
            ctx.fillText('Press Space to continue...', this.boxX + this.boxWidth - this.padding, this.boxY + this.boxHeight - this.padding);
            ctx.textAlign = 'left'; // Reset text alignment
        }
    }
}
