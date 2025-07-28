import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const QUESTIONS = [
  {
    question: "Thủ đô của Việt Nam là gì?",
    answers: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Huế"],
    correct: 0,
  },
  {
    question: "Ai là tác giả của Truyện Kiều?",
    answers: ["Nguyễn Du", "Nguyễn Trãi", "Hồ Xuân Hương", "Tố Hữu"],
    correct: 0,
  },
  {
    question: "Sông nào dài nhất Việt Nam?",
    answers: ["Sông Hồng", "Sông Mekong", "Sông Đà", "Sông Đồng Nai"],
    correct: 1,
  },
  {
    question:
      "Vịnh nào được UNESCO công nhận là Di sản thiên nhiên thế giới ở Việt Nam?",
    answers: [
      "Vịnh Hạ Long",
      "Vịnh Cam Ranh",
      "Vịnh Vân Phong",
      "Vịnh Xuân Đài",
    ],
    correct: 0,
  },
  {
    question: "Chùa Một Cột nằm ở thành phố nào?",
    answers: ["Hà Nội", "Huế", "Hải Phòng", "Đà Nẵng"],
    correct: 0,
  },
  {
    question: "Đơn vị tiền tệ của Việt Nam là gì?",
    answers: ["Đồng", "Yên", "Baht", "Ringgit"],
    correct: 0,
  },
  {
    question: "Ai là vị vua đầu tiên của triều đại nhà Nguyễn?",
    answers: ["Gia Long", "Minh Mạng", "Tự Đức", "Duy Tân"],
    correct: 0,
  },
  {
    question: "Đỉnh núi cao nhất Việt Nam là?",
    answers: ["Fansipan", "Bạch Mã", "Tây Côn Lĩnh", "Langbiang"],
    correct: 0,
  },
  {
    question: "Ngày Quốc khánh Việt Nam là ngày nào?",
    answers: ["2/9", "30/4", "1/5", "19/8"],
    correct: 0,
  },
  {
    question: "Đội tuyển bóng đá nam Việt Nam vô địch AFF Cup lần đầu năm nào?",
    answers: ["2008", "2018", "2010", "2004"],
    correct: 0,
  },
  {
    question: "Tỉnh nào có diện tích lớn nhất Việt Nam?",
    answers: ["Nghệ An", "Thanh Hóa", "Đắk Lắk", "Sơn La"],
    correct: 0,
  },
  {
    question: "Ai là Tổng Bí thư đầu tiên của Đảng Cộng sản Việt Nam?",
    answers: ["Trần Phú", "Lê Duẩn", "Nguyễn Văn Linh", "Hồ Chí Minh"],
    correct: 0,
  },
  {
    question: "Địa danh nào được mệnh danh là 'thành phố ngàn hoa'?",
    answers: ["Đà Lạt", "Huế", "Hà Nội", "Sapa"],
    correct: 0,
  },
  {
    question: "Tên gọi cũ của thành phố Hồ Chí Minh là gì?",
    answers: ["Sài Gòn", "Gia Định", "Thủ Đức", "Chợ Lớn"],
    correct: 0,
  },
  {
    question: "Ai là người phát minh ra bảng chữ cái tiếng Việt hiện đại?",
    answers: [
      "Alexandre de Rhodes",
      "Trương Vĩnh Ký",
      "Nguyễn Trãi",
      "Lê Quý Đôn",
    ],
    correct: 0,
  },
];

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

