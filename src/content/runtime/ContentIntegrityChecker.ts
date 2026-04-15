import type {
  ContentPack,
  DialogueNodeDef,
  SkillDef,
  ValidationIssue,
} from "../domain/ContentSchema.types.js";

/**
 * Content Schema v1 참조 무결성 검사기다.
 */
export class ContentIntegrityChecker {
  /**
   * 콘텐츠 팩의 교차 참조를 검사한다.
   *
   * @param pack 검사할 콘텐츠 팩
   * @returns 무결성 검사 이슈 목록
   */
  public check(pack: ContentPack): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const skillById = new Map<string, SkillDef>();
    const characterIds = new Set<string>();

    pack.skills.forEach((skill, index) => {
      if (skillById.has(skill.id)) {
        issues.push({ path: `skills[${index}].id`, message: `중복 skill id(${skill.id})가 있습니다.`, severity: "error" });
      }
      skillById.set(skill.id, skill);
    });

    pack.characters.forEach((character, characterIndex) => {
      if (characterIds.has(character.id)) {
        issues.push({ path: `characters[${characterIndex}].id`, message: `중복 character id(${character.id})가 있습니다.`, severity: "error" });
      }
      characterIds.add(character.id);

      (["1", "2", "3", "4"] as const).forEach((slotKey) => {
        const skillId = character.skill_slots[slotKey];
        if (skillId == null) {
          return;
        }

        const resolvedSkill = skillById.get(skillId);
        if (resolvedSkill == null) {
          issues.push({
            path: `characters[${characterIndex}].skill_slots.${slotKey}`,
            message: `존재하지 않는 skill id(${skillId})를 참조합니다.`,
            severity: "error",
          });
          return;
        }

        if (slotKey === "1") {
          if (resolvedSkill.replaceable) {
            issues.push({
              path: `characters[${characterIndex}].skill_slots.1`,
              message: "1번 슬롯 스킬은 replaceable=false 이어야 합니다.",
              severity: "error",
            });
          }

          if (resolvedSkill.proc_chance !== 100) {
            issues.push({
              path: `characters[${characterIndex}].skill_slots.1`,
              message: "1번 슬롯 스킬은 proc_chance=100 이어야 합니다.",
              severity: "error",
            });
          }
        }
      });
    });

    pack.maps.forEach((map, mapIndex) => {
      const triggerIds = new Set<string>();

      map.spawns.forEach((spawn, spawnIndex) => {
        if (!characterIds.has(spawn.unit_id)) {
          issues.push({
            path: `maps[${mapIndex}].spawns[${spawnIndex}].unit_id`,
            message: `spawn unit_id(${spawn.unit_id})가 characters에 없습니다.`,
            severity: "warning",
          });
        }
      });

      map.triggers.forEach((trigger, triggerIndex) => {
        if (triggerIds.has(trigger.id)) {
          issues.push({
            path: `maps[${mapIndex}].triggers[${triggerIndex}].id`,
            message: `중복 trigger id(${trigger.id})가 있습니다.`,
            severity: "error",
          });
        }
        triggerIds.add(trigger.id);
      });
    });

    pack.dialogues.forEach((dialogue, dialogueIndex) => {
      const nodeIds = new Set<string>();
      dialogue.nodes.forEach((node, nodeIndex) => {
        if (nodeIds.has(node.id)) {
          issues.push({
            path: `dialogues[${dialogueIndex}].nodes[${nodeIndex}].id`,
            message: `중복 node id(${node.id})가 있습니다.`,
            severity: "error",
          });
        }
        nodeIds.add(node.id);
      });

      if (!nodeIds.has(dialogue.start_node_id)) {
        issues.push({
          path: `dialogues[${dialogueIndex}].start_node_id`,
          message: `start_node_id(${dialogue.start_node_id})가 nodes에 없습니다.`,
          severity: "error",
        });
      }

      dialogue.nodes.forEach((node, nodeIndex) => {
        this.checkDialogueNodeLink(node, nodeIds, `dialogues[${dialogueIndex}].nodes[${nodeIndex}]`, issues);
      });
    });

    return issues;
  }

  private checkDialogueNodeLink(
    node: DialogueNodeDef,
    nodeIds: Set<string>,
    path: string,
    issues: ValidationIssue[],
  ): void {
    if (node.type === "line" || node.type === "setFlag") {
      if (node.next != null && !nodeIds.has(node.next)) {
        issues.push({ path: `${path}.next`, message: `next(${node.next}) 노드가 없습니다.`, severity: "error" });
      }
      return;
    }

    if (node.type === "jump") {
      if (!nodeIds.has(node.target)) {
        issues.push({ path: `${path}.target`, message: `target(${node.target}) 노드가 없습니다.`, severity: "error" });
      }
      return;
    }

    if (node.type === "choice") {
      node.choices.forEach((choice, choiceIndex) => {
        if (!nodeIds.has(choice.next)) {
          issues.push({
            path: `${path}.choices[${choiceIndex}].next`,
            message: `next(${choice.next}) 노드가 없습니다.`,
            severity: "error",
          });
        }
      });
    }
  }
}
