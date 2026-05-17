'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Sparkles, FileText, Camera, Wrench, ShieldCheck, LogOut, Plus, Loader2, ArrowRight, CheckCircle2, AlertTriangle, ScanSearch, Home, ChevronLeft, Upload, Send, Trash2, Calendar, Mail } from 'lucide-react';

const supabase = getSupabaseClient();

async function api(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`/api/${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

// Upload a file directly to a public Supabase storage bucket
async function uploadToBucket(bucket, file) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const filePath = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { path: filePath, url: data.publicUrl };
}

function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Building2 className="h-5 w-5"/></div>
            <span className="text-lg font-semibold text-slate-900">TenantAI</span>
          </div>
          <Button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700">Get started <ArrowRight className="ml-2 h-4 w-4"/></Button>
        </div>
      </nav>

      <section className="container mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-5 bg-blue-100 text-blue-700 hover:bg-blue-100">AI-powered tenancy management</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Automate everything after the tenancy <span className="text-blue-600">begins</span>.
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Generate inventories from photos. Read contracts in seconds. Detect damage with AI vision. Track compliance. Built for UK landlords and tenants.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={onGetStarted} size="lg" className="bg-blue-600 hover:bg-blue-700">Start free <ArrowRight className="ml-2 h-4 w-4"/></Button>
              <Button onClick={onGetStarted} variant="outline" size="lg">Sign in</Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[{n:'30s', l:'AI inventory'},{n:'1-click', l:'Contract reading'},{n:'24/7', l:'Damage detection'}].map((s,i)=>(
                <div key={i}><div className="text-2xl font-bold text-slate-900">{s.n}</div><div className="text-sm text-slate-500">{s.l}</div></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1511452885600-a3d2c9148a31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnR8ZW58MHx8fGJsdWV8MTc3ODg3OTEyNXww&ixlib=rb-4.1.0&q=85" alt="Properties" className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"/>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 max-w-xs">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 className="h-5 w-5"/></div>
              <div><div className="text-sm font-semibold text-slate-900">Inventory generated</div><div className="text-xs text-slate-500">12 rooms · 84 items detected</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything tenancy. Powered by AI.</h2>
            <p className="mt-4 text-slate-600">Skip the spreadsheets, paperwork, and disputes. Let AI handle the heavy lifting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {icon:Camera, title:'AI Inventory Generator', desc:'Upload photos. Get a professional room-by-room inventory in 30 seconds.', color:'bg-blue-100 text-blue-600'},
              {icon:FileText, title:'Contract Reader', desc:'Upload tenancy agreement. AI extracts your rights, obligations, and notice periods.', color:'bg-purple-100 text-purple-600'},
              {icon:ScanSearch, title:'Damage Detector', desc:'Compare before/after photos. AI flags new damage and estimates deductions.', color:'bg-amber-100 text-amber-600'},
              {icon:Wrench, title:'Repair Tracker', desc:'Describe an issue. AI drafts a polite, legally-sound email to your landlord.', color:'bg-emerald-100 text-emerald-600'},
              {icon:ShieldCheck, title:'Compliance Engine', desc:'Gas, EPC, EICR — track every certificate. Never miss an expiry date again.', color:'bg-rose-100 text-rose-600'},
              {icon:Building2, title:'Property Portfolio', desc:'Manage multiple properties, tenancies, and documents in one beautiful dashboard.', color:'bg-indigo-100 text-indigo-600'},
            ].map((f, i) => (
              <Card key={i} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4`}><f.icon className="h-6 w-6"/></div>
                  <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Ready to upgrade your tenancy?</h2>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto">Free during beta. No credit card. Set up in 60 seconds.</p>
          <Button onClick={onGetStarted} size="lg" className="mt-8 bg-blue-600 hover:bg-blue-700">Get started free <ArrowRight className="ml-2 h-4 w-4"/></Button>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} TenantAI · AI Tenancy Management</div>
      </footer>
    </div>
  );
}

