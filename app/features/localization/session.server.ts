import { createCookie } from 'react-router';

export const localeCookie = createCookie('lng', {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
});

export const createLocaleHeaders = async (locale: string) =>
  new Headers({ 'Set-Cookie': await localeCookie.serialize(locale) });
