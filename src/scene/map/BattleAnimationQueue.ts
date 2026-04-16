import type {
  TurnHitResult,
  TurnHitResultEvent,
  TurnSandwichAttackEvent,
} from "../../game/application/ResolveTurnEndUseCase.js";

/**
 * 맵 연출용 스테이지 좌표다.
 */
export interface BattleAnimationStagePosition {
  readonly x: number;
  readonly y: number;
}

/**
 * 샌드위치 공격 연출의 개별 캐릭터 이미지 상태다.
 */
export interface SandwichCharacterAnimation {
  readonly imageUrl: string;
  readonly scale: number;
  readonly side: "left" | "right";
}

/**
 * 샌드위치 공격 연출 상태다.
 */
export interface SandwichAttackAnimation {
  readonly animationId: string;
  readonly delayMs: number;
  readonly firstActor: SandwichCharacterAnimation;
  readonly secondActor: SandwichCharacterAnimation;
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 타격 결과 텍스트 애니메이션 상태다.
 */
export interface DamageTextAnimation {
  readonly animationId: string;
  readonly damage: number;
  readonly delayMs: number;
  readonly label: string;
  readonly result: TurnHitResult;
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 스킬명 박스 애니메이션 상태다.
 */
export interface SkillNameAnimation {
  readonly animationId: string;
  readonly delayMs: number;
  readonly skillNames: readonly string[];
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 전투 연출 큐가 React에 전달하는 현재 재생 상태다.
 */
export interface BattleAnimationQueueState {
  readonly damageTextAnimations: readonly DamageTextAnimation[];
  readonly isPlaying: boolean;
  readonly sandwichAttackAnimations: readonly SandwichAttackAnimation[];
  readonly skillNameAnimations: readonly SkillNameAnimation[];
}

/**
 * 샌드위치 공격 연출을 만들기 위한 큐 입력이다.
 */
export interface QueueSandwichAttackAnimationInput {
  readonly event: TurnSandwichAttackEvent;
  readonly firstActor: SandwichCharacterAnimation;
  readonly secondActor: SandwichCharacterAnimation;
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 타격 결과 텍스트 연출을 만들기 위한 큐 입력이다.
 */
export interface QueueDamageTextAnimationInput {
  readonly event: TurnHitResultEvent;
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 스킬명 박스 연출을 만들기 위한 큐 입력이다.
 */
export interface QueueSkillNameAnimationInput {
  readonly animationId: string;
  readonly skillNames: readonly string[];
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 전투 연출 시간 설정이다.
 */
export interface BattleAnimationDurations {
  readonly damageTextDurationMs: number;
  readonly damageTextStaggerMs: number;
  readonly sandwichAttackDurationMs: number;
  readonly sandwichAttackStaggerMs: number;
  readonly skillNameDurationMs: number;
  readonly skillNameStaggerMs: number;
}

/**
 * turn 종료 후 재생할 전투 연출 입력이다.
 */
export interface EnqueueTurnAnimationsInput {
  readonly damageTexts: readonly QueueDamageTextAnimationInput[];
  readonly durations: BattleAnimationDurations;
  readonly sandwichAttacks: readonly QueueSandwichAttackAnimationInput[];
  readonly skillNames: readonly QueueSkillNameAnimationInput[];
}

type BattleAnimationQueueStep =
  | {
      readonly type: "sandwich";
      readonly sandwichAnimations: readonly SandwichAttackAnimation[];
      readonly skillNameAnimations: readonly SkillNameAnimation[];
      readonly durationMs: number;
    }
  | {
      readonly type: "damage";
      readonly animations: readonly DamageTextAnimation[];
      readonly durationMs: number;
    };

/**
 * turn 종료 후 발생하는 화면 연출을 순차 재생하는 큐다.
 */
export class BattleAnimationQueue {
  private readonly onStateChange: (state: BattleAnimationQueueState) => void;

  private readonly steps: BattleAnimationQueueStep[] = [];

  private timeoutId: number | undefined;

  private sequence = 0;

  private isRunning = false;

  /**
   * 전투 연출 큐를 만든다.
   *
   * @param onStateChange 현재 재생 상태가 바뀔 때 호출할 콜백
   */
  public constructor(
    onStateChange: (state: BattleAnimationQueueState) => void,
  ) {
    this.onStateChange = onStateChange;
  }

