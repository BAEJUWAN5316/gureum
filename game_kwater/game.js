// ========== 페이지 네비게이션 ==========
function showPage(pageId) {
    // 모든 페이지 숨김
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    // 선택한 페이지만 표시
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

function goToMain() {
    showPage('mainPage');
    // 배경음악 정지
    bgmAudio.pause();
}

function goToGame() {
    showPage('gamePage');
    initGame();
}

function goToForm() {
    showPage('formPage');
    document.getElementById('infoForm').reset();
}

function goToClear() {
    showPage('clearPage');
    // 배경음악 정지
    bgmAudio.pause();
}

function submitForm(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const agree = document.getElementById('agree').checked;

    // 콘솔에 데이터 출력 (DB 저장 없음)
    console.log('=== 제출된 정보 ===');
    console.log('이름:', name);
    console.log('전화번호:', phone);
    console.log('개인정보 동의:', agree);
    console.log('==================');

    // 이벤트 종료 페이지로 이동
    showPage('endPage');
}

function shareOnSNS(platform) {
    console.log(`${platform}에 공유되었습니다.`);
    // 실제 구현 시 SNS 공유 API 연동
    alert(`${platform}에 공유했습니다!`);
}

// ========== 게임 설정 ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캐릭터 이미지
let characterImage = new Image();
characterImage.crossOrigin = 'anonymous';
characterImage.onload = function() {
    console.log('캐릭터 이미지 로딩 완료:', this.naturalWidth, 'x', this.naturalHeight);
};
characterImage.onerror = function() {
    console.error('캐릭터 이미지 로딩 실패:', this.src);
};
// 현재 페이지 위치 기반 상대 경로
let basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
if (!basePath.startsWith('/')) {
    basePath = '/' + basePath;
}
console.log('basePath:', basePath);
characterImage.src = basePath + 'assets/character.png';
console.log('characterImage.src:', characterImage.src);

// 아이템(물방울) 이미지
let itemImage = new Image();
itemImage.crossOrigin = 'anonymous';
itemImage.onload = function() {
    console.log('아이템 이미지 로딩 완료:', this.naturalWidth, 'x', this.naturalHeight);
};
itemImage.onerror = function() {
    console.error('아이템 이미지 로딩 실패:', this.src);
};
itemImage.src = basePath + 'assets/item.png';

// 배경 이미지
let backgroundImage = new Image();
backgroundImage.crossOrigin = 'anonymous';
backgroundImage.onload = function() {
    console.log('배경 이미지 로딩 완료:', this.naturalWidth, 'x', this.naturalHeight);
};
backgroundImage.onerror = function() {
    console.error('배경 이미지 로딩 실패:', this.src);
};
backgroundImage.src = basePath + 'assets/background.png';

// 발판 이미지
let platformImage = new Image();
platformImage.crossOrigin = 'anonymous';
platformImage.onload = function() {
    console.log('발판 이미지 로딩 완료:', this.naturalWidth, 'x', this.naturalHeight);
};
platformImage.onerror = function() {
    console.error('발판 이미지 로딩 실패:', this.src);
};
platformImage.src = basePath + 'assets/platform.png';

// 땅(바닥) 이미지
let groundImage = new Image();
groundImage.crossOrigin = 'anonymous';
groundImage.onload = function() {
    console.log('땅 이미지 로딩 완료:', this.naturalWidth, 'x', this.naturalHeight);
};
groundImage.onerror = function() {
    console.error('땅 이미지 로딩 실패:', this.src);
};
groundImage.src = basePath + 'assets/ground.png';

// ========== 음향 설정 ==========
// 배경음악
const bgmAudio = new Audio('assets/bgm.mp3');
bgmAudio.loop = true;
bgmAudio.volume = 0.5;

// 효과음들
const jumpSound = new Audio('assets/jump.wav');
jumpSound.volume = 0.6;

const collectSound = new Audio('assets/collect.wav');
collectSound.volume = 0.6;

const clearSound = new Audio('assets/clear.wav');
clearSound.volume = 0.7;

// 캔버스 크기 설정 (고정 360×640px)
function resizeCanvas() {
    // 고정 크기
    const fixedWidth = 360;
    const fixedHeight = 640;

    // 간단한 방식: DPI 스케일링 없이 고정 크기로 설정
    canvas.width = fixedWidth;
    canvas.height = fixedHeight;

    // CSS 표시 크기도 동일하게
    canvas.style.width = fixedWidth + 'px';
    canvas.style.height = fixedHeight + 'px';

    console.log('캔버스 크기 설정:', canvas.width, 'x', canvas.height);
}

// 게임 상태
const gameState = {
    isRunning: false,
    dropsCollected: 0,
    totalDrops: 4,
    lastFrameTime: 0,
    deltaTime: 0,
    debugMode: true, // 디버깅 로그 활성화
    jumpDebugLogged: false,
    jumpFrameCount: 0
};

// 플레이어 객체
// 모든 속도는 픽셀/초(px/s) 단위로 정의됨 (프레임 레이트 무관)
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    speed: 270,  // 이동 속도 (픽셀/초) - 기존: 4.5 × 60fps ≈ 270px/s
    jumpPower: 700,  // 점프 초기 속도 (픽셀/초) - 기존: 10 × 60fps = 600px/s
    isJumping: false,
    isFalling: false,
    canJump: false,
    direction: 1 // 1: 오른쪽, -1: 왼쪽
};

