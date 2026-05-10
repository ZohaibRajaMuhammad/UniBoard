# Execution System Source README Map

This file connects the `execution-system` package to all completed documentation folders in `docs`, excluding `execution-system` and `workflow-execution` as source domains.

## Primary Source READMEs
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

## Source Usage By Execution Folder

### 01 Master Requirements
Use:
- `/docs/README.md`
- all folder-level READMEs above
- all screen, feature, AI feature, API, state, and validation files

### 02 Planning And Mapping
Use:
- `/docs/product-package/*.md`
- `/docs/tasks/*.md`
- `/docs/components/*.md`
- `/docs/flows/*.md`
- `/docs/api/openapi/openapi.yaml`
- `/docs/states/*.md`

### 03 Build Workflow
Use:
- `/docs/screens/*.md`
- `/docs/features/*.md`
- `/docs/ai-features/*.md`
- `/docs/components/*.md`
- `/docs/flows/*.md`
- `/docs/api/*.md`
- `/docs/states/*.md`
- `/docs/validations/*.md`

### 04 Validation And QA
Use:
- `/docs/flows/*.md`
- `/docs/validations/*.md`
- `/docs/states/*.md`
- `/docs/api/openapi/openapi.yaml`
- `/docs/screens/*.md`
- `/docs/ai-features/*.md`

### 05 Release And Closure
Use:
- `/docs/product-package/*.md`
- `/docs/tasks/*.md`
- `/docs/api/openapi/openapi.yaml`
- all folder-level READMEs for final reconciliation

## Professional Rule
The execution system is complete only when each execution folder is explicitly grounded in the documentation above and every shipped behavior can be traced back to one of these source files.
