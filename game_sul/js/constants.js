export const TILE_SIZE = 64; // 캐릭터 및 타일 크기 (px)
export const PLAYER_SPEED = 3; // 플레이어 이동 속도

export const DAY_SECONDS = 30; // ㄴ하루의 길이 (초) - 테스트용

export const NPC_SPAWN_INTERVAL = 2600; // NPC 스폰 간격 (ms) - 약 30% 감소
export const NPC_SPEED = 1; // NPC 이동 속도

// 직업별 능력치 변화량 (GDD 기반)
export const JOB_DATA = {
    '농사꾼': { wealth: +10, land: +10, force: +1, happiness: +10 },
    '장사꾼': { wealth: +20, land: +0, force: +0, happiness: +10 },
    '무사':   { wealth: -10, land: +10, force: +10, happiness: +0 },
    '암살자': { wealth: +0,  land: +0, force: +100, happiness: -30 },
    '성직자': { wealth: +0,  land: +0, force: +0, happiness: +30 },
    '귀족':   { wealth: -10, land: +30, force: +0, happiness: -10 },
    '몰락한 왕': { wealth: -10, land: -10, force: -10, happiness: -30 },
};

// 대화 데이터
export const DIALOGUE_DATA = {
    // 일반 직업 (성별 분리)
    '농사꾼': {
        '남': '요즘 수확이 영 시원찮아서 큰일입니다...',
        '여': '올해는 비가 제때 내려줘야 할 텐데요.'
    },
    '장사꾼': {
        '남': '이보시오! 아주 좋은 물건이 있소! 헐값에 넘기리다!',
        '여': '어머, 손님. 뭐 찾으시는 거라도 있으세요?'
    },
    '무사': {
        '남': '내 검이 당신의 마을을 지킬 수 있을 거요.',
        '여': '이 한 몸, 의로운 곳에 바칠 수 있다면 더 바랄 게 없지요.'
    },
    '암살자': {
        '남': '어둠 속에서, 당신의 적을 처리해드리지. ...의뢰비는 선불이야.',
        '여': '흥. 시끄러운 건 질색이지만, 보수만 확실하다면야.'
    },
    '성직자': {
        '남': '신의 가호가 당신과 함께하기를... 기도합시다.',
        '여': '언제나 당신을 위해 기도하고 있답니다. 힘내세요.'
    },
    '귀족': {
        '남': '이런 누추한 곳에는 오래 머물고 싶지 않군. 내 가치가 떨어지는 기분이야.',
        '여': '어머, 먼지 좀 봐. 제 피부에 닿잖아요.'
    },
    
    // 고유 직업 (성별 고정)
    '몰락한 왕': '한때는 나도 왕이었지...',

    // 왕의 방 신하들
    'vassal-0': '왕이시여, 당신은 이 세계의 진실을 마주할 준비가 되셨습니까?',
    'vassal-1': '이 세계는 당신의 의지로 만들어졌고, 당신의 의지로 유지됩니다.',
    'vassal-2': '우리는 당신의 의지가 만들어낸 허상... 하지만 우리에겐 자아가 있습니다.',
    'vassal-3': '당신이 \'설득\'이라 부르는 힘은, 사실 이 세계의 법칙을 바꾸는 권능입니다.',
    'vassal-4': '마을의 번영과 쇠락, 그 모든 것이 당신의 선택에 달려 있었지요.',
    'vassal-5': '왕의 등장은 당신에게 주어진 마지막 시험이었습니다.',
    'vassal-6': '이제 당신은 모든 것을 알게 되었습니다. 이 세계를 어떻게 하시겠습니까?',
    'vassal-7': '리셋, 혹은 유지... 당신의 선택은 곧 이 세계의 운명입니다.',
};

// 직업별 등장 확률 (가중치)
export const JOB_SPAWN_WEIGHTS = {
    '농사꾼': 25,
    '장사꾼': 25,
    '무사': 15,
    '성직자': 15,
    '귀족': 9,
    '암살자': 8,
    '몰락한 왕': 3,
};

// 업적 데이터
export const ACHIEVEMENTS = {
    // 기본 & 성장
    first_recruit: { id: 'first_recruit', title: '첫 만남', description: '첫 주민을 영입했습니다.', hidden: false },
    population_10: { id: 'population_10', title: '북적북적', description: '인구 10명을 달성했습니다.', hidden: false },
    wealth_1000: { id: 'wealth_1000', title: '거상', description: '재력 1000을 달성했습니다.', hidden: false },
    land_1000: { id: 'land_1000', title: '대지주', description: '토지 1000을 달성했습니다.', hidden: false },
    force_500: { id: 'force_500', title: '전쟁광', description: '무력 500을 달성했습니다.', hidden: false },
    happiness_200: { id: 'happiness_200', title: '유토피아', description: '행복도 200을 달성했습니다.', hidden: false },

    // 엔딩 (달성 전에는 숨김)
    ending_peace: { id: 'ending_peace', title: '평화주의자', description: '왕과 평화로운 결말을 맞이했습니다.', hidden: true },
    ending_betrayed: { id: 'ending_betrayed', title: '배신자', description: '암살자들에게 배신당했습니다.', hidden: true },
    ending_revolution: { id: 'ending_revolution', title: '혁명가', description: '전쟁에서 승리했습니다.', hidden: true },
    ending_shadow_lord: { id: 'ending_shadow_lord', title: '그림자 군주', description: '암살자들로 세상을 제패했습니다.', hidden: true },
    ending_new_god: { id: 'ending_new_god', title: '새로운 신', description: '세계의 진실을 마주했습니다.', hidden: true },

    // 직업 수집 (달성 전에는 숨김)
    recruit_farmer: { id: 'recruit_farmer', title: '농사왕', description: '농사꾼을 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_merchant: { id: 'recruit_merchant', title: '장사왕', description: '장사꾼을 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_warrior: { id: 'recruit_warrior', title: '무사왕', description: '무사를 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_assassin: { id: 'recruit_assassin', title: '암살조련자', description: '암살자를 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_cleric: { id: 'recruit_cleric', title: '교황', description: '성직자를 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_noble: { id: 'recruit_noble', title: '사교왕', description: '귀족을 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_king: { id: 'recruit_king', title: '왕위 계승', description: '몰락한 왕을 한 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_two_kings: { id: 'recruit_two_kings', title: '두 명의 왕', description: '몰락한 왕을 두 명 이상 보유하고 엔딩을 봤습니다.', hidden: true },
    recruit_only_assassins: { id: 'recruit_only_assassins', title: '암살대장', description: '암살자만으로 엔딩을 봤습니다.', hidden: true },

    // 게임오버 (달성 전에는 숨김)
    gameover_no_people: { id: 'gameover_no_people', title: '나 혼자 레벨업 못함', description: '주민이 0명인 채로 15일을 넘겼습니다.', hidden: true },
    gameover_wealth: { id: 'gameover_wealth', title: '금고가 비었네', description: '재력이 0이 되어 게임오버되었습니다.', hidden: true },
    gameover_land: { id: 'gameover_land', title: '내가 설 곳은 없네', description: '토지가 0이 되어 게임오버되었습니다.', hidden: true },
    gameover_force: { id: 'gameover_force', title: '뒷마당이 비었네', description: '무력이 0이 되어 게임오버되었습니다.', hidden: true },
    gameover_happiness: { id: 'gameover_happiness', title: '행복하지 않아', description: '행복도가 0이 되어 게임오버되었습니다.', hidden: true },
};
