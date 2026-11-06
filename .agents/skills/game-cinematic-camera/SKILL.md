---
name: game-cinematic-camera
description: Design, implement, and review cinematic camera direction in interactive 3D games (especially Three.js). Use for cutscenes, dialogue, reveals, character entrances, transitions, and camera polish while preserving gameplay control and mobile performance.
---

# Game Cinematic Camera Director

## Purpose
Convert filmmaking principles into **real-time interactive 3D camera systems**, not AI video generation. Improve shot composition, staging, camera motion, visual continuity, and transitions while respecting existing gameplay, assets, controls, and performance.

## Non-negotiable rules
1. **Read the project first:** Inspect README/GDD, scene structure, renderer, camera and input controls, animation pipeline, character assets, existing cutscene logic, and mobile constraints. Treat the actual GDD and assets as authoritative. Never invent missing models or replace existing characters without approval.
2. **Avoid destructive rewrites:** Reuse the current Three.js camera, scene objects, animation system, and scene graph. Make small, reversible changes. Preserve existing user control, collision handling, and save state. Do not alter story or character identities for the sake of a shot.
3. **Propose a shot plan before coding:** For each sequence specify purpose, shot size, camera placement, trajectory, timing, subjects, eyelines, screen-direction continuity, foreground/background motion, transition, and return-to-gameplay behavior.
4. **Camera movement must communicate something.** Follow a character/object; push in to emphasize; pull back to reveal; orbit to show spatial relationships; hold still for emphasis. Do not add constant shake or motion for its own sake.
5. **Cinematic design is situational:** Film rules such as 'every shot changes angle', 'always something moves', or 'eyes at 38%/62%' are *options*, not global constraints. Maintain legibility and comfort, especially during player-controlled gameplay.
6. **User consent and input:** During gameplay, never seize camera control unexpectedly. Use controlled cutscene mode only for explicit story events or when existing game design permits it. Support skip, interruption, scene change, restart, and camera restore.
7. **Performance:** Build mobile-friendly, time-based motion, avoid per-frame allocations and costly raycasts where unnecessary. Support reduced motion and low-end device settings. Measure, do not guess, FPS.
8. **Review before shipping:** Check visual framing on desktop/mobile, clipping, occlusion, subject visibility, animation beats, camera jitter, screen direction, control restoration, skip/replay, and crashes. State what you could not directly run or visually inspect.

## Workflow

### Phase 1: Project reconnaissance
Read the GDD and inspect relevant implementation. Produce a short inventory:
- Runtime/engine/version and camera control libraries (e.g. OrbitControls, custom controller)
- World coordinates, dimensions, scene scale, camera FOV, near/far planes
- Existing characters, props, waypoints, animation clips, camera collision and UI overlays
- Which camera sequences are scripted vs player-controlled
- Platforms, desired framing/aspect ratios, FPS target, accessibility settings

Ask only for critical missing narrative intentions; otherwise choose reversible defaults and record assumptions.

### Phase 2: Shot list
For each meaningful beat prepare a table:
`id | purpose/emotion | trigger | shot type | camera position/target | actor blocking (screen-left/right) | motion & easing | duration | transition | skip/restore | occlusion risk`

Supported shot vocabulary:
- Establishing wide: clarify scene geography before action.
- Medium / over-the-shoulder (OTS): dialogue and spatial context.
- Close-up: expressions, prop or important action.
- Tracking / dolly: follow a walking subject or moving object.
- Push-in: make a discovery or reaction feel important.
- Pull-out: reveal a wider consequence or surprise.
- Arc / orbit: expose relationships or environment; avoid unnecessary 360° spins.
- Foreground reveal / motivated wipe: foreground prop briefly masks view to transition.
- Static hold: let actor, particles, rain, lighting or subtle background animation carry motion.

For narrative cuts, alternate shot size and angle when it helps readability. Keep screen direction coherent; use the 180-degree principle unless crossing the axis is established intentionally. Place important faces roughly at thirds or optionally golden-section lines (x≈0.38/0.62), adjusting for subtitles, HUD and negative space. For gameplay prioritize focus, visibility and player spatial orientation instead.

