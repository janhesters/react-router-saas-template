import LandingPage from "~/features/landing/landing-page";
import { anonymousMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";

export const middleware = [anonymousMiddleware];

export default function LandingRoute() {
  return <LandingPage />;
}
