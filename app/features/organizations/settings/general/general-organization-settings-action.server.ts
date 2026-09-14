import { report } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { data, href } from "react-router";
import { z } from "zod";

import {
  deleteOrganization,
  uploadOrganizationLogo,
} from "../../organizations-helpers.server";
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
import { forbidden } from "~/utils/http-responses.server";
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
  request,
  context,
}: Route.ActionArgs) {
  const { organization, role } = context.get(organizationMembershipContext);
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
      const updates: { name?: string; slug?: string } = {};

      if (result.data.name && result.data.name !== organization.name) {
        const newSlug = slugify(result.data.name);
        updates.name = result.data.name;
        updates.slug = newSlug;
      }

      let publishedSlug = organization.slug;
      if (result.data.logo) {
        const { supabase } = context.get(authContext);
        const file = result.data.logo;
        const replacement = await replaceStoredImage({
          kind: "organization-logo",
          ownerId: organization.id,
          previousImageUrl: organization.imageUrl,
          publish: (imageUrl) =>
            updateOrganizationInDatabaseById({
              expectedImageUrl: organization.imageUrl,
              id: organization.id,
              organization: { ...updates, imageUrl },
            }),
          upload: () =>
            uploadOrganizationLogo({
              file,
              organizationId: organization.id,
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
          id: organization.id,
          organization: updates,
        });
        publishedSlug = updatedOrganization.slug;
      }

      if (updates.name && organization.stripeCustomerId) {
        await updateStripeCustomer({
          customerId: organization.stripeCustomerId,
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
    }

    case DELETE_ORGANIZATION_INTENT: {
      await deleteOrganization(organization.id);
      return redirectWithToast(href("/organizations"), {
        title: i18n.t(
          "organizations:settings.general.toast.organizationDeleted",
        ),
        type: "success",
      });
    }
  }
}
