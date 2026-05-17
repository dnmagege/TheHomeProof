import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import OpenAI from 'openai';
import sgMail from '@sendgrid/mail';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ---------------- RATE LIMITER (in-memory sliding window) ----------------
const RATE_BUCKETS = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const arr = (RATE_BUCKETS.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= limit) return { allowed: false, retryAfter: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  arr.push(now);
  RATE_BUCKETS.set(key, arr);
  // Periodic cleanup
  if (RATE_BUCKETS.size > 5000) {
    for (const [k, v] of RATE_BUCKETS) {
      const filtered = v.filter(t => now - t < windowMs);
      if (filtered.length === 0) RATE_BUCKETS.delete(k);
      else RATE_BUCKETS.set(k, filtered);
    }
  }
  return { allowed: true };
}

function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function corsHeaders(res) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

function json(data, status = 200) {
  return corsHeaders(NextResponse.json(data, { status }));
}

export async function OPTIONS() {
  return corsHeaders(new NextResponse(null, { status: 200 }));
}

// ---------------- AI HELPERS ----------------

async function aiInventoryFromPhotos(photoUrls) {
  const content = [
    {
      type: 'text',
      text: `You are a professional UK property inventory clerk. Analyze the following property photos and produce a detailed JSON inventory.
Return STRICT JSON with this shape:
{
  "rooms": [
    {
      "name": "Living Room",
      "items": [
        {"item": "Sofa", "quantity": 1, "condition": "good", "notes": "Minor wear on left arm"}
      ],
      "walls_condition": "good",
      "floor_condition": "good",
      "overall_notes": "..."
    }
  ],
  "summary": "Overall property is in good condition..."
}
Conditions must be one of: "excellent", "good", "fair", "poor", "damaged".`,
    },
    ...photoUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });
  return JSON.parse(resp.choices[0].message.content);
}

