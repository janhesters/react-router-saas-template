import Stripe from 'stripe';
import invariant from 'tiny-invariant';

const { STRIPE_SECRET_KEY } = process.env;

invariant(STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY is not set');

export const stripeAdmin = new Stripe(STRIPE_SECRET_KEY);
