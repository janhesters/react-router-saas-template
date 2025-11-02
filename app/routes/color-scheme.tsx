import type { Route } from "./+types/color-scheme";
import { colorSchemeAction } from "~/features/color-scheme/color-scheme.server";

export async function action(args: Route.ActionArgs) {
  return await colorSchemeAction(args);
}
