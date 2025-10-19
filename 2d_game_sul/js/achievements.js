import { ACHIEVEMENTS } from './constants.js';

export class AchievementController {
    constructor(gameState) {
        this.gameState = gameState;
        this.listEl = document.getElementById('achievement-list');
        this.toggleBtn = document.getElementById('achievement-toggle-btn');
        this.toastEl = document.getElementById('achievement-toast');

        this.init();
    }

    init() {
        // 업적 목록 UI 생성
        let listHTML = '';
        for (const id in ACHIEVEMENTS) {
            const ach = ACHIEVEMENTS[id];
            const isAchieved = this.gameState.achievements[id];
            let description = ach.description;

            // 숨겨진 업적이고 아직 달성하지 못했다면 설명 숨기기
            if (ach.hidden && !isAchieved) {
                description = '숨겨진 조건입니다.';
            }

            listHTML += `
                <li id="ach-${id}" class="${isAchieved ? 'achieved' : ''}">
                    <strong>${ach.title}</strong>
                    <small>${description}</small>
                </li>
            `;
        }
        this.listEl.innerHTML = listHTML;

        // 토글 버튼 이벤트
        this.toggleBtn.addEventListener('click', () => {
            this.listEl.classList.toggle('hidden');
        });
    }

    unlock(id) {
        if (!id || !ACHIEVEMENTS[id] || this.gameState.achievements[id]) {
            return; // 없거나 이미 달성한 업적
        }

        console.log(`업적 달성: ${ACHIEVEMENTS[id].title}`);
        this.gameState.achievements[id] = true;

        // UI 업데이트
        const listItem = document.getElementById(`ach-${id}`);
        if (listItem) {
            listItem.classList.add('achieved');
            // 숨겨진 업적이었다면, 실제 설명으로 업데이트
            if (ACHIEVEMENTS[id].hidden) {
                listItem.querySelector('small').textContent = ACHIEVEMENTS[id].description;
            }
        }

        // 알림창 표시
        this.toastEl.textContent = `업적 달성: ${ACHIEVEMENTS[id].title}`;
        this.toastEl.classList.remove('hidden');
        setTimeout(() => {
            this.toastEl.classList.add('hidden');
        }, 3000); // 3초 후 사라짐
    }

    // 게임의 각 시점에서 호출될 체크 함수
    check(eventName) {
        const state = this.gameState;

        // 첫 영입
        if (eventName === 'recruit') {
            if (state.population === 1) {
                this.unlock('first_recruit');
            }
        }

        // 매일 결산 시 체크
        if (eventName === 'day_end') {
            if (state.population >= 10) this.unlock('population_10');
            if (state.wealth >= 1000) this.unlock('wealth_1000');
            if (state.land >= 1000) this.unlock('land_1000');
            if (state.force >= 500) this.unlock('force_500');
            if (state.happiness >= 200) this.unlock('happiness_200');
        }

        // 게임오버 시 체크
        if (eventName === 'game_over') {
            if (state.reason === 'population') this.unlock('gameover_no_people');
            if (state.reason === 'wealth') this.unlock('gameover_wealth');
            if (state.reason === 'land') this.unlock('gameover_land');
            if (state.reason === 'force') this.unlock('gameover_force');
            if (state.reason === 'happiness') this.unlock('gameover_happiness');
            if (state.reason === 'betrayal') this.unlock('ending_betrayed');
        }

        // 엔딩 시 체크
        if (eventName === 'ending') {
            if (state.endingType === 'A') this.unlock('ending_peace');
            if (state.endingType === 'B1') this.unlock('ending_revolution');
            if (state.endingType === 'B3') this.unlock('ending_shadow_lord');
            if (state.endingType === 'C') this.unlock('ending_new_god');

            // 직업 보유 체크
            if (state.recruitedJobs['농사꾼'] > 0) this.unlock('recruit_farmer');
            if (state.recruitedJobs['장사꾼'] > 0) this.unlock('recruit_merchant');
            if (state.recruitedJobs['무사'] > 0) this.unlock('recruit_warrior');
            if (state.recruitedJobs['암살자'] > 0) this.unlock('recruit_assassin');
            if (state.recruitedJobs['성직자'] > 0) this.unlock('recruit_cleric');
            if (state.recruitedJobs['귀족'] > 0) this.unlock('recruit_noble');
            if (state.recruitedJobs['몰락한 왕'] > 0) this.unlock('recruit_king');
            if (state.recruitedJobs['몰락한 왕'] >= 2) this.unlock('recruit_two_kings');
            if (state.population > 0 && state.population === state.recruitedJobs['암살자']) {
                this.unlock('recruit_only_assassins');
            }
        }
    }
}
