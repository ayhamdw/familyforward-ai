import { z } from "zod";
import raw from "./resources.json";
import { AGE_BANDS } from "./survey";

/** One entry in the free family resource directory. Bundled in the app so it works offline. */
export const ResourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    offers: z.object({ en: z.string().min(1), es: z.string().min(1), ar: z.string().min(1) }).strict(),
    cost: z.enum(["free", "low"]),
    ageBands: z.array(z.enum(AGE_BANDS)).min(1),
    languages: z.array(z.enum(["en", "es", "ar"])).min(1),
    area: z.enum(["chicago", "national"]),
    url: z.string().url().startsWith("https://"),
    /** Only filled when the number appears on the official page. */
    phone: z.string().nullable(),
    sourceUrl: z.string().url(),
    /** Date the official page was fetched and read, or null when it was not verified. */
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  })
  .strict();
export type Resource = z.infer<typeof ResourceSchema>;

export const resources: readonly Resource[] = z.array(ResourceSchema).parse(raw.resources);
export const RESOURCE_IDS: readonly string[] = resources.map((r) => r.id);

export function findResource(id: string): Resource | undefined {
  return resources.find((r) => r.id === id);
}

export function isResourceId(id: string): boolean {
  return RESOURCE_IDS.includes(id);
}

/** Resources shown on the concern card, by age band (brief 5.1). */
export const CONCERN_RESOURCE_IDS = {
  "2-3": ["illinois-early-intervention", "cps-child-find", "211-metro-chicago"],
  "4-5": ["cps-child-find", "211-metro-chicago", "chicago-public-library"],
} as const;
