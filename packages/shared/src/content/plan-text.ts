import type { Language } from "../index";
import type { AgeBand, FocusArea, HomeLanguage } from "./survey";
import type { WorthNoticing } from "../schemas";

/**
 * Fixed plan texts, written natively in each language (not translated from English), at a
 * sixth-grade reading level. Nothing here may name, label or compare a child: the safety filter
 * test runs over every string in this file.
 * TODO: ES and AR need native review.
 */
export const PLAN_TEXT_TODO = "TODO: needs native review. Spanish and Arabic are native-written drafts.";

/** Required last line of every plan, in the plan language. The validator checks it exactly. */
export const CLOSING_LINES: Record<Language, string> = {
  en: "These are simple ideas to enjoy together. If you have questions about your child, you can talk with your child's teacher or pediatrician.",
  es: "Estas son ideas sencillas para disfrutar juntos. Si tiene preguntas sobre su hijo o hija, puede hablar con su maestro o su pediatra.",
  ar: "هذه أفكار بسيطة للاستمتاع معًا. إذا كانت لديك أسئلة عن طفلك، يمكنك التحدث مع معلّمه أو طبيب الأطفال.",
};

/** Two sentences for the parent, used by the fallback plan. */
export const FALLBACK_SUMMARY: Record<Language, string> = {
  en: "This week's plan has short, simple activities you can do at home. Each one uses things you already have and builds on what your child enjoys.",
  es: "El plan de esta semana tiene actividades cortas y sencillas para hacer en casa. Cada una usa cosas que ya tiene y se apoya en lo que a su hijo o hija le gusta.",
  ar: "تضم خطة هذا الأسبوع أنشطة قصيرة وبسيطة يمكنكم القيام بها في البيت. كل نشاط يستخدم أشياء موجودة عندكم ويبني على ما يحبه طفلكم.",
};

/** Questions for next week. Each is answered yes / somewhat / no. */
export const FALLBACK_CHECKIN: Record<Language, readonly string[]> = {
  en: [
    "Did you and your child do most of the activities this week?",
    "Did your child enjoy the activities?",
    "Did the activities fit the time you have?",
  ],
  es: [
    "¿Hicieron usted y su hijo o hija la mayoría de las actividades esta semana?",
    "¿Disfrutó su hijo o hija de las actividades?",
    "¿Se ajustaron las actividades al tiempo que tienen?",
  ],
  ar: [
    "هل قمتما أنت وطفلك بمعظم الأنشطة هذا الأسبوع؟",
    "هل استمتع طفلك بالأنشطة؟",
    "هل ناسبت الأنشطة الوقت المتاح لديكم؟",
  ],
};

type CardText = { observation: string; tryThis: string };

const CARD_TEXT = {
  language: {
    en: {
      observation: "Your child hears more than one language at home. That is a strength.",
      tryThis: "Say the names of things in both languages while you do the activities.",
    },
    es: {
      observation: "Su hijo o hija escucha más de un idioma en casa. Eso es una fortaleza.",
      tryThis: "Diga los nombres de las cosas en los dos idiomas mientras hacen las actividades.",
    },
    ar: {
      observation: "يسمع طفلك أكثر من لغة في البيت، وهذه نقطة قوة.",
      tryThis: "قل أسماء الأشياء باللغتين أثناء القيام بالأنشطة.",
    },
  },
  time: {
    en: {
      observation: "Short on time? Five minutes together still counts.",
      tryThis: "Pick one activity and repeat it on the days you can.",
    },
    es: {
      observation: "¿Poco tiempo? Cinco minutos juntos también cuentan.",
      tryThis: "Elija una actividad y repítala los días que pueda.",
    },
    ar: {
      observation: "الوقت ضيق؟ خمس دقائق معًا تُحسب أيضًا.",
      tryThis: "اختر نشاطًا واحدًا وكرّره في الأيام التي تستطيع.",
    },
  },
  materials: {
    en: {
      observation: "You don't need to buy anything. Many of these activities use only what is at home.",
      tryThis: "Use spoons, socks, paper or a favorite toy you already have.",
    },
    es: {
      observation: "No necesita comprar nada. Muchas actividades usan solo lo que hay en casa.",
      tryThis: "Use cucharas, calcetines, papel o un juguete favorito que ya tenga.",
    },
    ar: {
      observation: "لا تحتاج إلى شراء شيء. كثير من الأنشطة تستخدم ما هو موجود في البيت فقط.",
      tryThis: "استخدم ملاعق أو جوارب أو ورقًا أو لعبة مفضلة موجودة عندك.",
    },
  },
  feelings: {
    en: {
      observation: "Talking about feelings takes practice for everyone.",
      tryThis: "Name one feeling a day, yours or your child's.",
    },
    es: {
      observation: "Hablar de los sentimientos requiere práctica para todos.",
      tryThis: "Nombre un sentimiento al día, el suyo o el de su hijo o hija.",
    },
    ar: {
      observation: "الحديث عن المشاعر يحتاج إلى تدريب عند الجميع.",
      tryThis: "سمِّ شعورًا واحدًا كل يوم، شعورك أو شعور طفلك.",
    },
  },
  talking: {
    en: {
      observation: "Talking works best in short, relaxed moments.",
      tryThis: "Chat about what you see while you walk, cook or wait.",
    },
    es: {
      observation: "Hablar funciona mejor en momentos cortos y tranquilos.",
      tryThis: "Converse sobre lo que ven al caminar, cocinar o esperar.",
    },
    ar: {
      observation: "الحديث ينجح أكثر في لحظات قصيرة وهادئة.",
      tryThis: "تحدثا عمّا ترونه أثناء المشي أو الطبخ أو الانتظار.",
    },
  },
} satisfies Record<string, Record<Language, CardText>>;

