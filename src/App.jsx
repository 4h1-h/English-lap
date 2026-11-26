import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { wordBank as defaultWordBank } from './data/words';
import { parseWordsCSV } from './utils/wordFileParser';
import useSpeech from './hooks/useSpeech';
import Navbar from './components/Navbar';
import ProgressBar from './components/ProgressBar';
import SentenceCard from './components/SentenceCard';
import AudioControls from './components/AudioControls';
import SpellingInput from './components/SpellingInput';
import HintPanel from './components/HintPanel';
import SuccessModal from './components/SuccessModal';
import StartOverlay from './components/StartOverlay';
import WordManagerModal from './components/WordManagerModal';
import MistakeReviewModal from './components/MistakeReviewModal';
import {
  explainSpellingMistake,
  generateNewSentenceForWord,
} from './utils/geminiClient';

const STORAGE_WORDS_KEY = 'esp_custom_words_v1';
const STORAGE_SOURCE_KEY = 'esp_custom_source_v1';

function loadInitialWords() {
  try {
    const saved = localStorage.getItem(STORAGE_WORDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return defaultWordBank;
}

function loadInitialSourceLabel() {
  try {
    return localStorage.getItem(STORAGE_SOURCE_KEY) || 'ملف public/words.csv الافتراضي';
  } catch {
    return 'ملف public/words.csv الافتراضي';
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LEVEL_SESSION_SIZE = { all: 20, easy: 20, medium: 20, hard: 20 };

function createPool(level, activeBank) {
  const bank = activeBank && activeBank.length > 0 ? activeBank : defaultWordBank;
  const filtered =
    level === 'all' ? bank : bank.filter((w) => w.level === level);
  const source = filtered.length > 0 ? filtered : bank;
  return shuffle(source).slice(0, LEVEL_SESSION_SIZE[level]);
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('all');
  const [activeWords, setActiveWords] = useState(loadInitialWords);
  const [sourceLabel, setSourceLabel] = useState(loadInitialSourceLabel);
  const [wordManagerOpen, setWordManagerOpen] = useState(false);
  const [mistakeReviewOpen, setMistakeReviewOpen] = useState(false);
  const [missedWords, setMissedWords] = useState([]);

  // Per-question AI state
  const [lastWrongAttempt, setLastWrongAttempt] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiCoachLoading, setAiCoachLoading] = useState(false);
  const [generatingSentence, setGeneratingSentence] = useState(false);

  const speech = useSpeech();
  const { speakSentence, speakWordSlow, speakLetters, speakTypo, muted } = speech;

  // Session state
  const [pool, setPool] = useState(() => createPool('all', loadInitialWords()));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Question state
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle'); // idle | wrong | correct
  const [wordRevealed, setWordRevealed] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Learning helper options (disabled by default on entry; translation stays visible before answering)
  const [showTranslation, setShowTranslation] = useState(true);
  const [showLiveBoxes, setShowLiveBoxes] = useState(false);
  const [showLetterBank, setShowLetterBank] = useState(false);

  const inputRef = useRef(null);
  const skipNextAutoSpeakRef = useRef(false);

  const item = pool[index];

  // Automatically load external /words.csv on startup if user hasn't uploaded a custom override in localStorage
  useEffect(() => {
    const hasCustomOverride = Boolean(localStorage.getItem(STORAGE_WORDS_KEY));
    if (hasCustomOverride) return;

    fetch('/words.csv')
      .then((res) => (res.ok ? res.text() : null))
      .then((csvText) => {
        if (!csvText) return;
        const parsed = parseWordsCSV(csvText);
        if (parsed.length > 0) {
          setActiveWords(parsed);
          setPool(createPool(difficulty, parsed));
        }
      })
      .catch(() => {
        // Fallback to built-in wordBank silently
      });
  }, [difficulty]);

  const handleUpdateWords = useCallback(
    (newWords, newLabel) => {
      setActiveWords(newWords);
      setSourceLabel(newLabel);
      try {
        localStorage.setItem(STORAGE_WORDS_KEY, JSON.stringify(newWords));
        localStorage.setItem(STORAGE_SOURCE_KEY, newLabel);
      } catch {
        // ignore storage quota errors
      }
      setPool(createPool(difficulty, newWords));
      setIndex(0);
      setStatus('idle');
      setValue('');
      setWordRevealed(false);
      setLastWrongAttempt('');
      setAiExplanation('');
    },
    [difficulty]
  );

  const handleResetWords = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_WORDS_KEY);
      localStorage.removeItem(STORAGE_SOURCE_KEY);
    } catch {
      // ignore
    }
    setActiveWords(defaultWordBank);
    setSourceLabel('ملف public/words.csv الافتراضي');
    setPool(createPool(difficulty, defaultWordBank));
    setIndex(0);
    setStatus('idle');
    setValue('');
    setWordRevealed(false);
    setLastWrongAttempt('');
    setAiExplanation('');
  }, [difficulty]);

  const handleDifficultyChange = useCallback(
    (newLevel) => {
      setDifficulty(newLevel);
      setPool(createPool(newLevel, activeWords));
      setIndex(0);
      setScore(0);
      setStreak(0);
      setAttempts(0);
      setCorrectCount(0);
      setStatus('idle');
      setValue('');
      setWordRevealed(false);
      setLastWrongAttempt('');
      setAiExplanation('');
    },
    [activeWords]
  );

  // Speak each new sentence aloud
  useEffect(() => {
    if (started && item) {
      if (skipNextAutoSpeakRef.current) {
        skipNextAutoSpeakRef.current = false;
        return;
      }
      const t = setTimeout(() => speakSentence(item.sentence), 350);
      return () => clearTimeout(t);
    }
  }, [started, index, item, speakSentence]);

  // Keep input focused
  useEffect(() => {
    if (started && status !== 'correct' && item) {
      inputRef.current?.focus();
    }
  }, [started, status, index, item]);

  const fireConfetti = () => {
    const opts = { spread: 75, ticks: 220, zIndex: 100 };
    confetti({ ...opts, particleCount: 90, origin: { x: 0.2, y: 0.7 }, angle: 60 });
    confetti({ ...opts, particleCount: 90, origin: { x: 0.8, y: 0.7 }, angle: 120 });
    confetti({
      ...opts,
      particleCount: 60,
      origin: { x: 0.5, y: 0.6 },
      shapes: ['circle'],
      scalar: 1.2,
    });
  };

  const nextQuestion = useCallback(() => {
    setStatus('idle');
    setValue('');
    setWordRevealed(false);
    setLastWrongAttempt('');
    setAiExplanation('');
    if (index + 1 >= pool.length) {
      // session complete — reshuffle a fresh one
      setPool(createPool(difficulty, activeWords));
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, pool.length, difficulty, activeWords]);

  // Reveal the next correct letter directly in the user's input
  const handleRevealNextLetter = () => {
    if (!item || status === 'correct') return;
    const target = item.word.toLowerCase();
    const current = value.toLowerCase();
    let matchLen = 0;
    while (
      matchLen < target.length &&
      matchLen < current.length &&
      current[matchLen] === target[matchLen]
    ) {
      matchLen++;
    }
    const nextValue = target.slice(0, Math.min(target.length, matchLen + 1));
    setValue(nextValue);
    if (status === 'wrong') setStatus('idle');
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!item || status === 'correct') return;
    const attempt = value.trim().toLowerCase();
    if (!attempt) return;

    setAttempts((a) => a + 1);

    if (attempt === item.word.toLowerCase()) {
      setStatus('correct');
      setScore((s) => s + 10);
      setStreak((s) => s + 1);
      setCorrectCount((c) => c + 1);
      fireConfetti();
    } else {
      setStatus('wrong');
      setStreak(0);
      setShakeKey((k) => k + 1);
      setLastWrongAttempt(attempt);
      setAiExplanation('');
      // Record this item in missedWords for Feature 5 (Adaptive Mistake Review)
      setMissedWords((prev) => {
        if (prev.some((w) => w.word.toLowerCase() === item.word.toLowerCase())) {
          return prev;
        }
        return [...prev, item];
      });
      if (!muted) speakTypo(attempt);
      setTimeout(() => {
        setStatus((s) => (s === 'wrong' ? 'idle' : s));
        inputRef.current?.focus();
      }, 1600);
    }
  };

  // Feature 3: Ask Gemini AI Spelling Coach why the attempt was wrong
  const handleAskAICoach = async () => {
    if (!item || !lastWrongAttempt) return;
    setAiCoachLoading(true);
    try {
      const explanation = await explainSpellingMistake({
        targetWord: item.word,
        userAttempt: lastWrongAttempt,
        arWord: item.arWord,
      });
      setAiExplanation(explanation);
    } catch (err) {
      if (err?.message === 'MISSING_API_KEY') {
        setWordManagerOpen(true);
      } else {
        setAiExplanation(err?.message || 'تعذر الاتصال بالمعلم الذكي حالياً.');
      }
    } finally {
      setAiCoachLoading(false);
    }
  };

  // Feature 4: Generate a brand-new context sentence for the current word via Gemini
  const handleGenerateNewSentence = async () => {
    if (!item || generatingSentence) return;
    setGeneratingSentence(true);
    try {
      const updated = await generateNewSentenceForWord({
        word: item.word,
        arWord: item.arWord,
        currentSentence: item.sentence,
      });
      setPool((prev) =>
        prev.map((entry, idx) =>
          idx === index
            ? {
                ...entry,
                sentence: updated.sentence,
                blank: updated.blank,
                ar: updated.ar,
              }
            : entry
        )
      );
      speakSentence(updated.sentence);
    } catch (err) {
      if (err?.message === 'MISSING_API_KEY') {
        setWordManagerOpen(true);
      }
    } finally {
      setGeneratingSentence(false);
    }
  };

  // Feature 5: Start a targeted review session on missed words
  const handleStartMistakeReviewSession = (reviewItems) => {
    if (!reviewItems || reviewItems.length === 0) return;
    setPool(reviewItems);
    setIndex(0);
    setStatus('idle');
    setValue('');
    setWordRevealed(false);
    setLastWrongAttempt('');
    setAiExplanation('');
  };

  const accuracy = useMemo(
    () => (attempts === 0 ? 100 : Math.round((correctCount / attempts) * 100)),
    [attempts, correctCount]
  );

  const handleStart = () => {
    skipNextAutoSpeakRef.current = true;
    setStarted(true);
    // Triggering speech inside the click handler satisfies autoplay policy
    if (item) speakSentence(item.sentence);
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[34rem] h-[34rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-teal-500/[0.07] blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-6">
        <Navbar
          score={score}
          streak={streak}
          accuracy={accuracy}
          muted={muted}
          onToggleMute={speech.toggleMute}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          onOpenWordManager={() => setWordManagerOpen(true)}
          totalWordsCount={activeWords.length}
          missedCount={missedWords.length}
          onOpenMistakeReview={() => setMistakeReviewOpen(true)}
        />

        <ProgressBar current={Math.min(index + 1, pool.length)} total={pool.length} />

        {item && (
          <motion.main
            key={`${difficulty}-${index}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <SentenceCard
              item={item}
              solved={status === 'correct'}
              showTranslation={showTranslation}
              wordRevealed={wordRevealed}
            />

            <AudioControls
              onReplaySentence={() => speakSentence(item.sentence)}
              onReplayWord={() => speakWordSlow(item.word)}
              onSpellLetters={() => speakLetters(item.word)}
              onGenerateNewSentence={handleGenerateNewSentence}
              generatingSentence={generatingSentence}
              disabled={status === 'correct'}
            />

            <SpellingInput
              ref={inputRef}
              word={item.word}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (status === 'wrong') setStatus('idle');
              }}
              onSetValue={(newVal) => {
                setValue(newVal);
                if (status === 'wrong') setStatus('idle');
                inputRef.current?.focus();
              }}
              onSubmit={handleSubmit}
              status={status === 'correct' ? 'locked' : status}
              shakeKey={shakeKey}
              disabled={status === 'correct'}
              showLiveBoxes={showLiveBoxes}
              showLetterBank={showLetterBank}
              lastWrongAttempt={lastWrongAttempt}
              aiExplanation={aiExplanation}
              aiCoachLoading={aiCoachLoading}
              onAskAICoach={handleAskAICoach}
            />

            <HintPanel
              onRevealLetter={handleRevealNextLetter}
              onToggleRevealWord={() => setWordRevealed((r) => !r)}
              wordRevealed={wordRevealed}
              onSkip={nextQuestion}
              showTranslation={showTranslation}
              onToggleTranslation={() => setShowTranslation((t) => !t)}
              showLiveBoxes={showLiveBoxes}
              onToggleLiveBoxes={() => setShowLiveBoxes((b) => !b)}
              showLetterBank={showLetterBank}
              onToggleLetterBank={() => setShowLetterBank((l) => !l)}
              disabled={status === 'correct'}
            />
          </motion.main>
        )}
      </div>

      <AnimatePresence>
        {!started && <StartOverlay onStart={handleStart} />}
      </AnimatePresence>

      <AnimatePresence>
        {wordManagerOpen && (
          <WordManagerModal
            words={activeWords}
            sourceLabel={sourceLabel}
            onUpdateWords={handleUpdateWords}
            onResetToDefault={handleResetWords}
            onClose={() => setWordManagerOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mistakeReviewOpen && (
          <MistakeReviewModal
            missedWords={missedWords}
            onStartReviewSession={handleStartMistakeReviewSession}
            onClearMistakes={() => setMissedWords([])}
            onSpeakText={(txt) => speakSentence(txt)}
            onOpenApiKeySettings={() => {
              setMistakeReviewOpen(false);
              setWordManagerOpen(true);
            }}
            onClose={() => setMistakeReviewOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {started && status === 'correct' && item && (
          <SuccessModal
            item={item}
            onNext={nextQuestion}
            onReplayWord={() => speakWordSlow(item.word)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
