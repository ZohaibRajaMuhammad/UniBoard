# AI Safety Validations

## Rules
- Reject empty prompt
- Input length bounded
- Prompt injection and unsafe content checks
- Grounded-answer features require accessible sources

## Error Cases
- Unsafe prompt
- Too much context
- No authorized sources
- AI disabled by policy

## UX Guidance
- Surface field-level errors inline where the user can fix them immediately.
- Reserve banners or toasts for cross-field or transport-level failures.
- Never clear valid user input after a validation failure.

## Backend Enforcement
- Treat client validation as advisory only.
- Mirror critical rules server side with machine-readable error codes and human-readable messages.
- Attach validation telemetry to detect confusion or malformed traffic patterns.
