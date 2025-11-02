import { Outlet } from "react-router";

import { authMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";

export const middleware = [authMiddleware];

export default function AuthenticatedRoutesLayout() {
  return <Outlet />;
}
