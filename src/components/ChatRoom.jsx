import React, { useRef, useEffect } from "react";

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
}) {
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.system
                ? "italic text-gray-500 my-2"
                : msg.user === name || msg.name === name
                ? "flex items-center my-2 text-right justify-end"
                : "flex items-center my-2"
            }
          >
            {msg.system ? (
              msg.message
            ) : (
              <>
                <span
                  className={
                    "font-semibold mr-2 " +
                    (msg.user === name || msg.name === name
                      ? "text-blue-600"
                      : "text-gray-800")
                  }
                >
                  {msg.user === name || msg.name === name
                    ? "You"
                    : msg.name || msg.user}
                  :
                </span>
                <span>{msg.message}</span>
              </>
            )}
          </div>
        ))}
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
