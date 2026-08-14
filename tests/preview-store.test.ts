import { describe, expect, it } from "vitest";

import {
  buildImprovedCvHtml,
  isCvHeading,
  readEditedCv,
  storeEditedCv,
  updateEditedCv,
} from "../lib/analysis/improved-cv";

describe("isCvHeading", () => {
  it("recognises ATS-style section headings", () => {
    expect(isCvHeading("PROFESSIONAL SUMMARY")).toBe(true);
    expect(isCvHeading("  skills  ")).toBe(true);
    expect(isCvHeading("Experience")).toBe(true);
    expect(isCvHeading("EDUCATION")).toBe(true);
    expect(isCvHeading("CERTIFICATIONS")).toBe(true);
    expect(isCvHeading("LANGUAGES")).toBe(true);
  });

  it("rejects regular lines and non-heading text", () => {
    expect(isCvHeading("Professional Summary: software engineer with 5 years experience")).toBe(false);
    expect(isCvHeading("EXPERIENCE at Google as engineer")).toBe(false);
    expect(isCvHeading("")).toBe(false);
    expect(isCvHeading("SKILLS MATCH")).toBe(false);
  });
});

describe("improved CV in-memory store", () => {
  it("stores and reads the generated CV text", () => {
    const cvText = "PROFESSIONAL SUMMARY\nSoftware engineer\n\nSKILLS\nReact, TypeScript";
    const id = storeEditedCv(cvText);
    expect(readEditedCv(id)).toBe(cvText);
  });

  it("applies edits and reads the updated text", () => {
    const id = storeEditedCv("original text");
    updateEditedCv(id, "edited text");
    expect(readEditedCv(id)).toBe("edited text");
  });

  it("returns undefined for unknown ids", () => {
    expect(readEditedCv(999999)).toBeUndefined();
  });
});

describe("buildImprovedCvHtml", () => {
  it("renders section headings as styled h2 blocks and escapes html", () => {
    const html = buildImprovedCvHtml({
      jobTitle: "Frontend <Dev>",
      cvText: "PROFESSIONAL SUMMARY\nEngineer\n\nSKILLS\nReact",
    });
    expect(html).toContain("Frontend &lt;Dev&gt;");
    expect(html).toContain('<div class="h2">PROFESSIONAL SUMMARY</div>');
    expect(html).toContain("<p>Engineer</p>");
    expect(html).toContain("<p>React</p>");
  });
});