// 중력과 물리
// 모든 값은 픽셀/초² 단위로 정의됨 (프레임 레이트 무관)
const physics = {
    gravity: 1800,  // 중력 (픽셀/초²) - 기존: 0.30 × 60² ≈ 1080, 조정: 1800
    friction: 0.8,
    maxFallSpeed: 900  // 최대 낙하 속도 (픽셀/초) - 기존: 15 × 60 = 900px/s
};

// 플랫폼 배열
let platforms = [];

// 아이템 (물방울) 배열
let drops = [];

// 키 입력 상태
const keys = {};

// 가상 조이스틱 상태
const joystick = {
    isActive: false,
    x: 0,
    y: 0,
    centerX: 0,
    centerY: 0,
    radius: 65, // 조이스틱 반지름
    maxDistance: 40, // 최대 이동 거리
    inputX: 0,
    inputY: 0,
    touchId: null
};

// ========== 게임 초기화 ==========
function initGame() {
    resizeCanvas();
    gameState.isRunning = true;
    gameState.dropsCollected = 0;
    gameState.lastFrameTime = 0;  // deltaTime 계산을 위해 초기화
    gameState.deltaTime = 0.016;

    // 플레이어 초기 위치 설정
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 150;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.isFalling = false;
    player.canJump = false;

    // 플랫폼 생성
    createPlatforms();

    // 물방울 생성
    createDrops();

    // 가상 조이스틱 초기화
    initializeVirtualJoystick();

    // 배경음악 재생
    bgmAudio.currentTime = 0;
    bgmAudio.play().catch(() => {
        // 자동 재생 실패 시 무시 (모바일에서 사용자 인터랙션 필요)
    });

    // 게임 루프 시작
    requestAnimationFrame(gameLoop);
}

function createPlatforms() {
    platforms = [];

    // 바닥 (360×50px)
    platforms.push({
        x: 0,
        y: 590,  // 640 - 50
        width: 360,
        height: 50,
        color: '#87CEEB'
    });

    // 플랫폼들 (다양한 높이에 배치)
    const platformConfigs = [
        { x: 30, y: 470, width: 150, height: 20 },      // 640 - 170
        { x: 180, y: 420, width: 150, height: 20 },     // 640 - 220
        { x: 60, y: 340, width: 150, height: 20 },      // 640 - 300
        { x: 150, y: 290, width: 150, height: 20 },     // 640 - 350
        { x: 105, y: 210, width: 150, height: 20 }      // 640 - 430
    ];

    platformConfigs.forEach(config => {
        platforms.push({
            x: config.x,
            y: config.y,
            width: config.width,
            height: config.height,
            color: '#ADD8E6'
        });
    });
}

