/**
 * 전투 계산에 사용하는 기본 능력치 키다.
 */
export type BattleStatKey =
  | "STR"
  | "VIT"
  | "DEX"
  | "AGI"
  | "AVD"
  | "INT"
  | "MND"
  | "RES"
  | "LUK";

/**
 * 전투 계산에 사용하는 공격 판정 타입이다.
 */
export type BattleAttackType = "physical" | "magical" | "auto";

/**
 * 스킬 효과 종류다.
 */
export type BattleSkillEffectType = "damage" | "buff" | "debuff" | "heal";

/**
 * 스킬 대상 진영이다.
 */
export type BattleSkillTargetSide = "self" | "ally" | "enemy";

/**
 * 전투 판정을 수행하는 기준 진영이다.
 */
export type BattleSide = "ally" | "enemy";

/**
 * 캐릭터 스킬 슬롯 데이터다.
 */
export interface BattleCharacterSkillSlots {
  readonly "1": string | null;
  readonly "2": string | null;
  readonly "3": string | null;
  readonly "4": string | null;
}

/**
 * 전투 계산에 필요한 캐릭터 데이터다.
 */
export interface BattleCharacterData {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly skill_slots: BattleCharacterSkillSlots;
  readonly STR: number;
  readonly VIT: number;
  readonly DEX: number;
  readonly AGI: number;
  readonly AVD: number;
  readonly INT: number;
  readonly MND: number;
  readonly RES: number;
  readonly LUK: number;
}

/**
 * 복합공격의 개별 타격 정의다.
 */
export interface BattleSkillCompositeHitData {
  readonly attack_type: Exclude<BattleAttackType, "auto">;
  readonly source_stat: BattleStatKey;
  readonly multiplier: number;
  readonly hit_count: number;
}

/**
 * 전투 계산에 필요한 스킬 데이터다.
 */
export interface BattleSkillData {
  readonly id: string;
  readonly name: string;
  readonly replaceable: boolean;
  readonly proc_chance: number;
  readonly effect_type: BattleSkillEffectType;
  readonly attack_type: BattleAttackType;
  readonly target_side: BattleSkillTargetSide;
  readonly source_stat: BattleStatKey;
  readonly affected_stat: BattleStatKey | null;
  readonly multiplier: number;
  readonly hit_count: number;
  readonly duration_turns: number;
  readonly composite_hits?: readonly BattleSkillCompositeHitData[] | null;
  readonly description?: string;
}

/**
 * turn 종료 시점의 보드 위 유닛 좌표다.
 */
export interface TurnEndBoardUnit {
  readonly instanceId: string;
  readonly characterId: string;
  readonly x: number;
  readonly y: number;
}

/**
 * 전투 중 적용 중인 능력치 효과다.
 */
export interface BattleActiveStatEffect {
  readonly multiplier: number;
  readonly remainingTurns: number;
  readonly stat: BattleStatKey;
  readonly targetInstanceId: string;
}

/**
 * turn 종료 해석 입력값이다.
 */
export interface ResolveTurnEndInput {
  readonly activeStatEffects?: readonly BattleActiveStatEffect[];
  readonly units: readonly TurnEndBoardUnit[];
  readonly characters: readonly BattleCharacterData[];
  readonly skills: readonly BattleSkillData[];
  readonly random: () => number;
  readonly attackingSide?: BattleSide;
}

/**
 * 개별 타격 판정 결과다.
 */
export type TurnHitResult = "hit" | "miss" | "heal" | "buff" | "debuff";

/**
 * 개별 타격 계산 결과다.
 */
export interface TurnHitResultEvent {
  readonly eventId: string;
  readonly attackerInstanceId: string;
  readonly attackerCharacterId: string;
  readonly targetInstanceId: string;
  readonly targetCharacterId: string;
  readonly skillId: string;
  readonly skillName: string;
  readonly result: TurnHitResult;
  readonly damage: number;
  readonly hitIndex: number;
  readonly targetX: number;
  readonly targetY: number;
}

/**
 * 샌드위치 공격 연출에 필요한 공격자 쌍 정보다.
 */
