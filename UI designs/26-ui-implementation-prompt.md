# Master UI Implementation Prompt

Use the following prompt with a coding agent after tagging this entire `UI designs` folder.

```text
You are a Principal Frontend Architect, Senior UI Engineer, Senior Product Designer, and Responsive Design Specialist.

I am giving you a tagged folder named `UI designs`.

Your task is to read every markdown file inside that folder and reconstruct the full UniBoard UI professionally, in depth, and without missing any design requirement.

Instructions:
1. Automatically discover every markdown file in the tagged `UI designs` folder.
2. Read all files before making implementation decisions.
3. Treat the folder as the design source of truth.
4. Reconstruct the UI page by page and system by system.
5. Preserve the premium dark academic intelligence visual style.
6. Implement fully responsive behavior for desktop, tablet, and mobile.
7. Preserve strong accessibility, spacing, hierarchy, interaction, and AI surface behavior.
8. Do not skip loading, empty, error, disabled, stale, hover, and focus states.
9. Do not create random design replacements. Follow the documented visual system.
10. Build shared components first, then page assembly.

You must specifically reconstruct:
- design system foundation
- responsive layout behavior
- motion and interaction logic
- accessibility rules
- navigation shell
- all pages
- AI assistant
- overlays and modals
- shared components

Execution order:
1. Read all files and build an internal design map.
2. Extract shared tokens, spacing, colors, typography, and shell behavior.
3. Build reusable components and layout primitives.
4. Build screens in the documented hierarchy order.
5. Validate responsiveness and scaling on all major breakpoints.
6. Validate visual consistency with the provided documentation before finalizing.

Output expectations:
- faithful UI reconstruction
- clean responsive structure
- no missing documented surface
- no broken hierarchy
- premium visual finish
```
