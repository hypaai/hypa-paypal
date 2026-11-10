# Igbo keyboard

Uses the user's confirmed QWERTY interpretation of the reference sketch, rather than its rearranged positions. The e/u/i/o positions show ẹ/ụ/ị/ọ on open. Their first long-press choices are plain e/u/i/o, followed by dotted acute/grave/macron forms and plain acute/grave/macron forms. Plain a stays unmarked on tap; long-press offers tone marks only. Long-press c offers ch, g offers gb/gh/gw, and k offers kp/kw. The n popup offers standard ṅ, retained ñ from the sketch/previous layout, nw, ny and n tones. Existing sh remains reachable from s.

Case forms are explicit: Shift-once inserts Ch/Gb/Gh/Gw/Kp/Kw/Nw/Ny; Caps-lock inserts CH/GB/GH/GW/KP/KW/NW/NY. Dotted vowels and ṅ have explicit Unicode uppercase forms. All generated variants are NFC; dotted vowels plus tone marks remain one grapheme. Normalization removes tone for lookup while preserving distinguishing vowel dots and the dot above ṅ.

Source of truth: `scripts/keyboard-layouts.ts`. Regenerate the Swift/Kotlin catalogs with `yarn workspace @hypa/intelligence generate:keyboard-languages`; never edit generated catalogs directly.

This independent branch includes the same runtime protections needed by the Hausa work, without adding its language layout: guarded immediate digraph backspace, stale-popup replacement checks, and missing-active-language corpus handling. No Igbo corpus is bundled, so the keyboard must not silently substitute English corpus corrections. Rapid language switches clear old data and ignore stale loader results. Long-press Android popups fit the keyboard width; queued popup presentation checks that its anchor/session is still live.

The most recent popup digraph deletes as a unit only while surrounding text is unchanged and available. Cursor/selection changes, further typing, or a different field invalidate this record. Otherwise ordinary grapheme deletion applies. Manually typing a digraph keeps ordinary per-character deletion.

Validation includes TypeScript layout/NFC tests, executable Swift/Kotlin catalog assertions, native normalization checks, and Swift syntax parsing. Native JUnit cases cover layout, tone forms and digraph case. Device QA should cover narrow/split keyboards, larger fonts, long-press cancellation and cursor movement during a hold; immediate/repeated backspace after digraphs versus individually typed letters; combining tone deletion; unavailable host context; shift-once/caps-lock; picker search; field changes; and rapid language switching. Catalog checks do not replace physical iOS/Android interaction testing.

## Integrating the independent keyboard branches

A dry-run merge against HYP-108 identifies conflicts in the shared layout source, layout tests, native catalog tests, language-pack tests and generated Swift/Kotlin catalogs. The native runtime protections themselves match and merge cleanly. When both features are merged, retain both Hausa and Igbo rows/popups/case forms in `scripts/keyboard-layouts.ts`, retain both languages' regression cases, then regenerate both catalogs from the merged source. Do not choose one generated catalog wholesale or one language's table over the other. The branches remain separate and neither includes the other's layout.
