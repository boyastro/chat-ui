import React, { useEffect, useRef, useState, useCallback } from "react";
import "./ChatApp.css";
import { useAwsChatSocket } from "./hooks/useAwsChatSocket";
import LoginForm from "./components/LoginForm";
import RoomSelect from "./components/RoomSelect";
import ChatRoom from "./components/ChatRoom";

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

  // Định nghĩa callback cố định để tránh socket bị reconnect liên tục
  const handleSocketMessage = useCallback(
    (msg) => setMessages((prev) => [...prev, msg]),
    []
  );
  const handleSocketSystem = useCallback(
    (msg) => setMessages((prev) => [...prev, msg]),
    []
  );
  const handleSocketOpen = useCallback(
    () =>
      setMessages((prev) => [
        ...prev,
        { system: true, message: "Connected to AWS WebSocket" },
      ]),
    []
  );
  const handleSocketClose = useCallback(
    () =>
      setMessages((prev) => [
        ...prev,
        { system: true, message: "Disconnected from AWS WebSocket" },
      ]),
    []
  );
  const handleSocketError = useCallback(
    () =>
      setMessages((prev) => [
        ...prev,
        { system: true, message: "WebSocket error" },
      ]),
    []
  );

  const { sendMessage } = useAwsChatSocket({
    enabled: userIdSet && inRoom && !!currentRoom,
    userId,
    roomId: currentRoom,
    onMessage: handleSocketMessage,
    onSystem: handleSocketSystem,
    onOpen: handleSocketOpen,
    onClose: handleSocketClose,
    onError: handleSocketError,
  });

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
      sendMessage &&
        sendMessage({
          action: "sendMessage",
          roomId: currentRoom,
          userId,
          name,
          text: messageStr,
        });
      setInput("");
    } catch (err) {
      alert("Failed to send message");
    }
  };

  if (!userIdSet) {
    return (
      <LoginForm
        name={name}
        password={password}
        onNameChange={(e) => setName(e.target.value)}
        onPasswordChange={(e) => setPassword(e.target.value)}
        onSubmit={handleLogin}
      />
    );
  }

  if (!inRoom) {
    return (
      <RoomSelect
        rooms={rooms}
        currentRoom={currentRoom}
        onRoomChange={(e) => setCurrentRoom(e.target.value)}
        onJoinRoom={handleJoinRoom}
        newRoom={newRoom}
        onNewRoomChange={(e) => setNewRoom(e.target.value)}
        onCreateRoom={handleCreateRoom}
      />
    );
  }

  return (
    <ChatRoom
      name={name}
      rooms={rooms}
      currentRoom={currentRoom}
      onRoomChange={(e) => setCurrentRoom(e.target.value)}
      onJoinRoom={handleJoinRoom}
      newRoom={newRoom}
      onNewRoomChange={(e) => setNewRoom(e.target.value)}
      onCreateRoom={handleCreateRoom}
      messages={messages}
      input={input}
      onInputChange={(e) => setInput(e.target.value)}
      onSend={handleSend}
    />
  );
}
