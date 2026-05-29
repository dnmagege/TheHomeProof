import * as Sentry from '@sentry/nextjs';

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    ignoreErrors: ['Non-Error promise rejection captured with keys:'],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
