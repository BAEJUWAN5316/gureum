export class DialogueController {
    constructor() {
        this.modal = document.getElementById('dialogue-modal');
        this.textBox = document.getElementById('dialogue-text');
        this.nextBtn = document.getElementById('dialogue-next-btn');
        this.resolvePromise = null;
        this.rejectPromise = null; // 취소(reject) 함수
    }

    // 대화창을 보여주고, '다음' 버튼 클릭을 기다리는 Promise 반환
    show(text) {
        try {
            return new Promise((resolve, reject) => {
                this.resolvePromise = resolve;
                this.rejectPromise = reject; // reject 함수 저장
                this.textBox.textContent = text;
                this.modal.classList.remove('hidden');
    
                this.nextBtn.addEventListener('click', this.handleNext, { once: true });
            });
        } catch (e) {
            alert(`[dialogue.js Error] ${e.message}`);
        }
    }

    handleNext = () => {
        this.modal.classList.add('hidden');
        if (this.resolvePromise) {
            this.resolvePromise(); // Promise를 이행하여 다음 로직으로 넘어감
        }
    }

    // 외부에서 대화창을 강제로 닫는 메소드
    forceClose() {
        if (!this.modal.classList.contains('hidden')) {
            this.modal.classList.add('hidden');
            this.nextBtn.removeEventListener('click', this.handleNext);
            if (this.rejectPromise) {
                this.rejectPromise(new Error('Dialogue forced to close'));
            }
        }
    }
}
