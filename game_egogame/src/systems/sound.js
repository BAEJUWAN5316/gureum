// systems/sound.js
// Version 1.0.1

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.16; // User requested 60% of original 0.5
        this.audioContext = null;
        this.gainNode = null;
        this.isMuted = false;
        this.lastVolume = this.volume;

        this.soundPaths = {
            jump: '/assets/sounds/jump.wav',
            dialogue_next: '/assets/sounds/dialogue_next.wav',
            recruit_success: '/assets/sounds/recruit_success.wav',
            door_open: '/assets/sounds/door_open.wav',
            background_music: '/assets/sounds/background_music.wav',
        };

        this.bgmSource = null; // To store the background music AudioBufferSourceNode
    }

    async unlockAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;
            await this.loadSounds(); // Load sounds only after context is created
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume().catch(e => console.error("Error resuming AudioContext:", e));
            console.log('AudioContext resumed.');
        }
    }

    async loadSounds() {
        if (!this.audioContext) {
            console.error('AudioContext not initialized before loading sounds.');
            return;
        }

        const promises = [];
        for (const id in this.soundPaths) {
            const path = this.soundPaths[id];
            promises.push(fetch(path)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.sounds[id] = audioBuffer;
                })
                .catch(e => console.error(`Error loading or decoding sound ${path}:`, e)));
        }
        await Promise.all(promises);
    }

    playSound(id) {
        if (!this.audioContext || this.audioContext.state === 'suspended') {
            console.warn('AudioContext not ready or suspended. Cannot play sound.');
            return;
        }

        const audioBuffer = this.sounds[id];
        if (audioBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.gainNode);
            source.start(0);
        } else {
            console.warn(`Sound with ID '${id}' not found.`);
        }
    }

    playBGM() {
        if (!this.audioContext || this.audioContext.state === 'suspended') {
            console.warn('AudioContext not ready or suspended. Cannot play BGM.');
            return;
        }

        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
        }

        const audioBuffer = this.sounds.background_music;
        if (audioBuffer) {
            this.bgmSource = this.audioContext.createBufferSource();
            this.bgmSource.buffer = audioBuffer;
            this.bgmSource.loop = true;
            this.bgmSource.connect(this.gainNode);
            this.bgmSource.start(0);
        } else {
            console.warn('Background music not loaded.');
        }
    }

    stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
            this.bgmSource = null;
        }
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.lastVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.lastVolume);
        }
    }
}

