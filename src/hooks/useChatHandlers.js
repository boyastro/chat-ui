import { useCallback } from "react";
import { API_URL } from "../config";

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
  const handleCreateRoom = useCallback(
    async (e) => {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      const safeRoom = typeof newRoom === "string" ? newRoom : "";
      // eslint-disable-next-line no-console
      console.log(
        "[handleCreateRoom] newRoom:",
        newRoom,
        "safeRoom:",
        safeRoom,
        "token:",
        token
      );
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
        // eslint-disable-next-line no-console
        console.log("[handleCreateRoom] response status:", res.status);
        if (!res.ok) {
          let errMsg = "Failed to create room";
          try {
            const errData = await res.json();
            // eslint-disable-next-line no-console
            console.log("[handleCreateRoom] error data:", errData);
            if (errData && errData.message) errMsg = errData.message;
          } catch (parseErr) {
            // eslint-disable-next-line no-console
            console.log(
              "[handleCreateRoom] error parsing error data:",
              parseErr
            );
          }
          alert("Tạo phòng thất bại: " + errMsg);
          return;
        }
        // Log response body khi tạo phòng thành công
        try {
          const createdRoom = await res.json();
          // eslint-disable-next-line no-console
          console.log("[handleCreateRoom] created room:", createdRoom);
        } catch (parseOkErr) {
          // eslint-disable-next-line no-console
          console.log(
            "[handleCreateRoom] error parsing created room:",
            parseOkErr
          );
        }
        setNewRoom("");
        fetchRooms();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log("[handleCreateRoom] catch error:", err);
        alert("Lỗi tạo phòng: " + (err?.message || err));
      }
    },
    [newRoom, token, setNewRoom, fetchRooms, userId]
  );

  return { handleLogin, handleJoinRoom, handleCreateRoom };
}
