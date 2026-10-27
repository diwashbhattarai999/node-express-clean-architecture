import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0, "always", 200],
    "footer-max-line-length": [0, "always", 200],
    "header-max-length": [0, "always", 100],
    "subject-max-length": [0, "always", 100],
  },
};

export default config;
