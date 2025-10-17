import * as THREE from 'three';
import { gameState } from './game_state.js';

import { EXPLOSION_RADIUS } from './bomb.js';

function createImpactEffect(position, size) {
    const flashGeometry = new THREE.PlaneGeometry(size, size);
    const flash = new THREE.Mesh(flashGeometry, gameState.flashMaterial.clone());
    flash.position.copy(position);
    flash.lookAt(gameState.camera.position);
    flash.userData.startTime = performance.now();
    flash.userData.duration = 100; // ms
    gameState.impactEffects.push(flash);
    gameState.scene.add(flash);
}

function updateEffects(time) {
    for (let i = gameState.impactEffects.length - 1; i >= 0; i--) {
        const flash = gameState.impactEffects[i];
        const elapsedTime = time - flash.userData.startTime;
        if (elapsedTime > flash.userData.duration) {
            gameState.scene.remove(flash);
            gameState.impactEffects.splice(i, 1);
        } else {
            flash.material.opacity = 1.0 - (elapsedTime / flash.userData.duration);
        }
    }
}

export { createImpactEffect, updateEffects };