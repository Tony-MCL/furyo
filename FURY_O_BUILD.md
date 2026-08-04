# Fury O — Build Document

## 1. Project summary

Fury O is a minimalist arcade/reflex game built around one simple control object: a rotating ring with an opening.

The player controls the ring with one finger:

- **Drag/slide** moves the ring along one axis.
- **Tap** reverses the rotation direction immediately.

Objects enter the screen from the edges and travel across the playfield. The primary goal is to **survive for as long as possible without letting incoming objects hit the ring**.

The opening in the ring acts as a bonus opportunity: if the player deliberately lets a normal ball pass through the opening, the ball is "eaten" and awards bonus points.

The core design target is:

> Very easy to understand, difficult to master, fast to restart, and entertaining enough that failure makes the player want one more try.

---

## 2. Working title and identity

**Project / store name:** Fury O

The visual identity should make the final `O` function as the game's ring rather than as a normal typographic letter.

For players familiar with the game, the name can therefore also read visually as **Fury Circle**.

The same open ring shape should be reusable as:

- game object
- logo element
- app icon element
- visual motif in marketing

---

## 3. Technology and workflow

### Application

- Expo
- React Native
- TypeScript
- Expo Router

### Rendering

- **Native Android/iOS:** React Native Skia
- **Web development/testing:** SVG / React Native Web renderer

Web is used as the fast development workbench for logic and basic interaction testing.

Physical Android/iOS devices remain the reference for final control feel, latency, performance and screen scaling.

### Builds and source control

- GitHub repository: `Tony-MCL/furyo`
- GitHub is source of truth.
- Development is performed mainly in GitHub Codespaces.
- EAS Build is used for mobile builds.
- Google Play Internal Testing and TestFlight are used when native testing is useful.

---

## 4. Core gameplay

### Player object

The player controls one ring with an opening.

Current prototype baseline:

- Ring radius: **24 px** in the current web prototype scale
- Ring stroke: **5 px**
- Opening: **75°**
- Rotation: **5.2 seconds per full rotation**

Current design direction is to keep both the opening and ring rotation speed constant during a run. Difficulty should come primarily from the incoming objects rather than from making the player's own control object increasingly frantic.

These values remain gameplay tuning values and can still be adjusted after broader playtesting.

### Controls

#### Drag

- Ring moves vertically only in the current prototype.
- Horizontal movement is locked.
- Ring follows finger/mouse movement directly with no easing or lag.
- Ring cannot leave the visible play area.

#### Tap

- Tap reverses ring rotation direction immediately.
- Rotation continues from the exact current angle.
- There must be no visual jump or restart.

#### Gesture separation

A drag must not accidentally trigger a tap when released.

A small movement threshold separates taps from drags.

---

## 5. Incoming objects

### Normal balls

Normal balls are the main gameplay objects.

Behavior:

- spawn from **all four edges** of the screen
- random spawn position along the selected edge
- travel across the playfield on varying trajectories
- multiple balls can exist at the same time
- object density increases gradually with elapsed game time

Current prototype ball size:

- **12 px diameter**

### Fair-spawn rule

Top and bottom spawns use a **25% center exclusion zone** across the screen width.

This prevents near-center vertical attacks that can create effectively unavoidable situations when the ring itself can only move vertically.

Design principle:

> Fury O may be brutal, but it should not generate situations that feel impossible or unfair.

The player should normally have a meaningful response available: evade the object or deliberately use the opening to eat a normal ball.

### Bombs

Bombs are a planned secondary object type.

They must be visually unmistakable from normal balls.

Bomb rule:

- A bomb is dangerous and should be avoided.
- If a bomb enters through the ring opening and is "eaten", it explodes.
- **BOOM → Game Over.**

Bombs should appear infrequently at first and become part of the visual decision-making pressure later in a run.

Initial object model direction:

```ts
type ObjectType = "ball" | "bomb";
```

Objects should eventually share a common model containing at minimum:

- id
- type
- position
- velocity / direction
- size
- active state

---

## 6. Collision and survival rules

### Main objective

The main objective is **avoidance and survival**, not eating every object.

### Normal ball

- Ball touches the solid ring → **Game Over**
- Ball passes safely without hitting the ring → player survives
- Ball passes fully through the opening and enters the inside of the ring → ball is **eaten**
- An eaten ball is removed immediately and must not continue through the back of the ring
- Eating a normal ball awards bonus points

