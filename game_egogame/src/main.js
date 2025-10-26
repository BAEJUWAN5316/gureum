
// Version 1.0.1
import { isKeyDown } from './input.js';
// Force cache refresh: v1.1
import { Player } from './entities/player.js';
import { NPC } from './entities/npc.js';
import { Door } from './entities/door.js';
import { World, getRandomSpawnPoints } from './world.js';
import { Camera } from './systems/camera.js';
import { DialogueManager } from './systems/dialogue.js';
import { DialogBox } from './ui/dialogBox.js';
import { HUD } from './ui/hud.js';
import { FollowSystem } from './systems/follow.js';
import { SoundManager } from './systems/sound.js';
import { AssetLoader } from './systems/assetLoader.js';


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions (from setting.md, assuming a reasonable size for a web game)
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450; // 16:9 aspect ratio

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const assetLoader = new AssetLoader();
let soundManager; // Declared here, initialized in initGame

let world;
let player;
let camera;
let dialogueManager;
let dialogBox;
let hud;
let followSystem;
let door;

const npcs = [];
const party = []; // To keep track of recruited NPCs

let lastTime = 0;
let spacePressedLastFrame = false; // To detect rising edge of spacebar

// Environment variable for product URL, loaded from file
let PRODUCT_URL = ""; // Placeholder, will be loaded from url.txt

// Game States
const GAME_STATE_MENU = 'menu';
const GAME_STATE_PLAYING = 'playing';
const GAME_STATE_CLEARED = 'cleared';
let gameState = GAME_STATE_MENU;

// Button definitions for menu and clear screens
const startButton = {
    x: GAME_WIDTH / 2 - 75,
    y: GAME_HEIGHT / 2 + 50,
    width: 150,
    height: 40,
    text: '게임 시작',
};

const learnMoreButton = {
    x: GAME_WIDTH / 2 - 75,
    y: GAME_HEIGHT / 2 + 50,
    width: 150,
    height: 40,
    text: '더 알아보기',
};

const gameLoop = (timestamp) => {
    const deltaTime = (timestamp - lastTime) / 1000; // convert to seconds
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
};

async function initGameAssets() {
    // Load NPC data
    const response = await fetch('/game_egogame/data/npcs.json');
    const npcData = await response.json();

    // Load PRODUCT_URL from url.txt
    const urlResponse = await fetch('/game_egogame/url.txt');
    PRODUCT_URL = await urlResponse.text();
    

    // Load images
    await assetLoader.loadImages({
        player: '/game_egogame/assets/player.png',
        tiles: '/game_egogame/assets/tiles.png',
        npc_luna: '/game_egogame/assets/npc_luna.png',
        npc_khan: '/game_egogame/assets/npc_khan.png',
        npc_mio: '/game_egogame/assets/npc_mio.png',
        ui: '/game_egogame/assets/ui.png',
        background: '/game_egogame/assets/background.png',
        sound_on: '/game_egogame/assets/sound_on.png',
        sound_off: '/game_egogame/assets/sound_off.png',
        title: '/game_egogame/assets/title.png',
        start_bg: '/game_egogame/assets/start.png', // Add start screen background
    });

    // Initialize SoundManager after other initializations
    soundManager = new SoundManager();

    // Instantiate game entities after assets are loaded
    world = new World(assetLoader);
    player = new Player(50, GAME_HEIGHT - 50, assetLoader);
    camera = new Camera(GAME_WIDTH, GAME_HEIGHT);
    dialogueManager = new DialogueManager();
    dialogBox = new DialogBox(GAME_WIDTH, GAME_HEIGHT);
    hud = new HUD(GAME_WIDTH, GAME_HEIGHT, assetLoader); // Pass assetLoader
    followSystem = new FollowSystem();
    door = new Door(world.mapWidth * world.tileSize - 100, (world.mapHeight - 1) * world.tileSize - 96, assetLoader);

    // Get random spawn points for NPCs
    const spawnPoints = getRandomSpawnPoints(world, 3);

    // Create NPCs
    const npcImageIDMap = {
        'ally_1': 'npc_luna',
        'ally_2': 'npc_khan',
        'ally_3': 'npc_mio',
    };

    for (let i = 0; i < 3; i++) {
        const data = npcData[i];
        const spawnPos = spawnPoints[i];
        const npcImageID = npcImageIDMap[data.id];
        
        npcs.push(new NPC(data.id, data.name, spawnPos.x, spawnPos.y, data.dialogue, data.speed, assetLoader, npcImageID));
    }

    
}

// Call initGameAssets once to load everything
initGameAssets();

