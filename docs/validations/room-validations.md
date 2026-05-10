# Room Validations

## Rules
- Room name length and uniqueness
- Subject code pattern
- Visibility enum validity
- Membership cap and tenant policy checks

## Error Cases
- Duplicate room
- Invalid subject code
- Private room policy violation

## UX Guidance
- Surface field-level errors inline where the user can fix them immediately.
- Reserve banners or toasts for cross-field or transport-level failures.
- Never clear valid user input after a validation failure.

## Backend Enforcement
- Treat client validation as advisory only.
- Mirror critical rules server side with machine-readable error codes and human-readable messages.
- Attach validation telemetry to detect confusion or malformed traffic patterns.
