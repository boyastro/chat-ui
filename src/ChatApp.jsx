import React, { useEffect, useRef, useState, useCallback } from "react";
// import { io } from "socket.io-client";
import "./ChatApp.css";

const API_URL =
  "https://m35vxg11jc.execute-api.ap-southeast-1.amazonaws.com/prod";
// AWS WebSocket (API Gateway) - use native WebSocket
let ws = null;

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

  // Tạo WebSocket chỉ sau khi join room thành công
  useEffect(() => {
    if (!userIdSet || !inRoom || !currentRoom) return;
    // Đóng socket cũ nếu có
    if (ws) {
      try {
        ws.close();
      } catch {}
      ws = null;
    }
    ws = new window.WebSocket(
      "wss://zl058iu5n2.execute-api.ap-southeast-1.amazonaws.com/prod"
    );

    ws.onopen = (event) => {
      console.log("WS OPEN: Connected to AWS WebSocket");
      setMessages((prev) => [
        ...prev,
        { system: true, message: "Connected to AWS WebSocket" },
      ]);
      // Gửi joinRoom ngay khi socket mở (đảm bảo backend biết user vào room)
      if (ws && ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            action: "joinRoom",
            connectionId: null,
            userId,
            roomId: currentRoom,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      console.log("WS RECEIVED:", event.data); // Log mọi message nhận được từ backend
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        msg = { system: true, message: event.data };
      }
      // Xử lý theo từng type message khác nhau
      if (!msg || !msg.type) {
        console.log("WS IGNORE: Invalid message format", msg);
        return;
      }
      switch (msg.type) {
        case "receiveMessage":
          if (
            msg.data &&
            typeof msg.data.user === "string" &&
            typeof msg.data.name === "string" &&
            typeof msg.data.message === "string" &&
            typeof msg.data.time === "string"
          ) {
            setMessages((prev) => {
              console.log("WS ADD: New message", msg.data);
              return [
                ...prev,
                {
                  ...msg.data,
                  system: false,
                },
              ];
            });
          } else {
            console.log("WS IGNORE: receiveMessage invalid format", msg);
          }
          break;
        case "joinRoomSuccess":
          // Hiển thị thông báo join room thành công cho user vừa join
          if (
            msg.data &&
            typeof msg.data.userId === "string" &&
            typeof msg.data.roomId === "string" &&
            typeof msg.data.time === "string"
          ) {
            setMessages((prev) => [
              ...prev,
              {
                system: true,
                message: `You have joined room: ${msg.data.roomId}`,
                time: msg.data.time,
              },
            ]);
          } else {
            console.log("WS IGNORE: joinRoomSuccess invalid format", msg);
          }
          break;
        case "system":
          // Ví dụ: backend gửi thông báo system
          if (msg.data && typeof msg.data.message === "string") {
            setMessages((prev) => [
              ...prev,
              { system: true, message: msg.data.message },
            ]);
          } else {
            console.log("WS IGNORE: system message invalid format", msg);
          }
          break;
        case "userJoined":
          // Ví dụ: backend gửi thông báo user vào phòng
          if (msg.data && typeof msg.data.name === "string") {
            setMessages((prev) => [
              ...prev,
              { system: true, message: `${msg.data.name} joined the room` },
            ]);
          } else {
            console.log("WS IGNORE: userJoined invalid format", msg);
          }
          break;
        case "userLeft":
          // Ví dụ: backend gửi thông báo user rời phòng
          if (msg.data && typeof msg.data.name === "string") {
            setMessages((prev) => [
              ...prev,
              { system: true, message: `${msg.data.name} left the room` },
            ]);
          } else {
            console.log("WS IGNORE: userLeft invalid format", msg);
          }
          break;
        default:
          // Bỏ qua các type không hỗ trợ
          console.log("WS IGNORE: Unknown type", msg);
      }
    };

    ws.onclose = (event) => {
      console.log("WS CLOSE:", event);
      setMessages((prev) => [
        ...prev,
        { system: true, message: "Disconnected from AWS WebSocket" },
      ]);
    };

    ws.onerror = (err) => {
      console.error("WS ERROR:", err);
      setMessages((prev) => [
        ...prev,
        { system: true, message: "WebSocket error" },
      ]);
    };

    return () => {
      if (ws) {
        try {
          ws.close();
        } catch {}
        ws = null;
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
      // Không gửi REST API lưu DB nữa, chỉ gửi qua WebSocket AWS
      if (ws && ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            action: "sendMessage",
            roomId: currentRoom,
            userId,
            name,
            text: messageStr,
          })
        );
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
