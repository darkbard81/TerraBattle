# Character Core Structure

## JSON Shape

```json
{
  "id": "char_001",
  "name": "Sample Hero",
  "description": "Sample character data for core structure.",
  "image_path": "assets/characters/sample_hero.png",
  "tile_x": 0,
  "tile_y": 0,
  "tile_w": 1,
  "tile_h": 1,
  "level": 1,
  "exp": 0,
  "skill_slots": {
    "1": "skill_basic_attack",
    "2": "skill_power_strike",
    "3": "skill_guard_boost",
    "4": "skill_heal"
  },
  "STR": 50,
  "VIT": 50,
  "DEX": 50,
  "AGI": 50,
  "AVD": 50,
  "INT": 50,
  "MND": 50,
  "RES": 50,
  "LUK": 50,
  "current_grown_type": "Balanced",
  "HP": 55
}
```

## Field Description

* `id`: 캐릭터 식별자
* `name`: 캐릭터 이름
* `description`: 캐릭터 설명
* `image_path`: 캐릭터 이미지 경로
* `tile_x`: 스프라이트 시트 기준 시작 X 좌표
* `tile_y`: 스프라이트 시트 기준 시작 Y 좌표
* `tile_w`: 타일 너비
* `tile_h`: 타일 높이
* `level`: 현재 레벨
* `exp`: 현재 누적 경험치
* `skill_slots`: 장착 스킬 슬롯

  * `1`: 기본스킬 슬롯
  * `2~4`: 교체 가능한 스킬 슬롯
* `STR`: 힘
* `VIT`: 체력
* `DEX`: 기술
* `AGI`: 민첩
* `AVD`: 회피
* `INT`: 지능
* `MND`: 정신
* `RES`: 저항
* `LUK`: 운
* `current_grown_type`: 현재 성장방식

  * `Power`
  * `Technique`
  * `Arcane`
  * `Ward`
  * `Balanced`
* `HP`: 현재 HP

## Minimal Template

```json
{
  "id": "",
  "name": "",
  "description": "",
  "image_path": "",
  "tile_x": 0,
  "tile_y": 0,
  "tile_w": 1,
  "tile_h": 1,
  "level": 1,
  "exp": 0,
  "skill_slots": {
    "1": null,
    "2": null,
    "3": null,
    "4": null
  },
  "STR": 50,
  "VIT": 50,
  "DEX": 50,
  "AGI": 50,
  "AVD": 50,
  "INT": 50,
  "MND": 50,
  "RES": 50,
  "LUK": 50,
  "current_grown_type": "Balanced",
  "HP": 55
}
```
