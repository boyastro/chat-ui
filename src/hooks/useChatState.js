import { useState, useRef } from "react";

export function useChatState() {
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
  const [joinedRoom, setJoinedRoom] = useState("");
  const messagesEndRef = useRef(null);

  return {
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
    messagesEndRef,
  };
}
