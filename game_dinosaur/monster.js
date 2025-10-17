import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { PositionalAudio } from 'three';
import { gameState } from './game_state.js';

let monsterModel = null;

function createMonsters(boxGeometry) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('monster.mtl', (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('monster.obj', (object) => {
            monsterModel = object;
            const monsterGroup = new THREE.Group();
            monsterGroup.add(monsterModel);
            monsterModel.position.set(0, 0, 0); // Ensure model's position is reset within the group
            monsterModel.scale.set(0.25, 0.25, 0.25); // Reduce size by another 50% (25% of original)
            monsterModel.rotation.y = Math.PI / 2; // Try rotating 90 degrees within the group

            monsterModel.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true; // Monster meshes cast shadows
                    child.receiveShadow = true; // Monster meshes receive shadows
                    if (child.material) {
                        child.material.transparent = true;
                        child.material.needsUpdate = true;
                    }
                }
            });

            // Calculate bounding box to get accurate height
            const bbox = new THREE.Box3().setFromObject(monsterModel);

            for (let i = 0; i < 20; i++) {
                const monster = monsterGroup.clone();
                monster.position.x = Math.random() * 1800 - 900;
                monster.position.y = -bbox.min.y; // Set y to its lowest point to place base on ground
                monster.position.z = Math.random() * 1800 - 900;
                monster.userData.type = 'monster';
                monster.userData.hp = 5;

                // Clone materials for this specific monster instance
                monster.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material = child.material.clone();
                        child.material.transparent = true; // Ensure transparency is enabled for fade out
                        child.material.needsUpdate = true;
                    }
                });

                // Create a target for the monster's head to look at
                const headTarget = new THREE.Object3D();
                monster.add(headTarget); // Add to the monster group
                monster.userData.headTarget = headTarget; // Store reference

                // Add positional audio for monster death
                const deathSound = new PositionalAudio(gameState.audioListener);
                deathSound.setBuffer(gameState.monsterDeathSoundBuffer);
                deathSound.setRefDistance(20); // Adjust as needed
                monster.add(deathSound);
                monster.userData.deathSound = deathSound;

                // Add positional audio for monster walk
                const walkSound = new PositionalAudio(gameState.audioListener);
                walkSound.setBuffer(gameState.monsterWalkSoundBuffer);
                walkSound.setLoop(true);
                walkSound.setRefDistance(10); // Adjust as needed
                monster.add(walkSound);
                monster.userData.walkSound = walkSound;

                // Add positional audio for monster hit
                const hitSound = new PositionalAudio(gameState.audioListener);
                hitSound.setBuffer(gameState.monsterHitSoundBuffer);
                hitSound.setRefDistance(20); // Adjust as needed
                hitSound.setVolume(1.0); // Increase volume by 300%
                monster.add(hitSound);
                monster.userData.hitSound = hitSound;

                gameState.scene.add(monster);
                gameState.objects.push(monster);
                gameState.monsters.push(monster);
            }
        });
    });
}

function updateMonsters(delta, time) {
    const player = gameState.controls.getObject();
    const monsterSpeed = 40.0;
    let directionToPlayer = new THREE.Vector3(); // Declare here
    for (let i = gameState.monsters.length - 1; i >= 0; i--) {
        const monster = gameState.monsters[i];
        const distanceToPlayer = player.position.distanceTo(monster.position);

        if (distanceToPlayer > 15) {
            directionToPlayer.subVectors(player.position, monster.position);
            directionToPlayer.y = 0;
            directionToPlayer.normalize();

            const monsterRay = new THREE.Raycaster(monster.position, directionToPlayer);
            const monsterHits = monsterRay.intersectObjects(gameState.objects.filter(o => o !== monster));

            let moveDirection = directionToPlayer;
            if (monsterHits.length > 0 && monsterHits[0].distance < 30) {
                if (monsterHits[0].object.name !== 'floor' && monsterHits[0].object.userData.type !== 'monster') {
                    const slideDirection = new THREE.Vector3();
                    slideDirection.crossVectors(directionToPlayer, new THREE.Vector3(0, 1, 0)).normalize();
                    moveDirection = slideDirection;
                }
            }
            monster.position.add(moveDirection.multiplyScalar(monsterSpeed * delta));
        }
        // monster.position.y = 10; // Removed fixed y-position

        // Play/Stop monster walk sound
            if (monster.userData.walkSound) {
                if (distanceToPlayer > 15 && !monster.userData.walkSound.isPlaying) {
                    monster.userData.walkSound.play();
                } else if (distanceToPlayer <= 15 && monster.userData.walkSound.isPlaying) {
                    monster.userData.walkSound.stop();
                }
            }

            // Make the monster's head look at the player horizontally
        if (monster.userData.headTarget) {
            const targetPosition = new THREE.Vector3(player.position.x, monster.position.y, player.position.z);
            monster.userData.headTarget.position.copy(targetPosition);
            monster.lookAt(monster.userData.headTarget.position);
        }

        // Monster-Monster Collision Resolution (Push-out)
        const monsterRadius = 10;
        for (let j = 0; j < gameState.monsters.length; j++) {
            if (i === j) continue;
            const otherMonster = gameState.monsters[j];
            const distanceBetweenMonsters = monster.position.distanceTo(otherMonster.position);
            const minDistance = monsterRadius * 2;

            if (distanceBetweenMonsters < minDistance) {
                const overlap = minDistance - distanceBetweenMonsters;
                const pushDirection = new THREE.Vector3().subVectors(monster.position, otherMonster.position);
                if (pushDirection.lengthSq() === 0) {
                    pushDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5);
                }
                pushDirection.normalize();
                monster.position.add(pushDirection.multiplyScalar(overlap * 0.5));
                otherMonster.position.sub(pushDirection.multiplyScalar(overlap * 0.5));
            }
        }

        // Update BoxHelper position
        // if (monster.userData.boxHelper) {
        //     monster.userData.boxHelper.update();
        // }
    }

    // Dying Monsters Animation Logic
    for (let i = gameState.dyingMonsters.length - 1; i >= 0; i--) {
        const monster = gameState.dyingMonsters[i];
        const elapsedTime = time - monster.userData.deathTime;
        const animationDuration = monster.userData.deathDuration;

                    if (elapsedTime < animationDuration) {
                        const scaleFactor = 1 - (elapsedTime / animationDuration);
                        monster.scale.set(scaleFactor, scaleFactor, scaleFactor);
                        monster.traverse((child) => {
                            if (child.isMesh && child.material) {
                                child.material.opacity = scaleFactor; // Fade out
                            }
                        });
                    } else {            gameState.scene.remove(monster);
            gameState.dyingMonsters.splice(i, 1);
        }
    }
}

export { createMonsters, updateMonsters };