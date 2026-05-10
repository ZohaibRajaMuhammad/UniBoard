# Deadline Validations

## Rules
- Deadline title required
- Date/time must be future-oriented unless archival import mode
- Estimated effort numeric and bounded
- Associated room must exist

## Error Cases
- Past date
- Invalid timezone
- Missing room
- Negative effort

## UX Guidance
- Surface field-level errors inline where the user can fix them immediately.
- Reserve banners or toasts for cross-field or transport-level failures.
- Never clear valid user input after a validation failure.

## Backend Enforcement
- Treat client validation as advisory only.
- Mirror critical rules server side with machine-readable error codes and human-readable messages.
- Attach validation telemetry to detect confusion or malformed traffic patterns.
