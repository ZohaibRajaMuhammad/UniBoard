# Uniboard AI Implementation Blueprint

## Objective

Move Uniboard AI from a general room-aware assistant to a governed academic intelligence system with:

- authority-aware retrieval
- intent-specific orchestration
- thread-aware AI mentions
- explicit abstention behavior
- enterprise-grade iteration points

## Implemented Foundations

### Shared Knowledge Model

The current AI layer now treats room posts as structured knowledge signals rather than flat text blobs.

Each source carries:

- room scope
- source type
- authority band
- freshness band
- source tier
- resolved and pinned signal

### Retrieval Policies

Retrieval now supports separate strategies:

- `knowledge`
- `mention`
- `composer`

This enables different ranking behavior per surface instead of using one shared score for every ask.

### Intent Routing

The AI layer now classifies:

- knowledge intents
- assistant mention intents

This changes both prompt instructions and follow-up behavior.

### Mention Context Parsing

AI mentions now preserve:

- source post type
- source post title
- source post content
- parent comment context
- user request

This allows mention retrieval to optimize around the local thread instead of behaving like a room-wide blind search.

## Next Production Steps

### 1. Canonical Knowledge Objects

Add a first-class knowledge table for:

- approved policies
- curated room notes
- resolved answer cards
- teacher-authored canonical resources
- generated room and thread summaries

Recommended fields:

- `sourceKind`
- `canonicalPriority`
- `roomId`
- `threadId`
- `content`
- `embeddingId`
- `visibilityScope`
- `freshnessState`
- `reviewedBy`
- `reviewedAt`

### 2. Comment-Level Retrieval

Today the mention system uses structured thread context supplied in prompts. The next step is to index comments directly so mention answers can retrieve:

- the triggering comment
- sibling replies
- nearby thread evidence
- resolved comment answers

### 3. Evaluation Harness

Build a repeatable eval dataset for:

- should-answer cases
- should-abstain cases
- stale deadline cases
- conflicting-source cases
- mention-thread summary cases
- evidence requests
- action-item extraction

### 4. Confidence and Conflict Detection

Add explicit conflict scoring when two high-authority sources disagree. In that case the assistant should surface the conflict instead of flattening it into one answer.

### 5. Feedback Loop

Capture structured user feedback:

- wrong answer
- wrong source
- outdated
- too vague
- unnecessary clarification
- helpful

Use that signal to tune ranking and source promotion before considering model fine-tuning.

## Enterprise Position

Uniboard should remain retrieval-first.

- dynamic room content belongs in retrieval
- behavior shaping belongs in prompts and evaluations
- fine-tuning should be reserved for style and policy consistency after retrieval quality stabilizes
