import { useEffect, useRef, useState } from "react";

const WS_URL = "wss://ukgw0jnnkj.execute-api.ap-southeast-1.amazonaws.com/prod";

export function useCaroSocket({
  enabled = true,
  onGameStarted,
  onMove,
  onGameOver,
  onOpen,
  onClose,
  onError,
} = {}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      onOpen && onOpen();
      const joinMsg = JSON.stringify({ action: "joinRoom" });
      console.log("[CaroSocket] ws.send:", joinMsg);
      ws.send(joinMsg);
    };

    ws.onmessage = (event) => {
      console.log("[CaroSocket] Message received:", event.data);
      if (!event.data) return;
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        console.warn("[CaroSocket] Received non-JSON message:", event.data);
        return;
      }
      if (msg.type === "gameStarted") {
        onGameStarted && onGameStarted(msg.data);
      }
      if (msg.type === "move") {
        onMove && onMove(msg.data);
      }
      if (msg.type === "gameOver") {
        onGameOver && onGameOver(msg.data);
      }
    };

    ws.onerror = (err) => {
      console.error("[CaroSocket] WebSocket error:", err);
      onError && onError(err);
    };
    ws.onclose = () => {
      setConnected(false);
      onClose && onClose();
    };
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onGameStarted, onMove, onGameOver, onOpen, onClose, onError]);

  // Hàm gửi message chung
  const sendMessage = (payload) => {
    if (socketRef.current && connected) {
      const msg =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      console.log("[CaroSocket] ws.send:", msg);
      socketRef.current.send(msg);
      return true;
    }
    return false;
  };

  return { sendMessage, connected };
}
