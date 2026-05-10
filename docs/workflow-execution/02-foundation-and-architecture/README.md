# Phase 2: Foundation And Architecture

## Objective
Build the reusable system architecture required to support all documented features before feature-by-feature page assembly starts.

## Core Principle
UniBoard should not be built screen-first. It should be built system-first, then assembled into screens and flows.

## Required Inputs
- `/docs/components`
- `/docs/api`
- `/docs/states`
- `/docs/validations`
- `/docs/product-package/engineering-spec.md`

## Step-by-Step Workflow
1. Implement the app shell.
   Build auth guards, routing, sidebar navigation, mobile navigation, title management, modal orchestration, toast orchestration, and AI-entry visibility rules.
2. Implement shared UI primitives.
   Complete the base components documented in `/docs/components` before page teams start composing screens.
3. Implement the API client and contract layer.
   Use the OpenAPI contract and API docs to define typed request and response handling, error envelopes, retries, and cache rules.
4. Implement state architecture.
   Create the normalized stores and route-level state slices defined in `/docs/states`.
5. Implement validation infrastructure.
   Build reusable validation handling for forms, AI input checks, room policy checks, and planner input rules.
6. Implement security and permission gates.
   Add role-based rendering, room membership checks, tenant policy locks, and AI feature enablement guards.
7. Implement observability hooks.
   Add logging, analytics event dispatch, request-id propagation, and baseline metrics instrumentation.

## Deliverables
- Shared frontend architecture
- Shared backend contract/client layer
- Shared validation layer
- Shared permissions layer
- Shared observability layer

## Completion Checklist
- Components are reusable, not screen-local clones.
- API contracts are typed and versioned.
- Error handling is standardized.
- AI feature gates exist globally.
- State slices match the docs and are not improvisational.
- Validation is enforced both at UX and contract boundaries.

## Exit Criteria
Do not leave Phase 2 until the platform can support the documented features without architectural rework.
