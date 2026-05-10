# Profile Validations

## Rules
- Display name length and character policy
- Avatar MIME type and size
- Bio length and sanitization

## Error Cases
- Invalid avatar
- Name too long
- Locked field cannot be edited

## UX Guidance
- Surface field-level errors inline where the user can fix them immediately.
- Reserve banners or toasts for cross-field or transport-level failures.
- Never clear valid user input after a validation failure.

## Backend Enforcement
- Treat client validation as advisory only.
- Mirror critical rules server side with machine-readable error codes and human-readable messages.
- Attach validation telemetry to detect confusion or malformed traffic patterns.
