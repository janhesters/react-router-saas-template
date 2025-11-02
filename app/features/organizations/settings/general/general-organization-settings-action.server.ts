import { OrganizationMembershipRole } from "@prisma/client";
import { data, href } from "react-router";
import { z } from "zod";

import { deleteOrganization } from "../../organizations-helpers.server";
import { organizationMembershipContext } from "../../organizations-middleware.server";
import { updateOrganizationInDatabaseBySlug } from "../../organizations-model.server";
import type { UpdateOrganizationFormErrors } from "./general-organization-settings";
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
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { combineHeaders } from "~/utils/combine-headers.server";
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { forbidden } from "~/utils/http-responses.server";
import { slugify } from "~/utils/slugify.server";
import { removeImageFromStorage } from "~/utils/storage-helpers.server";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const generalOrganizationSettingsActionSchema = z.discriminatedUnion("intent", [
  deleteOrganizationFormSchema,
  updateOrganizationFormSchema,
]);

export async function generalOrganizationSettingsAction({
  request,
  params,
  context,
}: Route.ActionArgs) {
  try {
    const { headers, organization, role } = context.get(
      organizationMembershipContext,
    );
    const body = await validateFormData(
      request,
      generalOrganizationSettingsActionSchema,
    );
    const i18n = getInstance(context);

    if (role !== OrganizationMembershipRole.owner) {
      return forbidden();
    }

    switch (body.intent) {
      case UPDATE_ORGANIZATION_INTENT: {
        const updates: { name?: string; slug?: string; imageUrl?: string } = {};

        if (body.name && body.name !== organization.name) {
          const newSlug = slugify(body.name);
          updates.name = body.name;
          updates.slug = newSlug;
        }

        if (body.logo) {
          await removeImageFromStorage(organization.imageUrl);
          updates.imageUrl = body.logo;
        }

        if (Object.keys(updates).length > 0) {
          await updateOrganizationInDatabaseBySlug({
            organization: updates,
            slug: params.organizationSlug,
          });

          if (updates.name && organization.stripeCustomerId) {
            await updateStripeCustomer({
              customerId: organization.stripeCustomerId,
              customerName: updates.name,
            });
          }

          if (updates.slug) {
            return redirectWithToast(
              href(`/organizations/:organizationSlug/settings/general`, {
                organizationSlug: updates.slug,
              }),
              {
                title: i18n.t(
                  "organizations:settings.general.toast.organization-profile-updated",
                ),
                type: "success",
              },
              { headers },
            );
          }
        }

        const toastHeaders = await createToastHeaders({
          title: i18n.t(
            "organizations:settings.general.toast.organization-profile-updated",
          ),
          type: "success",
        });
        return data({}, { headers: combineHeaders(headers, toastHeaders) });
      }

      case DELETE_ORGANIZATION_INTENT: {
        await deleteOrganization(organization.id);
        return redirectWithToast(
          href("/organizations"),
          {
            title: i18n.t(
              "organizations:settings.general.toast.organization-deleted",
            ),
            type: "success",
          },
          { headers },
        );
      }
    }
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: UpdateOrganizationFormErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
