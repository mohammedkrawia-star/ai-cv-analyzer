/**
 * Deterministic fallback CV analyzer.
 * Used when the AI API is unavailable, keeping the app fully testable.
 * Analyzes the CV text against the job description using keyword overlap,
 * section structure, and length heuristics. Never invents qualifications.
 */
import type { AnalysisInput, CvAnalysisResult } from "./types";
import { detectSections } from "./cv-parser";

// Curated skill lexicon — skills only get reported if they actually appear in the text.
const SKILL_TERMS: string[] = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang", "rust",
  "swift", "kotlin", "ruby", "php", "scala", "sql", "nosql", "react", "reactjs",
  "react.js", "angular", "vue", "next.js", "nextjs", "node", "nodejs", "node.js",
  "express", "django", "flask", "spring", "html", "css", "tailwind", "sass",
  "graphql", "rest", "api", "apis", "microservices", "docker", "kubernetes", "k8s",
  "aws", "azure", "gcp", "google cloud", "firebase", "redis", "postgres", "postgresql",
  "mysql", "mongodb", "elasticsearch", "kafka", "rabbitmq", "git", "github", "gitlab",
  "ci/cd", "cicd", "jenkins", "terraform", "ansible", "linux", "unix", "bash",
  "machine learning", "deep learning", "tensorflow", "pytorch", "data analysis",
  "data science", "power bi", "tableau", "excel", "sap", "salesforce",
  "agile", "scrum", "kanban", "jira", "figma", "ui/ux", "ux design", "ui design",
  "photoshop", "illustrator", "seo", "sem", "marketing", "content strategy",
  "copywriting", "social media", "project management", "product management",
  "leadership", "stakeholder management", "communication", "negotiation",
  "customer service", "account management", "budgeting", "financial analysis",
  "accounting", "networking", "cisco", "linux", "windows server", "security",
  "cybersecurity", "penetration testing", "compliance", "hr", "recruitment",
  "talent acquisition", "teaching", "training", "research", "statistics",
  "r language", "matlab", "auto cad", "cad", "solidworks", "engineering",
  "sales", "b2b", "crm", "hubspot", "zendesk", "communication skills",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#./ -]/g, " ");
}

function countOccurrences(hay: string, needle: string): number {
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (hay.match(re) || []).length;
}

/** Skills actually present in a given text (never invented). */
function findSkills(text: string): string[] {
  const norm = normalize(text);
  const found = new Set<string>();
  for (const skill of SKILL_TERMS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
    if (re.test(norm)) found.add(skill);
  }
  return Array.from(found).sort((a, b) =>
    countOccurrences(text, b) - countOccurrences(text, a),
  );
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.round(Math.min(max, Math.max(min, v)));
}

/** Important multi-word and single-word phrases from the job description. */
function extractJobKeywords(jd: string): string[] {
  const norm = normalize(jd);
  const words = norm.split(/\s+/).filter((w) => w.length > 2);
  const stop = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was",
    "one", "our", "out", "use", "how", "its", "has", "had", "him", "his", "own",
    "any", "with", "that", "this", "from", "they", "been", "have", "will", "each",
    "make", "like", "long", "look", "many", "some", "them", "then", "very", "when",
    "come", "made", "find", "way", "may", "day", "get", "who", "she", "into", "just",
    "over", "such", "take", "than", "work", "year", "part", "team", "role", "must",
    "also", "more", "your", "about", "which", "their", "other", "would", "there",
    "what", "where", "being", "these", "those", "well", "good", "great", "strong",
    "experience", "experiences", "required", "requirements", "responsibilities",
    "ability", "abilities", "include", "including", "plus", "preferred",
    "candidate", "candidates", "position", "job", "company", "working", "skills",
    "skill", "knowledge", "qualifications", "qualification", "description",
  ]);
  const counts = new Map<string, number>();
  for (const w of words) {
    if (!stop.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w]) => w);
  return ranked;
}

