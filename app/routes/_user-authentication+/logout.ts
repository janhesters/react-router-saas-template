import { redirect } from "react-router";

import type { Route } from "./+types/logout";
import { logout } from "~/features/user-authentication/user-authentication-helpers.server";

export function loader() {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  return await logout(request);
}
