import React, { useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import LoginForm from "./components/LoginForm";
import RoomSelect from "./components/RoomSelect";
import ChatRoom from "./components/ChatRoom";
import UserInfo from "./components/UserInfo";
export default function ChatAppRoutes({
  chat,
  handleLogin,
  handleJoinRoom,
  handleCreateRoom,
  handleSend,
  sendMessage,
  fetchRooms,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    name,
    setName,
    password,
    setPassword,
    userIdSet,
    userId,
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    input,
    setInput,
    newRoom,
    setNewRoom,
    inRoom,
  } = chat;

  const onNewRoomChange = setNewRoom
    ? (e) => setNewRoom(e.target.value)
    : undefined;
  const handleCreateRoomFinal =
    typeof handleCreateRoom === "function" ? handleCreateRoom : undefined;
  // Hàm rời phòng: setInRoom(false) và điều hướng về /rooms
  const onLeaveRoom = () => {
    if (chat.setInRoom) chat.setInRoom(false);
    navigate("/rooms", { replace: true });
  };

  useEffect(() => {
    // Không redirect nếu đang ở /userinfo
    if (location.pathname === "/userinfo") return;
    if (userIdSet && !inRoom) {
      navigate("/rooms", { replace: true });
    } else if (userIdSet && inRoom && currentRoom) {
      navigate(`/chat/${currentRoom}`, { replace: true });
    } else if (!userIdSet) {
      navigate("/login", { replace: true });
    }
  }, [userIdSet, inRoom, currentRoom, navigate, location.pathname]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginForm
            name={name}
            password={password}
            onNameChange={(e) => setName(e.target.value)}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onSubmit={handleLogin}
          />
        }
      />
      <Route
        path="/rooms"
        element={
          userIdSet ? (
            <RoomSelect
              rooms={rooms}
              currentRoom={currentRoom}
              onRoomChange={(e) => setCurrentRoom(e.target.value)}
              onJoinRoom={handleJoinRoom}
              newRoom={newRoom}
              onNewRoomChange={onNewRoomChange}
              onCreateRoom={handleCreateRoomFinal}
              onBackToLogin={() => {
                if (typeof chat.setCurrentRoom === "function")
                  chat.setCurrentRoom("");
                if (typeof chat.setUserIdSet === "function")
                  chat.setUserIdSet(false);
                if (typeof chat.setToken === "function") chat.setToken(null);
                if (typeof chat.setUserId === "function") chat.setUserId(null);
                if (typeof chat.setName === "function") chat.setName("");
                if (typeof chat.setPassword === "function")
                  chat.setPassword("");
                if (typeof chat.setJoinedRoom === "function")
                  chat.setJoinedRoom("");
                navigate("/login", { replace: true });
              }}
              setJoinedRoom={chat.setJoinedRoom}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/userinfo" element={<UserInfo userId={userId} />} />
      <Route
        path="/chat/:roomId"
        element={
          userIdSet && inRoom && currentRoom ? (
            <ChatRoom
              name={name}
              rooms={rooms}
              currentRoom={currentRoom}
              newRoom={newRoom}
              onNewRoomChange={onNewRoomChange}
              onCreateRoom={handleCreateRoomFinal}
              messages={messages}
              input={input}
              onInputChange={
                setInput ? (e) => setInput(e.target.value) : undefined
              }
              onSend={handleSend}
              onLeaveRoom={onLeaveRoom}
              setJoinedRoom={chat.setJoinedRoom}
            />
          ) : (
            <Navigate to={userIdSet ? "/rooms" : "/login"} replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
