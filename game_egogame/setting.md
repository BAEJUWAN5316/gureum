# 웹 횡스크롤 게임 기획서 (JS)

## 0. 개요
- **장르**: 2D 횡스크롤 어드벤처
- **플랫폼**: 웹(데스크톱 크롬 기준)
- **조작키**: `←/→` 이동, `↑` 점프, `스페이스바` 상호작용(대화/문열기)
- **클리어 조건**: 맵에 흩어진 **동료 3명**을 모두 영입 → **문(Exit Door)** 도달 → **상품 페이지로 이동**
- **특징 요약**
  1) 마리오 스타일의 부드러운 사이드 스크롤  
  2) 동료 NPC와의 간단 대화/영입  
  3) 파티 팔로우(꼬리열) 시스템  
  4) 동료를 모두 모으기 전에는 문이 열리지 않음  

---

## 1. 핵심 게임 루프
1) 탐색(이동/점프) → 2) NPC 발견 → 3) 스페이스로 대화 및 영입 → 4) 파티가 따라옴 →  
5) 3명 전원 영입 완료 → 6) 문 앞 도달 → 7) 스페이스로 문 열기 → 8) 상품 페이지 리다이렉트

---

## 2. 조작 & 물리
- **입력**
  - `←/→`: 수평속도 `vx = ±speed`
  - `↑`: 바닥 접지 시 `vy = -jumpPower`
  - `Space`: 상호작용(대화 시작/다음 대사/문 열기)
- **물리**
  - **중력**: `vy += gravity * dt`
  - **마찰**: 지면에서 `vx *= groundFriction`
  - **충돌**: 타일/플랫폼 기준 AABB 충돌 처리
- **카메라**
  - 플레이어 중심으로 **lerp** 스크롤(`camX = lerp(camX, player.x - center, 0.1)`)

---

## 3. 엔티티 정의
### 3.1 플레이어
- 속성: `x, y, vx, vy, facing, isGrounded`
- 상태: `Idle / Run / Jump / Fall / Talk`
- 상호작용 범위: `interactRadius` (NPC/문과 거리 체크)

### 3.2 동료 NPC (3명)
- 속성: `id, name, x, y, state, dialogue[], isRecruited`
- 상태: `Idle / Talk / Follow`
- **대화 후 영입**: 대화 마지막 줄에서 `isRecruited = true`

### 3.3 팔로워(동료 따라오기)
- 경로 추적: **포지션 히스토리** 기반 꼬리 시스템 혹은 **목표점(LookAhead)** 추적
- 간격 유지: 각 동료는 선행 대상의 `trail[i - 1 - gap]`로 이동

### 3.4 도어(Exit)
- 속성: `x, y, isOpen`
- 열림 조건: `party.count === 3`
- 상호작용: `Space` 입력 시 `isOpen ? goToProductPage() : showHint("동료를 모두 모아야 해!")`

---

## 4. 맵 & 배치
- **타일맵**: 지형, 플랫폼, 장식 레이어
- **랜덤 스폰 규칙(동료)**
  - **스폰 슬롯** 후보 좌표 배열: `spawnSpots = [{x,y}, ...]`
  - 게임 시작 시 **중복 없이** 3개 뽑기(Fisher-Yates shuffle)
  - 위험지대(구덩이, 스파이크)와 최소거리 `safeRadius` 보장
- **도어 위치**: 맵 오른쪽 후반부 고정

---

## 5. 대화 시스템
- **트리거**: 플레이어가 NPC와 거리 < `interactRadius` 상태에서 `Space`
- **UI**: 하단 **대화창**(이름/대사/다음 버튼)
- **진행**: `Space`로 다음 문장 → 마지막 문장 도달 시 영입 확인 선택지 없이 자동 영입
- **샘플 대사**
  - NPC1: “여기서 길을 잃었어… 함께 가도 될까?” → “고마워! 내가 뒤에서 도울게.”
  - NPC2: “문은 혼자선 못 열어. 우리 모두 힘을 모아야 해.”
  - NPC3: “마지막까지 포기하지 말자. 거의 다 왔어!”

---

## 6. UI/UX
- **상단 HUD**
  - 동료 수: `ALLY: 0/3` (아이콘 + 카운트)
- **대화창**
  - 이름(좌상), 대사(본문), `≫`(다음) 툴팁: `Space`
- **문 힌트**
  - 잠김: “동료를 3명 모두 영입해야 문이 열립니다.”
  - 열림: “스페이스바로 문을 엽니다.”

---

## 7. 승패 조건 & 리다이렉트
- **클리어**: 문 앞에서 `isOpen === true` 상태에서 `Space` →  
  `window.location.href = PRODUCT_URL`
- **패배 없음**(초판): 낙하 구간은 리스폰(최근 체크포인트)

---

