/**
 * Shared helpers for the improved CV feature:
 * - HTML builder for print-to-PDF export
 * - In-memory store so the preview screen can receive and persist edits
 *   made to the generated improved CV text.
 */

const HEADING_PATTERN =
  /^\s*(PROFESSIONAL SUMMARY|SKILLS|EXPERIENCE|EDUCATION|CERTIFICATIONS|LANGUAGES|PROJECTS|REFERENCES)\s*$/i;

export function isCvHeading(line: string): boolean {
  return HEADING_PATTERN.test(line);
}

export function buildImprovedCvHtml(entry: { jobTitle: string; cvText: string }): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = escapeHtml(entry.cvText)
    .split("\n")
    .map((line) => {
      const t2 = line.trim();
      if (isCvHeading(line)) {
        return `<div class="h2">${t2}</div>`;
      }
      if (t2.length === 0) return "<br/>";
      return `<p>${t2}</p>`;
    })
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Improved CV — ${escapeHtml(entry.jobTitle)}</title>
<style>
body{font-family:Helvetica,Arial,sans-serif;max-width:700px;margin:32px auto;color:#111827;line-height:1.55;font-size:14px}
h1{font-size:20px;margin-bottom:2px}.h2{font-size:13px;font-weight:800;margin-top:18px;color:#4F46E5;text-transform:uppercase;letter-spacing:1;border-bottom:1px solid #E5E7EB;padding-bottom:4px}
p{margin:3px 0}
@media print{body{margin:16px auto}}
</style></head><body>
<h1>${escapeHtml(entry.jobTitle)}</h1>
${body}
</body></html>`;
}

/**
 * Simple in-memory handoff store: the results screen saves the generated
 * improved CV here under a numeric id, and the preview screen reads it.
 * Text is too long for route params, so we use ids instead.
 */
const editedCvStore = new Map<number, string>();
let editedCvCounter = 0;

export function storeEditedCv(text: string): number {
  editedCvCounter += 1;
  editedCvStore.set(editedCvCounter, text);
  return editedCvCounter;
}

export function readEditedCv(id: number): string | undefined {
  return editedCvStore.get(id);
}

export function updateEditedCv(id: number, text: string): void {
  editedCvStore.set(id, text);
}

/**
 * Web-only: opens the CV in a printable window (save as PDF via print
 * dialog). Returns true when the window opened; false means the popup
 * was blocked and the caller should fall back (e.g. clipboard).
 */
export function openCvPrintWindow(entry: { jobTitle: string; cvText: string }): boolean {
  if (typeof window === "undefined") return false;
  const html = buildImprovedCvHtml(entry);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  try {
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        setTimeout(() => {
          try {
            win.print();
          } catch {
            /* ignore */
          }
        }, 300);
      };
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