export default function MillionaireGame({ userId }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", avatar: "", coin: 0 });
  // Blur focus khỏi button khi chuyển step (chống lưu highlight trên mobile)
  useEffect(() => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }, [step]);

  // Lấy câu hỏi hiện tại
  const current = QUESTIONS[step];

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
  const addCoinForUser = (coin) => {
    if (!userId) return;

    // Cập nhật UI ngay lập tức để không bị lag
    const earnedCoin = parseInt(coin, 10);

    // Cập nhật tạm thời userInfo.coin ở UI để người dùng thấy ngay
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
      body: JSON.stringify({
        userId,
        coin: earnedCoin,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Cập nhật lại chính xác số coin từ server
          setUserInfo((prev) => ({
            ...prev,
            coin: data.coin,
          }));
          console.log(
            `Thêm ${earnedCoin} coin thành công, số coin hiện tại: ${data.coin}`
          );
        }
      })
      .catch((err) => console.error("Lỗi khi cộng coin:", err));
  };

  const handleSelect = (idx) => {
    if (locked) return;
    setSelected(idx);
    setLocked(true);
    setTimeout(() => {
      if (idx === current.correct) {
        if (step === QUESTIONS.length - 1) {
          setWon(true);
          addCoinForUser(PRIZES[step]);
        } else {
          // Reset state trước khi chuyển step, đồng thời blur focus khỏi button
          const nextStep = step + 1;
          setSelected(null);
          setLocked(false);
          // Blur focus khỏi button đang được chọn (nếu có)
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
          setTimeout(() => setStep(nextStep), 0);
        }
      } else {
        setLost(true);
        if (step > 0) {
          addCoinForUser(PRIZES[step - 1]);
        }
      }
    }, 1200);
  };

  const handleRestart = () => {
    setStep(0);
    setSelected(null);
    setLocked(false);
    setWon(false);
    setLost(false);
  };

  return (
    <div className="max-w-lg mx-auto my-4 px-3 py-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl sm:rounded-2xl shadow-xl border-2 border-yellow-400">
      <div className="flex justify-start mb-2">
        <button
          className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-md text-xs sm:text-sm font-medium shadow hover:from-blue-500 hover:to-indigo-600 transition"
          onClick={() => navigate("/rooms")}
        >
          <span className="text-xs sm:text-sm">⬅️</span>
          <span>Về phòng chát</span>
        </button>
      </div>

      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-2 bg-white/90 border border-yellow-300 rounded-lg px-3 py-1.5 shadow-sm">
          {userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt="avatar"
              className="w-9 h-9 rounded-full border-2 border-yellow-400 object-cover bg-white"
              style={{ minWidth: 36, minHeight: 36 }}
            />
          ) : null}
          <div className="flex flex-col">
            <span className="font-bold text-yellow-800 text-sm truncate max-w-[150px] sm:max-w-[180px]">
              {userInfo.name}
            </span>
            <div className="flex items-center text-xs text-yellow-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1"
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

      <h2 className="text-xl sm:text-2xl font-bold text-yellow-700 text-center mb-3 sm:mb-4">
        🎉 AI LÀ TRIỆU PHÚ
      </h2>

      {/* Hiển thị bảng xếp hạng phần thưởng di động (chỉ hiển thị 3 mốc quan trọng) */}
      <div className="flex md:hidden items-center justify-center gap-1 mb-3">
        {[4, 9, 14].map((i) => (
          <div
            key={i}
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border 
              ${
                i === step
                  ? "bg-yellow-400 border-yellow-700 text-white animate-pulse"
                  : i < step
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "bg-white border-yellow-200 text-yellow-700"
              }
            `}
          >
            <span>{PRIZES[i]}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline h-3 w-3 align-middle"
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
          ) : lost ? (
            <div className="text-center text-red-600 font-bold text-lg sm:text-xl px-3 py-6 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="mb-2 text-3xl">😢</div>
              Bạn đã trả lời sai!
              <br />
              <span className="mt-2 inline-block">
                Số tiền thưởng: {step > 0 ? PRIZES[step - 1] : "0"}
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
              {/* Hiển thị số câu và tiền thưởng */}
              <div className="flex justify-between items-center mb-2 text-xs sm:text-sm px-2 py-1 bg-yellow-100/60 rounded-md">
                <span className="font-medium text-yellow-800">
                  Câu {step + 1}/15
                </span>
                <span className="font-bold text-yellow-700">
                  {PRIZES[step]}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4 ml-0.5 align-middle"
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

              <div
                key={`question-${step}`}
                className="mb-3 text-base sm:text-lg font-semibold text-gray-800 bg-white/70 p-2 sm:p-3 rounded-lg border border-yellow-200"
              >
                {current.question}
              </div>
              <div
                key={`answers-${step}`}
                className="grid grid-cols-1 gap-2 sm:gap-3"
              >
                {current.answers.map((ans, idx) => (
                  <button
                    key={`step${step}-ans${idx}`}
                    tabIndex={-1}
                    className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border-2 font-medium text-sm sm:text-base transition-all duration-200
                      ${
                        selected === idx
                          ? idx === current.correct
                            ? "bg-green-400 border-green-600 text-white"
                            : "bg-red-400 border-red-600 text-white"
                          : "bg-white border-yellow-400 text-yellow-800 hover:bg-yellow-100 active:bg-yellow-200"
                      }
                      ${locked && selected !== idx ? "opacity-60" : ""}
                    `}
                    disabled={locked}
                    onClick={() => handleSelect(idx)}
                  >
                    <span className="flex items-center">
                      <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 w-6 h-6 sm:w-7 sm:h-7 rounded-full mr-2 font-bold text-xs sm:text-sm">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-left">{ans}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {(won || lost) && (
            <button
              className="mt-5 w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold text-lg shadow hover:from-yellow-600 hover:to-amber-600 transition active:scale-98"
              onClick={handleRestart}
            >
              Chơi lại
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
              `}
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
