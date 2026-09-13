# Task 7 Report: Profile & Preset Registration (`Persian & Agent Terminal`)

## Summary of Implementation
Implemented built-in profile registration and automatic middleware wiring for the **Persian & Agent Terminal** preset in `tabby-local`:

1. **Session Options Extension (`tabby-local/src/api.ts`)**:
   - Added optional flags to `SessionOptions`:
     - `enablePersianBidi?: boolean`: Enables Persian BiDi visual reordering and letter reshaping.
     - `enableAgentMarkdown?: boolean`: Enables ANSI Box-Drawing styling and Markdown streaming formatter.
     - `useYekanFont?: boolean`: Configures preferred Yekan Bakh Persian font rendering.

2. **Built-in Profile Registration (`tabby-local/src/profiles.ts`)**:
   - Added default values in `configDefaults.options`:
     - `enablePersianBidi: false`
     - `enableAgentMarkdown: false`
     - `useYekanFont: false`
   - In `getBuiltinProfiles()`:
     - Preserves all standard detected shells (PowerShell, Cmd, Bash, WSL, etc.).
     - Registers the specialized preset `local:persian-agent`:
       ```typescript
       {
           id: 'local:persian-agent',
           type: 'local',
           name: 'Persian & Agent Terminal',
           icon: 'fas fa-robot',
           options: {
               ...this.configDefaults.options,
               command: '', // system default shell
               enablePersianBidi: true,
               enableAgentMarkdown: true,
               useYekanFont: true,
           },
           isBuiltin: true,
       }
       ```
   - Enhanced `getShells()` to safely handle missing or mocked `config.enabledServices`.
   - Optimized module imports and constructor parameter assignment to support both Angular/Webpack DI and Node `--experimental-strip-types` test execution.

3. **Session Wiring (`tabby-local/src/components/terminalTab.component.ts`)**:
   - In `initializeSession()`:
     - Checks if `this.profile.options?.enablePersianBidi || this.profile.options?.enableAgentMarkdown`.
     - Automatically invokes `this.session?.setPersianAgentOptions?.(this.profile.options)` to attach `PersianAgentMiddleware` to the session pipeline upon tab creation.

---

## TDD Output

### 1. RED Phase (Failing Test Verification)
Command:
```bash
node --experimental-strip-types tabby-local/src/profiles.spec.ts
```

Output:
```
TAP version 13
# Subtest: LocalProfilesService includes Persian & Agent Terminal builtin profile
not ok 1 - LocalProfilesService includes Persian & Agent Terminal builtin profile
  ---
  duration_ms: 0.8407
  type: 'test'
  location: 'D:\Project\Tabby-New\tabby-persian\tabby-local\src\profiles.spec.ts:5:1'
  failureType: 'testCodeFailure'
  error: 'Should register local:persian-agent profile'
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected: true
  operator: '=='
  stack: |-
    TestContext.<anonymous> (file:///D:/Project/Tabby-New/tabby-persian/tabby-local/src/profiles.spec.ts:16:12)
    async Test.run (node:internal/test_runner/test:1054:7)
    async startSubtestAfterBootstrap (node:internal/test_runner/harness:296:3)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 5.2806
```

### 2. GREEN Phase (Passing Test Suite)
Command:
```bash
node --experimental-strip-types tabby-local/src/profiles.spec.ts
```

Output:
```
TAP version 13
# Subtest: LocalProfilesService includes Persian & Agent Terminal builtin profile
ok 1 - LocalProfilesService includes Persian & Agent Terminal builtin profile
  ---
  duration_ms: 0.7824
  type: 'test'
  ...
# Subtest: LocalProfilesService preserves standard shell profiles
ok 2 - LocalProfilesService preserves standard shell profiles
  ---
  duration_ms: 0.4082
  type: 'test'
  ...
# Subtest: LocalProfilesService configDefaults sets default Persian & Agent options to false
ok 3 - LocalProfilesService configDefaults sets default Persian & Agent options to false
  ---
  duration_ms: 0.2145
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 3
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 6.7019
```

### 3. Full Regression Test Verification
All test suites in the repository pass:
- `tabby-terminal/src/features/persian/ansiPreserver.spec.ts`: 9/9 passing
- `tabby-terminal/src/features/persian/persianReshaper.spec.ts`: 8/8 passing
- `tabby-terminal/src/features/persian/persianBidi.spec.ts`: 11/11 passing
- `tabby-terminal/src/features/persian/fontSetup.spec.ts`: 1/1 passing
- `tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`: 10/10 passing
- `tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`: 7/7 passing
- `tabby-local/src/profiles.spec.ts`: 3/3 passing
**Total: 49/49 tests passing (100%)**

---

## Git Commit
```
commit fbc7b6982fa7e5cbf5d9c22e4324f9f7dc670984
Author: Maad <ir.maadzone@gmail.com>
Date:   Sun Sep 13 11:22:37 2026 +0330

    feat(profile): register Persian & Agent Terminal builtin profile

 4 files changed, 113 insertions(+), 13 deletions(-)
 create mode 100644 tabby-local/src/profiles.spec.ts
```

---

## Files Modified
1. `tabby-local/src/api.ts`
2. `tabby-local/src/profiles.ts`
3. `tabby-local/src/components/terminalTab.component.ts`
4. `tabby-local/src/profiles.spec.ts`
