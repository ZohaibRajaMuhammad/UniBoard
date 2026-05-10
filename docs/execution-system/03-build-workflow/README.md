# 03 Build Workflow

## Objective
Implement the documented UniBoard product using a disciplined 4-step workflow for every feature cluster.

## Source Documentation To Use
- `/docs/screens/*.md`
- `/docs/features/*.md`
- `/docs/ai-features/*.md`
- `/docs/components/*.md`
- `/docs/flows/*.md`
- `/docs/api/*.md`
- `/docs/states/*.md`
- `/docs/validations/*.md`

## 4-Step Workflow
### Step 1: Build Foundations First
- Complete auth, navigation shell, modal system, toast system, state framework, and API client layer.
- Finish shared components before deep page assembly.

### Step 2: Build Feature Clusters
- Implement features in this order:
  1. authentication and app shell
  2. dashboard and room discovery
  3. room detail, composer, comments, saves
  4. notifications and search
  5. knowledge base and AI assistant
  6. settings and room settings
  7. analytics and leaderboard
  8. planner
  9. reputation

### Step 3: Integrate Dependencies
- Wire every screen to its documented components.
- Wire every feature to its documented APIs.
- Wire every flow to its success, error, retry, and permission branches.
- Wire every AI feature to validation, fallback, and confidence behavior.

### Step 4: Mark Completion Professionally
- A feature is complete only when:
  - the screen renders correctly,
  - the API contract is integrated,
  - the flow works end to end,
  - validation is enforced,
  - and role-based behavior is correct.

## Feature Completion Standard
- No UI-only completion allowed.
- No backend-only completion allowed.
- No AI feature is complete without fallback.
- No screen is complete without loading, empty, success, error, and disabled states.

## Deliverables
- Working feature clusters
- Integrated screens
- AI-enabled user journeys
- Role-safe interactions

## Exit Criteria
- All written feature READMEs are implemented against the documented behavior.
