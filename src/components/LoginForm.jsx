import React from "react";

export default function LoginForm({
  name,
  password,
  onNameChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <div className="max-w-md mx-auto my-16 bg-white rounded-2xl shadow-xl p-6">
      <h2 className="font-bold text-2xl text-blue-600 tracking-wide mb-6 text-center">
        💬 Chat App Login
      </h2>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <input
          value={name}
          onChange={onNameChange}
          placeholder="Tên đăng nhập..."
          className="rounded-md border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <input
          type="password"
          value={password}
          onChange={onPasswordChange}
          placeholder="Mật khẩu..."
          className="rounded-md border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-md px-6 py-2 font-semibold text-base shadow-md hover:bg-blue-700 transition mt-2"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
