import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

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
  { word: "APPLE", hint: "A kind of fruit (English)", difficulty: 1 },
  { word: "SCHOOL", hint: "A place to study (English)", difficulty: 1 },
  { word: "VIETNAM", hint: "A country in Southeast Asia", difficulty: 2 },
  { word: "COMPUTER", hint: "A device for coding and gaming", difficulty: 2 },
  { word: "JAVASCRIPT", hint: "A popular programming language", difficulty: 3 },
  { word: "ELEPHANT", hint: "A large animal with a trunk", difficulty: 2 },
  { word: "UNIVERSE", hint: "Space and everything in it", difficulty: 3 },
  { word: "MOUNTAIN", hint: "A large natural elevation", difficulty: 2 },
];

// Difficulty settings
const DIFFICULTIES = {
  1: { name: "Dễ", color: "text-green-500", time: 60 },
  2: { name: "Trung bình", color: "text-yellow-500", time: 45 },
  3: { name: "Khó", color: "text-red-500", time: 30 },
};

export default function WordPuzzleGame({ userId }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Filter words by difficulty
  const filteredWords = WORDS.filter((word) => word.difficulty <= difficulty);

  // Load new word
  const loadNewWord = useCallback(() => {
    if (filteredWords.length === 0) return;

    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    const word = filteredWords[randomIndex].word;
    setLetters(shuffle(word.split("")));
    setSelected([]);
    setStatus("");
    setShowAnswer(false);
    setTimeLeft(DIFFICULTIES[difficulty].time);
  }, [difficulty, filteredWords]);

  // Initialize first word
  useEffect(() => {
    if (!gameStarted) return;
    const word = WORDS[current].word;
    setLetters(shuffle(word.split("")));
    setSelected([]);
    setStatus("");
    setShowAnswer(false);
    setTimeLeft(DIFFICULTIES[difficulty].time);
    setTimerActive(true);
  }, [current, gameStarted, difficulty]);

  // Start timer when game starts
  useEffect(() => {
    if (!timerActive || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          setStatus("⏱️ Hết giờ!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

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
      // Calculate score based on word length and difficulty
      const wordScore = attempt.length * difficulty * 10;
      const timeBonus = Math.floor(timeLeft * difficulty * 0.5);
      const totalPoints = wordScore + timeBonus;

      setScore((prev) => prev + totalPoints);
      setStreak((prev) => prev + 1);
      setStatus(`✅ Chính xác! +${totalPoints} điểm`);
      setTimerActive(false);
    } else {
      setStreak(0);
      setStatus("❌ Sai rồi, thử lại nhé!");
    }
  };

  const handleReset = () => {
    setSelected([]);
    setStatus("");
    if (!timerActive && timeLeft > 0) {
      setTimerActive(true);
    }
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % WORDS.length);
    loadNewWord();
    setTimerActive(true);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setTimerActive(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    loadNewWord();
  };

  const changeDifficulty = (level) => {
    setDifficulty(level);
  };

  // Show start screen if game not started
  if (!gameStarted) {
    return (
      <div className="max-w-md w-full mx-auto my-4 sm:my-8 p-4 sm:p-6 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">
            Game Ghép Từ
          </h2>
          <button
            onClick={() => navigate("/rooms")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center"
          >
            <span>⬅️</span> <span className="ml-1">Về phòng</span>
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl sm:text-4xl">🔤</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
            Chào mừng đến với Game Ghép Từ!
          </h3>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Sắp xếp các chữ cái để tạo thành từ đúng trong thời gian giới hạn
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 mb-5 sm:mb-6">
          <h4 className="font-medium text-gray-800 mb-2 text-center">
            Chọn độ khó:
          </h4>
          <div className="flex gap-2 justify-center">
            {Object.entries(DIFFICULTIES).map(([level, { name, color }]) => (
              <button
                key={level}
                onClick={() => changeDifficulty(parseInt(level))}
                className={`px-3 sm:px-4 py-2 rounded-lg ${
                  difficulty === parseInt(level)
                    ? "bg-blue-500 text-white font-bold"
                    : "bg-gray-100 text-gray-700"
                } transition-all transform hover:scale-105 touch-manipulation`}
              >
                <span
                  className={
                    difficulty === parseInt(level) ? "text-white" : color
                  }
                >
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 sm:px-6 rounded-lg shadow-md transform transition hover:scale-105 active:scale-95 touch-manipulation text-lg"
        >
          Bắt đầu chơi!
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto my-4 sm:my-8 p-4 sm:p-6 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
      {/* Header with score and navigation */}
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-blue-700">
          Game Ghép Từ
        </h2>
        <div className="flex items-center">
          <button
            onClick={() => navigate("/rooms")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 sm:px-3 py-1 rounded-full text-sm font-medium flex items-center"
          >
            <span>⬅️</span> <span className="ml-1">Về phòng</span>
          </button>
        </div>
      </div>

      {/* Score & Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
        <div className="bg-blue-100 p-2 rounded-lg text-center">
          <p className="text-2xs sm:text-xs text-blue-700 font-medium">
            Điểm số
          </p>
          <p className="text-base sm:text-lg font-bold text-blue-800">
            {score}
          </p>
        </div>
        <div className="bg-green-100 p-2 rounded-lg text-center">
          <p className="text-2xs sm:text-xs text-green-700 font-medium">
            Chuỗi thắng
          </p>
          <p className="text-base sm:text-lg font-bold text-green-800">
            {streak}
          </p>
        </div>
        <div className="bg-yellow-100 p-2 rounded-lg text-center">
          <p className="text-2xs sm:text-xs text-yellow-700 font-medium">
            Thời gian
          </p>
          <p
            className={`text-base sm:text-lg font-bold ${
              timeLeft < 10 ? "text-red-600" : "text-yellow-800"
            }`}
          >
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Difficulty level */}
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">
          Độ khó:{" "}
          <span className={DIFFICULTIES[difficulty].color}>
            {DIFFICULTIES[difficulty].name}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
          Gợi ý:{" "}
          <span className="font-semibold">
            {filteredWords.length > 0 &&
              filteredWords[current % filteredWords.length].hint}
          </span>
        </div>
      </div>

      {/* Game area */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-inner border border-gray-200 mb-3 sm:mb-4">
        {/* Word display area */}
        <div className="min-h-[44px] sm:min-h-[50px] p-2 border-2 border-dashed border-blue-200 rounded-lg flex items-center justify-center bg-blue-50 mb-3 sm:mb-4">
          <div className="flex gap-1 flex-wrap justify-center">
            {selected.map((i, index) => (
              <span
                key={`selected-${index}`}
                className="inline-block w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-b from-blue-500 to-blue-600 text-white text-lg sm:text-xl font-bold rounded-lg shadow-md flex items-center justify-center animate-pop-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {letters[i]}
              </span>
            ))}
            {Array(
              Math.max(
                0,
                filteredWords[current % filteredWords.length].word.length -
                  selected.length
              )
            )
              .fill("_")
              .map((_, index) => (
                <span
                  key={`empty-${index}`}
                  className="inline-block w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 text-gray-400 text-lg sm:text-xl font-bold rounded-lg border border-gray-200 flex items-center justify-center"
                >
                  &nbsp;
                </span>
              ))}
          </div>
        </div>

        {/* Letters */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center my-3 sm:my-4">
          {letters.map((ch, idx) => (
            <button
              key={idx}
              className={`w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg font-bold rounded-lg border-2 transition-all duration-150 shadow-sm transform hover:scale-110 active:scale-95 touch-manipulation ${
                selected.includes(idx)
                  ? "opacity-50 bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-b from-blue-100 to-blue-200 border-blue-300 text-blue-800 hover:from-blue-200 hover:to-blue-300"
              }`}
              onClick={() => handleSelect(idx)}
              disabled={
                selected.includes(idx) ||
                status.includes("✅") ||
                timeLeft === 0
              }
            >
              {ch}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="h-6 text-center font-bold">
          {status && (
            <div
              className={`animate-bounce ${
                status.includes("✅")
                  ? "text-green-600"
                  : status.includes("⏱️")
                  ? "text-orange-500"
                  : "text-red-500"
              }`}
            >
              {status}
            </div>
          )}
          {showAnswer && (
            <div className="text-center text-xs sm:text-sm text-gray-500">
              Đáp án:{" "}
              <span className="font-bold text-blue-700">
                {filteredWords[current % filteredWords.length].word}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <button
          className={`px-2 sm:px-4 py-2 rounded-lg font-semibold shadow-md transition transform hover:scale-105 active:scale-95 touch-manipulation ${
            selected.length ===
              filteredWords[current % filteredWords.length].word.length &&
            !status.includes("✅") &&
            timeLeft > 0
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={handleCheck}
          disabled={
            selected.length !==
              filteredWords[current % filteredWords.length].word.length ||
            status.includes("✅") ||
            timeLeft === 0
          }
        >
          <span className="flex items-center justify-center text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Kiểm tra
          </span>
        </button>
        <button
          className="px-2 sm:px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition transform hover:scale-105 active:scale-95 shadow-md touch-manipulation"
          onClick={handleReset}
          disabled={selected.length === 0 || timeLeft === 0}
        >
          <span className="flex items-center justify-center text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Làm lại
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <button
          className="px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition transform hover:scale-105 active:scale-95 shadow-md touch-manipulation"
          onClick={handleNext}
        >
          <span className="flex items-center justify-center text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Từ khác
          </span>
        </button>
        <button
          className="px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold hover:from-yellow-500 hover:to-yellow-600 transition transform hover:scale-105 active:scale-95 shadow-md touch-manipulation"
          onClick={handleShowAnswer}
          disabled={showAnswer}
        >
          <span className="flex items-center justify-center text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            Xem đáp án
          </span>
        </button>
      </div>

      {/* Add some CSS animations */}
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-pop-in {
          animation: pop-in 0.3s forwards;
        }
        @media (max-width: 360px) {
          .text-2xs {
            font-size: 0.65rem;
            line-height: 1rem;
          }
        }
        /* Safari: Fix for hover effect on mobile */
        @media (hover: none) {
          .hover\\:scale-105:hover {
            transform: none;
          }
          .hover\\:from-blue-200:hover, .hover\\:to-blue-300:hover, 
          .hover\\:from-green-600:hover, .hover\\:to-green-700:hover,
          .hover\\:from-yellow-500:hover, .hover\\:to-yellow-600:hover,
          .hover\\:bg-gray-300:hover {
            background-image: none;
            background-color: inherit;
          }
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
