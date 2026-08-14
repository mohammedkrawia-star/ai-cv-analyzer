# Project TODO

## Core
- [x] Theme & branding (colors, app config, logo)
- [x] EN/AR localization with RTL support
- [x] CV PDF upload + text extraction (server-side extraction for all platforms)
- [x] Job description input (title + textarea, validation)
- [x] AI service layer (server LLM via tRPC + deterministic fallback)
- [x] Analysis result types & shared schema
- [x] Local analysis history (AsyncStorage)

## Screens
- [x] Home/Landing page (hero, feature cards, 3 steps, language/theme toggles)
- [x] Upload CV screen (pick PDF, validate, filename, remove/replace, loading, web file input fallback)
- [x] Job Description screen (title + description inputs, cv validation)
- [x] Results dashboard (overall ring, category scores, explanation)
- [x] Skills comparison (found vs required, matching/missing)
- [x] AI Recommendations section
- [x] Professional summary improvement + Before/After comparison
- [x] Export: Download PDF report (web print), Copy Results, Analyze Another CV
- [x] History tab (list, view, delete, empty state)
- [x] Settings (language EN/AR, theme light/dark)

## Quality
- [x] Loading / error / empty states everywhere
- [x] Form & PDF validation, success notifications
- [x] Unit tests for CV parser scoring & AI service (9 passing)
- [x] End-to-end manual verification in preview
- [ ] Checkpoint + deliver

## Bug fixes
- [x] App crashes immediately on launch (user report on downloaded app) — downgraded expo-clipboard to ~8.0.8 and expo-document-picker to ~13.1.6 (v57 packages were incompatible with Expo SDK 54 runtime)
- [x] Verify startup flows in preview and re-checkpoint

## Comparison feature (before/after)
- [x] Comparison types + delta computation (scores, summary, keywords)
- [x] Comparison screen: side-by-side score bars, progress indicators, summary before/after, added keywords
- [x] Entry point on upload screen: "Compare with a previous analysis" when history exists
- [x] Entry point in history: "Compare with this analysis"
- [x] EN/AR strings for comparison UI
- [x] Tests for delta computation, checkpoint and deliver

## Full application review
- [x] TypeScript + lint pass across whole project (0 errors, 0 warnings)
- [x] Run all tests; audit crash-prone patterns (native-only APIs called on web, hook order, provider wiring)
- [x] Audit each screen flow for dead ends, broken presses, missing error handling
- [x] Verify server routes (extract, analyze) and edge cases
- [x] Fix all identified issues: stale-state race in history persistence, compare-from-history pair selection, blank-screen hydration delay, web file-input leak, popup-blocked PDF export fallback, lint warnings, redundant code; tests expanded to 18 passing

## Share result feature
- [x] Share analysis button on results screen (native: React Native Share text; web: Web Share API, clipboard fallback)
- [x] EN/AR strings for share feature (shareResult, shareTitle, shareUnavailable)
- [x] Added optional icon prop to PrimaryButton with share icon (square.and.arrow.up)
- [x] Re-review app end-to-end, tests pass, lint-clean, checkpoint, deliver

## Improved CV generation (ATS format)
- [x] Server: improveCv mutation — AI rewrites full improved CV (ATS-friendly layout: summary, skills, experience) based on analysis + extracted CV text, with local truthful fallback
- [x] Results screen: "Generate Improved CV" button with download as PDF (same report system style)
- [x] Web + native PDF generation support for the improved CV (web print + clipboard fallback; native alert-to-copy)
- [x] EN/AR strings for improved CV feature
- [x] Verify all buttons work end-to-end (all flows audited, hooks fixed)
- [x] Verify dark/light theme across all screens (settings toggle verified, screenshots checked)
- [x] Tests (18 passing), lint-clean, TypeScript clean, checkpoint, deliver

