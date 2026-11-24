// Utilities for parsing and exporting word lists in CSV (Excel-compatible) and JSON formats.

const VALID_LEVELS = new Set(['easy', 'medium', 'hard']);

export function createWordItem(rawWord, rawSentence, rawAr = '', rawArWord = '', rawLevel = 'easy') {
  const word = String(rawWord || '').trim();
  const sentence = String(rawSentence || '').trim();
  const ar = String(rawAr || '').trim();
  const arWord = String(rawArWord || '').trim();
  const normLevel = String(rawLevel || 'easy').trim().toLowerCase();
  const levelMap = {
    easy: 'easy',
    medium: 'medium',
    hard: 'hard',
    'سهل': 'easy',
    'متوسط': 'medium',
    'صعب': 'hard',
  };
  const level = levelMap[normLevel] || (VALID_LEVELS.has(normLevel) ? normLevel : 'easy');

  if (!word || !sentence) return null;

  const boundaryRegex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
  const fallbackRegex = new RegExp(escapeRegExp(word), 'i');

  let blank;
  if (boundaryRegex.test(sentence)) {
    blank = sentence.replace(boundaryRegex, '______');
  } else if (fallbackRegex.test(sentence)) {
    blank = sentence.replace(fallbackRegex, '______');
  } else {
    // If the user forgot to include the word inside the sentence, append a blank slot
    blank = `${sentence} (______)`;
  }

  return {
    word,
    sentence,
    blank,
    ar: ar || '—',
    arWord: arWord || '—',
    level,
  };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse a single CSV line respecting quotes and auto-detected delimiter
function splitCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(headerLine) {
  // Excel on Arabic/European Windows often exports CSV with ';' or '\t' instead of ','
  const counts = {
    ',': (headerLine.match(/,/g) || []).length,
    ';': (headerLine.match(/;/g) || []).length,
    '\t': (headerLine.match(/\t/g) || []).length,
  };
  if (counts['\t'] >= counts[','] && counts['\t'] >= counts[';'] && counts['\t'] > 0) return '\t';
  if (counts[';'] > counts[',']) return ';';
  return ',';
}

export function parseWordsCSV(text) {
  const cleaned = String(text || '').replace(/^\uFEFF/, ''); // strip UTF-8 BOM
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], delimiter);
    if (cols.length < 2) continue;

    // Skip header row if present (English or Arabic headers)
    if (i === 0) {
      const firstCol = cols[0].toLowerCase();
      if (
        firstCol === 'word' ||
        firstCol === 'الكلمة' ||
        firstCol.includes('word') ||
        firstCol.includes('الكلمة')
      ) {
        continue;
      }
    }

    const [word, sentence, ar = '', arWord = '', level = 'easy'] = cols;
    const item = createWordItem(word, sentence, ar, arWord, level);
    if (item) items.push(item);
  }

  return items;
}

export function parseWordsJSON(text) {
  const cleaned = String(text || '').replace(/^\uFEFF/, '');
  const data = JSON.parse(cleaned);
  const arr = Array.isArray(data) ? data : Array.isArray(data.words) ? data.words : [];
  const items = [];
  for (const row of arr) {
    if (!row || typeof row !== 'object') continue;
    const item = createWordItem(
      row.word || row['الكلمة'],
      row.sentence || row['الجملة'],
      row.ar || row['ترجمة الجملة'] || row.sentenceTranslation,
      row.arWord || row['معنى الكلمة'] || row.wordMeaning,
      row.level || row['المستوى'] || 'easy'
    );
    if (item) items.push(item);
  }
  return items;
}

export function parseExternalWordsFile(filename, text) {
  const lower = String(filename || '').toLowerCase();
  if (lower.endsWith('.json')) {
    return parseWordsJSON(text);
  }
  // Try JSON first if text starts with '[' or '{'
  const trimmed = String(text || '').replace(/^\uFEFF/, '').trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return parseWordsJSON(trimmed);
    } catch {
      // fall through to CSV parser
    }
  }
  return parseWordsCSV(text);
}

function escapeCSVCell(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportWordsToCSV(words) {
  const header = 'word,sentence,ar,arWord,level';
  const rows = words.map((w) =>
    [w.word, w.sentence, w.ar, w.arWord, w.level].map(escapeCSVCell).join(',')
  );
  // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel on Windows displays Arabic properly
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

export function exportWordsToJSON(words) {
  const clean = words.map(({ word, sentence, ar, arWord, level }) => ({
    word,
    sentence,
    ar,
    arWord,
    level,
  }));
  return JSON.stringify(clean, null, 2);
}
