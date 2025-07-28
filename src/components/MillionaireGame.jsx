import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./millionaire.css";

const PRIZES = [
  "2",
  "4",
  "6",
  "10",
  "20",
  "30",
  "60",
  "100",
  "140",
  "220",
  "300",
  "400",
  "600",
  "850",
  "1500",
];

const LEVELS = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]; // 15 câu

export default function MillionaireGame({ userId }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [stopped, setStopped] = useState(false); // Trạng thái khi người chơi dừng cuộc chơi
  const [userInfo, setUserInfo] = useState({ name: "", avatar: "", coin: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const [questions, setQuestions] = useState(Array(15).fill(null));
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Lấy câu hỏi hiện tại
  const current = questions[step];

  useEffect(() => {
    if (!userId) return;
    const API_URL = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUserInfo({
            name: data.name || data.username || "User",
            avatar:
              data.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.name || data.username || "U"
              )}&background=random`,
            coin: data.coin || 0, // Lấy số coin từ thông tin user
          });
        }
      });
  }, [userId]);

  // Hàm gọi API để cộng coin cho user
  const addCoinForUser = useCallback(
    (coin) => {
      if (!userId) return;
      const earnedCoin = parseInt(coin, 10);
      setUserInfo((prev) => ({
        ...prev,
        coin: prev.coin + earnedCoin,
      }));
      const API_URL = process.env.REACT_APP_API_URL;
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
          if (data.success) {
            setUserInfo((prev) => ({ ...prev, coin: data.coin }));
            console.log(
              `Thêm ${earnedCoin} coin thành công, số coin hiện tại: ${data.coin}`
            );
          }
        })
        .catch((err) => console.error("Lỗi khi cộng coin:", err));
    },
    [userId]
  );

  // Xử lý khi hết thời gian
  const handleTimeOut = useCallback(() => {
    setLocked(true);
    setLost(true);
    let guaranteedPrize = "0";
    const checkpoints = [4, 9, 14];
    for (let i = checkpoints.length - 1; i >= 0; i--) {
      if (step > checkpoints[i]) {
        guaranteedPrize = PRIZES[checkpoints[i]];
        break;
      }
    }
    if (guaranteedPrize !== "0") {
      addCoinForUser(guaranteedPrize);
    }
  }, [step, addCoinForUser]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timerActive && !won && !lost && !stopped) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, won, lost, stopped, handleTimeOut]);

  // Reset timer khi sang câu mới
  useEffect(() => {
    setTimeLeft(30);
    setTimerActive(true);
  }, [step]);

  const handleSelect = (idx) => {
    if (locked || loading || !current) return;
    setSelected(idx);
    setLocked(true);
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      if (idx === current.correct) {
        if (step === questions.length - 1) {
          setWon(true);
          // Thêm coin khi hoàn thành toàn bộ câu hỏi
          addCoinForUser(PRIZES[step]);
        } else {
          // Cách mới: reset state hoàn toàn TRƯỚC khi set step mới
          // Lưu step mới vào biến tạm để tránh closure effect
          const nextStep = step + 1;
          setSelected(null);
          setLocked(false);
          // Set step sau cùng để trigger render sau khi đã reset state
          setTimeout(() => setStep(nextStep), 0);
        }
      } else {
        setLost(true);

        // Xác định mức đảm bảo của người chơi khi thua
        let guaranteedPrize = "0";

        // Mốc đảm bảo là các câu 5, 10, 15 (index 4, 9, 14)
        const checkpoints = [4, 9, 14];

        // Tìm mức đảm bảo thấp nhất mà người chơi đã đạt được
        for (let i = checkpoints.length - 1; i >= 0; i--) {
          if (step > checkpoints[i]) {
            guaranteedPrize = PRIZES[checkpoints[i]];
            break;
          }
        }

        if (guaranteedPrize !== "0") {
          addCoinForUser(guaranteedPrize);
        }
      }
    }, 1200);
  };

  // Hàm xử lý khi người chơi muốn dừng cuộc chơi và nhận thưởng
  const handleStop = () => {
    // Người chơi chỉ có thể dừng sau khi đã trả lời ít nhất một câu hỏi
    if (step > 0) {
      setStopped(true);
      setLocked(true);
      setTimerActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      addCoinForUser(PRIZES[step - 1]); // step - 1 vì đây là câu hỏi đã trả lời xong
    }
  };

  const handleRestart = () => {
    setStep(0);
    setSelected(null);
    setLocked(false);
    setWon(false);
    setLost(false);
    setStopped(false);
    setTimeLeft(30);
    setTimerActive(true);
  };

  // Hàm lấy câu hỏi từ API
  const fetchQuestion = useCallback(
    async (stepIdx) => {
      // Chỉ đặt trạng thái loading cho những câu hỏi chưa có dữ liệu
      // Điều này giúp giữ giao diện ổn định
      if (!questions.some((q) => q !== null)) {
        setLoading(true); // Chỉ loading lần đầu tiên khi chưa có câu hỏi nào
      } else {
        // Với những câu sau, đánh dấu đang tải nhưng không thay đổi giao diện hoàn toàn
        setLoading(true);
      }

      const level = LEVELS[stepIdx];
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/millionaire/question?level=${level}`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : undefined },
          }
        );
        if (!res.ok) throw new Error("Không lấy được câu hỏi");
        const data = await res.json();

        // Cập nhật câu hỏi chỉ khi đã lấy được dữ liệu
        setQuestions((prev) => {
          const newArr = [...prev];
          newArr[stepIdx] = {
            question: data.question,
            answers: data.answers,
            correct: data.correctIndex,
            explanation: data.explanation,
            _id: data._id,
            level: data.level,
          };
          return newArr;
        });

        // Đợi một chút để tránh nhấp nháy giao diện
        setTimeout(() => {
          setLoading(false);
        }, 100);
      } catch (e) {
        setQuestions((prev) => {
          const newArr = [...prev];
          newArr[stepIdx] = {
            question: "Không lấy được câu hỏi. Vui lòng thử lại!",
            answers: ["", "", "", ""],
            correct: 0,
          };
          return newArr;
        });
        setLoading(false);
      }
    },
    [questions]
  ); // Added questions to the dependency array

  // Lấy câu hỏi khi bắt đầu game hoặc chuyển câu
  useEffect(() => {
    if (!questions[step]) {
      fetchQuestion(step);
    }
  }, [step, fetchQuestion, questions]);

  // Xóa vết highlight/focus trên button khi chuyển câu hỏi (fix Chrome mobile)
  useEffect(() => {
    setTimeout(() => {
      const btns = document.querySelectorAll("button");
      btns.forEach((btn) => btn.blur());
    }, 0);
  }, [step]);

  return (
    <div className="max-w-lg mx-auto my-4 px-3 py-4 sm:p-6 rounded-xl sm:rounded-2xl millionaire-container">
      <div className="flex justify-start mb-2">
        <button
          className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 millionaire-button rounded-md text-xs sm:text-sm font-medium"
          onClick={() => navigate("/rooms")}
        >
          <span className="text-xs sm:text-sm">⬅️</span>
          <span>Về phòng chát</span>
        </button>
      </div>

      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-2 millionaire-user-info rounded-lg px-3 py-1.5 shadow-sm">
          {userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt="avatar"
              className="w-9 h-9 rounded-full border-2 border-blue-400 object-cover bg-white"
              style={{ minWidth: 36, minHeight: 36 }}
            />
          ) : null}
          <div className="flex flex-col">
            <span className="font-bold text-blue-300 text-sm truncate max-w-[150px] sm:max-w-[180px]">
              {userInfo.name}
            </span>
            <div className="flex items-center text-xs text-yellow-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1 coin-icon"
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
              <span className="font-semibold">{userInfo.coin}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4 millionaire-title">
        🎉 AI LÀ TRIỆU PHÚ
      </h2>

      {/* Hiển thị bảng xếp hạng phần thưởng di động (chỉ hiển thị 3 mốc đảm bảo) */}
      <div className="flex md:hidden items-center justify-center gap-1 mb-3">
        {[4, 9, 14].map((i) => (
          <div
            key={i}
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold
              ${
                i === step
                  ? "millionaire-prize-item current"
                  : i < step
                  ? "millionaire-prize-item passed"
                  : "millionaire-prize-item"
              }
              ${
                [4, 9, 14].includes(i)
                  ? "millionaire-prize-item checkpoint"
                  : ""
              }
            `}
            title={`Mốc đảm bảo ${i === 4 ? "1" : i === 9 ? "2" : "3"}`}
          >
            <span>{PRIZES[i]}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline h-3 w-3 align-middle coin-icon"
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
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="flex-1">
          {won ? (
            <div className="text-center text-green-700 font-bold text-lg sm:text-xl px-3 py-6 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="mb-2 text-4xl">🏆</div>
              Chúc mừng! Bạn đã trở thành TRIỆU PHÚ!
              <div className="mt-2 text-sm">
                (Bạn đã nhận được{" "}
                <span className="font-semibold text-yellow-600">
                  {PRIZES[step]} coin
                </span>
                !)
              </div>
            </div>
          ) : stopped ? (
            <div className="text-center font-bold text-lg sm:text-xl px-3 py-8 rounded-lg millionaire-question border-2 border-yellow-400">
              <div className="text-blue-300 text-2xl sm:text-3xl mb-2">
                Bạn đã dừng cuộc chơi!
              </div>
              <div className="mb-3">
                Bạn đã trả lời đúng{" "}
                <span className="text-green-400">{step}</span> câu hỏi
              </div>
              <div className="mt-4 py-3 px-4 bg-gradient-to-r from-yellow-900/40 to-amber-900/40 inline-block rounded-lg border border-yellow-500">
                <div className="text-yellow-400 text-sm mb-1">
                  Số tiền thưởng của bạn
                </div>
                <div className="millionaire-money-won text-2xl sm:text-3xl flex items-center justify-center">
                  {PRIZES[step - 1]}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 ml-2 align-middle coin-icon"
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
                </div>
              </div>
            </div>
          ) : lost ? (
            <div className="text-center text-red-600 font-bold text-lg sm:text-xl px-3 py-6 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="mb-2 text-3xl">😢</div>
              Bạn đã trả lời sai!
              <br />
              <span className="mt-2 inline-block">
                Số tiền thưởng:{" "}
                {(() => {
                  // Xác định mức đảm bảo
                  const checkpoints = [4, 9, 14];
                  for (let i = checkpoints.length - 1; i >= 0; i--) {
                    if (step > checkpoints[i]) {
                      return PRIZES[checkpoints[i]];
                    }
                  }
                  return "0";
                })()}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline h-5 w-5 ml-1 align-middle"
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
            </div>
          ) : (
            <>
              {/* Hiển thị số câu, tiền thưởng, đồng hồ và thanh tiến trình */}
              <div className="flex justify-between items-center mb-2 text-xs sm:text-sm px-3 py-2 rounded-md millionaire-prize-item">
                <div className="flex items-center">
                  <span className="font-medium">Câu {step + 1}/15</span>
                  <div
                    className={`ml-2 flex items-center justify-center p-1 rounded-full ${
                      timeLeft <= 10
                        ? "text-red-400 animate-pulse"
                        : "text-blue-300"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-bold">{timeLeft}s</span>
                  </div>
                </div>
                <span className="font-bold millionaire-money-won">
                  {PRIZES[step]}
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
              </div>
              {/* Thanh tiến trình thời gian */}
              <div className="mb-1 bg-blue-900/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${
                    timeLeft <= 10 ? "bg-red-500" : "bg-blue-400"
                  }`}
                  style={{
                    width: `${(timeLeft / 30) * 100}%`,
                    transition: "width 1s linear",
                  }}
                ></div>
              </div>

              <div
                key={`question-${step}`}
                className="mb-4 text-base sm:text-lg font-semibold p-4 sm:p-5 rounded-lg millionaire-question millionaire-pulse"
              >
                {loading || !current ? (
                  <div className="flex justify-center items-center py-4 opacity-60">
                    {/* Empty placeholder with same height to keep layout stable */}
                    <span className="invisible">Loading placeholder</span>
                  </div>
                ) : (
                  current.question
                )}
              </div>
              <div
                key={`answers-${step}`}
                className="grid grid-cols-1 gap-3 sm:gap-4"
              >
                {!loading && current && current.answers
                  ? current.answers.map((ans, idx) => (
                      <button
                        key={`step${step}-ans${idx}-${Date.now()}`}
                        className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 millionaire-option
                      ${
                        selected === idx
                          ? idx === current.correct
                            ? "correct"
                            : "incorrect"
                          : ""
                      }
                      ${
                        selected !== null && selected !== idx
                          ? "opacity-60"
                          : ""
                      }
                    `}
                        disabled={locked}
                        onClick={() => handleSelect(idx)}
                      >
                        <span className="flex items-center">
                          <span className="inline-flex items-center justify-center millionaire-option-label w-6 h-6 sm:w-7 sm:h-7 rounded-full mr-2 font-bold text-xs sm:text-sm">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-left">{ans}</span>
                        </span>
                      </button>
                    ))
                  : // Placeholder buttons when loading or no data
                    Array(4)
                      .fill(0)
                      .map((_, idx) => (
                        <button
                          key={`placeholder-${idx}`}
                          className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 millionaire-option opacity-40"
                          disabled={true}
                        >
                          <span className="flex items-center">
                            <span className="inline-flex items-center justify-center millionaire-option-label w-6 h-6 sm:w-7 sm:h-7 rounded-full mr-2 font-bold text-xs sm:text-sm">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-left">&nbsp;</span>
                          </span>
                        </button>
                      ))}
              </div>

              {/* Nút dừng cuộc chơi và nhận thưởng (chỉ hiển thị khi đã qua câu hỏi đầu tiên) */}
              {step > 0 && !locked && !loading && current && (
                <button
                  className="mt-4 py-3 w-full rounded-lg millionaire-stop-button font-semibold transition-all"
                  onClick={handleStop}
                >
                  <div className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Dừng cuộc chơi và nhận {PRIZES[step - 1]} coin 💰
                  </div>
                </button>
              )}
            </>
          )}
          {(won || lost || stopped) && (
            <button
              className="mt-6 w-full py-3 rounded-lg text-white font-bold text-lg shadow-lg millionaire-button transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleRestart}
            >
              <div className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Chơi lại
              </div>
            </button>
          )}
        </div>

        {/* Bảng thưởng chỉ hiển thị trên màn hình lớn */}
        <div className="hidden md:flex w-48 flex-col-reverse gap-1">
          {PRIZES.map((p, i) => (
            <div
              key={i}
              className={`rounded px-2 py-1 text-sm font-bold border-2 text-right
                ${
                  i === step
                    ? "bg-yellow-400 border-yellow-700 text-white animate-pulse"
                    : i < step
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "bg-white border-yellow-200 text-yellow-700"
                }
                ${
                  [4, 9, 14].includes(i)
                    ? "border-orange-500 border-dashed"
                    : ""
                }
              `}
              title={
                [4, 9, 14].includes(i)
                  ? `Mốc đảm bảo ${i === 4 ? "1" : i === 9 ? "2" : "3"}`
                  : undefined
              }
            >
              Câu {i + 1}: {p}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="inline h-5 w-5 ml-1 align-middle"
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
