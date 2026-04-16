const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Secure proxy — Groq (free, ultra-fast) ───────────────────────────────────
app.post('/api/propose', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set on server.' });
  }

  const { system, userMessage } = req.body;

  if (!system || !userMessage) {
    return res.status(400).json({ error: 'Missing system or userMessage.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
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

    if (!response.ok) {
      const msg = data.error?.message || 'Groq API error';
      return res.status(response.status).json({ error: msg });
    }

    const text = data.choices?.[0]?.message?.content || '';
    res.json({ text });

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Server error calling Groq API.' });
  }
});

// All other routes serve the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ProposalAI running on port ${PORT}`);
});
