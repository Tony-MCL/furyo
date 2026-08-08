export type FuryLanguage = "en" | "no";

export type FuryStrings = {
  infoTitle: string;
  infoIntro: string;
  infoControls: string;
  infoBonus: string;
  communityTitle: string;
  communityText: string;
  communityButton: string;
  privacyPolicy: string;
  privacyChoices: string;
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
  infoIntro:
    "Survive as long as you can. You score points every second — and at the same time, the fury increases.",
  infoControls:
    "Move the ring up and down. Release your finger to reverse its rotation and get the opening where you need it.",
  infoBonus:
    "Catch regular balls through the opening for +5 points, and hunt the rare +10 balls for an even bigger reward — but control your greed. Miss the opening and hit the ring, and your run is in danger.\n\nBombs are never your friends.\n\nStart the game and see how long you can survive Normal, Fury or Extreme Fury.",
  communityTitle: "FURY O COMMUNITY",
  communityText: "Share your high score, challenge other players and see how long others have survived.",
  communityButton: "JOIN THE FURY O COMMUNITY",
  privacyPolicy: "Privacy Policy",
  privacyChoices: "Privacy choices",
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
  infoIntro:
    "Overlev så lenge du kan. Du får poeng for hvert sekund — og samtidig øker raseriet.",
  infoControls:
    "Flytt ringen opp og ned. Slipp fingeren for å snu rotasjonsretningen og få åpningen dit du trenger den.",
  infoBonus:
    "Fang vanlige baller gjennom åpningen for +5 poeng, og jakt på de sjeldne +10-ballene for enda større uttelling, men kontroller grådigheten. Bommer du på åpningen og treffer ringen, er runden i fare.\n\nBomber er aldri vennene dine.\n\nStart spillet og se hvor lenge du overlever Normal, Fury eller Extreme Fury.",
  communityTitle: "FURY O-FELLESSKAPET",
  communityText: "Del rekorden din, utfordre andre spillere og se hvor lenge andre har overlevd.",
  communityButton: "BLI MED I FURY O-FELLESSKAPET",
  privacyPolicy: "Personvern",
  privacyChoices: "Personvernvalg",
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
