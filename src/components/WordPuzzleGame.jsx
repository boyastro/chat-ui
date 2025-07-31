import React, { useState, useEffect } from "react";

// Utility: shuffle an array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Example word list (can be replaced with API or props)
const WORDS = [
  { word: "APPLE", hint: "A kind of fruit (English)" },
  { word: "SCHOOL", hint: "A place to study (English)" },
  { word: "VIETNAM", hint: "A country in Southeast Asia" },
  { word: "COMPUTER", hint: "A device for coding and gaming" },
];

export default function WordPuzzleGame() {
  const [current, setCurrent] = useState(0);
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const word = WORDS[current].word;
    setLetters(shuffle(word.split("")));
    setSelected([]);
    setStatus("");
    setShowAnswer(false);
  }, [current]);

  const handleSelect = (idx) => {
    if (
      selected.length < WORDS[current].word.length &&
      !selected.includes(idx)
    ) {
      setSelected([...selected, idx]);
    }
  };

  const handleCheck = () => {
    const attempt = selected.map((i) => letters[i]).join("");
    if (attempt === WORDS[current].word) {
      setStatus("✅ Chính xác!");
    } else {
      setStatus("❌ Sai rồi, thử lại nhé!");
    }
  };

  const handleReset = () => {
    setSelected([]);
    setStatus("");
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % WORDS.length);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold mb-2 text-blue-700">Game Ghép Từ</h2>
      <div className="mb-2 text-gray-600">Gợi ý: {WORDS[current].hint}</div>
      <div className="flex flex-wrap gap-2 justify-center my-4">
        {letters.map((ch, idx) => (
          <button
            key={idx}
            className={`w-10 h-10 text-lg font-bold rounded-lg border-2 transition-all duration-150 shadow-sm
              ${
                selected.includes(idx)
                  ? "bg-blue-200 border-blue-400 text-blue-700"
                  : "bg-gray-100 border-gray-300 hover:bg-blue-100"
              }`}
            onClick={() => handleSelect(idx)}
            disabled={selected.includes(idx) || status === "✅ Chính xác!"}
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="min-h-[40px] text-center text-lg font-mono tracking-widest mb-2">
        {selected.map((i) => letters[i]).join("")}
      </div>
      {status && (
        <div
          className={`text-center mb-2 ${
            status.includes("✅") ? "text-green-600" : "text-red-500"
          }`}
        >
          {status}
        </div>
      )}
      {showAnswer && (
        <div className="text-center text-sm text-gray-500 mb-2">
          Đáp án:{" "}
          <span className="font-bold text-blue-700">{WORDS[current].word}</span>
        </div>
      )}
      <div className="flex gap-2 justify-center mt-2">
        <button
          className="px-4 py-1.5 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
          onClick={handleCheck}
          disabled={
            selected.length !== WORDS[current].word.length ||
            status === "✅ Chính xác!"
          }
        >
          Kiểm tra
        </button>
        <button
          className="px-4 py-1.5 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
          onClick={handleReset}
        >
          Làm lại
        </button>
        <button
          className="px-4 py-1.5 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition"
          onClick={handleNext}
        >
          Từ khác
        </button>
        <button
          className="px-4 py-1.5 rounded bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition"
          onClick={handleShowAnswer}
        >
          Xem đáp án
        </button>
      </div>
    </div>
  );
}
