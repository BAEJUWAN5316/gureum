import * as THREE from 'three';
import { gameState } from './game_state.js';

function initPlayer() {

    const onKeyDown = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                gameState.playerState.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                gameState.playerState.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                gameState.playerState.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                gameState.playerState.moveRight = true;
                break;
            case 'Space':
                if ( gameState.playerState.canJump === true ) gameState.velocity.y += 350;
                gameState.playerState.canJump = false;
                break;
            case 'KeyR':
                // Manual reload
                if (!gameState.isReloading && gameState.currentBullets < gameState.maxBullets) {
                    gameState.isReloading = true;
                    gameState.lastReloadTime = performance.now();
                    if (gameState.reloadSound) gameState.reloadSound.play();
                    // Update UI: Display reloading message
                }
                break;
        }
    };

    const onKeyUp = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                gameState.playerState.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                gameState.playerState.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                gameState.playerState.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                gameState.playerState.moveRight = false;
                break;
        }
    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );
}

function updatePlayer(delta, time) {

    const player = gameState.controls.getObject();
    const oldPosition = player.position.clone();

    // Player Movement
    gameState.raycaster.ray.origin.copy( player.position );
    gameState.raycaster.ray.origin.y -= 10;
    const intersections = gameState.raycaster.intersectObjects( gameState.objects, false );
    const onObject = intersections.length > 0;

    gameState.velocity.x -= gameState.velocity.x * 10.0 * delta;
    gameState.velocity.z -= gameState.velocity.z * 10.0 * delta;
    gameState.velocity.y -= 9.8 * 100.0 * delta;

    gameState.direction.z = Number( gameState.playerState.moveForward ) - Number( gameState.playerState.moveBackward );
    gameState.direction.x = Number( gameState.playerState.moveRight ) - Number( gameState.playerState.moveLeft );
    gameState.direction.normalize();

    if ( gameState.playerState.moveForward || gameState.playerState.moveBackward ) gameState.velocity.z -= gameState.direction.z * 400.0 * delta;
    if ( gameState.playerState.moveLeft || gameState.playerState.moveRight ) gameState.velocity.x -= gameState.direction.x * 400.0 * delta;

    if ( onObject === true ) {
        gameState.velocity.y = Math.max( 0, gameState.velocity.y );
        gameState.playerState.canJump = true;
    }

    gameState.controls.moveRight( - gameState.velocity.x * delta );
    gameState.controls.moveForward( - gameState.velocity.z * delta );
    player.position.y += ( gameState.velocity.y * delta );

    if ( player.position.y < 10 ) {
        gameState.velocity.y = 0;
        player.position.y = 10;
        gameState.playerState.canJump = true;
    }

    // Play/Stop player walk sound
    const isMoving = gameState.playerState.moveForward || gameState.playerState.moveBackward || gameState.playerState.moveLeft || gameState.playerState.moveRight;
    if (isMoving && gameState.playerWalkSound && !gameState.playerWalkSound.isPlaying) {
        gameState.playerWalkSound.play();
    } else if (!isMoving && gameState.playerWalkSound && gameState.playerWalkSound.isPlaying) {
        gameState.playerWalkSound.stop();
    }

    // Player Collision & Damage Detection
    const playerBox = new THREE.Box3().setFromCenterAndSize(player.position, new THREE.Vector3(5, 20, 5));
    for (const object of gameState.objects) {
        if (object.name === 'floor') continue;
        const objectBox = new THREE.Box3().setFromObject(object);
        if (playerBox.intersectsBox(objectBox)) {
            if (object.userData.type === 'monster') {
                const damageCooldown = 1000;
                if (time - gameState.playerState.lastDamageTime > damageCooldown) {
                    gameState.playerState.playerHP -= 8;
                    gameState.playerState.lastDamageTime = time;
                    if (gameState.playerHitSound && !gameState.playerHitSound.isPlaying) {
                        gameState.playerHitSound.play();
                    }
                }
                const knockback = new THREE.Vector3().subVectors(player.position, object.position);
                if (knockback.lengthSq() === 0) {
                    knockback.set(Math.random() - 0.5, 0, Math.random() - 0.5);
                }
                knockback.y = 0;
                knockback.normalize();
                gameState.velocity.add(knockback.multiplyScalar(350));
            } else {
                player.position.copy(oldPosition);
            }
            break;
        }
    }
}

export { initPlayer, updatePlayer };