export interface TurnSandwichAttackEvent {
  readonly eventId: string;
  readonly firstAttackerInstanceId: string;
  readonly firstAttackerCharacterId: string;
  readonly secondAttackerInstanceId: string;
  readonly secondAttackerCharacterId: string;
  readonly targetInstanceId: string;
  readonly targetCharacterId: string;
  readonly targetX: number;
  readonly targetY: number;
}

/**
 * turn 종료 해석 결과다.
 */
export interface ResolveTurnEndOutput {
  readonly hitResultEvents: readonly TurnHitResultEvent[];
  readonly sandwichAttackEvents: readonly TurnSandwichAttackEvent[];
}

interface DerivedBattleStats {
  readonly PATK: number;
  readonly PDEF: number;
  readonly MATK: number;
  readonly MDEF: number;
  readonly PHIT: number;
  readonly MHIT: number;
  readonly PEVA: number;
  readonly MEVA: number;
}

interface SandwichPair {
  readonly firstAttacker: TurnEndBoardUnit;
  readonly secondAttacker: TurnEndBoardUnit;
}

interface SkillHitSpec {
  readonly attackType: BattleAttackType;
  readonly multiplier: number;
}

interface ResolveSkillDamageInput {
  readonly attackerUnit: TurnEndBoardUnit;
  readonly attacker: BattleCharacterData;
  readonly targetUnit: TurnEndBoardUnit;
  readonly target: BattleCharacterData;
  readonly skill: BattleSkillData;
  readonly random: () => number;
  readonly startEventIndex: number;
}

interface ResolveSkillEffectInput {
  readonly attackerUnit: TurnEndBoardUnit;
  readonly attacker: BattleCharacterData;
  readonly eventIndex: number;
  readonly skill: BattleSkillData;
  readonly target: BattleCharacterData;
  readonly targetUnit: TurnEndBoardUnit;
}

/**
 * turn 종료 시점의 최종 좌표를 기반으로 샌드위치 공격을 계산한다.
 */
export class ResolveTurnEndUseCase {
  /**
   * 최종 보드 상태에서 성립한 샌드위치 공격의 타격 결과 이벤트를 계산한다.
   *
   * @param input 최종 유닛 좌표와 전투 콘텐츠 데이터
   * @returns 개별 타격 결과 이벤트 목록
   */
  public execute(input: ResolveTurnEndInput): ResolveTurnEndOutput {
    const charactersById = new Map(
      input.characters.map((character) => [character.id, character] as const),
    );
    const skillsById = new Map(
      input.skills.map((skill) => [skill.id, skill] as const),
    );
    const unitsByPosition = new Map(
      input.units.map((unit) => [this.createPositionKey(unit.x, unit.y), unit] as const),
    );
    const hitResultEvents: TurnHitResultEvent[] = [];
    const sandwichAttackEvents: TurnSandwichAttackEvent[] = [];

    const attackingSide = input.attackingSide ?? "ally";

    input.units.forEach((targetUnit) => {
      const targetBase = charactersById.get(targetUnit.characterId);
      const target =
        targetBase === undefined
          ? undefined
          : this.applyActiveStatEffects(
              targetBase,
              targetUnit.instanceId,
              input.activeStatEffects ?? [],
            );

      if (
        target === undefined ||
        !this.isOpposingSide(target, attackingSide)
      ) {
        return;
      }

      const sandwichPairs = this.findSandwichPairs({
        targetUnit,
        unitsByPosition,
        charactersById,
        attackingSide,
      });

      sandwichPairs.forEach((pair) => {
        sandwichAttackEvents.push(
          this.createSandwichAttackEvent(targetUnit, target, pair),
        );

        [pair.firstAttacker, pair.secondAttacker].forEach((attackerUnit) => {
          const attackerBase = charactersById.get(attackerUnit.characterId);
          const attacker =
            attackerBase === undefined
              ? undefined
              : this.applyActiveStatEffects(
                  attackerBase,
                  attackerUnit.instanceId,
                  input.activeStatEffects ?? [],
                );

          if (attacker === undefined) {
            return;
          }

          this.resolveAttackerSkills({
            attacker,
            attackerUnit,
            hitResultEvents,
            random: input.random,
            skillsById,
            target,
            targetUnit,
          });
        });
      });
    });

    return {
      hitResultEvents,
      sandwichAttackEvents,
    };
  }

