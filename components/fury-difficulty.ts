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
    startMaxBalls: 13,
    midMaxBalls: 20,
    finalMaxBalls: 28,
    ballCountStepMs: 4500,
    spawnIntervalStartMs: 380,
    spawnIntervalMidMs: 170,
    spawnIntervalFinalMs: 110,
    ballMinTravelMs: 2600,
    ballMaxTravelMs: 3600,
  },
  "extreme-fury": {
    label: "EXTREME FURY",
    startMaxBalls: 18,
    midMaxBalls: 24,
    finalMaxBalls: 32,
    ballCountStepMs: 3500,
    spawnIntervalStartMs: 180,
    spawnIntervalMidMs: 115,
    spawnIntervalFinalMs: 85,
    ballMinTravelMs: 1750,
    ballMaxTravelMs: 2500,
  },
};

export const FURY_DIFFICULTY_ORDER: FuryDifficulty[] = [
  "normal",
  "fury",
  "extreme-fury",
];
