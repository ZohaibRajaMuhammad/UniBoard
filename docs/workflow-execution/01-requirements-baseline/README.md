# Phase 1: Requirements Baseline

## Objective
Establish one approved execution baseline for the entire UniBoard product before implementation begins.

## Why This Phase Exists
The current documentation set is broad. Without a formal baseline phase, teams will implement isolated screens or features while missing dependencies in flows, AI behavior, states, permissions, and validations.

## Required Inputs
- `/docs/README.md`
- `/docs/screens`
- `/docs/features`
- `/docs/ai-features`
- `/docs/components/README.md`
- `/docs/flows/README.md`
- `/docs/api`
- `/docs/states`
- `/docs/validations`

## Step-by-Step Workflow
1. Build the master inventory.
   Create a working checklist of every screen, feature, AI feature, flow, component, API contract, state doc, and validation doc.
2. Reconcile prototype gaps.
   Mark which items come from `uniboard-ai.html`, which come from `uniboard-complete.html`, and which require unification.
3. Define release scope.
   Split documentation into `must-build now`, `phase-two`, and `future-ready but not in MVP` only if product leadership explicitly approves it.
4. Map ownership.
   Assign product, design, frontend, backend, AI, QA, and DevOps owners to each major area.
5. Confirm cross-dependencies.
   For each feature, identify its required screens, components, APIs, states, flows, and validations.
6. Freeze the baseline.
   Approve one implementation matrix so downstream teams stop reinterpreting scope.

## Deliverables
- Approved product scope matrix
- Cross-dependency matrix
- Feature ownership map
- Release-scope approval note

## Completion Checklist
- Every folder in `/docs` has been reviewed.
- No undocumented dependency remains hidden.
- Planner and reputation are explicitly included or explicitly deferred.
- AI features have trust, safety, and fallback expectations approved.
- Validation and permissions expectations are accepted by engineering and product.

## Exit Criteria
Do not leave Phase 1 until every documented artifact is classified, owned, and mapped.
