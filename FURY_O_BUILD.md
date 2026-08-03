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
- Opening: **75°** at game start
- Starting rotation: **5.2 seconds per full rotation**

These values are gameplay tuning values, not permanent constants.

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

Planned behavior:

- spawn from **all four edges** of the screen
- random spawn position along the selected edge
- travel across the playfield on varying trajectories
- multiple balls can exist at the same time
- object density increases gradually with elapsed game time

Current prototype ball size:

- **12 px diameter**

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
- Ball passes through the opening → ball is eaten and bonus points are awarded

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

## 8. Difficulty progression

Difficulty is driven primarily by **elapsed time in the current run**.

There are no traditional levels or abrupt level changes.

The game should gradually become more chaotic through several independent parameters.

### Difficulty levers

1. More simultaneous objects
2. Shorter average spawn intervals
3. More varied trajectories / directions
4. Ring opening gradually closes
5. Ring rotation gradually speeds up
6. Bomb probability can increase gradually

### Current intended range

#### Start

- Opening: **75°**
- Rotation: **5.2 s / revolution**
- Low object count

#### Mid-run example

A possible target around an established run:

- approximately **10–12 balls/objects active**
- opening around **70°**
- rotation around **4.0 s / revolution**

This is only a tuning reference. Actual values must be determined by playtesting because balls arriving from all directions will create substantially more pressure than the original single horizontal test ball.

#### High difficulty target

Over time the game can trend toward approximately:

- Opening: **60°**
- Rotation: **2.5 s / revolution**
- high simultaneous object density

These should be approached gradually rather than reached through sudden thresholds.

### Implementation direction

Use elapsed run time to derive a continuous difficulty value.

Example conceptual structure:

```ts
const difficulty = getDifficulty(elapsedSeconds);

const rotationDuration = getRotationDuration(difficulty);
const gapDegrees = getGapDegrees(difficulty);
const spawnInterval = getSpawnInterval(difficulty);
const maxActiveObjects = getMaxActiveObjects(difficulty);
const bombChance = getBombChance(difficulty);
```

Prefer interpolation / smooth curves over visible difficulty steps such as "every 10 points".

---

## 9. Screens

The game should remain extremely small and focused.

### Home

Planned content:

- Fury O logo
- Start / Play
- Info button
- copyright footer: `© Morning Coffee Labs`

Score and high score should **not** clutter the home screen.

### Game

Minimal gameplay presentation.

Avoid unnecessary UI while playing.

Potentially show only the live score if it improves the experience without distracting from the playfield.

### Game Over

Dedicated screen shown after failure.

Planned content:

- Score
- High Score
- Restart
- Back to Home
- Share / screenshot-friendly presentation later

Game Over backgrounds may vary based on score / achievement as a social-sharing gimmick.

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

## 10. Social / sharing idea

Later, the Game Over screen can be deliberately designed to make high-score screenshots attractive to share.

Possible ideas:

- multiple unlockable/random Game Over backgrounds
- score prominently visible
- recognizable Fury O ring/logo
- link to a Fury O / Morning Coffee Labs Facebook page from Info

This is not part of the first gameplay prototype.

---

## 11. Audio and feedback

Later gameplay feedback should remain simple and punchy.

Potential events:

- normal ball eaten
- ring hit / Game Over
- bomb warning / visual cue
- bomb eaten → explosion
- new high score

Haptics should be evaluated on physical devices.

Do not add audio before the underlying gameplay loop is proven.

---

## 12. Prototype status

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
- One horizontal test ball implemented
- Basic size tuning performed
- Current ring baseline reduced substantially from original prototype
- Current ball size: 12 px
- Current opening: 75°
- Current start rotation: 5.2 s

### Next prototype task

Replace the single looping test ball with a real spawn system.

First spawn milestone:

1. Spawn normal balls only.
2. Select a random screen edge.
3. Select a random spawn position along that edge.
4. Give the ball a trajectory across the playfield.
5. Remove balls after they leave the playfield.
6. Allow several balls to coexist.
7. Keep collision disabled initially.
8. Observe how quickly multiple random trajectories create useful chaos.

After spawn behavior feels good:

1. Add ring collision.
2. Detect pass-through-opening / eaten ball.
3. Add Game Over.
4. Add survival timer and scoring.
5. Add time-based difficulty progression.
6. Add bombs.

---

## 13. Design principles

Fury O should remain deliberately small.

Do not turn it into a feature-heavy game.

Priorities:

1. Immediate controls
2. Smooth motion
3. Readable objects
4. Fair collision
5. Gradual difficulty
6. Fast failure/restart loop
7. Strong "one more try" feeling

The game succeeds if the player understands it almost immediately but still feels they can improve after every failure.