function createDrops() {
    drops = [];

    // 물방울 4개를 서로 다른 플랫폼에 배치 (고정 캔버스 360×640px 기준)
    const dropPositions = [
        { x: 120, y: 460 },   // 640 - 180
        { x: 230, y: 410 },   // 360 - 130 = 230, 640 - 230
        { x: 170, y: 310 },   // 640 - 330
        { x: 260, y: 260 }    // 360 - 100 = 260, 640 - 380
    ];

    dropPositions.forEach((pos, index) => {
        drops.push({
            x: pos.x,
            y: pos.y,
            radius: 15,
            collected: false,
            color: '#1E90FF',
            glowIntensity: 0,
            id: index
        });
    });
}

// ========== 가상 조이스틱 초기화 ==========
function initializeVirtualJoystick() {
    const joystickElement = document.getElementById('virtualJoystick');
    if (!joystickElement) return;

    const rect = joystickElement.getBoundingClientRect();
    joystick.centerX = rect.left + rect.width / 2;
    joystick.centerY = rect.top + rect.height / 2;

    // 터치 이벤트
    document.addEventListener('touchstart', handleJoystickTouchStart, { passive: false });
    document.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    document.addEventListener('touchend', handleJoystickTouchEnd);

    // 마우스 이벤트 (디버깅/데스크톱)
    document.addEventListener('mousedown', handleJoystickMouseDown);
    document.addEventListener('mousemove', handleJoystickMouseMove);
    document.addEventListener('mouseup', handleJoystickMouseUp);
}

// 터치 시작
function handleJoystickTouchStart(e) {
    const touch = e.touches[0];
    const joystickElement = document.getElementById('virtualJoystick');
    if (!joystickElement) return;

    const rect = joystickElement.getBoundingClientRect();
    const dx = touch.clientX - rect.left - rect.width / 2;
    const dy = touch.clientY - rect.top - rect.height / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 조이스틱 영역 내에서만 활성화
    if (distance < rect.width / 2) {
        e.preventDefault();
        joystick.isActive = true;
        joystick.touchId = touch.identifier;
        updateJoystickPosition(touch.clientX, touch.clientY);

        if (gameState.debugMode) {
            console.log('터치 시작! dy:', dy.toFixed(2), 'inputY:', joystick.inputY.toFixed(2));
        }
    }
}

// 터치 이동
function handleJoystickTouchMove(e) {
    if (!joystick.isActive) return;

    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === joystick.touchId) {
            e.preventDefault();
            updateJoystickPosition(e.touches[i].clientX, e.touches[i].clientY);

            if (gameState.debugMode && joystick.inputY < -0.2) {
                console.log('터치 이동 - inputY:', joystick.inputY.toFixed(2));
            }
            break;
        }
    }
}

// 터치 종료
function handleJoystickTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystick.touchId) {
            resetJoystick();
            break;
        }
    }
}

// 마우스 이벤트 (데스크톱)
function handleJoystickMouseDown(e) {
    const joystickElement = document.getElementById('virtualJoystick');
    if (!joystickElement || !joystickElement.contains(e.target)) return;

    const rect = joystickElement.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < rect.width / 2) {
        joystick.isActive = true;
        updateJoystickPosition(e.clientX, e.clientY);
    }
}

function handleJoystickMouseMove(e) {
    if (!joystick.isActive) return;
    updateJoystickPosition(e.clientX, e.clientY);
}

function handleJoystickMouseUp() {
    resetJoystick();
}

