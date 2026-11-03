import type { Language } from "../index";

/**
 * Required last line of every plan, in the plan language. The safety filter checks for it exactly.
 * DRAFT: placeholder wording until Appendix B is supplied. ES and AR need native review.
 */
export const CLOSING_LINES: Record<Language, string> = {
  en: "These are simple ideas to enjoy together. If you have questions about your child, talk with your child's doctor or teacher.",
  es: "Estas son ideas sencillas para disfrutar juntos. Si tiene preguntas sobre su hijo o hija, hable con su médico o su maestro.",
  ar: "هذه أفكار بسيطة للاستمتاع معًا. إذا كانت لديك أسئلة عن طفلك، فتحدث مع طبيب طفلك أو معلمه.",
};
