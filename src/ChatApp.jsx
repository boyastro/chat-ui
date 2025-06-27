import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export default function ChatApp() {
  const [userId, setUserId] = useState("");
  const [userIdSet, setUserIdSet] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRooms();
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("connect", () => {
      setMessages((prev) => [
        ...prev,
        { system: true, message: `Đã kết nối tới server với id: ${socket.id}` },
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

  const handleSetUserId = () => {
    if (!userId.trim()) return;
    setUserIdSet(true);
  };

  const handleJoinRoom = () => {
    if (!userIdSet || !currentRoom) return;
    socket.emit("joinRoom", currentRoom);
    setMessages([
      { system: true, message: `Đã tham gia phòng: ${currentRoom}` },
    ]);
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
      text: input,
    });
    setInput("");
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 16px #bbb",
        padding: 24,
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#007bff", marginBottom: 24 }}>
        💬 Chat App
      </h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Nhập User ID..."
          disabled={userIdSet}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSetUserId}
          disabled={userIdSet}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: "#6c757d",
            color: "#fff",
            cursor: userIdSet ? "not-allowed" : "pointer",
          }}
        >
          Xác nhận
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select
          value={currentRoom}
          onChange={(e) => setCurrentRoom(e.target.value)}
          disabled={!userIdSet}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          <option value="">-- Chọn phòng --</option>
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
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: "#28a745",
            color: "#fff",
            cursor: !userIdSet ? "not-allowed" : "pointer",
          }}
        >
          Tham gia phòng
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="Tên phòng mới"
          disabled={!userIdSet}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleCreateRoom}
          disabled={!userIdSet}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: "#007bff",
            color: "#fff",
            cursor: !userIdSet ? "not-allowed" : "pointer",
          }}
        >
          Tạo phòng
        </button>
      </div>
      <div
        style={{
          height: 340,
          overflowY: "auto",
          border: "1px solid #eee",
          padding: 14,
          marginBottom: 18,
          background: "#f8fafd",
          borderRadius: 8,
          fontSize: 16,
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={
              msg.system
                ? { color: "#888", fontStyle: "italic", marginBottom: 6 }
                : {
                    marginBottom: 6,
                    color: msg.user === userId ? "#007bff" : "#222",
                    fontWeight: msg.user === userId ? 600 : 400,
                  }
            }
          >
            {msg.system ? (
              msg.message
            ) : (
              <>
                <span style={{ marginRight: 6 }}>
                  {msg.user === userId ? "Bạn" : msg.user}:
                </span>
                <span>{msg.message}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form style={{ display: "flex", gap: 12 }} onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          disabled={!userIdSet || !currentRoom}
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 16,
          }}
        />
        <button
          type="submit"
          disabled={!userIdSet || !currentRoom}
          style={{
            padding: "10px 24px",
            border: "none",
            background: "#007bff",
            color: "#fff",
            borderRadius: 6,
            cursor: !userIdSet || !currentRoom ? "not-allowed" : "pointer",
            fontSize: 16,
          }}
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
