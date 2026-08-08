export type FuryLanguage = "en" | "no" | "de" | "fr" | "es" | "ar" | "zh" | "pl" | "pt" | "sv" | "da" | "ru";

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
  infoTitle: "INFO", infoIntro: "Survive as long as you can. You score points every second — and at the same time, the fury increases.", infoControls: "Move the ring up and down. Release your finger to reverse its rotation and get the opening where you need it.", infoBonus: "Catch regular balls through the opening for +5 points, and hunt the rare +10 balls for an even bigger reward — but control your greed. Miss the opening and hit the ring, and your run is in danger.\n\nBombs are never your friends.\n\nStart the game and see how long you can survive Normal, Fury or Extreme Fury.", communityTitle: "FURY O COMMUNITY", communityText: "Share your high score, challenge other players and see how long others have survived.", communityButton: "JOIN THE FURY O COMMUNITY", privacyPolicy: "Privacy Policy", privacyChoices: "Privacy choices", termsOfUse: "Terms of Use", contact: "Contact", revives: "REVIVES", noReviveEarned: "No Revive earned", adNotReady: "The ad isn't ready. Try again.", reviveFull: "REVIVES FULL", loadingAd: "LOADING AD...", earnRevive: "EARN REVIVE", reviveHint: "Watch a rewarded ad to earn +1 Revive", difficulty: "DIFFICULTY", startGame: "START GAME", score: "Score", highScore: "High Score", usedThisRound: "USED THIS ROUND", ready: "READY", empty: "EMPTY", revive: "REVIVE!", playAgain: "PLAY AGAIN", home: "HOME",
};

const NO: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Overlev så lenge du kan. Du får poeng for hvert sekund — og samtidig øker raseriet.", infoControls: "Flytt ringen opp og ned. Slipp fingeren for å snu rotasjonsretningen og få åpningen dit du trenger den.", infoBonus: "Fang vanlige baller gjennom åpningen for +5 poeng, og jakt på de sjeldne +10-ballene for enda større uttelling, men kontroller grådigheten. Bommer du på åpningen og treffer ringen, er runden i fare.\n\nBomber er aldri vennene dine.\n\nStart spillet og se hvor lenge du overlever Normal, Fury eller Extreme Fury.", communityTitle: "FURY O-FELLESSKAPET", communityText: "Del rekorden din, utfordre andre spillere og se hvor lenge andre har overlevd.", communityButton: "BLI MED I FURY O-FELLESSKAPET", privacyPolicy: "Personvern", privacyChoices: "Personvernvalg", termsOfUse: "Bruksvilkår", contact: "Kontakt", revives: "REVIVES", noReviveEarned: "Ingen Revive opptjent", adNotReady: "Annonsen er ikke klar. Prøv igjen.", reviveFull: "MAKS REVIVES", loadingAd: "LASTER ANNONSE...", earnRevive: "TJEN REVIVE", reviveHint: "Se en annonse for å tjene +1 Revive", difficulty: "VANSKELIGHETSGRAD", startGame: "START SPILL", score: "Poeng", highScore: "Rekord", usedThisRound: "BRUKT DENNE RUNDEN", ready: "KLAR", empty: "TOM", revive: "REVIVE!", playAgain: "SPILL IGJEN", home: "HJEM",
};

const DE: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Überlebe so lange wie möglich. Du bekommst jede Sekunde Punkte — und gleichzeitig steigt die Wut.", infoControls: "Bewege den Ring nach oben und unten. Lass den Finger los, um die Drehrichtung umzukehren und die Öffnung dorthin zu bringen, wo du sie brauchst.", infoBonus: "Fange normale Bälle durch die Öffnung für +5 Punkte und jage die seltenen +10-Bälle für eine noch größere Belohnung — aber werde nicht zu gierig. Verfehlst du die Öffnung und triffst den Ring, ist dein Lauf in Gefahr.\n\nBomben sind niemals deine Freunde.\n\nStarte das Spiel und finde heraus, wie lange du Normal, Fury oder Extreme Fury überlebst.", communityTitle: "FURY O COMMUNITY", communityText: "Teile deinen Highscore, fordere andere Spieler heraus und sieh, wie lange andere überlebt haben.", communityButton: "DER FURY O COMMUNITY BEITRETEN", privacyPolicy: "Datenschutz", privacyChoices: "Datenschutzeinstellungen", termsOfUse: "Nutzungsbedingungen", contact: "Kontakt", revives: "REVIVES", noReviveEarned: "Kein Revive erhalten", adNotReady: "Die Anzeige ist noch nicht bereit. Versuch es erneut.", reviveFull: "REVIVES VOLL", loadingAd: "ANZEIGE WIRD GELADEN...", earnRevive: "REVIVE VERDIENEN", reviveHint: "Sieh dir eine Werbeanzeige an und erhalte +1 Revive", difficulty: "SCHWIERIGKEIT", startGame: "SPIEL STARTEN", score: "Punkte", highScore: "Highscore", usedThisRound: "IN DIESER RUNDE BENUTZT", ready: "BEREIT", empty: "LEER", revive: "REVIVE!", playAgain: "NOCHMAL SPIELEN", home: "START",
};

