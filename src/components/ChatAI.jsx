import React, { useState, useRef } from "react";

// Lấy API key từ biến môi trường
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-3.5-turbo";

export default function ChatAI({ userId }) {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `Bạn là trợ lý AI thân thiện.${
        userId ? ` userId: ${userId}` : ""
      }`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError("");
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: newMessages,
        }),
      });
      if (!res.ok) throw new Error("Lỗi gọi API OpenRouter");
      const data = await res.json();
      const aiMsg =
        data.choices?.[0]?.message?.content || "(Không có phản hồi)";
      setMessages([...newMessages, { role: "assistant", content: aiMsg }]);
    } catch (err) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-3 text-center">
        Chat với AI (OpenRouter)
      </h2>
      <div className="h-80 overflow-y-auto bg-gray-50 rounded p-2 mb-3 border border-gray-200">
        {messages.slice(1).map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[80%] text-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring"
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Gửi
        </button>
      </form>
      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      <div className="text-xs text-gray-400 mt-2">
        Model: openai/gpt-3.5-turbo qua OpenRouter
      </div>
    </div>
  );
}