// 조이스틱 위치 업데이트
function updateJoystickPosition(clientX, clientY) {
    const joystickElement = document.getElementById('virtualJoystick');
    const rect = joystickElement.getBoundingClientRect();

    // 조이스틱 중심으로부터의 거리
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = joystick.maxDistance;

    // 최대 거리 제한
    if (distance > maxDist) {
        const angle = Math.atan2(dy, dx);
        joystick.x = Math.cos(angle) * maxDist;
        joystick.y = Math.sin(angle) * maxDist;
    } else {
        joystick.x = dx;
        joystick.y = dy;
    }

    // 정규화된 입력값 (0~1)
    joystick.inputX = joystick.x / maxDist;
    joystick.inputY = joystick.y / maxDist;

    // 핸들 위치 업데이트
    const handle = document.getElementById('joystickHandle');
    if (handle) {
        const offsetX = (joystick.x / maxDist) * 40;
        const offsetY = (joystick.y / maxDist) * 40;
        handle.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    }
}

// 조이스틱 리셋
function resetJoystick() {
    joystick.isActive = false;
    joystick.x = 0;
    joystick.y = 0;
    joystick.inputX = 0;
    joystick.inputY = 0;
    joystick.touchId = null;

    const handle = document.getElementById('joystickHandle');
    if (handle) {
        handle.style.transform = 'translate(-50%, -50%)';
    }

    // 디버깅: 조이스틱이 제대로 초기화되는지 로그
    if (gameState.debugMode) {
        console.log('조이스틱 리셋 - inputY:', joystick.inputY);
    }
}

// 터치 이벤트 최적화
document.addEventListener('touchmove', (e) => {
    // 게임 화면에서는 기본 스크롤 방지
    if (e.target.closest('#gamePage')) {
        e.preventDefault();
    }
}, { passive: false });