function update(deltaTime) {
    
    // Game logic depends on state
    switch (gameState) {
        case GAME_STATE_PLAYING:
            const input = {
                left: isKeyDown('ArrowLeft'),
                right: isKeyDown('ArrowRight'),
                up: isKeyDown('ArrowUp'),
                space: isKeyDown('Space'),
            };

            // Handle dialogue progression or interaction
            if (input.space && !spacePressedLastFrame) {
                if (dialogueManager.isOpen) {
                    dialogueManager.nextSentence();
                    soundManager.playSound('dialogue_next');
                } else {
                    // Check for interaction with NPCs
                    let interacted = false;
                    for (const npc of npcs) {
                        const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2));
                        if (dist < player.interactRadius + npc.width / 2 && !npc.isRecruited) {
                            dialogueManager.startDialogue(npc, (recruitedNPC) => {
                                recruitedNPC.isRecruited = true;
                                party.push(recruitedNPC);
                                hud.updateAllyCount(party.length);
                                soundManager.playSound('recruit_success');
                                console.log(`${recruitedNPC.name} has been recruited! Party size: ${party.length}`);
                            });
                            interacted = true;
                            break; // Only interact with one NPC at a time
                        }
                    }

                    // Check for interaction with Door if no NPC was interacted with
                    if (!interacted) {
                        const distToDoor = Math.sqrt(Math.pow(player.x - door.x, 2) + Math.pow(player.y - door.y, 2));
                        if (distToDoor < player.interactRadius + door.width / 2) {
                            if (door.canOpen(party.length)) {
                                door.open();
                                soundManager.playSound('door_open');
                                gameState = GAME_STATE_CLEARED; // Change state to cleared
                            } else {
                                console.log("동료를 3명 모두 영입해야 문이 열립니다."); // Show hint
                                // TODO: Integrate with a proper UI hint system
                            }
                        }
                    }
                }
            }
            spacePressedLastFrame = input.space;

            // Only update player if not in dialogue
            if (!dialogueManager.isOpen) {
                player.update(deltaTime, input, world, soundManager);
            }

            // Record player position for follow system
            followSystem.recordPlayerPosition(player);

            // Update camera to follow player
            camera.update(player.x, player.y, world.mapWidth * world.tileSize, world.mapHeight * world.tileSize);

            // Update NPCs
            for (const npc of npcs) {
                npc.update(deltaTime);
            }

            // Update followers
            followSystem.updateFollowers(party, deltaTime);
            break;
        case GAME_STATE_MENU:
        case GAME_STATE_CLEARED:
            // No update logic for menu or cleared state, just wait for input
            break;
    }
}

function draw() {
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Drawing logic depends on state
    switch (gameState) {
        case GAME_STATE_MENU:
            drawMenu();
            break;
        case GAME_STATE_PLAYING:
            drawPlaying();
            break;
        case GAME_STATE_CLEARED:
            drawCleared();
            break;
    }

    // Reset text alignment
    ctx.textAlign = 'left';
}

function drawMenu() {
    const bgImg = assetLoader.getImage('start_bg');
    if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Draw title image
    const titleImg = assetLoader.getImage('title');
    if (titleImg) {
        const imgWidth = titleImg.width;
        const imgHeight = titleImg.height;
        ctx.drawImage(titleImg, (GAME_WIDTH - imgWidth) / 2, GAME_HEIGHT / 2 - 150, imgWidth, imgHeight);
    }

    ctx.fillStyle = 'black'; // Change text color to black
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('조작키: ←/→ 이동, ↑ 점프, 스페이스바 상호작용', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    ctx.fillText('고양이 친구들을 모두 데리고 문을 찾아 열어주세요!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);

    // Draw Start Button
    ctx.fillStyle = 'blue';
    ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
    ctx.fillStyle = 'white'; // Keep button text white
    ctx.font = '20px Arial';
    ctx.fillText(startButton.text, GAME_WIDTH / 2, startButton.y + startButton.height / 2 + 7);
}

function drawPlaying() {
    const cameraPos = camera.getPosition();

    // Draw world
    world.draw(ctx, cameraPos.x, cameraPos.y); 

    // Draw NPCs
    for (const npc of npcs) {
        npc.draw(ctx, cameraPos.x, cameraPos.y);
    }

    // Draw Door
    door.draw(ctx, cameraPos.x, cameraPos.y);

    // Draw player
    player.draw(ctx, cameraPos.x, cameraPos.y); 

    // Draw HUD
    hud.draw(ctx);

    // Draw dialogue box if open
    if (dialogueManager.isOpen) {
        dialogBox.draw(ctx, dialogueManager.getCurrentDialogue());
    }
}

function drawCleared() {
    const bgImg = assetLoader.getImage('start_bg');
    if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    ctx.fillStyle = 'black'; // Change text color to black
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('모든 고양이 친구들을 모았어요!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

    // Draw Learn More Button
    ctx.fillStyle = 'green';
    ctx.fillRect(learnMoreButton.x, learnMoreButton.y, learnMoreButton.width, learnMoreButton.height);
    ctx.fillStyle = 'white'; // Keep button text white
    ctx.font = '20px Arial';
    ctx.fillText('가보자고!', GAME_WIDTH / 2, learnMoreButton.y + learnMoreButton.height / 2 + 7);
}

// Mouse click handler for buttons
canvas.addEventListener('click', async (event) => { // Make the handler async
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    

    if (gameState === GAME_STATE_MENU) {
        if (mouseX > startButton.x && mouseX < startButton.x + startButton.width &&
            mouseY > startButton.y && mouseY < startButton.y + startButton.height) {
            console.log('Start button clicked! Transitioning to PLAYING state.');
            
            // Unlock audio and wait for it to be ready
            await soundManager.unlockAudioContext(); 

            // Now that the context is unlocked and sounds are loaded, change state and play BGM
            gameState = GAME_STATE_PLAYING;
            soundManager.playBGM();
            
            // Game loop is already running, just transition state
        }
    } else if (gameState === GAME_STATE_PLAYING) {
        // Check if sound icon was clicked
        if (hud.isSoundIconClicked(mouseX, mouseY)) {
            hud.toggleSound();
            soundManager.toggleMute();
        }
    } else if (gameState === GAME_STATE_CLEARED) {
        if (mouseX > learnMoreButton.x && mouseX < learnMoreButton.x + learnMoreButton.width &&
            mouseY > learnMoreButton.y && mouseY < learnMoreButton.y + learnMoreButton.height) {
            window.location.href = PRODUCT_URL;
        }
    }
});

// Start the game loop immediately, it will handle states
requestAnimationFrame(gameLoop);