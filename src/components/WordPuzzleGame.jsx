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
  1: { name: "Dễ", color: "text-green-500", time: 60, coins: 5 },
  2: { name: "Trung bình", color: "text-yellow-500", time: 45, coins: 10 },
  3: { name: "Khó", color: "text-red-500", time: 30, coins: 20 },
};

export default function WordPuzzleGame({ userId }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0); // This now represents coins earned
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
      // Get base coin reward from difficulty settings
      let coinReward = DIFFICULTIES[difficulty].coins;

      // Add time bonus to coins (faster answers give more coins)
      const timeBonus = Math.floor(timeLeft * difficulty * 0.2);
      const totalCoins = coinReward + timeBonus;

      setScore((prev) => prev + totalCoins); // Now score represents total coins
      setStreak((prev) => prev + 1);
      setStatus(
        `✅ Chính xác! +${totalCoins} coin${
          timeBonus > 0 ? ` (gồm +${timeBonus} từ thời gian)` : ""
        }`
      );
      setTimerActive(false);

      // Here you would normally update the user's coin balance in your database
      // For example: updateUserCoins(userId, totalCoins);
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
      <div className="max-w-md w-full mx-auto my-1 sm:my-2 p-2 sm:p-4 bg-gradient-to-b from-purple-100 via-pink-50 to-yellow-100 rounded-2xl shadow-xl border-2 border-purple-200">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-600">
            🎮 Word Game 🎮
          </h2>
          <button
            onClick={() => navigate("/rooms")}
            className="bg-gradient-to-r from-yellow-300 to-orange-300 hover:from-yellow-400 hover:to-orange-400 text-orange-800 px-3 py-1.5 rounded-full text-sm font-bold flex items-center shadow-md border-2 border-yellow-400"
          >
            <span>🏠</span> <span className="ml-1">Về phòng</span>
          </button>
        </div>

        <div className="text-center mb-4 sm:mb-5">
          <h3 className="text-xl sm:text-2xl font-bold text-pink-600 mb-2">
            Chào mừng đến với Word Game!
          </h3>
          <p className="text-sm sm:text-base text-purple-700 px-1">
            Sắp xếp các chữ cái để tạo thành từ đúng trong thời gian giới hạn và
            nhận coin
          </p>
          <p className="text-sm sm:text-base text-purple-800 font-semibold mt-1.5 px-1">
            <span className="text-green-600">Dễ: +5 coin</span> •
            <span className="text-yellow-600 mx-2">Trung bình: +10 coin</span> •
            <span className="text-red-600">Khó: +20 coin</span>
            <span className="block text-amber-600 mt-0.5">
              + Thưởng thêm coin cho thời gian còn lại
            </span>
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-3 sm:p-4 rounded-lg shadow-md border border-blue-300 mb-3 sm:mb-4">
          <h4 className="font-bold text-blue-700 mb-2 text-center text-lg">
            Chọn độ khó: 🌟
          </h4>
          <div className="flex gap-2 justify-center">
            {Object.entries(DIFFICULTIES).map(
              ([level, { name, color, coins }]) => (
                <button
                  key={level}
                  onClick={() => changeDifficulty(parseInt(level))}
                  className={`px-3 sm:px-4 py-2 rounded-xl ${
                    difficulty === parseInt(level)
                      ? "bg-gradient-to-r from-green-400 to-teal-400 border-2 border-green-500 text-white font-bold transform scale-105"
                      : "bg-gradient-to-r from-cyan-200 to-blue-200 border-2 border-blue-300 text-blue-800"
                  } transition-all transform hover:scale-105 touch-manipulation shadow-md`}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={
                        difficulty === parseInt(level) ? "text-white" : ""
                      }
                    >
                      {name}{" "}
                      {parseInt(level) === 1
                        ? "😊"
                        : parseInt(level) === 2
                        ? "😎"
                        : "🤔"}
                    </span>
                    <span
                      className={`text-xs mt-0.5 ${
                        difficulty === parseInt(level)
                          ? "text-yellow-200"
                          : "text-amber-600"
                      }`}
                    >
                      +{coins} coin
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        <button
          onClick={startGame}
          className="w-full bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white font-bold py-4 px-4 sm:px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 touch-manipulation text-lg border-2 border-green-500"
        >
          🚀 Bắt đầu chơi! 🚀
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto my-1 sm:my-2 p-2 sm:p-4 bg-gradient-to-b from-purple-100 via-pink-50 to-yellow-100 rounded-2xl shadow-xl border-2 border-purple-200">
      {/* Header with score and navigation */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-purple-600">
          🎮 Word Game 🎮
        </h2>
        <div className="flex items-center">
          <button
            onClick={() => navigate("/rooms")}
            className="bg-gradient-to-r from-yellow-300 to-orange-300 hover:from-yellow-400 hover:to-orange-400 text-orange-800 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-bold flex items-center shadow-md border-2 border-yellow-400"
          >
            <span>🏠</span> <span className="ml-1">Về phòng</span>
          </button>
        </div>
      </div>

      {/* Score & Stats */}
      <div className="flex flex-row mb-2 sm:mb-3 sm:grid sm:grid-cols-3 sm:gap-2">
        <div className="flex-1 bg-gradient-to-r from-amber-200 to-yellow-200 p-1 sm:p-2 rounded-md text-center mr-1 border border-amber-300 shadow-sm">
          <div className="flex items-center justify-center sm:block">
            <p className="text-[0.6rem] sm:text-xs text-amber-700 font-bold mr-1 sm:mr-0">
              💰
            </p>
            <p className="text-sm sm:text-lg font-bold text-amber-800">
              {score} coin
            </p>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-r from-green-200 to-emerald-200 p-1 sm:p-2 rounded-md text-center mx-1 border border-green-300 shadow-sm">
          <div className="flex items-center justify-center sm:block">
            <p className="text-[0.6rem] sm:text-xs text-green-700 font-bold mr-1 sm:mr-0">
              🔥
            </p>
            <p className="text-sm sm:text-lg font-bold text-green-800">
              {streak}
            </p>
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-r from-yellow-200 to-amber-200 p-1 sm:p-2 rounded-md text-center ml-1 border border-yellow-300 shadow-sm">
          <div className="flex items-center justify-center sm:block">
            <p className="text-[0.6rem] sm:text-xs text-yellow-700 font-bold mr-1 sm:mr-0">
              ⏱️
            </p>
            <p
              className={`text-sm sm:text-lg font-bold ${
                timeLeft < 10 ? "text-red-600 animate-pulse" : "text-yellow-800"
              }`}
            >
              {timeLeft}s
            </p>
          </div>
        </div>
      </div>

      {/* Difficulty level */}
      <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-lg border border-indigo-200">
        <div className="text-xs sm:text-sm text-indigo-700 mb-0.5 sm:mb-0 font-bold">
          Độ khó: {difficulty === 1 ? "😊" : difficulty === 2 ? "😎" : "🤔"}{" "}
          <span className={`${DIFFICULTIES[difficulty].color} font-bold`}>
            {DIFFICULTIES[difficulty].name}
          </span>
          <span className="ml-1 text-amber-600">
            (+{DIFFICULTIES[difficulty].coins} coin)
          </span>
        </div>
        <div className="text-xs sm:text-sm text-violet-700 font-bold">
          Gợi ý: 💡{" "}
          <span className="font-semibold">
            {filteredWords.length > 0 &&
              filteredWords[current % filteredWords.length].hint}
          </span>
        </div>
      </div>

      {/* Game area */}
      <div className="bg-gradient-to-r from-pink-100 to-rose-100 p-2 sm:p-3 rounded-lg shadow-md border-2 border-pink-300 mb-2 sm:mb-3">
        {/* Word display area */}
        <div className="min-h-[42px] sm:min-h-[48px] p-1.5 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-gradient-to-r from-purple-100 to-fuchsia-100 mb-2 sm:mb-3 shadow-inner">
          <div className="flex gap-1.5 flex-wrap justify-center">
            {selected.map((i, index) => (
              <span
                key={`selected-${index}`}
                className="inline-block w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-lg sm:text-xl font-bold rounded-xl shadow-md flex items-center justify-center animate-pop-in border-2 border-purple-600"
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
                  className="inline-block w-8 h-8 sm:w-10 sm:h-10 bg-white text-gray-400 text-lg sm:text-xl font-bold rounded-xl border-2 border-purple-200 flex items-center justify-center"
                >
                  &nbsp;
                </span>
              ))}
          </div>
        </div>

        {/* Letters */}
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center my-2 sm:my-3">
          {letters.map((ch, idx) => (
            <button
              key={idx}
              className={`w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-xl font-bold rounded-lg border transition-all duration-150 shadow-md transform hover:scale-110 active:scale-95 touch-manipulation ${
                selected.includes(idx)
                  ? "opacity-50 bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-300 to-blue-300 border-blue-400 text-blue-800 hover:from-cyan-400 hover:to-blue-400 hover:text-white"
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
        <div className="h-8 text-center font-bold">
          {status && (
            <div
              className={`animate-bounce text-lg ${
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
            <div className="text-center text-sm sm:text-base text-purple-600">
              Đáp án:{" "}
              <span className="font-bold text-pink-600">
                {filteredWords[current % filteredWords.length].word}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <button
          className={`px-2 sm:px-3 py-2 rounded-lg font-bold shadow transition transform hover:scale-105 active:scale-95 touch-manipulation ${
            selected.length ===
              filteredWords[current % filteredWords.length].word.length &&
            !status.includes("✅") &&
            timeLeft > 0
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border border-blue-600"
              : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed border border-gray-300"
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
            ✅ Kiểm tra
          </span>
        </button>
        <button
          className={`px-2 sm:px-3 py-2 rounded-lg shadow transition transform hover:scale-105 active:scale-95 touch-manipulation ${
            selected.length === 0 || timeLeft === 0
              ? "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 border border-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-300 to-amber-300 text-orange-800 font-bold border border-orange-400 hover:from-orange-400 hover:to-amber-400"
          }`}
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
            🔄 Làm lại
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-1.5">
        <button
          className="px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold hover:from-green-500 hover:to-emerald-600 transition transform hover:scale-105 active:scale-95 shadow touch-manipulation border border-green-500"
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
            🎲 Từ khác
          </span>
        </button>
        <button
          className={`px-2 sm:px-3 py-2 rounded-lg shadow transition transform hover:scale-105 active:scale-95 touch-manipulation border ${
            showAnswer
              ? "bg-gradient-to-r from-gray-200 to-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-400 to-yellow-400 border-yellow-500 text-yellow-800 font-bold hover:from-amber-500 hover:to-yellow-500"
          }`}
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
            👀 Xem đáp án
          </span>
        </button>
      </div>

      {/* Add some CSS animations */}
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-pop-in {
          animation: pop-in 0.4s forwards;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        
        .border-3 {
          border-width: 3px;
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
