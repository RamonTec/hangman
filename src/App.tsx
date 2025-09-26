import { useMemo, useState } from "react";
import "./App.css";

const WORDS = ["HANGMAN", "CARD", "TRUCK", "COMPUTER", "PHONE"] as const;
const MAX_LIVES = 6;
const A2Z = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

type GameMode = "CLASSIC" | "SAVE10";
type Person = { id: string; name: string; blurb: string; emoji: string };

const PEOPLE: Person[] = [
  { id: "p1", name: "Alex", blurb: "Aspiring chef who fears overcooked pasta.", emoji: "🍝" },
  { id: "p2", name: "Maya", blurb: "Loves old computers and pixel art.", emoji: "🖥️" },
  { id: "p3", name: "Ravi", blurb: "Weekend truck detailer. Paint must sparkle.", emoji: "🚚" },
  { id: "p4", name: "Lina", blurb: "Phones friends daily to trade jokes.", emoji: "📱" },
  { id: "p5", name: "Theo", blurb: "Card-trick enthusiast. Always shuffling.", emoji: "🃏" },
];

function getRandomWord(exclude: string[] = []) {
  const pool = WORDS.filter(w => !exclude.includes(w));
  return pool[Math.floor(Math.random() * pool.length)] || WORDS[0];
}
function getRandomPerson(excludeIds: string[] = []) {
  const pool = PEOPLE.filter(p => !excludeIds.includes(p.id));
  return pool[Math.floor(Math.random() * pool.length)] || PEOPLE[0];
}

