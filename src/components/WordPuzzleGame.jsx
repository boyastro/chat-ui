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
  const filteredWords = WORDS.filter((word) => word.difficulty == difficulty);

  // Use a ref to access current filteredWords inside effects without dependency
  const filteredWordsRef = React.useRef(filteredWords);
  React.useEffect(() => {
    filteredWordsRef.current = filteredWords;
  }, [filteredWords]);

  // Load new word
  const loadNewWord = useCallback(() => {
    const currentFilteredWords = filteredWordsRef.current;
    if (currentFilteredWords.length === 0) return;

    const randomIndex = Math.floor(Math.random() * currentFilteredWords.length);
    const word = currentFilteredWords[randomIndex].word;
    setLetters(shuffle(word.split("")));
    setSelected([]);
    setStatus("");
    setShowAnswer(false);
    setTimeLeft(DIFFICULTIES[difficulty].time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Initialize first word
  useEffect(() => {
    if (!gameStarted) return;
    // Use filteredWordsRef instead to avoid dependency issues
    const currentFilteredWords = filteredWordsRef.current;
    if (currentFilteredWords.length === 0) return;
    const word =
      currentFilteredWords[current % currentFilteredWords.length].word;
    setLetters(shuffle(word.split("")));
    setSelected([]);
    setStatus("");
    setShowAnswer(false);
    setTimeLeft(DIFFICULTIES[difficulty].time);
    setTimerActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      filteredWords.length > 0 &&
      selected.length <
        filteredWords[current % filteredWords.length].word.length &&
      !selected.includes(idx)
    ) {
      const newSelected = [...selected, idx];
      setSelected(newSelected);

      // Nếu đã chọn đủ số lượng chữ cái (hoàn thành đáp án), tự động kiểm tra
      if (
        newSelected.length ===
        filteredWords[current % filteredWords.length].word.length
      ) {
        // Đợi một chút trước khi kiểm tra để người dùng thấy chữ cái đã được chọn
        setTimeout(() => {
          // Tạo một hàm kiểm tra mới sử dụng newSelected thay vì selected
          const attempt = newSelected.map((i) => letters[i]).join("");
          const currentWord =
            filteredWords[current % filteredWords.length].word;

          if (attempt === currentWord) {
            // Get coin reward from difficulty settings
            const coinReward = DIFFICULTIES[difficulty].coins;

            setScore((prev) => prev + coinReward); // Score represents total coins
            setStreak((prev) => prev + 1);
            setStatus(`✅ Chính xác! +${coinReward} coin`);
            setTimerActive(false);

            // Tự động chuyển sang từ mới sau 2 giây
            setTimeout(() => {
              setCurrent((prev) => (prev + 1) % WORDS.length);
              loadNewWord();
              setTimerActive(true);
            }, 2000);
          } else {
            setStreak(0);
            setStatus("❌ Sai rồi, thử lại nhé!");
          }
        }, 200);
      }
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
            Sắp xếp các chữ cái để tạo thành từ đúng và nhận coin dựa vào độ khó
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

      {/* Hint section */}
      <div className="mb-2 sm:mb-3 bg-gradient-to-r from-teal-100 to-cyan-100 p-3 rounded-lg border-2 border-cyan-300 shadow-md">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-1">
            <span className="text-2xl animate-pulse mr-1.5">💡</span>
            <h3 className="text-base sm:text-lg font-bold text-teal-700">
              Gợi ý:
            </h3>
          </div>
          <p className="text-base sm:text-xl font-bold text-center text-blue-800 px-2 py-1 bg-white bg-opacity-50 rounded-md border border-blue-200">
            {filteredWords.length > 0 &&
              filteredWords[current % filteredWords.length].hint}
          </p>
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
        <div className="min-h-[50px] text-center font-bold flex flex-col justify-center">
          {status && (
            <div
              className={`animate-bounce text-lg ${
                status.includes("✅")
                  ? "text-green-600"
                  : status.includes("⏱️")
                  ? "text-orange-500"
                  : "text-red-500"
              } mb-1`}
            >
              {status}
            </div>
          )}
          {showAnswer && (
            <div className="text-center text-sm sm:text-base text-purple-600 mt-1">
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
          className={`px-2 sm:px-3 py-2 rounded-lg shadow transition transform hover:scale-105 active:scale-95 touch-manipulation ${
            selected.length === 0 || timeLeft === 0
              ? "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 border border-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-300 to-amber-300 text-orange-800 font-bold border border-orange-400 hover:from-orange-400 hover:to-amber-400"
          }`}
          onClick={handleReset}
          disabled={selected.length === 0 || timeLeft === 0}
        >
          <span className="flex items-center justify-center text-sm sm:text-base">
            🔄 Làm lại
          </span>
        </button>
        <button
          className="px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold hover:from-green-500 hover:to-emerald-600 transition transform hover:scale-105 active:scale-95 shadow touch-manipulation border border-green-500"
          onClick={handleNext}
        >
          <span className="flex items-center justify-center text-sm sm:text-base">
            🎲 Từ khác
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:gap-2 mt-1.5">
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