The prototype has confirmed that the opening/collision geometry works and that deliberately eating balls is meaningfully more difficult than simply avoiding them.

### Bomb

- Bomb must be visually distinguished before it reaches the ring.
- Eating a bomb → **immediate Game Over with explosion feedback**

Exact behavior for a bomb contacting the solid ring can be tuned during gameplay testing, but bombs must never function as safe bonus targets.

---

## 7. Scoring

Scoring should reward survival first and optional risk second.

### Base score

Preferred current model:

- **+1 point per second survived**

Reason:

- scoring remains independent of random spawn density
- time naturally reflects the main objective
- score progression stays predictable even as difficulty changes

### Bonus score

- Eat a normal ball: **+5 points** initially

Bonus value is a tuning parameter and may change after playtesting.

The player should always be able to choose between:

- safe survival
- deliberate risk for additional score

Difficulty must **not** be driven by score, because a player who takes bonus risks should not automatically make the game harder faster.

---

## 8. Difficulty modes and progression

Fury O will have **three selectable difficulty modes**:

1. **Normal**
2. **Fury**
3. **Extreme Fury**

### Unlock progression

- **Normal** is available from the beginning.
- **Fury** is locked until the player reaches a required High Score in Normal.
- **Extreme Fury** is locked until the player reaches a required High Score in Fury.
- The exact unlock score thresholds are **not yet fixed** and must be balanced through playtesting.

Each difficulty mode should have its **own local persistent High Score** so that progression and records remain easy to understand.

Unlocks are local to the device. No account, backend or cloud progression is required.

### Difficulty within a run

Within each mode, difficulty is still driven by **elapsed time in the current run**, not by score.

There are no abrupt traditional levels during gameplay.

### Current difficulty philosophy

The ring itself should remain predictable throughout the run:

- Opening remains approximately **75°**
- Rotation remains approximately **5.2 s / revolution**

The slow rotation is intentionally part of the challenge. As more balls enter the playfield, the player can often see what is coming but cannot instantly move the opening to any desired angle. Reversing rotation becomes a tactical decision rather than simply reacting to a fast-spinning ring.

Difficulty should therefore be created primarily by the **world around the player**, not by continuously changing the player's control characteristics.

### Primary difficulty levers

1. Increase the number of simultaneous balls gradually
2. Increase object density / reduce effective gaps between incoming threats
3. Adjust starting density and progression curves between Normal, Fury and Extreme Fury
4. Introduce bombs as an additional recognition/risk element
5. Bomb probability may increase with difficulty and elapsed run time

### Current Normal baseline

Current gameplay implementation uses:

- Opening: **75°**
- Rotation: **5.2 s / revolution**
- Maximum active balls starts at **5**
- Maximum active balls increases by **1 every 8 seconds**
- Maximum active balls is capped at **20**
- Spawn interval begins around **1100 ms**
- Spawn interval reaches approximately **350 ms** around 12 active balls
- Spawn interval reaches approximately **200 ms** at the final cap
- Ball travel time remains random at approximately **3.6–5.0 seconds**

Travel speed is currently kept constant rather than increasing during the run. Do not change this until testing demonstrates a need.

### Fury and Extreme Fury

Exact differences are deliberately left open until Normal has been tested on physical devices and with outside testers.

Likely tuning parameters include:

- higher starting active-ball count
- shorter starting spawn interval
- faster density progression
- different bomb probability / introduction timing

The three modes must feel clearly different, but the underlying controls and rules remain identical.

Difficulty mode must never become an excuse for unfair collision or mathematically unavoidable spawning.

### Implementation direction

Difficulty should be modeled from both the selected mode and elapsed time.

Conceptual structure:

```ts
const difficulty = getDifficulty(mode, elapsedSeconds);

const spawnInterval = getSpawnInterval(difficulty);
const maxActiveObjects = getMaxActiveObjects(difficulty);
const bombChance = getBombChance(difficulty);
```

Ring values can remain constant unless later testing gives a strong reason to change them:

```ts
const rotationDuration = 5200;
const gapDegrees = 75;
```

Prefer interpolation / smooth curves over visible difficulty steps tied to score.

---

