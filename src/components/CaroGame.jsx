import { useState, useRef, useCallback, useEffect } from "react";
import { useCaroSocket } from "../hooks/useCaroSocket.js";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function CaroGame(props) {
  const { userId } = props;
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!userId) throw new Error("Không tìm thấy userId");
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/users/${userId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (!res.ok) throw new Error("Không thể lấy thông tin người dùng");
        const data = await res.json();
        setUserInfo(data.user || data);
      } catch (err) {
        setError(err.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [mySymbol, setMySymbol] = useState("");
  const [gameStatus, setGameStatus] = useState("");
  const [showNoOpponentFound, setShowNoOpponentFound] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [winnerId, setWinnerId] = useState("");
  const myConnectionId = useRef("");

  // Callback khi nhận gameStarted từ server
  const handleGameStarted = useCallback((data) => {
    console.log("[CaroGame] gameStarted data:", data);
    setRoom(data);
    setGameStatus("playing");
    // Lưu connectionId của chính mình nếu server trả về
    if (data && data.myConnectionId) {
      myConnectionId.current = data.myConnectionId;
    } else if (data && data.connectionId) {
      // fallback nếu backend chỉ trả về connectionId
      myConnectionId.current = data.connectionId;
    }
    console.log("[CaroGame] myConnectionId.current:", myConnectionId.current);
    // Xác định mình là X hay O dựa vào players[*].connectionId
    if (
      data &&
      data.players &&
      data.players.length > 0 &&
      myConnectionId.current
    ) {
      console.log("[CaroGame] players:", data.players);
      if (myConnectionId.current === data.players[0].connectionId) {
        console.log("[CaroGame] Bạn là X");
        setMySymbol("X");
      } else if (myConnectionId.current === data.players[1].connectionId) {
        console.log("[CaroGame] Bạn là O");
        setMySymbol("O");
      } else {
        setMySymbol("");
      }
    } else {
      setMySymbol("");
    }
  }, []);

  const handleMove = useCallback((data) => {
    setRoom((prev) => ({
      ...prev,
      ...data,
      turn: data.nextTurn || data.turn || prev.turn,
    }));
    setGameStatus(data.status);
    if (data.status === "win" && data.winner) {
      setWinnerId(data.winner);
    }
  }, []);

  // Callback khi nhận gameOver
  const handleGameOver = useCallback((data) => {
    setGameStatus(data.status);
  }, []);

  // Sử dụng custom hook mới
  const { sendMessage, connected } = useCaroSocket({
    enabled,
    userId,
    onGameStarted: handleGameStarted,
    onMove: handleMove,
    onGameOver: handleGameOver,
    onNoOpponentFound: () => {
      setShowNoOpponentFound(true);
      setEnabled(false); // Ngừng tự động reconnect
    },
    onUserLeft: (data) => {
      setRoom((prev) => ({ ...prev, ...data }));
      setGameStatus("win");
      if (data && data.players && data.players.length === 1) {
        setWinnerId(data.players[0].connectionId);
      } else {
        setWinnerId("");
      }
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
  if (loading) {
    return (
      <div className="text-center mt-8">Đang tải thông tin người dùng...</div>
    );
  }
  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }
  if (!room) {
    return <div className="text-center mt-8">Đang ghép phòng...</div>;
  }

  const { board, turn, players } = room;
  let winner = null;
  if (gameStatus === "win") {
    // Luôn xác định người thắng theo winnerId (connectionId) từ backend
    if (winnerId) {
      winner = winnerId === myConnectionId.current ? "Bạn" : "Đối thủ";
    }
  }

  return (
    <div className="flex flex-col items-center my-8">
      <h2 className="text-2xl font-bold mb-4">Caro Online</h2>
      <div className="mb-2 text-gray-700 text-sm flex items-center gap-3">
        {userInfo && userInfo.avatar ? (
          <img
            src={userInfo.avatar}
            alt="avatar"
            className="w-10 h-10 rounded-full border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 border">
            <span className="text-lg">?</span>
          </div>
        )}
        <div>
          <div>
            <span className="font-semibold">Tên:</span>{" "}
            {userInfo?.name || "(Chưa xác định)"}
          </div>
          <div>
            <span className="font-semibold">Level:</span>{" "}
            {userInfo?.level ?? "-"}
          </div>
          <div>
            <span className="font-semibold">Score:</span>{" "}
            {userInfo?.score ?? "-"}
          </div>
        </div>
      </div>
      <div className="mb-2 text-lg">
        {gameStatus === "win"
          ? `Người thắng: ${winner}`
          : gameStatus === "draw"
          ? "Hòa!"
          : (() => {
              if (!players || players.length < 2) return null;
              const isXTurn = turn === players[0].connectionId;
              const currentTurnConn = isXTurn ? players[0].connectionId : players[1].connectionId;
              const who = currentTurnConn === myConnectionId.current ? "Bạn" : "Đối thủ";
              return `Lượt: ${isXTurn ? "X" : "O"} (${who})`;
            })()}
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
          className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 mr-2"
          onClick={leaveRoom}
        >
          Rời phòng
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600"
          onClick={() => navigate("/rooms")}
        >
          Thoát Game
        </button>
      </div>
    </div>
  );
}
