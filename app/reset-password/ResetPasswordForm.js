'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, Loader2 } from 'lucide-react';

const supabase = getSupabaseClient();

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState('request');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const hasRecoveryToken = !!searchParams?.get('access_token') || searchParams?.get('type') === 'recovery';

  useEffect(() => {
    if (hasRecoveryToken) {
      setMode('update');
      (async () => {
        try {
          await supabase.auth.getSessionFromUrl({ storeSession: true });
        } catch (err) {
          console.warn('Failed to load recovery session from URL', err);
        }
      })();
    } else {
      setMode('request');
    }
  }, [hasRecoveryToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'request') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
        });
        if (error) throw error;
        setMessage('Password reset email sent. Check your inbox.');
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Password updated successfully. You can now sign in.');
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to process your request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => window.location.href = '/'}
          className="mb-6 inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </button>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle>{mode === 'request' ? 'Reset password' : 'Choose a new password'}</CardTitle>
            <CardDescription>
              {mode === 'request'
                ? 'Enter the email address for your account and we will send a secure reset link.'
                : 'Set a new password to restore access to your HomeProof account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className="mb-4 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 p-4 text-sm">
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'request' && (
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              {mode === 'update' && (
                <>
                  <div>
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'request' ? 'Send reset link' : 'Set new password'}
              </Button>
            </form>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {mode === 'request'
                ? 'Remembered your password? '
                : 'Password updated? '}
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="text-brand-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