const FR: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Survis aussi longtemps que possible. Tu marques des points chaque seconde — et en même temps, la fureur augmente.", infoControls: "Déplace l'anneau vers le haut et le bas. Relâche ton doigt pour inverser le sens de rotation et placer l'ouverture là où tu en as besoin.", infoBonus: "Fais passer les balles normales par l'ouverture pour gagner +5 points et chasse les rares balles +10 pour une récompense encore plus grande — mais maîtrise ta cupidité. Si tu rates l'ouverture et touches l'anneau, ta partie est en danger.\n\nLes bombes ne sont jamais tes amies.\n\nLance le jeu et découvre combien de temps tu peux survivre en Normal, Fury ou Extreme Fury.", communityTitle: "COMMUNAUTÉ FURY O", communityText: "Partage ton meilleur score, défie d'autres joueurs et découvre combien de temps ils ont survécu.", communityButton: "REJOINDRE LA COMMUNAUTÉ FURY O", privacyPolicy: "Politique de confidentialité", privacyChoices: "Choix de confidentialité", termsOfUse: "Conditions d'utilisation", contact: "Contact", revives: "REVIVES", noReviveEarned: "Aucun Revive obtenu", adNotReady: "La publicité n'est pas prête. Réessaie.", reviveFull: "REVIVES AU MAXIMUM", loadingAd: "CHARGEMENT DE LA PUB...", earnRevive: "GAGNER UN REVIVE", reviveHint: "Regarde une publicité récompensée pour gagner +1 Revive", difficulty: "DIFFICULTÉ", startGame: "JOUER", score: "Score", highScore: "Meilleur score", usedThisRound: "UTILISÉ CE TOUR", ready: "PRÊT", empty: "VIDE", revive: "REVIVE !", playAgain: "REJOUER", home: "ACCUEIL",
};

const ES: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Sobrevive todo lo que puedas. Ganas puntos cada segundo — y al mismo tiempo, la furia aumenta.", infoControls: "Mueve el anillo hacia arriba y hacia abajo. Suelta el dedo para invertir el sentido de giro y colocar la abertura donde la necesites.", infoBonus: "Atrapa las bolas normales a través de la abertura para ganar +5 puntos y busca las raras bolas de +10 para conseguir una recompensa aún mayor — pero controla tu codicia. Si fallas la abertura y golpeas el anillo, tu partida estará en peligro.\n\nLas bombas nunca son tus amigas.\n\nEmpieza a jugar y descubre cuánto tiempo puedes sobrevivir en Normal, Fury o Extreme Fury.", communityTitle: "COMUNIDAD FURY O", communityText: "Comparte tu récord, desafía a otros jugadores y descubre cuánto tiempo han sobrevivido.", communityButton: "ÚNETE A LA COMUNIDAD FURY O", privacyPolicy: "Política de privacidad", privacyChoices: "Opciones de privacidad", termsOfUse: "Términos de uso", contact: "Contacto", revives: "REVIVES", noReviveEarned: "No has conseguido ningún Revive", adNotReady: "El anuncio aún no está listo. Inténtalo de nuevo.", reviveFull: "REVIVES COMPLETOS", loadingAd: "CARGANDO ANUNCIO...", earnRevive: "CONSEGUIR REVIVE", reviveHint: "Mira un anuncio recompensado para conseguir +1 Revive", difficulty: "DIFICULTAD", startGame: "EMPEZAR", score: "Puntuación", highScore: "Récord", usedThisRound: "USADO ESTA RONDA", ready: "LISTO", empty: "VACÍO", revive: "¡REVIVE!", playAgain: "JUGAR DE NUEVO", home: "INICIO",
};

