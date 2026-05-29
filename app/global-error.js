'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        We’ve captured the issue and will investigate it.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
