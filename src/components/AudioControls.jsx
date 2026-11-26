import { Volume2, Turtle, SpellCheck, Sparkles, Loader2 } from 'lucide-react';

// Sentence replay + isolated slow target-word replay + letter-by-letter audio spelling + AI new sentence generator
export default function AudioControls({
  onReplaySentence,
  onReplayWord,
  onSpellLetters,
  onGenerateNewSentence,
  generatingSentence,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      <button
        type="button"
        onClick={onReplaySentence}
        disabled={disabled}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-white/10 hover:border-emerald-300/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Volume2 className="w-4 h-4 text-emerald-300" />
        <span>سماع الجملة • Sentence 🔊</span>
      </button>
      <button
        type="button"
        onClick={onReplayWord}
        disabled={disabled}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-white/10 hover:border-cyan-300/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Turtle className="w-4 h-4 text-cyan-300" />
        <span>نطق الكلمة ببطء • Slow Word 🔉</span>
      </button>
      <button
        type="button"
        onClick={onSpellLetters}
        disabled={disabled}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-white/10 hover:border-amber-300/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <SpellCheck className="w-4 h-4 text-amber-300" />
        <span>تهجئة الحروف • Spell 🔤</span>
      </button>
      <button
        type="button"
        onClick={onGenerateNewSentence}
        disabled={disabled || generatingSentence}
        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-400/35 text-xs sm:text-sm font-bold text-amber-200 hover:from-amber-500/25 hover:to-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        title="توليد جملة تدريبية جديدة لنفس الكلمة بالذكاء الاصطناعي"
      >
        {generatingSentence ? (
          <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 text-amber-300" />
        )}
        <span>{generatingSentence ? 'جاري التوليد...' : 'جملة أخرى لنفس الكلمة ✨'}</span>
      </button>
    </div>
  );
}
