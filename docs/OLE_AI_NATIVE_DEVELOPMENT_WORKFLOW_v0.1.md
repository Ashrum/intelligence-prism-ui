## 1. Purpose

This document defines the current AI-native development workflow for
`intelligence-prism-ui`, with emphasis on Agent component development.

The goal is not to build a general multi-agent framework. The goal is to
establish a minimal, controllable development loop in which:

-   **Claude Code / Opus 5.5** acts as Supervisor and independent
    Reviewer.
-   **Codex / GPT-6 Astra** acts as the primary Builder and consumes
    most of the implementation workload.
-   **The human Product Owner** retains product, architecture,
    design-direction, frozen-specification, and high-impact decisions.

JEV and product-side third-party model integration are explicitly
deferred.

------------------------------------------------------------------------

## 2. Current Status

The local bridge has been verified successfully:

`Claude Code → codex exec → Codex / Astra → shared local repository → Claude independent verification`

Verified baseline:

-   Claude Code can invoke the local Codex CLI.
-   Codex CLI version used for the successful bridge test: `0.156.1`.
-   Claude can capture Codex output and independently verify it through
    the local shell.
-   Read-only sandbox execution was verified without repository
    modification.
-   No MCP bridge, HTTP bridge, or additional orchestration service is
    required for the current phase.

The bridge was initially tested against `ole-school-workbench`. That
repository was used only to verify connectivity. The current
Agent-component development repository is `intelligence-prism-ui`.

------------------------------------------------------------------------

## 3. Repository Responsibility

### `intelligence-prism-ui`

Primary repository for the current phase.

Responsible for:

-   reusable Agent components;
-   component interaction states;
-   component-level examples and review fixtures;
-   Agent component specifications;
-   reusable skeletons where appropriate;
-   design-system consistency.

### `ole-school-workbench`

Consumer and later integration-validation repository.

Responsible for:

-   Teacher Workspace composition;
-   business-specific page behavior;
-   real workflow integration;
-   validating Prism components in actual Workspace scenarios.

Do not move Workspace-specific business behavior into Prism merely to
make a demo work.

Do not independently reimplement reusable Agent components in Workspace
when the capability belongs in Prism.

------------------------------------------------------------------------

## 4. Roles

### Human Product Owner

The human remains the final decision-maker.

Responsibilities include:

-   product direction;
-   UX and design-direction decisions;
-   architecture boundaries;
-   changes to frozen specifications;
-   acceptance of major trade-offs;
-   high-impact or irreversible operations;
-   final approval where human judgment is required.

The human should not act as a message relay between Claude and Codex
during normal implementation loops.

### Claude Code / Opus 5.5 --- Supervisor / Reviewer

Claude is the supervisory layer, not the primary Builder.

Primary responsibilities:

1.  understand the user's task;
2.  establish scope, exclusions, and acceptance criteria;
3.  provide Codex with a complete implementation unit;
4.  independently review the resulting diff and critical evidence;
5.  identify issues Codex failed to identify;
6.  request rework when necessary;
7.  perform incremental verification after rework;
8.  escalate product, architecture, frozen-spec, or high-impact
    decisions to the human;
9.  report the final result to the human.

Claude must not accept Codex's self-assessment as proof of correctness.

### Codex / GPT-6 Astra --- Builder / Orchestrator

Codex is the primary execution layer and should carry most of the token
and workload cost.

Primary responsibilities:

-   repository investigation;
-   relevant code and specification retrieval;
-   implementation analysis;
-   solution exploration;
-   coding;
-   component modification;
-   test execution;
-   lint/build execution where available;
-   browser/page validation where available;
-   self-check;
-   regression checking;
-   preparation of implementation evidence;
-   rework requested by Claude.

Codex does not approve its own work.

------------------------------------------------------------------------

## 5. Workload and Token Principle

The workflow is intentionally asymmetric.

Target effective workload:

**Codex / Astra: approximately 80--90%**\
**Claude / Opus: approximately 10--20%**

A practical target is roughly:

`Astra/Codex : Opus = 5:1 to 8:1`

This is a workload target, not an accounting requirement.

### Claude should avoid

-   rescanning the entire repository for every task;
-   repeating repository investigations already performed by Codex;
-   independently reproducing Codex's full implementation analysis;
-   running a second complete implementation process in parallel;
-   rereading unrelated specifications "for completeness";
-   performing full re-review after a narrow rework when incremental
    verification is sufficient.

### Claude should spend tokens on

-   task framing;
-   critical independent checks;
-   evidence verification;
-   finding systemic or subtle problems;
-   reviewing actual diffs;
-   checking critical visual/interaction paths;
-   deciding whether evidence is sufficient;
-   targeted regression verification.

The first repository-baseline investigation may be broader. Subsequent
tasks should reuse established context.

------------------------------------------------------------------------

## 6. Standard Development Loop

The normal loop is:

`Human → Claude Scope → Codex Build → Codex Self-check → Claude Review → Codex Rework if needed → Claude Verify → Human`

### Step 1 --- Human defines the real task

The human provides the component or capability to develop.

Claude must not invent unrelated work merely because it discovered
adjacent issues.

### Step 2 --- Claude scopes the task

Claude establishes only what is necessary:

-   Context
-   Scope
-   Out of Scope
-   Constraints
-   Acceptance Criteria
-   Required verification

Existing repository specifications and frozen design-system rules remain
authoritative.

### Step 3 --- Claude delegates one complete implementation unit to Codex

Prefer one substantial `codex exec` call over many fragmented calls.

The Codex request should contain:

