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
import CaroGame from "./components/CaroGame";
import Leaderboard from "./components/Leaderboard";
import Shop from "./components/Shop";
import LuckyWheel from "./components/LuckyWheel";
import CoinShop from "./components/CoinShop";
import MillionaireGame from "./components/MillionaireGame";
import ChatAI from "./components/ChatAI";
import WordPuzzleGame from "./components/WordPuzzleGame";
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
    // Không redirect nếu đang ở /userinfo, /caro, /leaderboard, /shop hoặc /luckywheel
    if (
      [
        "/userinfo",
        "/caro",
        "/leaderboard",
        "/shop",
        "/luckywheel",
        "/coinshop",
        "/millionaire",
        "/chatai",
        "/wordpuzzle",
      ].includes(location.pathname)
    )
      return;
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
              fetchRooms={fetchRooms}
              userId={userId}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/userinfo" element={<UserInfo userId={userId} />} />
      <Route path="/caro" element={<CaroGame userId={userId} />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/shop" element={<Shop userId={userId} />} />
      <Route path="/coinshop" element={<CoinShop userId={userId} />} />
      <Route path="/luckywheel" element={<LuckyWheel userId={userId} />} />
      <Route
        path="/millionaire"
        element={<MillionaireGame userId={userId} />}
      />
      <Route path="/chatai" element={<ChatAI userId={userId} />} />
      <Route path="/wordpuzzle" element={<WordPuzzleGame />} />
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
              userId={userId}
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
