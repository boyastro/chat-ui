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

// Example word list (kept as fallback)
const WORDS = [
  { word: "APPLE", hint: "A kind of fruit", difficulty: 1 },
  { word: "SCHOOL", hint: "A place to study", difficulty: 1 },
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
  // State để lưu các id đã dùng
  const [excludeIds, setExcludeIds] = useState([]);
  // Hàm cộng coin cho user, cập nhật cả local và server
  const addCoinForUser = useCallback(
    (coin) => {
      if (!userId) return;
      const earnedCoin = parseInt(coin, 10);
      setUserInfo((prev) => ({
        ...prev,
        coin: (prev?.coin ?? 0) + earnedCoin,
      }));
      setScore((prev) => prev + earnedCoin);
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      fetch(`${API_URL}/millionaire/add-coin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ userId, coin: earnedCoin }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setUserInfo((prev) => ({
              ...prev,
              coin: data.coin ?? prev?.coin ?? 0,
            }));
            setScore(data.coin ?? 0);
            console.log(
              `Thêm ${earnedCoin} coin thành công, số coin hiện tại: ${data.coin}`
            );
          }
        })
        .catch((err) => console.error("Lỗi khi cộng coin:", err));
    },
    [userId]
  );
  const navigate = useNavigate();
  // Remove unused state variables
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
  const [currentWord, setCurrentWord] = useState(null);
  // Add conditional rendering for these in the JSX
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // User info state
  const [userInfo, setUserInfo] = useState(null);

  // Fetch user info from API (simplified as requested)
  useEffect(() => {
    if (!userId) return;
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Support both {data: {...}} and direct {...}
        const user = data && data.data ? data.data : data;
        if (user) {
          setUserInfo({
            name: user.name || user.username || "User",
            avatar:
              user.avatar && user.avatar !== ""
                ? user.avatar.startsWith("http")
                  ? user.avatar
                  : `${API_URL}${user.avatar.startsWith("/") ? "" : "/"}${
                      user.avatar
                    }`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name || user.username || "U"
                  )}&background=random`,
            coin: user.coin ?? 0,
          });
          setScore(user.coin ?? 0);
        }
      });
  }, [userId]);

  // Fetch a random word from the API based on difficulty
  const fetchRandomWord = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const apiBaseUrl = process.env.REACT_APP_API_URL;
      // Gọi POST, truyền difficulty và excludeIds qua body
      const response = await fetch(`${apiBaseUrl}/words/random`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ difficulty, excludeIds }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // If no words found for this difficulty, use fallback
          const fallbackWords = WORDS.filter(
            (word) => word.difficulty === difficulty
          );
          if (fallbackWords.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * fallbackWords.length
            );
            setCurrentWord(fallbackWords[randomIndex]);
          } else {
            throw new Error("Không có từ nào cho cấp độ này");
          }
        } else {
          throw new Error("Không lấy được từ từ server");
        }
      } else {
        // Check content type and log it for debugging

        // Try to get the raw text first to see what's actually being returned
        const responseText = await response.text();

        // Now try to parse as JSON if it looks like JSON
        try {
          if (
            responseText &&
            (responseText.startsWith("{") || responseText.startsWith("["))
          ) {
            const responseData = JSON.parse(responseText);

            // Access the word data from the data property
            if (responseData && responseData.data) {
              setCurrentWord(responseData.data);
              // Nếu có _id thì thêm vào excludeIds
              if (responseData.data && responseData.data._id) {
                setExcludeIds((prev) => [...prev, responseData.data._id]);
              }
            } else {
              throw new Error("Dữ liệu từ không đúng định dạng");
            }
          } else {
            throw new Error("Phản hồi không phải dạng JSON");
          }
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          throw new Error("Không thể parse phản hồi thành JSON");
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải từ:", err);
      setError(err.message);
      // Use fallback if API fails
      const fallbackWords = WORDS.filter(
        (word) => word.difficulty === difficulty
      );
      if (fallbackWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackWords.length);
        setCurrentWord(fallbackWords[randomIndex]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, excludeIds]);

  // Load new word
  function loadNewWord() {
    setLetters([]);
    fetchRandomWord().then(() => {
      setSelected([]);
      setStatus("");
      setShowAnswer(false);
      setTimeLeft(DIFFICULTIES[difficulty].time);
    });
  }
  useEffect(() => {
    if (currentWord) {
      // Always set letters when currentWord changes, not just when letters.length is 0
      setLetters(shuffle(currentWord.word.split("")));
    }
  }, [currentWord]);

  // Initialize first word when game starts
  useEffect(() => {
    if (!gameStarted) return;

    // Reset state and load the first word only when game starts
    setSelected([]);
    setStatus("");
    setShowAnswer(false);
    setTimeLeft(DIFFICULTIES[difficulty].time);
    loadNewWord(); // Chỉ gọi một lần khi game bắt đầu
    setTimerActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, difficulty]); // Không phụ thuộc vào loadNewWord

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
    if (!currentWord) return;

    if (selected.length < currentWord.word.length && !selected.includes(idx)) {
      const newSelected = [...selected, idx];
      setSelected(newSelected);

      // Automatically check answer when enough letters are selected
      if (newSelected.length === currentWord.word.length) {
        // Wait a bit before checking to let user see the selected letter
        setTimeout(() => {
          // Create a new check function using newSelected instead of selected
          const attempt = newSelected.map((i) => letters[i]).join("");

          if (attempt === currentWord.word) {
            // Get coin reward from difficulty settings
            const coinReward = DIFFICULTIES[difficulty].coins;

            // No streak bonus, just use the base coin reward
            const totalCoins = coinReward;

            // Cộng coin cho user (gọi API và cập nhật local)
            addCoinForUser(totalCoins);
            setStreak((prev) => prev + 1);
            setStatus(`✅ Chính xác! +${totalCoins} coin`);
            setTimerActive(false);

            // Automatically go to the next word after 2 seconds
            setTimeout(() => {
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

  // Function to remove a letter from the selection
  const removeLetter = (selIndex) => {
    if (status) return; // Don't allow removal during status display
    setSelected(selected.filter((_, i) => i !== selIndex));
  };

  const handleReset = () => {
    setSelected([]);
    setStatus("");
    if (!timerActive && timeLeft > 0) {
      setTimerActive(true);
    }
  };

  const handleNext = () => {
    // Only load a new word if we're not already loading
    if (!isLoading) {
      // Force reset the letters array to ensure we get new letters
      setLetters([]);
      setSelected([]);
      loadNewWord();
      setTimerActive(true);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setTimerActive(false);
  };

  const startGame = () => {
    // Set initial game state
    setScore(0);
    setStreak(0);
    setExcludeIds([]); // Reset excludeIds khi bắt đầu lại game
    setGameStarted(true);
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
            onClick={() => {
              setExcludeIds([]); // Reset excludeIds khi thoát game
              navigate("/rooms");
            }}
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
          <div className="flex items-center justify-center">
            {userInfo ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-100 overflow-hidden flex items-center justify-center">
                  {userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userInfo.name || userInfo.username || "U"
                        )}&background=F59E0B&color=fff&size=64`;
                      }}
                    />
                  ) : (
                    <span className="text-lg font-bold text-amber-700">
                      {(userInfo.name || userInfo.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold text-amber-800">
                    {userInfo.name || userInfo.username || "User"}
                  </span>
                  <span className="text-xs text-amber-700 flex items-center font-bold">
                    <span className="mr-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline h-4 w-4 ml-0.5 align-middle coin-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="gold"
                          strokeWidth="2"
                          fill="#ffe066"
                        />
                        <text
                          x="12"
                          y="16"
                          textAnchor="middle"
                          fontSize="10"
                          fill="#bfa100"
                        >
                          ₵
                        </text>
                      </svg>
                    </span>
                    {userInfo.coin ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-[0.6rem] sm:text-xs text-amber-700 font-bold mr-1 sm:mr-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4 ml-0.5 align-middle coin-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="gold"
                      strokeWidth="2"
                      fill="#ffe066"
                    />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#bfa100"
                    >
                      ₵
                    </text>
                  </svg>
                </span>
                <span className="text-sm sm:text-lg font-bold text-amber-800">
                  {score} coin
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 bg-gradient-to-r from-green-200 to-emerald-200 p-1 sm:p-2 rounded-md text-center mx-1 border border-green-300 shadow-sm">
          <div className="flex items-center justify-center sm:block">
            <p className="text-[0.6rem] sm:text-xs text-green-700 font-bold mr-1 sm:mr-0">
              🔥
            </p>
            <p className="text-sm sm:text-lg font-bold text-green-800">
              {streak} streak
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
              {timeLeft} s
            </p>
          </div>
        </div>
      </div>

      {/* Hint section */}
      <div className="mb-2 sm:mb-3 bg-gradient-to-r from-teal-100 to-cyan-100 p-3 rounded-lg border-2 border-cyan-300 shadow-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin text-2xl mb-1">⏳</div>
            <p className="text-base font-bold text-teal-700">Đang tải từ...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl mb-1">❌</div>
            <p className="text-base font-bold text-red-600">{error}</p>
            <button
              onClick={loadNewWord}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-2xl animate-pulse mr-1.5">💡</span>
              <h3 className="text-base sm:text-lg font-bold text-teal-700">
                Gợi ý:
              </h3>
            </div>
            <p className="text-base sm:text-xl font-bold text-center text-blue-800 px-2 py-1 bg-white bg-opacity-50 rounded-md border border-blue-200">
              {currentWord && currentWord.hint}
            </p>
          </div>
        )}
      </div>

      {/* Game area */}
      <div className="bg-gradient-to-r from-pink-100 to-rose-100 p-2 sm:p-3 rounded-lg shadow-md border-2 border-pink-300 mb-2 sm:mb-3">
        {/* Word display area */}
        <div className="min-h-[42px] sm:min-h-[48px] p-1.5 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-gradient-to-r from-purple-100 to-fuchsia-100 mb-2 sm:mb-3 shadow-inner">
          <div className="flex gap-1.5 flex-wrap justify-center">
            {selected.map((i, index) => (
              <span
                key={`selected-${index}`}
                className="inline-block w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-lg sm:text-xl font-bold rounded-xl shadow-md flex items-center justify-center animate-pop-in border-2 border-purple-600 cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => removeLetter(index)}
              >
                {letters[i]}
              </span>
            ))}
            {currentWord &&
              Array(Math.max(0, currentWord.word.length - selected.length))
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
                {currentWord && currentWord.word}
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
