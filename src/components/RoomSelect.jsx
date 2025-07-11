import React from "react";

export default function RoomSelect({
  rooms,
  currentRoom,
  onRoomChange,
  onJoinRoom,
  newRoom,
  onNewRoomChange,
  onCreateRoom,
}) {
  return (
    <div className="chat-app-container">
      <h2 className="chat-app-title">💬 Chat Room</h2>
      <div className="chat-app-room-row">
        <select
          value={currentRoom}
          onChange={onRoomChange}
          className="chat-app-input"
        >
          <option value="">-- Select room --</option>
          {rooms.map((room) => (
            <option
              key={room.id || room._id || room.name}
              value={room.id || room._id || room.name}
            >
              {room.name || room.id || room._id}
            </option>
          ))}
        </select>
        <button onClick={onJoinRoom} className="chat-app-btn chat-app-btn-join">
          Join room
        </button>
      </div>
      <div className="chat-app-room-row">
        <input
          value={newRoom}
          onChange={onNewRoomChange}
          placeholder="New room name"
          className="chat-app-input"
        />
        <button
          onClick={onCreateRoom}
          className="chat-app-btn chat-app-btn-create"
        >
          Create room
        </button>
      </div>
    </div>
  );
}
