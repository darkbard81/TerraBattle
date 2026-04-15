import React, { useEffect, useMemo, useState } from "react";
import type {
  CharacterDef,
  ContentPack,
  SkillDef,
  StatKey,
  ValidationIssue,
} from "../../content/domain/ContentSchema.types.js";
import { ContentIntegrityChecker } from "../../content/runtime/ContentIntegrityChecker.js";
import { ContentMigrator } from "../../content/runtime/ContentMigrator.js";
import { StaticContentRepository } from "../../content/runtime/ContentRepository.js";
import { ContentValidator } from "../../content/runtime/ContentValidator.js";
import type { DerivedStats } from "../domain/CharacterCombatPreviewService.js";
import { CharacterCombatPreviewService } from "../domain/CharacterCombatPreviewService.js";
import { ToolPackService } from "../domain/ToolPackService.js";

const STAT_KEYS: readonly StatKey[] = ["STR", "VIT", "DEX", "AGI", "AVD", "INT", "MND", "RES", "LUK"];

const EMPTY_SKILL: SkillDef = {
  id: "",
  name: "",
  replaceable: true,
  proc_chance: 1,
  effect_type: "damage",
  attack_type: "physical",
  target_side: "enemy",
  source_stat: "STR",
  affected_stat: null,
  multiplier: 1,
  hit_count: 1,
  duration_turns: 0,
  description: "",
};

const EMPTY_CHARACTER: CharacterDef = {
  id: "",
  name: "",
  description: "",
  image_path: "",
  tile_x: 0,
  tile_y: 0,
  tile_w: 1,
  tile_h: 1,
  level: 1,
  exp: 0,
  skill_slots: { "1": null, "2": null, "3": null, "4": null },
  STR: 50,
  VIT: 50,
  DEX: 50,
  AGI: 50,
  AVD: 50,
  INT: 50,
  MND: 50,
  RES: 50,
  LUK: 50,
  current_grown_type: "Balanced",
  HP: 50,
};

/**
 * Tool MVP 단계의 스킬/캐릭터 편집기를 렌더링한다.
 *
 * @returns Tool MVP 편집 화면
 */