async function aiContractParse(rawText) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a UK tenancy law expert. Extract structured info from tenancy agreements.',
      },
      {
        role: 'user',
        content: `Read the tenancy agreement below and return STRICT JSON:
{
  "tenant_rights": ["..."],
  "tenant_obligations": ["..."],
  "landlord_rights": ["..."],
  "landlord_obligations": ["..."],
  "notice_periods": {"tenant_to_landlord": "...", "landlord_to_tenant": "..."},
  "rent": {"amount": "...", "frequency": "...", "due_day": "..."},
  "deposit": {"amount": "...", "protection_scheme": "..."},
  "key_dates": [{"event": "...", "date": "..."}],
  "red_flags": ["unusual or potentially unfair clauses"],
  "plain_english_summary": "2-3 paragraph summary"
}

CONTRACT TEXT:
${rawText.slice(0, 30000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });
  return JSON.parse(resp.choices[0].message.content);
}

async function aiCompareInspection(beforeUrls, afterUrls) {
  const content = [
    {
      type: 'text',
      text: `You are a property inspector comparing BEFORE (move-in) and AFTER (move-out) photos.
Identify NEW damage, missing items, and changes in condition.
Return STRICT JSON:
{
  "damages": [
    {"location": "Kitchen wall", "type": "scratch", "severity": "minor|moderate|severe", "estimated_cost_gbp": 50, "evidence": "Photo description"}
  ],
  "missing_items": ["..."],
  "fair_wear_and_tear": ["..."],
  "overall_assessment": "...",
  "total_estimated_deduction_gbp": 0,
  "recommendation": "Suggested deposit deduction explanation"
}
The first ${beforeUrls.length} images are BEFORE; the rest are AFTER.`,
    },
    ...beforeUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
    ...afterUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 2500,
  });
  return JSON.parse(resp.choices[0].message.content);
}

async function aiDraftIssueMessage(title, description, photoUrls = []) {
  const content = [
    {
      type: 'text',
      text: `You are helping a tenant draft a professional repair request email to their landlord.
Issue title: ${title}
Tenant description: ${description}

Return STRICT JSON:
{
  "classification": "plumbing|electrical|heating|structural|appliance|safety|other",
  "urgency": "emergency|high|medium|low",
  "subject": "Email subject line",
  "body": "Polite, clear email body (3-5 sentences) referencing tenancy rights where relevant",
  "suggested_response_window_days": 7
}`,
    },
    ...photoUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 1200,
  });
  return JSON.parse(resp.choices[0].message.content);
}

// ---------------- ROUTER ----------------

async function handle(request, { params }) {
  const path = (params?.path || []).join('/');
  const method = request.method;
  const ip = getClientIp(request);

  // Per-IP global rate limit: 120 req / minute
  const globalRl = rateLimit(`ip:${ip}`, 120, 60_000);
  if (!globalRl.allowed) return json({ error: 'Too many requests', retry_after: globalRl.retryAfter }, 429);

  // Stricter limits for auth + AI
  if (path === 'auth/signup' && method === 'POST') {
    const r = rateLimit(`signup:${ip}`, 10, 3600_000);
    if (!r.allowed) return json({ error: 'Signup rate limit exceeded' }, 429);
  }
  if ((path.startsWith('inventories/generate') || path.startsWith('inspections/compare') || path.startsWith('contracts/') || path.startsWith('rent/') || path.startsWith('chat') || path.startsWith('disputes/build')) && method === 'POST') {
    const r = rateLimit(`ai:${ip}`, 30, 60_000);
    if (!r.allowed) return json({ error: 'AI rate limit: 30 per minute. Try again shortly.' }, 429);
  }

  try {
    // Public: health check
    if (path === '' || path === 'root') {
      return json({ message: 'AI Tenancy Manager API ready', timestamp: new Date().toISOString() });
    }

    // Public: signup (auto-confirms email for smooth MVP UX)
    if (path === 'auth/signup' && method === 'POST') {
      const body = await request.json();
      const { email, password, name, role } = body;
      if (!email || !password) return json({ error: 'email and password required' }, 400);
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || '', role: role || 'tenant' },
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: data.user });
    }

    // All other endpoints require auth
    const auth = await getUserFromRequest(request);
    if (auth.error) return json({ error: auth.error }, auth.status);
    const { user, profile, admin } = auth;

    // ===== PROFILE =====
    if (path === 'me' && method === 'GET') {
      return json({ user: { id: user.id, email: user.email }, profile });
    }

    // ===== PROPERTIES =====
    if (path === 'properties' && method === 'GET') {
      let q = admin.from('properties').select('*').order('created_at', { ascending: false });
      if (profile?.role === 'landlord') q = q.eq('landlord_id', user.id);
      else {
        // tenants: only properties via tenancy
        const { data: tens } = await admin.from('tenancies').select('property_id').eq('tenant_id', user.id);
        const ids = (tens || []).map((t) => t.property_id);
        if (ids.length === 0) return json({ properties: [] });
        q = q.in('id', ids);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ properties: data });
    }

    if (path === 'properties' && method === 'POST') {
      if (profile?.role !== 'landlord') return json({ error: 'Only landlords can create properties' }, 403);
      const body = await request.json();
      const { data, error } = await admin
        .from('properties')
        .insert({
          landlord_id: user.id,
          address_line1: body.address_line1,
          address_line2: body.address_line2 || null,
          city: body.city || null,
          postcode: body.postcode || null,
          country: body.country || 'UK',
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ property: data }, 201);
    }

    // Single property: /properties/:id
    const propMatch = path.match(/^properties\/([^/]+)$/);
    if (propMatch && method === 'GET') {
      const id = propMatch[1];
      const { data: property } = await admin.from('properties').select('*').eq('id', id).maybeSingle();
      if (!property) return json({ error: 'Not found' }, 404);
      const { data: tenancies } = await admin.from('tenancies').select('*').eq('property_id', id);
      const { data: inventories } = await admin.from('inventories').select('*').eq('property_id', id).order('created_at', { ascending: false });
      const { data: inspections } = await admin.from('inspections').select('*').eq('property_id', id).order('created_at', { ascending: false });
      const { data: issues } = await admin.from('issues').select('*').eq('property_id', id).order('created_at', { ascending: false });
      const { data: compliance } = await admin.from('compliance_items').select('*').eq('property_id', id);
      const { data: contracts } = await admin
        .from('contracts')
        .select('*, tenancies!inner(property_id)')
        .eq('tenancies.property_id', id);
      return json({ property, tenancies: tenancies || [], inventories: inventories || [], inspections: inspections || [], issues: issues || [], compliance: compliance || [], contracts: contracts || [] });
    }

    // ===== TENANCIES =====
    if (path === 'tenancies' && method === 'POST') {
      if (profile?.role !== 'landlord') return json({ error: 'Only landlords can create tenancies' }, 403);
      const body = await request.json();
      // optional: link tenant by email
      let tenant_id = null;
      if (body.tenant_email) {
        const { data: tenantProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', body.tenant_email)
          .maybeSingle();
        if (tenantProfile) tenant_id = tenantProfile.id;
      }
      const { data, error } = await admin
        .from('tenancies')
        .insert({
          property_id: body.property_id,
          landlord_id: user.id,
          tenant_id,
          tenant_email: body.tenant_email || null,
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          rent_amount: body.rent_amount || null,
          rent_frequency: body.rent_frequency || 'monthly',
          deposit_amount: body.deposit_amount || null,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ tenancy: data }, 201);
    }

    // ===== AI: GENERATE INVENTORY =====
    if (path === 'inventories/generate' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, photo_urls } = body;
      if (!property_id || !Array.isArray(photo_urls) || photo_urls.length === 0) {
        return json({ error: 'property_id and photo_urls[] are required' }, 400);
      }
      const ai = await aiInventoryFromPhotos(photo_urls);
      const { data, error } = await admin
        .from('inventories')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          photos_json: photo_urls,
          ai_inventory_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ inventory: data });
    }

    // ===== AI: UPLOAD CONTRACT PDF + PARSE =====
    if (path === 'contracts/upload-and-parse' && method === 'POST') {
      const form = await request.formData();
      const file = form.get('file');
      const tenancy_id = form.get('tenancy_id');
      if (!file || !tenancy_id) return json({ error: 'file and tenancy_id required' }, 400);
      const arrayBuffer = await file.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);

      // Upload to storage
      const filePath = `${user.id}/${tenancy_id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await admin.storage.from('contracts').upload(filePath, buf, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      });
      if (upErr) return json({ error: 'Upload failed: ' + upErr.message }, 400);

      // Extract text
      let rawText = '';
      try {
        if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
          const pdfParse = (await import('pdf-parse')).default;
          const result = await pdfParse(buf);
          rawText = result.text || '';
        } else {
          rawText = buf.toString('utf-8');
        }
      } catch (e) {
        console.error('PDF parse error', e);
        return json({ error: 'Failed to extract text from file: ' + e.message }, 400);
      }
      if (!rawText.trim()) return json({ error: 'No text extracted from document' }, 400);

      const ai = await aiContractParse(rawText);
      const { data: signed } = await admin.storage.from('contracts').createSignedUrl(filePath, 60 * 60 * 24);
      const { data, error } = await admin
        .from('contracts')
        .insert({
          tenancy_id,
          raw_text: rawText.slice(0, 50000),
          file_path: filePath,
          file_url: signed?.signedUrl || null,
          ai_summary_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ contract: data, ai });
    }

    // ===== AI: PARSE CONTRACT (raw text) =====
    if (path === 'contracts/parse' && method === 'POST') {
      const body = await request.json();
      const { tenancy_id, raw_text, file_path, file_url } = body;
      if (!tenancy_id || !raw_text) {
        return json({ error: 'tenancy_id and raw_text are required' }, 400);
      }
      const ai = await aiContractParse(raw_text);
      const { data, error } = await admin
        .from('contracts')
        .insert({
          tenancy_id,
          raw_text: raw_text.slice(0, 50000),
          file_path: file_path || null,
          file_url: file_url || null,
          ai_summary_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ contract: data });
    }

    // ===== AI: COMPARE INSPECTION =====
    if (path === 'inspections/compare' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, before_urls, after_urls } = body;
      if (!property_id || !Array.isArray(before_urls) || !Array.isArray(after_urls)) {
        return json({ error: 'property_id, before_urls[], after_urls[] required' }, 400);
      }
      const ai = await aiCompareInspection(before_urls, after_urls);
      const { data, error } = await admin
        .from('inspections')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          before_photos_json: before_urls,
          after_photos_json: after_urls,
          ai_report_json: ai,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ inspection: data });
    }

    // ===== ISSUES =====
    if (path === 'issues' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, title, description, photo_urls } = body;
      if (!property_id || !title) return json({ error: 'property_id and title required' }, 400);

      let aiDraft = null;
      try {
        aiDraft = await aiDraftIssueMessage(title, description || '', photo_urls || []);
      } catch (e) {
        console.error('AI draft failed', e);
      }

      const { data, error } = await admin
        .from('issues')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          title,
          description: description || null,
          photos_json: photo_urls || [],
          status: 'open',
          ai_drafted_message: aiDraft ? JSON.stringify(aiDraft) : null,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ issue: data, ai_draft: aiDraft }, 201);
    }

    // Update issue status: /issues/:id (PATCH)
    const issueMatch = path.match(/^issues\/([^/]+)$/);
    if (issueMatch && method === 'PATCH') {
      const body = await request.json();
      const { data, error } = await admin
        .from('issues')
        .update({ status: body.status })
        .eq('id', issueMatch[1])
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ issue: data });
    }

    // ===== COMPLIANCE =====
    if (path === 'compliance' && method === 'GET') {
      // Get all compliance items for landlord's properties
      const { data: props } = await admin.from('properties').select('id').eq('landlord_id', user.id);
      const propIds = (props || []).map(p => p.id);
      if (propIds.length === 0) return json({ compliance: [] });
      const { data, error } = await admin
        .from('compliance_items')
        .select('*, properties(address_line1, postcode)')
        .in('property_id', propIds)
        .order('expiry_date', { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ compliance: data });
    }

    if (path === 'compliance' && method === 'POST') {
      const body = await request.json();
      const { data, error } = await admin
        .from('compliance_items')
        .insert({
          property_id: body.property_id,
          type: body.type,
          expiry_date: body.expiry_date,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);
      return json({ compliance: data }, 201);
    }

    // Delete compliance item
    const compDelMatch = path.match(/^compliance\/([^/]+)$/);
    if (compDelMatch && method === 'DELETE') {
      const { error } = await admin.from('compliance_items').delete().eq('id', compDelMatch[1]);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ===== SEND ISSUE EMAIL VIA SENDGRID =====
    const sendIssueMatch = path.match(/^issues\/([^/]+)\/send$/);
    if (sendIssueMatch && method === 'POST') {
      const issueId = sendIssueMatch[1];
      const body = await request.json().catch(() => ({}));
      const recipientEmail = body.to;
      if (!recipientEmail) return json({ error: 'Recipient email required' }, 400);

      const { data: issue } = await admin.from('issues').select('*').eq('id', issueId).maybeSingle();
      if (!issue) return json({ error: 'Issue not found' }, 404);
      if (!issue.ai_drafted_message) return json({ error: 'No AI draft on this issue' }, 400);

      let draft;
      try { draft = JSON.parse(issue.ai_drafted_message); } catch { return json({ error: 'Invalid AI draft' }, 400); }

      if (!process.env.SENDGRID_API_KEY) return json({ error: 'SendGrid not configured' }, 500);

      try {
        await sgMail.send({
          to: recipientEmail,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
          replyTo: user.email,
          subject: draft.subject || `Issue: ${issue.title}`,
          text: draft.body || issue.description || '',
          html: `<p>${(draft.body || issue.description || '').replace(/\n/g, '<br/>')}</p><p><em>Sent via TenantAI on behalf of ${user.email}</em></p>`,
        });
      } catch (e) {
        console.error('SendGrid error', e?.response?.body || e);
        const errorDetail = e?.response?.body?.errors?.[0]?.message || e.message || 'unknown';
        return json({ error: 'Failed to send email: ' + errorDetail }, 500);
      }

      await admin.from('notifications').insert({
        user_id: user.id,
        message: `Email sent to ${recipientEmail} for issue: ${issue.title}`,
        type: 'issue_email_sent',
      });

      return json({ ok: true, sent_to: recipientEmail });
    }

    // ===== ISSUES list =====
    if (path === 'issues' && method === 'GET') {
      let q = admin.from('issues').select('*, properties(address_line1)').order('created_at', { ascending: false });
      if (profile?.role === 'landlord') {
        const { data: props } = await admin.from('properties').select('id').eq('landlord_id', user.id);
        const ids = (props || []).map(p => p.id);
        if (ids.length === 0) return json({ issues: [] });
        q = q.in('property_id', ids);
      } else {
        q = q.eq('created_by', user.id);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ issues: data });
    }

    // ===== AI: RENT PRICE ESTIMATOR =====
    if (path === 'rent/estimate' && method === 'POST') {
      const body = await request.json();
      const { city, postcode, country, bedrooms, bathrooms, property_type, condition, furnishing, extra_details, currency } = body;
      if (!city || bedrooms == null) return json({ error: 'city and bedrooms required' }, 400);
      const cur = currency || 'GBP';
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a professional real estate appraiser with deep knowledge of rental markets worldwide.' },
          { role: 'user', content: `Estimate the monthly rent (in ${cur}) for this property:
- City: ${city}${postcode ? `, postcode ${postcode}` : ''}
- Country: ${country || 'United Kingdom'}
- Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms || 'unknown'}
- Type: ${property_type || 'apartment'}
- Condition: ${condition || 'good'}
- Furnishing: ${furnishing || 'unfurnished'}
- Extra: ${extra_details || 'none'}

Return STRICT JSON:
{
  "currency": "${cur}",
  "conservative": <number>,
  "expected": <number>,
  "optimistic": <number>,
  "confidence": "low|medium|high",
  "comparables_basis": "Short note on what comparable properties typically rent for in this area",
  "factors_increasing_value": ["..."],
  "factors_decreasing_value": ["..."],
  "marketing_tips": ["3-5 short tips to maximize rent"]
}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      });
      return json({ estimate: JSON.parse(resp.choices[0].message.content) });
    }

    // ===== AI: DISPUTE EVIDENCE BUILDER =====
    if (path === 'disputes/build' && method === 'POST') {
      const body = await request.json();
      const { property_id, tenancy_id, dispute_type, tenant_position, landlord_position, language = 'en' } = body;
      if (!property_id || !dispute_type) return json({ error: 'property_id and dispute_type required' }, 400);

      // Pull all relevant evidence we have on file
      const [{ data: prop }, { data: tenancy }, { data: invs }, { data: insps }, { data: issues }, { data: contracts }, { data: compliance }] = await Promise.all([
        admin.from('properties').select('*').eq('id', property_id).maybeSingle(),
        tenancy_id ? admin.from('tenancies').select('*').eq('id', tenancy_id).maybeSingle() : Promise.resolve({ data: null }),
        admin.from('inventories').select('id, ai_inventory_json, created_at').eq('property_id', property_id),
        admin.from('inspections').select('id, ai_report_json, created_at').eq('property_id', property_id),
        admin.from('issues').select('id, title, description, status, ai_drafted_message, created_at').eq('property_id', property_id),
        admin.from('contracts').select('id, ai_summary_json, created_at').eq('tenancy_id', tenancy_id || '00000000-0000-0000-0000-000000000000'),
        admin.from('compliance_items').select('type, expiry_date').eq('property_id', property_id),
      ]);

      const evidenceContext = {
        property: prop ? { address: prop.address_line1, city: prop.city, postcode: prop.postcode } : null,
        tenancy: tenancy ? { start: tenancy.start_date, end: tenancy.end_date, rent: tenancy.rent_amount, deposit: tenancy.deposit_amount } : null,
        contract_summary: contracts?.[0]?.ai_summary_json || null,
        inventories: invs?.map(i => i.ai_inventory_json) || [],
        inspections: insps?.map(i => i.ai_report_json) || [],
        issues: issues || [],
        compliance: compliance || [],
      };

      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert tenancy dispute advisor (UK/international). You build evidence bundles for deposit disputes, eviction defense, repair disputes, and tribunal/court submissions. Respond in language code "' + language + '".' },
          { role: 'user', content: `Build a comprehensive evidence bundle for this dispute.

DISPUTE TYPE: ${dispute_type}
TENANT POSITION: ${tenant_position || 'not provided'}
LANDLORD POSITION: ${landlord_position || 'not provided'}

EVIDENCE ON FILE:
${JSON.stringify(evidenceContext, null, 2)}

Return STRICT JSON:
{
  "executive_summary": "2-3 paragraph summary of dispute and which party has stronger evidence",
  "strongest_evidence": [{"source":"inventory|inspection|issue|contract|compliance", "fact":"...", "supports":"tenant|landlord|neutral"}],
  "weaknesses": [{"party":"tenant|landlord", "weakness":"..."}],
  "missing_evidence": ["Things that would strengthen the case if obtained"],
  "recommended_arguments": {
    "tenant": ["..."],
    "landlord": ["..."]
  },
  "suggested_settlement": "Pragmatic compromise (if applicable)",
  "tribunal_or_court_advice": "What to expect if escalated, including which UK scheme (TDS, DPS, MyDeposits) or court is appropriate",
  "drafted_statement": "A formal 200-400 word statement either party could submit, written in neutral professional tone"
}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 3500,
      });
      const ai = JSON.parse(resp.choices[0].message.content);

      const { data, error } = await admin
        .from('disputes')
        .insert({
          property_id,
          tenancy_id: tenancy_id || null,
          created_by: user.id,
          title: `${dispute_type} dispute`,
          dispute_type,
          tenant_position,
          landlord_position,
          ai_evidence_bundle: ai,
          status: 'open',
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 400);

      // log activity
      await admin.from('activity_logs').insert({
        user_id: user.id,
        property_id,
        tenancy_id: tenancy_id || null,
        action: 'dispute_built',
        entity_type: 'dispute',
        entity_id: data.id,
      }).catch(() => {});

      return json({ dispute: data, ai });
    }

    // ===== DISPUTES list =====
    if (path === 'disputes' && method === 'GET') {
      let q = admin.from('disputes').select('*, properties(address_line1)').order('created_at', { ascending: false });
      if (profile?.role === 'landlord') {
        const { data: props } = await admin.from('properties').select('id').eq('landlord_id', user.id);
        const ids = (props || []).map(p => p.id);
        if (ids.length === 0) return json({ disputes: [] });
        q = q.in('property_id', ids);
      } else {
        q = q.eq('created_by', user.id);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ disputes: data });
    }

    // ===== AI: TENANCY CO-PILOT CHAT =====
    if (path === 'chat' && method === 'POST') {
      const body = await request.json();
      const { messages = [], language = 'en' } = body;
      if (!Array.isArray(messages) || messages.length === 0) return json({ error: 'messages required' }, 400);

      // Build user context (their properties + tenancies + issues + compliance)
      let context = '';
      try {
        if (profile?.role === 'landlord') {
          const { data: props } = await admin.from('properties').select('id, address_line1, city, postcode').eq('landlord_id', user.id);
          context += `User is a LANDLORD named ${profile?.name || user.email}.\nThey own ${props?.length || 0} properties: ${(props||[]).map(p => `${p.address_line1}, ${p.city||''}`).join('; ') || 'none'}.\n`;
          const propIds = (props || []).map(p => p.id);
          if (propIds.length) {
            const { data: tens } = await admin.from('tenancies').select('property_id, tenant_email, rent_amount, rent_frequency, start_date, end_date').in('property_id', propIds);
            context += `Tenancies: ${(tens||[]).map(t=>`${t.tenant_email||'unnamed'} @ ${t.rent_amount}/${t.rent_frequency}`).join('; ') || 'none'}.\n`;
            const { data: iss } = await admin.from('issues').select('title, status').in('property_id', propIds);
            context += `Issues: ${(iss||[]).map(i=>`${i.title} [${i.status}]`).join('; ') || 'none'}.\n`;
            const { data: comp } = await admin.from('compliance_items').select('type, expiry_date').in('property_id', propIds);
            context += `Compliance: ${(comp||[]).map(c=>`${c.type} expires ${c.expiry_date}`).join('; ') || 'none'}.\n`;
          }
        } else {
          const { data: tens } = await admin.from('tenancies').select('property_id, rent_amount, rent_frequency, start_date, end_date, properties(address_line1, city)').eq('tenant_id', user.id);
          context += `User is a TENANT named ${profile?.name || user.email}.\nTheir tenancies: ${(tens||[]).map(t=>`${t.properties?.address_line1} @ ${t.rent_amount}/${t.rent_frequency}`).join('; ') || 'none'}.\n`;
        }
      } catch (e) { console.error('chat context err', e); }

      const sysPrompt = `You are TenantAI, an expert AI assistant for property management and tenancy law. You help landlords and tenants with practical advice, legal context (UK by default unless the user mentions another country), and document drafting. Be concise and helpful.

USER CONTEXT:
${context}

Always respond in language code "${language}".`;

      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: sysPrompt },
          ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 1000,
      });
      return json({ reply: resp.choices[0].message.content });
    }

    return json({ error: `Route /${path} not found` }, 404);
  } catch (err) {
    console.error('API error', err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
