import { useState, useRef, useCallback } from "react";
import { useCaroSocket } from "../hooks/useCaroSocket.js";

export default function CaroGame() {
  const [room, setRoom] = useState(null);
  const [mySymbol, setMySymbol] = useState("");
  const [gameStatus, setGameStatus] = useState("");
  const [showNoOpponentFound, setShowNoOpponentFound] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const myConnectionId = useRef("");

  // Callback khi nhận gameStarted từ server
  const handleGameStarted = useCallback((data) => {
    setRoom(data);
    setGameStatus("playing");
    // Lưu connectionId của chính mình nếu server trả về
    if (data && data.myConnectionId) {
      myConnectionId.current = data.myConnectionId;
    } else if (data && data.connectionId) {
      // fallback nếu backend chỉ trả về connectionId
      myConnectionId.current = data.connectionId;
    }
    // Xác định mình là X hay O
    if (
      data &&
      data.players &&
      data.players.length > 0 &&
      myConnectionId.current
    ) {
      setMySymbol(data.players[0] === myConnectionId.current ? "X" : "O");
    } else {
      setMySymbol("");
    }
  }, []);

  // Callback khi nhận move
  const handleMove = useCallback((data) => {
    setRoom((prev) => ({
      ...prev,
      ...data,
      turn: data.nextTurn || data.turn || prev.turn, // Ưu tiên nextTurn
    }));
    setGameStatus(data.status);
  }, []);

  // Callback khi nhận gameOver
  const handleGameOver = useCallback((data) => {
    setGameStatus(data.status);
  }, []);

  // Sử dụng custom hook mới
  const { sendMessage, connected } = useCaroSocket({
    enabled,
    onGameStarted: handleGameStarted,
    onMove: handleMove,
    onGameOver: handleGameOver,
    onNoOpponentFound: () => {
      setShowNoOpponentFound(true);
      setEnabled(false); // Ngừng tự động reconnect
    },
  });

  // Gửi nước đi
  const makeMove = (x, y) => {
    if (!room || !connected) return;
    sendMessage({
      action: "makeMove",
      data: { roomId: room.roomId, x, y },
    });
  };

  // Rời phòng
  const leaveRoom = () => {
    if (!room || !connected) return;
    sendMessage({
      action: "leaveRoom",
      data: { roomId: room.roomId },
    });
    setRoom(null);
    setGameStatus("");
    setMySymbol("");
  };

  if (showNoOpponentFound) {
    return (
      <div className="flex flex-col items-center mt-8">
        <div className="mb-4 text-red-600 font-semibold">
          Không tìm thấy đối thủ. Vui lòng thử lại.
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          onClick={() => {
            setShowNoOpponentFound(false);
            setRoom(null);
            setGameStatus("");
            setMySymbol("");
            setEnabled(true);
          }}
        >
          Thử lại ghép phòng
        </button>
      </div>
    );
  }
  if (!room) {
    return <div className="text-center mt-8">Đang ghép phòng...</div>;
  }

  const { board, turn, players } = room;
  let winner = null;
  if (gameStatus === "win") {
    winner = turn === players[0] ? "O" : "X";
  }

  return (
    <div className="flex flex-col items-center my-8">
      <h2 className="text-2xl font-bold mb-4">Caro Online</h2>
      <div className="mb-2 text-lg">
        {gameStatus === "win"
          ? `Người thắng: ${winner}`
          : gameStatus === "draw"
          ? "Hòa!"
          : `Lượt: ${turn === players[0] ? "X" : "O"} (${
              turn === players[0] ? "Người 1" : "Người 2"
            })`}
      </div>
      <div className="inline-block border-2 border-gray-400 bg-white">
        {board.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <button
                key={j}
                className="w-8 h-8 border border-gray-300 text-lg font-bold focus:outline-none hover:bg-blue-100 transition"
                onClick={() => makeMove(j, i)}
                style={{ width: 32, height: 32 }}
                disabled={
                  !!cell ||
                  gameStatus !== "playing" ||
                  turn !== myConnectionId.current
                }
              >
                {cell}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <span className="mr-4">
          Bạn là: <b>{mySymbol}</b>
        </span>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
          onClick={leaveRoom}
        >
          Rời phòng
        </button>
      </div>
    </div>
  );
}
