export const BASE_BANKROLL = 1000;
export const WIN_MULTIPLIER = 1;
export const HOUSE_EDGE = 0.06;
export const VARIANCE_LOSS_CHANCE = 0.12;
export const MIN_BET = 5;
export const MAX_BET_RATIO = 0.35;

export type RoundResolution = {
  bet: number;
  delta: number;
  varianceLoss: boolean;
  payoutWin: boolean;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function confidenceToBet(confidence: number, bankroll: number) {
  const normalized = clamp(confidence, 0, 100) / 100;
  const curve = Math.pow(normalized, 2.2);
  const bet = Math.round(bankroll * MAX_BET_RATIO * curve);
  return clamp(Math.max(bet, MIN_BET), MIN_BET, bankroll);
}

export function resolveRound(params: {
  bankroll: number;
  confidence: number;
  isCorrect: boolean;
  payoutMultiplier?: number;
  rng?: () => number;
}): RoundResolution {
  const {
    bankroll,
    confidence,
    isCorrect,
    payoutMultiplier = WIN_MULTIPLIER,
    rng = Math.random,
  } = params;
  const bet = confidenceToBet(confidence, bankroll);
  const varianceLoss = isCorrect && rng() < VARIANCE_LOSS_CHANCE;
  const payoutWin = isCorrect && !varianceLoss;
  const delta = payoutWin ? Math.round(bet * payoutMultiplier) : -bet;

  return { bet, delta, varianceLoss, payoutWin };
}

export function confidenceMismatch(confidence: number, isCorrect: boolean) {
  return Math.abs((isCorrect ? 100 : 0) - clamp(confidence, 0, 100));
}

export function payoutMultiplierForProbability(probability: number) {
  const safeProb = clamp(probability, 0.02, 0.98);
  const fairMultiplier = (1 - safeProb) / safeProb;
  return Math.max(0.1, fairMultiplier * (1 - HOUSE_EDGE));
}
