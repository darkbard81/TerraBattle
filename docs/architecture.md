# TerraBattle Architecture

Foundation 단계에서 합의한 최소 아키텍처 규칙입니다.

## 레이어 책임

- **Presentation (React + Pixi)**
  - 장면 전환, HUD, 입력 이벤트 연결을 담당합니다.
  - 게임 규칙 계산은 수행하지 않습니다.
- **Application**
  - 유스케이스를 오케스트레이션하고 도메인 객체를 조합합니다.
- **Domain**
  - 전투 규칙, 엔티티, 순수한 상태 전이 로직을 소유합니다.
- **Ports**
  - 저장소, 난수, 시간 등 외부 의존 인터페이스를 정의합니다.
- **Infrastructure**
  - Ports 인터페이스의 실제 구현(IndexedDB, 파일, API 등)을 제공합니다.

## 의존 방향

`Presentation -> Application -> Domain`

`Application -> Ports <- Infrastructure`

## 폴더 기준

```text
src/
  game/
    domain/
    application/
    ports/
    infrastructure/
  content/
  tools/
```

## Foundation 원칙

- 상태의 진실은 도메인/게임 상태에 둡니다.
- 렌더링 계층은 상태를 반영만 합니다.
- 새 기능은 먼저 Domain/Application 테스트 가능 단위부터 만듭니다.
