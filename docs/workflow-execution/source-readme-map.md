# Workflow Execution Source README Map

This file connects the `workflow-execution` package to every documentation source folder in `docs`, excluding `workflow-execution` and `execution-system`.

## Source Folders And Their READMEs
- `/docs/README.md`
- `/docs/screens/README.md`
- `/docs/features/README.md`
- `/docs/ai-features/README.md`
- `/docs/components/README.md`
- `/docs/flows/README.md`
- `/docs/api/README.md`
- `/docs/states/README.md`
- `/docs/validations/README.md`
- `/docs/product-package/README.md`
- `/docs/tasks/README.md`

## Detailed Source Files By Domain

### Screens
- `/docs/screens/*.md`

### Features
- `/docs/features/*.md`

### AI Features
- `/docs/ai-features/*.md`

### Components
- `/docs/components/*.md`

### Flows
- `/docs/flows/*.md`

### API
- `/docs/api/*.md`
- `/docs/api/openapi/openapi.yaml`
- `/docs/api/openapi/openapi.json`

### State
- `/docs/states/*.md`

### Validation
- `/docs/validations/*.md`

### Program Delivery
- `/docs/product-package/*.md`
- `/docs/tasks/*.md`

## Mandatory Rule
Every phase in `workflow-execution` must pull its implementation logic from the source files above. No phase should rely on assumptions outside this documentation set.
