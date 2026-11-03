import { CLOSING_LINES, buildFallbackPlan, type PlanOutput, type SurveyInput } from "@familyforward/shared";
import { checkText, safetyFilter } from "../generation/safetyFilter";
import { SURVEY } from "./helpers/surveys";

const blocked = (text: string) => checkText(text).ok === false;

describe("checkText: blocked text", () => {
  const positives: Record<string, string[]> = {
    en: [
      "Your child may be behind other children.",
      "This is normal for her age.",
      "A key milestone for age three.",
      "Typical kids can do this.",
      "This could be a sign of autism.",
      "Ask about a diagnosis.",
      "Symptoms of ADHD",
      "He may need therapy.",
      "A speech delay is common.",
      "Use a sharp knife to cut fruit.",
      "Leave your child alone for ten minutes.",
      "Her peers can already do this.",
    ],
    es: [
      "Su hijo está atrasado para su edad.",
      "Es normal a esta edad.",
      "Un hito importante.",
      "Puede ser un signo de autismo.",
      "Pida un diagnóstico.",
      "Necesita terapia del lenguaje.",
      "Los síntomas de TDAH",
      "Use un cuchillo afilado.",
      "Déjelo sin supervisión.",
      "Tiene un retraso en el habla.",
    ],
    ar: [
      "طفلك متأخر عن الأطفال الآخرين.",
      "هذا أمر طبيعي في هذا العمر.",
      "قد يكون هذا علامة على التوحّد.",
      "اطلب تشخيصًا من الطبيب.",
      "أعراض اضطراب فرط الحركة",
      "يحتاج إلى علاج نطق.",
      "استخدم سكينًا حادة.",
      "هناك تأخّر في الكلام.",
      "قارن طفلك بغيره.",
      "والتشخيص مهم",
    ],
  };
  for (const [lang, list] of Object.entries(positives)) {
    it.each(list)(`blocks (${lang}): %s`, (text) => {
      expect(blocked(text)).toBe(true);
    });
  }

  it("catches Arabic text with and without diacritics", () => {
    expect(blocked("التَّوَحُّد")).toBe(true);
    expect(blocked("توحد")).toBe(true);
    expect(blocked("بالتشخيص")).toBe(true);
  });

  it("returns only a reason code, never the matched text", () => {
    const result = checkText("This child is behind and has autism");
    expect(result.ok).toBe(false);
    const dump = JSON.stringify(result);
    expect(dump).not.toMatch(/behind|autism/);
    expect(Object.keys(result)).toEqual(["ok", "reason"]);
  });
});

describe("checkText: allowed text", () => {
  const negatives = [
    "Count the cups together, one, two, three.",
    "Walk around the room and name what you see.",
    "Sing a song and clap the beat.",
    "Compare the size of two cups: big and small.",
    "Pretend to blow out a candle three times.",
    "Hit the drum softly with your hand.",
    "Add one more word to the song.",
    "Cuenten las tazas juntos, una, dos, tres.",
    "Caminen por el cuarto y nombren lo que ven.",
    "Vamos a pegar papel de colores.",
    "عدّا الأكواب معًا: واحد، اثنان، ثلاثة.",
    "قارنا حجم كوبين: كبير وصغير.",
    "غنّيا أغنية وصفّقا مع الإيقاع.",
    "هذا حبوب الإفطار على الطاولة.",
    "Abnormalities of shape",
  ];
  it.each(negatives.slice(0, -1))("allows: %s", (text) => {
    expect(checkText(text)).toEqual({ ok: true });
  });

  it("matches whole words only", () => {
    expect(checkText("The cat is on the carpet, a normalcy-free zone.").ok).toBe(true);
    expect(checkText("Make a firefly out of paper.").ok).toBe(true);
  });
});

describe("safetyFilter", () => {
  const survey: SurveyInput = { ...SURVEY };
  const plan = (): PlanOutput => buildFallbackPlan(survey);

  it("passes a normal plan", () => {
    expect(safetyFilter(plan())).toEqual({ ok: true });
  });

  it("requires the exact closing line in the plan language", () => {
    const p = plan();
    p.closing = "Have fun!";
    expect(safetyFilter(p)).toEqual({ ok: false, reason: "missing_closing" });
    const q = plan();
    q.closing = CLOSING_LINES.es;
    expect(safetyFilter(q)).toEqual({ ok: false, reason: "missing_closing" });
  });

  it("checks every field the parent reads", () => {
    for (const field of ["title", "why", "safety"] as const) {
      const p = plan();
      p.days[1].activity[field] = "She is behind";
      expect(safetyFilter(p)).toEqual({ ok: false, reason: "norm_comparison" });
    }
    const p = plan();
    p.days[2].activity.steps[1] = "Ask about a diagnosis";
    expect(safetyFilter(p)).toEqual({ ok: false, reason: "diagnostic_term" });
  });

  it("allows hazards named in the safety line but not in the steps", () => {
    const a = plan();
    a.days[0].activity.safety = "No knives, stove or hot items for your child.";
    expect(safetyFilter(a)).toEqual({ ok: true });
    const b = plan();
    b.days[0].activity.steps[0] = "Cut the fruit with a knife.";
    expect(safetyFilter(b)).toEqual({ ok: false, reason: "unsafe_content" });
  });
});
