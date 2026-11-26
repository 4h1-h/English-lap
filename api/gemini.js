// Vercel Serverless Function: /api/gemini
// Proxies requests to Google Gemini API using process.env.GEMINI_API_KEY

const MODELS_TO_TRY = ['gemini-3.8-flash', 'gemini-3-flash', 'gemini-2.5-flash'];

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
      const similarEnvKeys = Object.keys(process.env || {}).filter(
        (k) => /gemini|google|key/i.test(k) && !/^VERCEL|^AWS|^ npm/i.test(k)
      );
      return res.status(400).json({
        error: 'MISSING_API_KEY',
        message: `لم يصل مفتاح GEMINI_API_KEY إلى خادم Vercel بعد (${
          similarEnvKeys.length ? `المتغيرات الموجودة: ${similarEnvKeys.join(', ')}` : 'لا يوجد متغير محفوظ في Production'
        }). تأكد من الضغط على Save في صفحة Environment Variables ثم عمل Redeploy.`,
      });
    }

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

    const models = model
      ? [model, ...MODELS_TO_TRY.filter((m) => m !== model)]
      : MODELS_TO_TRY;
    let lastErrorData = null;
    let lastStatus = 500;

    for (const targetModel of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data?.candidates) {
        return res.status(200).json(data);
      }

      lastErrorData = data;
      lastStatus = response.status;
      // Only continue trying fallback models if the error was 404 (model not found/deprecated)
      if (response.status !== 404) {
        break;
      }
    }

    // Use 502 instead of 404 when upstream model isn't found so the client knows /api/gemini itself exists
    const outStatus = lastStatus === 404 ? 502 : lastStatus;
    return res.status(outStatus).json({
      error: lastErrorData?.error?.message || 'Gemini API request failed',
      details: lastErrorData,
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Internal server error communicating with Gemini API',
    });
  }
}
