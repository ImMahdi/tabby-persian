# Task 1 Brief: Dual-Font Typography Setup (`YekanBakh` + Monospace)

## Task Description
Set up Yekan Bakh typography alongside the default monospaced font in Tabby:
1. Copy `YekanBakh-Regular.ttf` and `YekanBakh-Bold.ttf` from `d:/Project/Tabby-New/YekanBakh4 Pro/Font Family/ttf/` to `d:/Project/Tabby-New/tabby-persian/tabby-terminal/src/fonts/`.
2. Add `@font-face` rules for `"YekanBakh"` to `tabby-terminal/src/frontends/xterm.css` with `unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;` for both regular and bold weights.
3. Update `getCSSFontFamily` in `tabby-core/src/utils.ts` to include `'YekanBakh'` in the font fallback chain before `'monospace-fallback'`.
4. Follow TDD:
   - Create failing test `tabby-terminal/src/features/persian/fontSetup.spec.ts`
   - Run test with `node --experimental-strip-types tabby-terminal/src/features/persian/fontSetup.spec.ts` and verify failure.
   - Implement the font copying and code changes.
   - Run test and verify it passes.
   - Commit changes: `git add tabby-terminal/src/fonts/ tabby-terminal/src/frontends/xterm.css tabby-core/src/utils.ts tabby-terminal/src/features/persian/fontSetup.spec.ts` and `git commit -m "feat(typography): add Yekan Bakh font with unicode-range fallback"`.

## Global Constraints
- Do not modify or break existing font settings for English or code.
- Arabic/Persian unicode-range must be strictly: `U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF`.