// ========== 게임 업데이트 ==========
function updateGame() {
    // 완전한 시간 기반 물리 시스템
    // 모든 속도는 픽셀/초(px/s) 단위, 가속도는 픽셀/초²(px/s²) 단위로 정의됨
    //
    // 핵심 원리:
    // - 위치 = 속도 × deltaTime
    // - 속도 = 속도 + 가속도 × deltaTime
    //
    // 이렇게 하면 프레임 레이트에 관계없이 모든 기기에서 물리가 정확히 동일함
    // 60FPS에서 0.016초 × 작은값 = 결과
    // 120FPS에서 0.008초 × 작은값(반) = 동일한 결과
    const timeScale = gameState.deltaTime / 0.016;  // 참고용 (사용하지 않음)

    // 디버깅: 매 프레임 정보 (처음 3프레임만)
    if (gameState.debugMode && gameState.frameCount !== undefined) {
        if (gameState.frameCount < 3) {
            console.log(`프레임 ${gameState.frameCount} - deltaTime: ${gameState.deltaTime.toFixed(6)}, timeScale: ${timeScale.toFixed(4)}`);
            gameState.frameCount++;
        }
    } else if (gameState.debugMode) {
        gameState.frameCount = 0;
    }

    // 플레이어 움직임 처리 (가상 조이스틱 또는 키보드)
    // 시간 기반 이동 (모든 기기에서 동일한 속도)
    // 계산식: velocityX = 입력값 × speed (픽셀/초 단위)
    // 위치 업데이트: player.x += player.velocityX * deltaTime
    player.velocityX = 0;

    // 가상 조이스틱 X축 입력 (좌우 이동)
    if (Math.abs(joystick.inputX) > 0.2) {
        player.velocityX = joystick.inputX * player.speed;  // speed는 이미 px/s 단위
        // 이동 방향 업데이트
        if (joystick.inputX > 0) {
            player.direction = -1; // 오른쪽 이동 시 왼쪽 반전
        } else if (joystick.inputX < 0) {
            player.direction = 1; // 왼쪽 이동 시 원본
        }
    }

    // 점프 처리: 조이스틱 위로 밀기 (Y < -0.3) 또는 키보드 입력
    // 더 낮은 임계값(-0.3)으로 모바일에서 더 쉽게 점프할 수 있도록
    const joystickJump = joystick.isActive && joystick.inputY < -0.3;
    let jumpThisFrame = false;
    if ((joystickJump || keys[' '] || keys['w']) && player.canJump) {
        // 점프 초기 속도 설정 (픽셀/초 단위)
        // 이 값은 매 프레임 중력으로 감소함
        player.velocityY = -player.jumpPower;  // jumpPower는 px/s 단위
        player.isJumping = true;
        player.canJump = false;
        jumpThisFrame = true; // 이 프레임에 점프가 발생했음을 표시
        gameState.jumpFrameCount = 0; // 점프 프레임 카운터 리셋

        // 디버깅 로그 (첫 점프에만)
        if (!gameState.jumpDebugLogged) {
            console.log('=== 점프 실행! ===');
            console.log('jumpPower (px/s):', player.jumpPower);
            console.log('joystick.inputY:', joystick.inputY.toFixed(3));
            console.log('deltaTime:', gameState.deltaTime.toFixed(6));
            gameState.jumpDebugLogged = true;
            setTimeout(() => { gameState.jumpDebugLogged = false; }, 200);
        }

        // 점프 사운드 재생
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
    }

    // 중력 적용 (점프 직후 첫 프레임은 제외 - 점프 velocityY가 이미 설정됨)
    // 시간 기반 중력 (모든 기기에서 동일한 가속도)
    // 계산: velocityY += gravity × deltaTime
    // gravity는 픽셀/초² 단위
    let gravityApplied = 0;
    if (!player.canJump && !jumpThisFrame) {
        gravityApplied = physics.gravity * gameState.deltaTime;
        player.velocityY += gravityApplied;
        if (player.velocityY > physics.maxFallSpeed) {
            player.velocityY = physics.maxFallSpeed;
        }
    }

    // 위치 업데이트 (시간 기반)
    // 속도(픽셀/초) × 경과시간(초) = 이동거리(픽셀)
    player.x += player.velocityX * gameState.deltaTime;
    player.y += player.velocityY * gameState.deltaTime;

    // 디버깅: 점프 중 Y 좌표 변화 로깅 (처음 10프레임만)
    if (gameState.debugMode && player.isJumping && gameState.jumpFrameCount < 10) {
        gameState.jumpFrameCount++;
        console.log(`점프 프레임 ${gameState.jumpFrameCount} - y: ${Math.round(player.y)}, velocityY: ${player.velocityY.toFixed(3)}, gravity: ${gravityApplied.toFixed(4)}, timeScale: ${timeScale.toFixed(4)}, deltaTime: ${gameState.deltaTime.toFixed(6)}`);
    }

    // 화면 경계 처리
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    // 낙사 처리
    if (player.y > canvas.height) {
        player.y = canvas.height - 150;
        player.velocityY = 0;
    }

    // 플랫폼 충돌 감지
    player.canJump = false;
    platforms.forEach(platform => {
        if (isColliding(player, platform)) {
            // 플레이어가 플랫폼 위에 있으면 (아래에서 떨어지고 있을 때만)
            // 착지 범위: 평상시 5픽셀 + 속도 고려 (빠르게 내려오면 더 관대하게)
            const landingTolerance = 5 + Math.abs(player.velocityY) * 0.1;
            if (player.velocityY >= 0 && player.y + player.height <= platform.y + landingTolerance) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.canJump = true;
                player.isJumping = false;
            }
        }
    });

    // 물방울 수집 감지
    drops.forEach(drop => {
        if (!drop.collected && isCollidingWithDrop(player, drop)) {
            drop.collected = true;
            gameState.dropsCollected++;
            document.getElementById('dropCount').textContent = gameState.dropsCollected;

            // 수집 사운드 재생
            collectSound.currentTime = 0;
            collectSound.play().catch(() => {});

            // 모든 물방울 수집 시 클리어
            if (gameState.dropsCollected === gameState.totalDrops) {
                gameState.isRunning = false;
                // 클리어 사운드 재생
                bgmAudio.pause();
                clearSound.currentTime = 0;
                clearSound.play().catch(() => {});
                setTimeout(() => goToClear(), 500);
            }
        }
    });

    // 물방울 애니메이션 (시간 기반)
    // 글로우 속도: 라디안/초 단위
    const glowSpeed = Math.PI;  // 초당 π 라디안 진행
    drops.forEach(drop => {
        drop.glowIntensity = (drop.glowIntensity + glowSpeed * gameState.deltaTime) % (Math.PI * 2);
    });
}

