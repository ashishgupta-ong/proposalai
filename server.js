const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Supabase helper ──────────────────────────────────────────────────────────
const supabaseUrl = () => process.env.SUPABASE_URL;
const supabaseKey = () => process.env.SUPABASE_ANON_KEY;

function db(table) {
  const base = () => `${supabaseUrl()}/rest/v1/${table}`;
  const headers = () => ({
    'Content-Type': 'application/json',
    'apikey': supabaseKey(),
    'Authorization': `Bearer ${supabaseKey()}`,
    'Prefer': 'return=representation',
  });
  return {
    async getAll() {
      const r = await fetch(`${base()}?order=created_at.asc`, { headers: headers() });
      return r.json();
    },
    async insert(data) {
      const r = await fetch(base(), { method: 'POST', headers: headers(), body: JSON.stringify(data) });
      return r.json();
    },
    async update(id, data) {
      const r = await fetch(`${base()}?id=eq.${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) });
      return r.json();
    },
    async del(id) {
      const r = await fetch(`${base()}?id=eq.${id}`, { method: 'DELETE', headers: headers() });
      return r.ok;
    },
    async bulkInsert(rows) {
      const h = { ...headers(), 'Prefer': 'resolution=merge-duplicates,return=representation' };
      const r = await fetch(base(), { method: 'POST', headers: h, body: JSON.stringify(rows) });
      return r.json();
    }
  };
}

// ─── DEVELOPERS API ───────────────────────────────────────────────────────────
app.get('/api/developers', async (req, res) => {
  try { res.json(await db('developers').getAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developers', async (req, res) => {
  try {
    const { name, role, skills, bio, rate } = req.body;
    const data = await db('developers').insert({ name, role, skills, bio, rate });
    res.json(data[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/developers/:id', async (req, res) => {
  try {
    const { name, role, skills, bio, rate } = req.body;
    const data = await db('developers').update(req.params.id, { name, role, skills, bio, rate });
    res.json(data[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/developers/:id', async (req, res) => {
  try { await db('developers').del(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PORTFOLIO API ────────────────────────────────────────────────────────────
app.get('/api/portfolio', async (req, res) => {
  try { res.json(await db('portfolio').getAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/portfolio', async (req, res) => {
  try {
    const { title, desc, description, tags } = req.body;
    const data = await db('portfolio').insert({ title, description: description||desc, tags });
    res.json(data[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/portfolio/bulk', async (req, res) => {
  try {
    const { projects } = req.body;
    const data = await db('portfolio').bulkInsert(projects);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/portfolio/:id', async (req, res) => {
  try { await db('portfolio').del(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PROPOSAL GENERATION — Groq (free) ───────────────────────────────────────
app.post('/api/propose', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set on server.' });

  const { system, userMessage } = req.body;
  if (!system || !userMessage) return res.status(400).json({ error: 'Missing system or userMessage.' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Groq API error' });
    res.json({ text: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Server error calling Groq API.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`ProposalAI running on port ${PORT}`));