-   Context
-   Task
-   Constraints
-   Acceptance Criteria
-   Self-check requirements

The objective is to reduce repeated context initialization and allow
Astra to perform the deep implementation work.

### Step 4 --- Codex builds and self-checks

Codex should perform the necessary implementation loop itself:

`inspect → plan → implement → test → inspect result → fix → self-check`

Where supported and relevant, this includes browser verification.

Codex should return concise evidence rather than a long narrative.

### Step 5 --- Claude performs independent Review

Claude reviews what matters, including as appropriate:

-   actual Git diff;
-   relevant changed files;
-   critical specification constraints;
-   test/lint/build evidence;
-   actual rendered/browser state;
-   relevant desktop/narrow states;
-   interaction states affected by the change;
-   likely regressions.

Claude should not repeat Codex's entire investigation unless evidence is
insufficient.

### Step 6 --- Claude issues one verdict

Allowed verdicts:

-   `PASS`
-   `PASS WITH NOTES`
-   `REWORK`
-   `ESCALATE`

#### PASS

Acceptance Criteria are met and no blocking issue remains.

#### PASS WITH NOTES

The task is acceptable, but non-blocking observations should be recorded
for later work.

#### REWORK

A concrete implementation problem exists.

Each rework item should contain:

-   Issue
-   Evidence
-   Impact
-   Required Change

Claude sends the issue directly back to Codex.

#### ESCALATE

Use when the issue requires human judgment, including:

-   product direction;
-   UX direction with meaningful trade-offs;
-   frozen-spec conflicts;
-   architecture-boundary changes;
-   major refactoring beyond task scope;
-   high-impact or irreversible actions;
-   insufficient evidence for a safe decision.

### Step 7 --- Codex performs rework

Codex fixes the identified issue and supplies updated evidence.

Do not unnecessarily reopen unrelated parts of the task.

### Step 8 --- Claude performs incremental verification

Claude verifies:

-   whether the reported issue is actually resolved;
-   whether the change caused a plausible regression.

Do not automatically repeat the entire original Review.

------------------------------------------------------------------------

## 7. Execution and Safety Boundaries

Claude may instruct Codex to:

-   read repository files;
-   modify files within the authorized repository;
-   run local tests;
-   run lint/build where the environment supports them;
-   start necessary local development services;
-   perform local browser validation.

Without explicit human authorization, Claude and Codex must not:

-   `git push`;
-   merge;
-   force-push;
-   deploy;
-   modify remote environments;
-   delete important resources;
-   perform large out-of-scope refactors;
-   alter frozen specifications;
-   make irreversible or high-impact changes.

Repository cleanliness and unexpected pre-existing changes must be
handled conservatively.

------------------------------------------------------------------------

## 8. Language

Communication with the human defaults to Simplified Chinese.

Technical terms, code identifiers, commands, file names, API names, and
verdict labels may remain in English.

Examples:

-   `PASS`
-   `PASS WITH NOTES`
-   `REWORK`
-   `ESCALATE`

Claude-to-Codex internal prompts may use whichever language is most
effective.

------------------------------------------------------------------------

## 9. Current `intelligence-prism-ui` Context

At the time this workflow was established:

-   the repository contains no root `AGENTS.md`;
-   Agent-related implementation exists but is still limited;
-   the component repository and `ole-school-workbench` have diverged in
    some Agent-related implementation;
-   some Workspace-side Agent capabilities have not yet been generalized
    back into Prism;
-   the local dependency/build environment may require additional setup
    before all tests can run.

These are repository findings, not authorization to fix everything at
once.

They should be addressed only when relevant to an approved task.

------------------------------------------------------------------------

## 10. Deferred Work

The following are intentionally not part of the current workflow:

### JEV Decision Gate

Deferred.

Current work does not contain enough frequent structured decisions to
justify introducing JEV into the normal development path. Human
decision-making remains more appropriate.

### Qwen / Third-party Product Model

Deferred.

A real third-party model may later be connected to drive and validate
the Teacher Workspace Agent experience, but this is separate from the
current development-control loop.

### General Multi-Agent Framework

Not planned for the current phase.

Do not create:

-   Agent Registry;
-   general Model Router;
-   Decision Service;
-   new workflow engine;
-   message bus;
-   orchestration microservice;

unless a later concrete requirement proves one is necessary.

------------------------------------------------------------------------

## 11. Cross-machine Use

The workflow should not depend on one specific Windows machine.

On another development machine, such as a MacBook Pro, the expected
setup is:

1.  install and authenticate Claude Code;
2.  install and authenticate Codex CLI;
3.  clone/pull the correct repository;
4.  verify `codex exec` locally;
5.  start Claude Code from the correct repository;
6.  use the same repository-level workflow rules.

Machine-specific authentication and CLI installation are local setup
concerns.

The development method itself should remain repository-defined and
portable.

------------------------------------------------------------------------

## 12. Current Operating Principle

The current workflow can be summarized as:

> **Astra does the deep work. Opus independently challenges and verifies
> it. The human makes the decisions that actually require human
> judgment.**

The objective is not maximum Agent autonomy.

The objective is a development process that is:

-   efficient;
-   independently reviewed;
-   observable;
-   controllable;
-   minimally complex;
-   portable across development machines;
-   compatible with later Workspace integration testing.

------------------------------------------------------------------------

## 13. Next Step

The next step is not further workflow design.

The next step is to select the first real Agent component task in
`intelligence-prism-ui` and run one complete:

`Scope → Build → Self-check → Review → Rework (if required) → Verify`

cycle.

Only after observing real friction in that cycle should this workflow be
revised or expanded.
