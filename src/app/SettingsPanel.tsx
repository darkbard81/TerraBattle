import React from "react";
import type { GameSettings } from "./GameSettings.js";

/**
 * 설정 패널 입력값이다.
 */
export interface SettingsPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onOpen: () => void;
  readonly onSettingsChange: (settings: GameSettings) => void;
  readonly settings: GameSettings;
}

/**
 * 최소 사운드, 해상도, 입력 설정 메뉴를 표시한다.
 *
 * @param props 설정 상태와 이벤트 핸들러
 * @returns 설정 메뉴 UI
 */
export function SettingsPanel(
  props: SettingsPanelProps,
): React.ReactElement {
  const updateSettings = (settings: Partial<GameSettings>): void => {
    props.onSettingsChange({
      ...props.settings,
      ...settings,
    });
  };

  return (
    <>
      <button
        aria-expanded={props.isOpen}
        className="app-settings-button"
        onClick={props.isOpen ? props.onClose : props.onOpen}
        type="button"
      >
        Settings
      </button>
      {props.isOpen ? (
        <aside
          aria-label="게임 설정"
          className="app-settings-panel"
        >
          <header className="app-settings-panel__header">
            <h2 className="app-settings-panel__title">Settings</h2>
            <button
              className="app-settings-panel__close"
              onClick={props.onClose}
              type="button"
            >
              Close
            </button>
          </header>

          <section className="app-settings-panel__section">
            <h3 className="app-settings-panel__section-title">Sound</h3>
            <label className="app-settings-panel__row">
              <span>Output</span>
              <select
                onChange={(event) =>
                  updateSettings({
                    soundMode:
                      event.currentTarget.value === "muted" ? "muted" : "on",
                  })
                }
                value={props.settings.soundMode}
              >
                <option value="on">On</option>
                <option value="muted">Muted</option>
              </select>
            </label>
            <label className="app-settings-panel__row">
              <span>BGM</span>
              <input
                disabled={props.settings.soundMode === "muted"}
                max="1"
                min="0"
                onChange={(event) =>
                  updateSettings({
                    bgmVolume: Number(event.currentTarget.value),
                  })
                }
                step="0.05"
                type="range"
                value={props.settings.bgmVolume}
              />
            </label>
            <label className="app-settings-panel__row">
              <span>SFX</span>
              <input
                disabled={props.settings.soundMode === "muted"}
                max="1"
                min="0"
                onChange={(event) =>
                  updateSettings({
                    sfxVolume: Number(event.currentTarget.value),
                  })
                }
                step="0.05"
                type="range"
                value={props.settings.sfxVolume}
              />
            </label>
          </section>

          <section className="app-settings-panel__section">
            <h3 className="app-settings-panel__section-title">Display</h3>
            <label className="app-settings-panel__row">
              <span>Resolution</span>
              <select
                onChange={(event) =>
                  updateSettings({
                    resolutionMode:
                      event.currentTarget.value === "fill" ? "fill" : "fit",
                  })
                }
                value={props.settings.resolutionMode}
              >
                <option value="fit">Fit</option>
                <option value="fill">Fill</option>
              </select>
            </label>
            <label className="app-settings-panel__row">
              <span>Motion</span>
              <select
                onChange={(event) =>
                  updateSettings({
                    motionMode:
                      event.currentTarget.value === "reduced"
                        ? "reduced"
                        : "full",
                  })
                }
                value={props.settings.motionMode}
              >
                <option value="full">Full</option>
                <option value="reduced">Reduced</option>
              </select>
            </label>
          </section>

          <section className="app-settings-panel__section">
            <h3 className="app-settings-panel__section-title">Input</h3>
            <label className="app-settings-panel__row">
              <span>Turn Timer</span>
              <select
                onChange={(event) =>
                  updateSettings({
                    inputMode:
                      event.currentTarget.value === "relaxed"
                        ? "relaxed"
                        : "standard",
                  })
                }
                value={props.settings.inputMode}
              >
                <option value="standard">Standard</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </label>
          </section>
        </aside>
      ) : null}
    </>
  );
}