const AR: FuryStrings = {
  infoTitle: "معلومات", infoIntro: "ابقَ على قيد اللعب لأطول وقت ممكن. تحصل على نقاط كل ثانية — وفي الوقت نفسه تزداد حدة اللعبة.", infoControls: "حرّك الحلقة لأعلى ولأسفل. ارفع إصبعك لعكس اتجاه الدوران ووضع الفتحة في المكان الذي تحتاجه.", infoBonus: "مرّر الكرات العادية عبر الفتحة لتحصل على +5 نقاط، وطارد كرات +10 النادرة للحصول على مكافأة أكبر — لكن لا تدع الطمع يسيطر عليك. إذا أخطأت الفتحة واصطدمت الكرة بالحلقة، تصبح جولتك في خطر.\n\nالقنابل ليست أصدقاءك أبداً.\n\nابدأ اللعب واكتشف كم يمكنك الصمود في Normal أو Fury أو Extreme Fury.", communityTitle: "مجتمع FURY O", communityText: "شارك أعلى نتيجة لديك، وتحدَّ لاعبين آخرين، واكتشف كم استطاع الآخرون الصمود.", communityButton: "انضم إلى مجتمع FURY O", privacyPolicy: "سياسة الخصوصية", privacyChoices: "خيارات الخصوصية", termsOfUse: "شروط الاستخدام", contact: "اتصل بنا", revives: "REVIVES", noReviveEarned: "لم تحصل على Revive", adNotReady: "الإعلان غير جاهز بعد. حاول مرة أخرى.", reviveFull: "REVIVES ممتلئة", loadingAd: "جارٍ تحميل الإعلان...", earnRevive: "احصل على REVIVE", reviveHint: "شاهد إعلاناً بمكافأة لتحصل على +1 Revive", difficulty: "الصعوبة", startGame: "ابدأ اللعب", score: "النتيجة", highScore: "أعلى نتيجة", usedThisRound: "مستخدم في هذه الجولة", ready: "جاهز", empty: "فارغ", revive: "REVIVE!", playAgain: "العب مرة أخرى", home: "الرئيسية",
};

const ZH: FuryStrings = {
  infoTitle: "信息", infoIntro: "尽可能坚持更久。你每秒都会获得分数——同时，游戏也会越来越疯狂。", infoControls: "上下移动圆环。松开手指即可反转旋转方向，把缺口转到你需要的位置。", infoBonus: "让普通球穿过缺口可获得 +5 分，追逐稀有的 +10 球还能获得更多奖励——但别太贪心。如果没有穿过缺口而撞到圆环，你的这一局就危险了。\n\n炸弹永远不是你的朋友。\n\n开始游戏，看看你能在 Normal、Fury 或 Extreme Fury 中坚持多久。", communityTitle: "FURY O 社区", communityText: "分享你的最高分，挑战其他玩家，看看别人能坚持多久。", communityButton: "加入 FURY O 社区", privacyPolicy: "隐私政策", privacyChoices: "隐私选项", termsOfUse: "使用条款", contact: "联系我们", revives: "REVIVES", noReviveEarned: "未获得 Revive", adNotReady: "广告尚未准备好，请重试。", reviveFull: "REVIVE 已满", loadingAd: "正在加载广告...", earnRevive: "获取 REVIVE", reviveHint: "观看奖励广告可获得 +1 Revive", difficulty: "难度", startGame: "开始游戏", score: "得分", highScore: "最高分", usedThisRound: "本局已使用", ready: "就绪", empty: "空", revive: "REVIVE!", playAgain: "再玩一次", home: "主页",
};

const PL: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Przetrwaj tak długo, jak potrafisz. Zdobywasz punkty co sekundę — a jednocześnie furia rośnie.", infoControls: "Przesuwaj pierścień w górę i w dół. Puść palec, aby odwrócić kierunek obrotu i ustawić otwór tam, gdzie go potrzebujesz.", infoBonus: "Łap zwykłe kule przez otwór za +5 punktów i poluj na rzadkie kule +10, aby zdobyć jeszcze większą nagrodę — ale nie bądź zbyt chciwy. Jeśli ominiesz otwór i trafisz w pierścień, twoja runda jest zagrożona.\n\nBomby nigdy nie są twoimi przyjaciółmi.\n\nUruchom grę i sprawdź, jak długo przetrwasz na Normal, Fury lub Extreme Fury.", communityTitle: "SPOŁECZNOŚĆ FURY O", communityText: "Udostępnij swój rekord, rzuć wyzwanie innym graczom i zobacz, jak długo przetrwali.", communityButton: "DOŁĄCZ DO SPOŁECZNOŚCI FURY O", privacyPolicy: "Polityka prywatności", privacyChoices: "Ustawienia prywatności", termsOfUse: "Warunki użytkowania", contact: "Kontakt", revives: "REVIVES", noReviveEarned: "Nie zdobyto Revive", adNotReady: "Reklama nie jest jeszcze gotowa. Spróbuj ponownie.", reviveFull: "REVIVES PEŁNE", loadingAd: "ŁADOWANIE REKLAMY...", earnRevive: "ZDOBĄDŹ REVIVE", reviveHint: "Obejrzyj reklamę z nagrodą, aby zdobyć +1 Revive", difficulty: "POZIOM TRUDNOŚCI", startGame: "START", score: "Wynik", highScore: "Rekord", usedThisRound: "UŻYTO W TEJ RUNDZIE", ready: "GOTOWY", empty: "PUSTY", revive: "REVIVE!", playAgain: "ZAGRAJ PONOWNIE", home: "START",
};

