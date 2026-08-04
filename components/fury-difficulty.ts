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
    startMaxBalls: 5,
    midMaxBalls: 12,
    finalMaxBalls: 20,
    ballCountStepMs: 8000,
    spawnIntervalStartMs: 1100,
    spawnIntervalMidMs: 350,
    spawnIntervalFinalMs: 200,
    ballMinTravelMs: 3600,
    ballMaxTravelMs: 5000,
  },
  fury: {
    label: "FURY",
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
  "extreme-fury": {
    label: "EXTREME FURY",
    startMaxBalls: 9,
    midMaxBalls: 16,
    finalMaxBalls: 24,
    ballCountStepMs: 6000,
    spawnIntervalStartMs: 650,
    spawnIntervalMidMs: 220,
    spawnIntervalFinalMs: 140,
    ballMinTravelMs: 2800,
    ballMaxTravelMs: 3900,
  },
};

export const FURY_DIFFICULTY_ORDER: FuryDifficulty[] = [
  "normal",
  "fury",
  "extreme-fury",
];
