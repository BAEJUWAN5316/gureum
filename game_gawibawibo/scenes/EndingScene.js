class EndingScene extends Phaser.Scene {
    constructor() {
        super('EndingScene');
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'You have escaped!', {
            fontSize: '48px', fill: '#ffffff'
        }).setOrigin(0.5);

        const prompt = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 50, 'Press SPACE to restart', {
            fontSize: '20px', fill: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('RoomScene', { npcKey: 'A' });
        });
    }
}