const PT: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Sobrevive o máximo de tempo que conseguires. Ganhas pontos a cada segundo — e, ao mesmo tempo, a fúria aumenta.", infoControls: "Move o anel para cima e para baixo. Solta o dedo para inverter o sentido da rotação e colocar a abertura onde precisas.", infoBonus: "Apanha as bolas normais através da abertura para ganhar +5 pontos e caça as raras bolas +10 para uma recompensa ainda maior — mas controla a ganância. Se falhares a abertura e atingires o anel, a tua partida fica em perigo.\n\nAs bombas nunca são tuas amigas.\n\nComeça o jogo e descobre quanto tempo consegues sobreviver em Normal, Fury ou Extreme Fury.", communityTitle: "COMUNIDADE FURY O", communityText: "Partilha o teu recorde, desafia outros jogadores e vê quanto tempo conseguiram sobreviver.", communityButton: "JUNTA-TE À COMUNIDADE FURY O", privacyPolicy: "Política de Privacidade", privacyChoices: "Opções de privacidade", termsOfUse: "Termos de Utilização", contact: "Contacto", revives: "REVIVES", noReviveEarned: "Nenhum Revive ganho", adNotReady: "O anúncio ainda não está pronto. Tenta novamente.", reviveFull: "REVIVES CHEIOS", loadingAd: "A CARREGAR ANÚNCIO...", earnRevive: "GANHAR REVIVE", reviveHint: "Vê um anúncio com recompensa para ganhar +1 Revive", difficulty: "DIFICULDADE", startGame: "INICIAR JOGO", score: "Pontuação", highScore: "Recorde", usedThisRound: "USADO NESTA RONDA", ready: "PRONTO", empty: "VAZIO", revive: "REVIVE!", playAgain: "JOGAR NOVAMENTE", home: "INÍCIO",
};

const SV: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Överlev så länge du kan. Du får poäng varje sekund — samtidigt som raseriet ökar.", infoControls: "Flytta ringen upp och ner. Släpp fingret för att vända rotationsriktningen och få öppningen dit du behöver den.", infoBonus: "Fånga vanliga bollar genom öppningen för +5 poäng och jaga de sällsynta +10-bollarna för en ännu större belöning — men kontrollera girigheten. Missar du öppningen och träffar ringen är rundan i fara.\n\nBomber är aldrig dina vänner.\n\nStarta spelet och se hur länge du överlever Normal, Fury eller Extreme Fury.", communityTitle: "FURY O-GEMENSKAPEN", communityText: "Dela ditt rekord, utmana andra spelare och se hur länge andra har överlevt.", communityButton: "GÅ MED I FURY O-GEMENSKAPEN", privacyPolicy: "Integritetspolicy", privacyChoices: "Integritetsval", termsOfUse: "Användarvillkor", contact: "Kontakt", revives: "REVIVES", noReviveEarned: "Ingen Revive intjänad", adNotReady: "Annonsen är inte klar. Försök igen.", reviveFull: "MAX REVIVES", loadingAd: "LADDAR ANNONS...", earnRevive: "TJÄNA REVIVE", reviveHint: "Titta på en belönad annons för att tjäna +1 Revive", difficulty: "SVÅRIGHETSGRAD", startGame: "STARTA SPEL", score: "Poäng", highScore: "Rekord", usedThisRound: "ANVÄND DENNA RUNDA", ready: "KLAR", empty: "TOM", revive: "REVIVE!", playAgain: "SPELA IGEN", home: "HEM",
};

