# Post Validations

## Rules
- Body required unless attachment-only post type explicitly supported
- Length min/max by post type
- Attachment type and size policy
- Anonymous allowed only when room policy permits

## Error Cases
- Empty body
- Body too long
- Unsupported attachment
- Anonymous posting blocked

## UX Guidance
- Surface field-level errors inline where the user can fix them immediately.
- Reserve banners or toasts for cross-field or transport-level failures.
- Never clear valid user input after a validation failure.

## Backend Enforcement
- Treat client validation as advisory only.
- Mirror critical rules server side with machine-readable error codes and human-readable messages.
- Attach validation telemetry to detect confusion or malformed traffic patterns.