  private createSandwichAttackEvent(
    targetUnit: TurnEndBoardUnit,
    target: BattleCharacterData,
    pair: SandwichPair,
  ): TurnSandwichAttackEvent {
    return {
      eventId: [
        targetUnit.instanceId,
        pair.firstAttacker.instanceId,
        pair.secondAttacker.instanceId,
      ].join(":"),
      firstAttackerCharacterId: pair.firstAttacker.characterId,
      firstAttackerInstanceId: pair.firstAttacker.instanceId,
      secondAttackerCharacterId: pair.secondAttacker.characterId,
      secondAttackerInstanceId: pair.secondAttacker.instanceId,
      targetCharacterId: target.id,
      targetInstanceId: targetUnit.instanceId,
      targetX: targetUnit.x,
      targetY: targetUnit.y,
    };
  }

  private resolveAttackerSkills(input: {
    readonly attackerUnit: TurnEndBoardUnit;
    readonly attacker: BattleCharacterData;
    readonly targetUnit: TurnEndBoardUnit;
    readonly target: BattleCharacterData;
    readonly skillsById: ReadonlyMap<string, BattleSkillData>;
    readonly random: () => number;
    readonly hitResultEvents: TurnHitResultEvent[];
  }): void {
    this.getSkillSlotIds(input.attacker).forEach((skillId) => {
      const skill = input.skillsById.get(skillId);

      if (
        skill === undefined ||
        !this.isPercentRollSuccessful(skill.proc_chance, input.random)
      ) {
        return;
      }

      if (skill.effect_type !== "damage") {
        input.hitResultEvents.push(
          this.createSkillEffectEvent({
            attacker: input.attacker,
            attackerUnit: input.attackerUnit,
            eventIndex: input.hitResultEvents.length,
            skill,
            target: input.target,
            targetUnit: input.targetUnit,
          }),
        );
        return;
      }

      if (skill.target_side !== "enemy") {
        return;
      }

      const skillHitResultEvents = this.resolveSkillHitResults({
        attacker: input.attacker,
        attackerUnit: input.attackerUnit,
        random: input.random,
        skill,
        startEventIndex: input.hitResultEvents.length,
        target: input.target,
        targetUnit: input.targetUnit,
      });

      input.hitResultEvents.push(...skillHitResultEvents);
    });
  }

  private createSkillEffectEvent(input: ResolveSkillEffectInput): TurnHitResultEvent {
    const effectTarget = this.resolveEffectTarget(input);
    const amount =
      input.skill.effect_type === "heal"
        ? this.calculateHealAmount(input.attacker, input.skill)
        : 0;

    return {
      attackerCharacterId: input.attacker.id,
      attackerInstanceId: input.attackerUnit.instanceId,
      damage: amount,
      eventId: [
        effectTarget.unit.instanceId,
        input.attackerUnit.instanceId,
        input.skill.id,
        input.eventIndex,
      ].join(":"),
      hitIndex: 1,
      result: input.skill.effect_type === "damage" ? "hit" : input.skill.effect_type,
      skillId: input.skill.id,
      skillName: input.skill.name,
      targetCharacterId: effectTarget.character.id,
      targetInstanceId: effectTarget.unit.instanceId,
      targetX: effectTarget.unit.x,
      targetY: effectTarget.unit.y,
    };
  }

  private resolveEffectTarget(input: ResolveSkillEffectInput): {
    readonly character: BattleCharacterData;
    readonly unit: TurnEndBoardUnit;
  } {
    if (input.skill.target_side === "enemy") {
      return {
        character: input.target,
        unit: input.targetUnit,
      };
    }

    return {
      character: input.attacker,
      unit: input.attackerUnit,
    };
  }

  private calculateHealAmount(
    attacker: BattleCharacterData,
    skill: BattleSkillData,
  ): number {
    const sourceValue = attacker[skill.source_stat];

    return Math.floor(Math.max(1, sourceValue * skill.multiplier));
  }

