const NpcData = {
    'A': {
        name: 'A',
        texture: 'npcA',
        dialogue: '나... 약한 사람은 아니야! 진짜로!',
        nextNpcKey: 'B',
        strategy: 'normal',
        floorTexture: 'floor_a'
    },
    'B': {
        name: 'B',
        texture: 'npcB',
        dialogue: '내 생각을 읽었다고? 나는 네가 그 생각을 읽을 것을 알고 한 수 앞을 내다보지.',
        nextNpcKey: 'C',
        strategy: 'oneStepAhead',
        floorTexture: 'floor_b'
    },
    'C': {
        name: 'C',
        texture: 'npcC',
        dialogue: '너도 알지? 이 게임의 진짜 목적을.',
        nextNpcKey: 'Ending', // Special key for the end
        strategy: 'liar',
        floorTexture: 'floor_c'
    }
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, RoomScene, EndingScene, UIScene]
};

const game = new Phaser.Game(config);