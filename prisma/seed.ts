import { OrganizationMembershipRole } from "@prisma/client";
import { config } from "dotenv";

import { priceLookupKeysByTierAndInterval } from "../app/features/billing/billing-constants";
import { createPopulatedOrganization } from "../app/features/organizations/organizations-factories.server";
import { addMembersToOrganizationInDatabaseById } from "../app/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "../app/features/user-accounts/user-accounts-factories.server";
import { saveUserAccountToDatabase } from "../app/features/user-accounts/user-accounts-model.server";
import {
  createUserWithOrgAndAddAsMember,
  ensureStripeProductsAndPricesExist,
} from "../app/test/test-utils";
import { prisma } from "../app/utils/database.server";

// Load environment variables from .env file
config();

async function seed() {
  console.log("🌱 Seeding...");
  console.time("🌱 Database has been seeded");

  // 1. Ensure Stripe products and prices exist
  console.time("💳 Created Stripe products and prices");
  await ensureStripeProductsAndPricesExist();
  console.timeEnd("💳 Created Stripe products and prices");

  // 2. Create demo organizations with owners
  const demoOrgs = [
    {
      lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
      organization: createPopulatedOrganization({ name: "Hobby Corp" }),
      seats: 1,
      tier: "Hobby",
      user: createPopulatedUserAccount({
        email: "hobby@example.com",
        name: "Hobby User",
      }),
    },
    {
      lookupKey: priceLookupKeysByTierAndInterval.mid.annual,
      organization: createPopulatedOrganization({ name: "Startup Inc" }),
      seats: 5,
      tier: "Startup",
      user: createPopulatedUserAccount({
        email: "startup@example.com",
        name: "Startup User",
      }),
    },
    {
      lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
      organization: createPopulatedOrganization({ name: "Business LLC" }),
      seats: 25,
      tier: "Business",
      user: createPopulatedUserAccount({
        email: "business@example.com",
        name: "Business User",
      }),
    },
  ];

  console.time(`👥 Created ${demoOrgs.length} organizations with owners`);

  for (const demo of demoOrgs) {
    const { user, organization } = await createUserWithOrgAndAddAsMember({
      lookupKey: demo.lookupKey,
      organization: demo.organization,
      role: OrganizationMembershipRole.owner,
      user: demo.user,
    });
    console.log(
      `  ✓ ${demo.tier} Plan (${demo.seats} seat${demo.seats > 1 ? "s" : ""}): ${user.email} → ${organization.name}`,
    );
  }

  console.timeEnd(`👥 Created ${demoOrgs.length} organizations with owners`);

  // 3. Add random members to each organization
  console.time("🎭 Added random members to organizations");

  // Get all organizations
  const organizations = await prisma.organization.findMany({
    include: { memberships: true },
  });

  for (const org of organizations) {
    // Add 2-4 random members per org
    const memberCount = Math.floor(Math.random() * 3) + 2; // 2-4 members
    const members: string[] = [];

    for (let i = 0; i < memberCount; i++) {
      const memberUser = createPopulatedUserAccount({
        email: `member${i + 1}.${org.slug}@example.com`,
        name: `Member ${i + 1}`,
      });
      await saveUserAccountToDatabase(memberUser);
      members.push(memberUser.id);
    }

    if (members.length > 0) {
      await addMembersToOrganizationInDatabaseById({
        id: org.id,
        members,
        role: OrganizationMembershipRole.member,
      });
      console.log(`  ✓ Added ${members.length} members to ${org.name}`);
    }
  }

  console.timeEnd("🎭 Added random members to organizations");

  console.timeEnd("🌱 Database has been seeded");

  console.log("\n📝 Demo accounts:");
  console.log("  • hobby@example.com     (Hobby Plan, 1 seat, monthly)");
  console.log("  • startup@example.com   (Startup Plan, 5 seats, annual)");
  console.log("  • business@example.com  (Business Plan, 25 seats, monthly)");
  console.log(
    "\n💡 Use these emails to log in via Supabase magic link when running with mocks.",
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/
