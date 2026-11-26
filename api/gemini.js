// Vercel Serverless Function: /api/gemini
// Proxies requests to Google Gemini API using process.env.GEMINI_API_KEY (or client-provided key)
// so the site owner can store GEMINI_API_KEY securely in Vercel Environment Variables.

const DEFAULT_MODEL = 'gemini-2.5-flash';

function resolveApiKey(clientKey) {
  const direct =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (direct && String(direct).trim()) {
    return String(direct).trim();
  }

  // Fallback: scan process.env in case the variable was named differently (e.g. API_KEY, gemini, etc.)
  for (const [k, v] of Object.entries(process.env || {})) {
    if (typeof v === 'string' && v.trim().startsWith('AIza')) {
      return v.trim();
    }
    if (/gemini/i.test(k) && typeof v === 'string' && v.trim().length > 20) {
      return v.trim();
    }
    if (typeof k === 'string' && k.trim().startsWith('AIza')) {
      return k.trim();
    }
  }

  return clientKey ? String(clientKey).trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsedBody =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { contents, systemInstruction, generationConfig, apiKey: clientKey, model } =
      parsedBody;
    const apiKey = resolveApiKey(clientKey);

    if (!apiKey) {
      return res.status(400).json({
        error: 'MISSING_API_KEY',
        message: 'لم يتم ضبط مفتاح GEMINI_API_KEY في إعدادات Vercel أو داخل الموقع.',
      });
    }

    const targetModel = model || DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = { contents };
    if (systemInstruction) {
      payload.systemInstruction =
        typeof systemInstruction === 'string'
          ? { parts: [{ text: systemInstruction }] }
          : systemInstruction;
    }
    if (generationConfig) {
      payload.generationConfig = generationConfig;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini API request failed',
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Internal server error communicating with Gemini API',
    });
  }
}
