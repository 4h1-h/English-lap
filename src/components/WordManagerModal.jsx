import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  Plus,
  RotateCcw,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  createWordItem,
  parseExternalWordsFile,
  exportWordsToCSV,
  exportWordsToJSON,
} from '../utils/wordFileParser';

export default function WordManagerModal({
  words,
  sourceLabel,
  onUpdateWords,
  onResetToDefault,
  onClose,
}) {
  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'merge'
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text: string }

  // Quick manual add form state
  const [newWord, setNewWord] = useState('');
  const [newSentence, setNewSentence] = useState('');
  const [newAr, setNewAr] = useState('');
  const [newArWord, setNewArWord] = useState('');
  const [newLevel, setNewLevel] = useState('easy');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseExternalWordsFile(file.name, text);
      if (parsed.length === 0) {
        setNotice({
          type: 'error',
          text: 'لم يتم العثور على كلمات صالحة في الملف. تأكد من وجود عمود الكلمة وعمود الجملة.',
        });
        return;
      }

      if (importMode === 'replace') {
        onUpdateWords(parsed, `ملف خارجي: ${file.name}`);
        setNotice({
          type: 'success',
          text: `تم استيراد ${parsed.length} كلمة من "${file.name}" بنجاح (استبدال القائمة).`,
        });
      } else {
        const existingSet = new Set(words.map((w) => w.word.toLowerCase()));
        const uniqueNew = parsed.filter((w) => !existingSet.has(w.word.toLowerCase()));
        const merged = [...uniqueNew, ...words];
        onUpdateWords(merged, `مدمج مع: ${file.name}`);
        setNotice({
          type: 'success',
          text: `تم دمج ${uniqueNew.length} كلمة جديدة من "${file.name}" (الإجمالي: ${merged.length} كلمة).`,
        });
      }
    } catch {
      setNotice({
        type: 'error',
        text: 'حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة CSV أو JSON.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadCSV = () => {
    const csv = exportWordsToCSV(words);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'words.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const json = exportWordsToJSON(words);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'words.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSingleWord = (e) => {
    e.preventDefault();
    const item = createWordItem(newWord, newSentence, newAr, newArWord, newLevel);
    if (!item) {
      setNotice({
        type: 'error',
        text: 'يرجى كتابة الكلمة الإنجليزية والجملة الإنجليزية على الأقل.',
      });
      return;
    }
    const updated = [item, ...words];
    onUpdateWords(updated, 'قائمة مخصصة');
    setNewWord('');
    setNewSentence('');
    setNewAr('');
    setNewArWord('');
    setNotice({
      type: 'success',
      text: `تمت إضافة الكلمة "${item.word}" بنجاح إلى بداية القائمة!`,
    });
  };

  const handleDeleteWord = (targetWord) => {
    if (words.length <= 1) return;
    const updated = words.filter((w) => w.word !== targetWord);
    onUpdateWords(updated, 'قائمة مخصصة');
  };

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.arWord.includes(searchQuery) ||
      w.sentence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        dir="rtl"
        className="glass-card w-full max-w-3xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-300">
              إدارة الكلمات والملف الخارجي (Excel / CSV)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              المصدر الحالي: <span className="text-cyan-300 font-semibold">{sourceLabel}</span> ({words.length} كلمة)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {notice && (
          <div
            className={`flex items-center gap-2 p-3.5 rounded-2xl border text-sm font-semibold ${
              notice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Section 1: External File Import & Export (Excel CSV / JSON) */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                <span>1. القراءة من ملف خارجي (الأسهل: ملف Excel بصيغة CSV)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                حمّل ملف الكلمات بصيغة Excel (CSV)، افتحه وعدّله أو أضف كلماتك في برنامج Excel، ثم ارفعه هنا بضغطة زر!
              </p>
            </div>
          </div>

          {/* Import mode selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400 font-semibold">عند رفع ملف خارجي:</span>
            <button
              type="button"
              onClick={() => setImportMode('replace')}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                importMode === 'replace'
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-zinc-400'
              }`}
            >
              التدرب على كلمات الملف المرفوع فقط (استبدال)
            </button>
            <button
              type="button"
              onClick={() => setImportMode('merge')}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                importMode === 'merge'
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                  : 'bg-white/5 border-white/10 text-zinc-400'
              }`}
            >
              دمج كلمات الملف مع الكلمات الحالية
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg"
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملف كلمات (CSV / JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 font-bold text-sm hover:bg-cyan-500/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف Excel (words.csv)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-zinc-200 font-bold text-sm hover:bg-white/10 transition-all"
            >
              <FileJson className="w-4 h-4 text-amber-300" />
              <span>تحميل بصيغة JSON</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            💡 <strong>ملاحظة:</strong> يوجد أيضاً ملف جاهز داخل مجلد المشروع في المسار{' '}
            <code dir="ltr" className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
              public/words.csv
            </code>{' '}
            يقرأه البرنامج تلقائياً عند التشغيل.
          </p>
        </div>

        {/* Section 2: Direct In-App Word Addition */}
        <form
          onSubmit={handleAddSingleWord}
          className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3"
        >
          <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-300" />
            <span>2. أو أضف كلمة جديدة مباشرة من هنا (بدون ملف)</span>
          </h3>

          <div className="grid sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              dir="ltr"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="الكلمة بالإنجليزية (مثل: computer)"
              className="rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              dir="rtl"
              value={newArWord}
              onChange={(e) => setNewArWord(e.target.value)}
              placeholder="معنى الكلمة بالعربية (مثل: حاسوب)"
              className="rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
            />
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="rounded-xl bg-zinc-900 border border-white/15 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-400"
            >
              <option value="easy">سهل (Easy)</option>
              <option value="medium">متوسط (Medium)</option>
              <option value="hard">صعب (Hard)</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              dir="ltr"
              value={newSentence}
              onChange={(e) => setNewSentence(e.target.value)}
              placeholder="الجملة الإنجليزية (مثل: I use my computer every day.)"
              className="rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              dir="rtl"
              value={newAr}
              onChange={(e) => setNewAr(e.target.value)}
              placeholder="ترجمة الجملة بالعربية (مثل: أستخدم حاسوبي كل يوم.)"
              className="rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-bold text-sm hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة الكلمة للقائمة</span>
          </button>
        </form>

        {/* Section 3: Browse & Search Current Words + Reset */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الكلمات الحالية..."
              className="flex-1 min-w-[180px] rounded-xl bg-white/5 border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => {
                onResetToDefault();
                setNotice({
                  type: 'success',
                  text: 'تمت استعادة قائمة الكلمات الأصلية (200 كلمة).',
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs font-bold hover:bg-rose-500/25 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الكلمات الافتراضية</span>
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-white/5 pr-1">
            {filteredWords.slice(0, 60).map((item, idx) => (
              <div
                key={`${item.word}-${idx}`}
                className="py-2 flex items-center justify-between gap-2 text-xs sm:text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="font-mono font-bold text-emerald-300">
                    {item.word}
                  </span>
                  <span className="text-cyan-300 font-semibold">({item.arWord})</span>
                  <span dir="ltr" className="text-zinc-400 text-xs">
                    — {item.sentence}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteWord(item.word)}
                  title="حذف الكلمة"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
