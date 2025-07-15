import React, { useRef, useEffect, useState } from "react";

export default function ChatRoom({
  name,
  rooms,
  currentRoom,
  newRoom,
  onNewRoomChange,
  onCreateRoom,
  messages,
  input,
  onInputChange,
  onSend,
  onLeaveRoom,
  setJoinedRoom, // truyền prop này từ cha nếu có
  userId, // truyền prop này từ cha nếu có
}) {
  const [userInfoMap, setUserInfoMap] = useState({});
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user info/avatar cho tất cả userId xuất hiện trong messages
  useEffect(() => {
    if (!messages || !Array.isArray(messages)) return;
    // Ensure userId is always a string (handles cases where msg.user is an object)
    const userIds = Array.from(
      new Set(
        messages
          .filter((msg) => !msg.system && msg.user)
          .map((msg) => {
            if (typeof msg.user === "string" || typeof msg.user === "number") {
              return String(msg.user);
            } else if (
              msg.user &&
              typeof msg.user === "object" &&
              (msg.user.id || msg.user._id)
            ) {
              return String(msg.user.id || msg.user._id);
            } else {
              return String(msg.user);
            }
          })
      )
    );
    const missingIds = userIds.filter((id) => id && !userInfoMap[id]);
    if (missingIds.length === 0) return;
    const API_URL = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    Promise.all(
      missingIds.map((id) =>
        fetch(`${API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => ({ id, data }))
          .catch(() => ({ id, data: null }))
      )
    ).then((results) => {
      const newMap = { ...userInfoMap };
      results.forEach(({ id, data }) => {
        if (data && data.avatar) newMap[id] = data;
      });
      setUserInfoMap(newMap);
    });
    // eslint-disable-next-line
  }, [messages]);

  return (
    <div className="max-w-lg mx-auto my-10 bg-white rounded-2xl shadow-xl p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-2xl text-blue-600 tracking-wide m-0 inline-block">
            💬 Chat Room
          </h2>
          {currentRoom && (
            <span className="ml-3 text-lg font-semibold text-gray-700 align-middle bg-blue-100 px-3 py-1 rounded-md">
              {(() => {
                const roomObj = Array.isArray(rooms)
                  ? rooms.find(
                      (r) =>
                        r.id === currentRoom ||
                        r._id === currentRoom ||
                        r.name === currentRoom
                    )
                  : null;
                return (
                  roomObj?.name || roomObj?.id || roomObj?._id || currentRoom
                );
              })()}
            </span>
          )}
        </div>
        <button
          className="bg-red-500 text-white rounded-md px-5 py-2 font-semibold text-base shadow-md hover:bg-red-600 transition"
          onClick={() => {
            if (typeof setJoinedRoom === "function") {
              setJoinedRoom(""); // reset joinedRoom để join lại phòng cũ
            }
            if (typeof onLeaveRoom === "function") {
              onLeaveRoom();
            }
          }}
        >
          Rời phòng
        </button>
      </div>
      <div className="bg-gray-100 rounded-lg min-h-[320px] max-h-[400px] overflow-y-auto p-4 mb-5 shadow">
        {messages.map((msg, idx) => {
          // Normalize userId for lookup (must match the fetch logic)
          let msgUserId;
          if (typeof msg.user === "string" || typeof msg.user === "number") {
            msgUserId = String(msg.user);
          } else if (
            msg.user &&
            typeof msg.user === "object" &&
            (msg.user.id || msg.user._id)
          ) {
            msgUserId = String(msg.user.id || msg.user._id);
          } else {
            msgUserId = String(msg.user);
          }
          // Ensure userId is compared as string for accurate self/other detection
          let myUserId;
          if (typeof userId === "string" || typeof userId === "number") {
            myUserId = String(userId);
          } else if (
            userId &&
            typeof userId === "object" &&
            (userId.id || userId._id)
          ) {
            myUserId = String(userId.id || userId._id);
          } else {
            myUserId = "";
          }
          if (!myUserId) {
            console.warn(
              "[ChatRoom] userId is missing or undefined. Please check how userId is passed to ChatRoom."
            );
          }
          const isMe = msgUserId === myUserId;
          const userInfo = userInfoMap[msgUserId];
          // ...
          return (
            <div
              key={idx}
              className={
                msg.system
                  ? "italic text-gray-500 my-2"
                  : isMe
                  ? "flex items-center my-2 text-right justify-end"
                  : "flex items-center my-2"
              }
            >
              {msg.system ? (
                msg.message
              ) : (
                <>
                  {/* Avatar bên trái nếu không phải mình */}
                  {!isMe && userInfo && userInfo.avatar && (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name || msg.user}
                      className="w-8 h-8 rounded-full mr-2 border border-gray-300 bg-white object-cover"
                      style={{ minWidth: 32 }}
                    />
                  )}
                  <span
                    className={
                      "font-semibold mr-2 " +
                      (isMe ? "text-blue-600" : "text-gray-800")
                    }
                  >
                    {isMe ? "You" : msg.name ? msg.name : msg.user}:
                  </span>
                  <span>{msg.message}</span>
                  {/* Avatar bên phải nếu là mình */}
                  {isMe && userInfo && userInfo.avatar && (
                    <img
                      src={userInfo.avatar}
                      alt="You"
                      className="w-8 h-8 rounded-full ml-2 border border-gray-300 bg-white object-cover"
                      style={{ minWidth: 32 }}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form className="flex gap-2" onSubmit={onSend}>
        <input
          value={input}
          onChange={onInputChange}
          placeholder="Nhập tin nhắn..."
          disabled={!currentRoom}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          disabled={!currentRoom}
          className="bg-blue-600 text-white rounded-md px-6 font-semibold text-base shadow-md hover:bg-blue-700 transition disabled:opacity-60"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
