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
    <div className="max-w-lg mx-auto my-16 bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-2xl text-blue-600 tracking-wide">
          💬 Chat Room
        </h2>
        <div className="flex gap-2">
          <button
            className="bg-yellow-500 text-white rounded-md px-4 py-2 font-semibold text-base shadow-md hover:bg-yellow-600 transition"
            onClick={() => navigate("/caro")}
          >
            Chơi game Caro
          </button>
          <button
            className="bg-blue-500 text-white rounded-md px-4 py-2 font-semibold text-base shadow-md hover:bg-blue-600 transition"
            onClick={() => {
              if (userId) {
                alert("Không tìm thấy userId. Vui lòng đăng nhập lại.");
                return;
              }
              navigate("/userinfo");
            }}
          >
            Xem user info
          </button>
          <button
            className="bg-red-500 text-white rounded-md px-4 py-2 font-semibold text-base shadow-md hover:bg-red-600 transition"
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
            Quay lại đăng nhập
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          value={newRoom || ""}
          onChange={onNewRoomChange}
          placeholder="Tên phòng mới"
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-base bg-gray-50 outline-none focus:ring-2 focus:ring-green-300"
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
          className="bg-green-600 text-white rounded-md px-6 py-2 font-semibold text-base shadow-md hover:bg-green-700 transition disabled:opacity-60"
          disabled={!newRoom || !String(newRoom).trim()}
        >
          Tạo phòng
        </button>
      </div>
      <div className="mb-4">
        <div className="font-semibold text-gray-700 mb-2">Danh sách phòng:</div>
        <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200">
          {rooms.length === 0 && (
            <li className="p-4 text-gray-400 text-center">
              Chưa có phòng nào.
            </li>
          )}
          {rooms.map((room) => (
            <li
              key={room.id || room._id || room.name}
              className="flex items-center justify-between p-3 hover:bg-blue-50 transition"
            >
              <div>
                <div className="font-bold text-blue-700 text-base">
                  {room.name || room.id || room._id}
                </div>
                <div className="text-sm text-gray-500">
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
                className="bg-blue-600 text-white rounded-md px-4 py-2 font-semibold text-sm shadow hover:bg-blue-700 transition"
              >
                {joiningRoom === (room.id || room._id || room.name)
                  ? "Đang vào..."
                  : "Vào phòng"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
