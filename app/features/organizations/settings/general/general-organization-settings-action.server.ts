import { report } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { data, href, redirect } from "react-router";
import { z } from "zod";

import { requestOrganizationDeletion } from "../../deletion/organization-deletion.server";
import { withOrganizationMutationLock } from "../../deletion/organization-mutation-lock.server";
import { uploadOrganizationLogo } from "../../organizations-helpers.server";
import { organizationMembershipContext } from "../../organizations-middleware.server";
import { updateOrganizationInDatabaseById } from "../../organizations-model.server";
import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from "./general-settings-constants";
import {
  deleteOrganizationFormSchema,
  updateOrganizationFormSchema,
} from "./general-settings-schemas";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/settings+/+types/general";
import { updateStripeCustomer } from "~/features/billing/stripe-helpers.server";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { authContext } from "~/features/user-authentication/user-authentication-middleware.server";
import { OrganizationMembershipRole } from "~/generated/client";
import { prisma } from "~/utils/database.server";
import { badRequest, forbidden, notFound } from "~/utils/http-responses.server";
import { replaceStoredImage } from "~/utils/image-replacement.server";
import { slugify } from "~/utils/slugify.server";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const generalOrganizationSettingsActionSchema = coerceFormValue(
  z.discriminatedUnion("intent", [
    deleteOrganizationFormSchema,
    updateOrganizationFormSchema,
  ]),
);

export async function generalOrganizationSettingsAction({
  context,
  request,
}: Route.ActionArgs) {
  const { organization, role, user } = context.get(
    organizationMembershipContext,
  );
  const i18n = getInstance(context);

  if (role !== OrganizationMembershipRole.owner) {
    return forbidden();
  }

  const result = await validateFormData(
    request,
    generalOrganizationSettingsActionSchema,
    {
      maxFileSize: 1_000_000, // 1MB
    },
  );

  if (!result.success) {
    return result.response;
  }

  switch (result.data.intent) {
    case UPDATE_ORGANIZATION_INTENT: {
      const values = result.data;
      return await withOrganizationMutationLock(
        organization.id,
        async () => {
          const currentOrganization = await prisma.organization.findUnique({
            include: {
              memberships: {
                where: {
                  memberId: user.id,
                  OR: [
                    { deactivatedAt: null },
                    { deactivatedAt: { gt: new Date() } },
                  ],
                },
              },
            },
            where: { id: organization.id },
          });
          if (!currentOrganization) {
            return notFound();
          }
          if (
            currentOrganization.memberships[0]?.role !==
            OrganizationMembershipRole.owner
          ) {
            return forbidden();
          }
          const updates: { name?: string; slug?: string } = {};

          if (values.name && values.name !== currentOrganization.name) {
            const newSlug = slugify(values.name);
            updates.name = values.name;
            updates.slug = newSlug;
          }

          let publishedSlug = currentOrganization.slug;
          if (values.logo) {
            const { supabase } = context.get(authContext);
            const file = values.logo;
            const replacement = await replaceStoredImage({
              kind: "organization-logo",
              ownerId: currentOrganization.id,
              previousImageUrl: currentOrganization.imageUrl,
              publish: (imageUrl) =>
                updateOrganizationInDatabaseById({
                  expectedImageUrl: currentOrganization.imageUrl,
                  id: currentOrganization.id,
                  organization: { ...updates, imageUrl },
                }),
              upload: () =>
                uploadOrganizationLogo({
                  file,
                  organizationId: currentOrganization.id,
                  supabase,
                }),
            });
            if (!replacement.success) {
              return data(
                {
                  result: report(result.submission, {
                    error: {
                      fieldErrors: {
                        logo: [
                          i18n.t(
                            `organizations:settings.general.errors.${replacement.reason}`,
                          ),
                        ],
                      },
                      formErrors: [],
                    },
                  }),
                },
                { status: replacement.status },
              );
            }
            publishedSlug = replacement.value.slug;
          } else if (Object.keys(updates).length > 0) {
            const updatedOrganization = await updateOrganizationInDatabaseById({
              id: currentOrganization.id,
              organization: updates,
            });
            publishedSlug = updatedOrganization.slug;
          }

          if (updates.name && currentOrganization.stripeCustomerId) {
            await updateStripeCustomer({
              customerId: currentOrganization.stripeCustomerId,
              customerName: updates.name,
            });
          }

          if (publishedSlug !== organization.slug) {
            return redirectWithToast(
              href(`/organizations/:organizationSlug/settings/general`, {
                organizationSlug: publishedSlug,
              }),
              {
                title: i18n.t(
                  "organizations:settings.general.toast.organizationProfileUpdated",
                ),
                type: "success",
              },
            );
          }

          const toastHeaders = await createToastHeaders({
            title: i18n.t(
              "organizations:settings.general.toast.organizationProfileUpdated",
            ),
            type: "success",
          });
          return data({ result: undefined }, { headers: toastHeaders });
        },
        { shared: true },
      );
    }

    case DELETE_ORGANIZATION_INTENT: {
      if (result.data.confirmation !== organization.name) {
        return badRequest({
          result: report(result.submission, {
            error: {
              fieldErrors: {
                confirmation: [
                  i18n.t(
                    "organizations:settings.general.dangerZone.errors.confirmationMismatch",
                  ),
                ],
              },
            },
          }),
        });
      }
      const deletion = await requestOrganizationDeletion({
        confirmation: result.data.confirmation,
        organizationId: organization.id,
        userId: user.id,
      });
      return redirect(
        href("/organization-deletions/:deletionId", {
          deletionId: deletion.id,
        }),
      );
    }
  }
}
