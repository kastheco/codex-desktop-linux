# Kasmos monitor design concept

This is a standalone interaction and visual-design prototype for the Kasmos monitor inside Codex Desktop. It is intentionally not wired into the application or the Kasmos widget build.

## Product choice

- Subject: a live, project-scoped Kasmos delivery run.
- Audience: the engineer coordinating the run from a Codex task.
- Single job: understand progress, ownership, blockers, and evidence without asking an agent to re-read state.

## Brand language

- User-facing copy is lowercase by default.
- Uppercase is reserved for coded sequence identifiers such as `WAVE 01`, `CYCLE 03`, and `T04 · MCP APP`.
- Mixed title case and camel-style UI labels are outside the Kasmos brand language.

## Visual system

- Canvas: #171717 dark / #f7f7f8 light.
- Surfaces: #1d1d1f dark / #ffffff light.
- Theme: inherit Codex Desktop's resolved host theme first. Rose Pine Moon is the dark fallback and Rose Pine Dawn is the light fallback.
- Accent: Kasmos contributes restrained foam, iris, and gold semantics on top of the host canvas and text colors.
- State: foam for completed, iris for active selection, gold for attention/review loops, red only for failure.
- Type: the Codex/ChatGPT system UI stack for interface copy and SF Mono/Cascadia Code for lifecycle identifiers, branches, timestamps, and signals.
- Shape: 7–13 px radii, hairline boundaries, no floating card grid.

The signature element is the **task lifecycle**: lifecycle phases descend along one spine, with their agents and evidence attached beside them. Implementation expands into wave rows. Review/fix cycles append downward as durable history instead of being compressed into one status.

The pane uses three independent cards with equal spacing: task lifecycle, signal history, and selected agent details. Signal history is newest-first, grows with its contents up to a bounded height, then scrolls internally so the details card remains visible above the fold.

The Kasmos site and docs influenced the lowercase labels, mono operational metadata, subtle grid, foam/iris/gold identity, role vocabulary, and the planner → architect → coder waves → review/fix → readiness hierarchy. The existing website lifecycle cards were intentionally not carried over; the full-pane trace expresses the same model as one navigable system.

## What the current Kasmos contract can supply

- lifecycle counts and daemon state
- project and task summaries
- task status, phase, active wave, subtask progress, branch, topic, review cycle, PR checks, and blocker state
- focused plan goal and wave/task derivation
- active agent role, wave/task slot, branch, worktree basename, last activity, and paused state
- attention items, readiness fields, and bounded audit events

## Additive fields needed for the full design

1. Agent prompt and response references or summaries. Schema v2 exposes events, not transcript bodies.
2. Stable agent/run IDs on events so the inspector can join a task node to its prompt, response, and terminal history.
3. Timing fields per lifecycle phase, wave, task, and agent for elapsed/idle/waiting metrics.
4. Verification evidence as structured commands/results rather than prose in event messages.
5. Diff/file statistics, token use, and cost if those become deliberate observability goals. The current plan explicitly excludes per-task diff stats.
6. Dependency edges and gate reasons as structured data. Wave grouping exists, but arbitrary task dependencies do not.
7. A capability/permission description for future actions so the UI can distinguish read-only, approval-gated, and directly allowed controls.

Until these exist, the prompt/output tabs in the prototype should be treated as a future-state interaction model, not as claims about the v2 payload.

## Display modes

- Inline: execution trace plus attention and a compact inspector.
- Fullscreen/sidebar pane: the complete trace, inspector tabs, verification evidence, and signal history shown here.
- PiP: collapse to current phase, active wave, running agents, and attention count. Avoid shrinking the full diagram into an unreadable thumbnail.

## Interaction notes

- Clicking a lifecycle or task node updates the inspector.
- Prompt, Output, and Signals are parallel evidence views for the same selection.
- “Open in agent pane” is anchored to the bottom-right of the full-width tray and intentionally shown as a future handoff, not a direct mutating action.
- The header uses the complete lowercase transparent gradient `logo-full.png` wordmark from the Kasmos website, with no synthetic brand label.
- Theme defaults to the Codex host selection and includes Moon/Dawn overrides only for design review.
