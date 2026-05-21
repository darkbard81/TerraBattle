import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_SETTINGS,
  parseGameSettings,
  serializeGameSettings,
  type GameSettings,
} from "./GameSettings.js";

describe("GameSettings", () => {
  it("저장된 설정이 없으면 기본 설정을 반환한다", () => {
    expect(parseGameSettings(null)).toEqual(DEFAULT_GAME_SETTINGS);
  });

  it("저장된 설정을 파싱하고 볼륨을 0과 1 사이로 제한한다", () => {
    const settings = parseGameSettings(
      JSON.stringify({
        bgmVolume: 2,
        inputMode: "relaxed",
        motionMode: "reduced",
        resolutionMode: "fill",
        sfxVolume: -1,
        soundMode: "muted",
      }),
    );

    expect(settings).toEqual({
      bgmVolume: 1,
      inputMode: "relaxed",
      motionMode: "reduced",
      resolutionMode: "fill",
      sfxVolume: 0,
      soundMode: "muted",
    });
  });

  it("설정을 localStorage 저장 문자열로 변환한다", () => {
    const settings: GameSettings = {
      bgmVolume: 0.4,
      inputMode: "standard",
      motionMode: "full",
      resolutionMode: "fit",
      sfxVolume: 0.8,
      soundMode: "on",
    };

    expect(parseGameSettings(serializeGameSettings(settings))).toEqual(settings);
  });
});
