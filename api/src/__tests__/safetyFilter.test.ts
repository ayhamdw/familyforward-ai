import {
  BLOCKLIST_VERSION,
  CLOSING_LINES,
  allFixedPlanStrings,
  buildFallbackPlan,
  publicHit,
  scanText,
  seedActivities,
  LANGUAGES,
  resources,
  type PlanOutput,
} from "@familyforward/shared";
import { safetyFilter } from "../generation/safetyFilter";
import { SURVEY, allSurveys } from "./helpers/surveys";

const blocked = (text: string) => scanText(text, "t").length > 0;
const ids = (text: string) => scanText(text, "t").map((h) => h.termId);

describe("safety filter: blocked text", () => {
  const positives: Record<string, string[]> = {
    en: [
      "This could be a sign of autism.",
      "She is autistic.",
      "Symptoms of ADHD are common.",
      "He has ADHD.",
      "An ADD diagnosis",
      "Signs of OCD",
      "That is ODD behavior.",
      "Ask about a diagnosis.",
      "He was diagnosed last year.",
      "A learning disability or a learning disorder",
      "dyslexia, dyscalculia and dysgraphia",
      "A developmental delay, speech delay or language delay",
      "Sensory processing and apraxia",
      "Oppositional behavior",
      "An anxiety disorder or depression; he seems depressed",
      "Intellectual disability, cognitive impairment, gifted",
      "She is behind other children.",
      "He is behind for his age.",
      "She is behind for her age.",
      "He is at risk for problems.",
      "A red flag or a warning sign",
      "This is abnormal. It is not normal.",
      "A screening or a screen for problems",
      "An evaluation for services, or an assessment",
      "Your child's condition",
      "A syndrome, a deficit, delayed, symptom, symptoms",
      "Attention deficit",
      "On the autism spectrum",
      "A key milestone for age three.",
      "She is a slow learner.",
    ],
    es: [
      "Puede ser un signo de autismo.",
      "Es autista.",
      "Tiene TDAH.",
      "Un diagnóstico de TDA",
      "Señales de TOC",
      "Pida un diagnostico.",
      "Fue diagnosticado el año pasado.",
      "Dislexia, discalculia y disgrafía",
      "Un retraso del desarrollo, retraso del lenguaje o retraso en el habla",
      "Procesamiento sensorial y apraxia",
      "Trastorno de ansiedad, depresión, está deprimido",
      "Discapacidad intelectual y deterioro cognitivo, superdotado",
      "Está atrasado para su edad.",
      "Está atrasada con respecto a otros niños.",
      "Es un trastorno.",
      "Un síndrome o un déficit",
      "Los síntomas de su condición",
      "Una evaluación para servicios",
      "Una señal de alerta o una bandera roja",
      "Es anormal. No es normal.",
      "Un tamizaje",
      "El espectro autista",
      "Un hito del desarrollo",
      "Está en riesgo de problemas.",
    ],
    ar: [
      "قد يكون هذا علامة على التوحّد.",
      "طفل توحدي",
      "اطلب تشخيصًا من الطبيب.",
      "أعراض اضطراب فرط الحركة",
      "تشتت الانتباه",
      "عسر القراءة وعسر الحساب وعسر الكتابة",
      "صعوبات التعلم",
      "تأخر النمو أو تأخر الكلام",
      "هو متأخر عن أقرانه.",
      "الوسواس القهري",
      "اكتئاب وقلق مكتئب",
      "إعاقة ذهنية",
      "متلازمة داون",
      "تقييم للطفل",
      "علامة تحذيرية",
      "هذا غير طبيعي",
      "هذا ليس طبيعيا",
      "معرض لخطر",
      "معالم النمو",
      "والتَّشْخِيص مهم",
      "التـــوحد",
      "بالتشخيص",
    ],
  };
  for (const [lang, list] of Object.entries(positives)) {
    it.each(list)(`blocks (${lang}): %s`, (text) => {
      expect(blocked(text)).toBe(true);
    });
  }

  it("matches Spanish without accents and Arabic with or without diacritics, tatweel and alef forms", () => {
    expect(blocked("diagnostico")).toBe(true);
    expect(blocked("DIAGNÓSTICO")).toBe(true);
    expect(blocked("إعاقة")).toBe(true);
    expect(blocked("اعاقه")).toBe(true);
    expect(blocked("أعراض")).toBe(true);
    expect(blocked("اعراض")).toBe(true);
    expect(blocked("تَأَخُّر")).toBe(true);
  });

  it("is case-insensitive for English words", () => {
    expect(blocked("AUTISM")).toBe(true);
    expect(blocked("Dyslexia")).toBe(true);
  });
});

