# UniBoard Product Documentation

This documentation system was generated from the visible product surface in uniboard-ai.html and uniboard-complete.html.

## Coverage
- /screens: Dedicated implementation-ready screen specifications for all discovered screens.
- /features: Feature-by-feature functional, backend, security, and monitoring documentation.
- /ai-features: Individual AI capability architecture documents.
- /flows: User and system workflow documentation with branching and recovery behavior.
- /components: Reusable UI building block documentation.
- /api: Recommended API contract set required to operationalize the prototype.
- /states: State management requirements and store design notes.
- /validations: Validation rule catalogs and enforcement expectations.

## Prototype Reconciliation Notes
- The two HTML files represent overlapping but not identical product variants.
- uniboard-ai.html contributes the AI assistant panel, AI room summary drawer, knowledge base screen, saved screen, analytics screen, and leaderboard screen.
- uniboard-complete.html contributes the AI intelligence suite modal, AI learning profile, planner screen, add-deadline modal, and reputation screen.
- Planner and reputation appear as injected prototype additions and are not fully wired into the visible navigation map. They should still be treated as first-class roadmap surfaces because their markup, styling, and interaction model are substantially defined.
- New Text Document (2).txt is empty and provides no additional requirements.

## Recommended Build Order
1. Authentication, bootstrap, and navigation shell.
2. Room lifecycle plus room feed collaboration.
3. Notifications, search, and saved content.
4. AI summary, assistant, and knowledge base.
5. Analytics, leaderboard, planner, and reputation.
