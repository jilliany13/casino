"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { confidenceToBet } from "@/engine/game";
import { useGameStore } from "@/store/useGameStore";

const cardTransition: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: cardTransition,
};

const pipMap: Record<string, number[]> = {
  "1": [5],
  "2": [1, 9],
  "3": [1, 5, 9],
  "4": [1, 3, 7, 9],
  "5": [1, 3, 5, 7, 9],
  "6": [1, 3, 4, 6, 7, 9],
};

function OutcomeVisual({
  type,
  label,
  resolved,
}: {
  type: "coin" | "die" | "bag" | "spinner";
  label: string;
  resolved: boolean;
}) {
  if (!resolved) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-dashed border-black/20 bg-white/60 text-2xl font-semibold text-[var(--muted)]">
        ?
      </div>
    );
  }

  if (type === "die") {
    const pips = pipMap[label] ?? [];
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[var(--shadow)]">
        <div className="grid h-16 w-16 grid-cols-3 grid-rows-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => {
            const slot = index + 1;
            const filled = pips.includes(slot);
            return (
              <span
                key={slot}
                className={`h-3 w-3 rounded-full ${filled ? "bg-[var(--ink)]" : "bg-transparent"}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "coin") {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--panel)] text-3xl font-semibold shadow-[var(--shadow)]">
        {label === "Heads" ? "H" : "T"}
      </div>
    );
  }

  if (type === "bag") {
    const color =
      label === "Blue"
        ? "bg-blue-500"
        : "bg-red-500";
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[var(--shadow)]">
        <div className={`h-12 w-12 rounded-full ${color}`} />
      </div>
    );
  }

  const spinnerColor =
    label === "Green"
      ? "bg-emerald-500"
      : label === "Orange"
        ? "bg-orange-400"
        : "bg-amber-200";
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[var(--shadow)]">
      <div className={`h-12 w-12 rotate-45 rounded-lg ${spinnerColor}`} />
    </div>
  );
}

export default function Home() {
  const {
    bankroll,
    status,
    currentRound,
    totalRounds,
    correctRounds,
    totalConfidence,
    largestMismatch,
    varianceHits,
    lastOutcome,
    resolveCurrentRound,
    nextRound,
    resetGame,
  } = useGameStore((state) => state);

  const [showGame, setShowGame] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(60);

  useEffect(() => {
    if (status === "answering") {
      setSelectedIndex(null);
    }
  }, [status, currentRound.id]);

  const bet = useMemo(
    () => confidenceToBet(confidence, bankroll),
    [confidence, bankroll]
  );

  const accuracy = totalRounds ? (correctRounds / totalRounds) * 100 : 0;
  const avgConfidence = totalRounds ? totalConfidence / totalRounds : 0;
  const calibrationGap = avgConfidence - accuracy;

  const canResolve = selectedIndex !== null && status === "answering";
  const outcomeLabel =
    lastOutcome?.outcomes?.[lastOutcome.outcomeIndex] ?? "Unknown";
  const lastType = lastOutcome?.type ?? "coin";

  return (
    <main className="min-h-screen px-4 pb-10 pt-8 text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <AnimatePresence mode="wait">
          {!showGame ? (
            <motion.section
              key="lobby"
              {...cardMotion}
              className="flex flex-col gap-4"
            >
              <header className="flex flex-col gap-3 rounded-3xl bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  Bankroll Confidence
                </p>
                <h1 className="font-[var(--font-display)] text-3xl leading-tight">
                  Bet your belief. Calibrate your gut.
                </h1>
                <p className="text-sm text-[var(--muted)]">
                  Pick the outcome, set your confidence, and survive the swings.
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[var(--accent-strong)]">
                    Win or lose the full bet
                  </span>
                  <span className="rounded-full bg-black/5 px-3 py-1">
                    Variance still applies
                  </span>
                </div>
              </header>

              <section className="grid grid-cols-2 gap-3 rounded-3xl bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Bankroll
                  </p>
                  <p className="text-2xl font-semibold">{bankroll} pts</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Rounds Survived
                  </p>
                  <p className="text-2xl font-semibold">{totalRounds}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Accuracy
                  </p>
                  <p className="text-lg font-semibold">{accuracy.toFixed(1)}%</p>
                  <p className="text-xs text-[var(--muted)]">
                    Avg confidence {avgConfidence.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Mismatch Peak
                  </p>
                  <p className="text-lg font-semibold">{largestMismatch.toFixed(0)}%</p>
                  <p className="text-xs text-[var(--muted)]">
                    Gap {calibrationGap >= 0 ? "+" : ""}
                    {calibrationGap.toFixed(1)}%
                  </p>
                </div>
              </section>

              <button
                type="button"
                onClick={() => setShowGame(true)}
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition"
              >
                Enter the game
              </button>
            </motion.section>
          ) : status !== "answering" && lastOutcome ? (
            <motion.section
              key={lastOutcome.id}
              {...cardMotion}
              className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowGame(false)}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
                >
                  Lobby
                </button>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Round Result
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p
                    className={`text-2xl font-semibold ${
                      lastOutcome.payoutWin
                        ? "text-[var(--accent-strong)]"
                        : "text-[var(--danger)]"
                    }`}
                  >
                    {lastOutcome.payoutWin ? "+" : ""}
                    {lastOutcome.delta} pts
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {lastOutcome.decisionCorrect
                      ? lastOutcome.varianceLoss
                        ? "Correct, but variance flipped the payout."
                        : "Correct call. Confidence paid off."
                      : "Incorrect call. Bet deducted."}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Outcome: {outcomeLabel}
                  </p>
                </div>
                <OutcomeVisual type={lastType} label={outcomeLabel} resolved />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-[var(--muted)]">
                <div>
                  <p>Rounds survived: {totalRounds}</p>
                  <p>Bankroll: {bankroll} pts</p>
                </div>
                <div>
                  <p>Variance hits: {varianceHits}</p>
                  <p>Accuracy: {accuracy.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {status === "resolved" && (
                  <button
                    type="button"
                    onClick={nextRound}
                    className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition"
                  >
                    Next round
                  </button>
                )}
                {status === "gameover" && (
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition"
                  >
                    Restart with 1000
                  </button>
                )}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key={currentRound.id}
              {...cardMotion}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowGame(false)}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
                >
                  Lobby
                </button>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Round {totalRounds + 1}
                </p>
              </div>

              <section className="flex items-center justify-between rounded-3xl bg-[var(--panel)] px-4 py-3 shadow-[var(--shadow)]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Bankroll
                  </p>
                  <p className="text-2xl font-semibold">{bankroll} pts</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Survived
                  </p>
                  <p className="text-xl font-semibold">{totalRounds}</p>
                </div>
              </section>

              <section className="rounded-3xl bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{currentRound.prompt}</h2>
                  <OutcomeVisual
                    type={currentRound.type}
                    label=""
                    resolved={false}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {currentRound.outcomes.map((choice, index) => {
                    const selected = selectedIndex === index;
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                          selected
                            ? "border-[var(--accent)] bg-[rgba(47,125,109,0.12)]"
                            : "border-transparent bg-white/70"
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl bg-[var(--panel)] p-4 shadow-[var(--shadow)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      Confidence
                    </p>
                    <p className="text-2xl font-semibold">{confidence}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      Bet
                    </p>
                    <p className="text-xl font-semibold">{bet} pts</p>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={confidence}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                  className="mt-3 w-full accent-[var(--accent)]"
                />
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIndex !== null) {
                        resolveCurrentRound(selectedIndex, confidence);
                      }
                    }}
                    disabled={!canResolve}
                    className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                  >
                    Reveal outcome
                  </button>
                </div>
              </section>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
