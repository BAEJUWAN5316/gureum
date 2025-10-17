class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
        this.isTyping = false;
        this.typingTimer = null;
        this.inputCooldown = false;
        this.isBattleActive = false;
        this.selectedIndex = 0;
    }

    create() {
        // UI Elements
        this.dialogueElements = this.add.container().setVisible(false);
        this.battleUI = this.add.container().setVisible(false).setDepth(100);
        this.thoughtBubble = this.add.container().setVisible(false);
        this.selectionBox = this.add.graphics().setDepth(101);

        // Event Listeners
        this.game.events.on('showDialogue', this.showDialogue, this);
        this.game.events.on('startBattle', this.startBattle, this);
        this.game.events.on('showBattleResult', this.showResult, this);

        // Input Keys
        this.cursors = this.input.keyboard.createCursorKeys();
        this.interactionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Background Music
        if (!this.music) {
            this.music = this.sound.add('bgm', { loop: true, volume: 0.5 });
            this.music.play();
        }

        // Music Toggle Button
        const musicButton = this.add.image(this.cameras.main.width - 40, 40, 'music_on')
            .setInteractive({ useHandCursor: true })
            .setScale(0.08)
            .setOrigin(0.5, 0.5)
            .setDepth(200);

        musicButton.on('pointerdown', () => {
            if (this.music.isPlaying) {
                this.music.pause();
                musicButton.setTexture('music_off');
            } else {
                this.music.resume();
                musicButton.setTexture('music_on');
            }
        });
    }

    showDialogue(fullText) {
        if (this.typingTimer) {
            this.typingTimer.remove();
        }
        this.dialogueElements.removeAll(true);

        const dialogueBox = this.add.graphics().fillStyle(0x000000, 0.8).fillRect(50, this.cameras.main.height - 150, this.cameras.main.width - 100, 100);
        this.dialogueText = this.add.text(70, this.cameras.main.height - 130, '', { fontSize: '20px', fill: '#ffffff', wordWrap: { width: this.cameras.main.width - 140 } });
        const promptText = this.add.text(this.cameras.main.width - 80, this.cameras.main.height - 70, '[SPACE]', { fontSize: '14px', fill: '#888888' }).setOrigin(1);
        
        this.dialogueElements.add([dialogueBox, this.dialogueText, promptText]);
        this.dialogueElements.setVisible(true);

        this.fullText = fullText;
        let charIndex = 0;
        this.isTyping = true;

        this.inputCooldown = true;
        this.time.delayedCall(100, () => { this.inputCooldown = false; });

        this.typingTimer = this.time.addEvent({
            delay: 50,
            callback: () => {
                this.dialogueText.setText(this.fullText.substr(0, charIndex + 1));
                charIndex++;
                if (charIndex === this.fullText.length) {
                    this.isTyping = false;
                    this.typingTimer.remove();
                }
            },
            repeat: this.fullText.length - 1
        });
    }

    hideDialogue() {
        if (this.dialogueElements.visible) {
            if (this.typingTimer) this.typingTimer.remove();
            this.isTyping = false;
            this.dialogueElements.setVisible(false);
            this.game.events.emit('dialogueEnded');
        }
    }

    handleDialogueInput() {
        if (this.inputCooldown) return;

        if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            if (this.isTyping) {
                this.typingTimer.remove();
                this.isTyping = false;
                this.dialogueText.setText(this.fullText);
            } else {
                this.hideDialogue();
            }
        }
    }

    startBattle(npc, thought) {
        this.thoughtBubble.removeAll(true);
        const bubble = this.add.image(0, 0, 'thought_bubble');
        const choiceToEmoji = { rock: '✊', paper: '🖐️', scissors: '✌️' };
        const emoji = this.add.text(0, 0, choiceToEmoji[thought] || '?', { fontSize: '24px' }).setOrigin(0.5);
        this.thoughtBubble.add([bubble, emoji]);
        this.thoughtBubble.setPosition(npc.x, npc.y - 40).setVisible(true);

        this.time.delayedCall(1000, () => {
            this.battleUI.removeAll(true);
            
            const choices = ['rock', 'paper', 'scissors'];
            this.choiceImages = [];
            choices.forEach(choice => {
                const img = this.add.image(0, 0, choice).setInteractive().setScale(0.125);
                this.choiceImages.push(img);
                this.battleUI.add(img);
            });

            this.choiceImages[0].setPosition(250, 400);
            this.choiceImages[1].setPosition(400, 400);
            this.choiceImages[2].setPosition(550, 400);
            
            this.selectedIndex = 0;
            this.updateSelectionVisual();
            this.battleUI.setVisible(true);
            this.isBattleActive = true;
        });
    }
    
    updateSelectionVisual() {
        this.selectionBox.clear();
        if (!this.choiceImages || !this.choiceImages[this.selectedIndex]) return;
        const currentImage = this.choiceImages[this.selectedIndex];
        this.selectionBox.lineStyle(4, 0xffff00); // Yellow outline
        this.selectionBox.strokeRect(
            currentImage.x - currentImage.displayWidth / 2 - 4,
            currentImage.y - currentImage.displayHeight / 2 - 4,
            currentImage.displayWidth + 8,
            currentImage.displayHeight + 8
        );
    }

    handleBattleInput() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.selectedIndex = (this.selectedIndex + 1) % 3;
            this.updateSelectionVisual();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.selectedIndex = (this.selectedIndex - 1 + 3) % 3;
            this.updateSelectionVisual();
        } else if (Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            const choices = ['rock', 'paper', 'scissors'];
            this.game.events.emit('playerChoice', choices[this.selectedIndex]);
            
            this.isBattleActive = false;
            this.battleUI.setVisible(false);
            this.thoughtBubble.setVisible(false);
            this.selectionBox.clear();
        }
    }

    showResult(result) {
        const resultImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, result);
        resultImage.setOrigin(0.5, 0.5);
        resultImage.setScale(0.4);

        this.time.delayedCall(1500, () => {
            resultImage.destroy();
            this.game.events.emit('battleEnded', result === 'win');
        });
    }

    update() {
        if (this.isBattleActive) {
            this.handleBattleInput();
        } else if (this.dialogueElements.visible) {
            this.handleDialogueInput();
        }
    }
}