# Shot review checklist — local supplement

This file was not supplied with the uploaded Skill. It is a project-local checklist
derived from its Phase 6 and the user's current requirements. The original
`SKILL.md` and `ai-video-source.txt` are preserved unchanged. The video article is
reference material, not permission to run generation APIs, spend money, create
additional agents, or replace the real-time game with rendered video.

## Scope and continuity

- Record the game commit, sequence/shot ID, trigger, intended subject and emotion.
- Read current dialogue/state data and current revision documents. Label older
  design drafts as historical; do not reinstate their abandoned story or controls.
- Preserve character names, supplied GLBs, existing mechanisms, timing gates and
  player actions. Check that any proposed action already exists in the rig.
- Distinguish a planned pose from a pose actually captured in the game.

## Framing, movement and safety

- Inspect the first/middle/last pose and the frames on both sides of every cut.
- Check the moving subjects throughout the path, not only a stationary target.
- Check near-plane corners, silhouettes, faces, gestures and important props.
- Keep camera positions and continuous paths out of walls, windows, roof/signs,
  racks and actors. Transparent glass is not permission to cross a solid frame.
- Preserve screen direction and eyelines; establish a new axis before crossing it.
- State what moves and why. A static reaction or reading shot can remain still.
- Test portrait and landscape independently; keep required subjects outside the
  actual subtitle/HUD rectangles. Partial OTS foreground is intentional only if
  identified in the shot plan; the main subject must remain legible.
- Use an authored safe fallback for an obstructed scripted path. Avoid random
  offsets or uncontrolled zoom that produce a second jump.

## Input, clock and lifecycle

- Check normal playback, pause, background/resume, skip when already supported,
  replay, rapid retrigger, debug jump, asset load failure and scene disposal.
- Keep player-operated photo/tablet/keyboard/power controls usable and stable.
- A player drag stops optional guidance according to existing game rules.
- Confirm each exit returns to the intended story or free-play framing and
  restores input ownership, FOV, target, collision history and damping state.
- Replay the same sequence with 30 Hz and 60 Hz time steps. Compare pose at equal
  mission times, including the end hold; never add another RAF or wall-clock timer.
- Test reduced motion separately. Do not claim software WebGL proves iPhone FPS.

## Review evidence

Use a separate read-only review pass or reviewer. Reviewers identify defects;
they do not edit implementation or approve work outside the user's scope.

Report for each defect:

| Shot/trigger | Defect and user impact | Evidence/reproduction | Severity | Lowest-risk fix | Pass/fail |
| --- | --- | --- | --- | --- | --- |

Severity: blocker (crash/stuck input), major (lost subject/clipping/wrong story
beat), minor (composition/timing polish). Record unavailable device, sound or
motion evidence explicitly. Plan approval is not implementation/device acceptance.