### Phase 3: Blocking and camera paths
- Plan start/end transforms, target points, focal length/FOV, and key action beats.
- Represent camera paths via waypoints, curves (CatmullRomCurve3 when appropriate), and quaternion orientation; use position and look target interpolation with smooth easing.
- Use timestamp-based movement, not frame-count-based increments. Beware Euler angle wrapping and avoid overly abrupt rotations.
- Add deliberate settle/hold before cutting. Ease in/out but avoid floaty over-easing in action.
- Separate actor/world movement from camera movement and describe exactly what moves.
- If the camera crosses geometry, prioritize collision/occlusion avoidance, line-of-sight checks or an alternate angle. Avoid camera movement through walls and models.
- Protect character silhouettes: avoid UI overlays, screen-edge cropping, and unreadable distant faces on phones.

### Phase 4: Visual direction
- Specify scene palette and lighting intent per beat without replacing existing visual identity.
- Check grayscale luminance separation between subject and background when possible.
- Use foreground/midground/background depth and parallax sparingly.
- Consider depth-of-field and motion blur only when already supported and measured; prefer clear, performant graphics on mobile.
- On mobile, test portrait/landscape crop, safe areas, UI and subtitles; adapt FOV/framing rather than uniformly scaling shots.

### Phase 5: Implementation
Implement as a small composable camera director, not a broad rewrite:
- Camera mode state machine: `gameplay → enteringCutscene → cutscene → exitingCutscene → gameplay`.
- Save current camera transform, controller enabled state, target, input lock state (if applicable), and restore in `finally`/cleanup paths.
- Provide `play(sequenceId)`, `skip()`, `cancel()`, and `dispose()` or equivalents aligned with project conventions.
- Prefer existing update loop and timing mechanism. Ensure repeated triggers, rapid skip, unmount, scene change, and errors cannot leave the controls disabled.
- Animate on deterministic tracks; use easing and animation events for dialogue/action synchronization. Avoid setting unrelated objects' transforms globally.
- For user-controlled cameras provide **optional guidance** (soft target smoothing, distance framing, contextual focus) instead of hard locks.
- Respect reduced-motion settings (shorter/simpler camera movement or instant cuts) and avoid excessive shake/roll.
- Add debug visualization gated to development: path curve, camera frustum, target markers, subject screen coordinates and shot progress.

### Phase 6: QA with independent review
Create a reviewer role (another agent if supported, or separate read-only pass) that reviews the GDD, shot plan, implementation diff and screenshots or recordings independently. The reviewer **finds defects but does not change files**. Report:
- Shot ID / timestamp or trigger
- Defect and why it affects narrative legibility or user experience
- Evidence or reproducible steps
- Severity (blocker / major / minor)
- Lowest-risk remediation
- Pass / fail

Required tests:
- GDD and character/asset continuity
- Subject focus and screen direction across cuts
- Wrong side of wall, geometry clipping, occluded faces, offscreen props
- Aspect ratios: desktop widescreen and mobile portrait/landscape as relevant
- 30/60 FPS variation (time-based animation), camera smoothing and motion sickness
- Playback/skip/cancel/retrigger/scene unload; controls always restored
- Camera near/far clipping, FOV jumps, sudden roll, target overshoot
- HUD/subtitles safe areas and focus on small screens
- Actual FPS/memory evidence when tooling permits

## Output contract for every task
1. **Project findings:** what is actually present and where.
2. **Shot plan:** compact shot table with purpose and practical coordinates/targets when available.
3. **Changes made:** paths and minimal implementation notes; state unmodified elements.
4. **Verification:** tests executed, screenshots/recordings actually inspected, failures and limitations.
5. **Next adjustment knobs:** timing, FOV, offsets, target height, path length, ease strength, collision margin.

## Suggested acceptance criteria
- A first-time player can identify the focal subject and intended action in every shot.
- No unexpected camera takeover in free-play.
- Skip and cancellation consistently return controls and framing.
- No obvious clipping or subject loss in tested viewports.
- Screen direction and character placements preserve spatial understanding.
- The implementation stays within the project's measured performance budget.

## Principles adapted from source article
Original article's pipeline: story logic → shot design → style/character consistency → first/last frame validation → independent prompt review → generation → edit → final review. For games map this to: GDD/beat → shot list → asset/scene consistency → key camera pose validation → code review → real-time implementation → transition polish → device QA. AI-video-specific Seedance APIs, per-second credit pricing, frame generation, rendering, and ffmpeg editing are intentionally excluded.

For further detailed checks, read `references/shot-review-checklist.md`.
