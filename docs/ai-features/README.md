# AI Features Documentation Index

This folder defines each AI-powered capability in UniBoard as a production feature, not as a decorative enhancement.

## Files In This Folder
- `ai-assistant.md`
- `ai-room-summary.md`
- `ai-composer-suggestions.md`
- `ai-semantic-search-ranking.md`
- `ai-knowledge-base-answering.md`
- `ai-deadline-risk-radar.md`
- `ai-study-planner.md`
- `ai-learning-profile.md`
- `ai-intelligence-suite.md`

## How To Use These Files
1. Read the AI feature README before implementing any AI UI affordance.
2. Confirm the input pipeline, model logic, and output-processing rules.
3. Implement failure handling before enabling the feature in the UI.
4. Validate confidence behavior, safety behavior, and latency budgets.

## Completion Standard
An AI feature is complete only when:
- the underlying model or heuristic path exists,
- the fallback path exists,
- the UI communicates confidence and failure correctly,
- and the feature obeys policy, permissions, and source-grounding requirements.
