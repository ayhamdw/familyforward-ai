import type { Language } from "../index";
import type { FocusArea, Interest, Material } from "./survey";

/**
 * Labels for the survey options, in every supported language.
 * TODO: needs native review for the Spanish and Arabic labels.
 */
export type OptionLabels<T extends string> = Record<T, Record<Language, string>>;

/** Full label, used on the focus survey step and activity chips. */
export const FOCUS_AREA_LABELS: OptionLabels<FocusArea> = {
  talking: {
    en: "Talking and vocabulary",
    es: "Hablar y vocabulario",
    ar: "الكلام والمفردات",
  },
  reading: {
    en: "Early reading and books",
    es: "Primeras lecturas y libros",
    ar: "القراءة المبكرة والكتب",
  },
  counting: {
    en: "Counting and shapes",
    es: "Contar y formas",
    ar: "العدّ والأشكال",
  },
  feelings: {
    en: "Feelings and getting along",
    es: "Emociones y llevarse bien con otros",
    ar: "المشاعر والتعامل مع الآخرين",
  },
  movement: {
    en: "Movement and play",
    es: "Movimiento y juego",
    ar: "الحركة واللعب",
  },
  routines: {
    en: "Daily routines",
    es: "Rutinas diarias",
    ar: "الروتين اليومي",
  },
};

/** Short label, used on plan day cards and past weeks. */
export const FOCUS_AREA_SHORT_LABELS: OptionLabels<FocusArea> = {
  talking: {
    en: "Talking",
    es: "Hablar",
    ar: "الكلام",
  },
  reading: {
    en: "Reading",
    es: "Lectura",
    ar: "القراءة",
  },
  counting: {
    en: "Counting",
    es: "Contar",
    ar: "العدّ",
  },
  feelings: {
    en: "Feelings",
    es: "Emociones",
    ar: "المشاعر",
  },
  movement: {
    en: "Movement",
    es: "Movimiento",
    ar: "الحركة",
  },
  routines: {
    en: "Routines",
    es: "Rutinas",
    ar: "الروتين",
  },
};

export const INTEREST_LABELS: OptionLabels<Interest> = {
  songs: {
    en: "Songs and music",
    es: "Canciones y música",
    ar: "الأغاني والموسيقى",
  },
  books: {
    en: "Books and stories",
    es: "Libros y cuentos",
    ar: "الكتب والقصص",
  },
  building: {
    en: "Building and blocks",
    es: "Construir y armar bloques",
    ar: "البناء والمكعبات",
  },
  drawing: {
    en: "Drawing and crafts",
    es: "Dibujar y hacer manualidades",
    ar: "الرسم والأشغال اليدوية",
  },
  outdoors: {
    en: "Outdoors",
    es: "Al aire libre",
    ar: "الأنشطة الخارجية",
  },
  pretend: {
    en: "Pretend play",
    es: "Juego de fantasía",
    ar: "اللعب التمثيلي",
  },
  cooking: {
    en: "Cooking and helping at home",
    es: "Cocinar y ayudar en casa",
    ar: "الطبخ والمساعدة في البيت",
  },
};

export const MATERIAL_LABELS: OptionLabels<Material> = {
  paper: {
    en: "Paper and crayons",
    es: "Papel y crayones",
    ar: "ورق وألوان شمعية",
  },
  books: {
    en: "Books (any language)",
    es: "Libros (en cualquier idioma)",
    ar: "كتب (بأي لغة)",
  },
  kitchen: {
    en: "Kitchen items",
    es: "Utensilios de cocina",
    ar: "أدوات المطبخ",
  },
  toys: {
    en: "Toys or blocks",
    es: "Juguetes o bloques",
    ar: "ألعاب أو مكعبات",
  },
  phone: {
    en: "A phone with internet",
    es: "Un teléfono con internet",
    ar: "هاتف متصل بالإنترنت",
  },
  outdoor: {
    en: "Outdoor space nearby",
    es: "Espacio al aire libre cerca",
    ar: "مساحة خارجية قريبة",
  },
};
