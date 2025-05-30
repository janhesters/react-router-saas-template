import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  future: {
    unstable_splitRouteModules: 'enforce',
    unstable_middleware: true,
  },
} satisfies Config;
