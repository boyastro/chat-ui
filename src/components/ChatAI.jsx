import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Lấy API key từ biến môi trường
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Danh sách các mô hình ưu tiên
const MODELS = [
  "openai/gpt-3.5-turbo",
  "anthropic/claude-3-haiku",
  "mistralai/mistral-7b-instruct",
];

// CSS Animation cho fade-in
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out forwards;
  opacity: 0;
}
`;

export default function ChatAI({ userId }) {
  const navigate = useNavigate();

  // Thêm style animation vào DOM
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = fadeInAnimation;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Khôi phục nội dung chat từ localStorage nếu có
  const defaultSystemMsg = {
    role: "system",
    content: `Bạn là trợ lý AI thân thiện.${
      userId ? ` userId: ${userId}` : ""
    }`,
  };
  const chatKey = userId ? `chat_history_${userId}` : "chat_history_guest";
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(chatKey);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr[0]?.role === "system") return arr;
      }
    } catch {}
    return [defaultSystemMsg];
  });
  const [userInfo, setUserInfo] = useState({ name: "", avatar: "" });
  // Fetch user info nếu có userId
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
          });
        }
      });
  }, [userId]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc loading thay đổi
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Lưu messages vào localStorage (trừ khi chỉ có system message)
    if (messages.length > 1) {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, loading, chatKey]);

  // Hàm thử nhiều mô hình theo thứ tự ưu tiên
  async function tryModels(messages) {
    for (const model of MODELS) {
      try {
        const res = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages }),
        });
        if (res.ok) {
          const data = await res.json();
          const aiMsg = data.choices?.[0]?.message?.content;
          if (aiMsg) return { aiMsg, model };
        }
      } catch (err) {
        // Bỏ qua lỗi, thử model tiếp theo
      }
    }
    throw new Error("Tất cả các mô hình đều bị lỗi hoặc không phản hồi.");
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError("");
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const { aiMsg } = await tryModels(newMessages);
      setMessages([...newMessages, { role: "assistant", content: aiMsg }]);
    } catch (err) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 p-0 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Chat AI</h2>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 hover:bg-white/30 text-white border border-white/30 shadow-sm transition backdrop-blur-sm"
            onClick={() => navigate("/rooms")}
          >
            <span>⬅️</span>
            <span>Về phòng chát</span>
          </button>
        </div>
      </div>

      {/* Chat container */}
      <div className="h-96 overflow-y-auto bg-gray-50 p-4 overflow-x-hidden">
        {messages.slice(1).map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`mb-4 flex ${
                isUser ? "justify-end" : "justify-start"
              } animate-fade-in`}
              style={{
                animationDelay: `${idx * 0.1}s`,
                opacity: 1,
              }}
            >
              {!isUser && (
                <div className="flex flex-col items-center mr-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl select-none shadow-md">
                    🤖
                  </div>
                  <span className="text-xs text-gray-500 mt-1 font-medium">
                    AI
                  </span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
                style={{
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>
              {isUser && (
                <div className="flex flex-col items-center ml-2">
                  <div className="w-10 h-10 rounded-full shadow-md border-2 border-blue-400 overflow-hidden">
                    {userInfo.avatar ? (
                      <img
                        src={userInfo.avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <span className="text-xs text-blue-600 mt-1 font-semibold max-w-[80px] truncate">
                    {userInfo.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="flex flex-col items-center mr-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl select-none animate-pulse shadow-md">
                🤖
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex space-x-2 items-center h-5">
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            className="flex-1 border border-gray-300 rounded-2xl px-4 py-2.5 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-none min-h-[40px] max-h-40 overflow-y-auto"
            style={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
            placeholder="Nhập tin nhắn của bạn..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Tự động co giãn chiều cao
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 160) + "px";
            }}
            disabled={loading}
            rows={1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 160) + "px";
            }}
          />
          {/* Ẩn scrollbar cho Chrome/Safari */}
          <style>{`
            textarea::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-full font-semibold disabled:opacity-50 shadow-sm transition-all transform hover:scale-105 active:scale-95 disabled:transform-none"
            disabled={loading || !input.trim()}
          >
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
        </form>
        {error && (
          <div className="text-red-500 mt-2 text-sm bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
