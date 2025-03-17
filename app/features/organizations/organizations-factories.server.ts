import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { Organization } from '@prisma/client';

import { slugify } from '~/utils/slugify.server';
import type { Factory } from '~/utils/types';

/**
 * Creates an organization with populated values.
 *
 * @param organizationParams - Organization params to create organization with.
 * @returns A populated organization with given params.
 */
export const createPopulatedOrganization: Factory<Organization> = ({
  id = createId(),
  name = faker.company.name(),
  slug = slugify(name),
  updatedAt = faker.date.recent({ days: 10 }),
  createdAt = faker.date.past({ years: 1, refDate: updatedAt }),
  imageUrl = faker.image.url(),
} = {}) => ({ id, name, slug, createdAt, updatedAt, imageUrl });
