function toTitleCase(str) {
  if (!str) return str;
  return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { image, mediaType } = body || {};

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `Parse this workout table into JSON. Return ONLY the raw JSON object — no markdown, no explanation.

{
  "name": "workout name from the image, or 'Scanned Workout' if not visible",
  "exercises": [
    { "name": "Exercise Name", "sets": 3, "reps": 10, "restSeconds": 90 }
  ]
}

Rules:
- For rest given as a range like "2-3MIN", use the lower bound in seconds (2 × 60 = 120)
- If no rest is shown, use 90
- Ignore RPE or any columns other than exercise name, sets, reps, and rest
- Return only the JSON object, nothing else`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'Upstream API error' });
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || '').trim();
    const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Normalize casing: title case for workout name and all exercise names
    parsed.name = toTitleCase(parsed.name);
    if (Array.isArray(parsed.exercises)) {
      parsed.exercises = parsed.exercises.map(ex => ({
        ...ex,
        name: toTitleCase(ex.name)
      }));
    }

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to parse workout image' });
  }
}
