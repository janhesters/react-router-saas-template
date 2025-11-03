import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const fixturesDirPath = path.join(
  process.cwd(),
  "app",
  "tests",
  "mocks",
  "fixtures",
);

export async function readFixture(subdir: string, name: string) {
  const filePath = path.join(fixturesDirPath, subdir, `${name}.json`);
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export async function createFixture(
  subdir: string,
  name: string,
  data: unknown,
) {
  const dir = path.join(fixturesDirPath, subdir);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export const EmailSchema = z.object({
  from: z.string(),
  html: z.string(),
  subject: z.string(),
  text: z.string(),
  to: z.string(),
});

export async function writeEmail(rawEmail: unknown) {
  const email = EmailSchema.parse(rawEmail);
  await createFixture("email", email.to, email);
  return email;
}

export async function requireEmail(recipient: string) {
  const email = await readEmail(recipient);
  if (!email) throw new Error(`Email to ${recipient} not found`);
  return email;
}

export async function readEmail(recipient: string) {
  try {
    const email = await readFixture("email", recipient);
    return EmailSchema.parse(email);
  } catch (error) {
    console.error("Error reading email", error);
    return null;
  }
}

export async function deleteEmails() {
  const emailDir = path.join(fixturesDirPath, "email");
  if (existsSync(emailDir)) {
    await rm(emailDir, { force: true, recursive: true });
  }
}

export function requireHeader(headers: Headers, header: string) {
  if (!headers.has(header)) {
    const headersString = JSON.stringify(
      Object.fromEntries(headers.entries()),
      null,
      2,
    );
    throw new Error(
      `Header "${header}" required, but not found in ${headersString}`,
    );
  }
  return headers.get(header);
}
