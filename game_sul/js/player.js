import { TILE_SIZE, PLAYER_SPEED } from './constants.js';

export class Player {
    constructor(gameScreen) {
        this.gameScreen = gameScreen;
        this.element = document.getElementById('player');
        
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;

        this.gameWidth = this.gameScreen.offsetWidth;
        this.gameHeight = this.gameScreen.offsetHeight;

        // 초기 위치 (화면 중앙)
        this.x = (this.gameWidth - this.width) / 2;
        this.y = (this.gameHeight - this.height) / 2;
    }

    update(input) {
        if (input.up) this.y -= PLAYER_SPEED;
        if (input.down) this.y += PLAYER_SPEED;
        if (input.left) this.x -= PLAYER_SPEED;
        if (input.right) this.x += PLAYER_SPEED;

        // 경계 처리
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;
        if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
    }

    draw() {
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }
}