export type SignalInput = {
  language: Language;
  homeLanguages: readonly HomeLanguage[];
  minutesPerDay: number;
  materials: readonly string[];
  focusAreas: readonly FocusArea[];
};

/**
 * Up to three gentle, non-clinical notes chosen by fixed rules from what the parent told us:
 * home languages, time available, materials on hand and chosen focus. Always mentionTo "none".
 */
export function signalCards(input: SignalInput): WorthNoticing[] {
  const { language: lang } = input;
  const cards: WorthNoticing[] = [];
  const add = (key: keyof typeof CARD_TEXT, resourceIds: string[] = []): void => {
    cards.push({ ...CARD_TEXT[key][lang], mentionTo: "none", resourceIds });
  };
  if (input.homeLanguages.some((l) => l !== "en")) add("language", ["chicago-public-library"]);
  if (input.minutesPerDay <= 5) add("time");
  if (input.materials.length === 0) add("materials");
  if (input.focusAreas.includes("feelings")) add("feelings");
  if (input.focusAreas.includes("talking")) add("talking");
  return cards.slice(0, 3);
}

/** The one card for a parent whose note mentions health or development (brief 5.1). No label, no advice. */
const CONCERN_TEXT: Record<Language, CardText> = {
  en: {
    observation:
      "Thanks for telling us. We can't give advice about development, but this is worth mentioning to your child's teacher or pediatrician.",
    tryThis: "I have a question about how my child is learning. Can we talk about it?",
  },
  es: {
    observation:
      "Gracias por contárnoslo. No podemos dar consejos sobre el desarrollo, pero vale la pena comentarlo con su maestro, su maestra o su pediatra.",
    tryThis: "Tengo una pregunta sobre cómo está aprendiendo mi hijo o hija. ¿Podemos hablar de eso?",
  },
  ar: {
    observation:
      "شكرًا لأنك أخبرتنا. لا نستطيع تقديم نصائح عن النمو، لكن من المفيد أن تذكر ذلك لمعلّم طفلك أو طبيب الأطفال.",
    tryThis: "لدي سؤال عن طريقة تعلّم طفلي. هل يمكننا أن نتحدث عنه؟",
  },
};

export function concernCard(language: Language, ageBand: AgeBand, resourceIds: string[]): WorthNoticing {
  return {
    ...CONCERN_TEXT[language],
    // Under 3: the pediatrician is the usual first stop. From 3: the teacher.
    mentionTo: ageBand === "2-3" ? "pediatrician" : "teacher",
    resourceIds,
  };
}

/** Every fixed string above, for the safety-filter test. */
export function allFixedPlanStrings(): string[] {
  const out: string[] = [];
  for (const lang of ["en", "es", "ar"] as const) {
    out.push(CLOSING_LINES[lang], FALLBACK_SUMMARY[lang], ...FALLBACK_CHECKIN[lang]);
    for (const key of Object.keys(CARD_TEXT) as (keyof typeof CARD_TEXT)[]) {
      out.push(CARD_TEXT[key][lang].observation, CARD_TEXT[key][lang].tryThis);
    }
    out.push(CONCERN_TEXT[lang].observation, CONCERN_TEXT[lang].tryThis);
  }
  return out;
}
