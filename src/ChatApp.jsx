import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./ChatApp.css";

const socket = io("http://localhost:3000");

export default function ChatApp() {
  const [userId, setUserId] = useState("");
  const [userIdSet, setUserIdSet] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRooms();
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("connect", () => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `Connected to server with id: ${socket.id}` },
      ]);
    });
    return () => {
      socket.off("receiveMessage");
      socket.off("connect");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchRooms() {
    const res = await fetch("http://localhost:3000/rooms");
    const data = await res.json();
    setRooms(data);
  }

  const handleSetUserId = async () => {
    if (!userId.trim()) return;
    // Call API to get user info from userId
    try {
      const res = await fetch(`http://localhost:3000/users/${userId}`);
      if (!res.ok) throw new Error("User not found");
      const data = await res.json();
      setUserName(data.name || "");
      setUserIdSet(true);
    } catch (err) {
      alert("User not found or server error");
    }
  };

  const handleJoinRoom = () => {
    if (!userIdSet || !currentRoom) return;
    socket.emit("joinRoom", currentRoom);
    setMessages([{ system: true, message: `Joined room: ${currentRoom}` }]);
  };

  const handleCreateRoom = async () => {
    if (!newRoom.trim()) return;
    await fetch("http://localhost:3000/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoom }),
    });
    setNewRoom("");
    fetchRooms();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !currentRoom || !userIdSet) return;
    socket.emit("sendMessage", {
      roomId: currentRoom,
      userId: userId,
      name: userName, // send correct name from database
      text: input,
    });
    setInput("");
  };

  return (
    <div className="chat-app-container">
      <h2 className="chat-app-title">💬 Chat App</h2>
      <div className="chat-app-user-row">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID..."
          disabled={userIdSet}
          className="chat-app-input"
        />
        <button
          onClick={handleSetUserId}
          disabled={userIdSet}
          className="chat-app-btn chat-app-btn-confirm"
        >
          Confirm
        </button>
      </div>
      <div className="chat-app-room-row">
        <select
          value={currentRoom}
          onChange={(e) => setCurrentRoom(e.target.value)}
          disabled={!userIdSet}
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
        <button
          onClick={handleJoinRoom}
          disabled={!userIdSet}
          className="chat-app-btn chat-app-btn-join"
        >
          Join room
        </button>
      </div>
      <div className="chat-app-room-row">
        <input
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="New room name"
          disabled={!userIdSet}
          className="chat-app-input"
        />
        <button
          onClick={handleCreateRoom}
          disabled={!userIdSet}
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
                : msg.user === userId || msg.name === userName
                ? "chat-app-message chat-app-message-self"
                : "chat-app-message"
            }
          >
            {msg.system ? (
              msg.message
            ) : (
              <>
                <span className="chat-app-message-user">
                  {msg.user === userId || msg.name === userName
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
      <form className="chat-app-form" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your message..."
          disabled={!userIdSet || !currentRoom}
          className="chat-app-input chat-app-input-message"
        />
        <button
          type="submit"
          disabled={!userIdSet || !currentRoom}
          className="chat-app-btn chat-app-btn-send"
        >
          Send
        </button>
      </form>
    </div>
  );
}
