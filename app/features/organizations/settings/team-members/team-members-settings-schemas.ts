import { OrganizationMembershipRole } from "@prisma/client";
import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import {
  CHANGE_ROLE_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from "./team-members-constants";

export const inviteByEmailSchema = z.object({
  email: z
    .email({
      error:
        "organizations:settings.team-members.invite-by-email.form.email-invalid",
    })
    .min(
      1,
      "organizations:settings.team-members.invite-by-email.form.email-required",
    ),
  intent: z.literal(INVITE_BY_EMAIL_INTENT),
  role: z.nativeEnum(OrganizationMembershipRole),
});

export type InviteByEmailSchema = z.infer<typeof inviteByEmailSchema>;
export type InviteByEmailErrors = FieldErrors<InviteByEmailSchema>;

export const changeRoleSchema = z.object({
  intent: z.literal(CHANGE_ROLE_INTENT),
  role: z.union([
    z.nativeEnum(OrganizationMembershipRole),
    z.literal("deactivated"),
  ]),
  userId: z.string(),
});
