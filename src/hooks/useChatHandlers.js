import { useCallback } from "react";
import { API_URL } from "../config";

export function useChatHandlers({
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
  newRoom,
}) {
  // Đăng nhập
  const handleLogin = useCallback(
    async (e) => {
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
        const uid = data.userId || data.id || data._id || data.uid;
        if (uid) setUserId(uid);
        else {
          try {
            const payload = JSON.parse(atob(data.token.split(".")[1]));
            if (payload.userId || payload.id || payload._id || payload.uid) {
              setUserId(
                payload.userId || payload.id || payload._id || payload.uid
              );
            }
          } catch (e) {}
        }
        setUserIdSet(true);
      } catch (err) {
        alert("Invalid username or password or server error");
      }
    },
    [name, password, setToken, setUserId, setUserIdSet]
  );

  // Join room
  const handleJoinRoom = useCallback(async () => {
    if (!userIdSet || !currentRoom) return;
    if (joinedRoom === currentRoom) return;
    try {
      setJoinedRoom(currentRoom);
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
  }, [
    userIdSet,
    currentRoom,
    joinedRoom,
    token,
    setJoinedRoom,
    setMessages,
    setInRoom,
  ]);

  // Tạo phòng mới
  const handleCreateRoom = useCallback(async () => {
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
  }, [newRoom, token, setNewRoom, fetchRooms]);

  return { handleLogin, handleJoinRoom, handleCreateRoom };
}
