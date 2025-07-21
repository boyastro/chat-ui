import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoomSelect({
  rooms,
  currentRoom,
  onRoomChange,
  onJoinRoom,
  newRoom,
  onNewRoomChange,
  onCreateRoom,
  onBackToLogin,
  setJoinedRoom, // truyền prop này từ cha nếu có
  userId, // nhận userId từ cha
}) {
  const [joiningRoom, setJoiningRoom] = useState("");
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto my-16 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 justify-center w-full sm:w-auto bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl shadow-sm">
          <span className="text-2xl text-blue-600">💬</span>
          <span className="font-bold text-2xl text-blue-600 tracking-wide">
            Chat Room
          </span>
        </div>
        <div className="grid grid-cols-4 xs:grid-cols-2 sm:flex sm:flex-wrap md:flex-nowrap gap-2 justify-center items-center w-full sm:w-auto">
          <button
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-lg px-2 py-1.5 font-semibold text-xs sm:text-sm shadow-md transition w-[40px] h-[40px] sm:h-10 border border-yellow-300"
            title="Chơi game Caro"
            onClick={() => navigate("/caro")}
          >
            <span className="text-base">🎮</span>
          </button>
          <button
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg px-2 py-1.5 font-semibold text-xs sm:text-sm shadow-md transition w-[40px] h-[40px] sm:h-10 sm:w-auto border border-blue-400"
            title="Xem user info"
            onClick={() => {
              if (userId) {
                alert("Không tìm thấy userId. Vui lòng đăng nhập lại.");
                return;
              }
              navigate("/userinfo");
            }}
          >
            <span className="text-base">👤</span>
            <span className="hidden sm:inline ml-1">User</span>
          </button>
          <button
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg px-2 py-1.5 font-semibold text-xs sm:text-sm shadow-md transition w-[40px] h-[40px] sm:h-10 sm:w-auto border border-purple-400 relative overflow-hidden"
            title="Bảng xếp hạng"
            onClick={() => navigate("/leaderboard")}
          >
            <span className="text-base relative z-10">🏆</span>
            <span className="hidden md:inline relative z-10 ml-1">BXH</span>
            <div className="absolute inset-0 bg-yellow-300 opacity-20"></div>
          </button>
          <button
            className="flex items-center justify-center gap-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg px-2 py-1.5 font-semibold text-xs sm:text-sm shadow-md transition w-[40px] h-[40px] sm:h-10 sm:w-auto border border-red-400"
            title="Quay lại đăng nhập"
            onClick={() => {
              if (typeof onRoomChange === "function") {
                onRoomChange({ target: { value: "" } }); // reset currentRoom
              }
              if (typeof setJoinedRoom === "function") {
                setJoinedRoom(""); // reset joinedRoom để join lại phòng cũ
              }
              if (typeof onBackToLogin === "function") {
                onBackToLogin();
              }
            }}
          >
            <span className="text-base">🔙</span>
            <span className="hidden sm:inline ml-1">Đăng nhập</span>
          </button>
        </div>
      </div>
      <div className="flex gap-3 mb-5">
        <input
          value={newRoom || ""}
          onChange={onNewRoomChange}
          placeholder="Tên phòng mới"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
        />
        <button
          onClick={async () => {
            if (!newRoom || !String(newRoom).trim()) return;
            // Gọi onCreateRoom và lấy id phòng trả về
            const createdRoomId = await Promise.resolve(onCreateRoom());
            if (!createdRoomId) return;
            setJoiningRoom(createdRoomId);
            if (typeof onRoomChange === "function") {
              await Promise.resolve(
                onRoomChange({ target: { value: createdRoomId } })
              );
            }
            await Promise.resolve(onJoinRoom(createdRoomId));
            setJoiningRoom("");
            if (typeof onNewRoomChange === "function") {
              onNewRoomChange({ target: { value: "" } });
            }
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg px-6 py-2 font-semibold text-base shadow-md hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-60 border border-green-400"
          disabled={!newRoom || !String(newRoom).trim()}
        >
          Tạo phòng
        </button>
      </div>
      <div className="mb-4">
        <div className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-base">📋</span>
          Danh sách phòng:
        </div>
        <ul className="divide-y divide-gray-200 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
          {rooms.length === 0 && (
            <li className="p-6 text-gray-400 text-center">
              Chưa có phòng nào.
            </li>
          )}
          {rooms.map((room) => (
            <li
              key={room.id || room._id || room.name}
              className="flex items-center justify-between p-4 hover:bg-blue-50 transition"
            >
              <div>
                <div className="font-bold text-blue-700 text-base flex items-center gap-2">
                  <span className="text-sm">🏠</span>
                  {room.name || room.id || room._id}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Chủ phòng:{" "}
                  <span className="font-medium text-gray-700">
                    {room.hostName ||
                      (room.host && room.host.name) ||
                      room.hostId ||
                      "Ẩn danh"}
                  </span>
                </div>
              </div>
              <button
                onClick={async () => {
                  const roomValue = room.id || room._id || room.name;
                  setJoiningRoom(roomValue);
                  // Đảm bảo cập nhật state cha trước khi join
                  if (typeof onRoomChange === "function") {
                    await Promise.resolve(
                      onRoomChange({ target: { value: roomValue } })
                    );
                  }
                  await Promise.resolve(onJoinRoom(roomValue));
                  setJoiningRoom("");
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg px-4 py-2 font-semibold text-sm shadow-md transition border border-blue-400 flex items-center gap-1"
              >
                <span>
                  {joiningRoom === (room.id || room._id || room.name)
                    ? "Đang vào..."
                    : "Vào phòng"}
                </span>
                {joiningRoom !== (room.id || room._id || room.name) && (
                  <span className="text-xs">➜</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