  /**
   * turn 종료 연출을 큐 뒤에 추가한다.
   *
   * @param input 샌드위치 연출, 타격 결과 텍스트 연출, 시간 설정
   */
  public enqueueTurnAnimations(input: EnqueueTurnAnimationsInput): void {
    const sequenceId = this.sequence;

    this.sequence += 1;

    const sandwichAnimations = input.sandwichAttacks.map((sandwichAttack, index) => ({
      animationId: `${sandwichAttack.event.eventId}:sandwich:${sequenceId}:${index}`,
      delayMs: index * input.durations.sandwichAttackStaggerMs,
      firstActor: sandwichAttack.firstActor,
      secondActor: sandwichAttack.secondActor,
      stagePosition: sandwichAttack.stagePosition,
    }));
    const damageTextAnimations = input.damageTexts.map((damageText, index) => ({
      animationId: `${damageText.event.eventId}:damage:${sequenceId}:${index}`,
      damage: damageText.event.damage,
      delayMs: index * input.durations.damageTextStaggerMs,
      label:
        damageText.event.result === "miss"
          ? "MISS"
          : damageText.event.damage.toString(),
      result: damageText.event.result,
      stagePosition: damageText.stagePosition,
    }));
    const skillNameAnimations = input.skillNames.map((skillName, index) => ({
      animationId: `${skillName.animationId}:skill-name:${sequenceId}:${index}`,
      delayMs: index * input.durations.skillNameStaggerMs,
      skillNames: skillName.skillNames,
      stagePosition: skillName.stagePosition,
    }));

    if (sandwichAnimations.length > 0 || skillNameAnimations.length > 0) {
      const sandwichStepDurationMs =
        sandwichAnimations.length > 0
          ? this.calculateStepDuration({
              animationCount: sandwichAnimations.length,
              baseDurationMs: input.durations.sandwichAttackDurationMs,
              staggerMs: input.durations.sandwichAttackStaggerMs,
            })
          : 0;
      const skillNameStepDurationMs =
        skillNameAnimations.length > 0
          ? this.calculateStepDuration({
              animationCount: skillNameAnimations.length,
              baseDurationMs: input.durations.skillNameDurationMs,
              staggerMs: input.durations.skillNameStaggerMs,
            })
          : 0;

      this.steps.push({
        durationMs: Math.max(sandwichStepDurationMs, skillNameStepDurationMs),
        sandwichAnimations,
        skillNameAnimations,
        type: "sandwich",
      });
    }

    if (damageTextAnimations.length > 0) {
      this.steps.push({
        animations: damageTextAnimations,
        durationMs: this.calculateStepDuration({
          animationCount: damageTextAnimations.length,
          baseDurationMs: input.durations.damageTextDurationMs,
          staggerMs: input.durations.damageTextStaggerMs,
        }),
        type: "damage",
      });
    }

    if (!this.isRunning) {
      this.playNextStep();
    }
  }

  /**
   * 대기 중이거나 재생 중인 모든 연출을 제거한다.
   */
  public clear(): void {
    this.steps.length = 0;

    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    this.isRunning = false;
    this.emitState({
      damageTextAnimations: [],
      isPlaying: false,
      sandwichAttackAnimations: [],
      skillNameAnimations: [],
    });
  }

  /**
   * 큐가 가진 타이머를 해제한다.
   */
  public dispose(): void {
    this.steps.length = 0;

    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    this.isRunning = false;
  }

  private playNextStep(): void {
    const step = this.steps.shift();

    if (step === undefined) {
      this.isRunning = false;
      this.emitState({
        damageTextAnimations: [],
        isPlaying: false,
        sandwichAttackAnimations: [],
        skillNameAnimations: [],
      });
      return;
    }

    this.isRunning = true;

    if (step.type === "sandwich") {
      this.emitState({
        damageTextAnimations: [],
        isPlaying: true,
        sandwichAttackAnimations: step.sandwichAnimations,
        skillNameAnimations: step.skillNameAnimations,
      });
    } else {
      this.emitState({
        damageTextAnimations: step.animations,
        isPlaying: true,
        sandwichAttackAnimations: [],
        skillNameAnimations: [],
      });
    }

    this.timeoutId = window.setTimeout(() => {
      this.timeoutId = undefined;
      this.playNextStep();
    }, step.durationMs);
  }

  private calculateStepDuration(input: {
    readonly animationCount: number;
    readonly baseDurationMs: number;
    readonly staggerMs: number;
  }): number {
    return (
      input.baseDurationMs +
      Math.max(0, input.animationCount - 1) * input.staggerMs
    );
  }

  private emitState(state: BattleAnimationQueueState): void {
    this.onStateChange(state);
  }
}

/**
 * 비어 있는 전투 연출 상태다.
 */
export const emptyBattleAnimationQueueState: BattleAnimationQueueState = {
  damageTextAnimations: [],
  isPlaying: false,
  sandwichAttackAnimations: [],
  skillNameAnimations: [],
};
