import { forwardRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Lightbulb, Check, Delete, RotateCcw, Sparkles, Loader2, Brain } from 'lucide-react';

// Deterministic shuffle for letter bank tiles per word
function scrambleWord(word) {
  const arr = word
    .toLowerCase()
    .split('')
    .map((ch, idx) => ({ ch, id: `${ch}-${idx}` }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (i * 7 + word.charCodeAt(0)) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Input field with live letter-by-letter boxes, clickable letter bank,
// visible Check button, and shake animation on wrong submission.
const SpellingInput = forwardRef(function SpellingInput(
  {
    word = '',
    value,
    onChange,
    onSetValue,
    onSubmit,
    status,
    shakeKey,
    disabled,
    showLiveBoxes = true,
    showLetterBank = true,
    lastWrongAttempt = '',
    aiExplanation = '',
    aiCoachLoading = false,
    onAskAICoach,
  },
  ref
) {
  const controls = useAnimationControls();
  const targetLetters = useMemo(() => word.toLowerCase().split(''), [word]);
  const scrambledTiles = useMemo(() => scrambleWord(word), [word]);

  useEffect(() => {
    if (shakeKey > 0) {
      controls.start({
        x: [0, -12, 12, -9, 9, -5, 5, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [shakeKey, controls]);

  // Count how many times each character is already typed so used tiles dim nicely
  const usedTileIds = useMemo(() => {
    const remainingCounts = {};
    for (const ch of value.toLowerCase()) {
      remainingCounts[ch] = (remainingCounts[ch] || 0) + 1;
    }
    const used = new Set();
    for (const tile of scrambledTiles) {
      if (remainingCounts[tile.ch] > 0) {
        used.add(tile.id);
        remainingCounts[tile.ch] -= 1;
      }
    }
    return used;
  }, [value, scrambledTiles]);

  const handleTileClick = (ch) => {
    if (disabled) return;
    onSetValue(value + ch);
  };

  const handleBackspace = () => {
    if (disabled || !value) return;
    onSetValue(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || !value) return;
    onSetValue('');
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Live Letter-by-Letter Visual Boxes */}
      {showLiveBoxes && targetLetters.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-center text-xs font-medium text-zinc-400">
            مؤشر الحروف الفوري (أخضر = حرف صحيح، أحمر = حرف خاطئ)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" dir="ltr">
            {targetLetters.map((targetChar, i) => {
              const typedChar = value[i]?.toLowerCase();
              const isTyped = typedChar !== undefined;
              const isMatch = isTyped && typedChar === targetChar;

              return (
                <div
                  key={i}
                  className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl border-2 flex items-center justify-center font-mono text-lg sm:text-xl font-bold uppercase transition-all ${
                    !isTyped
                      ? 'border-white/15 bg-white/[0.03] text-zinc-600'
                      : isMatch
                      ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                      : 'border-rose-400/70 bg-rose-500/20 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  }`}
                >
                  {isTyped ? typedChar : '_'}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Text Input + Visible Check Button */}
      <motion.form
        onSubmit={onSubmit}
        animate={controls}
        className="relative flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            ref={ref}
            type="text"
            dir="ltr"
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="اكتب الكلمة الإنجليزية هنا... Type here"
            aria-label="Spelling answer"
            className={`w-full rounded-2xl bg-white/[0.05] border-2 pl-5 pr-11 py-4 text-lg font-semibold tracking-wide text-zinc-100 placeholder-zinc-500 placeholder:font-normal placeholder:text-sm outline-none backdrop-blur-xl transition-colors duration-300 ${
              status === 'wrong'
                ? 'border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.35)]'
                : 'border-white/15 focus:border-emerald-300/60 focus:shadow-[0_0_24px_rgba(52,211,153,0.25)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="مسح الكل / Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-5 sm:px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-base hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_24px_rgba(52,211,153,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>تحقق</span>
        </button>
      </motion.form>

      {/* Clickable Scrambled Letter Bank */}
      {showLetterBank && scrambledTiles.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Fix / Click Letters: اضغط على الحروف المبعثرة لتكوين الكلمة</span>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={disabled || !value}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>حذف حرف</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2" dir="ltr">
            {scrambledTiles.map((tile) => {
              const isUsed = usedTileIds.has(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleTileClick(tile.ch)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-mono text-lg font-bold uppercase border transition-all ${
                    isUsed
                      ? 'bg-white/[0.03] border-white/10 text-zinc-500 scale-95'
                      : 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200 hover:bg-cyan-500/25 hover:scale-105 active:scale-95 shadow-sm'
                  }`}
                >
                  {tile.ch}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {(status === 'wrong' || lastWrongAttempt) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            dir="rtl"
            className="mt-2 space-y-2.5"
          >
            {status === 'wrong' && (
              <p className="text-center text-sm font-medium text-rose-300 flex items-center justify-center gap-1.5">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>
                  الإملاء غير مطابق بعد — استمع للفرق الصوتي أو اطلب شرح الخطأ من المعلم الذكي!
                </span>
              </p>
            )}

            {lastWrongAttempt && !aiExplanation && (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={aiCoachLoading}
                  onClick={onAskAICoach}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-bold hover:bg-amber-500/25 transition-all disabled:opacity-50"
                >
                  {aiCoachLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>المعلم الذكي يحلل خطأك الإملائي...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 text-amber-300" />
                      <span>
                        لماذا أخطأت في &quot;{lastWrongAttempt}&quot;؟ اشرح لي بـ Gemini ✨
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {aiExplanation && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900/70 to-emerald-500/10 border border-amber-400/35 p-4 text-right space-y-1.5">
                <p className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>نصيحة المعلم الذكي (Gemini AI Coach):</span>
                </p>
                <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed whitespace-pre-line">
                  {aiExplanation}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SpellingInput;
