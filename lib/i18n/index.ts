/**
 * Lightweight i18n: EN/AR strings + RTL helpers.
 * Language preference persisted in AsyncStorage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { useSyncExternalStore } from "react";

export type Language = "en" | "ar";

const KEY = "aicv.lang";

type Strings = Record<string, string>;

export const en: Strings = {
  appName: "AI CV Analyzer",
  tabHome: "Home",
  tabHistory: "History",
  tabSettings: "Settings",
  // Landing
  heroTitle: "Make Your CV Job-Ready with AI",
  heroSubtitle:
    "Upload your CV, compare it with a job description, and discover exactly how to improve your chances of getting shortlisted.",
  ctaAnalyze: "Analyze My CV",
  featureAts: "ATS Score",
  featureAtsDesc: "See how well your CV passes automated screening systems.",
  featureSkills: "Skills Match",
  featureSkillsDesc: "Compare your skills against what the job requires.",
  featureKeywords: "Missing Keywords",
  featureKeywordsDesc: "Find the important keywords the job posting uses that you don't.",
  featureAi: "AI Recommendations",
  featureAiDesc: "Get practical, truthful advice on improving your CV.",
  keyFeatures: "Key Features",
  stepsTitle: "How It Works",
  step1: "Upload your CV",
  step1Desc: "Pick your CV as a PDF file.",
  step2: "Add the job description",
  step2Desc: "Paste the description of the role you want.",
  step3: "Get your AI analysis",
  step3Desc: "Receive scores, strengths, gaps, and recommendations.",
  // Upload
  uploadTitle: "Upload Your CV",
  uploadSubtitle: "Pick a PDF file containing your CV.",
  dropZone: "Tap to select PDF",
  dropZoneHint: "Only PDF files are supported",
  removeFile: "Remove",
  replaceFile: "Replace",
  continue: "Continue",
  invalidPdf: "Invalid file — please choose a PDF document.",
  extractionError: "Could not extract text from this PDF. Please try another file.",
  extracting: "Extracting CV text…",
  tooLarge: "File is too large. Please use a CV under 10 MB.",
  // Job description
  jobTitle: "Job Description",
  targetTitle: "Target Job Title",
  targetTitleHint: "e.g. Senior Software Engineer",
  pasteJd: "Paste Job Description Here",
  uploadCvFirst: "Please upload your CV first.",
  jdRequired: "Please paste the job description (at least 20 characters).",
  analyzeCta: "Analyze My CV",
  analyzing: "Analyzing your CV with AI…",
  // Results
  resultsTitle: "Your Analysis",
  cvScore: "CV Score",
  scoreExplanation: "Score Explanation",
  strengths: "Strengths",
  weaknesses: "Weaknesses",
  missingKeywords: "Missing Keywords",
  copyKeywords: "Copy Keywords",
  copied: "Copied to clipboard",
  jobMatch: "Job Match",
  categoryScores: "Category Scores",
  skillsComparison: "Skills Comparison",
  skillsFound: "Skills Found in CV",
  skillsRequired: "Skills Required by Job",
  matchingSkills: "Matching",
  missingSkills: "Missing",
  noSkillsFound: "No skills detected in your CV yet.",
  noJobSkills: "No specific skills detected in the job posting.",
  howToImprove: "How to Improve Your CV",
  improveSummary: "Improve My Professional Summary",
  originalSummary: "Original Summary",
  improvedSummary: "AI Improved Summary",
  noSummaryFound: "No professional summary was found in your CV. The AI generated a neutral starter summary based on your target role — replace it with your real background.",
  copySummary: "Copy Improved Summary",
  useThisVersion: "Use This Version",
  summaryReplaced: "Summary replaced in your analysis.",
  beforeAfter: "Before / After",
  before: "BEFORE",
  after: "AFTER",
  // Export
  exportReport: "Export Report",
  downloadPdf: "Download Analysis PDF",
  copyResults: "Copy Results",
  analyzeAnother: "Analyze Another CV",
  pdfReady: "PDF report is ready",
  pdfBlockedFallback: "Pop-up blocked — the full report was copied to your clipboard instead",
  shareResult: "Share Result",
  shareTitle: "AI CV Analysis — {jobTitle}",
  shareUnavailable: "Sharing is not available on this device — the results were copied to your clipboard instead",
  // Improved CV
  generateImprovedCv: "Generate Improved CV",
  downloadImprovedCvPdf: "Download Improved CV (PDF)",
  copyImprovedCv: "Copy Improved CV",
  improvedCvReady: "Improved CV is ready — download or copy it",
  improvedCvError: "Could not generate via AI — a local ATS-friendly version was used instead",
  improvedCvNote: "This version applies the improvements while keeping your real experience truthful. Review it before sending to employers.",
  improvedCvDownload: "Your improved CV",
  improvedCvSection: "Improved CV",
  // CV Preview & Edit
  previewAndEditCv: "Preview & Edit CV",
  editCvTitle: "Your Improved CV",
  editCvDesc: "Review and edit the CV below. Changes are kept until you download the PDF.",
  editCvText: "Edit CV Text",
  saveChanges: "Save Changes",
  editsSaved: "Changes saved",
  previewUnavailable: "No improved CV to preview yet — generate one from the results screen first.",
  improvedCvDescription: "Your CV rewritten in an ATS-friendly format with the missing keywords and recommendations applied.",
  comparisonPairNote: "Comparing newest analysis against its previous analysis.",
  // Comparison
  compareTitle: "Progress Comparison",
  compareSubtitle: "Track how your CV improved between analyses.",
  compareWithPrevious: "Compare with a Previous Analysis",
  compareWithThis: "Compare with This",
  compareDisabled: "You need at least two analyses to compare progress.",
  scoreImproved: "Improved", scoreDeclined: "Declined", scoreUnchanged: "Unchanged",
  keywordsGained: "Keywords You No Longer Need",
  keywordsGainedDesc: "Keywords that were missing before but are now covered.",
  keywordsNewMissing: "Newly Missing Keywords",
  keywordsNewMissingDesc: "Keywords this new job posting requires.",
  keywordsStillMissing: "Still Missing",
  keywordsStillMissingDesc: "Keywords both postings require that your CV still lacks.",
  noGained: "No keywords were gained yet.",
  comparisonNote: "Comparing your latest analysis with your first one.",
  deltaPoints: "points",
  // History
  historyTitle: "Analysis History",
  viewResults: "View Results",
  delete: "Delete",
  deleteConfirm: "Delete this analysis?",
  emptyHistory: "No analyses yet",
  emptyHistoryDesc: "Analyze your first CV to start building your history.",
  startAnalyzing: "Start Analyzing",
  // Settings
  language: "Language",
  theme: "Appearance",
  light: "Light",
  dark: "Dark",
  settingsTitle: "Settings",
  appVersion: "Version 1.0.0",
  // Misc
  fallbackNote: "Analysis completed with a local engine (AI service was unavailable).",
  retry: "Retry",
  errorTitle: "Something went wrong",
  back: "Back",
  close: "Close",
};

export const ar: Strings = {
  appName: "محلل السيرة الذاتية بالذكاء الاصطناعي",
  tabHome: "الرئيسية",
  tabHistory: "السجل",
  tabSettings: "الإعدادات",
  heroTitle: "اجعل سيرتك الذاتية جاهزة للوظائف بالذكاء الاصطناعي",
  heroSubtitle:
    "ارفع سيرتك الذاتية، قارنها بالوصف الوظيفي، واكتشف بالضبط كيف تحسّن فرصك في القبول للمقابلة.",
  ctaAnalyze: "حلّل سيرتي الذاتية",
  featureAts: "درجة ATS",
  featureAtsDesc: "اعرف مدى توافق سيرتك مع أنظمة الفحص الآلي.",
  featureSkills: "تطابق المهارات",
  featureSkillsDesc: "قارن مهاراتك مع ما تتطلبه الوظيفة.",
  featureKeywords: "الكلمات المفتاحية الناقصة",
  featureKeywordsDesc: "اكتشف الكلمات المهمة في الإعلان الوظيفي التي لا تظهر في سيرتك.",
  featureAi: "توصيات الذكاء الاصطناعي",
  featureAiDesc: "احصل على نصائح عملية وصادقة لتحسين سيرتك الذاتية.",
  keyFeatures: "الميزات الرئيسية",
  stepsTitle: "كيف يعمل",
  step1: "ارفع سيرتك الذاتية",
  step1Desc: "اختر ملف PDF لسيرتك الذاتية.",
  step2: "أضف الوصف الوظيفي",
  step2Desc: "الصق وصف الوظيفة التي تستهدفها.",
  step3: "احصل على التحليل",
  step3Desc: "درجات ونقاط قوة وفجوات وتوصيات من الذكاء الاصطناعي.",
  uploadTitle: "ارفع سيرتك الذاتية",
  uploadSubtitle: "اختر ملف PDF يحتوي على سيرتك الذاتية.",
  dropZone: "اضغط لاختيار PDF",
  dropZoneHint: "ملفات PDF فقط مدعومة",
  removeFile: "إزالة",
  replaceFile: "استبدال",
  continue: "متابعة",
  invalidPdf: "ملف غير صالح — يرجى اختيار ملف PDF.",
  extractionError: "تعذر استخراج النص من هذا الملف. جرّب ملفًا آخر.",
  extracting: "جارٍ استخراج نص السيرة الذاتية…",
  tooLarge: "حجم الملف كبير جدًا. استخدم ملفًا أقل من 10 ميغابايت.",
  jobTitle: "الوصف الوظيفي",
  targetTitle: "المسمى الوظيفي المستهدف",
  targetTitleHint: "مثال: مهندس برمجيات أول",
  pasteJd: "الصق الوصف الوظيفي هنا",
  uploadCvFirst: "يرجى رفع سيرتك الذاتية أولاً.",
  jdRequired: "يرجى لصق الوصف الوظيفي (20 حرفًا على الأقل).",
  analyzeCta: "حلّل سيرتي الذاتية",
  analyzing: "جارٍ تحليل سيرتك بالذكاء الاصطناعي…",
  resultsTitle: "تحليلك",
  cvScore: "درجة السيرة",
  scoreExplanation: "شرح الدرجة",
  strengths: "نقاط القوة",
  weaknesses: "نقاط الضعف",
  missingKeywords: "الكلمات المفتاحية الناقصة",
  copyKeywords: "نسخ الكلمات",
  copied: "تم النسخ إلى الحافظة",
  jobMatch: "تطابق الوظيفة",
  categoryScores: "الدرجات التفصيلية",
  skillsComparison: "مقارنة المهارات",
  skillsFound: "المهارات الموجودة في السيرة",
  skillsRequired: "المهارات المطلوبة في الوظيفة",
  matchingSkills: "متطابقة",
  missingSkills: "ناقصة",
  noSkillsFound: "لم يتم رصد مهارات في سيرتك الذاتية بعد.",
  noJobSkills: "لم يتم رصد مهارات محددة في الإعلان الوظيفي.",
  howToImprove: "كيف تحسّن سيرتك الذاتية",
  improveSummary: "حسّن ملخصك المهني",
  originalSummary: "الملخص الأصلي",
  improvedSummary: "الملخص المحسّن بالذكاء الاصطناعي",
  noSummaryFound: "لم يتم العثور على ملخص مهني في سيرتك. ولّد الذكاء الاصطناعي ملخصًا محايدًا بناءً على وظيفتك المستهدفة — استبدله بخلفيتك الحقيقية.",
  copySummary: "نسخ الملخص المحسّن",
  useThisVersion: "استخدم هذه النسخة",
  summaryReplaced: "تم استبدال الملخص في تحليلك.",
  beforeAfter: "قبل / بعد",
  before: "قبل",
  after: "بعد",
  exportReport: "تصدير التقرير",
  downloadPdf: "تنزيل تقرير PDF",
  copyResults: "نسخ النتائج",
  analyzeAnother: "حلّل سيرة أخرى",
  pdfReady: "تقرير PDF جاهز",
  pdfBlockedFallback: "تم حظر النافذة المنبثقة — تم نسخ التقرير كاملاً إلى الحافظة بدلاً من ذلك",
  shareResult: "مشاركة النتيجة",
  shareTitle: "تحليل السيرة الذاتية — {jobTitle}",
  shareUnavailable: "المشاركة غير متوفرة على هذا الجهاز — تم نسخ النتائج إلى الحافظة بدلاً من ذلك",
  // Improved CV
  generateImprovedCv: "إنشاء السيرة الذاتية المحسّنة",
  downloadImprovedCvPdf: "تنزيل السيرة المحسّنة (PDF)",
  copyImprovedCv: "نسخ السيرة المحسّنة",
  improvedCvReady: "السيرة الذاتية المحسّنة جاهزة — يمكنك تنزيلها أو نسخها",
  improvedCvError: "تعذّر الإنشاء عبر الذكاء الاصطناعي — تم استخدام نسخة محلية متوافقة مع ATS بدلاً من ذلك",
  improvedCvNote: "هذه النسخة تطبّق التحسينات مع الحفاظ على خبراتك الحقيقية دون تعديل. راجعها قبل إرسالها لأصحاب العمل.",
  improvedCvDownload: "سيرتك الذاتية المحسّنة",
  improvedCvSection: "السيرة الذاتية المحسّنة",
  // CV Preview & Edit
  previewAndEditCv: "معاينة وتعديل السيرة الذاتية",
  editCvTitle: "سيرتك الذاتية المحسّنة",
  editCvDesc: "راجع سيرتك الذاتية وأعدّل ما تشاء أدناه. تُحفظ التعديلات حتى تقوم بتنزيل ملف PDF.",
  editCvText: "تعديل نص السيرة الذاتية",
  saveChanges: "حفظ التعديلات",
  editsSaved: "تم حفظ التعديلات",
  previewUnavailable: "لا توجد سيرة ذاتية محسّنة للمعاينة بعد — أنشئها من شاشة النتائج أولاً.",
  improvedCvDescription: "سيرتك الذاتية بأداء متوافق مع أنظمة التتبع الآلي (ATS) مع الكلمات المفتاحية الناقصة والتوصيات.",
  compareTitle: "مقارنة التقدم",
  compareSubtitle: "تتبّع كيف تحسّنت سيرتك الذاتية بين التحليلات.",
  compareWithPrevious: "قارن بتحليل سابق",
  compareWithThis: "قارن بهذا",
  compareDisabled: "تحتاج إلى تحليلين على الأقل للمقارنة.",
  scoreImproved: "تحسّن",
  scoreDeclined: "تراجع",
  scoreUnchanged: "ثابت",
  keywordsGained: "كلمات أصبحت متوفرة",
  keywordsGainedDesc: "كلمات كانت ناقصة سابقًا وأصبحت مغطاة الآن.",
  keywordsNewMissing: "كلمات ناقصة جديدة",
  keywordsNewMissingDesc: "كلمات يتطلبها هذا الإعلان الوظيفي الجديد.",
  keywordsStillMissing: "ما زالت ناقصة",
  keywordsStillMissingDesc: "كلمات مطلوبة في كلا الإعلانين ولا تزال سيرتك تفتقر إليها.",
  noGained: "لم يتم اكتساب كلمات جديدة بعد.",
  comparisonNote: "مقارنة أحدث تحليل بأول تحليل.",
  deltaPoints: "نقطة",
  historyTitle: "سجل التحليلات",
  viewResults: "عرض النتائج",
  delete: "حذف",
  deleteConfirm: "حذف هذا التحليل؟",
  emptyHistory: "لا توجد تحليلات بعد",
  emptyHistoryDesc: "حلّل أول سيرة ذاتية لبدء بناء سجلك.",
  startAnalyzing: "ابدأ التحليل",
  language: "اللغة",
  theme: "المظهر",
  light: "فاتح",
  dark: "داكن",
  settingsTitle: "الإعدادات",
  appVersion: "الإصدار 1.0.0",
  fallbackNote: "اكتمل التحليل بمحرك محلي (خدمة الذكاء الاصطناعي غير متاحة).",
  retry: "إعادة المحاولة",
  errorTitle: "حدث خطأ",
  back: "رجوع",
  close: "إغلاق",
};

export const dictionary: Record<Language, Strings> = { en, ar };

// ---------- Persistence + reactive language ----------
const listeners = new Set<() => void>();

let currentLanguage: Language = "en";
let hydrated = false;

export function getLanguage(): Language {
  return currentLanguage;
}

export function isRtl(): boolean {
  return currentLanguage === "ar";
}

function applyRtl(wantRTL: boolean) {
  // Toggling RTL at runtime on Android can force an activity restart or, in
  // some builds, crash the process. Only touch the setting when it differs
  // from the current value, and swallow any native failure.
  try {
    if (I18nManager.isRTL !== wantRTL) {
      I18nManager.forceRTL(wantRTL);
    }
  } catch {
    /* Some builds fail when forceRTL is called; the app still works. */
  }
}

export async function hydrateLanguage() {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved === "en" || saved === "ar") {
      currentLanguage = saved;
      applyRtl(saved === "ar");
    }
  } catch {
    /* ignore */
  }
  hydrated = true;
  notify();
}

export async function setLanguage(lang: Language) {
  currentLanguage = lang;
  try {
    await AsyncStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
  applyRtl(lang === "ar");
  notify();
}

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, () => "en");
}

export function useT(): (key: keyof typeof en) => string {
  const lang = useLanguage();
  return (key: keyof typeof en) => dictionary[lang][key] ?? en[key] ?? key;
}
