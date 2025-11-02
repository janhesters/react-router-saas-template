export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "never"], // Enforces a scope like (app) or (tests)
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
  },
};
