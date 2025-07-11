import React from "react";

export default function LoginForm({
  name,
  password,
  onNameChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <div className="chat-app-container">
      <h2 className="chat-app-title">💬 Chat App Login</h2>
      <form className="chat-app-form" onSubmit={onSubmit}>
        <input
          value={name}
          onChange={onNameChange}
          placeholder="Enter Username..."
          className="chat-app-input"
        />
        <input
          type="password"
          value={password}
          onChange={onPasswordChange}
          placeholder="Enter Password..."
          className="chat-app-input"
        />
        <button type="submit" className="chat-app-btn chat-app-btn-confirm">
          Login
        </button>
      </form>
    </div>
  );
}
