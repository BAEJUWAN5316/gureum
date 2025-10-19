import { TILE_SIZE, NPC_SPEED, JOB_DATA, JOB_SPAWN_WEIGHTS } from './constants.js';

let npcIdCounter = 0;

export class NpcController {
    constructor(gameScreen) {
        this.gameScreen = gameScreen;
        this.npcs = [];
        this.gameWidth = this.gameScreen.offsetWidth;
        this.jobTypes = Object.keys(JOB_DATA);
        this.weightedJobs = this.createWeightedJobsArray();
    }

    // 가중치에 따른 직업 배열 생성 (예: 농사꾼 18개, 암살자 8개...)
    createWeightedJobsArray() {
        const weightedArray = [];
        for (const job in JOB_SPAWN_WEIGHTS) {
            const weight = JOB_SPAWN_WEIGHTS[job] * 10; // 정수 연산을 위해 10 곱하기
            for (let i = 0; i < weight; i++) {
                weightedArray.push(job);
            }
        }
        return weightedArray;
    }

    // 가중치 배열에서 무작위 직업 선택
    getRandomJobByWeight() {
        const randomIndex = Math.floor(Math.random() * this.weightedJobs.length);
        return this.weightedJobs[randomIndex];
    }

    spawn() {
        const npcElement = document.createElement('div');
        npcElement.className = 'npc';
        const npcId = `npc-${npcIdCounter++}`;
        npcElement.id = npcId;

        // 가중치에 따른 무작위 직업 할당
        const job = this.getRandomJobByWeight();
        
        // 성별 할당 ('몰락한 왕' 제외)
        let gender = '';
        const genderedJobs = ['농사꾼', '장사꾼', '무사', '암살자', '성직자', '귀족'];
        if (genderedJobs.includes(job)) {
            gender = Math.random() < 0.5 ? '남' : '여';
        }

        // 화면에 표시될 텍스트
        npcElement.textContent = `${job}${gender ? `(${gender})` : ''}`;
        npcElement.style.fontSize = '11px';
        npcElement.style.textAlign = 'center';
        npcElement.style.lineHeight = '64px';

        const x = Math.random() * (this.gameWidth - TILE_SIZE);
        const y = -TILE_SIZE; // 화면 위에서 시작

        const npc = {
            id: npcId,
            element: npcElement,
            job: job, // 직업 정보
            gender: gender, // 성별 정보 추가
            x: x,
            y: y,
            width: TILE_SIZE,
            height: TILE_SIZE,
        };

        this.npcs.push(npc);
        this.gameScreen.appendChild(npcElement);
    }

    update() {
        this.npcs.forEach(npc => {
            npc.y += NPC_SPEED;
            // 화면 밖으로 나가면 제거 (나중에 최적화 필요)
            if (npc.y > this.gameScreen.offsetHeight) {
                this.removeNpc(npc);
            }
        });
    }

    draw() {
        this.npcs.forEach(npc => {
            npc.element.style.transform = `translate(${npc.x}px, ${npc.y}px)`;
            // 충돌 상태에 따라 테두리 색 변경
            if (npc.isColliding) {
                npc.element.style.borderColor = 'gold';
            } else {
                npc.element.style.borderColor = 'lightcoral';
            }
        });
    }

    removeNpc(npcToRemove) {
        this.npcs = this.npcs.filter(npc => npc.id !== npcToRemove.id);
        npcToRemove.element.remove();
    }

    clearAll() {
        this.npcs.forEach(npc => npc.element.remove());
        this.npcs = [];
    }
}
