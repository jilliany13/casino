export type EventType = "coin" | "die" | "bag" | "spinner";

export type EventRound = {
  id: string;
  type: EventType;
  prompt: string;
  outcomes: string[];
};

type EventDefinition = {
  type: EventType;
  prompt: string;
  outcomes: string[];
  weights: number[];
};

const eventDefinitions: EventDefinition[] = [
  {
    type: "coin",
    prompt: "Coin flip. What will it land on?",
    outcomes: ["Heads", "Tails"],
    weights: [1, 1],
  },
  {
    type: "die",
    prompt: "Roll a die. Which number appears?",
    outcomes: ["1", "2", "3", "4", "5", "6"],
    weights: [1, 1, 1, 1, 1, 1],
  },
  {
    type: "bag",
    prompt: "Bag draw. There are 3 blue and 2 red balls. Which color appears?",
    outcomes: ["Blue", "Red"],
    weights: [3, 2],
  },
  {
    type: "spinner",
    prompt: "Spin a wheel with 3 equal colors. Which color does it land on?",
    outcomes: ["Green", "Orange", "Cream"],
    weights: [1, 1, 1],
  },
];

export function createEventRound(rng: () => number = Math.random): EventRound {
  const index = Math.floor(rng() * eventDefinitions.length);
  const definition = eventDefinitions[index];
  return {
    id: `${definition.type}-${Date.now()}-${Math.floor(rng() * 10000)}`,
    type: definition.type,
    prompt: definition.prompt,
    outcomes: definition.outcomes,
  };
}

export function resolveEventRound(
  round: EventRound,
  rng: () => number = Math.random
) {
  const definition = eventDefinitions.find((entry) => entry.type === round.type);
  if (!definition) {
    return 0;
  }
  return weightedIndex(definition.weights, rng);
}

function weightedIndex(weights: number[], rng: () => number) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const roll = rng() * total;
  let cursor = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (roll <= cursor) {
      return index;
    }
  }
  return weights.length - 1;
}