function AuthPage({ mode, setMode, onSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('landlord');
  const [loading, setLoading] = useState(false);

  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        // Server-side signup (auto-confirms email for smooth UX)
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Signup failed');
        // Now sign in
        const { error: siErr } = await supabase.auth.signInWithPassword({ email, password });
        if (siErr) throw siErr;
        toast.success('Welcome to TenantAI!');
        onSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        onSuccess();
      }
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"><ChevronLeft className="h-4 w-4 mr-1"/>Back to home</button>
        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Building2 className="h-5 w-5"/></div>
              <span className="text-lg font-semibold">TenantAI</span>
            </div>
            <CardTitle>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</CardTitle>
            <CardDescription>{mode === 'signup' ? 'Start automating your tenancies in 60 seconds.' : 'Sign in to your account'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handle} className="space-y-4">
              {mode === 'signup' && (<>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} required/>
                </div>
                <div>
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>)}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} required/>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : (mode === 'signup' ? 'Create account' : 'Sign in')}
              </Button>
            </form>
            <p className="mt-4 text-sm text-center text-slate-600">
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={()=>setMode(mode==='signup'?'login':'signup')} className="text-blue-600 hover:underline font-medium">
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PropertyCreateDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ address_line1: '', address_line2: '', city: '', postcode: '', country: 'UK' });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api('properties', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Property added');
      setOpen(false);
      setForm({ address_line1: '', address_line2: '', city: '', postcode: '', country: 'UK' });
      onCreated();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-2"/>Add property</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a property</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Address line 1</Label><Input value={form.address_line1} onChange={(e)=>setForm({...form,address_line1:e.target.value})}/></div>
          <div><Label>Address line 2</Label><Input value={form.address_line2} onChange={(e)=>setForm({...form,address_line2:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></div>
            <div><Label>Postcode</Label><Input value={form.postcode} onChange={(e)=>setForm({...form,postcode:e.target.value})}/></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading || !form.address_line1} className="bg-blue-600 hover:bg-blue-700">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Add property'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIInventoryTool({ properties }) {
  const [propertyId, setPropertyId] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  function onFiles(e) {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function generate() {
    if (!propertyId || files.length === 0) { toast.error('Pick a property and at least one photo'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('Uploading photos...');
      const uploaded = [];
      for (const f of files) uploaded.push(await uploadToBucket('property-photos', f));
      toast.info('AI is analyzing photos...');
      const { inventory } = await api('inventories/generate', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId, photo_urls: uploaded.map(u => u.url) }),
      });
      setResult(inventory.ai_inventory_json);
      toast.success('Inventory generated!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-blue-600"/>AI Inventory Generator</CardTitle>
        <CardDescription>Upload property photos. AI will generate a complete room-by-room inventory.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Property</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder="Select a property"/></SelectTrigger>
            <SelectContent>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address_line1}{p.postcode ? `, ${p.postcode}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Photos (you can select multiple)</Label>
          <Input type="file" accept="image/*" multiple onChange={onFiles}/>
        </div>
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-2">{previews.map((u,i)=><img key={i} src={u} className="h-20 w-full object-cover rounded"/>)}</div>
        )}
        <Button onClick={generate} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Generating...</> : <><Sparkles className="h-4 w-4 mr-2"/>Generate inventory</>}
        </Button>
        {result && <InventoryResult data={result}/>}
      </CardContent>
    </Card>
  );
}

function InventoryResult({ data }) {
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {data.summary && <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-900"><strong>Summary:</strong> {data.summary}</div>}
      {(data.rooms || []).map((room, i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900">{room.name}</h4>
            <div className="flex gap-1 text-xs">
              {room.walls_condition && <Badge variant="outline">walls: {room.walls_condition}</Badge>}
              {room.floor_condition && <Badge variant="outline">floor: {room.floor_condition}</Badge>}
            </div>
          </div>
          {room.overall_notes && <p className="text-xs text-slate-600 mb-2">{room.overall_notes}</p>}
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs"><th className="py-1">Item</th><th>Qty</th><th>Condition</th><th>Notes</th></tr></thead>
            <tbody>{(room.items||[]).map((it,j) => (
              <tr key={j} className="border-t"><td className="py-1.5">{it.item}</td><td>{it.quantity}</td><td><ConditionBadge c={it.condition}/></td><td className="text-slate-600 text-xs">{it.notes}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function ConditionBadge({ c }) {
  const map = { excellent: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700', poor: 'bg-orange-100 text-orange-700', damaged: 'bg-red-100 text-red-700' };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[c] || 'bg-slate-100 text-slate-700'}`}>{c}</span>;
}

function AIContractTool({ properties }) {
  const [tenancyId, setTenancyId] = useState('');
  const [tenancies, setTenancies] = useState([]);
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const all = [];
      for (const p of properties) {
        try { const r = await api(`properties/${p.id}`); for (const t of (r.tenancies||[])) all.push({ ...t, property: p }); } catch {}
      }
      setTenancies(all);
    })();
  }, [properties]);

  async function uploadAndParse() {
    if (!tenancyId || !file) { toast.error('Pick a tenancy and a PDF'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('Uploading & extracting text...');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenancy_id', tenancyId);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/contracts/upload-and-parse', { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${session.access_token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setResult(json.ai);
      toast.success('Contract analyzed!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function parseText() {
    if (!tenancyId || !rawText.trim()) { toast.error('Pick a tenancy and paste text'); return; }
    setLoading(true); setResult(null);
    try {
      const { contract } = await api('contracts/parse', { method: 'POST', body: JSON.stringify({ tenancy_id: tenancyId, raw_text: rawText }) });
      setResult(contract.ai_summary_json);
      toast.success('Contract analyzed!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-purple-600"/>AI Contract Reader</CardTitle>
        <CardDescription>Upload a tenancy agreement PDF (or paste text). AI extracts rights, obligations, and red flags.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Tenancy</Label>
          <Select value={tenancyId} onValueChange={setTenancyId}>
            <SelectTrigger><SelectValue placeholder="Select a tenancy"/></SelectTrigger>
            <SelectContent>
              {tenancies.map(t => <SelectItem key={t.id} value={t.id}>{t.property.address_line1} · {t.tenant_email || 'no tenant'}</SelectItem>)}
            </SelectContent>
          </Select>
          {tenancies.length === 0 && <p className="text-xs text-slate-500 mt-1">Create a tenancy first (in Properties tab).</p>}
        </div>
        <Tabs defaultValue="pdf">
          <TabsList><TabsTrigger value="pdf">Upload PDF</TabsTrigger><TabsTrigger value="text">Paste text</TabsTrigger></TabsList>
          <TabsContent value="pdf" className="space-y-3">
            <Input type="file" accept=".pdf,application/pdf" onChange={(e)=>setFile(e.target.files?.[0]||null)}/>
            <Button onClick={uploadAndParse} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Analyzing...</> : <><Upload className="h-4 w-4 mr-2"/>Upload & analyze</>}
            </Button>
          </TabsContent>
          <TabsContent value="text" className="space-y-3">
            <Textarea rows={8} placeholder="Paste contract text here..." value={rawText} onChange={(e)=>setRawText(e.target.value)}/>
            <Button onClick={parseText} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2"/>Analyze contract</>}
            </Button>
          </TabsContent>
        </Tabs>
        {result && <ContractResult data={result}/>}
      </CardContent>
    </Card>
  );
}

function ContractResult({ data }) {
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {data.plain_english_summary && <div className="p-3 rounded-lg bg-purple-50 text-sm text-purple-900">{data.plain_english_summary}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ListBlock title="Your rights" items={data.tenant_rights} color="green"/>
        <ListBlock title="Your obligations" items={data.tenant_obligations} color="blue"/>
        <ListBlock title="Landlord rights" items={data.landlord_rights} color="slate"/>
        <ListBlock title="Landlord obligations" items={data.landlord_obligations} color="slate"/>
      </div>
      {data.notice_periods && (
        <div className="p-3 border rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Notice periods</h4>
          <p className="text-sm text-slate-600">Tenant → Landlord: {data.notice_periods.tenant_to_landlord || '—'}</p>
          <p className="text-sm text-slate-600">Landlord → Tenant: {data.notice_periods.landlord_to_tenant || '—'}</p>
        </div>
      )}
      {data.red_flags && data.red_flags.length > 0 && (
        <div className="p-3 border-2 border-red-200 bg-red-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/>Red flags</h4>
          <ul className="text-sm text-red-800 list-disc pl-5 space-y-1">{data.red_flags.map((r,i)=><li key={i}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function ListBlock({ title, items, color }) {
  const c = { green: 'bg-green-50 border-green-200', blue: 'bg-blue-50 border-blue-200', slate: 'bg-slate-50 border-slate-200' }[color];
  return (
    <div className={`p-3 border rounded-lg ${c}`}>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <ul className="text-sm space-y-1 list-disc pl-4">{(items||[]).map((x,i)=><li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function AIDamageDetector({ properties }) {
  const [propertyId, setPropertyId] = useState('');
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function compare() {
    if (!propertyId || beforeFiles.length === 0 || afterFiles.length === 0) { toast.error('Pick property and both photo sets'); return; }
    setLoading(true); setResult(null);
    try {
      toast.info('Uploading photos...');
      const beforeUrls = []; for (const f of beforeFiles) beforeUrls.push((await uploadToBucket('inspections', f)).url);
      const afterUrls = []; for (const f of afterFiles) afterUrls.push((await uploadToBucket('inspections', f)).url);
      toast.info('AI is comparing photos...');
      const { inspection } = await api('inspections/compare', { method: 'POST', body: JSON.stringify({ property_id: propertyId, before_urls: beforeUrls, after_urls: afterUrls }) });
      setResult(inspection.ai_report_json);
      toast.success('Inspection report ready!');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5 text-amber-600"/>AI Damage Detector</CardTitle>
        <CardDescription>Upload BEFORE (move-in) and AFTER (move-out) photos. AI flags new damage and estimates deductions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Property</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger><SelectValue placeholder="Select a property"/></SelectTrigger>
            <SelectContent>
              {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>BEFORE photos (move-in)</Label>
            <Input type="file" multiple accept="image/*" onChange={(e)=>setBeforeFiles(Array.from(e.target.files||[]))}/>
            {beforeFiles.length > 0 && <p className="text-xs text-slate-500 mt-1">{beforeFiles.length} selected</p>}
          </div>
          <div>
            <Label>AFTER photos (move-out)</Label>
            <Input type="file" multiple accept="image/*" onChange={(e)=>setAfterFiles(Array.from(e.target.files||[]))}/>
            {afterFiles.length > 0 && <p className="text-xs text-slate-500 mt-1">{afterFiles.length} selected</p>}
          </div>
        </div>
        <Button onClick={compare} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Comparing...</> : <><Sparkles className="h-4 w-4 mr-2"/>Detect damage</>}
        </Button>
        {result && <DamageResult data={result}/>}
      </CardContent>
    </Card>
  );
}

function DamageResult({ data }) {
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <div className="p-3 rounded-lg bg-amber-50 text-sm text-amber-900">{data.overall_assessment}</div>
      {data.total_estimated_deduction_gbp != null && (
        <div className="flex items-center justify-between p-3 border-2 border-amber-300 rounded-lg">
          <span className="font-semibold">Estimated deposit deduction</span>
          <span className="text-xl font-bold text-amber-700">£{data.total_estimated_deduction_gbp}</span>
        </div>
      )}
      {(data.damages||[]).map((d,i) => (
        <div key={i} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{d.location} — {d.type}</span>
            <Badge className={d.severity==='severe'?'bg-red-100 text-red-700':d.severity==='moderate'?'bg-orange-100 text-orange-700':'bg-yellow-100 text-yellow-700'}>{d.severity}</Badge>
          </div>
          <p className="text-xs text-slate-600 mt-1">{d.evidence}</p>
          {d.estimated_cost_gbp != null && <p className="text-sm font-medium mt-1">Est. cost: £{d.estimated_cost_gbp}</p>}
        </div>
      ))}
      {data.fair_wear_and_tear?.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-1">Fair wear & tear (no deduction)</h4>
          <ul className="text-sm text-slate-600 list-disc pl-4">{data.fair_wear_and_tear.map((x,i)=><li key={i}>{x}</li>)}</ul>
        </div>
      )}
      {data.recommendation && <div className="p-3 bg-blue-50 text-sm text-blue-900 rounded-lg">{data.recommendation}</div>}
    </div>
  );
}

function TenancyDialog({ propertyId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tenant_email: '', start_date: '', end_date: '', rent_amount: '', rent_frequency: 'monthly', deposit_amount: '' });
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    try {
      await api('tenancies', { method: 'POST', body: JSON.stringify({ ...form, property_id: propertyId, rent_amount: parseFloat(form.rent_amount)||null, deposit_amount: parseFloat(form.deposit_amount)||null }) });
      toast.success('Tenancy created');
      setOpen(false); onCreated();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1"/>Add tenancy</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New tenancy</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tenant email</Label><Input value={form.tenant_email} onChange={(e)=>setForm({...form,tenant_email:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e)=>setForm({...form,start_date:e.target.value})}/></div>
            <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e)=>setForm({...form,end_date:e.target.value})}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Rent (£)</Label><Input type="number" value={form.rent_amount} onChange={(e)=>setForm({...form,rent_amount:e.target.value})}/></div>
            <div><Label>Deposit (£)</Label><Input type="number" value={form.deposit_amount} onChange={(e)=>setForm({...form,deposit_amount:e.target.value})}/></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:'Create'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyCard({ property, onChanged }) {
  const [detail, setDetail] = useState(null);
  const load = useCallback(async () => { try { const r = await api(`properties/${property.id}`); setDetail(r); } catch(e){ toast.error(e.message); } }, [property.id]);
  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{property.address_line1}</CardTitle>
        <CardDescription>{[property.city, property.postcode].filter(Boolean).join(' · ')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{detail?.tenancies?.length || 0} tenancies</Badge>
          <Badge variant="outline">{detail?.inventories?.length || 0} inventories</Badge>
          <Badge variant="outline">{detail?.contracts?.length || 0} contracts</Badge>
          <Badge variant="outline">{detail?.issues?.length || 0} issues</Badge>
        </div>
        <TenancyDialog propertyId={property.id} onCreated={()=>{load(); onChanged();}}/>
        {detail?.tenancies?.length > 0 && (
          <div className="text-xs text-slate-600 space-y-1">
            {detail.tenancies.map(t => <div key={t.id} className="border rounded p-2">Tenant: {t.tenant_email||'—'} · £{t.rent_amount}/{t.rent_frequency}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComplianceTab({ properties }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ property_id: '', type: 'Gas Safety Certificate', expiry_date: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api('compliance'); setItems(r.compliance || []); } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.property_id || !form.expiry_date) { toast.error('Property and expiry date required'); return; }
    setSaving(true);
    try {
      await api('compliance', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Compliance item added');
      setOpen(false); setForm({ property_id: '', type: 'Gas Safety Certificate', expiry_date: '' });
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function remove(id) {
    try { await api(`compliance/${id}`, { method: 'DELETE' }); toast.success('Removed'); load(); }
    catch (e) { toast.error(e.message); }
  }

  function daysUntil(d) {
    if (!d) return null;
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  }
  function urgency(days) {
    if (days == null) return 'bg-slate-100 text-slate-700';
    if (days < 0) return 'bg-red-100 text-red-700';
    if (days < 30) return 'bg-orange-100 text-orange-700';
    if (days < 90) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-rose-600"/>Compliance Tracker</CardTitle>
          <CardDescription>Gas, EPC, EICR, deposit protection — never miss an expiry.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-rose-600 hover:bg-rose-700"><Plus className="h-4 w-4 mr-2"/>Add item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add compliance item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={(v)=>setForm({...form,property_id:v})}>
                  <SelectTrigger><SelectValue placeholder="Select property"/></SelectTrigger>
                  <SelectContent>{properties.map(p=><SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v)=>setForm({...form,type:v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gas Safety Certificate">Gas Safety Certificate (CP12)</SelectItem>
                    <SelectItem value="EPC">Energy Performance Certificate (EPC)</SelectItem>
                    <SelectItem value="EICR">Electrical Installation (EICR)</SelectItem>
                    <SelectItem value="PAT Testing">PAT Testing</SelectItem>
                    <SelectItem value="Deposit Protection">Deposit Protection</SelectItem>
                    <SelectItem value="Landlord Insurance">Landlord Insurance</SelectItem>
                    <SelectItem value="Selective Licensing">Selective Licensing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Expiry date</Label><Input type="date" value={form.expiry_date} onChange={(e)=>setForm({...form,expiry_date:e.target.value})}/></div>
            </div>
            <DialogFooter><Button onClick={add} disabled={saving} className="bg-rose-600 hover:bg-rose-700">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:'Add'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2"/>Loading...</div>
          : items.length === 0 ? <div className="text-center py-8 text-slate-500"><Calendar className="h-12 w-12 mx-auto mb-2 text-slate-300"/>No compliance items yet.</div>
          : <div className="space-y-2">{items.map(it => {
              const d = daysUntil(it.expiry_date);
              return (
                <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{it.type}</div>
                    <div className="text-xs text-slate-500">{it.properties?.address_line1} {it.properties?.postcode && `· ${it.properties.postcode}`}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">{it.expiry_date}</div>
                      <Badge className={urgency(d)}>{d != null ? (d < 0 ? `${Math.abs(d)}d overdue` : `in ${d}d`) : 'no date'}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={()=>remove(it.id)}><Trash2 className="h-4 w-4 text-slate-400"/></Button>
                  </div>
                </div>
              );
            })}</div>
        }
      </CardContent>
    </Card>
  );
}

function IssuesTab({ properties, profile }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const [sendOpen, setSendOpen] = useState(null);
  const [sendTo, setSendTo] = useState('');

  const load = useCallback(async () => {
    try { const r = await api('issues'); setIssues(r.issues || []); } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.property_id || !form.title) { toast.error('Property and title required'); return; }
    setSaving(true);
    try {
      const urls = [];
      for (const f of files) urls.push((await uploadToBucket('issues', f)).url);
      await api('issues', { method: 'POST', body: JSON.stringify({ ...form, photo_urls: urls }) });
      toast.success('Issue reported. AI draft ready!');
      setOpen(false); setForm({ property_id: '', title: '', description: '' }); setFiles([]);
      load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function updateStatus(id, status) {
    try { await api(`issues/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (e) { toast.error(e.message); }
  }

  async function sendEmail(id) {
    try {
      await api(`issues/${id}/send`, { method: 'POST', body: JSON.stringify({ to: sendTo }) });
      toast.success(`Email sent to ${sendTo}`);
      setSendOpen(null); setSendTo('');
    } catch (e) { toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-emerald-600"/>Repair & Issues</CardTitle>
          <CardDescription>Report issues. AI drafts professional repair emails automatically.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2"/>Report issue</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report an issue</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Property</Label>
                <Select value={form.property_id} onValueChange={(v)=>setForm({...form,property_id:v})}>
                  <SelectTrigger><SelectValue placeholder="Select property"/></SelectTrigger>
                  <SelectContent>{properties.map(p=><SelectItem key={p.id} value={p.id}>{p.address_line1}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="e.g. Leaking kitchen tap"/></div>
              <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="Describe the issue..."/></div>
              <div><Label>Photos (optional)</Label><Input type="file" multiple accept="image/*" onChange={(e)=>setFiles(Array.from(e.target.files||[]))}/></div>
            </div>
            <DialogFooter><Button onClick={create} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Drafting...</>:<><Sparkles className="h-4 w-4 mr-2"/>Submit & draft</>}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2"/>Loading...</div>
          : issues.length === 0 ? <div className="text-center py-8 text-slate-500"><Wrench className="h-12 w-12 mx-auto mb-2 text-slate-300"/>No issues reported yet.</div>
          : <div className="space-y-3">{issues.map(i => {
              let draft = null;
              try { draft = i.ai_drafted_message ? JSON.parse(i.ai_drafted_message) : null; } catch {}
              const statusColor = i.status === 'open' ? 'bg-red-100 text-red-700' : i.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
              return (
                <div key={i.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{i.title}</h4>
                      <p className="text-xs text-slate-500">{i.properties?.address_line1}</p>
                    </div>
                    <div className="flex gap-1">
                      {draft?.urgency && <Badge variant="outline" className="capitalize">{draft.urgency}</Badge>}
                      <Badge className={`capitalize ${statusColor}`}>{i.status}</Badge>
                    </div>
                  </div>
                  {i.description && <p className="text-sm text-slate-600 mb-2">{i.description}</p>}
                  {draft && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded">
                      <div className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3"/>AI-drafted email</div>
                      <div className="text-xs text-slate-700"><strong>Subject:</strong> {draft.subject}</div>
                      <pre className="text-xs text-slate-700 mt-1 whitespace-pre-wrap font-sans">{draft.body}</pre>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {i.status !== 'closed' && (
                      <Select value={i.status} onValueChange={(v)=>updateStatus(i.id, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {draft && (
                      <Dialog open={sendOpen === i.id} onOpenChange={(o)=>setSendOpen(o?i.id:null)}>
                        <DialogTrigger asChild><Button size="sm" variant="outline"><Mail className="h-3 w-3 mr-1"/>Email this</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Send issue email</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div><Label>Recipient email</Label><Input type="email" value={sendTo} onChange={(e)=>setSendTo(e.target.value)} placeholder="landlord@example.com"/></div>
                            <p className="text-xs text-slate-500">The AI-drafted email below will be sent via SendGrid with reply-to set to your email.</p>
                          </div>
                          <DialogFooter><Button onClick={()=>sendEmail(i.id)} disabled={!sendTo} className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-3 w-3 mr-1"/>Send</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              );
            })}</div>
        }
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-5 w-5"/></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard({ user, profile, onSignOut }) {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ properties: 0, tenancies: 0, openIssues: 0, expiringCompliance: 0 });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [pr, iss, comp] = await Promise.all([
        api('properties').catch(() => ({ properties: [] })),
        api('issues').catch(() => ({ issues: [] })),
        api('compliance').catch(() => ({ compliance: [] })),
      ]);
      setProperties(pr.properties || []);
      // count tenancies across properties (light fetch)
      let totalTen = 0;
      for (const p of pr.properties || []) {
        try { const r = await api(`properties/${p.id}`); totalTen += (r.tenancies || []).length; } catch {}
      }
      const openIssues = (iss.issues || []).filter(i => i.status !== 'closed').length;
      const expiring = (comp.compliance || []).filter(c => {
        if (!c.expiry_date) return false;
        const d = Math.ceil((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return d < 60;
      }).length;
      setStats({ properties: (pr.properties || []).length, tenancies: totalTen, openIssues, expiringCompliance: expiring });
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Building2 className="h-5 w-5"/></div>
            <span className="text-lg font-semibold">TenantAI</span>
            <Badge variant="outline" className="ml-2 capitalize">{profile?.role}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={onSignOut}><LogOut className="h-4 w-4 mr-1"/>Sign out</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.name || user.email.split('@')[0]}</h1>
            <p className="text-slate-600 text-sm">Manage your properties and tenancies with AI.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Building2} label="Properties" value={stats.properties} color="bg-blue-100 text-blue-600"/>
          <StatCard icon={Home} label="Active tenancies" value={stats.tenancies} color="bg-indigo-100 text-indigo-600"/>
          <StatCard icon={Wrench} label="Open issues" value={stats.openIssues} color="bg-emerald-100 text-emerald-600"/>
          <StatCard icon={ShieldCheck} label="Expiring < 60d" value={stats.expiringCompliance} color="bg-rose-100 text-rose-600"/>
        </div>

        <Tabs defaultValue="properties">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="properties"><Home className="h-4 w-4 mr-2"/>Properties</TabsTrigger>
            <TabsTrigger value="inventory"><Camera className="h-4 w-4 mr-2"/>AI Inventory</TabsTrigger>
            <TabsTrigger value="contract"><FileText className="h-4 w-4 mr-2"/>AI Contract</TabsTrigger>
            <TabsTrigger value="damage"><ScanSearch className="h-4 w-4 mr-2"/>AI Damage</TabsTrigger>
            <TabsTrigger value="issues"><Wrench className="h-4 w-4 mr-2"/>Issues</TabsTrigger>
            {profile?.role === 'landlord' && <TabsTrigger value="compliance"><ShieldCheck className="h-4 w-4 mr-2"/>Compliance</TabsTrigger>}
          </TabsList>

          <TabsContent value="properties">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your properties</h2>
              {profile?.role === 'landlord' && <PropertyCreateDialog onCreated={loadAll}/>}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2"/>Loading...</div>
            ) : properties.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-slate-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300"/>
                <p>{profile?.role === 'landlord' ? 'No properties yet. Add your first one above.' : 'You have no tenancies yet. Ask your landlord to add you.'}</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(p => <PropertyCard key={p.id} property={p} onChanged={loadAll}/>)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory"><AIInventoryTool properties={properties}/></TabsContent>
          <TabsContent value="contract"><AIContractTool properties={properties}/></TabsContent>
          <TabsContent value="damage"><AIDamageDetector properties={properties}/></TabsContent>
          <TabsContent value="issues"><IssuesTab properties={properties} profile={profile}/></TabsContent>
          {profile?.role === 'landlord' && <TabsContent value="compliance"><ComplianceTab properties={properties}/></TabsContent>}
        </Tabs>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState('loading');
  const [authMode, setAuthMode] = useState('signup');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const { user: u, profile: p } = await api('me');
      setUser(u); setProfile(p);
      setView('dashboard');
    } catch (e) {
      console.error('me error', e);
      setView('landing');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile();
      else setView('landing');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) loadProfile();
      else { setUser(null); setProfile(null); setView('landing'); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  async function signOut() { await supabase.auth.signOut(); }

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600"/></div>;
  if (view === 'landing') return <Landing onGetStarted={()=>{setAuthMode('signup'); setView('auth');}}/>;
  if (view === 'auth') return <AuthPage mode={authMode} setMode={setAuthMode} onSuccess={loadProfile} onBack={()=>setView('landing')}/>;
  if (view === 'dashboard' && user) return <Dashboard user={user} profile={profile} onSignOut={signOut}/>;
  return null;
}

export default App;
