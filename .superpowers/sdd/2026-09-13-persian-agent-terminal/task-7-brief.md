# Task 7 Brief: Profile & Preset Registration (`Persian & Agent Terminal`)

## Task Description
Register the built-in profile `Persian & Agent Terminal` (`local:persian-agent`) in `tabby-local/src/profiles.ts`.

In `tabby-local/src/profiles.ts`:
- `LocalProfilesService extends ProfileProvider<LocalProfile>`
- In `configDefaults`:
  Add options:
  - `enablePersianBidi: boolean`
  - `enableAgentMarkdown: boolean`
  - `useYekanFont: boolean`
- In `getBuiltinProfiles()`:
  In addition to the standard shells (`powershell`, `cmd`, `bash`, etc.), add the specialized profile:
  ```typescript
  {
      id: 'local:persian-agent',
      type: 'local',
      name: 'Persian & Agent Terminal',
      icon: 'fas fa-robot',
      options: {
          command: '', // system default shell
          enablePersianBidi: true,
          enableAgentMarkdown: true,
          useYekanFont: true,
      },
      isBuiltin: true,
  }
  ```
- In `tabby-local/src/components/terminalTab.component.ts` (or wherever a session is started with profile):
  When a session is created with profile options having `enablePersianBidi` or `enableAgentMarkdown`, invoke:
  `this.session.setPersianAgentOptions(profile.options)`
  so the middleware is automatically attached!
- In `tabby-local/src/api.ts`:
  Update `SessionOptions` / `LocalProfile` interfaces to include optional `enablePersianBidi?: boolean`, `enableAgentMarkdown?: boolean`, `useYekanFont?: boolean`.

## Requirements & TDD Steps
1. Create failing test `tabby-local/src/profiles.spec.ts`:
   - Test `LocalProfilesService` registers `local:persian-agent` in `getBuiltinProfiles()`.
   - Test that default profile options have `enablePersianBidi: true`, `enableAgentMarkdown: true`, `useYekanFont: true`.
   - Test that standard profiles remain intact.
2. Run test to verify failure:
   `node --experimental-strip-types tabby-local/src/profiles.spec.ts`
3. Implement profile registration and session wiring.
4. Run test to verify it passes.
5. Commit:
   `git add tabby-local/src/profiles.ts tabby-local/src/api.ts tabby-local/src/components/terminalTab.component.ts tabby-local/src/profiles.spec.ts`
   `git commit -m "feat(profile): register Persian & Agent Terminal builtin profile"`
6. Write report to `.superpowers/sdd/2026-09-13-persian-agent-terminal/task-7-report.md`.
