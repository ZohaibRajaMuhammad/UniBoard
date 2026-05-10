# Authentication Validations

## Rules
- Email required and normalized
- Password required with tenant-specific complexity
- University-domain check on sign-up
- Verification token expiry enforced

## Error Cases
- Unknown email
- Weak password
- Unsupported academic domain
- Expired token

## UX Guidance
- Surface field-level errors inline where the user can fix them immediately.
- Reserve banners or toasts for cross-field or transport-level failures.
- Never clear valid user input after a validation failure.

## Backend Enforcement
- Treat client validation as advisory only.
- Mirror critical rules server side with machine-readable error codes and human-readable messages.
- Attach validation telemetry to detect confusion or malformed traffic patterns.
