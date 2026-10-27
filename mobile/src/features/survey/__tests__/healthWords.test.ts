import { hasHealthWords } from "@familyforward/shared";

describe("hasHealthWords", () => {
  it.each([
    ["I'm worried about how my child talks"],
    ["My son has autism"],
    ["She had a speech delay last year"],
    ["we are waiting for a diagnosis"],
    ["He doesn't talk much"],
    ["Me preocupa cómo habla mi hijo"],
    ["Tiene retraso en el lenguaje"],
    ["le diagnosticaron TDAH"],
    ["أنا قلقة من تأخر كلام ابني"],
    ["عنده توحد"],
    ["لا يتكلم أبدًا"],
  ])("flags: %s", (note) => {
    expect(hasHealthWords(note)).toBe(true);
  });

  it.each([
    [""],
    ["   "],
    ["we like short activities before bedtime"],
    ["Please send the address by email"],
    ["Nos gustan las actividades cortas antes de dormir"],
    ["Le encantan los cuentos y las canciones"],
    ["نحب الأنشطة القصيرة قبل النوم"],
  ])("does not flag: %s", (note) => {
    expect(hasHealthWords(note)).toBe(false);
  });

  it("ignores case, accents and Arabic diacritics", () => {
    expect(hasHealthWords("DIAGNÓSTICO")).toBe(true);
    expect(hasHealthWords("تَشْخِيص")).toBe(true);
  });
});
