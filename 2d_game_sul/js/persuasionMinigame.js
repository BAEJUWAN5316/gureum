export class PersuasionMinigame {
    constructor() {
        this.modal = document.getElementById('minigame-modal');
        this.stopBtn = document.getElementById('minigame-stop-btn');
        this.indicator = document.getElementById('minigame-indicator');
        this.target = document.getElementById('minigame-target');

        this.speed = 3; // 막대 이동 속도
        this.direction = 1;
        this.position = 0;
        this.animationFrameId = null;
        this.isGameRunning = false;

        this.resolvePromise = null;
        this.rejectPromise = null;
    }

    // 미니게임을 시작하고, 결과(성공/실패)를 Promise로 반환
    start() {
        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            this.position = 0;
            this.direction = 1;
            this.isGameRunning = true;
            this.modal.classList.remove('hidden');

            this.stopBtn.addEventListener('click', this.handleStop, { once: true });

            this.animate();
        });
    }

    // STOP 버튼 클릭 처리
    handleStop = () => {
        if (!this.isGameRunning) return;

        cancelAnimationFrame(this.animationFrameId);
        this.isGameRunning = false;

        const indicatorRect = this.indicator.getBoundingClientRect();
        const targetRect = this.target.getBoundingClientRect();

        const isSuccess = indicatorRect.left >= targetRect.left && indicatorRect.right <= targetRect.right;
        
        this.modal.classList.add('hidden');
        if (this.resolvePromise) {
            this.resolvePromise(isSuccess);
        }
    }

    // 외부에서 미니게임을 강제로 닫는 메소드
    forceClose() {
        if (this.isGameRunning) {
            cancelAnimationFrame(this.animationFrameId);
            this.isGameRunning = false;
            this.modal.classList.add('hidden');
            this.stopBtn.removeEventListener('click', this.handleStop);
            if (this.rejectPromise) {
                this.rejectPromise(new Error('Minigame forced to close'));
            }
        }
    }

    // 막대 애니메이션
    animate = () => {
        if (!this.isGameRunning) return;

        this.position += this.speed * this.direction;
        if (this.position > this.indicator.parentElement.offsetWidth - this.indicator.offsetWidth || this.position < 0) {
            this.direction *= -1;
        }

        this.indicator.style.left = `${this.position}px`;
        this.animationFrameId = requestAnimationFrame(this.animate);
    }
}
