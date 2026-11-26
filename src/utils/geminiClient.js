// Client helper for all 5 Gemini AI educational features in English Spelling Pro.
// Calls /api/gemini on Vercel first (which uses server-side GEMINI_API_KEY),
// and falls back to direct Gemini REST API call when running locally or using a browser-saved key.

import { createWordItem } from './wordFileParser';

const STORAGE_GEMINI_KEY = 'esp_gemini_api_key_v1';
const MODEL_NAME = 'gemini-3.8-flash';

export function getSavedGeminiKey() {
  try {
    return localStorage.getItem(STORAGE_GEMINI_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }
}

export function saveGeminiKey(key) {
  try {
    const trimmed = String(key || '').trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_GEMINI_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_GEMINI_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function callGemini({ contents, systemInstruction, generationConfig }) {
  const clientKey = getSavedGeminiKey();

  // 1. Try Vercel Serverless Function (/api/gemini) first
  let shouldFallbackToDirect = false;
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction,
        generationConfig,
        apiKey: clientKey || undefined,
        model: MODEL_NAME,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || !contentType.includes('application/json')) {
      // Running locally on Vite dev server without /api/gemini
      shouldFallbackToDirect = true;
    } else {
      const data = await res.json();
      if (res.ok && data?.candidates) {
        return extractTextFromResponse(data);
      }
      if (data?.error === 'MISSING_API_KEY') {
        if (clientKey) {
          shouldFallbackToDirect = true;
        } else {
          throw new Error(data?.message || 'MISSING_API_KEY');
        }
      } else {
        throw new Error(data?.error || data?.message || 'فشل الاتصال بخدمة Gemini API');
      }
    }
  } catch (err) {
    if (!shouldFallbackToDirect) {
      throw err;
    }
  }

  // 2. Fallback: Direct browser call using clientKey (for local Vite dev)
  if (!clientKey) {
    throw new Error('MISSING_API_KEY');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(clientKey)}`;
  const payload = { contents };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  if (generationConfig) {
    payload.generationConfig = generationConfig;
  }

  const directRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const directData = await directRes.json();
  if (!directRes.ok) {
    throw new Error(directData?.error?.message || 'تأكد من صحة مفتاح Gemini API الخاص بك.');
  }

  return extractTextFromResponse(directData);
}

function extractTextFromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
}

function parseJSONArrayFromText(rawText) {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('تعذر قراءة البيانات المولدة من الذكاء الاصطناعي.');
  }
}

function parseJSONObjectFromText(rawText) {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('تعذر قراءة الاستجابة من الذكاء الاصطناعي.');
  }
}

// Feature 1: Extract words from a notebook image, PDF, or raw pasted text
export async function extractWordsFromStudyMaterial({ fileBase64, mimeType, rawText, count = 20 }) {
  const parts = [];
  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    });
  }
  if (rawText && rawText.trim()) {
    parts.push({
      text: `النص أو المذكرة:\n${rawText.trim()}`,
    });
  }

  parts.push({
    text: `استخرج أهم الكلمات الإنجليزية المفردة الصالحة لتدريب الإملاء من هذه المذكرة (بحد أقصى ${count} كلمة).
لكل كلمة، أنشئ كائناً في مصفوفة JSON يحتوي على الحقول التالية فقط:
- "word": الكلمة الإنجليزية المفردة (حروف إنجليزية فقط بدون مسافات).
- "sentence": جملة إنجليزية واضحة وبسيطة تحتوي على نفس الكلمة (word) بنفس حروفها تماماً.
- "ar": ترجمة الجملة الإنجليزية كاملة إلى اللغة العربية الفصحى.
- "arWord": معنى الكلمة المستهدفة فقط باللغة العربية.
- "level": مستوى صعوبة الكلمة ("easy" أو "medium" أو "hard").
أعد النتيجة كمصفوفة JSON فقط بدون أي نص إضافي.`,
  });

  const text = await callGemini({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const arr = parseJSONArrayFromText(text);
  return (Array.isArray(arr) ? arr : [])
    .map((r) => createWordItem(r.word, r.sentence, r.ar, r.arWord, r.level))
    .filter(Boolean);
}

// Feature 2: Generate a custom word list around any topic or school unit
export async function generateWordsByTopic({ topic, count = 15, level = 'all' }) {
  const levelInstruction =
    level === 'all'
      ? 'نوّع في المستويات بين easy و medium و hard.'
      : `اجعل جميع الكلمات من المستوى "${level}".`;

  const prompt = `قم بتوليد ${count} كلمة إنجليزية لتدريب الإملاء والاستماع حول الموضوع التالي: "${topic}".
${levelInstruction}
لكل كلمة، أنشئ كائناً في مصفوفة JSON يحتوي على:
- "word": الكلمة الإنجليزية المفردة (كلمة واحدة فقط).
- "sentence": جملة إنجليزية طبيعية ومفيدة تحتوي على نفس الكلمة (word) بنفس حروفها تماماً.
- "ar": ترجمة الجملة الإنجليزية كاملة إلى اللغة العربية.
- "arWord": معنى الكلمة بالعربية.
- "level": المستوى ("easy" أو "medium" أو "hard").
أعد النتيجة كمصفوفة JSON فقط.`;

  const text = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const arr = parseJSONArrayFromText(text);
  return (Array.isArray(arr) ? arr : [])
    .map((r) => createWordItem(r.word, r.sentence, r.ar, r.arWord, r.level))
    .filter(Boolean);
}

// Feature 3: AI Spelling Coach — explain why the user's spelling was wrong and give a mnemonic in Arabic
export async function explainSpellingMistake({ targetWord, userAttempt, arWord }) {
  const prompt = `الطالب يتدرب على إملاء الكلمة الإنجليزية "${targetWord}" (ومعناها بالعربية: "${arWord}")، لكنه كتبها خطأً هكذا: "${userAttempt}".
اشرح للطالب باللغة العربية بأسلوب مشجع ومختصر جداً (في سطرين إلى 3 أسطر فقط):
1. ما هو الخطأ الإملائي الذي وقع فيه بالضبط (مثل حرف ناقص أو مبدل أو صامت).
2. حيلة ذكية أو قاعدة بسيطة (Mnemonic) لتذكر كتابة "${targetWord}" الصحيحة دائماً.`;

  return await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
    },
  });
}

// Feature 4: Generate a brand-new context sentence & Arabic translation for the current target word
export async function generateNewSentenceForWord({ word, arWord, currentSentence }) {
  const prompt = `الكلمة الإنجليزية المستهدفة هي "${word}" (معناها: "${arWord}").
الجملة الحالية هي: "${currentSentence}".
ألف جملة إنجليزية جديدة ومختلفة تماماً وبسيطة تحتوي على نفس الكلمة "${word}" بنفس حروفها تماماً (بدون تغييرها للجمع أو الماضي)، مع ترجمتها الكاملة إلى اللغة العربية.
أعد كائن JSON فقط بهذا الشكل:
{
  "sentence": "الجملة الإنجليزية الجديدة وتحتوي على ${word}",
  "ar": "ترجمة الجملة الجديدة بالعربية"
}`;

  const text = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  });

  const obj = parseJSONObjectFromText(text);
  const updated = createWordItem(word, obj.sentence, obj.ar, arWord, 'easy');
  if (!updated) {
    throw new Error('تعذر توليد جملة جديدة.');
  }
  return {
    sentence: updated.sentence,
    blank: updated.blank,
    ar: updated.ar,
  };
}

// Feature 5: Adaptive AI Mistake Review — generate fresh practice sentences AND a short bilingual story for missed words
export async function generateMistakeReviewPack(missedWords) {
  const listText = missedWords
    .map((w) => `${w.word} (${w.arWord})`)
    .join(', ');

  const prompt = `هذه قائمة الكلمات الإنجليزية التي أخطأ فيها الطالب اليوم:
${listText}

المطلوب إعادة كائن JSON يحتوي على حقلين:
1. "storyEn": قصة قصيرة جداً وممتعة (3 إلى 5 جمل إنجليزية) تستخدم جميع هذه الكلمات معاً في سياق واضح.
2. "storyAr": الترجمة العربية الكاملة لهذه القصة القصيرة.
3. "practiceItems": مصفوفة تحتوي على جملة تدريبية جديدة لكل كلمة من الكلمات المذكورة أعلاه، كل عنصر فيها يحتوي على:
   - "word": نفس الكلمة الإنجليزية تماماً.
   - "sentence": جملة إنجليزية جديدة تحتوي على نفس الكلمة (word) بنفس حروفها.
   - "ar": ترجمة الجملة الجديدة بالعربية.
   - "arWord": معنى الكلمة بالعربية.
   - "level": "medium"

أعد كائن JSON فقط.`;

  const text = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const obj = parseJSONObjectFromText(text);
  const items = (Array.isArray(obj.practiceItems) ? obj.practiceItems : [])
    .map((r) => createWordItem(r.word, r.sentence, r.ar, r.arWord, r.level || 'medium'))
    .filter(Boolean);

  return {
    storyEn: obj.storyEn || '',
    storyAr: obj.storyAr || '',
    practiceItems: items,
  };
}
