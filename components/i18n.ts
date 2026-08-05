export type FuryLanguage = "en" | "no";

const EN = {
  infoTitle: "INFO",
  infoIntro: "Move the ring. Control the opening. Survive as long as you can.",
  infoControls:
    "Drag up and down to move the ring. When you release your finger, the ring reverses rotation.",
  infoBonus:
    "Eat normal balls through the opening for bonus points — but don't get too greedy.",
  privacyPolicy: "Privacy Policy",
  termsOfUse: "Terms of Use",
  contact: "Contact",
  revives: "REVIVES",
  noReviveEarned: "No Revive earned",
  adNotReady: "The ad isn't ready. Try again.",
  reviveFull: "REVIVES FULL",
  loadingAd: "LOADING AD...",
  earnRevive: "EARN REVIVE",
  reviveHint: "Watch a rewarded ad to earn +1 Revive",
  difficulty: "DIFFICULTY",
  startGame: "START GAME",
  score: "Score",
  highScore: "High Score",
  usedThisRound: "USED THIS ROUND",
  ready: "READY",
  empty: "EMPTY",
  revive: "REVIVE!",
  playAgain: "PLAY AGAIN",
  home: "HOME",
} as const;

const NO: typeof EN = {
  infoTitle: "INFO",
  infoIntro: "Flytt ringen. Kontroller åpningen. Overlev så lenge du kan.",
  infoControls:
    "Dra opp og ned for å flytte ringen. Når du slipper fingeren, snur ringen rotasjonsretning.",
  infoBonus:
    "Spis vanlige baller gjennom åpningen for bonuspoeng — men ikke bli for grådig.",
  privacyPolicy: "Personvern",
  termsOfUse: "Bruksvilkår",
  contact: "Kontakt",
  revives: "REVIVES",
  noReviveEarned: "Ingen Revive opptjent",
  adNotReady: "Annonsen er ikke klar. Prøv igjen.",
  reviveFull: "REVIVES FULLE",
  loadingAd: "LASTER ANNONSE...",
  earnRevive: "TJEN REVIVE",
  reviveHint: "Se en belønnet annonse for å tjene +1 Revive",
  difficulty: "VANSKELIGHETSGRAD",
  startGame: "START SPILL",
  score: "Poeng",
  highScore: "Rekord",
  usedThisRound: "BRUKT DENNE RUNDEN",
  ready: "KLAR",
  empty: "TOM",
  revive: "REVIVE!",
  playAgain: "SPILL IGJEN",
  home: "HJEM",
};

export type FuryStrings = typeof EN;

function detectLanguage(): FuryLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith("nb") || locale.startsWith("nn") || locale.startsWith("no")) {
      return "no";
    }
  } catch {
    // English fallback below.
  }

  return "en";
}

export const furyLanguage: FuryLanguage = detectLanguage();
export const strings: FuryStrings = furyLanguage === "no" ? NO : EN;
