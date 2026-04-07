# RoadMap

## Goal

Build TerraBattle as a scenario-based tile sandwich attack puzzle game using Node.js, TypeScript, PixiJS, and React HUD.

This roadmap is intentionally rough.
Detailed rules, structures, and implementation contracts are filled in later inside each working folder.

## Phase 0. Repository Foundation

### Goal
- Establish repository-level rules and working style.

### Includes
- root documents
- document-first workflow
- conventions for folder-level docs

### Status
- started

## Phase 1. Playable Core Definition

### Goal
- Define only the minimum game flow and battle frame needed to build the first playable version.

### Includes
- top-level game flow
- chapter and scenario progression
- dialogue and battle step structure
- rough battle rules
- rough movement rules

### Outcome
- enough definition to begin MVP implementation

## Phase 2. Project Skeleton

### Goal
- Build the technical skeleton of the project.

### Includes
- project bootstrap
- Node.js + TypeScript + Vite setup
- PixiJS canvas layer
- React HUD overlay
- initial `src` structure
- app entry and basic screen flow

### Outcome
- application launches with Pixi and React running together

## Phase 3. Battle MVP

### Goal
- Make one battle playable from start to finish.

### Includes
- grid board rendering
- friendly tile selection
- 5 second floating movement
- block collision and sliding
- friendly swap
- final movement commit
- sandwich resolution
- HP reduction and death
- basic win / fail check

### Outcome
- one debug battle can be played and resolved

## Phase 4. Scenario MVP

### Goal
- Connect battle to the actual game progression loop.

### Includes
- main menu
- new game / continue / config / exit flow
- chapter select
- scenario select
- dialogue to battle flow
- retry / return flow
- scenario clear
- unlock next scenario or next chapter

### Outcome
- one chapter progression loop works end to end

## Phase 5. Data-Driven Structure

### Goal
- Move from hardcoded test flow to content-driven structure.

### Includes
- chapter data
- scenario step data
- battle board data
- unit placement data
- unlock data
- schema only where needed

### Outcome
- new scenarios can be added mainly through data and local docs

## Phase 6. Battle Expansion

### Goal
- Expand the rules and variation space after the MVP is stable.

### Includes
- environment tile detail
- enemy and neutral AI
- unit-specific abilities
- special battle conditions
- multiple battles in one scenario
- additional win conditions

### Outcome
- battle system supports broader puzzle variation

## Phase 7. UX and Presentation

### Goal
- Improve feel, readability, and responsiveness.

### Includes
- HUD refinement
- input feel tuning
- visual feedback for movement and sandwich results
- particles and effects
- resolution support and layout tuning

### Outcome
- the game feels readable and presentable beyond prototype level

## Phase 8. Content Pipeline

### Goal
- Shift from core system building to repeatable content production.

### Includes
- chapter and scenario production workflow
- map and battle authoring workflow
- balancing loop
- QA checklist
- folder-level doc templates where needed

### Outcome
- content can be produced repeatedly without redesigning the core each time

## Immediate Priority

1. Phase 1. Playable Core Definition
2. Phase 2. Project Skeleton
3. Phase 3. Battle MVP
4. Phase 4. Scenario MVP

## Guiding Principle

Do not wait for every detailed rule to be fixed before moving forward.
Use this roadmap to move phase by phase, and fill detailed rules only when they become necessary for the current phase.
