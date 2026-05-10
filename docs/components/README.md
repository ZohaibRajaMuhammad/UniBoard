# Components Documentation Guide

This folder contains the reusable UI building blocks required to implement UniBoard consistently across all screens, features, AI surfaces, and responsive breakpoints.

## Purpose
- Standardize the visual system across dashboard, rooms, planner, reputation, search, notifications, and AI experiences.
- Prevent screen teams from re-implementing similar UI logic with inconsistent spacing, states, and accessibility behavior.
- Define a component-level source of truth before feature assembly begins.

## Files In This Folder
- `sidebar-navigation.md`: Desktop global navigation shell.
- `mobile-bottom-nav.md`: Mobile app navigation capsule.
- `top-header.md`: Reusable top-page header and contextual action area.
- `glass-card.md`: Base content surface pattern.
- `room-card.md`: Room discovery and room summary card.
- `post-card.md`: Feed content unit for announcements, notes, questions, and resources.
- `comment-thread.md`: Expandable thread system.
- `composer.md`: Post-composer input module with AI suggestion support.
- `search-bar.md`: Search entry system for lexical and semantic retrieval.
- `modal-system.md`: Shared overlay and modal shell.
- `toast-system.md`: Transient system feedback layer.
- `ai-fab-and-panel.md`: Floating AI entry point and assistant panel.
- `ai-summary-drawer.md`: AI room summary overlay surface.
- `calendar-grid.md`: Planner calendar grid and event display.
- `leaderboard-row.md`: Reusable reputation leaderboard row.

## Required Completion Workflow
1. Read the screen docs first.
   This ensures the team understands where each component appears and what context-specific behavior it must support.
2. Read the feature docs second.
   This clarifies which components are purely visual and which must support business logic such as permissions, AI states, moderation, or planner scheduling.
3. Implement component contracts before page assembly.
   Define props, events, accessibility rules, loading states, and error states before wiring screens.
4. Validate each component against all screen contexts.
   A component is not complete until it has been checked in every location where the documentation expects it to appear.

## Mandatory Standards
- Every interactive component must support `default`, `hover`, `focus`, `disabled`, `loading`, and `error` states where relevant.
- Every icon-only control must expose an accessible label.
- Every component must work at desktop, tablet, and mobile breakpoints if used outside desktop-only layouts.
- Any component used by AI features must handle policy-disabled, low-confidence, and unavailable-service states.
- Any data-driven component must tolerate empty, partial, stale, and delayed data.

## Professional Delivery Checklist
- Visual spec implemented from the design-system tokens.
- Responsive behavior validated.
- Keyboard and screen-reader behavior validated.
- Analytics hooks defined where the component represents a tracked interaction.
- Error and fallback states implemented.
- Component linked back to at least one screen doc and one feature doc during QA.

## Recommended Build Order
1. `glass-card`, `top-header`, `modal-system`, `toast-system`
2. `sidebar-navigation`, `mobile-bottom-nav`, `search-bar`
3. `room-card`, `post-card`, `comment-thread`, `composer`
4. `ai-fab-and-panel`, `ai-summary-drawer`, `calendar-grid`, `leaderboard-row`

## Exit Criteria
A component folder item is complete only when:
- the component file has been implemented,
- all documented states exist,
- all consuming screens render correctly,
- the related flow documentation passes,
- and validation requirements from `/docs/validations` have been enforced.
