import * as THREE from 'three';
import { gameState } from './game_state.js';
import { createImpactEffect } from './effects.js';

function fireBullet(gunSound) {
    if (gameState.isReloading) return; // Cannot fire while reloading
    if (gameState.currentBullets <= 0) {
        // Initiate reload if out of bullets
        if (!gameState.isReloading) {
            gameState.isReloading = true;
            gameState.lastReloadTime = performance.now();
            if (gameState.reloadSound) gameState.reloadSound.play();
            // Update UI: Display reloading message
        }
        return; // Prevent firing
    }

    gameState.currentBullets--; // Decrement bullets on shot

    const bulletGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const bullet = new THREE.Mesh(bulletGeometry, gameState.bulletMaterial);
    
    const gunWorldPosition = new THREE.Vector3();
    gameState.gun.getWorldPosition(gunWorldPosition);

    const gunForward = new THREE.Vector3();
    gameState.gun.getWorldDirection(gunForward);

    const gunHalfLength = 1.5 / 2;
    const bulletRadius = 0.5;
    const muzzleOffset = gunHalfLength + bulletRadius + 0.1;

    const bulletSpawnPosition = gunWorldPosition.add(gunForward.multiplyScalar(muzzleOffset));
    bullet.position.copy(bulletSpawnPosition);

    const shootDirection = new THREE.Vector3();
    gameState.camera.getWorldDirection(shootDirection);
    bullet.velocity = new THREE.Vector3().copy(shootDirection).multiplyScalar(1000);
    bullet.userData.life = 0;
    gameState.bullets.push(bullet);
    gameState.scene.add(bullet);

    if (gunSound) {
        if (gunSound.isPlaying) {
            gunSound.stop();
        }
        gunSound.play();
    }
}

function updateBullets(delta, time) {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        const bulletVelocity = bullet.velocity.clone();
        const travelDistance = bulletVelocity.length() * delta;
        const bulletRay = new THREE.Raycaster(bullet.position, bulletVelocity.normalize());
        const hits = bulletRay.intersectObjects(gameState.objects);

        if (hits.length > 0 && hits[0].distance < travelDistance) {
            const hitObject = hits[0].object;
            createImpactEffect(hits[0].point, 4);
            
            if (hitObject.name !== 'floor') {
                let targetMonster = hitObject;
                // If the hit object is a child of a monster group, find the parent group
                while (targetMonster && targetMonster.userData.type !== 'monster') {
                    targetMonster = targetMonster.parent;
                }

                if (targetMonster && targetMonster.userData.type === 'monster') {
                    // Play hit sound
                    if (targetMonster.userData.hitSound) {
                        if (targetMonster.userData.hitSound.isPlaying) {
                            targetMonster.userData.hitSound.stop();
                        }
                        targetMonster.userData.hitSound.play();
                    }
                    targetMonster.userData.hp -= 1;
                    if (targetMonster.userData.hp <= 0) {
                        // Play death sound
                        if (targetMonster.userData.deathSound) {
                            targetMonster.userData.deathSound.play();
                        }

                        // Stop walk sound
                        if (targetMonster.userData.walkSound && targetMonster.userData.walkSound.isPlaying) {
                            targetMonster.userData.walkSound.stop();
                        }

                        // Start death animation
                        targetMonster.userData.deathTime = time;
                        targetMonster.userData.deathDuration = 1000; // 1 second animation
                        gameState.dyingMonsters.push(targetMonster);

                        // Remove from active monsters and objects
                        const monsterIndex = gameState.monsters.indexOf(targetMonster);
                        if(monsterIndex > -1) gameState.monsters.splice(monsterIndex, 1);
                        const objectIndex = gameState.objects.indexOf(targetMonster);
                        if(objectIndex > -1) gameState.objects.splice(objectIndex, 1);

                        // Ensure material supports transparency for fade out
                        targetMonster.traverse((child) => {
                            if (child.isMesh && child.material) {
                                child.material.transparent = true;
                                child.material.needsUpdate = true;
                            }
                        });
                    }
                }
            }
            gameState.scene.remove(bullet);
            gameState.bullets.splice(i, 1);
            continue;
        }

        bullet.position.add(bullet.velocity.clone().multiplyScalar(delta));
        bullet.userData.life += delta;
        if (bullet.userData.life > 3) {
            gameState.scene.remove(bullet);
            gameState.bullets.splice(i, 1);
        }
    }
}

export { fireBullet, updateBullets };