/** Detect a professional summary paragraph (first substantial paragraph). */
function detectSummary(cvText: string): string {
  const paragraphs = cvText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 60 && p.split(/\s+/).length > 8);
  return paragraphs.length > 0 ? paragraphs[0] : "";
}

function generateRecommendations(
  cvText: string,
  jd: string,
  jobTitle: string,
  missingKeywords: string[],
  summary: string,
): string[] {
  const recs: string[] = [];
  const normCv = normalize(cvText);
  const normJd = normalize(jd);
  const sections = detectSections(cvText);

  if (missingKeywords.length > 0) {
    recs.push(
      `Add relevant keywords from the job posting where truthful — candidates found: ${missingKeywords.slice(0, 5).join(", ")}.`,
    );
  }
  if (!summary || summary.length < 80) {
    recs.push(
      "Add or strengthen a professional summary that highlights your most relevant experience for this role.",
    );
  } else if (normCv.split(/\s+/).length < 200) {
    recs.push("Your CV appears short — expand your experience descriptions with specific duties and outcomes.");
  }
  if (/\b(metrix|metric|achieved|increased|reduced|improved|led|managed|delivered)\b/i.test(cvText) === false) {
    recs.push("Add measurable achievements (e.g., 'increased sales by 20%' or 'led a team of 5') to make your experience concrete.");
  }
  if (!sections.includes("skills")) {
    recs.push("Add a dedicated Skills section organized by relevance to this job.");
  }
  if (!sections.includes("education")) {
    recs.push("Include your education and relevant certifications.");
  }
  if (normJd.includes("agile") && !normCv.includes("agile")) {
    recs.push("Mention your agile/scrum experience if you have it — the posting emphasizes agile delivery.");
  }
  if (normJd.includes("leadership") || normJd.includes("lead")) {
    if (!normCv.includes("lead") && !normCv.includes("manage")) {
      recs.push("Highlight leadership or collaboration experience, as the role emphasizes leading initiatives.");
    }
  }
  if (recs.length < 3) {
    recs.push("Tailor your CV title and top skills to mirror the language used in this job posting.");
    recs.push("Keep your CV to one or two pages with clear section headings and consistent formatting.");
  }
  return recs.slice(0, 5);
}

function generateJobMatchExplanation(
  score: number,
  missingKeywords: string[],
  matchingSkills: string[],
): string {
  if (score >= 80) {
    return `Your CV aligns well with this position. You already demonstrate ${matchingSkills.length} of the required skills, and the remaining gaps are minor.`;
  }
  if (score >= 60) {
    return `Your CV partially matches this position. You show some of the required skills, but several important keywords from the posting are not yet reflected in your CV.`;
  }
  return `Your CV currently matches this position only partially. The job posting emphasizes skills and keywords that do not yet appear in your CV, so targeted improvements would help.`;
}

function generateImprovedSummary(
  original: string,
  cvText: string,
  jobTitle: string,
  matchingSkills: string[],
): string {
  const topSkills = matchingSkills.slice(0, 4).join(", ");
  const base = original
    ? original
    : `Experienced professional with a background relevant to ${jobTitle}.`;
  const skillsClause = topSkills
    ? ` with experience in ${topSkills}`
    : "";
  // Truthful rewrite: keep the original claims, tighten wording toward the target role.
  return `${base} Seeking to contribute to a ${jobTitle} role${skillsClause}. Focused on delivering measurable results and collaborating effectively with teams.`;
}

