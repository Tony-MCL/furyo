export type FuryDifficulty = "normal" | "fury" | "extreme-fury";

export type FuryDifficultyConfig = {
  label: string;
  startMaxBalls: number;
  midMaxBalls: number;
  finalMaxBalls: number;
  ballCountStepMs: number;
  spawnIntervalStartMs: number;
  spawnIntervalMidMs: number;
  spawnIntervalFinalMs: number;
  ballMinTravelMs: number;
  ballMaxTravelMs: number;
};

export const FURY_DIFFICULTIES: Record<
  FuryDifficulty,
  FuryDifficultyConfig
> = {
  normal: {
    label: "NORMAL",
    startMaxBalls: 7,
    midMaxBalls: 14,
    finalMaxBalls: 22,
    ballCountStepMs: 7000,
    spawnIntervalStartMs: 850,
    spawnIntervalMidMs: 280,
    spawnIntervalFinalMs: 170,
    ballMinTravelMs: 3200,
    ballMaxTravelMs: 4400,
  },
  fury: {
    label: "FURY",
    startMaxBalls: 10,
    midMaxBalls: 18,
    finalMaxBalls: 27,
    ballCountStepMs: 5500,
    spawnIntervalStartMs: 580,
    spawnIntervalMidMs: 190,
    spawnIntervalFinalMs: 120,
    ballMinTravelMs: 2700,
    ballMaxTravelMs: 3700,
  },
  "extreme-fury": {
    label: "EXTREME FURY",
    startMaxBalls: 13,
    midMaxBalls: 21,
    finalMaxBalls: 30,
    ballCountStepMs: 4500,
    spawnIntervalStartMs: 450,
    spawnIntervalMidMs: 150,
    spawnIntervalFinalMs: 100,
    ballMinTravelMs: 2100,
    ballMaxTravelMs: 3000,
  },
};

export const FURY_DIFFICULTY_ORDER: FuryDifficulty[] = [
  "normal",
  "fury",
  "extreme-fury",
];
