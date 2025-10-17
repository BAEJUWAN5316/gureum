import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { TextureLoader } from 'three'; // New import
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'; // New import
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'; // New import
import { createMonsters } from './monster.js';
import { gameState } from './game_state.js';
import { initPlayer } from './player.js';


function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize( window.innerWidth, window.innerHeight );
}

export function initGameCore(clickToStart) {
    // Camera
    gameState.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    gameState.camera.position.y = 10;
    gameState.audioListener = new THREE.AudioListener();
    gameState.camera.add( gameState.audioListener );
    gameState.audioLoader = new THREE.AudioLoader();

    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color( 0x87ceeb );
    gameState.scene.fog = new THREE.Fog( 0x87ceeb, 0, 750 );

    // Lighting
    const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 1.0 );
    light.position.set( 0.5, 1, 0.75 );
    gameState.scene.add( light );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 30 );
    gameState.scene.add( dirLight );

    // Controls
    gameState.controls = new PointerLockControls( gameState.camera, document.body );
    initPlayer(); // Call initPlayer here

    gameState.blockerElement = document.getElementById( 'blocker' );
    gameState.instructionsElement = document.getElementById( 'instructions' );
    gameState.healthElement = document.getElementById('health');
    gameState.healthElement.textContent = `HP: ${gameState.playerState.playerHP}`;
    gameState.blockerElement.addEventListener( 'click', clickToStart);

    // Reusable handlers so removeEventListener works
    const onMouseDown = (event) => {
        // console.log('onMouseDown - button:', event.button);
        if (event.button === 0) { // Left click
            gameState.playerState.shouldFire = true;
        } else if (event.button === 2) { // Right click
            gameState.playerState.shouldThrowBomb = true;
        }
    };

    const onMouseUp = (event) => {
        if (event.button === 0) { // Left click
            gameState.playerState.shouldFire = false;
        } else if (event.button === 2) { // Right click
            gameState.playerState.shouldThrowBomb = false;
        }
    };

    gameState.controls.addEventListener( 'lock', function () {
        gameState.blockerElement.style.setProperty('display', 'none', 'important');
        gameState.instructionsElement.style.setProperty('display', 'none', 'important');

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);

        // Restart player walk sound if moving
        const isMoving = gameState.playerState.moveForward || gameState.playerState.moveBackward || gameState.playerState.moveLeft || gameState.playerState.moveRight;
        if (isMoving && gameState.playerWalkSound && !gameState.playerWalkSound.isPlaying) {
            gameState.playerWalkSound.play();
        }

        // Play BGM
        if (gameState.bgm && !gameState.bgm.isPlaying) {
            gameState.bgm.play();
        }

    } );

    gameState.controls.addEventListener( 'unlock', function () {
        gameState.blockerElement.style.display = 'flex';
        gameState.instructionsElement.style.display = 'flex';

        const logo = document.getElementById('logo');
        const instructionsTitle = document.getElementById('instructions-title');
        const instructionsBody = document.getElementById('instructions-body');

        if (gameState.playerState.isGameWon) {
            logo.style.display = 'none';
            instructionsTitle.textContent = 'You Win!';
            instructionsBody.style.display = 'none';
            gameState.blockerElement.addEventListener('click', () => location.reload(), { once: true });
        } else if (gameState.playerState.isGameOver) {
            logo.style.display = 'none'; // Hide logo on game over
            instructionsTitle.textContent = 'Game Over';
            instructionsBody.style.display = 'none'; // Hide body on game over
            gameState.blockerElement.addEventListener('click', () => location.reload(), { once: true });
        }
        else {
            logo.style.display = 'block'; // Show logo
            instructionsTitle.textContent = 'Click to play';
            instructionsBody.style.display = 'block'; // Show body
            gameState.blockerElement.addEventListener( 'click', clickToStart);
        }

        gameState.playerState.isMouseDown = false;
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);

        // Stop sounds
        if (gameState.playerWalkSound && gameState.playerWalkSound.isPlaying) {
            gameState.playerWalkSound.stop();
        }
        if (gameState.gunSound && gameState.gunSound.isPlaying) {
            gameState.gunSound.stop();
        }

        // Stop monster walk sounds
        gameState.monsters.forEach(monster => {
            if (monster.userData.walkSound && monster.userData.walkSound.isPlaying) {
                monster.userData.walkSound.stop();
            }
        });

        // Stop dying monster sounds
        gameState.dyingMonsters.forEach(monster => {
            if (monster.userData.deathSound && monster.userData.deathSound.isPlaying) {
                monster.userData.deathSound.stop();
            }
        });

        // Pause BGM
        if (gameState.bgm && gameState.bgm.isPlaying) {
            gameState.bgm.pause();
        }

    } );

    gameState.scene.add( gameState.controls.getObject() );

    gameState.raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    // Floor
    let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    floorGeometry.rotateX( - Math.PI / 2 );

    const textureLoader = new TextureLoader();
    const floorTexture = textureLoader.load( 'textures/floor_texture.png' );
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 50, 50 ); // Repeat texture 50 times

    const floorMaterial = new THREE.MeshStandardMaterial( { map: floorTexture } );
    gameState.floor = new THREE.Mesh( floorGeometry, floorMaterial );
    gameState.floor.name = 'floor';
    gameState.floor.receiveShadow = true; // Floor receives shadows
    gameState.scene.add( gameState.floor );
    gameState.objects.push(gameState.floor);

    // Materials
    gameState.bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    gameState.bombMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.5, metalness: 0.8 }); // New bomb material
    gameState.flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    gameState.monsterMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000, roughness: 0.9, metalness: 0.1 } );

    // Gun Model
    const mtlLoader = new MTLLoader();
    mtlLoader.load('gun.mtl', (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('gun.obj', (object) => {
            gameState.gun = object;
            gameState.gun.position.set(0.5, -0.4, -0.5); // Adjusted position (moved slightly forward)
            gameState.gun.rotation.set(0, Math.PI, 0); // Adjusted rotation (180 degrees around Y-axis)
            gameState.gun.scale.set(0.05, 0.05, 0.05); // Keep scale
            gameState.gun.castShadow = true;
            gameState.camera.add(gameState.gun);
        });
    });

    const boxGeometry = new THREE.BoxGeometry( 20, 20, 20 );
    // Obstacles
    const boxTexture = textureLoader.load( 'textures/box_texture.png' );
    boxTexture.wrapS = THREE.RepeatWrapping;
    boxTexture.wrapT = THREE.RepeatWrapping;
    boxTexture.repeat.set( 1, 1 ); // Repeat texture once per box

    for ( let i = 0; i < 200; i ++ ) {
        const boxMaterial = new THREE.MeshStandardMaterial( { map: boxTexture } );
        const box = new THREE.Mesh( boxGeometry, boxMaterial );
        box.position.x = Math.random() * 1600 - 800;
        box.position.y = 10;
        box.position.z = Math.random() * 1600 - 800;
        box.geometry.computeBoundingBox();
        box.castShadow = true; // Obstacles cast shadows
        box.receiveShadow = true; // Obstacles receive shadows
        gameState.scene.add( box );
        gameState.objects.push( box );
    }

    createMonsters(gameState.scene, gameState.objects, gameState.monsters, gameState.monsterMaterial, boxGeometry);

    // Clouds
    const cloudGeometry = new THREE.PlaneGeometry(100, 50);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 10; i++) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
        cloud.position.x = Math.random() * 2000 - 1000;
        cloud.position.y = Math.random() * 100 + 150; // Higher up
        cloud.position.z = Math.random() * 2000 - 1000;
        cloud.rotation.y = Math.random() * Math.PI * 2;
        gameState.scene.add(cloud);
    }

    // Renderer
    gameState.renderer = new THREE.WebGLRenderer( { antialias: true } );
    gameState.renderer.setPixelRatio( window.devicePixelRatio );
    gameState.renderer.setSize( window.innerWidth, window.innerHeight );
    gameState.renderer.shadowMap.enabled = true; // Enable shadows
    document.body.appendChild( gameState.renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );
    onWindowResize();

    // Configure DirectionalLight to cast shadows
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024; // default is 512
    dirLight.shadow.mapSize.height = 1024; // default is 512
    dirLight.shadow.camera.near = 0.5; // default
    dirLight.shadow.camera.far = 500; // default
    dirLight.shadow.camera.left = -200; // Adjust shadow camera bounds
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
}