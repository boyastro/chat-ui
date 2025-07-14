import React from "react";

export default function RoomSelect({
  rooms,
  currentRoom,
  onRoomChange,
  onJoinRoom,
  newRoom,
  onNewRoomChange,
  onCreateRoom,
  onBackToLogin,
}) {
  return (
    <div className="max-w-lg mx-auto my-16 bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-2xl text-blue-600 tracking-wide">
          💬 Chat Room
        </h2>
        <button
          className="bg-red-500 text-white rounded-md px-4 py-2 font-semibold text-base shadow-md hover:bg-red-600 transition"
          onClick={onBackToLogin}
        >
          Quay lại đăng nhập
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select
          value={currentRoom}
          onChange={onRoomChange}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">-- Chọn phòng --</option>
          {rooms.map((room) => (
            <option
              key={room.id || room._id || room.name}
              value={room.id || room._id || room.name}
            >
              {room.name || room.id || room._id}
            </option>
          ))}
        </select>
        <button
          onClick={onJoinRoom}
          className="bg-blue-600 text-white rounded-md px-6 py-2 font-semibold text-base shadow-md hover:bg-blue-700 transition"
        >
          Vào phòng
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={newRoom}
          onChange={onNewRoomChange}
          placeholder="Tên phòng mới"
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-green-300"
        />
        <button
          onClick={onCreateRoom}
          className="bg-green-600 text-white rounded-md px-6 py-2 font-semibold text-base shadow-md hover:bg-green-700 transition"
        >
          Tạo phòng
        </button>
      </div>
    </div>
  );
}
