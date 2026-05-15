import { createClient } from '@supabase/supabase-js';

let _admin = null;

export function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }
  return _admin;
}

// Validate JWT from Authorization header and return { user, profile }
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: 'Missing token', status: 401 };

  const admin = getSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { error: 'Invalid token', status: 401 };

  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { user, profile, admin };
}
