import { Audio, PositionalAudio } from 'three';
import { gameState } from './game_state.js';

export function initAudio() {
    // Load gun sound
    gameState.audioLoader.load( 'sounds/gun_shot.wav', function( buffer ) {
        gameState.gunSoundBuffer = buffer;
        gameState.gunSound = new Audio( gameState.audioListener );
        gameState.gunSound.setBuffer( gameState.gunSoundBuffer );
        gameState.gunSound.setVolume( 0.3 );
    });

    // Load monster death sound
    gameState.audioLoader.load( 'sounds/monster_death.wav', function( buffer ) {
        gameState.monsterDeathSoundBuffer = buffer;
    });

    // Load player walk sound
    gameState.audioLoader.load( 'sounds/player_walk.wav', function( buffer ) {
        gameState.playerWalkSoundBuffer = buffer;
        gameState.playerWalkSound = new Audio( gameState.audioListener );
        gameState.playerWalkSound.setBuffer( gameState.playerWalkSoundBuffer );
        gameState.playerWalkSound.setLoop( true );
        gameState.playerWalkSound.setVolume( 0.3 );
    });

    // Load monster walk sound
    gameState.audioLoader.load( 'sounds/monster_walk.wav', function( buffer ) {
        gameState.monsterWalkSoundBuffer = buffer;
    });

    // Load monster hit sound
    gameState.audioLoader.load( 'sounds/monster_hit.wav', function( buffer ) {
        gameState.monsterHitSoundBuffer = buffer;
    });

    // Load reload sound
    gameState.audioLoader.load( 'sounds/reload_sound.wav', function( buffer ) {
        gameState.reloadSoundBuffer = buffer;
        gameState.reloadSound = new Audio( gameState.audioListener );
        gameState.reloadSound.setBuffer( gameState.reloadSoundBuffer );
        gameState.reloadSound.setVolume( 0.7 ); // Adjust volume as needed
    });

    // Load reload complete sound
    gameState.audioLoader.load( 'sounds/reload_complete.wav', function( buffer ) {
        gameState.reloadCompleteSoundBuffer = buffer;
        gameState.reloadCompleteSound = new Audio( gameState.audioListener );
        gameState.reloadCompleteSound.setBuffer( gameState.reloadCompleteSoundBuffer );
        gameState.reloadCompleteSound.setVolume( 0.5 );
    });

    // Load player hit sound
    gameState.audioLoader.load( 'sounds/player_hit.wav', function( buffer ) {
        gameState.playerHitSoundBuffer = buffer;
        gameState.playerHitSound = new Audio( gameState.audioListener );
        gameState.playerHitSound.setBuffer( gameState.playerHitSoundBuffer );
        gameState.playerHitSound.setVolume( 0.8 );
    });

    // Load BGM
    gameState.audioLoader.load( 'bgm.mp3', function( buffer ) {
        gameState.bgm = new Audio( gameState.audioListener );
        gameState.bgm.setBuffer( buffer );
        gameState.bgm.setLoop( true );
        gameState.bgm.setVolume( 0.5 );
    });
}