export default function App() {
  // Mode selection (Mode 2 scaffolded)
  const [mode, setMode] = useState<GameMode>("CLASSIC");

  // Classic state
  const [wordsDiscovered, setWordsDiscovered] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>(() => getRandomWord());
  const [currentPerson, setCurrentPerson] = useState<Person>(() => getRandomPerson());
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [incomingLetter, setIncomingLetter] = useState("");
  const [flash, setFlash] = useState<"correct" | "wrong" | "">("");
  const [savedCount, setSavedCount] = useState(0);

  // Derived
  const maskedArray = useMemo(
    () => currentWord.split("").map(ch => (guessed.has(ch) ? ch : "")),
    [currentWord, guessed]
  );
  const isWin = currentWord.split("").every(ch => guessed.has(ch));
  const isLose = wrongCount >= MAX_LIVES;

  // Flow
  const setDiscoveredWord = (word: string) => {
    if (!wordsDiscovered.includes(word)) {
      setWordsDiscovered(prev => [...prev, word]);
    }
    setPoints(p => p + (MAX_LIVES - wrongCount) * word.length);
    setSavedCount(c => c + 1); // rescued!
    startNextRound(word);
  };

  const startNextRound = (justSolved?: string) => {
    const exclude = justSolved ? [...wordsDiscovered, justSolved] : wordsDiscovered;
    const nextWord = getRandomWord(exclude);
    const nextPerson = getRandomPerson([currentPerson.id]); // rotate people for flavor
    setCurrentWord(nextWord);
    setCurrentPerson(nextPerson);
    setGuessed(new Set());
    setWrongCount(0);
    setIncomingLetter("");
    setFlash("");
  };

  const handleLose = () => {
    setDeaths(d => d + 1);
    startNextRound();
  };

  const flashOnce = (type: "correct" | "wrong") => {
    setFlash(type);
    setTimeout(() => setFlash(""), 300);
  };

  const checkLetter = (raw?: string) => {
    if (isWin || isLose) return;
    const letter = (raw ?? incomingLetter).trim().toUpperCase().slice(0, 1);
    setIncomingLetter("");
    if (!letter || !/[A-Z]/.test(letter) || guessed.has(letter)) return;

    const nextGuessed = new Set(guessed);
    nextGuessed.add(letter);
    setGuessed(nextGuessed);

    if (!currentWord.includes(letter)) {
      setWrongCount(n => {
        const v = n + 1;
        flashOnce("wrong");
        if (v >= MAX_LIVES) handleLose();
        return v;
      });
    } else {
      flashOnce("correct");
      const completes = currentWord.split("").every(ch => nextGuessed.has(ch));
      if (completes) setTimeout(() => setDiscoveredWord(currentWord), 500);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") checkLetter();
  };

  // UI
  return (
    <div className="app">
      <header className="topbar">
        <h1>Hangman</h1>

        <div className="mode-switch">
          <label>Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as GameMode)}
            title="Mode 2 (Save 10) is scaffolded"
          >
            <option value="CLASSIC">Classic</option>
            <option value="SAVE10" disabled>Save 10 (coming soon)</option>
          </select>
        </div>

        <div className="stats">
          <Stat label="Points" value={points} />
          <Stat label="Saved" value={savedCount} />
          <Stat label="Deaths" value={deaths} />
          <Lives livesLeft={Math.max(0, MAX_LIVES - wrongCount)} total={MAX_LIVES} />
        </div>
      </header>

      <main className="board">
        <section className="stage">
          <Gallows
            wrong={wrongCount}
            animateSwing={wrongCount > 0 && !isWin && !isLose}
            rescued={isWin}
          />
          <PersonCard person={currentPerson} />
        </section>

        <section className={`wordcard ${flash ? `flash-${flash}` : ""}`}>
          <div className="tiles">
            {maskedArray.map((ch, i) => (
              <span key={`${currentWord}-${i}`} className={`tile ${ch ? "revealed" : ""}`}>
                {ch || "\u00A0"}
              </span>
            ))}
          </div>

          <div className="controls">
            <input
              aria-label="Type a letter"
              className="letter-input"
              placeholder="Type a letter (A–Z)"
              value={incomingLetter}
              onChange={(e) => setIncomingLetter(e.target.value.toUpperCase())}
              onKeyDown={onKeyDown}
              maxLength={1}
            />
            <button className="btn primary" onClick={() => checkLetter()}>Check</button>
            <button className="btn ghost" onClick={() => startNextRound()}>New word</button>
          </div>

          <Keyboard
            currentWord={currentWord}
            guessed={guessed}
            disabled={isWin || isLose}
            onPick={checkLetter}
          />

          <div className="history">
            <strong>Discovered:</strong> {wordsDiscovered.join(", ") || "—"}
          </div>

          {(isWin || isLose) && (
            <div className={`banner ${isWin ? "win" : "lose"}`}>
              {isWin ? `You saved ${currentPerson.name}! 🎉` : `Too late... The word was ${currentWord}.`}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <small className="muted">Classic mode complete. “Save 10” scaffolding ready.</small>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Lives({ livesLeft, total }: { livesLeft: number; total: number }) {
  return (
    <div className="lives" title={`Lives: ${livesLeft} / ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`heart ${i < livesLeft ? "full" : "empty"}`}>♥</span>
      ))}
    </div>
  );
}

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="person">
      <div className="person-emoji" aria-hidden>{person.emoji}</div>
      <div className="person-info">
        <div className="person-name">{person.name}</div>
        <div className="person-blurb">{person.blurb}</div>
      </div>
    </div>
  );
}

function Keyboard({
  guessed,
  currentWord,
  disabled,
  onPick
}: {
  guessed: Set<string>;
  currentWord: string;
  disabled: boolean;
  onPick: (l: string) => void;
}) {
  return (
    <div className="keyboard" role="group" aria-label="Letters">
      {A2Z.map(l => {
        const tried = guessed.has(l);
        const correct = tried && currentWord.includes(l);
        return (
          <button
            key={l}
            className={`key ${tried ? (correct ? "key-correct" : "key-wrong") : ""}`}
            onClick={() => onPick(l)}
            disabled={tried || disabled}
            aria-pressed={tried}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/** SVG gallows + stick figure with simple animations:
 * - swing: slight rocking when wrong > 0
 * - gasp: scale pop on each wrong
 * - rescue: drop to ground & cheer on win
 */
function Gallows({ wrong, animateSwing, rescued }: { wrong: number; animateSwing: boolean; rescued: boolean }) {
  // stages: 0..6 used; we keep 6 lives total
  const show = (n: number) => wrong > n;

  return (
    <svg className={`gallows ${animateSwing ? "swing" : ""} ${rescued ? "rescued" : ""}`} viewBox="0 0 200 220" aria-label="Hangman">
      {/* static frame */}
      <line x1="10" y1="210" x2="190" y2="210" className="svgl" />
      <line x1="40" y1="210" x2="40" y2="20" className="svgl" />
      <line x1="40" y1="20" x2="130" y2="20" className="svgl" />
      <line x1="130" y1="20" x2="130" y2="40" className="svgl" />

      {/* moving group pivoting from the hook */}
      <g className={`dude ${wrong ? "gasp" : ""}`}>
        {/* rope */}
        {show(0) && <line x1="130" y1="40" x2="130" y2="60" className="svgl part drop" />}
        {/* head */}
        {show(1) && <circle cx="130" cy="75" r="15" className="svgl part fade" />}
        {/* body */}
        {show(2) && <line x1="130" y1="90" x2="130" y2="140" className="svgl part fade" />}
        {/* arms */}
        {show(3) && <line x1="130" y1="105" x2="110" y2="125" className="svgl part fade" />}
        {show(4) && <line x1="130" y1="105" x2="150" y2="125" className="svgl part fade" />}
        {/* legs */}
        {show(5) && <line x1="130" y1="140" x2="115" y2="165" className="svgl part fade" />}
        {wrong > 6 && <line x1="130" y1="140" x2="145" y2="165" className="svgl part fade" />}
      </g>
    </svg>
  );
}
