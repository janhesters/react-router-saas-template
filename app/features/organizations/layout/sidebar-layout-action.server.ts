import { data, redirect } from 'react-router';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { z } from 'zod';

import {
  MARK_ALL_NOTIFICATIONS_AS_READ_INTENT,
  MARK_ONE_NOTIFICATION_AS_READ_INTENT,
  NOTIFICATION_PANEL_OPENED_INTENT,
} from '~/features/notifications/notification-constants';
import {
  markAllUnreadNotificationsAsReadForUserAndOrganizationInDatabaseById,
  markNotificationAsReadForUserAndOrganizationInDatabaseById,
  updateNotificationPanelLastOpenedAtForUserAndOrganizationInDatabaseById,
} from '~/features/notifications/notifications-model.server';
import {
  markAllAsReadSchema,
  markOneAsReadSchema,
  notificationPanelOpenedSchema,
} from '~/features/notifications/notifications-schemas';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { notFound } from '~/utils/http-responses.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import {
  findOrganizationIfUserIsMemberById,
  requireUserIsMemberOfOrganization,
} from '../organizations-helpers.server';
import { switchSlugInRoute } from './layout-helpers.server';
import { createCookieForOrganizationSwitcherSession } from './organization-switcher-session.server';
import { SWITCH_ORGANIZATION_INTENT } from './sidebar-layout-constants';
import { switchOrganizationSchema } from './sidebar-layout-schemas';
import type { Route } from '.react-router/types/app/routes/organizations_+/$organizationSlug+/+types/_sidebar-layout';

const schema = z.discriminatedUnion('intent', [
  markAllAsReadSchema,
  markOneAsReadSchema,
  notificationPanelOpenedSchema,
  switchOrganizationSchema,
]);

export async function sidebarLayoutAction({
  request,
  params,
}: Route.ActionArgs) {
  try {
    const { user, organization, headers } =
      await requireUserIsMemberOfOrganization(request, params.organizationSlug);
    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case SWITCH_ORGANIZATION_INTENT: {
        const { organization } = findOrganizationIfUserIsMemberById(
          user,
          body.organizationId,
        );
        const cookie = await createCookieForOrganizationSwitcherSession(
          request,
          organization.id,
        );
        return redirect(
          safeRedirect(switchSlugInRoute(body.currentPath, organization.slug)),
          { headers: combineHeaders(headers, { 'Set-Cookie': cookie }) },
        );
      }

      case MARK_ALL_NOTIFICATIONS_AS_READ_INTENT: {
        await markAllUnreadNotificationsAsReadForUserAndOrganizationInDatabaseById(
          { userId: user.id, organizationId: organization.id },
        );
        return data({}, { headers });
      }

      case MARK_ONE_NOTIFICATION_AS_READ_INTENT: {
        const result =
          await markNotificationAsReadForUserAndOrganizationInDatabaseById({
            userId: user.id,
            organizationId: organization.id,
            recipientId: body.recipientId,
          });

        if (result === null) {
          return notFound({}, { headers });
        }

        return data({}, { headers });
      }

      case NOTIFICATION_PANEL_OPENED_INTENT: {
        await updateNotificationPanelLastOpenedAtForUserAndOrganizationInDatabaseById(
          { userId: user.id, organizationId: organization.id },
        );
        return data({}, { headers });
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