## 8. 기술 아키텍처(제안)
- **렌더링**: HTML `<canvas>` + 바닐라 JS(또는 Phaser 3 선택 가능)
- **루프**: `requestAnimationFrame`(입력→업데이트→충돌→팔로우→카메라→렌더)
- **에셋**: `assets/tiles.png, assets/player.png, assets/npc.png, assets/ui.png`
- **파일 구조**
  ```
  /src
    index.html
    main.js
    input.js
    world.js        # 타일맵/충돌
    entities/
      player.js
      npc.js
      door.js
      follower.js
    systems/
      physics.js
      dialogue.js
      spawn.js
      camera.js
      follow.js
    ui/
      hud.js
      dialogBox.js
    data/
      map.json
      npcs.json     # 대사/메타데이터
      config.json
  /assets
  ```

---

## 9. 데이터 스키마(예시)
```json
// data/npcs.json
[
  {
    "id": "ally_1",
    "name": "루나",
    "dialogue": ["여기서 길을 잃었어…", "같이 가도 될까?", "고마워! 내가 뒤에서 도울게."],
    "speed": 0.9
  },
  {
    "id": "ally_2",
    "name": "칸",
    "dialogue": ["문은 혼자선 못 열려.", "우리 모두 힘을 모으자!"],
    "speed": 1.0
  },
  {
    "id": "ally_3",
    "name": "미오",
    "dialogue": ["거의 다 왔어.", "끝까지 함께 가자!"],
    "speed": 1.1
  }
]
```

---

## 10. 핵심 로직(의사코드)

### 10.1 동료 랜덤 배치
```js
const spots = shuffle([...spawnSpots]);   // 후보 좌표들
const selected = spots.slice(0, 3);       // 3명 배치
selected.forEach((pos, i) => spawnNPC(NPC_DEFS[i], pos));
```

### 10.2 상호작용 & 대화/영입
```js
if (pressed.Space && near(player, npc, interactRadius)) {
  if (!dialogue.isOpen) dialogue.open(npc);
  else if (dialogue.hasNext()) dialogue.next();
  else {
    npc.isRecruited = true;
    party.add(npc);         // 팔로우 대상에 추가
    hud.updateAllies(party.count);
    dialogue.close();
  }
}
```

### 10.3 팔로우(꼬리열)
```js
playerTrail.unshift({x: player.x, y: player.y});
playerTrail.length = Math.min(playerTrail.length, 300);

party.members.forEach((ally, idx) => {
  const delay = 20 * (idx + 1);
  const t = playerTrail[Math.min(delay, playerTrail.length - 1)];
  const dir = normalize(sub(t, {x: ally.x, y: ally.y}));
  ally.x += dir.x * allySpeed * dt;
  ally.y += dir.y * allySpeed * dt;
});
```

### 10.4 문 열기 & 리다이렉트
```js
const DOOR_OPEN_NEED = 3;
if (pressed.Space && near(player, door, interactRadius)) {
  if (party.count === DOOR_OPEN_NEED) {
    door.isOpen = true;
    setTimeout(() => window.location.href = PRODUCT_URL, 600);
  } else {
    ui.toast("동료를 3명 모두 영입해야 문이 열립니다.");
  }
}
```

---

## 11. 리소스 & 애니메이션
- 플레이어: Idle/Run/Jump/Fall 4-way(실제는 좌우만 사용)
- NPC: Idle/Follow 2종
- 문: Closed/Open 2프레임 + 열림 이펙트
- UI: HUD 아이콘(동료 수), 대화창 스킨

---

## 12. 사운드
- 점프, 대화 시작/넘김, 영입 성공, 문 열림(클리어)
- 볼륨/뮤트 옵션(설정 아이콘)

---

## 13. 퍼포먼스 & 접근성
- 캔버스 해상도 스케일 업샘플(픽셀 퍼펙트) 옵션
- 키보드만으로 100% 조작 가능
- 색약 대비 고려(문 상태 색상의 대비)

---

## 14. QA 체크리스트 (MVP 통과 기준)
- [ ] 60FPS 내외에서 입력/물리/충돌 안정
- [ ] 동료 3명 랜덤 위치 정상 배치(겹침/낙사 지대 금지)
- [ ] 대화창 오동작 없음(반복 입력, 스킵 처리)
- [ ] 0~2명 상태: 문 상호작용 시 열리지 않음 + 힌트 노출
- [ ] 3명 상태: 문 열림 → 0.6초 내 리다이렉트
- [ ] 카메라 스크롤/낙하 리스폰 정상
- [ ] 모바일 키보드 입력 무시(데스크톱 우선)

---

## 15. 일정(예시, 5일)
- **D1**: 입력/물리/카메라/타일 충돌
- **D2**: 대화 시스템 + UI/HUD
- **D3**: NPC 스폰/영입/팔로우
- **D4**: 문 열림/클리어 연동(상품 URL), 사운드
- **D5**: 연출/폴리싱/버그픽스 + 빌드

---

## 16. 환경 변수
- `PRODUCT_URL`: 문 열림 후 이동할 **캐릭터 상품 페이지 URL** (배포 시 `.env`/메타태그/전역 상수로 주입)

---

## 17. 확장 아이디어(차기 버전)
- 간단한 함정/적(회피 중심)
- 동료별 패시브 버프(이동속도 +, 점프력 +, 대화 힌트 등)
- 스테이지 다중 구성 및 랭크 타임
