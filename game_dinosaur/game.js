import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { initPlayer, updatePlayer } from './player.js';
import { createMonsters, updateMonsters } from './monster.js';
import { fireBullet, updateBullets } from './bullet.js';
import { createImpactEffect, updateEffects } from './effects.js';
import { throwBomb, updateBombs } from './bomb.js';

import { initGameCore } from './game_init.js';
import { initAudio } from './game_audio.js';
import { gameState } from './game_state.js';


const clickToStart = function() {
  if (!gameState.playerState.isGameOver) {
    gameState.controls.lock();
  }
};



// --- Initialization ---
function initGame() {

    initGameCore(clickToStart);
    initAudio();
}

// --- Animation Loop ---
function animateGame() {
  requestAnimationFrame(animateGame);

  const time = performance.now();
  const delta = (time - gameState.prevTime) / 1000;

    if (gameState.controls.isLocked === true) {

      // Reload logic

      if (gameState.isReloading && time - gameState.lastReloadTime > gameState.reloadTime) {

        gameState.currentBullets = gameState.maxBullets;

        gameState.isReloading = false;
        if (gameState.reloadCompleteSound && !gameState.reloadCompleteSound.isPlaying) {
            gameState.reloadCompleteSound.play();
        }

        // Update UI: Remove reloading message

      }

  

      // Firing logic (Left Click)
      if (gameState.playerState.shouldFire && time - gameState.playerState.lastShotTime > 200) { // 200ms cooldown
          fireBullet(gameState.gunSound);
          gameState.playerState.lastShotTime = time;
      }

      // Bomb logic (Right Click)
      if (gameState.playerState.shouldThrowBomb && time - gameState.playerState.lastBombTime > 1000 && gameState.totalBombs > 0) { // 1 second cooldown for bombs
          throwBomb();
          gameState.playerState.lastBombTime = time;
          gameState.playerState.shouldThrowBomb = false; // Reset flag after throwing bomb
      }


              updatePlayer(delta, time);

      updateMonsters(delta, time, gameState.controls, gameState.objects, gameState.monsters, gameState.dyingMonsters, gameState.scene);

      updateBullets(delta, time, gameState.scene, gameState.camera, gameState.objects, gameState.bullets, createImpactEffect, gameState.monsters, gameState.dyingMonsters, gameState.gunSound);

      updateBombs(delta, time);

      updateEffects(time);

  

      // UI & Game Over

      if (gameState.healthElement) gameState.healthElement.textContent = `HP: ${gameState.playerState.playerHP}`;

      const bulletsEl = document.getElementById('bullets');
      if (bulletsEl) {
        bulletsEl.textContent = `Bullets: ${gameState.currentBullets}/${gameState.maxBullets}` + (gameState.isReloading ? ' (Reloading...)' : '');
      }

      const bombsEl = document.getElementById('bombs'); // New UI element
      if (bombsEl) {
        bombsEl.textContent = `Bombs: ${gameState.totalBombs}`;
      }

      // Win Condition
      if (gameState.monsters.length === 0 && gameState.dyingMonsters.length === 0) {
        gameState.playerState.isGameWon = true;
        gameState.controls.unlock();
      }

    }

  

    gameState.prevTime = time;

    gameState.renderer.render(gameState.scene, gameState.camera);
}

function onWindowResize() {
  gameState.camera.aspect = window.innerWidth / window.innerHeight;
  gameState.camera.updateProjectionMatrix();
  gameState.renderer.setSize(window.innerWidth, window.innerHeight);
}

export {
  initGame,
  animateGame,
  onWindowResize
};