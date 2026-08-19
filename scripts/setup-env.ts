import { existsSync } from "node:fs";
import { copyFile } from "node:fs/promises";

const target = ".env";

if (existsSync(target)) {
  console.log(`${target} already exists; keeping it unchanged.`);
} else {
  await copyFile(".env.example", target);
  console.log(`Created ${target} from .env.example.`);
}
