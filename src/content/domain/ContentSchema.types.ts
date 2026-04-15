/**
 * 콘텐츠에서 사용하는 능력치 키다.
 */
export type StatKey =
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
 * 성장 방식 타입이다.
 */
export type GrowthType = "Power" | "Technique" | "Arcane" | "Ward" | "Balanced";

/**
 * 스킬 효과 타입이다.
 */
export type SkillEffectType = "damage" | "buff" | "debuff" | "heal";

/**
 * 스킬 판정 타입이다.
 */
export type SkillAttackType = "physical" | "magical" | "auto";

/**
 * 스킬 대상 진영 타입이다.
 */
export type SkillTargetSide = "self" | "ally" | "enemy";

/**
 * 스킬의 복합 타격 구조다.
 */
export interface CompositeHitDef {
  readonly attack_type: SkillAttackType;
  readonly source_stat: StatKey;
  readonly multiplier: number;
  readonly hit_count: number;
}

/**
 * 스킬 정의 타입이다.
 */
export interface SkillDef {
  readonly id: string;
  readonly name: string;
  readonly replaceable: boolean;
  readonly proc_chance: number;
  readonly effect_type: SkillEffectType;
  readonly attack_type: SkillAttackType;
  readonly target_side: SkillTargetSide;
  readonly source_stat: StatKey;
  readonly affected_stat?: StatKey | null;
  readonly multiplier: number;
  readonly hit_count: number;
  readonly duration_turns: number;
  readonly composite_hits?: readonly CompositeHitDef[];
  readonly description: string;
  readonly extensions?: Record<string, unknown>;
}

/**
 * 캐릭터의 스킬 슬롯 구조다.
 */
export interface CharacterSkillSlots {
  readonly "1": string | null;
  readonly "2": string | null;
  readonly "3": string | null;
  readonly "4": string | null;
}

/**
 * 캐릭터 정의 타입이다.
 */
export interface CharacterDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly image_path: string;
  readonly tile_x: number;
  readonly tile_y: number;
  readonly tile_w: number;
  readonly tile_h: number;
  readonly level: number;
  readonly exp: number;
  readonly skill_slots: CharacterSkillSlots;
  readonly STR: number;
  readonly VIT: number;
  readonly DEX: number;
  readonly AGI: number;
  readonly AVD: number;
  readonly INT: number;
  readonly MND: number;
  readonly RES: number;
  readonly LUK: number;
  readonly current_grown_type: GrowthType;
  readonly HP: number;
  readonly extensions?: Record<string, unknown>;
}

/**
 * 맵 좌표 타입이다.
 */
export interface TileCoord {
  readonly x: number;
  readonly y: number;
}

/**
 * 맵 스폰 정의 타입이다.
 */
export interface MapSpawnDef {
  readonly unit_id: string;
  readonly side: "ally" | "enemy";
  readonly x: number;
  readonly y: number;
}

/**
 * 맵 트리거 정의 타입이다.
 */
export interface MapTriggerDef {
  readonly id: string;
  readonly event: string;
  readonly action: string;
}

/**
 * 맵 정의 타입이다.
 */
export interface MapDef {
  readonly id: string;
  readonly name: string;
  readonly grid: {
    readonly width: number;
    readonly height: number;
  };
  readonly blocked_tiles: readonly TileCoord[];
  readonly spawns: readonly MapSpawnDef[];
  readonly triggers: readonly MapTriggerDef[];
  readonly extensions?: Record<string, unknown>;
}

/**
 * 다이얼로그 선택지 노드 타입이다.
 */
export interface DialogueChoiceNodeDef {
  readonly id: string;
  readonly type: "choice";
  readonly choices: readonly {
    readonly text: string;
    readonly next: string;
  }[];
}

/**
 * 다이얼로그 일반 대사 노드 타입이다.
 */
export interface DialogueLineNodeDef {
  readonly id: string;
  readonly type: "line";
  readonly speaker?: string;
  readonly text: string;
  readonly next?: string;
}

/**
 * 다이얼로그 점프 노드 타입이다.
 */
export interface DialogueJumpNodeDef {
  readonly id: string;
  readonly type: "jump";
  readonly target: string;
}

/**
 * 다이얼로그 종료 노드 타입이다.
 */
export interface DialogueEndNodeDef {
  readonly id: string;
  readonly type: "end";
}

/**
 * 다이얼로그 전역 플래그 노드 타입이다.
 */
export interface DialogueSetFlagNodeDef {
  readonly id: string;
  readonly type: "setFlag";
  readonly flag_key: string;
  readonly flag_value: string | number | boolean;
  readonly next?: string;
}

/**
 * 다이얼로그 노드 유니온 타입이다.
 */
export type DialogueNodeDef =
  | DialogueChoiceNodeDef
  | DialogueLineNodeDef
  | DialogueJumpNodeDef
  | DialogueEndNodeDef
  | DialogueSetFlagNodeDef;

/**
 * 다이얼로그 정의 타입이다.
 */
export interface DialogueDef {
  readonly id: string;
  readonly name: string;
  readonly start_node_id: string;
  readonly nodes: readonly DialogueNodeDef[];
  readonly extensions?: Record<string, unknown>;
}

/**
 * 콘텐츠 팩 메타 타입이다.
 */
export interface ContentPackMeta {
  readonly pack_id: string;
  readonly schema_version: string;
  readonly tool_version: string;
}

/**
 * 콘텐츠 팩 파일 매니페스트 타입이다.
 */
export interface ContentPackFiles {
  readonly skills: string;
  readonly characters: string;
  readonly maps: readonly string[];
  readonly dialogues: readonly string[];
}

/**
 * 콘텐츠 팩 매니페스트 타입이다.
 */
export interface ContentPackManifest {
  readonly meta: ContentPackMeta;
  readonly files: ContentPackFiles;
}

/**
 * 런타임에서 사용하는 콘텐츠 팩 타입이다.
 */
export interface ContentPack {
  readonly manifest: ContentPackManifest;
  readonly skills: readonly SkillDef[];
  readonly characters: readonly CharacterDef[];
  readonly maps: readonly MapDef[];
  readonly dialogues: readonly DialogueDef[];
}

/**
 * 검증 이슈 심각도다.
 */
export type ValidationSeverity = "error" | "warning";

/**
 * 검증 이슈 타입이다.
 */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
  readonly severity: ValidationSeverity;
}
