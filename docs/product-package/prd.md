# UniBoard PRD

## Product Summary
UniBoard is an academic collaboration workspace that combines course rooms, feed-based collaboration, deadline management, semantic search, knowledge retrieval, and AI-assisted planning into one student-and-instructor product.

## Problem Statement
- Academic discussion is fragmented across chat groups, LMS announcements, and personal notes.
- Students miss deadlines because engagement and planning signals are spread across systems.
- Valuable explanations are repeatedly recreated because prior course knowledge is hard to retrieve.
- Existing academic community tools rarely provide AI features that are grounded in course-specific content.

## Product Vision
Create a single academic intelligence platform where every class room becomes searchable, actionable, and progressively smarter through AI.

## Target Users
- Students managing multiple active courses.
- Instructors moderating course communication and clarifying difficult topics.
- Moderators or TAs coordinating discussion hygiene and answered questions.
- Tenant or institution admins governing policy and feature access.

## Core Jobs To Be Done
- "Help me know what matters academically right now."
- "Help me ask better questions and find answers faster."
- "Help me avoid deadline failure and plan the work."
- "Help me build visible academic reputation through quality contributions."

## Product Pillars
1. Room-centric academic collaboration.
2. Deadline clarity and study orchestration.
3. Grounded AI assistance.
4. Reputation and motivation loops.
5. Enterprise-grade governance, safety, and observability.

## In-Scope Product Surfaces
- Landing, sign in, sign up.
- Dashboard, room detail, rooms discovery.
- Notifications, search, knowledge base, saved.
- Profile, settings, room settings.
- Analytics, leaderboard, planner, reputation.
- Cross-cutting overlays: create room modal, add deadline modal, AI assistant/panel, AI suite, summary drawer.

## Primary Success Metrics
- Daily active users per active tenant.
- Weekly room contribution rate per student.
- Deadline completion rate.
- Search-to-answer success rate.
- AI feature adoption rate and repeat usage.
- P95 latency for critical user journeys.

## Non-Functional Requirements
- Multi-tenant security isolation.
- Policy-driven role and feature management.
- High client responsiveness under moderate content density.
- Explainable AI outputs with source grounding where required.
- Comprehensive auditability for moderation and settings changes.

## Risks
- AI overpromising without enough grounding.
- Reputation systems incentivizing low-quality spam.
- Planner recommendations feeling intrusive or unrealistic.
- Prototype surface divergence causing build-order confusion.

## Mitigations
- Strict source-grounding and abstention rules.
- Quality-weighted reputation with abuse detection.
- Planner override and manual deadline support.
- Shared documentation baseline and unified API contract.
