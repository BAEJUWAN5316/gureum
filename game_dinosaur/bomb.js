import { gameState } from './game_state.js';
import { createImpactEffect } from './effects.js';

const BOMB_RADIUS = 1.5;
const BOMB_DAMAGE = 5;
export const EXPLOSION_RADIUS = 100;
const BOMB_COOLDOWN = 1000; // 1 second cooldown

export function throwBomb() {
    if (gameState.totalBombs <= 0) return; // No bombs left
    if (gameState.playerState.shouldThrowBomb && performance.now() - gameState.playerState.lastBombTime < BOMB_COOLDOWN) return; // Cooldown

    gameState.totalBombs--;

    const bombGeometry = new THREE.SphereGeometry(BOMB_RADIUS, 16, 16);
    const bomb = new THREE.Mesh(bombGeometry, gameState.bombMaterial);

    const cameraWorldPosition = new THREE.Vector3();
    gameState.camera.getWorldPosition(cameraWorldPosition);

    const cameraForward = new THREE.Vector3();
    gameState.camera.getWorldDirection(cameraForward);

    // Spawn bomb slightly in front of the camera
    const bombSpawnPosition = cameraWorldPosition.add(cameraForward.multiplyScalar(5));
    bomb.position.copy(bombSpawnPosition);

    // Apply initial velocity for parabolic trajectory
    const initialSpeed = 60; // Adjusted speed
    const upwardAngle = 0.6; // Radians, adjust for desired arc

    const bombVelocity = new THREE.Vector3();
    bombVelocity.copy(cameraForward);
    bombVelocity.multiplyScalar(initialSpeed * Math.cos(upwardAngle));
    bombVelocity.y += initialSpeed * Math.sin(upwardAngle); // Add upward component

    bomb.velocity = bombVelocity;
    bomb.userData.life = 0;
    bomb.userData.isExploded = false;
    bomb.userData.detonationTime = performance.now() + 2000; // Explode after 2 seconds
    gameState.bombs.push(bomb);
    gameState.scene.add(bomb);

    gameState.playerState.lastBombTime = performance.now(); // Update last bomb time
}

export function updateBombs(delta, time) {
    for (let i = gameState.bombs.length - 1; i >= 0; i--) {
        const bomb = gameState.bombs[i];
        if (bomb.userData.isExploded) continue;

        // Apply gravity
        bomb.velocity.y -= 9.8 * 50 * delta; // Adjust gravity strength as needed

        // Update position
        bomb.position.add(bomb.velocity.clone().multiplyScalar(delta));

        // Check for detonation time
        if (time >= bomb.userData.detonationTime) {
            explodeBomb(bomb, bomb.position);
            gameState.bombs.splice(i, 1); // Remove bomb from active list
            continue;
        }

        // Check if bomb falls below a certain point (e.g., out of bounds)
        if (bomb.position.y < -100) {
            explodeBomb(bomb, bomb.position); // Explode out of bounds
            gameState.bombs.splice(i, 1); // Remove bomb from active list
            continue;
        }
    }
}

function explodeBomb(bomb, explosionPoint) {
    bomb.userData.isExploded = true;
    gameState.scene.remove(bomb);

    // Create visual impact effect
    createImpactEffect(explosionPoint, EXPLOSION_RADIUS * 2);

    // Damage monsters in radius
    gameState.monsters.forEach(monster => {
        const distance = monster.position.distanceTo(explosionPoint);
        if (distance < EXPLOSION_RADIUS) {
            monster.userData.hp -= BOMB_DAMAGE;
            if (monster.userData.hp <= 0) {
                // Play death sound
                if (monster.userData.deathSound) {
                    monster.userData.deathSound.play();
                }

                // Stop walk sound
                if (monster.userData.walkSound && monster.userData.walkSound.isPlaying) {
                    monster.userData.walkSound.stop();
                }

                // Start death animation
                monster.userData.deathTime = performance.now();
                monster.userData.deathDuration = 1000; // 1 second animation
                gameState.dyingMonsters.push(monster);

                // Remove from active monsters and objects
                const monsterIndex = gameState.monsters.indexOf(monster);
                if(monsterIndex > -1) gameState.monsters.splice(monsterIndex, 1);
                const objectIndex = gameState.objects.indexOf(monster);
                if(objectIndex > -1) gameState.objects.splice(objectIndex, 1);

                // Ensure material supports transparency for fade out
                monster.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.needsUpdate = true;
                    }
                });
            }
        }
    });
}