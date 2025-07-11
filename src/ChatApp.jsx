import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ChatApp.css";
import { AwsChatSocket } from "./utils/awsSocket";

const API_URL =
  "https://m35vxg11jc.execute-api.ap-southeast-1.amazonaws.com/prod";

export default function ChatApp() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [userIdSet, setUserIdSet] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(""); // Store the room joined via socket
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Retrieve token from localStorage when loading the app
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  // Quản lý socket AWS bằng class AwsChatSocket
  const awsSocketRef = useRef(null);
  useEffect(() => {
    if (!userIdSet || !inRoom || !currentRoom) return;
    if (awsSocketRef.current) {
      awsSocketRef.current.disconnect();
      awsSocketRef.current = null;
    }
    awsSocketRef.current = new AwsChatSocket({
      url: "wss://zl058iu5n2.execute-api.ap-southeast-1.amazonaws.com/prod",
      userId,
      roomId: currentRoom,
      onMessage: (msg) => setMessages((prev) => [...prev, msg]),
      onSystem: (msg) => setMessages((prev) => [...prev, msg]),
      onOpen: () =>
        setMessages((prev) => [
          ...prev,
          { system: true, message: "Connected to AWS WebSocket" },
        ]),
      onClose: () =>
        setMessages((prev) => [
          ...prev,
          { system: true, message: "Disconnected from AWS WebSocket" },
        ]),
      onError: () =>
        setMessages((prev) => [
          ...prev,
          { system: true, message: "WebSocket error" },
        ]),
    });
    awsSocketRef.current.connect();
    return () => {
      if (awsSocketRef.current) {
        awsSocketRef.current.disconnect();
        awsSocketRef.current = null;
      }
    };
  }, [userIdSet, inRoom, currentRoom, userId]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setRooms([]);
    }
  }, [token]);

  useEffect(() => {
    if (userIdSet) {
      fetchRooms();
      // WebSocket sẽ tự connect ở useEffect trên
    }
  }, [userIdSet, fetchRooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) throw new Error("Invalid username or password");
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
      }
      // Get userId from data (prioritize common fields)
      const uid = data.userId || data.id || data._id || data.uid;
      if (uid) setUserId(uid);
      else {
        // If no userId, try to get from token (if JWT contains userId)
        try {
          const payload = JSON.parse(atob(data.token.split(".")[1]));
          if (payload.userId || payload.id || payload._id || payload.uid) {
            setUserId(
              payload.userId || payload.id || payload._id || payload.uid
            );
          }
        } catch (e) {
          // Cannot get userId from token
        }
      }
      setUserIdSet(true);
    } catch (err) {
      alert("Invalid username or password or server error");
    }
  };

  const handleJoinRoom = async () => {
    if (!userIdSet || !currentRoom) return;
    if (joinedRoom === currentRoom) return; // Already in this room, do not join again
    try {
      setJoinedRoom(currentRoom);
      // Lấy lại lịch sử chat qua REST API
      const authToken = token || localStorage.getItem("token");
      const roomInfoRes = await fetch(`${API_URL}/rooms/${currentRoom}`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (!roomInfoRes.ok)
        throw new Error("Failed to fetch room info after join");
      const roomInfo = await roomInfoRes.json();
      setMessages(
        Array.isArray(roomInfo.chatMessages)
          ? [
              ...roomInfo.chatMessages.map((msg) => ({
                ...msg,
                system: false,
              })),
              { system: true, message: `Joined room: ${currentRoom}` },
            ]
          : [{ system: true, message: `Joined room: ${currentRoom}` }]
      );
      setInRoom(true);
    } catch (err) {
      alert("Failed to join room");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.trim()) return;
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newRoom }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      setNewRoom("");
      fetchRooms();
    } catch (err) {
      alert("Failed to create room");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentRoom || !userIdSet) return;
    try {
      const messageStr = String(input);
      if (awsSocketRef.current) {
        awsSocketRef.current.send({
          action: "sendMessage",
          roomId: currentRoom,
          userId,
          name,
          text: messageStr,
        });
      }
      setInput("");
    } catch (err) {
      alert("Failed to send message");
    }
  };

  if (!userIdSet) {
    // Login UI
    return (
      <div className="chat-app-container">
        <h2 className="chat-app-title">💬 Chat App Login</h2>
        <form className="chat-app-form" onSubmit={handleLogin}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Username..."
            className="chat-app-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

  // Chat room UI
  if (!inRoom) {
    return (
      <div className="chat-app-container">
        <h2 className="chat-app-title">💬 Chat Room</h2>
        <div className="chat-app-room-row">
          <select
            value={currentRoom}
            onChange={(e) => setCurrentRoom(e.target.value)}
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
            className="chat-app-input"
          />
          <button
            onClick={handleCreateRoom}
            className="chat-app-btn chat-app-btn-create"
          >
            Create room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-app-container">
      <h2 className="chat-app-title">💬 Chat Room</h2>
      <div className="chat-app-room-row">
        <select
          value={currentRoom}
          onChange={(e) => setCurrentRoom(e.target.value)}
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
          className="chat-app-input"
        />
        <button
          onClick={handleCreateRoom}
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
      <form className="chat-app-form" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
