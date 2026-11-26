import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Sparkles,
  BookOpen,
  Volume2,
  Play,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { generateMistakeReviewPack } from '../utils/geminiClient';

// Feature 5: Adaptive AI Mistake Review & Story Generator Modal
export default function MistakeReviewModal({
  missedWords,
  onStartReviewSession,
  onClearMistakes,
  onSpeakText,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewPack, setReviewPack] = useState(null); // { storyEn, storyAr, practiceItems }

  const handleGenerateReview = async () => {
    if (missedWords.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const pack = await generateMistakeReviewPack(missedWords);
      setReviewPack(pack);
    } catch (err) {
      if (err?.message === 'MISSING_API_KEY') {
        setError('يرجى إدخال مفتاح Gemini API أولاً من إعدادات ملف الكلمات.');
      } else {
        setError(err?.message || 'حدث خطأ أثناء توليد المراجعة الذكية.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        className="glass-card w-full max-w-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-rose-300 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-300" />
              <span>المراجعة الذكية لنقاط الضعف (Gemini AI)</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              الكلمات التي أخطأت فيها خلال التدريب ({missedWords.length} كلمة)
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

        {missedWords.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-lg font-bold text-emerald-300">
              سجلك خالٍ من الأخطاء حتى الآن! 🎉
            </p>
            <p className="text-xs sm:text-sm text-zinc-400">
              أي كلمة تخطئ في إملائها أثناء التدريب ستتجمع هنا تلقائياً ليقوم Gemini بإنشاء قصة قصيرة وجولة مراجعة مخصصة لها.
            </p>
          </div>
        ) : (
          <>
            {/* List of missed words */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  الكلمات المطلوب تثبيت حفظها:
                </span>
                <button
                  type="button"
                  onClick={onClearMistakes}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح القائمة</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {missedWords.map((w) => (
                  <span
                    key={w.word}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs sm:text-sm font-bold text-rose-200 flex items-center gap-1.5"
                  >
                    <span dir="ltr" className="font-mono text-white">
                      {w.word}
                    </span>
                    <span className="text-rose-300">({w.arWord})</span>
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs sm:text-sm font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerateReview}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 font-extrabold text-sm hover:from-amber-300 hover:to-orange-300 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تأليف القصة وجمل المراجعة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تأليف قصة وجمل جديدة بـ Gemini ✨</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onStartReviewSession(
                    reviewPack?.practiceItems?.length ? reviewPack.practiceItems : missedWords
                  );
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                <Play className="w-4 h-4" />
                <span>
                  {reviewPack?.practiceItems?.length
                    ? 'ابدأ التدريب بالجمل الذكية الجديدة'
                    : 'ابدأ جولة مراجعة لأخطائي الآن'}
                </span>
              </button>
            </div>

            {/* AI Generated Short Story combining all missed words */}
            {reviewPack && reviewPack.storyEn && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/50 to-cyan-500/10 border border-emerald-400/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    قصة قصيرة تجمع الكلمات التي أخطأت فيها:
                  </span>
                  <button
                    type="button"
                    onClick={() => onSpeakText(reviewPack.storyEn)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/30"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>استمع للقصة 🔊</span>
                  </button>
                </div>

                <p
                  dir="ltr"
                  className="text-left text-base sm:text-lg leading-relaxed text-zinc-100 font-medium bg-zinc-950/50 rounded-xl p-3 border border-white/10"
                >
                  {reviewPack.storyEn}
                </p>

                <p className="text-right text-sm sm:text-base leading-relaxed text-cyan-200 bg-zinc-950/30 rounded-xl p-3 border border-white/5">
                  {reviewPack.storyAr}
                </p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
