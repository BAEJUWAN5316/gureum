import * as THREE from 'three';

export const gameState = {
    camera: null,
    scene: null,
    renderer: null,
    controls: null,
    floor: null,
    gun: null,
    objects: [],
    bullets: [],
    bombs: [], // New
    monsters: [],
    dyingMonsters: [],
    impactEffects: [],
    bulletMaterial: null,
    bombMaterial: null, // New
    flashMaterial: null,
    monsterMaterial: null,
    blockerElement: null,
    healthElement: null,
    instructionsElement: null,
    audioListener: null,
    audioLoader: null,
    gunSoundBuffer: null,
    gunSound: null,
    monsterDeathSoundBuffer: null,
    playerWalkSoundBuffer: null,
    playerWalkSound: null,
    monsterWalkSoundBuffer: null,
    monsterHitSoundBuffer: null,

    currentBullets: 30,
    maxBullets: 30,
    isReloading: false,
    reloadTime: 1500, // 1.5 seconds
    lastReloadTime: 0,
    reloadSoundBuffer: null,
    reloadSound: null,

    reloadCompleteSoundBuffer: null, // New
    reloadCompleteSound: null, // New
    playerHitSoundBuffer: null, // New
    playerHitSound: null, // New
    bgm: null,

    totalBombs: 3, // New

    raycaster: null,
    prevTime: performance.now(),
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),

    playerState: {
        playerHP: 100,
        isGameOver: false,
        isGameWon: false,
        lastDamageTime: 0,
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        canJump: false,
        shouldFire: false,
        shouldThrowBomb: false,
        lastShotTime: 0,
        lastBombTime: 0,
    },
};