  private applyActiveStatEffects(
    character: BattleCharacterData,
    instanceId: string,
    activeEffects: readonly BattleActiveStatEffect[],
  ): BattleCharacterData {
    const matchingEffects = activeEffects.filter(
      (effect) =>
        effect.targetInstanceId === instanceId && effect.remainingTurns > 0,
    );

    if (matchingEffects.length === 0) {
      return character;
    }

    return matchingEffects.reduce<BattleCharacterData>((current, effect) => ({
      ...current,
      [effect.stat]: Math.max(1, Math.floor(current[effect.stat] * effect.multiplier)),
    }), character);
  }

  private resolveSkillHitResults(
    input: ResolveSkillDamageInput,
  ): readonly TurnHitResultEvent[] {
    const events: TurnHitResultEvent[] = [];
    const hitSpecs = this.createSkillHitSpecs(input.skill);

    hitSpecs.forEach((hitSpec, hitIndex) => {
      const hitChance = this.calculateHitChance(
        hitSpec.attackType,
        input.attacker,
        input.target,
      );
      const eventIndex = input.startEventIndex + events.length;

      if (!this.isPercentRollSuccessful(hitChance, input.random)) {
        events.push(
          this.createHitResultEvent({
            damage: 0,
            eventIndex,
            hitIndex,
            input,
            result: "miss",
          }),
        );
        return;
      }

      const damage = this.calculateDamage(
        hitSpec.attackType,
        hitSpec.multiplier,
        input.attacker,
        input.target,
      );

      events.push(
        this.createHitResultEvent({
          damage,
          eventIndex,
          hitIndex,
          input,
          result: "hit",
        }),
      );
    });

    return events;
  }

  private createHitResultEvent(input: {
    readonly damage: number;
    readonly eventIndex: number;
    readonly hitIndex: number;
    readonly input: ResolveSkillDamageInput;
    readonly result: TurnHitResult;
  }): TurnHitResultEvent {
    return {
      attackerCharacterId: input.input.attacker.id,
      attackerInstanceId: input.input.attackerUnit.instanceId,
      damage: input.damage,
      eventId: [
        input.input.targetUnit.instanceId,
        input.input.attackerUnit.instanceId,
        input.input.skill.id,
        input.eventIndex,
      ].join(":"),
      hitIndex: input.hitIndex + 1,
      result: input.result,
      skillId: input.input.skill.id,
      skillName: input.input.skill.name,
      targetCharacterId: input.input.target.id,
      targetInstanceId: input.input.targetUnit.instanceId,
      targetX: input.input.targetUnit.x,
      targetY: input.input.targetUnit.y,
    };
  }

  private findSandwichPairs(input: {
    readonly targetUnit: TurnEndBoardUnit;
    readonly unitsByPosition: ReadonlyMap<string, TurnEndBoardUnit>;
    readonly charactersById: ReadonlyMap<string, BattleCharacterData>;
    readonly attackingSide: BattleSide;
  }): readonly SandwichPair[] {
    const horizontalPair = this.findSandwichPair({
      charactersById: input.charactersById,
      firstPosition: {
        x: input.targetUnit.x - 1,
        y: input.targetUnit.y,
      },
      secondPosition: {
        x: input.targetUnit.x + 1,
        y: input.targetUnit.y,
      },
      unitsByPosition: input.unitsByPosition,
      attackingSide: input.attackingSide,
    });
    const verticalPair = this.findSandwichPair({
      charactersById: input.charactersById,
      firstPosition: {
        x: input.targetUnit.x,
        y: input.targetUnit.y - 1,
      },
      secondPosition: {
        x: input.targetUnit.x,
        y: input.targetUnit.y + 1,
      },
      unitsByPosition: input.unitsByPosition,
      attackingSide: input.attackingSide,
    });

    return [horizontalPair, verticalPair].filter(
      (pair): pair is SandwichPair => pair !== undefined,
    );
  }