const DA: FuryStrings = {
  infoTitle: "INFO", infoIntro: "Overlev så længe du kan. Du får point hvert sekund — samtidig med at raseriet stiger.", infoControls: "Flyt ringen op og ned. Slip fingeren for at vende rotationsretningen og få åbningen derhen, hvor du har brug for den.", infoBonus: "Fang almindelige bolde gennem åbningen for +5 point, og jagt de sjældne +10-bolde for en endnu større belønning — men styr din grådighed. Rammer du ikke åbningen, men ringen, er din runde i fare.\n\nBomber er aldrig dine venner.\n\nStart spillet og se, hvor længe du kan overleve Normal, Fury eller Extreme Fury.", communityTitle: "FURY O-FÆLLESSKABET", communityText: "Del din rekord, udfordr andre spillere og se, hvor længe andre har overlevet.", communityButton: "BLIV EN DEL AF FURY O-FÆLLESSKABET", privacyPolicy: "Privatlivspolitik", privacyChoices: "Valg for privatliv", termsOfUse: "Brugsvilkår", contact: "Kontakt", revives: "REVIVES", noReviveEarned: "Ingen Revive optjent", adNotReady: "Annoncen er ikke klar. Prøv igen.", reviveFull: "MAKS REVIVES", loadingAd: "INDLÆSER ANNONCE...", earnRevive: "OPTJEN REVIVE", reviveHint: "Se en belønnet annonce for at optjene +1 Revive", difficulty: "SVÆRHEDSGRAD", startGame: "START SPIL", score: "Point", highScore: "Rekord", usedThisRound: "BRUGT DENNE RUNDE", ready: "KLAR", empty: "TOM", revive: "REVIVE!", playAgain: "SPIL IGEN", home: "HJEM",
};

const RU: FuryStrings = {
  infoTitle: "ИНФО", infoIntro: "Продержись как можно дольше. Ты получаешь очки каждую секунду — и одновременно ярость нарастает.", infoControls: "Перемещай кольцо вверх и вниз. Отпусти палец, чтобы изменить направление вращения и расположить отверстие там, где нужно.", infoBonus: "Лови обычные шары через отверстие и получай +5 очков, а редкие шары +10 принесут ещё больше — но не жадничай. Если промахнёшься мимо отверстия и попадёшь в кольцо, твой забег окажется под угрозой.\n\nБомбы никогда не бывают твоими друзьями.\n\nНачни игру и узнай, как долго сможешь продержаться на Normal, Fury или Extreme Fury.", communityTitle: "СООБЩЕСТВО FURY O", communityText: "Делись своим рекордом, бросай вызов другим игрокам и смотри, как долго продержались они.", communityButton: "ПРИСОЕДИНИТЬСЯ К СООБЩЕСТВУ FURY O", privacyPolicy: "Политика конфиденциальности", privacyChoices: "Настройки конфиденциальности", termsOfUse: "Условия использования", contact: "Связаться", revives: "REVIVES", noReviveEarned: "Revive не получен", adNotReady: "Реклама ещё не готова. Попробуй снова.", reviveFull: "REVIVES ЗАПОЛНЕНЫ", loadingAd: "ЗАГРУЗКА РЕКЛАМЫ...", earnRevive: "ПОЛУЧИТЬ REVIVE", reviveHint: "Посмотри рекламу с наградой, чтобы получить +1 Revive", difficulty: "СЛОЖНОСТЬ", startGame: "НАЧАТЬ ИГРУ", score: "Счёт", highScore: "Рекорд", usedThisRound: "ИСПОЛЬЗОВАНО В ЭТОМ РАУНДЕ", ready: "ГОТОВО", empty: "ПУСТО", revive: "REVIVE!", playAgain: "ИГРАТЬ СНОВА", home: "ГЛАВНАЯ",
};

function detectLanguage(): FuryLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith("nb") || locale.startsWith("nn") || locale.startsWith("no")) return "no";
    if (locale.startsWith("de")) return "de";
    if (locale.startsWith("fr")) return "fr";
    if (locale.startsWith("es")) return "es";
    if (locale.startsWith("ar")) return "ar";
    if (locale.startsWith("zh")) return "zh";
    if (locale.startsWith("pl")) return "pl";
    if (locale.startsWith("pt")) return "pt";
    if (locale.startsWith("sv")) return "sv";
    if (locale.startsWith("da")) return "da";
    if (locale.startsWith("ru")) return "ru";
  } catch {
    // English fallback below.
  }
  return "en";
}

const TRANSLATIONS: Record<FuryLanguage, FuryStrings> = {
  en: EN, no: NO, de: DE, fr: FR, es: ES, ar: AR, zh: ZH, pl: PL, pt: PT, sv: SV, da: DA, ru: RU,
};

export const furyLanguage: FuryLanguage = detectLanguage();
export const strings: FuryStrings = TRANSLATIONS[furyLanguage];