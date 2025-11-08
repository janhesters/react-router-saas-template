import billing from "./billing";
import colorScheme from "./color-scheme";
import dragAndDrop from "./drag-and-drop";
import landing from "./landing";
import notifications from "./notifications";
import onboarding from "./onboarding";
import organizations from "./organizations";
import settings from "./settings";
import translation from "./translation";
import userAuthentication from "./user-authentication";

export default {
  billing,
  colorScheme,
  dragAndDrop,
  landing,
  notifications,
  onboarding,
  organizations,
  settings,
  translation,
  userAuthentication,
} satisfies typeof import("../en/index").default;
