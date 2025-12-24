"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { confidenceToBet } from "@/engine/game";
import { useGameStore } from "@/store/useGameStore";

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: "easeOut" },
};

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
  const selectionLabel =
    lastOutcome?.outcomes?.[lastOutcome.selectedIndex] ?? "Unknown";

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Bankroll Confidence
          </p>
          <h1 className="font-[var(--font-display)] text-3xl leading-tight">
            Bet your belief. Calibrate your gut.
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Pick the outcome, set your confidence, and survive the swings.
          </p>
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

        <AnimatePresence mode="wait">
          {currentRound && (
            <motion.section
              key={currentRound.id}
              {...cardMotion}
              className="rounded-3xl bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Round {totalRounds + 1}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{currentRound.prompt}</h2>
              <div className="mt-4 flex flex-col gap-3">
                {currentRound.outcomes.map((choice, index) => {
                  const selected = selectedIndex === index;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      disabled={status !== "answering"}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-[var(--accent)] bg-[rgba(47,125,109,0.12)]"
                          : "border-transparent bg-white/70"
                      } ${status !== "answering" ? "opacity-70" : ""}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="rounded-3xl bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Confidence
              </p>
              <p className="text-2xl font-semibold">{confidence}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Bet Size
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
            className="mt-4 w-full accent-[var(--accent)]"
          />
          <p className="mt-3 text-xs text-[var(--muted)]">
            Higher confidence risks more of your bankroll. Even correct calls can
            lose during variance spikes.
          </p>
        </section>

        <div className="flex flex-col gap-3">
          {status === "answering" && (
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
              Resolve round
            </button>
          )}
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

        <AnimatePresence>
          {lastOutcome && (
            <motion.section
              key={lastOutcome.id}
              {...cardMotion}
              className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Round Result
                </p>
                <p
                  className={`text-sm font-semibold ${
                    lastOutcome.payoutWin ? "text-[var(--accent-strong)]" : "text-[var(--danger)]"
                  }`}
                >
                  {lastOutcome.payoutWin ? "+" : ""}
                  {lastOutcome.delta} pts
                </p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {lastOutcome.decisionCorrect
                  ? lastOutcome.varianceLoss
                    ? "Correct, but variance flipped the payout."
                    : "Correct call. Confidence paid off."
                  : "Incorrect call. Bet deducted."}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                You picked {selectionLabel}. Outcome was {outcomeLabel}.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--muted)]">
                <div>
                  <p>Bet: {lastOutcome.bet} pts</p>
                  <p>Confidence: {lastOutcome.confidence}%</p>
                </div>
                <div>
                  <p>Variance hits: {varianceHits}</p>
                  <p>Bankroll: {lastOutcome.bankrollAfter} pts</p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
