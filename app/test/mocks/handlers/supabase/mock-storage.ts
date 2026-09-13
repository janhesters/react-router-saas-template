import path from "node:path";

export const MOCK_STORAGE_DIR = path.join(
  process.cwd(),
  "app",
  "tests",
  "mocks",
  "fixtures",
  "supabase-storage",
);
