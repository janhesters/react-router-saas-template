import { test } from 'playwright/test';

test.describe('billing page', () => {
  test.fixme('given: the user is a member, should: show a 404', async () => {
    //
  });

  test.fixme(
    'given: the user is an admin or owner and the organization is on a free trial, should: show a free-trial CTA to start paying in the sidebar',
    async () => {
      // admin & owner can see button of sidebar card
      // member can't see button of sidebar card
    },
  );

  // enter CC details
  // upgrade
  // downgrade
  // cancel
  // resume
  // view invoices
  // manage users
  // change billing email
  // show plan of organization in organization switcher
});
