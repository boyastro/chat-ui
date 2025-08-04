import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ... (phần PIECES và initialBoard giữ nguyên)
// PIECES mapping for rendering only
const PIECES = {
  WHITE: {
    KING: "♔",
    QUEEN: "♕",
    ROOK: "♖",
    BISHOP: "♗",
    KNIGHT: "♘",
    PAWN: "♙",
  },
  BLACK: {
    KING: "♚",
    QUEEN: "♛",
    ROOK: "♜",
    BISHOP: "♝",
    KNIGHT: "♞",
    PAWN: "♟",
  },
};

export default function ChessGame() {
  const navigate = useNavigate();
  // All game state comes from backend
  const [game, setGame] = useState(null); // { board, currentPlayer, moveHistory, winner, validMoves, selected, ... }
  const [selected, setSelected] = useState(null); // [row, col] or null
  const ws = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // For rendering
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  // Connect to backend WebSocket on mount
  useEffect(() => {
    // Replace with your actual WebSocket endpoint
    const wsUrl =
      "wss://vd7olzoftd.execute-api.ap-southeast-1.amazonaws.com/prod";
    ws.current = new window.WebSocket(wsUrl);
    ws.current.onopen = () => {
      console.log("[WebSocket] Connected to:", wsUrl);
      setConnectionStatus("connected");
      // Join room or request initial state
      const joinMsg = JSON.stringify({ action: "join", roomId: "default" });
      console.log("[WebSocket] Sending join:", joinMsg);
      ws.current.send(joinMsg);
    };
    ws.current.onclose = (e) => {
      console.log("[WebSocket] Disconnected", e);
      setConnectionStatus("disconnected");
    };
    ws.current.onerror = (e) => {
      console.error("[WebSocket] Error", e);
      setConnectionStatus("error");
    };
    ws.current.onmessage = (event) => {
      console.log("[WebSocket] Message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        // Lấy payload đúng key
        const payload = data.payload || data.data;
        switch (data.type) {
          case "gameStarted":
            setGame({
              board: payload.board,
              currentPlayer: payload.turn,
              moveHistory: [],
              winner: null,
              players: payload.players,
              status: payload.status,
            });
            break;
          case "move":
            setGame((prev) => ({
              ...prev,
              board: data.payload.board,
              currentPlayer: data.payload.nextTurn,
              moveHistory: prev?.moveHistory
                ? [...prev.moveHistory, data.payload.move]
                : [data.payload.move],
              status: data.payload.status,
            }));
            break;
          case "gameOver":
            setGame((prev) => ({
              ...prev,
              board: data.payload.board,
              winner: data.payload.winner,
              moveHistory: data.payload.moveHistory,
              status: "finished",
            }));
            break;
          case "userLeft":
            setGame((prev) => ({
              ...prev,
              status: data.payload.status,
              players: data.payload.players,
            }));
            break;
          case "error":
            alert(data.message);
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("[WebSocket] Error parsing message", e);
      }
    };
    return () => {
      ws.current && ws.current.close();
    };
  }, []);

  // Send move to backend
  const sendMove = (from, to) => {
    if (!ws.current || ws.current.readyState !== 1) return;
    ws.current.send(
      JSON.stringify({
        action: "move",
        roomId: "default",
        from, // [row, col]
        to, // [row, col]
      })
    );
  };

  // Send restart to backend
  const handleRestart = () => {
    if (!ws.current || ws.current.readyState !== 1) return;
    ws.current.send(
      JSON.stringify({
        action: "restart",
        roomId: "default",
      })
    );
    setSelected(null);
  };

  // Handle square click: only send selection/move intent, let backend validate
  const handleSquareClick = (i, j) => {
    if (!game || game.winner) return;
    const clickedSquare = [i, j];
    // If no selection, select piece
    if (!selected) {
      setSelected(clickedSquare);
    } else {
      // If clicking same square, deselect
      if (selected[0] === i && selected[1] === j) {
        setSelected(null);
        return;
      }
      // Send move to backend
      sendMove(selected, clickedSquare);
      setSelected(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 bg-gradient-to-b from-indigo-50 to-blue-100 rounded-xl shadow-xl border-2 border-indigo-300">
      {/* Connection status */}
      {connectionStatus !== "connected" && (
        <div className="text-center text-red-600 font-semibold mb-2">
          Kết nối tới server: {connectionStatus}
        </div>
      )}
      {/* Winner modal */}
      {game && game.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:pt-24 bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 max-w-md w-full mx-4 sm:mx-0">
            <div className="text-2xl font-bold text-green-700 text-center">
              {game.winner === "WHITE" ? "Trắng" : "Đen"} thắng!
            </div>
            <div className="text-base text-gray-700 mb-2 text-center">
              Đối phương đã mất vua.
            </div>
            <button
              onClick={handleRestart}
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow font-semibold transition text-base"
            >
              Chơi lại
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center mb-4 gap-2">
        <button
          onClick={() => navigate("/rooms")}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-700 transition text-base font-semibold"
        >
          ← Back
        </button>
        <h2 className="w-full sm:w-auto text-lg sm:text-2xl font-bold text-center text-indigo-800 mt-2 sm:mt-0">
          ♟️ Chess Game ♟️
        </h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-center items-center justify-center mb-2 sm:mb-6 gap-4 sm:gap-8">
        <div className="flex flex-col items-center md:justify-center md:items-center w-full">
          <div className="rounded-lg overflow-hidden shadow-lg border-4 border-gray-800 mx-auto">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
              }}
            >
              {game && game.board
                ? game.board.map((row, i) =>
                    row.map((cell, j) => {
                      const isWhiteSquare = (i + j) % 2 === 0;
                      const isSelected =
                        selected && selected[0] === i && selected[1] === j;
                      // Highlight valid moves if backend provides them
                      let isValidMove = false;
                      if (game.validMoves && selected) {
                        isValidMove = game.validMoves.some(
                          ([from, to]) =>
                            from[0] === selected[0] &&
                            from[1] === selected[1] &&
                            to[0] === i &&
                            to[1] === j
                        );
                      }
                      // Xác định màu quân cờ: quân trắng là text-white, quân đen là text-black
                      let pieceColorClass = "";
                      if (Object.values(PIECES.WHITE).includes(cell)) {
                        pieceColorClass = "text-white";
                      } else if (Object.values(PIECES.BLACK).includes(cell)) {
                        pieceColorClass = "text-black";
                      }
                      return (
                        <div
                          key={i + "-" + j}
                          className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer text-2xl transition-all duration-150
                            ${isWhiteSquare ? "bg-slate-500" : "bg-slate-700"}
                            ${
                              isSelected
                                ? "ring-2 ring-indigo-400 ring-inset"
                                : ""
                            }
                            ${
                              isValidMove
                                ? "ring-2 ring-green-500 ring-inset"
                                : ""
                            }
                            ${pieceColorClass}
                            hover:bg-gray-600 hover:bg-opacity-60
                          `}
                          onClick={() => handleSquareClick(i, j)}
                        >
                          {cell}
                        </div>
                      );
                    })
                  )
                : Array(8)
                    .fill(null)
                    .map((_, i) =>
                      Array(8)
                        .fill(null)
                        .map((_, j) => {
                          const isWhiteSquare = (i + j) % 2 === 0;
                          return (
                            <div
                              key={i + "-" + j}
                              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl ${
                                isWhiteSquare ? "bg-slate-500" : "bg-slate-700"
                              }`}
                            ></div>
                          );
                        })
                    )}
            </div>
          </div>
        </div>

        <div className="mt-2 md:mt-0 md:ml-6 w-full max-w-[180px] sm:max-w-xs md:max-w-none md:w-52 p-1 sm:p-3 bg-white bg-opacity-80 rounded-xl shadow flex flex-col items-center md:-translate-y-20 md:-translate-x-6">
          <h3 className="font-bold text-indigo-700 mb-1 text-center text-sm sm:text-base md:text-lg">
            Selected Square
          </h3>
          {selected ? (
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-800 text-sm sm:text-base md:text-lg font-semibold">
                {files[selected[1]]}
                {ranks[selected[0]]}
                {game && game.board && game.board[selected[0]][selected[1]] && (
                  <span className="ml-1 text-base sm:ml-2 sm:text-lg md:text-xl">
                    {game.board[selected[0]][selected[1]]}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <p className="text-gray-600 italic text-center text-xs sm:text-sm">
              No square selected
            </p>
          )}
          <div className="mt-1 sm:mt-2 md:mt-4 pt-1 sm:pt-2 md:pt-4 border-t border-gray-300 w-full">
            <h3 className="font-bold text-indigo-700 mb-1 text-center text-sm sm:text-base md:text-lg">
              Game Status
            </h3>
            <p className="text-gray-800 text-center text-xs sm:text-sm md:text-base">
              {game ? `${game.currentPlayer}'s Turn` : "Đang tải..."}
            </p>
            {selected ? (
              <p className="text-emerald-600 text-xs mt-1 text-center font-semibold">
                Chọn điểm đến cho quân cờ
              </p>
            ) : (
              <p className="text-gray-600 text-xs mt-1 text-center">
                Chọn quân cờ để di chuyển
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 sm:p-3 bg-indigo-100 rounded-xl text-indigo-800 shadow-inner text-center text-xs sm:text-sm">
        {game && game.moveHistory && game.moveHistory.length > 0 ? (
          <div className="flex flex-col">
            <h4 className="font-semibold mb-1">Recent Moves</h4>
            <div className="max-h-16 overflow-y-auto">
              {game.moveHistory.slice(-5).map((move, index) => (
                <p key={index} className="text-xs mb-1">
                  {move.piece} {move.notation}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p>
            Click a piece to select it, then click a destination square to move.
            Green-highlighted squares show valid moves (if supported).
          </p>
        )}
        <p className="mt-1 text-xs text-indigo-600">
          All moves and state are now backend-driven!
        </p>
      </div>
    </div>
  );
}
