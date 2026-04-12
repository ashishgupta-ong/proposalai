const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Secure proxy for Anthropic API ──────────────────────────────────────────
// The API key never leaves the server. Frontend calls /api/propose instead.
app.post('/api/propose', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server.' });
  }

  const { system, userMessage } = req.body;

  if (!system || !userMessage) {
    return res.status(400).json({ error: 'Missing system or userMessage in request body.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    const text = data.content?.map(b => b.text || '').join('') || '';
    res.json({ text });

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Server error calling Anthropic API.' });
  }
});

// All other routes serve the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ProposalAI running on port ${PORT}`);
});