// 충돌 감지 (플레이어와 플랫폼)
function isColliding(player, platform) {
    return (
        player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y < platform.y + platform.height &&
        player.y + player.height > platform.y
    );
}

// 충돌 감지 (플레이어와 물방울)
function isCollidingWithDrop(player, drop) {
    const dx = (player.x + player.width / 2) - drop.x;
    const dy = (player.y + player.height / 2) - drop.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < player.width / 2 + drop.radius;
}

// ========== 게임 렌더링 ==========
function drawGame() {
    // 배경 그리기
    drawBackground();

    // 플랫폼 그리기
    platforms.forEach((platform, index) => {
        // 첫 번째는 바닥(ground), 나머지는 발판(platform)
        if (index === 0) {
            // 땅(바닥) 그리기
            if (groundImage && groundImage.complete && groundImage.naturalWidth > 0) {
                try {
                    // 이미지가 로드되면 타일 패턴으로 반복
                    let x = 0;
                    while (x < 360) {
                        ctx.drawImage(groundImage, x, platform.y, platform.width, platform.height);
                        x += groundImage.naturalWidth;
                    }
                } catch (e) {
                    console.error('땅 이미지 렌더링 오류:', e);
                    ctx.fillStyle = platform.color;
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                }
            } else {
                // 이미지 로딩 중일 때 대체 색상
                ctx.fillStyle = platform.color;
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        } else {
            // 발판 그리기
            if (platformImage && platformImage.complete && platformImage.naturalWidth > 0) {
                try {
                    ctx.drawImage(platformImage, platform.x, platform.y, platform.width, platform.height);
                } catch (e) {
                    console.error('발판 이미지 렌더링 오류:', e);
                    ctx.fillStyle = platform.color;
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                }
            } else {
                // 이미지 로딩 중일 때 대체 색상
                ctx.fillStyle = platform.color;
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                // 플랫폼 테두리
                ctx.strokeStyle = '#4682B4';
                ctx.lineWidth = 2;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
    });

    // 물방울 그리기
    drops.forEach(drop => {
        if (!drop.collected) {
            drawDrop(drop);
        }
    });

    // 플레이어 그리기
    drawPlayer();
}

function drawBackground() {
    // 배경 이미지 그리기
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        try {
            // 이미지를 캔버스 크기에 맞춰 그리기 (360x640)
            ctx.drawImage(backgroundImage, 0, 0, 360, 640);
        } catch (e) {
            console.error('배경 이미지 렌더링 오류:', e);
            // 그라데이션으로 폴백
            const gradient = ctx.createLinearGradient(0, 0, 0, 640);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F6FF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 360, 640);
        }
    } else {
        // 이미지 로딩 중일 때 대체 배경 (하늘 그라데이션)
        const gradient = ctx.createLinearGradient(0, 0, 0, 640);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 360, 640);
    }
}

