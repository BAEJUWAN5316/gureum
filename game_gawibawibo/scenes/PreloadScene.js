class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Load real assets from the assets folder
        this.load.image('floor_a', 'assets/floor_a.png');
        this.load.image('floor_b', 'assets/floor_b.png');
        this.load.image('floor_c', 'assets/floor_c.png');
        this.load.image('wall', 'assets/wall.png');
        this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('npcA', 'assets/npcA.png');
        this.load.image('npcB', 'assets/npcB.png');
        this.load.image('npcC', 'assets/npcC.png');

        // Load UI assets for the battle scene
        this.load.image('rock', 'assets/rock.png');
        this.load.image('paper', 'assets/paper.png');
        this.load.image('scissors', 'assets/scissors.png');

        // Load UI assets for the result scene
        this.load.image('win', 'assets/win.png');
        this.load.image('lose', 'assets/lose.png');
        this.load.image('draw', 'assets/draw.png');

        // Load audio
        this.load.audio('bgm', 'assets/bgm.mp3');

        // Load music toggle buttons
        this.load.image('music_on', 'assets/music_on.png');
        this.load.image('music_off', 'assets/music_off.png');

        // Generate placeholders for UI elements that were not provided
        this.generateUiPlaceholders();
    }

    generateUiPlaceholders() {
        this.make.graphics().fillStyle(0xeeeeee).fillRect(0, 0, 100, 40).generateTexture('button_bg', 100, 40);
        this.make.graphics().fillStyle(0xffffff).fillCircle(20, 20, 20).generateTexture('thought_bubble', 40, 40);
    }

    create() {
        this.scene.start('RoomScene', { npcKey: 'A' });
        this.scene.launch('UIScene');
    }
}