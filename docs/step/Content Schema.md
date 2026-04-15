# Content Schema 단계

Content Schema 단계는 `docs/*`에 정의된 규칙을 바탕으로 콘텐츠를 **JSON 기반 데이터 + 검증 파이프라인**으로 고정하는 단계다.

## 구현 범위(v1)

- Skill Schema v1
- Character Schema v1
- Map Schema v1 (최소 구조)
- Dialogue Schema v1 (노드 그래프 최소 구조)
- Pack Manifest Schema v1
- 구조 검증기 + 참조 무결성 검사기
- 개발용 Pack(`dev`) 로더
- canonical JSON 문자열 유틸

## 파일 구조

```text
src/content/
  domain/
    ContentSchema.types.ts
  schema/
    common.schema.json
    skill.schema.json
    skills.file.schema.json
    character.schema.json
    characters.file.schema.json
    map.schema.json
    dialogue.schema.json
    pack.schema.json
  packs/
    dev/
      pack.json
      skills.json
      characters.json
      maps/map_demo.json
      dialogues/dlg_intro.json
  runtime/
    ContentValidator.ts
    ContentIntegrityChecker.ts
    ContentMigrator.ts
    ContentRepository.ts
    canonicalizeJson.ts
    ContentPipeline.test.ts
```

## 규칙 요약

### Skill

- `proc_chance`: `1~100`
- `effect_type`: `damage | buff | debuff | heal`
- `attack_type`: `physical | magical | auto`
- `target_side`: `self | ally | enemy`
- `buff/debuff`는 `affected_stat` 필수

### Character

- 스킬 슬롯은 `"1".."4"` 고정
- 성장 타입은 `Power | Technique | Arcane | Ward | Balanced`
- 레벨 1에서 기본 스탯 50이 아니면 warning

### Integrity(교차 검증)

- ID 중복 검사(스킬/캐릭터/트리거/노드)
- Character 스킬 슬롯의 skill ID 존재성 검사
- 1번 슬롯 스킬 규칙 검사
  - `replaceable=false`
  - `proc_chance=100`
- Map spawn의 `unit_id` 존재성 검사(없으면 warning)
- Dialogue 링크(`start_node_id`, `next`, `target`) 유효성 검사

## 로딩 파이프라인

1. `StaticContentRepository.loadPack("dev")`
2. `ContentMigrator`로 목표 스키마 버전 이동
3. `ContentValidator` 구조 검증
4. `ContentIntegrityChecker` 참조 무결성 검사
5. error가 없을 때만 런타임 주입

## 참고

- 현재 검증기는 문서 기반 v1 규칙을 TypeScript 로직으로 구현했다.
- `src/content/schema/*.json`은 툴링/문서화를 위한 계약 파일로 함께 유지한다.
