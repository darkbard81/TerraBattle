# Core Definition

## Recommended core definition

**경계 통과 기반 조작을 사용하는 격자 점유형 전술 배틀**

## English working definition

**A grid-occupancy tactical battle with boundary-crossing-based control.**

## Rule breakdown

### Board rules
- The battlefield is a grid.
- Each unit always occupies exactly one tile.
- Combat, hazard, and objective resolution are all evaluated from the final grid state.

### Control rules
- The player drags allied units.
- Input is resolved when a tile boundary is crossed, not when movement is interpreted as center-to-center grid stepping.
- The game may look continuous during drag, but the state change is evaluated at boundary crossing moments.

### Movement result rules
- If the tile beyond the crossed boundary is empty, the result is `move`.
- If the tile beyond the crossed boundary contains an ally, the result is `swap`.
- If the tile beyond the crossed boundary is blocked terrain or contains an enemy, the result is `block`.

## Design note

The board state remains grid-based.
Only the input interpretation changes from cell-step thinking to boundary-crossing thinking.
