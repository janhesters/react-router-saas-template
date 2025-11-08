import { OrganizationMembershipRole } from "@prisma/client";
import { z } from "zod";

import {
  CHANGE_ROLE_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from "./team-members-constants";

z.config({ jitless: true });

export const inviteByEmailSchema = z.object({
  email: z.email({
    message:
      "organizations:settings.teamMembers.inviteByEmail.form.emailInvalid",
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
