import React, { useState, useEffect } from "react";

export default function LoginForm({
  name,
  password,
  onNameChange,
  onPasswordChange,
  onSubmit,
}) {
  const [glowEffect, setGlowEffect] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowEffect((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto my-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-[0_0_15px_rgba(0,180,255,0.5)] p-8 border border-cyan-500/30 backdrop-blur-sm">
      <div className={`mb-8 text-center ${glowEffect ? "animate-pulse" : ""}`}>
        <h2 className="font-gaming text-3xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wider">
          🎮 GAME CHAT
        </h2>
        <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mt-2"></div>
      </div>

      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <input
            value={name}
            onChange={onNameChange}
            placeholder="Tên đăng nhập..."
            className="w-full pl-10 rounded-lg border border-cyan-500/50 px-4 py-3 text-base bg-gray-900/80 text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-cyan-400"
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
          </div>
          <input
            type="password"
            value={password}
            onChange={onPasswordChange}
            placeholder="Mật khẩu..."
            className="w-full pl-10 rounded-lg border border-cyan-500/50 px-4 py-3 text-base bg-gray-900/80 text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          className="mt-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white rounded-lg px-6 py-3 font-bold text-lg shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-white top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease opacity-10"></span>
          <span className="relative">ĐĂNG NHẬP</span>
        </button>
      </form>
    </div>
  );
}
