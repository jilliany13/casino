export type EventType = "coin" | "die" | "bag" | "spinner";

export type EventRound = {
  id: string;
  definitionId: string;
  type: EventType;
  prompt: string;
  outcomes: string[];
};

type EventDefinition = {
  id: string;
  type: EventType;
  prompt: string;
  outcomes: string[];
  weights: number[];
};

const eventDefinitions: EventDefinition[] = [
  {
    id: "coin-fair",
    type: "coin",
    prompt: "Coin flip. What will it land on?",
    outcomes: ["Heads", "Tails"],
    weights: [1, 1],
  },
  {
    id: "die-fair",
    type: "die",
    prompt: "Roll a die. Which number appears?",
    outcomes: ["1", "2", "3", "4", "5", "6"],
    weights: [1, 1, 1, 1, 1, 1],
  },
  {
    id: "bag-blue-red",
    type: "bag",
    prompt: "Bag draw. There are 2 blue and 2 red balls. Which color appears?",
    outcomes: ["Blue", "Red"],
    weights: [1, 1],
  },
  {
    id: "spinner-trio",
    type: "spinner",
    prompt: "Spin a wheel with 3 equal colors. Which color does it land on?",
    outcomes: ["Green", "Orange", "Cream"],
    weights: [1, 1, 1],
  },
  {
    id: "spinner-quad",
    type: "spinner",
    prompt: "Spin a wheel with 4 equal colors. Which color does it land on?",
    outcomes: ["Blue", "Purple", "Orange", "Cream"],
    weights: [1, 1, 1, 1],
  },
];

export function createEventRound(rng: () => number = Math.random): EventRound {
  const index = Math.floor(rng() * eventDefinitions.length);
  const definition = eventDefinitions[index];
  return {
    id: `${definition.type}-${Date.now()}-${Math.floor(rng() * 10000)}`,
    definitionId: definition.id,
    type: definition.type,
    prompt: definition.prompt,
    outcomes: definition.outcomes,
  };
}

export function getEventDefinition(definitionId: string) {
  return eventDefinitions.find((entry) => entry.id === definitionId);
}

export function getOutcomeProbability(definitionId: string, outcomeIndex: number) {
  const definition = getEventDefinition(definitionId);
  if (!definition) {
    return 0.5;
  }
  const total = definition.weights.reduce((sum, weight) => sum + weight, 0);
  const weight = definition.weights[outcomeIndex] ?? 0;
  return total > 0 ? weight / total : 0.5;
}

export function resolveEventRound(
  round: EventRound,
  rng: () => number = Math.random
) {
  const definition = getEventDefinition(round.definitionId);
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
