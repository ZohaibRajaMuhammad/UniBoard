# Flows Documentation Guide

This folder defines the operational user and system workflows required to complete UniBoard professionally. These files are not optional support material. They define how screens, APIs, components, AI behavior, validations, and permissions must behave end-to-end.

## Purpose
- Convert static screen and feature documentation into executable product behavior.
- Make branching, failure recovery, role-based behavior, and success completion explicit.
- Prevent teams from implementing screens that look correct but fail in real end-to-end use.

## Files In This Folder
- `sign-in-flow.md`
- `sign-up-flow.md`
- `onboarding-to-dashboard-flow.md`
- `create-room-flow.md`
- `discover-and-join-room-flow.md`
- `compose-post-with-ai-flow.md`
- `room-summary-flow.md`
- `ai-assistant-query-flow.md`
- `search-and-open-result-flow.md`
- `knowledge-base-qa-flow.md`
- `planner-and-manual-deadline-flow.md`
- `reputation-progression-flow.md`

## Required Execution Order
1. Validate entry points.
   Confirm every flow has a real route, button, shortcut, or system event that can start it.
2. Validate success paths.
   Confirm the happy path produces the documented payload changes, UI transitions, navigation updates, and metrics.
3. Validate branch behavior.
   Confirm permission branches, empty states, AI-disabled states, and role-specific rendering are implemented exactly as documented.
4. Validate failure recovery.
   Confirm transient failures, validation errors, missing data, and timeout behavior preserve user progress and expose recovery options.

## Mandatory Flow Rules
- No flow is complete if only the success case works.
- No AI flow is complete unless timeout, abstention, and low-confidence behavior exist.
- No mutation flow is complete unless optimistic UI and rollback behavior are defined where appropriate.
- No navigation flow is complete unless back-navigation and route persistence have been validated.
- No workflow is complete until related state and validation docs are also satisfied.

## Cross-Folder Dependencies
- `/docs/screens`: tells you where the flow starts and what UI appears.
- `/docs/features`: tells you the business logic the flow must honor.
- `/docs/components`: tells you which controls and stateful components the flow depends on.
- `/docs/api`: tells you what backend integrations must succeed.
- `/docs/states`: tells you what client and server state transitions must occur.
- `/docs/validations`: tells you what input and system rules can block the flow.

## Professional QA Checklist
- Entry point verified.
- Exit point verified.
- Decision nodes verified.
- Permission branches verified.
- Error states verified.
- Retry behavior verified.
- Analytics and telemetry verified.
- Accessibility path verified for keyboard-only usage.

## Exit Criteria
A flow file is complete only when:
- every documented step is implemented,
- every branch has been tested,
- every dependent component has been verified,
- every API dependency is integrated,
- and the final user outcome matches the documented success condition.