export function analyzeCvFallback(input: AnalysisInput): CvAnalysisResult {
  const { cvText, jobDescription, jobTitle } = input;
  const normCv = normalize(cvText);
  const normJd = normalize(jobDescription);

  const cvSkills = findSkills(cvText);
  const jdSkills = findSkills(jobDescription);
  const matchingSkills = jdSkills.filter((s) =>
    cvSkills.some((c) => c === s || s.includes(c) || c.includes(s)),
  );
  const missingSkills = jdSkills.filter(
    (s) => !matchingSkills.includes(s) && s.length > 2,
  );

  const jdKeywords = extractJobKeywords(jobDescription);
  const missingKeywords = jdKeywords.filter((w) => !normCv.includes(w));
  const foundKeywordCount = jdKeywords.filter((w) => normCv.includes(w)).length;

  const sections = detectSections(cvText);
  const hasSummary = sections.includes("summary");
  const wordCount = cvText.split(/\s+/).filter(Boolean).length;
  const summary = detectSummary(cvText);

  // Scores: keyword overlap drives most subscores; structure and length drive formatting.
  const keywordCoverage =
    jdKeywords.length > 0 ? foundKeywordCount / jdKeywords.length : 0;
  const skillsCoverage =
    jdSkills.length > 0 ? matchingSkills.length / jdSkills.length : 0;
  const skillsScore = clamp(skillsCoverage * 100 + (cvSkills.length > 3 ? 15 : 0));
  const keywordsScore = clamp(keywordCoverage * 100);
  const relevanceScore = clamp(keywordCoverage * 70 + skillsCoverage * 30);
  const experienceScore = clamp(
    relevanceScore * 0.6 + (wordCount >= 300 ? 40 : wordCount / 300 * 40),
  );
  const formattingScore = clamp(
    (hasSummary ? 30 : 5) +
      (sections.includes("experience") ? 25 : 0) +
      (sections.includes("education") ? 20 : 0) +
      (sections.includes("skills") ? 25 : 0) +
      (wordCount >= 200 && wordCount <= 1200 ? 20 : 8),
  );
  const atsScore = clamp(
    (formattingScore * 0.45 + keywordsScore * 0.35 + skillsScore * 0.2),
  );
  const overallScore = clamp(
    atsScore * 0.25 +
      skillsScore * 0.2 +
      experienceScore * 0.15 +
      keywordsScore * 0.15 +
      formattingScore * 0.1 +
      relevanceScore * 0.15,
  );
  const jobMatchScore = overallScore;

  const strengths: string[] = [];
  if (cvSkills.length >= 3) strengths.push(`Technical skill set detected: ${cvSkills.slice(0, 3).join(", ")}.`);
  if (sections.includes("experience")) strengths.push("Your CV includes a work experience section.");
  if (sections.includes("education")) strengths.push("Education background is present in your CV.");
  if (skillsCoverage > 0.4) strengths.push("You already demonstrate several of the skills this role requires.");
  if (wordCount >= 300) strengths.push("Your CV has sufficient detail and length.");
  if (strengths.length === 0) strengths.push("Your CV contains a foundation you can build on with targeted improvements.");
  const weaknesses: string[] = [];
  if (!hasSummary) weaknesses.push("Your CV appears to be missing a professional summary.");
  if (missingKeywords.length > 0) weaknesses.push(`Important job keywords are missing: ${missingKeywords.slice(0, 3).join(", ")}.`);
  if (missingSkills.length > 0) weaknesses.push(`The posting emphasizes skills not yet shown in your CV: ${missingSkills.slice(0, 3).join(", ")}.`);
  if (wordCount < 200) weaknesses.push("Your CV seems too short to showcase your experience fully.");
  if (strengths.includes("Your CV includes a work experience section.") === false) weaknesses.push("Add a work experience section with concrete responsibilities.");
  if (weaknesses.length === 0) weaknesses.push("Consider adding measurable achievements to strengthen your experience descriptions.");

  const recommendations = generateRecommendations(cvText, jobDescription, jobTitle, missingKeywords, summary);

  const originalSummary = summary;
  const improvedSummary = generateImprovedSummary(summary, cvText, jobTitle, matchingSkills);

  return {
    overallScore,
    atsScore,
    skillsScore,
    experienceScore,
    keywordsScore,
    formattingScore,
    relevanceScore,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    matchingSkills,
    missingSkills: missingSkills.slice(0, 10),
    missingKeywords: missingKeywords.slice(0, 10),
    recommendations,
    jobMatchScore,
    jobMatchExplanation: generateJobMatchExplanation(jobMatchScore, missingKeywords, matchingSkills),
    originalSummary,
    improvedSummary,
  };
}

export { findSkills, extractJobKeywords, detectSummary, countOccurrences };
