export type FuryLanguage = "en" | "no";

export type FuryStrings = {
  infoTitle: string;
  infoIntro: string;
  infoControls: string;
  infoBonus: string;
  privacyPolicy: string;
  termsOfUse: string;
  contact: string;
  revives: string;
  noReviveEarned: string;
  adNotReady: string;
  reviveFull: string;
  loadingAd: string;
  earnRevive: string;
  reviveHint: string;
  difficulty: string;
  startGame: string;
  score: string;
  highScore: string;
  usedThisRound: string;
  ready: string;
  empty: string;
  revive: string;
  playAgain: string;
  home: string;
};

const EN: FuryStrings = {
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
};

const NO: FuryStrings = {
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
  reviveFull: "MAKS REVIVES",
  loadingAd: "LASTER ANNONSE...",
  earnRevive: "TJEN REVIVE",
  reviveHint: "Se en annonse for å tjene +1 Revive",
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
