'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Loader2, Send, Settings, Sun, Moon, Globe, PoundSterling, MessageCircle, FileDown, TrendingUp, Bot, User } from 'lucide-react';
import { t, detectLocale, saveLocale, formatCurrency, SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES } from '@/lib/i18n';

export function useLocaleState() {
  const [loc, setLoc] = useState({ language: 'en', country: 'GB', currency: 'GBP', locale: 'en-GB' });
  useEffect(() => { setLoc(detectLocale()); }, []);
  function update(next) {
    const merged = { ...loc, ...next, locale: `${next.language || loc.language}-${next.country || loc.country}` };
    setLoc(merged);
    saveLocale(merged);
  }
  return { loc, update };
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
      {theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
    </Button>
  );
}

export function SettingsDialog({ loc, onUpdate }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(loc);
  const [loadingPortal, setLoadingPortal] = useState(false);
  useEffect(() => setDraft(loc), [loc, open]);

  function save() {
    onUpdate({ language: draft.language, currency: draft.currency });
    toast.success('Settings saved');
    setOpen(false);
  }

  async function openStripePortal() {
    setLoadingPortal(true);
    try {
      const supabase = (await import('@/lib/supabaseClient')).getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in first'); return; }
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (e) {
      toast.error(e.message || 'Failed to open portal');
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title={t('settings', loc.language)}><Settings className="h-4 w-4"/></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('settings', loc.language)}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4"/>{t('language', loc.language)}</Label>
            <Select value={draft.language} onValueChange={(v)=>setDraft({...draft, language: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-2"><PoundSterling className="h-4 w-4"/>{t('currency', loc.language)}</Label>
            <Select value={draft.currency} onValueChange={(v)=>setDraft({...draft, currency: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c} — {formatCurrency(1000, c, draft.locale)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-2">{theme === 'dark' ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}{t('theme', loc.language)}</Label>
            <Select value={theme || 'light'} onValueChange={setTheme}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('light', loc.language)}</SelectItem>
                <SelectItem value="dark">{t('dark', loc.language)}</SelectItem>
                <SelectItem value="system">{t('system', loc.language)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={openStripePortal} className="w-full bg-brand-500 hover:bg-brand-600 text-white" disabled={loadingPortal}>
              {loadingPortal ? 'Loading…' : 'Manage subscription'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>setOpen(false)}>{t('cancel', loc.language)}</Button>
          <Button onClick={save} className="bg-brand-500 hover:bg-brand-600">{t('save', loc.language)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- AI RENT ESTIMATOR ----------------
export function AIRentEstimator({ properties, loc, api }) {
  const [form, setForm] = useState({ city: '', postcode: '', country: '', bedrooms: '2', bathrooms: '1', property_type: 'apartment', condition: 'good', furnishing: 'unfurnished', extra_details: '' });
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function applyProperty(id) {
    setPropertyId(id);
    const p = properties.find(x => x.id === id);
    if (p) setForm(f => ({ ...f, city: p.city || '', postcode: p.postcode || '', country: p.country || '' }));
  }

  async function estimate() {
    if (!form.city) { toast.error('City required'); return; }
    setLoading(true); setResult(null);
    try {
      const r = await api('rent/estimate', { method: 'POST', body: JSON.stringify({ ...form, bedrooms: parseInt(form.bedrooms), bathrooms: parseInt(form.bathrooms), currency: loc.currency }) });
      setResult(r.estimate);
      toast.success('Estimate ready!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  const lang = loc.language;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-cyan-600"/>{t('aiRent', lang)} — {t('estimateRent', lang)}</CardTitle>
        <CardDescription>{t('rentDesc', lang)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {properties.length > 0 && (
          <div>
            <Label>{t('selectProperty', lang)} (optional)</Label>
            <Select value={propertyId} onValueChange={applyProperty}>
              <SelectTrigger><SelectValue placeholder={t('selectProperty', lang)}/></SelectTrigger>
              <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t('city', lang)}</Label><Input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></div>
          <div><Label>{t('postcode', lang)}</Label><Input value={form.postcode} onChange={(e)=>setForm({...form,postcode:e.target.value})}/></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t('bedrooms', lang)}</Label><Input type="number" min="0" value={form.bedrooms} onChange={(e)=>setForm({...form,bedrooms:e.target.value})}/></div>
          <div><Label>{t('bathrooms', lang)}</Label><Input type="number" min="0" value={form.bathrooms} onChange={(e)=>setForm({...form,bathrooms:e.target.value})}/></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>{t('propertyType', lang)}</Label>
            <Select value={form.property_type} onValueChange={(v)=>setForm({...form,property_type:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">{t('apartment', lang)}</SelectItem>
                <SelectItem value="house">{t('house', lang)}</SelectItem>
                <SelectItem value="studio">{t('studio', lang)}</SelectItem>
                <SelectItem value="room">{t('room', lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t('condition', lang)}</Label>
            <Select value={form.condition} onValueChange={(v)=>setForm({...form,condition:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">{t('excellent', lang)}</SelectItem>
                <SelectItem value="good">{t('good', lang)}</SelectItem>
                <SelectItem value="fair">{t('fair', lang)}</SelectItem>
                <SelectItem value="poor">{t('poor', lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t('furnishing', lang)}</Label>
            <Select value={form.furnishing} onValueChange={(v)=>setForm({...form,furnishing:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="furnished">{t('furnished', lang)}</SelectItem>
                <SelectItem value="unfurnished">{t('unfurnished', lang)}</SelectItem>
                <SelectItem value="part-furnished">{t('partFurnished', lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Notes (optional)</Label><Textarea rows={2} value={form.extra_details} onChange={(e)=>setForm({...form,extra_details:e.target.value})} placeholder="e.g. balcony, parking, near transport"/></div>
        <Button onClick={estimate} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Analyzing market...</> : <><Sparkles className="h-4 w-4 mr-2"/>{t('estimateRent', lang)}</>}
        </Button>
        {result && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">{t('rentLow', lang)}</div>
                <div className="text-xl font-bold text-slate-700">{formatCurrency(result.conservative, result.currency, loc.locale)}</div>
              </div>
              <div className="p-3 bg-cyan-100 border-2 border-cyan-400 rounded-lg">
                <div className="text-xs text-cyan-700 font-semibold">{t('estimatedRent', lang)}</div>
                <div className="text-2xl font-bold text-cyan-700">{formatCurrency(result.expected, result.currency, loc.locale)}</div>
                <div className="text-xs text-cyan-600 mt-1 capitalize">confidence: {result.confidence}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">{t('rentHigh', lang)}</div>
                <div className="text-xl font-bold text-slate-700">{formatCurrency(result.optimistic, result.currency, loc.locale)}</div>
              </div>
            </div>
            {result.comparables_basis && <div className="p-3 bg-blue-50 text-sm text-blue-900 rounded-lg">{result.comparables_basis}</div>}
            {result.factors_increasing_value?.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg"><h4 className="text-sm font-semibold text-green-800 mb-1">↑ Increases value</h4>
                <ul className="text-sm text-green-800 list-disc pl-5">{result.factors_increasing_value.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            )}
            {result.factors_decreasing_value?.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg"><h4 className="text-sm font-semibold text-orange-800 mb-1">↓ Decreases value</h4>
                <ul className="text-sm text-orange-800 list-disc pl-5">{result.factors_decreasing_value.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            )}
            {result.marketing_tips?.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg"><h4 className="text-sm font-semibold text-purple-800 mb-1">💡 Marketing tips</h4>
                <ul className="text-sm text-purple-800 list-disc pl-5">{result.marketing_tips.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- AI CO-PILOT CHAT ----------------
export function AICoPilot({ loc, api }) {
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('tenantai_chat') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { localStorage.setItem('tenantai_chat', JSON.stringify(messages.slice(-50))); }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try {
      const r = await api('chat', { method: 'POST', body: JSON.stringify({ messages: newMsgs, language: loc.language }) });
      setMessages([...newMsgs, { role: 'assistant', content: r.reply }]);
    } catch (e) { toast.error(e.message); setMessages(newMsgs); } finally { setLoading(false); }
  }

  function clearChat() { setMessages([]); }

  const lang = loc.language;
  const suggestions = [
    'How much notice do I need to give my tenant?',
    'What is fair wear and tear?',
    "What's the average rent in my area?",
    'Draft a deposit deduction email',
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-violet-600"/>{t('aiCopilot', lang)}</CardTitle>
            <CardDescription>{t('copilotDesc', lang)}</CardDescription>
          </div>
          {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearChat}>Clear</Button>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 text-violet-300"/>
              <p className="text-sm text-slate-500 mb-4">Ask me anything about your properties or tenancy law.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} className="text-xs p-2 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-left text-slate-700 transition">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4"/></div>}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>{m.content}</div>
              {m.role === 'user' && <div className="h-7 w-7 rounded-full bg-blue-100 text-brand-600 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4"/></div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center"><Bot className="h-4 w-4"/></div>
              <div className="bg-slate-100 rounded-2xl px-4 py-2 text-sm flex gap-1"><span className="animate-pulse">●</span><span className="animate-pulse delay-100">●</span><span className="animate-pulse delay-200">●</span></div>
            </div>
          )}
          <div ref={endRef}/>
        </div>
        <div className="flex gap-2 border-t pt-3">
          <Input placeholder={t('typeMessage', lang)} value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=> e.key === 'Enter' && send()} disabled={loading}/>
          <Button onClick={send} disabled={loading || !input.trim()} className="bg-violet-600 hover:bg-violet-700"><Send className="h-4 w-4"/></Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- AI DISPUTE EVIDENCE BUILDER ----------------
export function AIDisputeBuilder({ properties, loc, api }) {
  const [propertyId, setPropertyId] = useState('');
  const [tenancies, setTenancies] = useState([]);
  const [tenancyId, setTenancyId] = useState('');
  const [disputeType, setDisputeType] = useState('deposit_deduction');
  const [tenantPos, setTenantPos] = useState('');
  const [landlordPos, setLandlordPos] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      if (!propertyId) { setTenancies([]); return; }
      try { const r = await api(`properties/${propertyId}`); setTenancies(r.tenancies || []); } catch {}
    })();
  }, [propertyId, api]);

  async function build() {
    if (!propertyId || !disputeType) { toast.error('Property and dispute type required'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('AI is reviewing all your evidence on file...');
      const r = await api('disputes/build', { method: 'POST', body: JSON.stringify({ property_id: propertyId, tenancy_id: tenancyId || null, dispute_type: disputeType, tenant_position: tenantPos, landlord_position: landlordPos, language: loc.language }) });
      setResult(r.ai);
      toast.success('Evidence bundle ready');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  const lang = loc.language;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-rose-600"/>AI Dispute Evidence Builder</CardTitle>
        <CardDescription>Pulls every inventory, inspection, issue, contract & compliance record we have for this property and builds a tribunal-ready evidence bundle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger><SelectValue placeholder="Select property"/></SelectTrigger>
              <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tenancy (optional)</Label>
            <Select value={tenancyId} onValueChange={setTenancyId}>
              <SelectTrigger><SelectValue placeholder="Select tenancy"/></SelectTrigger>
              <SelectContent>{tenancies.map(t => <SelectItem key={t.id} value={t.id}>{t.tenant_email || 'tenancy'} · {t.start_date}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Dispute type</Label>
          <Select value={disputeType} onValueChange={setDisputeType}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="deposit_deduction">Deposit deduction</SelectItem>
              <SelectItem value="repair_dispute">Repair / disrepair</SelectItem>
              <SelectItem value="eviction_defense">Eviction defense</SelectItem>
              <SelectItem value="rent_arrears">Rent arrears</SelectItem>
              <SelectItem value="unfair_clause">Unfair contract clause</SelectItem>
              <SelectItem value="breach_of_quiet_enjoyment">Breach of quiet enjoyment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Tenant position / claim</Label><Textarea rows={3} value={tenantPos} onChange={(e)=>setTenantPos(e.target.value)} placeholder="e.g. The landlord is withholding £400 for a stain that was there at move-in..."/></div>
        <div><Label>Landlord position / claim</Label><Textarea rows={3} value={landlordPos} onChange={(e)=>setLandlordPos(e.target.value)} placeholder="e.g. The carpet damage was caused by tenant's pet, requires full replacement..."/></div>
        <Button onClick={build} disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Building evidence bundle...</> : <><Sparkles className="h-4 w-4 mr-2"/>Build evidence bundle</>}
        </Button>
        {result && <DisputeResult data={result}/>}
      </CardContent>
    </Card>
  );
}

function DisputeResult({ data }) {
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {data.executive_summary && <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-900"><strong>Executive Summary:</strong><br/>{data.executive_summary}</div>}
      {data.strongest_evidence?.length > 0 && (
        <div className="p-3 border rounded-lg">
          <h4 className="font-semibold text-sm mb-2">⭐ Strongest evidence</h4>
          <div className="space-y-2">{data.strongest_evidence.map((e, i) => (
            <div key={i} className="text-sm flex gap-2"><Badge className={e.supports === 'tenant' ? 'bg-blue-100 text-blue-700' : e.supports === 'landlord' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}>{e.supports}</Badge><span><strong>{e.source}:</strong> {e.fact}</span></div>
          ))}</div>
        </div>
      )}
      {data.weaknesses?.length > 0 && (
        <div className="p-3 border rounded-lg bg-orange-50">
          <h4 className="font-semibold text-sm mb-2 text-orange-800">⚠ Weaknesses</h4>
          <ul className="text-sm space-y-1">{data.weaknesses.map((w, i) => <li key={i}><Badge variant="outline" className="mr-1 capitalize">{w.party}</Badge>{w.weakness}</li>)}</ul>
        </div>
      )}
      {data.missing_evidence?.length > 0 && (
        <div className="p-3 border rounded-lg bg-yellow-50"><h4 className="font-semibold text-sm mb-2 text-yellow-800">📋 Missing evidence that would help</h4><ul className="text-sm list-disc pl-5">{data.missing_evidence.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
      )}
      {data.recommended_arguments && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.recommended_arguments.tenant?.length > 0 && <div className="p-3 border rounded-lg bg-blue-50"><h4 className="font-semibold text-sm mb-2 text-blue-800">Tenant arguments</h4><ul className="text-sm list-disc pl-5">{data.recommended_arguments.tenant.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
          {data.recommended_arguments.landlord?.length > 0 && <div className="p-3 border rounded-lg bg-amber-50"><h4 className="font-semibold text-sm mb-2 text-amber-800">Landlord arguments</h4><ul className="text-sm list-disc pl-5">{data.recommended_arguments.landlord.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
        </div>
      )}
      {data.suggested_settlement && <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-900"><strong>💡 Suggested settlement:</strong> {data.suggested_settlement}</div>}
      {data.tribunal_or_court_advice && <div className="p-3 rounded-lg bg-purple-50 text-sm text-purple-900"><strong>⚖ Tribunal/court advice:</strong> {data.tribunal_or_court_advice}</div>}
      {data.drafted_statement && (
        <div className="p-3 border-2 border-slate-300 rounded-lg bg-white">
          <h4 className="font-semibold text-sm mb-2">📝 Drafted formal statement</h4>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{data.drafted_statement}</pre>
        </div>
      )}
    </div>
  );
}

// Print PDF helper for inventory result
export function PrintInventoryButton({ data, propertyAddress }) {
  function printIt() {
    const html = `<!doctype html><html><head><title>Inventory - ${propertyAddress || ''}</title>
      <style>
        body{font-family:-apple-system,Segoe UI,sans-serif;padding:24px;color:#0f172a}
        h1{font-size:22px;margin:0 0 4px}
        h2{font-size:16px;margin:18px 0 6px;color:#1e40af}
        .header{border-bottom:2px solid #1e40af;padding-bottom:8px;margin-bottom:16px}
        .meta{color:#64748b;font-size:12px}
        table{width:100%;border-collapse:collapse;margin:6px 0 14px}
        th,td{text-align:left;padding:6px 8px;font-size:12px;border-bottom:1px solid #e2e8f0}
        th{background:#f1f5f9}
        .summary{background:#eff6ff;padding:10px;border-radius:6px;font-size:13px;margin-bottom:12px}
        .room-meta{font-size:11px;color:#64748b;margin-bottom:4px}
        .condition{padding:1px 6px;border-radius:3px;font-size:10px;background:#e0e7ff;color:#3730a3}
      </style></head><body>
      <div class="header">
        <h1>Property Inventory Report</h1>
        <div class="meta">${propertyAddress || ''} · Generated ${new Date().toLocaleDateString()} by HomeProof</div>
      </div>
      ${data.summary ? `<div class="summary"><strong>Summary:</strong> ${data.summary}</div>` : ''}
      ${(data.rooms || []).map(room => `
        <h2>${room.name}</h2>
        <div class="room-meta">Walls: ${room.walls_condition || '—'} · Floor: ${room.floor_condition || '—'}</div>
        ${room.overall_notes ? `<p style="font-size:11px;color:#475569;margin:4px 0">${room.overall_notes}</p>` : ''}
        <table><thead><tr><th>Item</th><th>Qty</th><th>Condition</th><th>Notes</th></tr></thead>
        <tbody>${(room.items || []).map(it => `<tr><td>${it.item || ''}</td><td>${it.quantity || ''}</td><td><span class="condition">${it.condition || ''}</span></td><td>${it.notes || ''}</td></tr>`).join('')}</tbody></table>
      `).join('')}
      <p style="margin-top:24px;font-size:10px;color:#94a3b8;text-align:center">Generated by HomeProof — AI-powered tenancy management</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Pop-up blocked'); return; }
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  }
  return <Button variant="outline" size="sm" onClick={printIt}><FileDown className="h-3 w-3 mr-1"/>{t('downloadPdf')}</Button>;
}
