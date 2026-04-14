# Skill Core Structure

## Skill

* `id`: 스킬 식별자

* `name`: 스킬 이름

* `slot`: 장착 슬롯 번호

  * `1` = 기본스킬
  * `2~4` = 교체형 스킬

* `replaceable`: 교체 가능 여부

  * `slot 1` = `false`
  * `slot 2~4` = `true`

* `proc_chance`: 발동 확률

  * `slot 1` 기본스킬은 `100`
  * `slot 2~4`는 개별 확률값 사용

* `effect_type`: 스킬 효과 종류

  * `damage`
  * `buff`
  * `debuff`
  * `heal`

* `attack_type`: 판정 타입

  * `physical`
  * `magical`
  * `auto`

  설명:

  * `physical` = `PHIT vs PEVA`, `PATK vs PDEF` 사용
  * `magical` = `MHIT vs MEVA`, `MATK vs MDEF` 사용
  * `auto` = 명중 판정 없이 `100%` 적용

* `target_side`: 대상 진영

  * `self`
  * `ally`
  * `enemy`

* `source_stat`: 수치 계산에 사용하는 기본능력치
  예:

  * `STR`
  * `VIT`
  * `DEX`
  * `AGI`
  * `AVD`
  * `INT`
  * `MND`
  * `RES`
  * `LUK`

* `affected_stat`: 실제로 변하는 능력치
  설명:

  * `damage / heal`은 보통 없음
  * `buff / debuff`에서 사용

  예:

  * `VIT` 증가 버프면 `affected_stat = VIT`
  * `AVD` 감소 디버프면 `affected_stat = AVD`

* `multiplier`: 계수
  설명:

  * `source_stat`에 곱해지는 수치

  예:

  * `STR 1.5x`면 `multiplier = 1.5`
  * `INT 2x`면 `multiplier = 2.0`
  * `VIT 3x` 버프면 `multiplier = 3.0`

* `hit_count`: 타격 수
  설명:

  * `damage / heal / 복합공격`에서 사용
  * `Multi-Hit`이면 `2` 이상
  * 각 타격은 개별 명중 판정

* `duration_turns`: 지속 턴 수
  설명:

  * `buff / debuff / boost`에 사용
  * 즉시효과는 `0` 또는 없음

* `composite_hits`: 복합공격 정의
  설명:

  * 물리타와 마법타가 섞인 `Multi-Hit`일 때 사용
  * 각 타격을 개별 정의

  형식 예:

  ```txt
  [
    { attack_type: physical, source_stat: STR, multiplier: 1.0, hit_count: 1 },
    { attack_type: magical, source_stat: INT, multiplier: 1.2, hit_count: 1 }
  ]
  ```

* `description`: 스킬 설명 문장

---

## Meaning of Each Effect Type

### 1) `damage`

* 적에게 피해를 준다.
* `physical` 또는 `magical` 판정을 사용한다.
* `hit_count`가 `2` 이상이면 `Multi-Hit`이다.
* 복합공격이면 `composite_hits`를 사용한다.

### 2) `buff`

* 자신 또는 아군의 기본능력치를 일정 턴 동안 증가시킨다.
* `affected_stat`이 반드시 필요하다.
* `source_stat`과 `affected_stat`은 같을 수도 있고 다를 수도 있다.

예:

* `VIT`를 `VIT` 기준으로 올리는 버프
* `RES`를 `MND` 기준으로 올리는 버프

### 3) `debuff`

* 적의 기본능력치를 일정 턴 동안 감소시킨다.
* `affected_stat`이 반드시 필요하다.
* `attack_type`이 `physical` 또는 `magical`이면 명중률을 계산한다.
* `attack_type`이 `auto`면 `100%` 적용한다.

### 4) `heal`

* 자신 또는 아군의 HP를 회복한다.
* 물리회복 / 마법회복 두 가지가 가능하다.
* 회복량은 데미지 계산식을 그대로 따르되, 결과를 HP 회복으로 적용한다.
* 기본은 `auto = 100% 명중`으로 두는 것이 가장 단순하다.

---

## Skill Resolution Rules

