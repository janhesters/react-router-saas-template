import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Diagnostic = {
  code: string;
  filename: string;
  severity: string;
};

const root = fileURLToPath(new URL("../", import.meta.url));
// Exercise application policy outside the component-authoring exceptions.
const directory = mkdtempSync(join(root, "app/shadcn-lint-check-"));
const fixtures = {
  "no-arbitrary-values":
    'export function Example() { return <div className="text-[17px]" />; }',
  "no-inline-styles":
    "export function Example() { return <div style={{ opacity: 0.5 }} />; }",
  "no-raw-colors":
    'export function Example() { return <div className="bg-red-500" />; }',
  "no-restyle":
    'import { Button } from "~/components/ui/button";\nexport function Example() { return <Button className="rounded-full">Save</Button>; }',
  "no-unknown-classes":
    'export function Example() { return <div className="spcae-y-2" />; }',
  "require-static-classes": `import { Button } from "~/components/ui/button";\nexport function Example({ spacing }: { spacing: number }) { return <Button className={\`px-\${spacing}\`}>Save</Button>; }`,
};

try {
  writeFileSync(
    join(directory, "valid.tsx"),
    'import { Button } from "~/components/ui/button";\nexport function Example() { return <div className="space-y-2 bg-primary text-base"><Button className="mt-2" variant="outline">Save</Button></div>; }',
  );
  for (const [rule, source] of Object.entries(fixtures)) {
    writeFileSync(join(directory, `${rule}.tsx`), source);
  }

  // Do not pass rule flags: this must prove that the repository enables them.
  const result = spawnSync(
    "bunx",
    ["--no-install", "oxlint", "--format", "json", directory],
    { cwd: root, encoding: "utf8" },
  );
  if (result.error) throw result.error;

  assert.equal(
    result.status,
    1,
    `Oxlint must reject the invalid fixtures.\n${result.stdout}\n${result.stderr}`,
  );
  const { diagnostics, number_of_files: numberOfFiles } = JSON.parse(
    result.stdout,
  ) as { diagnostics: Diagnostic[]; number_of_files: number };
  const rules = Object.keys(fixtures);
  assert.equal(numberOfFiles, rules.length + 1, "Oxlint skipped fixtures.");
  assert.equal(
    diagnostics.length,
    rules.length,
    `Expected one error per rule and no errors in the valid fixture.\n${result.stdout}`,
  );
  for (const rule of rules) {
    assert.ok(
      diagnostics.some(
        ({ code, filename, severity }) =>
          code === `shadcn(${rule})` &&
          resolve(root, filename) === join(directory, `${rule}.tsx`) &&
          severity === "error",
      ),
      `shadcn/${rule} did not reject its fixture as an error.\n${result.stdout}`,
    );
  }
  console.log(`Verified CI enforcement for all ${rules.length} shadcn rules.`);
} finally {
  rmSync(directory, { force: true, recursive: true });
}