export function ToolMvpEditor(): React.ReactElement {
  const [basePack, setBasePack] = useState<ContentPack | null>(null);
  const [skills, setSkills] = useState<readonly SkillDef[]>([]);
  const [characters, setCharacters] = useState<readonly CharacterDef[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [issues, setIssues] = useState<readonly ValidationIssue[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("초기 로딩 중...");

  const toolPackService = useMemo(() => new ToolPackService(), []);
  const combatPreviewService = useMemo(() => new CharacterCombatPreviewService(), []);

  useEffect(() => {
    const repository = new StaticContentRepository(
      new ContentValidator(),
      new ContentIntegrityChecker(),
      new ContentMigrator(),
    );

    repository
      .loadPack("dev")
      .then((pack) => {
        setBasePack(pack);
        setSkills(pack.skills);
        setCharacters(pack.characters);
        setSelectedSkillId(pack.skills[0]?.id ?? null);
        setSelectedCharacterId(pack.characters[0]?.id ?? null);
        setStatusMessage("dev pack 로딩 완료");
      })
      .catch((error: unknown) => {
        setStatusMessage(`로딩 실패: ${String(error)}`);
      });
  }, []);

  useEffect(() => {
    if (basePack == null) {
      return;
    }
    const merged = toolPackService.buildPack(basePack, skills, characters);
    setIssues(toolPackService.validatePack(merged));
  }, [basePack, characters, skills, toolPackService]);

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === selectedSkillId) ?? null,
    [selectedSkillId, skills],
  );
  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId],
  );

  const opponentCharacter = useMemo(() => {
    if (selectedCharacter == null) {
      return null;
    }
    return characters.find((character) => character.id !== selectedCharacter.id) ?? null;
  }, [characters, selectedCharacter]);

  const derivedStats = useMemo((): DerivedStats | null => {
    if (selectedCharacter == null) {
      return null;
    }
    return combatPreviewService.calculateDerivedStats(selectedCharacter);
  }, [combatPreviewService, selectedCharacter]);

  const combatPreview = useMemo(() => {
    if (selectedCharacter == null || opponentCharacter == null) {
      return null;
    }
    return combatPreviewService.calculateCombatPreview(selectedCharacter, opponentCharacter);
  }, [combatPreviewService, opponentCharacter, selectedCharacter]);

  const hasError = issues.some((issue) => issue.severity === "error");

  const onSkillChange = <K extends keyof SkillDef>(key: K, value: SkillDef[K]): void => {
    if (selectedSkillId == null) {
      return;
    }

    setSkills((previous) =>
      previous.map((skill) =>
        skill.id === selectedSkillId
          ? {
              ...skill,
              [key]: value,
            }
          : skill,
      ),
    );

    if (key === "id") {
      const nextSkillId = value as string;
      setCharacters((previous) =>
        previous.map((character) => ({
          ...character,
          skill_slots: {
            "1": character.skill_slots["1"] === selectedSkillId ? nextSkillId : character.skill_slots["1"],
            "2": character.skill_slots["2"] === selectedSkillId ? nextSkillId : character.skill_slots["2"],
            "3": character.skill_slots["3"] === selectedSkillId ? nextSkillId : character.skill_slots["3"],
            "4": character.skill_slots["4"] === selectedSkillId ? nextSkillId : character.skill_slots["4"],
          },
        })),
      );
      setSelectedSkillId(nextSkillId);
    }
  };

  const onCharacterChange = <K extends keyof CharacterDef>(
    key: K,
    value: CharacterDef[K],
  ): void => {
    if (selectedCharacterId == null) {
      return;
    }

    setCharacters((previous) =>
      previous.map((character) =>
        character.id === selectedCharacterId
          ? {
              ...character,
              [key]: value,
            }
          : character,
      ),
    );

    if (key === "id") {
      setSelectedCharacterId(value as string);
    }
  };

  const onSkillSlotChange = (slotKey: "1" | "2" | "3" | "4", value: string): void => {
    if (selectedCharacter == null) {
      return;
    }

    onCharacterChange("skill_slots", {
      ...selectedCharacter.skill_slots,
      [slotKey]: value.length === 0 ? null : value,
    });
  };

  const addSkill = (): void => {
    const newSkillId = generateSequentialId("skill", skills.map((skill) => skill.id));
    const newSkill: SkillDef = {
      ...EMPTY_SKILL,
      id: newSkillId,
      name: `새 스킬 ${skills.length + 1}`,
    };

    setSkills((previous) => [...previous, newSkill]);
    setSelectedSkillId(newSkillId);
  };

  const addCharacter = (): void => {
    const newCharacterId = generateSequentialId("char", characters.map((character) => character.id));
    const firstSkillId = skills[0]?.id ?? null;
    const newCharacter: CharacterDef = {
      ...EMPTY_CHARACTER,
      id: newCharacterId,
      name: `새 캐릭터 ${characters.length + 1}`,
      skill_slots: {
        "1": firstSkillId,
        "2": null,
        "3": null,
        "4": null,
      },
    };

    setCharacters((previous) => [...previous, newCharacter]);
    setSelectedCharacterId(newCharacterId);
  };

  const removeSelectedSkill = (): void => {
    if (selectedSkill == null) {
      return;
    }

    setSkills((previous) => previous.filter((skill) => skill.id !== selectedSkill.id));
    setSelectedSkillId((previousSelectedId) => {
      if (previousSelectedId !== selectedSkill.id) {
        return previousSelectedId;
      }
      const next = skills.find((skill) => skill.id !== selectedSkill.id);
      return next?.id ?? null;
    });
  };

  const removeSelectedCharacter = (): void => {
    if (selectedCharacter == null) {
      return;
    }

    setCharacters((previous) => previous.filter((character) => character.id !== selectedCharacter.id));
    setSelectedCharacterId((previousSelectedId) => {
      if (previousSelectedId !== selectedCharacter.id) {
        return previousSelectedId;
      }
      const next = characters.find((character) => character.id !== selectedCharacter.id);
      return next?.id ?? null;
    });
  };

  const downloadJson = (filename: string, text: string): void => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportData = (): void => {
    const result = toolPackService.export(skills, characters);
    downloadJson("skills.json", result.skillsJson);
    downloadJson("characters.json", result.charactersJson);
    setStatusMessage("skills.json / characters.json export 완료");
  };

  const onSkillsImport = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file == null) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as SkillDef[];
      setSkills(parsed);
      setSelectedSkillId(parsed[0]?.id ?? null);
      setStatusMessage(`스킬 import 완료: ${file.name}`);
    } catch (error) {
      setStatusMessage(`스킬 import 실패: ${String(error)}`);
    }
  };

  const onCharactersImport = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file == null) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as CharacterDef[];
      setCharacters(parsed);
      setSelectedCharacterId(parsed[0]?.id ?? null);
      setStatusMessage(`캐릭터 import 완료: ${file.name}`);
    } catch (error) {
      setStatusMessage(`캐릭터 import 실패: ${String(error)}`);
    }
  };

  return (
    <main className="tool-mvp">
      <header className="tool-mvp__header">
        <h1>TerraBattle Tool MVP</h1>
        <p>{statusMessage}</p>
        <div className="tool-mvp__header-actions">
          <button type="button" onClick={exportData} disabled={hasError}>
            Export skills/characters
          </button>
          <label>
            Import Skills
            <input type="file" accept="application/json" onChange={onSkillsImport} />
          </label>
          <label>
            Import Characters
            <input type="file" accept="application/json" onChange={onCharactersImport} />
          </label>
        </div>
      </header>

      <section className="tool-mvp__columns">
        <aside className="tool-mvp__panel">
          <div className="tool-mvp__panel-header">
            <h2>Skills</h2>
            <div>
              <button type="button" onClick={addSkill}>
                +
              </button>
              <button type="button" onClick={removeSelectedSkill} disabled={selectedSkill == null}>
                -
              </button>
            </div>
          </div>
          <ul className="tool-mvp__list">
            {skills.map((skill) => (
              <li key={skill.id}>
                <button
                  type="button"
                  className={skill.id === selectedSkillId ? "is-selected" : ""}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  {skill.id}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="tool-mvp__panel">
          <h2>Skill Inspector</h2>
          {selectedSkill == null ? (
            <p>선택된 스킬이 없습니다.</p>
          ) : (
            <div className="tool-mvp__form-grid">
              <label>
                ID
                <input value={selectedSkill.id} onChange={(event) => onSkillChange("id", event.target.value)} />
              </label>
              <label>
                Name
                <input value={selectedSkill.name} onChange={(event) => onSkillChange("name", event.target.value)} />
              </label>
              <label>
                Replaceable
                <select
                  value={String(selectedSkill.replaceable)}
                  onChange={(event) => onSkillChange("replaceable", event.target.value === "true")}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>
              <label>
                Proc Chance
                <input
                  type="number"
                  value={selectedSkill.proc_chance}
                  onChange={(event) => onSkillChange("proc_chance", Number(event.target.value))}
                />
              </label>
              <label>
                Effect Type
                <select
                  value={selectedSkill.effect_type}
                  onChange={(event) => onSkillChange("effect_type", event.target.value as SkillDef["effect_type"])}
                >
                  <option value="damage">damage</option>
                  <option value="buff">buff</option>
                  <option value="debuff">debuff</option>
                  <option value="heal">heal</option>
                </select>
              </label>
              <label>
                Attack Type
                <select
                  value={selectedSkill.attack_type}
                  onChange={(event) => onSkillChange("attack_type", event.target.value as SkillDef["attack_type"])}
                >
                  <option value="physical">physical</option>
                  <option value="magical">magical</option>
                  <option value="auto">auto</option>
                </select>
              </label>
              <label>
                Target Side
                <select
                  value={selectedSkill.target_side}
                  onChange={(event) => onSkillChange("target_side", event.target.value as SkillDef["target_side"])}
                >
                  <option value="self">self</option>
                  <option value="ally">ally</option>
                  <option value="enemy">enemy</option>
                </select>
              </label>
              <label>
                Source Stat
                <select
                  value={selectedSkill.source_stat}
                  onChange={(event) => onSkillChange("source_stat", event.target.value as StatKey)}
                >
                  {STAT_KEYS.map((statKey) => (
                    <option key={statKey} value={statKey}>
                      {statKey}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Affected Stat
                <select
                  value={selectedSkill.affected_stat ?? ""}
                  onChange={(event) =>
                    onSkillChange("affected_stat", event.target.value.length === 0 ? null : (event.target.value as StatKey))
                  }
                >
                  <option value="">none</option>
                  {STAT_KEYS.map((statKey) => (
                    <option key={statKey} value={statKey}>
                      {statKey}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Multiplier
                <input
                  type="number"
                  step="0.1"
                  value={selectedSkill.multiplier}
                  onChange={(event) => onSkillChange("multiplier", Number(event.target.value))}
                />
              </label>
              <label>
                Hit Count
                <input
                  type="number"
                  value={selectedSkill.hit_count}
                  onChange={(event) => onSkillChange("hit_count", Number(event.target.value))}
                />
              </label>
              <label>
                Duration Turns
                <input
                  type="number"
                  value={selectedSkill.duration_turns}
                  onChange={(event) => onSkillChange("duration_turns", Number(event.target.value))}
                />
              </label>
              <label className="tool-mvp__field-full">
                Description
                <textarea
                  value={selectedSkill.description}
                  rows={3}
                  onChange={(event) => onSkillChange("description", event.target.value)}
                />
              </label>
            </div>
          )}
        </section>

        <section className="tool-mvp__panel">
          <div className="tool-mvp__panel-header">
            <h2>Characters</h2>
            <div>
              <button type="button" onClick={addCharacter}>
                +
              </button>
              <button type="button" onClick={removeSelectedCharacter} disabled={selectedCharacter == null}>
                -
              </button>
            </div>
          </div>
          <ul className="tool-mvp__list">
            {characters.map((character) => (
              <li key={character.id}>
                <button
                  type="button"
                  className={character.id === selectedCharacterId ? "is-selected" : ""}
                  onClick={() => setSelectedCharacterId(character.id)}
                >
                  {character.id}
                </button>
              </li>
            ))}
          </ul>
          {selectedCharacter != null ? (
            <div className="tool-mvp__form-grid">
              <label>
                ID
                <input
                  value={selectedCharacter.id}
                  onChange={(event) => onCharacterChange("id", event.target.value)}
                />
              </label>
              <label>
                Name
                <input
                  value={selectedCharacter.name}
                  onChange={(event) => onCharacterChange("name", event.target.value)}
                />
              </label>
              <label>
                Image Path
                <input
                  value={selectedCharacter.image_path}
                  onChange={(event) => onCharacterChange("image_path", event.target.value)}
                />
              </label>
              <label>
                Growth
                <select
                  value={selectedCharacter.current_grown_type}
                  onChange={(event) =>
                    onCharacterChange(
                      "current_grown_type",
                      event.target.value as CharacterDef["current_grown_type"],
                    )
                  }
                >
                  <option value="Power">Power</option>
                  <option value="Technique">Technique</option>
                  <option value="Arcane">Arcane</option>
                  <option value="Ward">Ward</option>
                  <option value="Balanced">Balanced</option>
                </select>
              </label>
              <label>
                Level
                <input
                  type="number"
                  value={selectedCharacter.level}
                  onChange={(event) => onCharacterChange("level", Number(event.target.value))}
                />
              </label>
              <label>
                EXP
                <input
                  type="number"
                  value={selectedCharacter.exp}
                  onChange={(event) => onCharacterChange("exp", Number(event.target.value))}
                />
              </label>
              <label>
                HP
                <input
                  type="number"
                  value={selectedCharacter.HP}
                  onChange={(event) => onCharacterChange("HP", Number(event.target.value))}
                />
              </label>
              <label>
                Tile X
                <input
                  type="number"
                  value={selectedCharacter.tile_x}
                  onChange={(event) => onCharacterChange("tile_x", Number(event.target.value))}
                />
              </label>
              <label>
                Tile Y
                <input
                  type="number"
                  value={selectedCharacter.tile_y}
                  onChange={(event) => onCharacterChange("tile_y", Number(event.target.value))}
                />
              </label>
              <label>
                Tile W
                <input
                  type="number"
                  value={selectedCharacter.tile_w}
                  onChange={(event) => onCharacterChange("tile_w", Number(event.target.value))}
                />
              </label>
              <label>
                Tile H
                <input
                  type="number"
                  value={selectedCharacter.tile_h}
                  onChange={(event) => onCharacterChange("tile_h", Number(event.target.value))}
                />
              </label>
              <label className="tool-mvp__field-full">
                Description
                <textarea
                  value={selectedCharacter.description}
                  rows={2}
                  onChange={(event) => onCharacterChange("description", event.target.value)}
                />
              </label>
              {STAT_KEYS.map((statKey) => (
                <label key={statKey}>
                  {statKey}
                  <input
                    type="number"
                    value={selectedCharacter[statKey]}
                    onChange={(event) => onCharacterChange(statKey, Number(event.target.value))}
                  />
                </label>
              ))}
              <label>
                Slot 1
                <select
                  value={selectedCharacter.skill_slots["1"] ?? ""}
                  onChange={(event) => onSkillSlotChange("1", event.target.value)}
                >
                  <option value="">none</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Slot 2
                <select
                  value={selectedCharacter.skill_slots["2"] ?? ""}
                  onChange={(event) => onSkillSlotChange("2", event.target.value)}
                >
                  <option value="">none</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Slot 3
                <select
                  value={selectedCharacter.skill_slots["3"] ?? ""}
                  onChange={(event) => onSkillSlotChange("3", event.target.value)}
                >
                  <option value="">none</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Slot 4
                <select
                  value={selectedCharacter.skill_slots["4"] ?? ""}
                  onChange={(event) => onSkillSlotChange("4", event.target.value)}
                >
                  <option value="">none</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p>선택된 캐릭터가 없습니다.</p>
          )}
        </section>
      </section>

      <section className="tool-mvp__panel">
        <h2>Preview</h2>
        {selectedCharacter == null || derivedStats == null ? (
          <p>캐릭터를 선택하면 미리보기를 표시합니다.</p>
        ) : (
          <div className="tool-mvp__preview-grid">
            <article>
              <h3>파생치</h3>
              <ul>
                {Object.entries(derivedStats).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value.toFixed(2)}
                  </li>
                ))}
              </ul>
            </article>
            <article>
              <h3>전투 미리보기</h3>
              {combatPreview == null ? (
                <p>비교 대상 캐릭터가 없습니다.</p>
              ) : (
                <ul>
                  <li>vs {opponentCharacter?.id}</li>
                  <li>물리 명중률: {combatPreview.physicalHitRate}%</li>
                  <li>마법 명중률: {combatPreview.magicalHitRate}%</li>
                  <li>물리 데미지: {combatPreview.physicalDamage}</li>
                  <li>마법 데미지: {combatPreview.magicalDamage}</li>
                </ul>
              )}
            </article>
          </div>
        )}
      </section>

      <section className="tool-mvp__panel tool-mvp__issues">
        <h2>Validation Issues ({issues.length})</h2>
        <ul>
          {issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`} className={`severity-${issue.severity}`}>
              [{issue.severity}] {issue.path} - {issue.message}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function generateSequentialId(prefix: string, existingIds: readonly string[]): string {
  let sequence = existingIds.length + 1;
  let nextId = `${prefix}_${String(sequence).padStart(3, "0")}`;

  while (existingIds.includes(nextId)) {
    sequence += 1;
    nextId = `${prefix}_${String(sequence).padStart(3, "0")}`;
  }

  return nextId;
}