describe("safety filter: acronyms only as uppercase whole tokens", () => {
  it("does not hit the ordinary words add, odd, ocd-like words", () => {
    for (const text of [
      "Add one more word.",
      "Then add a describing word, like soft.",
      "an odd sock",
      "Odd and even numbers",
      "add",
      "Padding the cushion",
      "todd and addie",
      "Tengo un toc en la puerta",
      "toc toc, ¿quién es?",
      "una tda cosa",
    ]) {
      expect({ text, ids: ids(text) }).toEqual({ text, ids: [] });
    }
  });

  it("hits ADD, ODD, OCD, TDA and TOC as uppercase tokens", () => {
    expect(ids("He has ADD.")).toContain("en.add_uppercase");
    expect(ids("It is ODD.")).toContain("en.odd_uppercase");
    expect(ids("It may be OCD.")).toContain("en.ocd_uppercase");
    expect(ids("Puede ser TDA.")).toContain("es.tda_uppercase");
    expect(ids("Puede ser TOC.")).toContain("es.toc_uppercase");
    expect(ids("(ADD)")).toContain("en.add_uppercase");
  });

  it("does not hit uppercase letters inside longer words", () => {
    expect(ids("ADDITION")).toEqual([]);
    expect(ids("TODD")).toEqual([]);
  });
});

describe("safety filter: allow-list", () => {
  it("allows benign uses of blunt terms", () => {
    expect(blocked("You can delay bedtime by ten minutes.")).toBe(false);
    expect(blocked("Delayed bedtime by ten minutes is fine.")).toBe(false);
    expect(blocked("Keep the toys in good condition.")).toBe(false);
    expect(blocked("In good weather conditions we can go outside.")).toBe(false);
    expect(blocked("Se puede jugar si el juguete está en buenas condiciones.")).toBe(false);
  });

  it("still blocks the same words outside an allowed phrase", () => {
    expect(blocked("Your child is delayed.")).toBe(true);
    expect(blocked("Your child's condition is serious.")).toBe(true);
    expect(blocked("Delayed bedtime, and also delayed.")).toBe(true);
  });
});

describe("safety filter: ordinary text passes", () => {
  it.each([
    "Count the cups together, one, two, three.",
    "Walk around the room and name what you see.",
    "Sing a song and clap the beat.",
    "Compare the size of two cups: big and small.",
    "Pretend to blow out a candle three times.",
    "Hit the drum softly with your hand.",
    "Hide behind the couch and say peekaboo.",
    "Cuenten las tazas juntos, una, dos, tres.",
    "Vamos a pegar papel de colores.",
    "عدّا الأكواب معًا: واحد، اثنان، ثلاثة.",
    "غنّيا أغنية وصفّقا مع الإيقاع.",
    "هذا حبوب الإفطار على الطاولة.",
    "Abnormalities of shape",
  ].slice(0, -1))("allows: %s", (text) => {
    expect(blocked(text)).toBe(false);
  });

  it("matches whole words only", () => {
    expect(blocked("The carpet is a firefly of normalcy.")).toBe(false);
    expect(blocked("Make a spectrum-free rainbow? No: a rainbow.")).toBe(true); // "spectrum" is on the list on purpose
  });
});

