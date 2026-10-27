import ar from "../ar.json";
import en from "../en.json";
import es from "../es.json";

type Tree = { [key: string]: string | Tree };

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (key === "_todo") {
      continue;
    }
    if (typeof value === "string") {
      out[prefix + key] = value;
    } else {
      Object.assign(out, flatten(value, `${prefix}${key}.`));
    }
  }
  return out;
}

const placeholders = (text: string): string[] => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

const base = (key: string): string => key.replace(PLURAL_SUFFIX, "");

const english = flatten(en as Tree);

describe("locale files", () => {
  it.each([
    ["es", es],
    ["ar", ar],
  ])("%s has exactly the same keys as English", (_name, locale) => {
    const keys = new Set(Object.keys(flatten(locale as Tree)).map(base));
    const expected = new Set(Object.keys(english).map(base));
    expect([...expected].filter((key) => !keys.has(key))).toEqual([]);
    expect([...keys].filter((key) => !expected.has(key))).toEqual([]);
  });

  it.each([
    ["es", es],
    ["ar", ar],
  ])("%s uses only placeholders that English uses", (_name, locale) => {
    const allowed = new Map<string, Set<string>>();
    for (const [key, text] of Object.entries(english)) {
      const set = allowed.get(base(key)) ?? new Set<string>();
      placeholders(text).forEach((name) => set.add(name));
      allowed.set(base(key), set);
    }
    for (const [key, text] of Object.entries(flatten(locale as Tree))) {
      for (const name of placeholders(text)) {
        expect([key, allowed.get(base(key))?.has(name)]).toEqual([key, true]);
      }
    }
  });

  it("every string is non-empty", () => {
    for (const locale of [en, es, ar]) {
      for (const text of Object.values(flatten(locale as Tree))) {
        expect(text.trim()).not.toBe("");
      }
    }
  });

  it("marks Spanish and Arabic as needing native review", () => {
    expect((es as Tree)._todo).toMatch(/needs native review/);
    expect((ar as Tree)._todo).toMatch(/needs native review/);
  });

  it("never mentions diagnosis-style advice in plan copy", () => {
    const planCopy = [english["plan.disclaimer"], english["help.notice"], english["survey.note.healthBody"]].join(" ");
    expect(planCopy).toMatch(/not advice|can't give advice|doctor or teacher/);
  });
});
