# 01 Master Requirements

## Objective
Create a single professional baseline of all written requirements before implementation starts.

## Source Documentation To Use
- `/docs/README.md`
- `/docs/screens/*.md`
- `/docs/features/*.md`
- `/docs/ai-features/*.md`
- `/docs/components/README.md`
- `/docs/flows/README.md`
- `/docs/api/*.md`
- `/docs/states/*.md`
- `/docs/validations/*.md`

## 4-Step Workflow
### Step 1: Read And Inventory
- Review every README in the main `docs` folders.
- Build a master inventory of screens, features, AI features, flows, components, APIs, states, and validations.
- Mark which requirements come from `uniboard-ai.html` and which come from `uniboard-complete.html`.

### Step 2: Categorize And Group
- Group requirements into platform, collaboration, AI, planning, reputation, and governance domains.
- Identify hard dependencies between folders, for example:
  - screen depends on component
  - feature depends on API
  - AI feature depends on validation and state
  - flow depends on screen plus API plus permission rules

### Step 3: Approve Scope
- Mark all items as `build now`, `build later`, or `future extension`.
- Confirm planner, reputation, analytics, AI assistant, and knowledge base are explicitly included or explicitly deferred.
- Confirm which flows are mandatory for first release.

### Step 4: Freeze The Baseline
- Publish one approved requirements baseline.
- Do not allow implementation to proceed against undocumented assumptions.

## Deliverables
- Master requirements inventory
- Source-to-feature dependency sheet
- Approved build scope
- Ownership mapping

## Exit Criteria
- Every README in `docs` has been classified.
- No screen, feature, flow, validation, or AI requirement remains unaccounted for.
