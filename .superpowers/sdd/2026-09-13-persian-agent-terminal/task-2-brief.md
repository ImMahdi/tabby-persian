# Task 2 Brief: Persian Letter Shaping Engine (`persianReshaper`)

## Task Description
Implement the Persian letter shaping engine in `tabby-terminal/src/features/persian/persianReshaper.ts`.
Persian characters have 4 visual contextual forms depending on joining:
- Isolated (جدا)
- Initial (ابتدایی)
- Medial (میانی)
- Final (پایانی)

Characters like Alef (`ا`), Dal (`د`), Dhal (`ذ`), Reh (`ر`), Zain (`ز`), Zheh (`ژ`), Waw (`و`) are non-connecting forward (they connect to a preceding character if possible, but never connect to the following character).
Other characters connect in all positions (initial, medial, final, isolated).

Persian specific characters must be fully supported:
- `پ` (Peh: isolated \uFB56, final \uFB57, initial \uFB58, medial \uFB59)
- `چ` (Tcheh: isolated \uFB7A, final \uFB7B, initial \uFB7C, medial \uFB7D)
- `ژ` (Zheh: isolated \uFB8A, final \uFB8B)
- `گ` (Gaf: isolated \uFB92, final \uFB93, initial \uFB94, medial \uFB95)
- `ک` (Keheh: isolated \uFB8E, final \uFB8F, initial \uFB90, medial \uFB91)
- `ی` (Farsi Yeh: isolated \uFBFC, final \uFBFD, initial \uFBFE, medial \uFBFF)
Standard Arabic presentation forms B (Alef, Beh, Teh, Theh, Jeem, Hah, Khaa, Seen, Sheen, Saad, Daad, Tah, Zah, Ain, Ghain, Feh, Qaf, Kaf, Lam, Meem, Noon, Heh, Waw, Yeh, etc.) must also be mapped.
Special ligature:
- `لا` (Lam-Alef: \uFEFB isolated, \uFEFC final).

Exported Functions:
- `isPersianChar(char: string): boolean`
- `reshapePersian(text: string): string`

## Requirements & TDD Steps
1. Create failing test `tabby-terminal/src/features/persian/persianReshaper.spec.ts`:
   - Test `isPersianChar` with Persian, English, and digit characters.
   - Test `reshapePersian('سلام')` -> first char is initial Seen (\uFEB3).
   - Test `reshapePersian('پروژه')` -> first char is initial Peh (\uFB58).
   - Test non-connecting letters behavior (e.g. `آب`, `درود`).
2. Run test to verify failure:
   `node --experimental-strip-types tabby-terminal/src/features/persian/persianReshaper.spec.ts`
3. Implement `tabby-terminal/src/features/persian/persianReshaper.ts`.
4. Run test to verify it passes.
5. Commit:
   `git add tabby-terminal/src/features/persian/persianReshaper.ts tabby-terminal/src/features/persian/persianReshaper.spec.ts`
   `git commit -m "feat(persian): implement contextual letter shaping engine"`
6. Write report to `.superpowers/sdd/2026-09-13-persian-agent-terminal/task-2-report.md`.
