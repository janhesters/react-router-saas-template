import { OrganizationMembershipRole } from "@prisma/client";
import { z } from "zod";

import {
  CHANGE_ROLE_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from "./team-members-constants";

export const inviteByEmailSchema = z.object({
  email: z.email({
    message:
      "organizations:settings.team-members.invite-by-email.form.email-invalid",
  }),
  intent: z.literal(INVITE_BY_EMAIL_INTENT),
  role: z.nativeEnum(OrganizationMembershipRole),
});

export type InviteByEmailSchema = z.infer<typeof inviteByEmailSchema>;

export const changeRoleSchema = z.object({
  intent: z.literal(CHANGE_ROLE_INTENT),
  role: z.union([
    z.nativeEnum(OrganizationMembershipRole),
    z.literal("deactivated"),
  ]),
  userId: z.string(),
});
