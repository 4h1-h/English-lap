import { Flame, Volume2, VolumeX, Target, Trophy, FolderOpen, Sparkles } from 'lucide-react';
import { difficulties } from '../data/words';

const levelStyles = {
  all: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  easy: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  hard: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
};

const levelLabels = {
  all: 'الكل All',
  easy: 'سهل Easy',
  medium: 'متوسط Medium',
  hard: 'صعب Hard',
};

export default function Navbar({
  score,
  streak,
  accuracy,
  muted,
  onToggleMute,
  difficulty,
  onDifficultyChange,
  onOpenWordManager,
  totalWordsCount,
  missedCount = 0,
  onOpenMistakeReview,
}) {
  return (
    <header className="glass-card sticky top-3 z-30 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2 mr-auto">
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
          English Spelling Pro
        </span>
      </div>

      {/* Difficulty filter */}
      <div className="flex items-center gap-1 rounded-2xl bg-white/5 border border-white/10 p-1">
        {difficulties.map((d) => (
          <button
            key={d}
            onClick={() => onDifficultyChange(d)}
            className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              difficulty === d
                ? levelStyles[d]
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {levelLabels[d]}
          </button>
        ))}
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200" title="النقاط / Score">
        <Trophy className="w-4 h-4 text-amber-300" />
        <span>{score}</span>
        <span className="hidden sm:inline text-zinc-500 font-normal">نقطة</span>
      </div>

      {/* Streak */}
      <div
        className={`flex items-center gap-1.5 text-sm font-semibold ${
          streak > 0 ? 'text-orange-300' : 'text-zinc-500'
        }`}
        title="إجابات متتالية / Current streak"
      >
        <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-orange-400/30' : ''}`} />
        <span>{streak}</span>
      </div>

      {/* Accuracy */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200" title="الدقة / Accuracy">
        <Target className="w-4 h-4 text-cyan-300" />
        <span>{accuracy}%</span>
      </div>

      {/* External File & AI Word Manager button */}
      <button
        type="button"
        onClick={onOpenWordManager}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 hover:bg-emerald-500/25 text-xs sm:text-sm font-bold transition-all"
        title="إدارة الكلمات وتوليد المذكرات بالذكاء الاصطناعي"
      >
        <FolderOpen className="w-4 h-4 text-emerald-300" />
        <span>الكلمات و AI ({totalWordsCount})</span>
      </button>

      {/* AI Mistake Review button */}
      <button
        type="button"
        onClick={onOpenMistakeReview}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
          missedCount > 0
            ? 'bg-rose-500/20 border-rose-400/40 text-rose-200 hover:bg-rose-500/30'
            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
        }`}
        title="مراجعة الكلمات التي أخطأت فيها بالذكاء الاصطناعي"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        <span>مراجعة أخطائي ({missedCount})</span>
      </button>

      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        aria-label={muted ? 'تشغيل الصوت Unmute' : 'كتم الصوت Mute'}
        title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        {muted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
      </button>
    </header>
  );
}
