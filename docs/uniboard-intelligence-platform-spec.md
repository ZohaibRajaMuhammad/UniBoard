# Uniboard Intelligence Platform Spec

## Product Intent

Uniboard should feel like an academic command surface, not a chat app with extra panels. The knowledge layer is the primary operating system of the product: users ask, inspect, decide, and then act inside rooms, planners, and posts.

The AI should behave as a restrained professional companion:

- Answer from authorized knowledge first.
- Keep responses concise, structured, and source-aware.
- Abstain cleanly when evidence is weak.
- Preserve a familiar, refined, enterprise-safe tone.

## Information Architecture

### Knowledge Base

The Knowledge page is the platform's central intelligence hub.

- Primary zone: question input, answer, confidence, and follow-up.
- Evidence zone: source cards linking back to room posts.
- System zone: grounding posture, confidence semantics, and next-action guidance.

### Room Screen

A room should open in `overview` mode by default.

- First screen: AI room summary, presence, room stats, pinned context, filters, and moderation entry points.
- Feed is hidden by default to reduce cognitive load.
- Users can switch to `split` or `feed` mode explicitly.
- `split` mode preserves room context while exposing the post stream.

## Core UX Flows

### Ask and Verify

1. User opens Knowledge.
2. User submits a question.
3. System returns a concise answer with confidence and sources.
4. User either refines the question or jumps into the cited room post.

### Enter a Room

1. User opens a room.
2. System shows room summary, presence, filters, stats, pinned context.
3. User chooses `overview`, `split`, or `feed`.
4. User composes, moderates, or inspects posts without losing orientation.

### AI in Discussion

1. User composes a post or invokes assistant help.
2. AI drafts or replies only from visible room context.
3. Assistant exposes sources and suggested follow-up prompts.

## Prompt Design Standards

### Knowledge Answering

Use instructions shaped like:

`Answer only from authorized sources. Lead with the answer. Be concise, structured, and evidence-first. State uncertainty plainly. Abstain instead of inferring unsupported facts.`

### Room Summary

Use instructions shaped like:

`Summarize the room from visible posts only. Surface what changed, what matters now, and what remains unresolved. Call out deadlines, blockers, and open questions without filler.`

### Assistant Reply

Use instructions shaped like:

`Act as Uniboard's academic workspace assistant. Use a professional, familiar, refined tone. Answer directly in 1-3 sentences or tight bullets. Suggest only concrete next actions.`

## Component Model

### Room

- `RoomHeader`
- `PresenceBar`
- `Room intelligence summary`
- `View mode controller`
- `Context controls`
- `Pinned context`
- `PostFeed`
- `PostComposer`
- `TeacherPanel`

### Knowledge

- `Knowledge hero and query form`
- `Answer panel`
- `Confidence panel`
- `Sources grid`
- `System behavior panel`

### Assistant

- `Message stream`
- `Confidence badge`
- `Suggested prompts`
- `Source jump cards`

## Edge Cases

- No room posts: summary should explain lack of evidence instead of fabricating activity.
- AI unavailable: deterministic fallback must stay useful and visibly labeled.
- Low-confidence answer: show caution state and encourage question refinement.
- Hidden feed on mobile: feed expansion must remain one tap away.
- Highlighted post deep-link: room should switch directly into feed mode.
- Quiet room: presence area should still render a useful empty state.

## Enterprise Engineering Standards

- Keep AI contracts typed end-to-end.
- Separate retrieval, prompting, parsing, and fallback logic.
- Prefer reusable surface, filter, and evidence card primitives.
- Preserve accessibility with explicit labels, clear focus states, and 44px touch targets.
- Design for progressive disclosure rather than dense default screens.
- Treat source traceability as a product feature, not a debugging aid.