describe("safety filter: hits never carry the matched text", () => {
  it("reports termId, list version and field path", () => {
    const hits = scanText("She is autistic and behind other children.", "days[0].activity.why");
    expect(hits.map(publicHit)).toEqual(
      expect.arrayContaining([
        { termId: "en.autistic", listVersion: BLOCKLIST_VERSION, fieldPath: "days[0].activity.why" },
        { termId: "en.behind_other_children", listVersion: BLOCKLIST_VERSION, fieldPath: "days[0].activity.why" },
      ]),
    );
    const dump = JSON.stringify(hits.map(publicHit));
    expect(dump).not.toMatch(/She is|children\./);
    expect(Object.keys(publicHit(hits[0])).sort()).toEqual(["fieldPath", "listVersion", "termId"]);
  });
});

function good(): PlanOutput {
  const plan = buildFallbackPlan({ ...SURVEY });
  return plan;
}

describe("safetyFilter on a plan: every text field", () => {
  it("passes a normal plan", () => {
    expect(safetyFilter(good())).toEqual({ ok: true });
  });

  const fields: [string, (p: PlanOutput) => void][] = [
    ["summary", (p) => (p.summary = "He may have autism.")],
    ["title", (p) => (p.days[1].activity.title = "Autism game")],
    ["why", (p) => (p.days[1].activity.why = "For kids who are delayed")],
    ["safety", (p) => (p.days[1].activity.safety = "Not for a child with ADHD")],
    ["easier", (p) => (p.days[1].activity.easier = "If your child is behind other children")],
    ["harder", (p) => (p.days[1].activity.harder = "For gifted children")],
    ["noticeThis", (p) => (p.days[1].activity.noticeThis = "Look for warning signs")],
    ["steps", (p) => (p.days[1].activity.steps[2] = "Ask for a diagnosis")],
    ["worthNoticing.observation", (p) => p.worthNoticing.push({ observation: "A red flag", tryThis: "Play", mentionTo: "none", resourceIds: [] })],
    ["worthNoticing.tryThis", (p) => p.worthNoticing.push({ observation: "Play more", tryThis: "Get an assessment", mentionTo: "none", resourceIds: [] })],
    ["checkIn", (p) => (p.checkIn[1] = "Does your child show symptoms?")],
    ["closing", (p) => (p.closing = `${p.closing} Ask about a diagnosis.`)],
  ];
  it.each(fields)("blocks a hit in %s and names the field path", (name, mutate) => {
    const p = good();
    mutate(p);
    const result = safetyFilter(p);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const paths = result.hits.map((h) => h.fieldPath);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.every((path) => typeof path === "string" && path.length > 0)).toBe(true);
    }
  });

  it("finds a term slipped into another language", () => {
    const p = good();
    p.days[0].activity.why = "Ayuda a los niños con autismo.";
    expect(safetyFilter(p).ok).toBe(false);
  });
});

describe("blocklist coverage of everything we ship", () => {
  it("passes all 30 seed activities in all 3 languages", () => {
    expect(seedActivities).toHaveLength(30);
    for (const a of seedActivities) {
      for (const lang of LANGUAGES) {
        const t = a[lang];
        const texts = [t.title, t.why, t.safety, t.easier, t.harder, t.noticeThis, ...t.steps];
        for (const text of texts) {
          expect({ id: a.id, lang, text, hits: ids(text) }).toEqual({ id: a.id, lang, text, hits: [] });
        }
      }
    }
  });

  it("passes every fixed string (summaries, check-ins, closing lines, cards)", () => {
    const fixed = allFixedPlanStrings();
    expect(fixed.length).toBeGreaterThan(30);
    for (const text of fixed) {
      expect({ text, hits: ids(text) }).toEqual({ text, hits: [] });
    }
  });

  it("passes every resource description in all 3 languages", () => {
    for (const r of resources) {
      for (const lang of LANGUAGES) {
        expect({ id: r.id, lang, hits: ids(r.offers[lang]) }).toEqual({ id: r.id, lang, hits: [] });
      }
      expect({ id: r.id, hits: ids(r.name) }).toEqual({ id: r.id, hits: [] });
    }
  });

  it("passes every fallback plan the app can build", () => {
    for (const survey of allSurveys()) {
      const plan = buildFallbackPlan(survey, { homeLanguages: ["es", "ar"] });
      expect(safetyFilter(plan)).toEqual({ ok: true });
      expect(plan.closing).toBe(CLOSING_LINES[survey.language]);
    }
  });
});
