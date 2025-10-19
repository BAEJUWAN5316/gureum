import { InputHandler } from './input.js';
import { Player } from './player.js';
import { NpcController } from './npc.js';
import { HUD } from './hud.js';
import { PersuasionMinigame } from './persuasionMinigame.js';
import { DialogueController } from './dialogue.js';
import { AchievementController } from './achievements.js';

import { NPC_SPAWN_INTERVAL, JOB_DATA, DIALOGUE_DATA, ACHIEVEMENTS } from './constants.js';

// --- 유틸리티 함수 ---
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// --- 게임 초기화 ---
window.addEventListener('load', function(){
    // DOM 요소 가져오기
    const gameScreen = document.getElementById('game-screen');
    const dayEndModal = document.getElementById('day-end-modal');
    const summaryStatsEl = document.getElementById('summary-stats');
    const summaryTitle = document.getElementById('summary-title');
    const nextDayBtn = document.getElementById('next-day-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const restartBtn = document.getElementById('restart-btn');
    const kingEventModal = document.getElementById('king-event-modal');
    const endingModal = document.getElementById('ending-modal');
    const peaceBtn = document.getElementById('peace-btn');
    const warBtn = document.getElementById('war-btn');
    const iamkingBtn = document.getElementById('iamking-btn');
    const endingTitle = document.getElementById('ending-title');
    const endingText = document.getElementById('ending-text');
    const restartBtnEnd = document.getElementById('restart-btn-end');
    const throneRoomContainer = document.getElementById('throne-room-container');
    const gameContainer = document.getElementById('game-container');

    // 게임 상태 변수
    const initialJobs = Object.keys(JOB_DATA).reduce((obj, key) => ({ ...obj, [key]: 0 }), {});
    const initialAchievements = Object.keys(ACHIEVEMENTS).reduce((obj, key) => ({ ...obj, [key]: false }), {});
    let gameState = {
        day: 1,
        wealth: 100,
        land: 100,
        force: 10,
        population: 0, // 영입으로만 증가하므로 0에서 시작
        happiness: 50,
        recruitedJobs: initialJobs, // 영입한 직업 수 추적
        persuadedVassalCount: 0, // 왕의 방에서 설득한 신하 수
        achievements: initialAchievements, // 업적 달성 상태
    };
    let gameMode = 'village'; // 현재 게임 모드 (village, throneRoom)
    let isPaused = false;
    let npcSpawnInterval = null;
    let vassals = []; // 왕의 방 신하 배열

    // 모듈 인스턴스 생성
    const input = new InputHandler();
    const player = new Player(gameScreen);
    const hud = new HUD();
    const npcController = new NpcController(gameScreen);
    const minigame = new PersuasionMinigame();
    const dialogue = new DialogueController();
    const achievements = new AchievementController(gameState);

    function startGame() {
        // 게임 상태 초기화 (필요 시)
        hud.updateStats(gameState);
        hud.startDay();
        npcSpawnInterval = setInterval(() => {
            npcController.spawn();
        }, NPC_SPAWN_INTERVAL);
        isPaused = false;
        requestAnimationFrame(gameLoop);
    }

    // --- 메인 게임 루프 ---
    let lastTime = 0;
    let collidedNpc = null; // 현재 충돌 중인 NPC
    let lastActionState = false; // 이전 프레임의 액션 키 상태

    function gameLoop(timestamp) {
        if (isPaused) {
            requestAnimationFrame(gameLoop); // 일시정지 중에도 루프는 돌려야 UI 반응 가능
            return;
        }

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // 1. 업데이트
        player.update(input.keys);
        npcController.update();
        
        // 게임 모드에 따른 업데이트 및 충돌 감지
        if (gameMode === 'village') {
            npcController.update();
            let currentlyColliding = false;
            for (const npc of npcController.npcs) {
                if (checkCollision(player, npc)) {
                    collidedNpc = npc;
                    npc.isColliding = true;
                    currentlyColliding = true;
                } else {
                    npc.isColliding = false;
                }
            }
            if (!currentlyColliding) {
                collidedNpc = null;
            }
        } else if (gameMode === 'throneRoom') {
            let currentlyColliding = false;
            for (const vassal of vassals) {
                if (checkCollision(player, vassal)) {
                    collidedNpc = vassal;
                    vassal.isColliding = true;
                    currentlyColliding = true;
                } else {
                    vassal.isColliding = false;
                }
            }
            if (!currentlyColliding) {
                collidedNpc = null;
            }
        }

        // 상호작용 로직
        if (input.keys.action && !lastActionState && collidedNpc) {
            isPaused = true; // 대화 및 미니게임 중 게임 정지
            lastActionState = true; // 연속 입력을 막기 위해 즉시 true로 설정

            if (gameMode === 'village') {
                const dialogueEntry = DIALOGUE_DATA[collidedNpc.job];
                let dialogueText = '';

                if (typeof dialogueEntry === 'string') {
                    dialogueText = dialogueEntry; // 몰락한 왕 등
                } else {
                    dialogueText = dialogueEntry[collidedNpc.gender]; // 성별에 따른 대사
                }

                dialogue.show(dialogueText)
                    .then(() => minigame.start())
                    .then(isSuccess => {
                        if (isSuccess) {
                            console.log(`설득 성공: ${collidedNpc.job}`);
                            gameState.population += 1;
                            gameState.recruitedJobs[collidedNpc.job]++;
                            hud.updateStats(gameState);
                            achievements.check('recruit'); // 업적 체크
                        } else {
                            console.log(`설득 실패: ${collidedNpc.job}`);
                        }
                        npcController.removeNpc(collidedNpc);
                        collidedNpc = null;
                        isPaused = false; // 모든 과정 후 게임 재개
                    })
                    .catch(err => {
                        console.log(err.message); // 'forced to close' 메시지 출력
                        collidedNpc = null; // 충돌 상태 초기화
                        isPaused = false; // 강제 종료 시에도 게임 재개
                    });
            } else if (gameMode === 'throneRoom' && !collidedNpc.persuaded) {
                dialogue.show(DIALOGUE_DATA[collidedNpc.id])
                    .then(() => {
                        console.log(`신하와 대화: ${collidedNpc.id}`);
                        collidedNpc.persuaded = true;
                        collidedNpc.element.classList.add('persuaded');
                        gameState.persuadedVassalCount++;
                        collidedNpc = null;
                        isPaused = false; // 대화 후 게임 재개

                        // 모든 신하를 설득했는지 확인
                        if (gameState.persuadedVassalCount === 8) {
                            isPaused = true;
                            setTimeout(() => { // 모든 UI 업데이트 후 엔딩 표시
                                gameState.endingType = 'C';
                                achievements.check('ending');
                                endingTitle.textContent = '진 엔딩: 새로운 신';
                                endingText.textContent = '모든 신하들의 이야기를 듣고 당신은 세계의 진실과 자신의 정체를 깨달았습니다.';
                                endingModal.classList.remove('hidden');
                            }, 500);
                        }
                    })
                    .catch(err => {
                        console.log(err.message);
                        collidedNpc = null;
                        isPaused = false;
                    });
            }
        }
        // 액션 키를 뗐을 때만 lastActionState를 false로 변경
        if (!input.keys.action) {
            lastActionState = false;
        }

        // 2. 그리기
        player.draw();
        if (gameMode === 'village') {
            npcController.draw();
        }

        // 다음 프레임 요청
        requestAnimationFrame(gameLoop);
    }

    // --- 이벤트 리스너 ---
    window.addEventListener('dayend', () => {
        isPaused = true;
        clearInterval(npcSpawnInterval);

        // 진행 중이던 상호작용 강제 종료
        dialogue.forceClose();
        minigame.forceClose();

        // --- 일일 결산: 영입한 직업들의 지속 효과 적용 ---
        console.log("결산 시작: 일일 수치 변화를 적용합니다.");
        let dailyChanges = { wealth: 0, land: 0, force: 0, happiness: 0 };

        for (const job in gameState.recruitedJobs) {
            const count = gameState.recruitedJobs[job];
            if (count > 0) {
                const jobStats = JOB_DATA[job];
                dailyChanges.wealth += count * jobStats.wealth;
                dailyChanges.land += count * jobStats.land;
                dailyChanges.force += count * jobStats.force;
                dailyChanges.happiness += count * jobStats.happiness;
            }
        }

        // '암살자' 특별 규칙 적용 (일일 행복도 감소 무시)
        if (dailyChanges.happiness < 0) {
            if (gameState.population > 0 && gameState.population === gameState.recruitedJobs['암살자']) {
                console.log("암살자만 있는 마을: 일일 행복도 감소 무시!");
                dailyChanges.happiness = 0;
            }
        }

        // 최종적으로 일일 변화량 적용
        gameState.wealth += dailyChanges.wealth;
        gameState.land += dailyChanges.land;
        gameState.force += dailyChanges.force;
        gameState.happiness += dailyChanges.happiness;

        // --- 게임오버 조건 확인 (업데이트된 수치로 확인) ---
        const isResourceGameOver = gameState.wealth <= 0 || gameState.land <= 0 || gameState.force <= 0 || gameState.happiness <= 0;
        const isPopulationGameOver = gameState.day >= 15 && gameState.population === 0;

        // 업적 체크 (결산 시)
        achievements.check('day_end');

        if (isResourceGameOver || isPopulationGameOver) {
            const gameOverTitle = gameOverModal.querySelector('h2');
            const gameOverText = gameOverModal.querySelector('p');

            if (isPopulationGameOver) {
                gameState.reason = 'population';
                gameOverTitle.textContent = '외로운 종말';
                gameOverText.textContent = '왕을 맞이할 주민이 아무도 남지 않았습니다...';
            } else if (gameState.recruitedJobs['암살자'] > 0) {
                gameState.reason = 'betrayal';
                gameOverTitle.textContent = '엔딩 D: 암살자의 밤';
                gameOverText.textContent = '가장 믿었던 암살자들이 당신의 모든 것을 앗아갔습니다...';
            } else {
                if (gameState.wealth <= 0) gameState.reason = 'wealth';
                else if (gameState.land <= 0) gameState.reason = 'land';
                else if (gameState.force <= 0) gameState.reason = 'force';
                else if (gameState.happiness <= 0) gameState.reason = 'happiness';
                gameOverTitle.textContent = '마을 붕괴';
                gameOverText.textContent = '마을이 붕괴되었습니다...';
            }
            achievements.check('game_over'); // 업적 체크
            gameOverModal.classList.remove('hidden');
        } else {
            // 결산 화면 표시
            summaryTitle.textContent = `Day ${gameState.day} 결산`;
            let summaryHTML = `
                <p>재력: ${gameState.wealth} (${dailyChanges.wealth >= 0 ? '+' : ''}${dailyChanges.wealth})</p>
                <p>토지: ${gameState.land} (${dailyChanges.land >= 0 ? '+' : ''}${dailyChanges.land})</p>
                <p>무력: ${gameState.force} (${dailyChanges.force >= 0 ? '+' : ''}${dailyChanges.force})</p>
                <p>인구: ${gameState.population}</p>
                <p>행복도: ${gameState.happiness} (${dailyChanges.happiness >= 0 ? '+' : ''}${dailyChanges.happiness})</p>
                <hr>
                <p><b>[현재 직업 구성]</b></p>
            `;

            let hasJobs = false;
            for (const job in gameState.recruitedJobs) {
                const count = gameState.recruitedJobs[job];
                if (count > 0) {
                    summaryHTML += `<p>${job}: ${count}명</p>`;
                    hasJobs = true;
                }
            }
            if (!hasJobs) {
                summaryHTML += `<p>영입한 주민이 없습니다.</p>`;
            }

            // 인구가 0일 때 경고 메시지 추가
            if (gameState.population === 0) {
                summaryHTML += `<p style="color: yellow;">경고: 주민이 한 명도 없습니다! 영입에 힘쓰세요!</p>`;
            }
            summaryStatsEl.innerHTML = summaryHTML;
            dayEndModal.classList.remove('hidden');
        }
    });

    nextDayBtn.addEventListener('click', () => {
        gameState.day++;
        hud.updateStats(gameState); // HUD의 날짜 업데이트
        dayEndModal.classList.add('hidden');

        // 15일차 이벤트 처리
        if (gameState.day === 15) {
            kingEventModal.classList.remove('hidden');
            return; // 일반적인 다음 날 시작을 중단
        }

        npcController.clearAll(); // 다음 날을 위해 현재 NPC들 정리
        isPaused = false;
        hud.startDay();
        npcSpawnInterval = setInterval(() => {
            npcController.spawn();
        }, NPC_SPAWN_INTERVAL);
    });

    restartBtn.addEventListener('click', () => {
        location.reload(); // 간단하게 페이지 새로고침으로 재시작
    });

    // --- 엔딩 분기 리스너 ---
    peaceBtn.addEventListener('click', () => {
        kingEventModal.classList.add('hidden');
        gameState.endingType = 'A';
        achievements.check('ending');
        endingTitle.textContent = '엔딩 A: 평화주의자';
        endingText.textContent = '당신은 왕의 제안을 받아들여, 마을의 번영과 평화를 지켰습니다.';
        endingModal.classList.remove('hidden');
    });

    warBtn.addEventListener('click', () => {
        kingEventModal.classList.add('hidden');
        
        // 승리 조건 확인
        const normalVictory = gameState.recruitedJobs['무사'] >= 5 && gameState.force >= 60;
        const assassinVictory = gameState.population > 0 && 
                                gameState.population === gameState.recruitedJobs['암살자'] && 
                                gameState.recruitedJobs['암살자'] >= 3;

        if (normalVictory || assassinVictory) {
            // 전쟁 승리
            if (assassinVictory) {
                gameState.endingType = 'B3';
                endingTitle.textContent = '엔딩 B-3: 그림자 군주';
                endingText.textContent = '당신의 암살자들이 어둠 속에서 왕을 처리했습니다. 이제 그림자 속에서 세상을 지배합니다.';
            } else {
                gameState.endingType = 'B1';
                endingTitle.textContent = '엔딩 B-1: 승리한 혁명가';
                endingText.textContent = '충분한 무사들과 강력한 무력으로 왕의 군대를 격파하고 새로운 시대의 주인이 되었습니다.';
            }
            achievements.check('ending');
            endingModal.classList.remove('hidden');
        } else {
            // 전쟁 패배 (게임오버)
            const gameOverTitle = gameOverModal.querySelector('h2');
            const gameOverText = gameOverModal.querySelector('p');
            gameOverTitle.textContent = '전쟁 패배';
            
            let reason = '힘이 부족하여 왕에게 대항할 수 없었습니다...';
            if (gameState.recruitedJobs['무사'] < 5) {
                reason = '왕에게 대항하기엔 무사의 수가 너무 적었습니다...';
            } else if (gameState.force < 60) {
                reason = '무사들은 용감했지만, 무력이 뒷받침되지 않았습니다...';
            }
            gameOverText.textContent = reason;
            gameOverModal.classList.remove('hidden');
        }
    });

    iamkingBtn.addEventListener('click', () => {
        kingEventModal.classList.add('hidden');
        isPaused = true; // 전환 중 정지

        // 1. 기존 게임 UI 숨기기
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');

        // 2. 왕의 방 화면 표시
        throneRoomContainer.classList.remove('hidden');
        gameMode = 'throneRoom';

        // 3. 신하 8명 배치
        const roomWidth = throneRoomContainer.offsetWidth;
        const roomHeight = throneRoomContainer.offsetHeight;
        const TILE_SIZE = 64;
        for (let i = 0; i < 8; i++) {
            const vassalElement = document.createElement('div');
            vassalElement.className = 'vassal';
            const vassalId = `vassal-${i}`;
            vassalElement.id = vassalId;

            // 신하 위치 지정 (4명씩 2줄)
            const x = (i % 4) * (roomWidth / 4) + (roomWidth / 8) - (TILE_SIZE / 2);
            const y = (i < 4) ? (roomHeight / 3) - (TILE_SIZE / 2) : (roomHeight * 2 / 3) - (TILE_SIZE / 2);

            vassalElement.style.transform = `translate(${x}px, ${y}px)`;
            throneRoomContainer.appendChild(vassalElement);

            vassals.push({
                id: vassalId,
                element: vassalElement,
                x: x,
                y: y,
                width: TILE_SIZE,
                height: TILE_SIZE,
                persuaded: false,
            });
        }

        // 4. 플레이어 위치 초기화 및 게임 재개
        player.x = (roomWidth - player.width) / 2;
        player.y = roomHeight - player.height - 20;
        throneRoomContainer.appendChild(document.getElementById('player')); // 플레이어 DOM 이동
        isPaused = false;
    });

    restartBtnEnd.addEventListener('click', () => {
        location.reload();
    });

    // --- 게임 시작 ---
    startGame();
});
