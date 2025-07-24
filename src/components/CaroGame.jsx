import { useState, useRef, useCallback, useEffect } from "react";
import { useCaroSocket } from "../hooks/useCaroSocket.js";
import { useNavigate } from "react-router-dom";

function ResultModal({ open, result, onClose }) {
  if (!open) return null;
  let title = "";
  let color = "";
  if (result === "win") {
    title = "Bạn đã thắng!";
    color = "text-green-600";
  } else if (result === "lose") {
    title = "Bạn đã thua!";
    color = "text-red-600";
  } else if (result === "draw") {
    title = "Hai bên hòa nhau!";
    color = "text-gray-700";
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[300px] flex flex-col items-center">
        <div className={`text-2xl font-bold mb-4 ${color}`}>{title}</div>
        {result === "win" && (
          <div className="mb-2 text-green-700 text-base font-semibold">
            <span className="inline-block mr-2">🏆</span>Score +20, Coin +10
          </div>
        )}
        {result === "lose" && (
          <div className="mb-2 text-red-600 text-base font-semibold">
            <span className="inline-block mr-2">😢</span>Score -20
          </div>
        )}
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={async () => {
            if (typeof onClose === "function") onClose();
            // Sau khi đóng modal, chỉ cập nhật score (và level nếu muốn) của user và đối thủ
            try {
              const token = localStorage.getItem("token");
              const apiUrl = process.env.REACT_APP_API_URL;
              // Cập nhật score cho user
              if (window.updateUserScore)
                await window.updateUserScore(token, apiUrl);
              // Cập nhật score cho đối thủ
              if (window.updateOpponentScore)
                await window.updateOpponentScore(token, apiUrl);
            } catch {}
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function CaroGame(props) {
  const { userId } = props;
  const [userInfo, setUserInfo] = useState(null);
  const [opponentInfo, setOpponentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Khai báo các biến state và ref cần dùng trước các useEffect để tránh lỗi no-use-before-define
  const [room, setRoom] = useState(null);
  const myConnectionId = useRef("");
  const [mySymbol, setMySymbol] = useState("");
  const [gameStatus, setGameStatus] = useState("");
  const [showNoOpponentFound, setShowNoOpponentFound] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [winnerId, setWinnerId] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState(""); // "win" | "lose" | "draw"
  // Timer state
  const [moveTimer, setMoveTimer] = useState(30);
  const timerRef = useRef();

  // Khai báo các biến phụ thuộc room để tránh warning no-use-before-define
  const { board, turn, players } = room || {};

  // Reset timer when turn changes or game starts/ends
  useEffect(() => {
    if (
      gameStatus !== "playing" ||
      !room ||
      !room.players ||
      room.players.length < 2
    ) {
      setMoveTimer(30);
      clearInterval(timerRef.current);
      return;
    }
    if (turn === myConnectionId.current) {
      setMoveTimer(30);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setMoveTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto-pass turn if time runs out
            if (gameStatus === "playing" && turn === myConnectionId.current) {
              sendMessage({
                action: "passTurn",
                data: { roomId: room.roomId },
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setMoveTimer(30);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameStatus, room?.roomId]);

  // Clear timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);
  // Hàm chỉ cập nhật score (và level) cho user
  const updateUserScore = useCallback(
    async (token, apiUrl) => {
      try {
        if (!userId) return;
        const res = await fetch(
          `${apiUrl}/users/${userId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (!res.ok) return;
        const data = await res.json();
        setUserInfo((prev) => ({
          ...prev,
          score: (data.user || data).score,
          level: (data.user || data).level,
        }));
      } catch {}
    },
    [userId]
  );

  // Hàm fetch lại user info đầy đủ (giữ lại cho lần đầu load)
  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) throw new Error("Không tìm thấy userId");
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL;
      // Lấy thông tin user
      const res = await fetch(
        `${apiUrl}/users/${userId}`,
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
  }, [userId]);
  useEffect(() => {
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchUserInfo]);
  // Để gọi từ ResultModal
  useEffect(() => {
    window.updateUserInfo = fetchUserInfo;
    window.updateUserScore = updateUserScore;
    return () => {
      delete window.updateUserInfo;
      delete window.updateUserScore;
    };
  }, [userId, fetchUserInfo, updateUserScore]);

  // Lấy thông tin đối thủ khi đã có room và players
  // Hàm chỉ cập nhật score (và level) cho đối thủ
  const updateOpponentScore = useCallback(
    async (token, apiUrl) => {
      if (!room || !room.players || room.players.length < 2) return;
      const myConnId = myConnectionId.current;
      const opponent = room.players.find((p) => p.connectionId !== myConnId);
      if (!opponent || !opponent.userId) return;
      try {
        const res = await fetch(
          `${apiUrl}/users/${opponent.userId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (!res.ok) return;
        const data = await res.json();
        setOpponentInfo((prev) => ({
          ...prev,
          score: (data.user || data).score,
          level: (data.user || data).level,
        }));
      } catch {}
    },
    [room]
  );

  // Hàm fetch lại opponent info đầy đủ (giữ lại cho lần đầu load)
  const fetchOpponentInfo = useCallback(async () => {
    if (!room || !room.players || room.players.length < 2) {
      setOpponentInfo(null);
      return;
    }
    const myConnId = myConnectionId.current;
    const opponent = room.players.find((p) => p.connectionId !== myConnId);
    if (!opponent || !opponent.userId) {
      setOpponentInfo(null);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL;
      const res = await fetch(
        `${apiUrl}/users/${opponent.userId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (!res.ok) throw new Error("Không thể lấy thông tin đối thủ");
      const data = await res.json();
      setOpponentInfo(data.user || data);
    } catch (err) {
      setOpponentInfo(null);
    }
  }, [room]);
  useEffect(() => {
    fetchOpponentInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, fetchOpponentInfo]);
  // Để gọi từ ResultModal
  useEffect(() => {
    window.updateOpponentInfo = fetchOpponentInfo;
    window.updateOpponentScore = updateOpponentScore;
    return () => {
      delete window.updateOpponentInfo;
      delete window.updateOpponentScore;
    };
  }, [room, fetchOpponentInfo, updateOpponentScore]);

  const navigate = useNavigate();
  // ...các state này đã được khai báo phía trên để tránh warning no-use-before-define...

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
    setRoom((prev) => {
      // Nếu chỉ có nextTurn (passTurn), không thay đổi board, chỉ cập nhật turn và đảm bảo status là 'playing'
      if (data.nextTurn && !data.board && !data.status) {
        return {
          ...prev,
          turn: data.nextTurn,
          status: "playing",
        };
      }
      // Nếu là nước đi bình thường hoặc có board/status
      return {
        ...prev,
        ...data,
        turn: data.nextTurn || data.turn || prev.turn,
      };
    });
    // Nếu có status thì cập nhật trạng thái game
    if (data.status) {
      setGameStatus(data.status);
      if (data.status === "win" && data.winner) {
        setWinnerId(data.winner);
      }
      if (data.status === "win" || data.status === "draw") {
        // Xác định kết quả cho modal
        if (data.status === "draw") {
          setResultType("draw");
        } else if (data.winner === myConnectionId.current) {
          setResultType("win");
        } else {
          setResultType("lose");
        }
        setShowResultModal(true);
      }
    }
  }, []);

  // Callback khi nhận gameOver
  const handleGameOver = useCallback((data) => {
    setGameStatus(data.status);
    if (data.status === "win" || data.status === "draw") {
      if (data.status === "draw") {
        setResultType("draw");
      } else if (data.winner === myConnectionId.current) {
        setResultType("win");
      } else {
        setResultType("lose");
      }
      setShowResultModal(true);
    }
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

  // Đã khai báo phía trên để tránh redeclare
  let winner = null;
  if (gameStatus === "win") {
    // Luôn xác định người thắng theo winnerId (connectionId) từ backend
    if (winnerId) {
      winner = winnerId === myConnectionId.current ? "Bạn" : "Đối thủ";
    }
  }

  return (
    <div className="flex flex-col items-center my-8 px-2 max-w-3xl mx-auto">
      <ResultModal
        open={showResultModal}
        result={resultType}
        onClose={() => setShowResultModal(false)}
      />
      <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2 min-h-[40px] leading-tight">
        <span className="text-yellow-500 text-2xl">🎮</span> Caro Online
      </h2>
      <div className="w-full mb-2 flex flex-row gap-0 items-stretch border rounded-xl overflow-hidden shadow bg-white min-h-[40px]">
        {/* Bạn */}
        <div className="flex-1 flex flex-row items-center gap-1 p-1 bg-gradient-to-br from-blue-50 to-blue-200 border-r border-blue-100 min-w-0 min-h-[32px]">
          <div className="flex flex-col items-center min-w-[28px]">
            {userInfo && userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-blue-300 shadow"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-500 border border-blue-300 shadow">
                <span className="text-xs">👤</span>
              </div>
            )}
            <div className="mt-0.5 text-xs font-extrabold text-blue-600 drop-shadow leading-tight">
              {mySymbol || "?"}
            </div>
            <div className="mt-0.5 text-[10px] font-bold text-blue-700 leading-tight">
              Bạn
            </div>
          </div>
          <div className="flex-1 ml-1 min-w-0 flex flex-col flex-wrap gap-y-0.5">
            <div className="font-semibold text-blue-900 text-xs break-words whitespace-pre-line leading-tight">
              {userInfo?.name || "(Chưa xác định)"}
            </div>
            <div className="flex flex-wrap gap-0.5">
              <div className="bg-blue-100 rounded px-1 py-0.5 text-[10px] flex items-center min-w-0">
                <span className="mr-0.5">⭐</span> {userInfo?.level ?? "-"}
              </div>
              <div className="bg-green-100 rounded px-1 py-0.5 text-[10px] flex items-center min-w-0">
                <span className="mr-0.5">🏆</span> {userInfo?.score ?? "-"}
              </div>
            </div>
          </div>
        </div>
        {/* Đối thủ */}
        <div className="flex-1 flex flex-row items-center gap-1 p-1 bg-gradient-to-br from-pink-50 to-pink-200 min-w-0 min-h-[32px]">
          <div className="flex flex-col items-center min-w-[28px]">
            {opponentInfo && opponentInfo.avatar ? (
              <img
                src={opponentInfo.avatar}
                alt="opponent-avatar"
                className="w-7 h-7 rounded-full border border-pink-300 shadow"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-pink-500 border border-pink-300 shadow">
                <span className="text-xs">👤</span>
              </div>
            )}
            <div className="mt-0.5 text-xs font-extrabold text-pink-600 drop-shadow leading-tight">
              {mySymbol === "X" ? "O" : mySymbol === "O" ? "X" : "?"}
            </div>
            <div className="mt-0.5 text-[10px] font-bold text-pink-700 leading-tight">
              Đối thủ
            </div>
          </div>
          <div className="flex-1 ml-1 min-w-0 flex flex-col flex-wrap gap-y-0.5">
            <div className="font-semibold text-pink-900 text-xs break-words whitespace-pre-line leading-tight">
              {opponentInfo?.name || "(Chưa xác định)"}
            </div>
            <div className="flex flex-wrap gap-0.5">
              <div className="bg-pink-100 rounded px-1 py-0.5 text-[10px] flex items-center min-w-0">
                <span className="mr-0.5">⭐</span> {opponentInfo?.level ?? "-"}
              </div>
              <div className="bg-amber-100 rounded px-1 py-0.5 text-[10px] flex items-center min-w-0">
                <span className="mr-0.5">🏆</span> {opponentInfo?.score ?? "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 w-full flex items-center justify-center">
        {gameStatus === "win" ? (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs shadow-sm">
            <span className="text-base">🏆</span> Người thắng:{" "}
            <span className="font-bold text-green-900">{winner}</span>
          </div>
        ) : gameStatus === "draw" ? (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs shadow-sm">
            <span className="text-base">🤝</span>{" "}
            <span className="font-bold">Hai bên hòa nhau!</span>
          </div>
        ) : (
          (() => {
            if (!players || players.length < 2) return null;
            const isXTurn = turn === players[0].connectionId;
            const currentTurnConn = isXTurn
              ? players[0].connectionId
              : players[1].connectionId;
            const who =
              currentTurnConn === myConnectionId.current ? "Bạn" : "Đối thủ";
            const isMyTurn = turn === myConnectionId.current;
            return (
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs shadow-sm">
                <span className="text-base">{isXTurn ? "❌" : "⭕"}</span>
                <span>
                  Lượt:{" "}
                  <span className="font-bold text-blue-900">
                    {isXTurn ? "X" : "O"}
                  </span>{" "}
                  (<span className="font-bold">{who}</span>)
                </span>
                {isMyTurn && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-yellow-200 text-yellow-800 font-bold text-xs animate-pulse">
                    ⏳ {moveTimer}s
                  </span>
                )}
                {!isMyTurn && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold text-xs">
                    ⏳ {moveTimer}s
                  </span>
                )}
              </div>
            );
          })()
        )}
      </div>
      <div className="w-full max-w-full overflow-x-auto">
        <div
          className="mx-auto border-2 border-gray-400 bg-white"
          style={{
            width: "100%",
            maxWidth: "min(100vw, 420px)",
            minWidth: 240,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${
                board[0]?.length || 0
              }, minmax(0, 1fr))`,
            }}
          >
            {board.flatMap((row, i) =>
              row.map((cell, j) => (
                <button
                  key={i + "-" + j}
                  className="aspect-square text-lg font-bold focus:outline-none hover:bg-blue-100 transition p-0 bg-white"
                  style={{
                    display: "block",
                    minWidth: 0,
                    width: "100%",
                    flexBasis: 0,
                    fontSize: "clamp(1rem, 4vw, 1.5rem)",
                    outline: "1px solid #d1d5db", // Tailwind border-gray-300
                    outlineOffset: "-1px",
                    lineHeight: 1,
                  }}
                  onClick={() => makeMove(j, i)}
                  disabled={
                    !!cell ||
                    gameStatus !== "playing" ||
                    turn !== myConnectionId.current
                  }
                >
                  {cell}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 w-full flex flex-row flex-nowrap items-center justify-center gap-1 overflow-x-auto">
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm whitespace-nowrap"
          style={{ minWidth: "90px" }}
          onClick={leaveRoom}
        >
          <span className="text-base">🔄</span> Chơi lại
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-300 text-sm whitespace-nowrap"
          style={{ minWidth: "120px" }}
          onClick={() => navigate("/rooms")}
        >
          <span className="text-base">💬</span> Trở Lại Phòng Chát
        </button>
      </div>
    </div>
  );
}
