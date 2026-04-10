/**
 * 앱에서 사용하는 장면 종류를 정의한다.
 */
export type SceneType = "title" | "battle" | "result";

/**
 * 턴 소유자를 정의한다.
 */
export type TurnOwner = "player" | "enemy";

/**
 * 전역 모달 종류를 정의한다.
 */
export type GameModal = "load-game" | "options" | null;

/**
 * 전역 게임 상태를 정의한다.
 */
export interface GameState {
  readonly scene: SceneType;
  readonly turn: TurnOwner;
  readonly selectedUnitId: string | null;
  readonly modal: GameModal;
}

/**
 * 전역 게임 상태 액션을 정의한다.
 */
export type GameStateAction =
  | {
      readonly type: "set-scene";
      readonly scene: SceneType;
    }
  | {
      readonly type: "set-turn";
      readonly turn: TurnOwner;
    }
  | {
      readonly type: "set-selected-unit";
      readonly selectedUnitId: string | null;
    }
  | {
      readonly type: "open-modal";
      readonly modal: Exclude<GameModal, null>;
    }
  | {
      readonly type: "close-modal";
    };
