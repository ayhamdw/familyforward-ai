import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..", "..");
const DIRS = ["app", "src/components", "src/features"];

// Physical-direction style props break RTL. Use start/end instead.
const PHYSICAL = [
  /\b(margin|padding)(Left|Right)\b/,
  /\bborder(Left|Right)(Width|Color)?\b/,
  /\bborder(Top|Bottom)(Left|Right)Radius\b/,
  /\b(left|right)\s*:/,
  /textAlign:\s*["'](left|right)["']/,
  /flexDirection:\s*["']row-reverse["']/,
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("logical style props", () => {
  it("never use left/right so layouts mirror in RTL", () => {
    const offenders: string[] = [];
    for (const dir of DIRS) {
      for (const file of sourceFiles(join(ROOT, dir))) {
        const text = readFileSync(file, "utf8");
        for (const pattern of PHYSICAL) {
          if (pattern.test(text)) {
            offenders.push(`${file.replace(ROOT, "")}: ${pattern}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