function drawPlayer() {
    // 디버깅: 첫 프레임에만 로그
    if (gameState.debugFrame === undefined) {
        gameState.debugFrame = 0;
        console.log('=== drawPlayer 호출됨 ===');
        console.log('characterImage.complete:', characterImage.complete);
        console.log('characterImage.naturalWidth:', characterImage.naturalWidth);
        console.log('player.x:', player.x, 'player.y:', player.y);
    }

    // character 이미지가 로드되었는지 확인
    const imageLoaded = characterImage && characterImage.complete && characterImage.naturalWidth > 0 && characterImage.naturalHeight > 0;

    if (imageLoaded) {
        // 이미지가 로드되면 이미지만 표시
        try {
            const imgHeight = player.height;
            // 이미지 비율 유지하며 높이에 맞춤
            const imgWidth = (characterImage.naturalWidth / characterImage.naturalHeight) * imgHeight;
            const xOffset = (player.width - imgWidth) / 2; // 중앙 정렬

            // 방향에 따라 이미지 반전
            ctx.save();

            if (player.direction === -1) {
                // 왼쪽 방향: 좌우 반전
                ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
                ctx.scale(-1, 1);
                ctx.translate(-player.x - player.width / 2, -player.y - player.height / 2);
                ctx.drawImage(characterImage, player.x + xOffset, player.y, imgWidth, imgHeight);
            } else {
                // 오른쪽 방향: 일반
                ctx.drawImage(characterImage, player.x + xOffset, player.y, imgWidth, imgHeight);
            }
            ctx.restore();

            if (gameState.debugFrame === 0) {
                console.log('캐릭터 이미지 렌더링 성공');
            }
        } catch (e) {
            console.error('캐릭터 렌더링 오류:', e);
            // 오류 발생 시 대체 그래픽
            ctx.fillStyle = '#FF6B9D';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    } else {
        // 이미지 로딩 중일 때만 대체 그래픽 표시
        if (gameState.debugFrame === 0) {
            console.log('캐릭터 이미지 미로드 - 대체 그래픽 표시 중');
        }
        ctx.fillStyle = '#FF6B9D';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // 테두리
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, player.width, player.height);
    }
}

function drawDrop(drop) {
    // 아이템 이미지 그리기
    if (itemImage && itemImage.complete && itemImage.naturalWidth > 0) {
        try {
            const itemHeight = drop.radius * 2;
            // 이미지 비율 유지하며 높이에 맞춤
            const itemWidth = (itemImage.naturalWidth / itemImage.naturalHeight) * itemHeight;
            const glowAmount = Math.sin(drop.glowIntensity) * 0.5 + 1;

            // 글로우 효과
            ctx.fillStyle = `rgba(30, 144, 255, ${0.2 * glowAmount})`;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, itemHeight / 2 + 5, 0, Math.PI * 2);
            ctx.fill();

            // 이미지 그리기 (중앙 정렬)
            ctx.drawImage(itemImage, drop.x - itemWidth / 2, drop.y - itemHeight / 2, itemWidth, itemHeight);
        } catch (e) {
            console.error('아이템 렌더링 오류:', e);
            // 오류 시 대체 그래픽
            const glowAmount = Math.sin(drop.glowIntensity) * 0.5 + 1;
            ctx.fillStyle = `rgba(30, 144, 255, ${0.3 * glowAmount})`;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius + 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = drop.color;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // 이미지 로딩 중일 때 대체 그래픽 (원형)
        const glowAmount = Math.sin(drop.glowIntensity) * 0.5 + 1;

        // 글로우 효과
        ctx.fillStyle = `rgba(30, 144, 255, ${0.3 * glowAmount})`;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius + 5, 0, Math.PI * 2);
        ctx.fill();

        // 물방울 본체
        ctx.fillStyle = drop.color;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();

        // 물방울 테두리
        ctx.strokeStyle = '#0047AB';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 반짝임
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(drop.x - 5, drop.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 게임 루프 ==========
function gameLoop(currentTime) {
    if (!gameState.isRunning) {
        return;
    }

    // deltaTime 계산 (초 단위, 최대 0.016s = 60FPS 기준)
    if (gameState.lastFrameTime === 0) {
        gameState.lastFrameTime = currentTime;
        gameState.deltaTime = 0.016; // 첫 프레임은 기본값
    } else {
        gameState.deltaTime = Math.min((currentTime - gameState.lastFrameTime) / 1000, 0.016);
    }
    gameState.lastFrameTime = currentTime;

    updateGame();
    drawGame();

    requestAnimationFrame(gameLoop);
}

// ========== 윈도우 리사이즈 처리 ==========
window.addEventListener('resize', () => {
    if (gameState.isRunning) {
        resizeCanvas();
    }
});

// ========== 초기화 ==========
window.addEventListener('DOMContentLoaded', () => {
    showPage('mainPage');
});
