import type { defaultNS, resources } from "./resources";

declare module "react-i18next" {
  type CustomTypeOptions = {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
  };
}