  private findSandwichPair(input: {
    readonly firstPosition: { readonly x: number; readonly y: number };
    readonly secondPosition: { readonly x: number; readonly y: number };
    readonly unitsByPosition: ReadonlyMap<string, TurnEndBoardUnit>;
    readonly charactersById: ReadonlyMap<string, BattleCharacterData>;
    readonly attackingSide: BattleSide;
  }): SandwichPair | undefined {
    const firstAttacker = input.unitsByPosition.get(
      this.createPositionKey(input.firstPosition.x, input.firstPosition.y),
    );
    const secondAttacker = input.unitsByPosition.get(
      this.createPositionKey(input.secondPosition.x, input.secondPosition.y),
    );

    if (
      firstAttacker === undefined ||
      secondAttacker === undefined ||
      !this.isSideUnit(firstAttacker, input.charactersById, input.attackingSide) ||
      !this.isSideUnit(secondAttacker, input.charactersById, input.attackingSide)
    ) {
      return undefined;
    }

    return {
      firstAttacker,
      secondAttacker,
    };
  }

  private createSkillHitSpecs(skill: BattleSkillData): readonly SkillHitSpec[] {
    if (skill.composite_hits !== undefined && skill.composite_hits !== null) {
      return skill.composite_hits.flatMap((hit) =>
        Array.from({ length: hit.hit_count }, () => ({
          attackType: hit.attack_type,
          multiplier: hit.multiplier,
        })),
      );
    }

    return Array.from({ length: skill.hit_count }, () => ({
      attackType: skill.attack_type,
      multiplier: skill.multiplier,
    }));
  }

  private calculateHitChance(
    attackType: BattleAttackType,
    attacker: BattleCharacterData,
    target: BattleCharacterData,
  ): number {
    if (attackType === "auto") {
      return 100;
    }

    const attackerStats = this.calculateDerivedStats(attacker);
    const targetStats = this.calculateDerivedStats(target);
    const rawHitChance =
      attackType === "magical"
        ? 60 + (attackerStats.MHIT - targetStats.MEVA) / 2 + (attacker.LUK - target.LUK) / 4
        : 60 + (attackerStats.PHIT - targetStats.PEVA) / 2 + (attacker.LUK - target.LUK) / 4;

    return Math.floor(Math.min(100, Math.max(1, rawHitChance)));
  }

  private calculateDamage(
    attackType: BattleAttackType,
    multiplier: number,
    attacker: BattleCharacterData,
    target: BattleCharacterData,
  ): number {
    const attackerStats = this.calculateDerivedStats(attacker);
    const targetStats = this.calculateDerivedStats(target);
    const rawDamage =
      attackType === "magical"
        ? 18 + (attackerStats.MATK - targetStats.MDEF) / 2 + (attacker.LUK - target.LUK) / 4
        : 18 + (attackerStats.PATK - targetStats.PDEF) / 2 + (attacker.LUK - target.LUK) / 4;
    const baseDamage = Math.floor(Math.max(1, rawDamage));

    return Math.floor(Math.max(1, baseDamage * multiplier));
  }

  private calculateDerivedStats(character: BattleCharacterData): DerivedBattleStats {
    return {
      MATK: character.INT + character.MND / 4,
      MDEF: character.RES + character.MND / 4,
      MEVA: character.MND + character.RES / 4,
      MHIT: character.MND + character.INT / 4,
      PATK: character.STR + character.DEX / 4,
      PDEF: character.VIT + character.STR / 4,
      PEVA: character.AVD + character.AGI / 4,
      PHIT: character.DEX + character.AGI / 4,
    };
  }

  private getSkillSlotIds(character: BattleCharacterData): readonly string[] {
    return [
      character.skill_slots["1"],
      character.skill_slots["2"],
      character.skill_slots["3"],
      character.skill_slots["4"],
    ].filter((skillId): skillId is string => skillId !== null);
  }

  private isSideUnit(
    unit: TurnEndBoardUnit,
    charactersById: ReadonlyMap<string, BattleCharacterData>,
    side: BattleSide,
  ): boolean {
    const character = charactersById.get(unit.characterId);

    return character?.type === side;
  }

  private isOpposingSide(
    character: BattleCharacterData,
    attackingSide: BattleSide,
  ): boolean {
    return attackingSide === "ally"
      ? character.type === "enemy"
      : character.type === "ally";
  }

  private isPercentRollSuccessful(
    chancePercent: number,
    random: () => number,
  ): boolean {
    const clampedChancePercent = Math.min(100, Math.max(0, chancePercent));

    return clampedChancePercent >= 100 || random() * 100 < clampedChancePercent;
  }

  private createPositionKey(x: number, y: number): string {
    return `${x}:${y}`;
  }
}
