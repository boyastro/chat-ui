import React, { useEffect, useCallback } from "react";
import "./ChatApp.css";
import { useAwsChatSocket } from "./hooks/useAwsChatSocket";
import { useChatState } from "./hooks/useChatState";
import { useChatHandlers } from "./hooks/useChatHandlers";
import { useFetchRooms } from "./hooks/useFetchRooms";
// import { API_URL } from "./config"; // Commented out unused API_URL
import LoginForm from "./components/LoginForm";
import RoomSelect from "./components/RoomSelect";
import ChatRoom from "./components/ChatRoom";

export default function ChatApp() {
  const chat = useChatState(); // No change needed here
  const {
    name,
    setName,
    password,
    setPassword,
    userIdSet,
    setUserIdSet,
    rooms,
    setRooms,
    currentRoom,
    setCurrentRoom,
    messages,
    setMessages,
    input,
    setInput,
    newRoom,
    setNewRoom,
    token,
    setToken,
    userId,
    setUserId,
    inRoom,
    setInRoom,
    joinedRoom,
    setJoinedRoom,
    // messagesEndRef, // Commented out unused messagesEndRef
  } = chat;

  useEffect(() => {
    // Retrieve token from localStorage when loading the app
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, [setToken]);

  // Định nghĩa callback cố định để tránh socket bị reconnect liên tục
  const handleSocketMessage = useCallback(
    (msg) => setMessages((prev) => [...prev, msg]),
    [setMessages]
  );
  const handleSocketSystem = useCallback(
    (msg) => setMessages((prev) => [...prev, msg]),
    [setMessages]
  );
  const handleSocketOpen = useCallback(
    () =>
      setMessages((prev) => [
        ...prev,
        { system: true, message: "Connected to AWS WebSocket" },
      ]),
    [setMessages]
  );
  const handleSocketClose = useCallback(
    () =>
      setMessages((prev) => [
        ...prev,
        { system: true, message: "Disconnected from AWS WebSocket" },
      ]),
    [setMessages]
  );
  const handleSocketError = useCallback(
    () =>
      setMessages((prev) => [
        ...prev,
        { system: true, message: "WebSocket error" },
      ]),
    [setMessages]
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

  const fetchRooms = useFetchRooms(token, setRooms);

  useEffect(() => {
    if (userIdSet) {
      fetchRooms();
    }
  }, [userIdSet, fetchRooms]);

  useEffect(() => {
    // chat.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Commented out scroll logic
  }, [messages, chat.messagesEndRef]);

  // Handlers tách riêng
  const { handleLogin, handleJoinRoom, handleCreateRoom } = useChatHandlers({
    name,
    password,
    setToken,
    setUserId,
    setUserIdSet,
    setMessages,
    setInRoom,
    setJoinedRoom,
    setRooms,
    setNewRoom,
    token,
    userIdSet,
    userId,
    currentRoom,
    joinedRoom,
    fetchRooms,
  });

  const handleSend = useCallback(
    async (e) => {
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
    },
    [input, currentRoom, userIdSet, sendMessage, setInput, userId, name]
  );

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
