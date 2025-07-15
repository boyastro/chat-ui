import { useCallback } from "react";

export function useChatHandlers(props) {
  const {
    name,
    password,
    setToken,
    setUserId,
    setUserIdSet,
    setMessages,
    setInRoom,
    setJoinedRoom,
    setNewRoom,
    token,
    userIdSet,
    userId,
    currentRoom,
    joinedRoom,
    fetchRooms,
    newRoom = "",
  } = props;
  // Đăng nhập
  const API_URL = process.env.REACT_APP_API_URL;
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
    [name, password, setToken, setUserId, setUserIdSet, API_URL]
  );

  // Join room
  // handleJoinRoom nhận roomId, ưu tiên join đúng id phòng vừa tạo
  const handleJoinRoom = useCallback(
    async (roomId) => {
      const joinId = roomId || currentRoom;
      if (!userIdSet || !joinId) return;
      if (joinedRoom === joinId) return;
      try {
        setJoinedRoom(joinId);
        const authToken = token || localStorage.getItem("token");
        const roomInfoRes = await fetch(`${API_URL}/rooms/${joinId}`, {
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
                { system: true, message: `Joined room: ${joinId}` },
              ]
            : [{ system: true, message: `Joined room: ${joinId}` }]
        );
        setInRoom(true);
      } catch (err) {
        alert("Failed to join room");
      }
    },
    [
      userIdSet,
      currentRoom,
      joinedRoom,
      token,
      setJoinedRoom,
      setMessages,
      setInRoom,
      API_URL,
    ]
  );

  // Tạo phòng mới
  // handleCreateRoom trả về id phòng vừa tạo nếu có
  const handleCreateRoom = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      const safeRoom = typeof newRoom === "string" ? newRoom : "";
      if (!safeRoom.trim()) return;
      try {
        const res = await fetch(`${API_URL}/rooms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name: safeRoom, hostId: userId }),
        });
        if (!res.ok) {
          let errMsg = "Failed to create room";
          try {
            const errData = await res.json();
            if (errData && errData.message) errMsg = errData.message;
          } catch (parseErr) {}
          alert("Tạo phòng thất bại: " + errMsg);
          return null;
        }
        let createdRoom = null;
        try {
          createdRoom = await res.json();
        } catch (parseOkErr) {}
        setNewRoom("");
        fetchRooms();
        // Ưu tiên trả về id hoặc _id hoặc name phòng vừa tạo
        return (
          createdRoom?.id || createdRoom?._id || createdRoom?.name || safeRoom
        );
      } catch (err) {
        alert("Lỗi tạo phòng: " + (err?.message || err));
        return null;
      }
    },
    [newRoom, token, setNewRoom, fetchRooms, userId, API_URL]
  );

  return { handleLogin, handleJoinRoom, handleCreateRoom };
}
