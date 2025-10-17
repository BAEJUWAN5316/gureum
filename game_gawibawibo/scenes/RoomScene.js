class RoomScene extends Phaser.Scene {
    constructor() {
        super('RoomScene');
        this.isDialogueActive = false;
        this.dialogueCooldown = false;
        this.aboutToBattle = false;
        this.npcChoice = null;
        this.eventHandlers = {};
    }

    init(data) {
        this.npcKey = data.npcKey;
        this.npcConfig = NpcData[this.npcKey];
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.drawMap();
        this.createPlayer();
        this.createNPC();

        // Create animations
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
            frameRate: 5,
            repeat: -1
        });

        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.npc);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.interactionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventHandlers.dialogueEnded = () => {
            this.isDialogueActive = false;
            if (this.aboutToBattle) {
                this.startBattle();
            } else {
                this.startDialogueCooldown();
            }
        };

        this.eventHandlers.playerChoice = (playerChoice) => {
            this.resolveBattle(playerChoice);
        };

        this.eventHandlers.battleEnded = (win) => {
            this.aboutToBattle = false;
            this.startDialogueCooldown();
            if (win) {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.cleanup();
                    const nextKey = this.npcConfig.nextNpcKey;
                    if (nextKey === 'Ending') {
                        this.scene.start('EndingScene');
                    } else {
                        this.scene.start('RoomScene', { npcKey: nextKey });
                    }
                });
            }
        };

        for (const event in this.eventHandlers) {
            this.game.events.on(event, this.eventHandlers[event]);
        }
    }

    cleanup() {
        for (const event in this.eventHandlers) {
            this.game.events.off(event, this.eventHandlers[event]);
        }
    }

    startDialogueCooldown() {
        this.dialogueCooldown = true;
        this.time.delayedCall(300, () => {
            this.dialogueCooldown = false;
        });
    }

    startBattle() {
        const choices = ['rock', 'paper', 'scissors'];
        let realChoice;
        let thought;

        // Determine choice and thought based on NPC strategy
        switch (this.npcConfig.strategy) {
            case 'oneStepAhead': // For NPC B
                thought = Phaser.Math.RND.pick(choices);
                // The real choice beats the thought
                if (thought === 'rock') realChoice = 'paper';
                else if (thought === 'paper') realChoice = 'scissors';
                else realChoice = 'rock';
                break;

            case 'liar': // For NPC C
                realChoice = Phaser.Math.RND.pick(choices);
                thought = realChoice;
                // Sometimes, the thought is a lie
                if (Math.random() > 0.3) { // 70% chance to lie
                    const fakeChoices = choices.filter(c => c !== realChoice);
                    thought = Phaser.Math.RND.pick(fakeChoices);
                }
                break;

            default: // For NPC A (normal)
                realChoice = Phaser.Math.RND.pick(choices);
                thought = realChoice;
                break;
        }

        this.npcChoice = realChoice;
        this.game.events.emit('startBattle', this.npc, thought);
    }

    resolveBattle(playerChoice) {
        let result;
        if (playerChoice === this.npcChoice) {
            result = 'draw';
        } else if (
            (playerChoice === 'rock' && this.npcChoice === 'scissors') ||
            (playerChoice === 'paper' && this.npcChoice === 'rock') ||
            (playerChoice === 'scissors' && this.npcChoice === 'paper')
        ) {
            result = 'win';
        } else {
            result = 'lose';
        }
        this.game.events.emit('showBattleResult', result);
    }

    drawMap() {
        this.walls = this.physics.add.staticGroup();
        const mapLayout = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];

        mapLayout.forEach((row, y) => {
            row.forEach((tile, x) => {
                const posX = x * 32;
                const posY = y * 32;
                if (tile === 1) {
                    this.walls.create(posX, posY, 'wall').setOrigin(0,0).refreshBody();
                } else {
                    this.add.image(posX, posY, this.npcConfig.floorTexture).setOrigin(0,0);
                }
            });
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(400, 350, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2);
    }

    createNPC() {
        this.npc = this.physics.add.sprite(400, 150, this.npcConfig.texture);
        this.npc.setImmovable(true);
        this.npc.setScale(2);
    }

    update() {
        if (this.isDialogueActive || this.aboutToBattle) {
            this.player.setVelocity(0);
            this.player.play('idle', true);
            return;
        }

        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true); // Flip sprite to face left
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setFlipX(false); // Normal orientation
        } else if (this.cursors.up.isDown) {
            this.player.setVelocityY(-160);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
        }

        // Animation logic
        if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
            this.player.play('walk', true); // Play 'walk' animation if not already playing
        } else {
            this.player.play('idle', true); // Play 'idle' animation
        }

        if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            if (this.dialogueCooldown) return;

            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
            if (distance < 128) {
                if (!this.isDialogueActive) {
                    this.isDialogueActive = true;
                    this.aboutToBattle = true;
                    this.game.events.emit('showDialogue', this.npcConfig.dialogue);
                }
            }
        }
    }
}