## 9. Revive bonus and rewarded ads

Fury O will include a limited **Revive** bonus.

The Revive is intentionally **not** a purchasable item and is not part of a virtual currency system.

### How Revives are earned

- A player earns **1 Revive by voluntarily watching 1 rewarded advertising video**.
- Revives cannot be bought with money.
- Revives cannot be earned through gameplay score.
- There is **no daily earning limit**.

The advertising video should be watched **before gameplay**, not after a death as an interruption to the run.

This keeps the actual gameplay loop fast and avoids forcing the player into an ad at the moment of failure.

### Revive inventory

- Maximum stored Revives: **3**
- Revives persist locally between app sessions.
- Unused Revives do not expire.
- There is no daily reset and no rollover logic because stored Revives simply remain until used.
- If the inventory is **3/3**, the player cannot earn another Revive.
- After a Revive is used, the player may voluntarily watch another rewarded video to refill the empty slot.

A player may therefore watch as many rewarded ads over time as they choose, but can never stockpile more than three Revives at once.

### Revive use during a run

Hard rule:

> **Maximum one Revive may be used in a single run.**

A Revive is an extra chance, not a way to repeatedly buy survival during one record attempt.

The preferred interaction is to let the player decide **before starting the run** whether a stored Revive should be armed for that run.

If armed:

- the Revive is not consumed merely by starting the game
- the first otherwise-fatal collision can trigger the Revive immediately
- the Revive is consumed only if it actually saves the player
- the run continues with the same score and elapsed difficulty progression
- a second fatal collision in the same run gives normal Game Over

If the player finishes the run without needing the armed Revive, it remains in inventory.

### Revive recovery behavior

Exact visual/gameplay recovery behavior must be tuned during implementation.

Current preferred direction:

- remove or neutralize the object that caused the fatal collision
- give the ring a very short visual protection / recovery window so another object cannot kill the player in the same instant
- continue the same run immediately
- do not reset score, timer, object-density progression or selected difficulty

The protection window must be brief enough that Revive remains a second chance rather than temporary invulnerability.

### Advertising philosophy

Rewarded ads are **voluntary**.

Fury O should not force a rewarded video between rounds or use advertising as a mandatory continuation gate.

The player chooses whether the benefit is worth watching the ad.

---

## 10. Screens

The game should remain extremely small and focused.

### Home

Planned content:

- Fury O logo
- difficulty selection / indication
- Start / Play
- Revive inventory / Earn Revive entry point
- Info button
- copyright footer: `© Morning Coffee Labs`

Score and high score should **not** clutter the home screen unnecessarily.

Locked modes should clearly communicate that they require a score achievement in the preceding difficulty mode.

### Game

Minimal gameplay presentation.

Current presentation includes live score.

Avoid unnecessary UI while playing.

If a Revive has been armed for the run, the UI may show a small unobtrusive indication, but it must not distract from the playfield.

### Game Over

Dedicated screen shown after failure.

Current direction:

- Score
- High Score for the selected difficulty
- branded Fury O Game Over artwork
- Play Again
- Home
- screenshot-friendly presentation

Game Over backgrounds may vary based on score / achievement as a social-sharing gimmick later.

### Info

Should follow the compact style used in other Morning Coffee Labs apps.

Include:

- 3–4 line description of the game
- Privacy Policy link
- Terms of Use link
- Contact link
- optional Facebook / community link
- `© Morning Coffee Labs`

---

## 11. Local persistence

Fury O intentionally has no account or backend.

Local persistent storage should contain only the small amount of state needed by the game.

Current / planned persistent values include:

- High Score for Normal
- High Score for Fury
- High Score for Extreme Fury
- difficulty unlock state, or enough High Score data to derive unlocks
- Revive inventory count, capped at 3

High Score persistence is already implemented in the prototype and survives app/browser restarts.

Unlock state should preferably be derived from stored High Scores where practical rather than duplicating state.

No:

- cloud save
- account synchronization
- global ranking database
- purchase inventory backend

If the app is removed or local app data is deleted, this local progression may also be lost.

---

## 12. Advertising

Advertising is part of the Fury O business model, but should remain restrained.

### Standard advertising

A small banner ad may be used in the gameplay experience as originally planned, provided it does not interfere with controls or safe screen layout.

### Rewarded advertising

