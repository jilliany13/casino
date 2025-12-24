"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BASE_BANKROLL,
  confidenceMismatch,
  payoutMultiplierForProbability,
  resolveRound,
} from "@/engine/game";
import {
  createEventRound,
  getOutcomeProbability,
  resolveEventRound,
  type EventRound,
} from "@/engine/events";

export type GameStatus = "answering" | "resolved" | "gameover";

export type RoundRecord = {
  id: string;
  roundId: string;
  type: EventRound["type"];
  prompt: string;
  outcomes: string[];
  selectedIndex: number;
  outcomeIndex: number;
  outcomeProbability: number;
  payoutMultiplier: number;
  confidence: number;
  bet: number;
  decisionCorrect: boolean;
  varianceLoss: boolean;
  payoutWin: boolean;
  delta: number;
  bankrollAfter: number;
  timestamp: number;
};

type GameState = {
  bankroll: number;
  status: GameStatus;
  currentRound: EventRound;
  totalRounds: number;
  correctRounds: number;
  totalConfidence: number;
  largestMismatch: number;
  varianceHits: number;
  lastOutcome: RoundRecord | null;
  resolveCurrentRound: (selectedIndex: number, confidence: number) => void;
  nextRound: () => void;
  resetGame: () => void;
};

const STORAGE_VERSION = 5;

const buildInitialState = () => {
  const currentRound = createEventRound();
  return {
    bankroll: BASE_BANKROLL,
    status: "answering" as GameStatus,
    currentRound,
    totalRounds: 0,
    correctRounds: 0,
    totalConfidence: 0,
    largestMismatch: 0,
    varianceHits: 0,
    lastOutcome: null,
  };
};

const sanitizePersistedState = (state?: Partial<GameState>) => {
  if (!state || !state.currentRound?.definitionId) {
    return buildInitialState();
  }
  const lastOutcome = state.lastOutcome ?? null;

  return {
    ...buildInitialState(),
    ...state,
    lastOutcome,
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),
      resolveCurrentRound: (selectedIndex, confidence) => {
        const state = get();
        if (state.status !== "answering") {
          return;
        }
        const outcomeIndex = resolveEventRound(state.currentRound);
        const decisionCorrect = selectedIndex === outcomeIndex;
        const outcomeProbability = getOutcomeProbability(
          state.currentRound.definitionId,
          selectedIndex
        );
        const payoutMultiplier = payoutMultiplierForProbability(outcomeProbability);
        const result = resolveRound({
          bankroll: state.bankroll,
          confidence,
          isCorrect: decisionCorrect,
          payoutMultiplier,
        });
        const bankrollAfter = Math.max(0, state.bankroll + result.delta);
        const mismatch = confidenceMismatch(confidence, decisionCorrect);
        const nextTotalRounds = state.totalRounds + 1;
        const nextCorrectRounds = state.correctRounds + (decisionCorrect ? 1 : 0);
        const nextTotalConfidence = state.totalConfidence + confidence;

        const lastOutcome: RoundRecord = {
          id: `${state.currentRound.id}-${Date.now()}`,
          roundId: state.currentRound.id,
          type: state.currentRound.type,
          prompt: state.currentRound.prompt,
          outcomes: state.currentRound.outcomes,
          selectedIndex,
          outcomeIndex,
          outcomeProbability,
          payoutMultiplier,
          confidence,
          bet: result.bet,
          decisionCorrect,
          varianceLoss: result.varianceLoss,
          payoutWin: result.payoutWin,
          delta: result.delta,
          bankrollAfter,
          timestamp: Date.now(),
        };

        set({
          bankroll: bankrollAfter,
          status: bankrollAfter <= 0 ? "gameover" : "resolved",
          totalRounds: nextTotalRounds,
          correctRounds: nextCorrectRounds,
          totalConfidence: nextTotalConfidence,
          largestMismatch: Math.max(state.largestMismatch, mismatch),
          varianceHits: state.varianceHits + (result.varianceLoss ? 1 : 0),
          lastOutcome,
        });
      },
      nextRound: () => {
        const state = get();
        if (state.status === "gameover") {
          return;
        }
        set({
          currentRound: createEventRound(),
          status: "answering",
          lastOutcome: null,
        });
      },
      resetGame: () => {
        set(buildInitialState());
      },
    }),
    {
      name: "bankroll-confidence-v1",
      storage: createJSONStorage(() => localStorage),
      version: STORAGE_VERSION,
      migrate: (persistedState) =>
        sanitizePersistedState(persistedState as Partial<GameState>),
    }
  )
);