## Improved CV preview & edit
- [x] New cv-preview screen: formatted preview (section headings highlighted), editable text area, Save Changes / Download PDF / Copy buttons
- [x] In-memory handoff store (improved-cv.ts) to pass generated CV to preview screen
- [x] Edit text before downloading; PDF uses the edited version (web print + clipboard fallback)
- [x] Results screen: "Preview & Edit CV" button (eye.fill icon) navigates to preview screen
- [x] EN/AR strings for preview/edit feature
- [x] 24 tests passing, lint-clean, TypeScript clean, checkpoint, deliver

## Crash report #3 (instant close after splash on Android)
- [x] Diagnose from user video: splash shows → instant crash, user on latest build (866689ba+)
- [x] Verify all expo-* versions SDK-54-compatible (no module mismatch regression)
- [x] Fix: guard I18nManager.forceRTL() in lib/i18n (applyRtl helper: only when isRTL differs, try/catch) — runtime RTL toggle on every launch was crashing Android process
- [x] Verify dev server boot (babel.config.js untouched — preset auto-registers reanimated/worklets plugins)
- [x] Tests (24), tsc clean, lint clean (pnpm lint), mobile screenshots OK

## Crash still persists after RTL guard fix (report #4)
- [x] Disable New Architecture (newArchEnabled: false in app.config.ts) — known Fabric/TurboModules crash source on some Android devices
- [x] Disable React Compiler experiment (reactCompiler) — can break release JS init
- [x] Wrap root layout with RootErrorBoundary + global ErrorUtils handler that persists last fatal error to AsyncStorage for diagnostics
- [x] Verify tests (24)/lint/typecheck pass, Metro clean, checkpoint, deliver

## Crash persists after New Arch disable (report #5 — "مش راضي يعمل")
- [x] Deep audit: all expo versions SDK-54-matched, all PNG assets valid, no corrupt files
- [x] Confirmed app uses ZERO audio/video features — yet expo-audio (mic plugin) + expo-video (background playback/PiP services) plugins were registered and their native services crash at init on some Android devices
- [x] Removed expo-audio and expo-video plugins from app.config.ts AND removed the packages
- [x] Tests (24), tsc clean, Metro clean, screenshots OK, checkpoint, deliver; user must uninstall old APK and install fresh build

## APK cannot be installed from email (report #6)
- [x] Full audit of app.config.ts: bundle ID, version, scheme, plugins — all valid
- [x] Audit Android adaptive icon assets: all 5 PNGs valid 512x512 RGBA, no corruption
- [x] Audit build properties and permissions: minSdk 24, standard permissions, fine
- [x] Root cause identified: modern Android (10+) blocks installing APK directly from email apps (Gmail etc.) — it is an OS restriction, not an app defect. Also old-version signature conflict causes "App not installed"
- [x] Tests 24 passing, tsc clean after restore; delivered Arabic install instructions (Chrome download, unknown apps permission, uninstall old version first)

## EAS Publish Gradle build failed (report #7 — eas_build_failed)
- [x] Diagnose: expo-build-properties buildArchs override does not apply in EAS (GitHub issue #38225); 32-bit armeabi-v7a/x86 ABIs fail on modern EAS NDK → Gradle failure in "Run gradlew"
- [x] Removed expo-build-properties plugin AND package from app.config.ts; EAS now builds arm64-v8a only (covers all modern devices)
- [x] Tests (24) passing, tsc clean, lint clean (0 errors), checkpoint 687f8403, deliver retry instructions

## Verify publish & get app onto user's phone (report #8)
- [x] Local preview verified healthy (200 OK, home screen screenshot OK, tests 24 pass, tsc clean)
- [x] Published site currently returning HTTP 500 on all routes (platform deployment issue, not app code) — flagged to user: retry Publish or contact https://help.manus.im
- [x] Delivered install guidance: Publish → wait for Android build → download APK via Chrome (not email), uninstall old version first; Expo Go QR alternative