Rewarded video ads are used specifically to earn Revives.

Rules:

- entirely voluntary
- one completed eligible ad awards one Revive
- no reward if inventory is already 3/3
- no daily rewarded-ad cap imposed by the game
- advertising provider/platform limitations still apply
- no rewarded-ad interruption at the instant of Game Over is required for the Revive system

The implementation must follow current Google Play, Apple and ad-provider rules, including consent/privacy requirements where applicable.

---

## 13. Social / sharing idea

Later, the Game Over screen can be deliberately designed to make high-score screenshots attractive to share.

Possible ideas:

- multiple unlockable/random Game Over backgrounds
- score prominently visible
- recognizable Fury O ring/logo
- link to a Fury O / Morning Coffee Labs Facebook page from Info

This is not required for the first external gameplay test.

---

## 14. Audio and feedback

Later gameplay feedback should remain simple and punchy.

Potential events:

- normal ball eaten
- ring hit / Game Over
- Revive triggered
- bomb warning / visual cue
- bomb eaten → explosion
- new high score
- new difficulty unlocked

When a normal ball is eaten, a short visual **pop / disappearance / small burst effect** should be evaluated. The ball must disappear inside the ring immediately; it must never travel onward and hit the back of the ring.

A triggered Revive should have clear but very short feedback so the player immediately understands that their one second chance has been consumed.

Haptics should be evaluated on physical devices.

Do not allow audio or effects to damage responsiveness or readability.

---

## 15. Prototype status

### Completed

- Expo / TypeScript project setup
- GitHub / Codespaces workflow
- Web renderer
- Native Skia renderer structure
- Open ring rendered
- Smooth continuous ring rotation
- Tap reverses rotation instantly without jumping
- Vertical drag works smoothly
- Drag and tap separated correctly
- Ring constrained to screen
- Basic size tuning performed
- Current ring radius: 24 px
- Current ball size: 12 px
- Current opening: 75°
- Current rotation: 5.2 s
- Real random spawn system
- Balls spawn from all four screen edges
- Multiple balls coexist
- Top/bottom 25% center spawn exclusion zone
- Ring collision detection
- Solid ring hit triggers Game Over
- Opening correctly allows a normal ball to enter
- Ball is detected as eaten once fully inside the ring
- Eaten ball is removed immediately instead of exiting through the back of the ring
- Survival scoring: +1 point per second
- Normal-ball bonus scoring: +5
- Time-based density progression
- Home screen
- Dedicated branded Game Over presentation
- Play Again / Home flow
- Local persistent High Score storage

### Current gameplay baseline

- maximum active balls starts at **5**
- active-ball cap increases by **1 every 8 seconds**
- final active-ball cap: **20**
- spawn interval: approximately **1.1 s → 0.35 s → 0.2 s** through the current progression
- ball travel time: approximately **3.6–5.0 s**
- opening: **75°**
- ring rotation: **5.2 s / revolution**

### Next major tasks

1. Run an Android EAS build and begin physical-device/external gameplay testing.
2. Define and tune the score thresholds required to unlock Fury and Extreme Fury.
3. Define the concrete difficulty curves for Fury and Extreme Fury after Normal testing.
4. Add difficulty-mode selection and local unlock progression.
5. Add Revive inventory and pre-run arming flow.
6. Integrate rewarded video ads for earning Revives.
7. Implement the one-Revive-per-run recovery behavior.
8. Add bombs after the normal-ball loop is sufficiently tested.
9. Add Info screen and legal/contact links.
10. Add/tune standard banner advertising.

---

## 16. Design principles

Fury O should remain deliberately small even with difficulty progression and Revives.

Do not turn it into a feature-heavy economy game.

Priorities:

1. Immediate controls
2. Smooth motion
3. Readable objects
4. Fair collision
5. Gradual time-based difficulty
6. Predictable ring behavior
7. Fast failure/restart loop
8. Clear difficulty progression
9. Revive as a limited second chance, not a shortcut
10. Strong "one more try" feeling

The game succeeds if the player understands it almost immediately but still feels they can improve after every failure.

The intended emotional balance is:

> Difficult enough to provoke laughter, frustration and swearing — but fair enough that the player believes the next attempt can go better.

And when the one Revive is gone, the next mistake is still:

> **GAME OVER.**
