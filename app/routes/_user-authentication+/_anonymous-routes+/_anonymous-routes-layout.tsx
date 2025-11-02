import { Outlet } from "react-router";

import { anonymousMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";

export const middleware = [anonymousMiddleware];

export default function AnonymousRoutesLayout() {
  return <Outlet />;
}
