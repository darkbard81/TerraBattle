import type { CharacterDef } from "../../content/domain/ContentSchema.types.js";

/**
 * 전투 수치 미리보기에 필요한 파생치 계산 결과다.
 */
export interface DerivedStats {
  readonly PATK: number;
  readonly PDEF: number;
  readonly MATK: number;
  readonly MDEF: number;
  readonly PHIT: number;
  readonly MHIT: number;
  readonly PEVA: number;
  readonly MEVA: number;
}

/**
 * 공격자/방어자 기준 전투 미리보기 결과다.
 */
export interface CombatPreviewResult {
  readonly physicalHitRate: number;
  readonly magicalHitRate: number;
  readonly physicalDamage: number;
  readonly magicalDamage: number;
}

/**
 * 캐릭터 기본 스탯으로 파생치와 전투 계산 미리보기를 제공한다.
 */
export class CharacterCombatPreviewService {
  /**
   * 캐릭터의 파생치를 계산한다.
   *
   * @param character 기준 캐릭터
   * @returns 계산된 파생치
   */
  public calculateDerivedStats(character: CharacterDef): DerivedStats {
    return {
      PATK: character.STR + character.DEX / 4,
      PDEF: character.VIT + character.STR / 4,
      MATK: character.INT + character.MND / 4,
      MDEF: character.RES + character.MND / 4,
      PHIT: character.DEX + character.AGI / 4,
      MHIT: character.MND + character.INT / 4,
      PEVA: character.AVD + character.AGI / 4,
      MEVA: character.MND + character.RES / 4,
    };
  }

  /**
   * 공격자/방어자 기준의 명중률과 데미지를 계산한다.
   *
   * @param attacker 공격자
   * @param defender 방어자
   * @returns 전투 미리보기 결과
   */
  public calculateCombatPreview(attacker: CharacterDef, defender: CharacterDef): CombatPreviewResult {
    const attackerDerived = this.calculateDerivedStats(attacker);
    const defenderDerived = this.calculateDerivedStats(defender);

    return {
      physicalHitRate: this.floorClamp(
        60 +
          (attackerDerived.PHIT - defenderDerived.PEVA) / 2 +
          (attacker.LUK - defender.LUK) / 4,
        1,
        100,
      ),
      magicalHitRate: this.floorClamp(
        60 +
          (attackerDerived.MHIT - defenderDerived.MEVA) / 2 +
          (attacker.LUK - defender.LUK) / 4,
        1,
        100,
      ),
      physicalDamage: Math.floor(
        Math.max(
          1,
          18 +
            (attackerDerived.PATK - defenderDerived.PDEF) / 2 +
            (attacker.LUK - defender.LUK) / 4,
        ),
      ),
      magicalDamage: Math.floor(
        Math.max(
          1,
          18 +
            (attackerDerived.MATK - defenderDerived.MDEF) / 2 +
            (attacker.LUK - defender.LUK) / 4,
        ),
      ),
    };
  }

  private floorClamp(value: number, min: number, max: number): number {
    return Math.floor(Math.min(max, Math.max(min, value)));
  }
}
