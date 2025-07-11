import React, { useRef, useEffect } from "react";

export default function ChatRoom({
  name,
  rooms,
  currentRoom,
  onRoomChange,
  onJoinRoom,
  newRoom,
  onNewRoomChange,
  onCreateRoom,
  messages,
  input,
  onInputChange,
  onSend,
}) {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-app-container">
      <h2 className="chat-app-title">💬 Chat Room</h2>
      <div className="chat-app-room-row">
        <select
          value={currentRoom}
          onChange={onRoomChange}
          className="chat-app-input"
        >
          <option value="">-- Select room --</option>
          {rooms.map((room) => (
            <option
              key={room.id || room._id || room.name}
              value={room.id || room._id || room.name}
            >
              {room.name || room.id || room._id}
            </option>
          ))}
        </select>
        <button onClick={onJoinRoom} className="chat-app-btn chat-app-btn-join">
          Join room
        </button>
      </div>
      <div className="chat-app-room-row">
        <input
          value={newRoom}
          onChange={onNewRoomChange}
          placeholder="New room name"
          className="chat-app-input"
        />
        <button
          onClick={onCreateRoom}
          className="chat-app-btn chat-app-btn-create"
        >
          Create room
        </button>
      </div>
      <div className="chat-app-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.system
                ? "chat-app-message-system"
                : msg.user === name || msg.name === name
                ? "chat-app-message chat-app-message-self"
                : "chat-app-message"
            }
          >
            {msg.system ? (
              msg.message
            ) : (
              <>
                <span className="chat-app-message-user">
                  {msg.user === name || msg.name === name
                    ? "You"
                    : msg.name || msg.user}
                  :
                </span>
                <span>{msg.message}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-app-form" onSubmit={onSend}>
        <input
          value={input}
          onChange={onInputChange}
          placeholder="Enter your message..."
          disabled={!currentRoom}
          className="chat-app-input chat-app-input-message"
        />
        <button
          type="submit"
          disabled={!currentRoom}
          className="chat-app-btn chat-app-btn-send"
        >
          Send
        </button>
      </form>
    </div>
  );
}
