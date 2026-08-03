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

## 8. Difficulty progression

Difficulty is driven by **elapsed time in the current run**.

There are no traditional levels or abrupt level changes.

### Current difficulty philosophy

The ring itself should remain predictable throughout the run:

- Opening remains approximately **75°**
- Rotation remains approximately **5.2 s / revolution**

The slow rotation is intentionally part of the challenge. As more balls enter the playfield, the player can often see what is coming but cannot instantly move the opening to any desired angle. Reversing rotation becomes a tactical decision rather than simply reacting to a fast-spinning ring.

Difficulty should therefore be created primarily by the **world around the player**, not by continuously changing the player's control characteristics.

### Primary difficulty levers

1. Increase the number of simultaneous balls gradually
2. Increase object density / reduce effective gaps between incoming threats
3. Once approximately **10–12 balls** can be active, begin increasing ball movement speed gradually
4. Introduce bombs later as an additional recognition/risk element
5. Bomb probability may increase gradually during long runs

### Intended progression

#### Start

- Opening: **75°**
- Rotation: **5.2 s / revolution**
- Low simultaneous ball count
- Current prototype baseline allows up to 5 balls while mechanics are being tested

#### Building pressure

The maximum active ball count should rise gradually with elapsed time toward approximately **10–12 simultaneous balls**.

The exact timing curve must be determined through playtesting. Balls arrive from all four directions, so relatively small increases in object count can create a large increase in cognitive load.

#### Higher difficulty

When the game has reached approximately **10–12 simultaneous balls**, ball travel speed can begin increasing gradually.

Do not increase ball speed aggressively at the beginning of a run. The early difficulty curve should come mainly from increasing the amount of traffic on screen.

There is currently **no planned reduction of the 75° opening and no planned increase in ring rotation speed during normal difficulty progression**.

### Implementation direction

Use elapsed run time to derive a continuous difficulty value or time-based parameters.

Conceptual structure:

```ts
const difficulty = getDifficulty(elapsedSeconds);

const spawnInterval = getSpawnInterval(difficulty);
const maxActiveObjects = getMaxActiveObjects(difficulty);
const ballSpeed = getBallSpeed(difficulty);
const bombChance = getBombChance(difficulty);
```

Ring values can remain constant:

```ts
const rotationDuration = 5200;
const gapDegrees = 75;
```

Prefer interpolation / smooth curves over visible difficulty steps such as "every 10 points".

Difficulty must remain tied to elapsed run time, not score.

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

When a normal ball is eaten, a short visual **pop / disappearance / small burst effect** should be evaluated. The ball must disappear inside the ring immediately; it must never travel onward and hit the back of the ring.

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
- Temporary tap/click-to-restart Game Over test flow
- Opening correctly allows a normal ball to enter
- Ball is detected as eaten once fully inside the ring
- Eaten ball is removed immediately instead of exiting through the back of the ring

### Current prototype baseline

During mechanics testing:

- maximum active balls: **5**
- spawn interval: approximately **1.1 s**
- ball travel time: approximately **3.6–5.0 s**
- opening: **75°**
- ring rotation: **5.2 s / revolution**

### Next prototype tasks

1. Add time-based difficulty progression for active ball count.
2. Gradually build from the current low count toward approximately **10–12 simultaneous balls**.
3. Observe and tune how quickly the playfield becomes difficult while keeping spawns fair.
4. Once 10–12 balls are established, introduce gradual ball-speed increase.
5. Add survival timer and scoring.
6. Add +5 bonus score for eaten normal balls.
7. Add a small visual feedback effect when a normal ball is eaten.
8. Add bombs after the normal-ball gameplay loop is stable.
9. Replace the temporary Game Over overlay with the planned Game Over screen later.

---

## 13. Design principles

Fury O should remain deliberately small.

Do not turn it into a feature-heavy game.

Priorities:

1. Immediate controls
2. Smooth motion
3. Readable objects
4. Fair collision
5. Gradual time-based difficulty
6. Predictable ring behavior
7. Fast failure/restart loop
8. Strong "one more try" feeling

The game succeeds if the player understands it almost immediately but still feels they can improve after every failure.

The intended emotional balance is:

> Difficult enough to provoke laughter, frustration and swearing — but fair enough that the player believes the next attempt can go better.
