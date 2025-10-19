import { DAY_SECONDS } from './constants.js';

export class HUD {
    constructor() {
        this.wealthEl = document.getElementById('wealth');
        this.landEl = document.getElementById('land');
        this.forceEl = document.getElementById('force');
        this.populationEl = document.getElementById('population');
        this.happinessEl = document.getElementById('happiness');
        this.timeEl = document.getElementById('time');
        this.dayEl = document.getElementById('day');

        this.timer = DAY_SECONDS;
        this.timerInterval = null;
    }

    updateStats(stats) {
        this.dayEl.textContent = stats.day;
        this.wealthEl.textContent = stats.wealth;
        this.landEl.textContent = stats.land;
        this.forceEl.textContent = stats.force;
        this.populationEl.textContent = stats.population;
        this.happinessEl.textContent = stats.happiness;
    }

    startDay() {
        this.timer = DAY_SECONDS;
        this.timeEl.textContent = this.timer;

        this.timerInterval = setInterval(() => {
            this.timer--;
            this.timeEl.textContent = this.timer;
            if (this.timer <= 0) {
                this.endDay();
            }
        }, 1000);
    }

    endDay() {
        clearInterval(this.timerInterval);
        console.log("하루가 끝났습니다!");
        // 'dayend' 커스텀 이벤트를 발생시켜 main.js에 알림
        window.dispatchEvent(new CustomEvent('dayend'));
    }
}
