// src/hooks/useAwsChatSocket.js
import { useEffect, useRef } from "react";
import { AwsChatSocket } from "../utils/awsSocket";

export function useAwsChatSocket({
  enabled,
  userId,
  roomId,
  onMessage,
  onSystem,
  onOpen,
  onClose,
  onError,
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled || !userId || !roomId) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    socketRef.current = new AwsChatSocket({
      url: "wss://zl058iu5n2.execute-api.ap-southeast-1.amazonaws.com/prod",
      userId,
      roomId,
      onMessage,
      onSystem,
      onOpen,
      onClose,
      onError,
    });
    socketRef.current.connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, userId, roomId, onMessage, onSystem, onOpen, onClose, onError]);

  // Hàm gửi message
  const sendMessage = (payload) => {
    if (socketRef.current) {
      return socketRef.current.send(payload);
    }
    return false;
  };

  return { sendMessage };
}
