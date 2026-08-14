# AI CV Analyzer — Design Plan

Mobile-first portrait (9:16), one-handed usage. Follows Apple HIG, iOS first-party feel. Light mode default + dark mode support. English + Arabic with RTL.

## Brand

- **Name**: AI CV Analyzer
- **Vibe**: Professional SaaS career/productivity tool. Clean, trustworthy, modern.
- **Palette (theme.config.js)**:
  - primary: deep indigo-blue `#4F46E5` (light) / `#6366F1` (dark) — confident, tech-professional
  - accent secondary for scores: emerald `#10B981` (high), amber `#F59E0B` (mid), red `#EF4444` (low)
  - background: `#FAFAFA` light / `#0F1115` dark
  - surface: white / `#1A1D24`
  - foreground: `#111827` / `#E6E8EB`
  - muted: `#6B7280` / `#9CA3AF`
- **Typography**: System font (SF Pro on iOS). Score numbers extra-bold, large.

## Screen List

1. **Home (Landing)** — tab "Home": Hero (title, description, "Analyze My CV" CTA), 4 feature cards (ATS Score, Skills Match, Missing Keywords, AI Recommendations), 3-step "How it works", language toggle (EN/AR), theme toggle.
2. **Upload (Analyze flow step 1)** — drag/drop-like drop zone (tap to pick PDF via DocumentPicker), filename display, remove/replace, PDF validation, loading state during extraction, Continue button → disabled until valid PDF extracted.
3. **Job Description (step 2)** — job title input, large textarea, target-job-title suggestions, "Analyze My CV" button → loading overlay during AI call.
4. **Results Dashboard (step 3)** — scrollable dashboard:
   - Overall score card with circular progress ring + AI explanation
   - Category scores grid (ATS, Skills, Experience, Keywords, Formatting, Relevance) — small rings/bars
   - Job Match: 82% with progress bar + explanation
   - Strengths list (3–5, green check icons)
   - Weaknesses list (3–5, amber x icons)
   - Missing Keywords: tag chips + Copy Keywords button
5. **Skills Comparison** — two columns (Skills Found in CV / Skills Required by Job), categorized: matching (green ✓) and missing (amber ⚠). Only report actually-detected skills.
6. **AI Recommendations** — "How to Improve Your CV": numbered actionable recommendations grounded in CV text; never invent qualifications.
7. **Professional Summary** — "Improve My Professional Summary": Original Summary card, AI Improved Summary card, Copy Improved Summary, Use This Version buttons; Before/After visual comparison (side-by-side cards, BEFORE muted / AFTER highlighted).
8. **Export** — "Download Analysis PDF" (generates report PDF on web: print-friendly HTML page + window.print; on native: shareable text/markdown + info), Copy Results, Analyze Another CV (reset flow).
9. **History** — tab "History": list of past analyses (job title, score pill, date), View Results (re-opens results via stored result), Delete (swipe or long-press confirm). Empty state with illustration-style text + CTA to start analysis.

## Key User Flows

1. Home → "Analyze My CV" → Upload CV → (extract text, loading) → Continue → Job Description → Analyze → Results Dashboard → (Skills / Recommendations / Summary / Export) → History or Analyze Another CV.
2. History → tap item → full results dashboard for that analysis.

## UI Patterns

- Tabs: Home, Analyze (shortcut to upload step), History, Settings (language/theme).
- Rounded-2xl cards, subtle shadow, 1px borders.
- Circular score ring (SVG) for overall; segmented bars for category scores; linear progress bar for job match.
- Loading: centered spinner + "Analyzing your CV..." text; Error: icon + retry; Empty: muted icon + guidance.
- Pressable buttons: scale 0.97 + haptic on native; web uses opacity.
- Toast/notification: transient success banner ("Copied to clipboard").

## Architecture Layers (separated)

- `lib/cv-parser`: PDF text extraction (web: pdf.js via CDN/installed pdfjs-dist; native: expo-document-picker + text extraction — on native use pdf-parse on server or fetch backend to extract)
- `lib/ai-service`: interface `analyzeCv({cvText, jobDescription, jobTitle})` → structured result; implementations: real (calls server tRPC → server LLM) + deterministic fallback analyzer (keyword/section scoring) if API fails
- `lib/analysis-history`: AsyncStorage store
- `lib/pdf-export`: report generation (web print HTML; native share)
- `lib/i18n`: EN/AR strings + RTL detection via I18nManager

## Native PDF handling note

Web preview: `pdfjs-dist` works in the Metro web bundle. For native device, extract via backend (server parses uploaded PDF text with pdf-parse and returns text). Keep the CV upload flow consistent: pick file → app uploads text/file to server → server returns extracted text.
