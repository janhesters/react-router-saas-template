import { createCookie } from "react-router";

function recoveryCookie(deletionId: string) {
  return createCookie(`__account_deletion_${deletionId}`, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    // React Router also requests /account-deletions/:id.data after navigation.
    path: "/account-deletions",
    sameSite: "strict",
    secrets: [process.env.COOKIE_SECRET],
    secure: process.env.NODE_ENV === "production",
  });
}

/** Keep recovery access after sign-out without exposing the token in a URL. */
export function serializeAccountDeletionRecovery({
  deletionId,
  recoveryToken,
}: {
  deletionId: string;
  recoveryToken: string;
}) {
  return recoveryCookie(deletionId).serialize(recoveryToken);
}

export async function readAccountDeletionRecovery(
  request: Request,
  deletionId: string,
) {
  const token: unknown = await recoveryCookie(deletionId).parse(
    request.headers.get("Cookie"),
  );
  return typeof token === "string" ? token : undefined;
}
