// Vercel Serverless Function: /api/gemini
// Proxies requests to Google Gemini API using process.env.GEMINI_API_KEY
// Includes automatic fallback across available Gemini models if one model has a 503 demand spike.

const PRIMARY_MODELS = [
  'gemini-3.8-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.8-pro',
];

function resolveApiKey(clientKey) {
  const direct =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (direct && String(direct).trim()) {
    return String(direct).trim();
  }

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

async function discoverAvailableModels(apiKey, triedSet) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const models = (data?.models || [])
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          /gemini/i.test(m.name) &&
          !/embedding|imagen|veo|tts|audio|vision|aqa/i.test(m.name)
      )
      .map((m) => m.name.replace(/^models\//, ''))
      .filter((name) => !triedSet.has(name));

    // Prioritize flash-lite and flash models for speed and availability
    models.sort((a, b) => {
      const score = (n) =>
        /flash-lite/i.test(n) ? 0 : /flash/i.test(n) ? 1 : /pro/i.test(n) ? 2 : 3;
      return score(a) - score(b);
    });
    return models.slice(0, 4);
  } catch {
    return [];
  }
}

async function tryGenerateWithModel(targetModel, apiKey, payload, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json();
    return { ok: response.ok && Boolean(data?.candidates), status: response.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 503,
      data: { error: { message: err?.name === 'AbortError' ? 'Model timed out' : err?.message } },
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsedBody =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { contents, systemInstruction, generationConfig, apiKey: clientKey } = parsedBody;
    const apiKey = resolveApiKey(clientKey);

    if (!apiKey) {
      return res.status(400).json({
        error: 'MISSING_API_KEY',
        message: 'لم يصل مفتاح GEMINI_API_KEY إلى خادم Vercel بعد.',
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

    const tried = new Set();
    let lastErrorData = null;
    let lastStatus = 500;

    // 1. Try primary models first
    for (const targetModel of PRIMARY_MODELS) {
      tried.add(targetModel);
      const result = await tryGenerateWithModel(targetModel, apiKey, payload);
      if (result.ok) {
        return res.status(200).json(result.data);
      }
      lastErrorData = result.data;
      lastStatus = result.status;
      if (![404, 429, 500, 502, 503, 504].includes(result.status)) {
        break;
      }
    }

    // 2. If primary models returned 404/503/429, dynamically discover available models from the API
    if ([404, 429, 500, 502, 503, 504].includes(lastStatus)) {
      const discovered = await discoverAvailableModels(apiKey, tried);
      for (const targetModel of discovered) {
        tried.add(targetModel);
        const result = await tryGenerateWithModel(targetModel, apiKey, payload);
        if (result.ok) {
          return res.status(200).json(result.data);
        }
        lastErrorData = result.data;
        lastStatus = result.status;
      }
    }

    const outStatus = lastStatus === 404 ? 502 : lastStatus;
    return res.status(outStatus).json({
      error:
        lastStatus === 503
          ? 'خوادم Gemini تشهد ضغطاً مؤقتاً حالياً، يرجى المحاولة مرة أخرى بعد ثوانٍ.'
          : lastErrorData?.error?.message || 'Gemini API request failed',
      details: lastErrorData,
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Internal server error communicating with Gemini API',
    });
  }
}
