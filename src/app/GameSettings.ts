/**
 * 사운드 출력 정책이다.
 */
export type SoundMode = "on" | "muted";

/**
 * 가상 스테이지 표시 배율 정책이다.
 */
export type ResolutionMode = "fit" | "fill";

/**
 * 전투 입력 시간 정책이다.
 */
export type InputMode = "standard" | "relaxed";

/**
 * 화면 연출량 정책이다.
 */
export type MotionMode = "full" | "reduced";

/**
 * 게임 전체에서 공유하는 최소 설정값이다.
 */
export interface GameSettings {
  readonly soundMode: SoundMode;
  readonly bgmVolume: number;
  readonly sfxVolume: number;
  readonly resolutionMode: ResolutionMode;
  readonly inputMode: InputMode;
  readonly motionMode: MotionMode;
}

/**
 * 저장값이 없거나 깨졌을 때 사용하는 기본 설정이다.
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  bgmVolume: 0.6,
  inputMode: "standard",
  motionMode: "full",
  resolutionMode: "fit",
  sfxVolume: 0.75,
  soundMode: "on",
};

/**
 * 알 수 없는 값을 지정 범위 안의 숫자로 제한한다.
 *
 * @param value 제한할 값
 * @returns 0 이상 1 이하 숫자
 */
function clampUnit(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
}

/**
 * localStorage 문자열을 게임 설정으로 변환한다.
 *
 * @param serializedSettings 직렬화된 설정 문자열
 * @returns 파싱된 설정값
 */
export function parseGameSettings(
  serializedSettings: string | null,
): GameSettings {
  if (serializedSettings === null) {
    return DEFAULT_GAME_SETTINGS;
  }

  try {
    const parsed = JSON.parse(serializedSettings) as Partial<GameSettings>;

    return {
      bgmVolume:
        parsed.bgmVolume === undefined
          ? DEFAULT_GAME_SETTINGS.bgmVolume
          : clampUnit(parsed.bgmVolume),
      inputMode: parsed.inputMode === "relaxed" ? "relaxed" : "standard",
      motionMode: parsed.motionMode === "reduced" ? "reduced" : "full",
      resolutionMode: parsed.resolutionMode === "fill" ? "fill" : "fit",
      sfxVolume:
        parsed.sfxVolume === undefined
          ? DEFAULT_GAME_SETTINGS.sfxVolume
          : clampUnit(parsed.sfxVolume),
      soundMode: parsed.soundMode === "muted" ? "muted" : "on",
    };
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

/**
 * 게임 설정을 localStorage에 저장할 문자열로 변환한다.
 *
 * @param settings 저장할 설정
 * @returns 직렬화된 설정 문자열
 */
export function serializeGameSettings(settings: GameSettings): string {
  return JSON.stringify(settings);
}
