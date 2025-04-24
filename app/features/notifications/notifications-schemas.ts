import { z } from 'zod';

import { LINK_NOTIFICATION_TYPE } from './notification-constants';

export const linkNotificationDataSchema = z.object({
  type: z.literal(LINK_NOTIFICATION_TYPE),
  text: z.string(),
  href: z.string(),
});

export type LinkNotificationData = z.infer<typeof linkNotificationDataSchema>;