1. 캐릭터는 `4개의 스킬 슬롯`을 가진다.
2. `1번 슬롯`은 기본스킬이며 `100% 발동`, `교체 불가`이다.
3. `2~4번 슬롯`은 교체 가능하며 개별 발동확률을 가진다.
4. 스킬은 `1번 슬롯부터 4번 슬롯까지 순서대로 발동 판정`한다.
5. 발동에 성공한 스킬은 모두 `순차적으로 발동`한다.
6. 실패한 스킬은 건너뛴다.
7. 각 스킬은 `완전히 해결된 뒤` 다음 스킬로 넘어간다.
8. 앞에서 발동한 `Buff / Debuff / Boost`의 결과는 뒤 스킬 계산에 즉시 반영된다.
9. `Multi-Hit`은 한 스킬 내부에서 모두 해결한 뒤 다음 슬롯으로 넘어간다.
10. 지속 턴 감소는 전체 스킬 체인 종료 후 처리한다.

---

## Required Distinction

`source_stat`과 `affected_stat`은 반드시 구분한다.

### `source_stat`

“얼마나 강한가”를 계산하는 기준 능력치

### `affected_stat`

“무엇이 변하는가”를 의미하는 실제 변경 대상 능력치

예:

* `Buff: VIT 3x for 3turn`

  * `source_stat = VIT`
  * `affected_stat = VIT`

* `Debuff: -AVD 2x for 2turn`

  * `source_stat = INT` 또는 `MND` 또는 별도 지정값
  * `affected_stat = AVD`

이 구분이 없으면
“무엇을 기준으로 얼마나 변하는가”가 모호해진다.

---

## Recommended Minimal Schema

* `id`
* `name`
* `slot`
* `replaceable`
* `proc_chance`
* `effect_type`
* `attack_type`
* `target_side`
* `source_stat`
* `affected_stat`
* `multiplier`
* `hit_count`
* `duration_turns`
* `composite_hits`
* `description`

---

## Examples

### 1) `STR 1.5x 3회`

* `effect_type = damage`
* `attack_type = physical`
* `target_side = enemy`
* `source_stat = STR`
* `multiplier = 1.5`
* `hit_count = 3`
* `duration_turns = 0`

### 2) `INT 2x 2회`

* `effect_type = damage`
* `attack_type = magical`
* `target_side = enemy`
* `source_stat = INT`
* `multiplier = 2.0`
* `hit_count = 2`
* `duration_turns = 0`

### 3) `Buff - 100%명중 VIT 3x for 3turn`

* `effect_type = buff`
* `attack_type = auto`
* `target_side = self` or `ally`
* `source_stat = VIT`
* `affected_stat = VIT`
* `multiplier = 3.0`
* `hit_count = 1`
* `duration_turns = 3`

### 4) `Debuff - 명중률 고려, -AVD 2x for 2turn`

* `effect_type = debuff`
* `attack_type = magical` or `physical`
* `target_side = enemy`
* `source_stat = INT` or `MND`
* `affected_stat = AVD`
* `multiplier = 2.0`
* `hit_count = 1`
* `duration_turns = 2`

### 5) `Heal - 물리회복`

* `effect_type = heal`
* `attack_type = auto`
* `target_side = self` or `ally`
* `source_stat = STR`
* `multiplier = 1.5`
* `hit_count = 1`
* `duration_turns = 0`

### 6) `Heal - 마법회복`

* `effect_type = heal`
* `attack_type = auto`
* `target_side = self` or `ally`
* `source_stat = INT`
* `multiplier = 2.0`
* `hit_count = 1`
* `duration_turns = 0`

### 7) `복합공격`

* `effect_type = damage`
* `composite_hits =`

  ```txt
  [
    { attack_type: physical, source_stat: STR, multiplier: 1.0, hit_count: 1 },
    { attack_type: magical, source_stat: INT, multiplier: 1.5, hit_count: 2 }
  ]
  ```

---

## One-Line Summary

스킬은
**“슬롯에 장착되고, 확률로 발동되며, 순차적으로 해결되는 `damage / buff / debuff / heal` 효과 객체”**
로 정의한다.
