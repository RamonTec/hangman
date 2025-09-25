import { useMemo, useState } from "react";
import "./App.css";
import { Button, TextField } from "@mui/material";

const WORDS = ["HANGMAN", "CARD", "TRUCK", "COMPUTER", "PHONE"] as const;
const MAX_LIVES = 6;
const A2Z = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

function getRandomWord(exclude: string[] = []) {
  const pool = WORDS.filter(w => !exclude.includes(w));
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

export default function App() {
  const [wordsDiscovered, setWordsDiscovered] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>(() => getRandomWord([]) || WORDS[0]);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [incomingLetter, setIncomingLetter] = useState("");

  const masked = useMemo(() => {
    return currentWord.split("").map(ch => (guessed.has(ch) ? ch : "_")).join(" ");
  }, [currentWord, guessed]);

  const isWin = useMemo(() => currentWord.split("").every(ch => guessed.has(ch)), [currentWord, guessed]);
  const isLose = wrongCount >= MAX_LIVES;
  const isOver = isWin || isLose;

  const setDiscoveredWord = (word: string) => {
    if (!wordsDiscovered.includes(word)) {
      setWordsDiscovered(prev => [...prev, word]);
    }
    setPoints(prev => prev + (MAX_LIVES - wrongCount) * word.length);
    startNextRound(word);
  };

  const startNextRound = (justSolved?: string) => {
    const exclude = justSolved ? [...wordsDiscovered, justSolved] : wordsDiscovered;
    const next = getRandomWord(exclude);
    const nextWord = next ?? getRandomWord([])!;
    setCurrentWord(nextWord);
    setGuessed(new Set());
    setWrongCount(0);
    setIncomingLetter("");
  };

  const handleLose = () => {
    setDeaths(d => d + 1);
    startNextRound();
  };

  const checkLetter = (raw?: string) => {
    if (isOver) return;
    const letter = (raw ?? incomingLetter).trim().toUpperCase().slice(0, 1);
    if (!letter || !/[A-Z]/.test(letter)) {
      setIncomingLetter("");
      return;
    }
    if (guessed.has(letter)) {
      setIncomingLetter("");
      return;
    }

    const nextGuessed = new Set(guessed);
    nextGuessed.add(letter);
    setGuessed(nextGuessed);

    if (!currentWord.includes(letter)) {
      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);
      if (nextWrong >= MAX_LIVES) {
        handleLose();
      }
    } else {
      const completes = currentWord.split("").every(ch => nextGuessed.has(ch));
      if (completes) setDiscoveredWord(currentWord);
    }

    setIncomingLetter("");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") checkLetter();
  };

  return (
    <>
      <h1>Welcome to Hangman</h1>

      <div className="stats">
        <p><strong>Points:</strong> {points}</p>
        <p><strong>Words discovered:</strong> {wordsDiscovered.length}</p>
        <p><strong>Deaths:</strong> {deaths}</p>
        <p><strong>Lives left:</strong> {Math.max(0, MAX_LIVES - wrongCount)} / {MAX_LIVES}</p>
      </div>

      <div className="word">
        <p className="masked">{masked}</p>
      </div>

      <div className="controls">
        
        <TextField
          aria-label="Type a letter"
          placeholder="Type a letter (A–Z)"
          value={incomingLetter}
          onChange={(e) => setIncomingLetter(e.target.value.toUpperCase())}
          onKeyDown={onKeyDown}
          className="text-white bg-white"
          id="outlined-basic" label="Type a letter (A–Z)" size="small" variant="filled" />

        <button style={{ margin: 5 }} onClick={() => checkLetter()}>Check letter</button>
        <button style={{ margin: 5 }} onClick={() => startNextRound()}>Skip / New word</button>
      </div>

      <div className="keyboard">
        {A2Z.map(l => {
          const tried = guessed.has(l);
          const correct = tried && currentWord.includes(l);
          return (
            <Button
              key={l}
              style={{ margin: 5 }}
              className={`key ${tried ? (correct ? "key-correct" : "key-wrong") : ""}`}
              onClick={() => checkLetter(l)}
              variant="contained"
              size="small"
              disabled={tried || isOver}
            >
              {l}
            </Button>
          );
        })}
      </div>

      <div className="history">
        <strong>Discovered:</strong> {wordsDiscovered.join(", ") || "—"}
      </div>

      {isOver && (
        <div className="banner">
          {isWin ? "You got it! 🎉" : `Out of lives! The word was ${currentWord}.`}
        </div>
      )}
    </>
  );
}
