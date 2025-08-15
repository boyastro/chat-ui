import React, { useEffect, useCallback } from "react";
import "./ChatApp.css";
import { useAwsChatSocket } from "./hooks/useAwsChatSocket";
import { useChatState } from "./hooks/useChatState";
import { useChatHandlers } from "./hooks/useChatHandlers";
import { useFetchRooms } from "./hooks/useFetchRooms";
// import LoginForm from "./components/LoginForm";
// import RoomSelect from "./components/RoomSelect";
// import ChatRoom from "./components/ChatRoom";
import { BrowserRouter } from "react-router-dom";
import ChatAppRoutes from "./ChatAppRoutes";

export default function ChatApp() {
  const chat = useChatState();
  const {
    name,
    password,
    userIdSet,
    setUserIdSet,
    setRooms,
    currentRoom,
    messages,
    setMessages,
    input,
    setInput,
    setNewRoom,
    token,
    setToken,
    userId,
    setUserId,
    inRoom,
    setInRoom,
    joinedRoom,
    setJoinedRoom,
  } = chat;

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, [setToken]);

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
    // chat.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.messagesEndRef]);

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
    newRoom: chat.newRoom,
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

  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ChatAppRoutes
        chat={chat}
        handleLogin={handleLogin}
        handleJoinRoom={handleJoinRoom}
        handleCreateRoom={handleCreateRoom}
        handleSend={handleSend}
        sendMessage={sendMessage}
        fetchRooms={fetchRooms}
      />
    </BrowserRouter>
  );
}
