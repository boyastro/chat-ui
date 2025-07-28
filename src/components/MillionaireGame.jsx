import React, { useState } from "react";

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
  // ... thêm câu hỏi tuỳ ý
];

const PRIZES = [
  "200.000",
  "400.000",
  "600.000",
  "1.000.000",
  "2.000.000",
  "3.000.000",
  "6.000.000",
  "10.000.000",
  "14.000.000",
  "22.000.000",
  "30.000.000",
  "40.000.000",
  "60.000.000",
  "85.000.000",
  "150.000.000",
];

export default function MillionaireGame() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);

  const current = QUESTIONS[step];

  const handleSelect = (idx) => {
    if (locked) return;
    setSelected(idx);
    setLocked(true);
    setTimeout(() => {
      if (idx === current.correct) {
        if (step === QUESTIONS.length - 1) {
          setWon(true);
        } else {
          setStep(step + 1);
          setSelected(null);
          setLocked(false);
        }
      } else {
        setLost(true);
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
    <div className="max-w-lg mx-auto my-8 p-6 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl shadow-xl border-2 border-yellow-400">
      <h2 className="text-2xl font-bold text-yellow-700 text-center mb-4">
        🎉 AI LÀ TRIỆU PHÚ
      </h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {won ? (
            <div className="text-center text-green-700 font-bold text-xl">
              Chúc mừng! Bạn đã trở thành TRIỆU PHÚ!
            </div>
          ) : lost ? (
            <div className="text-center text-red-600 font-bold text-xl">
              Bạn đã trả lời sai!
              <br />
              Số tiền thưởng: {step > 0 ? PRIZES[step - 1] : "0"} VNĐ
            </div>
          ) : (
            <>
              <div className="mb-4 text-lg font-semibold text-gray-800">
                Câu {step + 1}: {current.question}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {current.answers.map((ans, idx) => (
                  <button
                    key={idx}
                    className={`w-full py-2 px-4 rounded-lg border-2 font-semibold text-base transition-all duration-200
                      ${
                        selected === idx
                          ? idx === current.correct
                            ? "bg-green-400 border-green-600 text-white"
                            : "bg-red-400 border-red-600 text-white"
                          : "bg-white border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                      }
                      ${locked && selected !== idx ? "opacity-60" : ""}
                    `}
                    disabled={locked}
                    onClick={() => handleSelect(idx)}
                  >
                    {String.fromCharCode(65 + idx)}. {ans}
                  </button>
                ))}
              </div>
            </>
          )}
          {(won || lost) && (
            <button
              className="mt-6 w-full py-2 rounded-lg bg-yellow-500 text-white font-bold text-lg shadow hover:bg-yellow-600 transition"
              onClick={handleRestart}
            >
              Chơi lại
            </button>
          )}
        </div>
        <div className="w-full md:w-48 flex flex-col-reverse gap-1 mt-6 md:mt-0">
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
              Câu {i + 1}: {p} VNĐ
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
