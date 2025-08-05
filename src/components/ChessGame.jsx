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
  const [validMovesUI, setValidMovesUI] = useState([]); // highlight squares for selected piece
  const [myConnectionId, setMyConnectionId] = useState(null); // id của mình
  const ws = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // For rendering
  const filesBase = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const ranksBase = ["8", "7", "6", "5", "4", "3", "2", "1"];
  // Determine player color
  let isBlackPlayer = false;
  if (game && myConnectionId && game.players && Array.isArray(game.players)) {
    const idx = game.players.indexOf(myConnectionId);
    isBlackPlayer = idx === 1;
  }
  const files = isBlackPlayer ? [...filesBase].reverse() : filesBase;
  const ranks = isBlackPlayer ? [...ranksBase].reverse() : ranksBase;

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
        if (!event.data || !event.data.trim()) return;
        const data = JSON.parse(event.data);
        // Lấy payload đúng key
        const payload = data.payload || data.data;
        switch (data.type) {
          case "gameStarted":
            if (!payload) return;
            setGame({
              board: payload.board,
              currentPlayer: payload.turn,
              moveHistory: [],
              winner: null,
              players: payload.players,
              status: payload.status,
              withAI: payload.withAI || false,
              // Initialize castling rights for a new game
              castlingRights: {
                w: { kingSide: true, queenSide: true },
                b: { kingSide: true, queenSide: true },
              },
              enPassantTarget: null,
            });
            if (data.myConnectionId) setMyConnectionId(data.myConnectionId);
            break;
          case "move":
            if (!payload) return;
            setGame((prev) => ({
              ...prev,
              board: payload.board,
              currentPlayer: payload.nextTurn,
              moveHistory: prev?.moveHistory
                ? [...prev.moveHistory, payload.move]
                : [payload.move],
              status: payload.status,
            }));
            break;
          case "gameOver":
            if (!payload) return;
            setGame((prev) => ({
              ...prev,
              board: payload.board,
              winner: payload.winner,
              moveHistory: payload.moveHistory,
              status: "finished",
            }));
            break;
          case "userLeft":
            if (!payload) return;
            setGame((prev) => ({
              ...prev,
              status: payload.status,
              players: payload.players,
            }));
            break;
          case "gameUpdate":
            if (!payload) return;
            setGame((prev) => ({
              ...prev,
              ...payload,
              withAI:
                payload.withAI !== undefined
                  ? payload.withAI
                  : prev?.withAI || false,
            }));
            if (data.myConnectionId) setMyConnectionId(data.myConnectionId);
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

  // Check if a move is legal according to chess rules (basic, no castling/en passant/promotion)
  function isLegalMove(board, from, to, currentPlayer) {
    if (!board) return false;
    const [fx, fy] = from;
    const [tx, ty] = to;
    if (fx === tx && fy === ty) return false;
    const piece = board[fx][fy];
    if (!piece) return false;
    const color = piece[0] === "w" ? "WHITE" : "BLACK";
    if (color !== currentPlayer) return false;
    const type = piece[1];
    const target = board[tx][ty];
    if (target && target[0] === piece[0]) return false; // cannot capture own piece
    const dx = tx - fx;
    const dy = ty - fy;

    // Get castling rights and en passant target from game state
    const castlingRights = game?.castlingRights || {
      w: { kingSide: true, queenSide: true },
      b: { kingSide: true, queenSide: true },
    };
    const enPassantTarget = game?.enPassantTarget || null;

    // Helper for clear path
    function isPathClear(dx, dy) {
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const stepx = dx === 0 ? 0 : dx / Math.abs(dx);
      const stepy = dy === 0 ? 0 : dy / Math.abs(dy);
      for (let step = 1; step < steps; step++) {
        const x = fx + step * stepx;
        const y = fy + step * stepy;
        if (board[x][y]) return false;
      }
      return true;
    }

    // Helper to check if a square is attacked by opponent
    function isSquareAttacked(board, square, byColor) {
      // Simple implementation - a more complete version would check all possible attacking pieces
      // This is a simplified version that doesn't account for all attack vectors
      const [x, y] = square;

      // Check for pawn attacks
      const pawnDir = byColor === "WHITE" ? -1 : 1;
      if ((byColor === "WHITE" && x > 0) || (byColor === "BLACK" && x < 7)) {
        // Check left and right pawn attacks
        if (y > 0) {
          const leftPiece = board[x + pawnDir][y - 1];
          if (
            leftPiece &&
            leftPiece[0] === (byColor === "WHITE" ? "w" : "b") &&
            leftPiece[1] === "P"
          )
            return true;
        }
        if (y < 7) {
          const rightPiece = board[x + pawnDir][y + 1];
          if (
            rightPiece &&
            rightPiece[0] === (byColor === "WHITE" ? "w" : "b") &&
            rightPiece[1] === "P"
          )
            return true;
        }
      }

      // This is incomplete - a full implementation would check for all piece types
      // For knights, bishops, rooks, queens, and king

      return false; // Not attacked (based on this simplified check)
    }

    switch (type) {
      case "P": {
        // Pawn
        const dir = color === "WHITE" ? -1 : 1;
        // Move forward
        if (dy === 0 && dx === dir && !target) {
          // Promotion
          if (
            (color === "WHITE" && tx === 0) ||
            (color === "BLACK" && tx === 7)
          ) {
            return true; // allow promotion
          }
          return true;
        }
        // First move: two squares
        if (
          dy === 0 &&
          dx === 2 * dir &&
          fx === (color === "WHITE" ? 6 : 1) &&
          !target &&
          !board[fx + dir][fy]
        )
          return true;
        // Capture
        if (
          Math.abs(dy) === 1 &&
          dx === dir &&
          target &&
          target[0] !== piece[0]
        ) {
          // Promotion on capture
          if (
            (color === "WHITE" && tx === 0) ||
            (color === "BLACK" && tx === 7)
          ) {
            return true;
          }
          return true;
        }

        // En Passant capture
        if (
          Math.abs(dy) === 1 &&
          dx === dir &&
          !target && // No piece on target square
          enPassantTarget && // There is an en passant target
          enPassantTarget.x === ty && // Target matches column
          enPassantTarget.y === tx // Target matches row
        ) {
          return true;
        }

        return false;
      }
      case "R": {
        // Rook
        if ((dx === 0 || dy === 0) && isPathClear(dx, dy)) return true;
        return false;
      }
      case "N": {
        // Knight
        if (
          (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
          (Math.abs(dx) === 1 && Math.abs(dy) === 2)
        )
          return true;
        return false;
      }
      case "B": {
        // Bishop
        if (Math.abs(dx) === Math.abs(dy) && isPathClear(dx, dy)) return true;
        return false;
      }
      case "Q": {
        // Queen
        if (
          (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) &&
          isPathClear(dx, dy)
        )
          return true;
        return false;
      }
      case "K": {
        // King
        // Normal king move (one square in any direction)
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;

        // Castling
        const colorPrefix = color === "WHITE" ? "w" : "b";

        // Check if king is in starting position
        if ((color === "WHITE" && fx !== 7) || (color === "BLACK" && fx !== 0))
          return false;

        if (fy !== 4)
          // King must be in the center file (e1 for white, e8 for black)
          return false;

        // Check castling rights
        if (!castlingRights[colorPrefix.toLowerCase()]) return false;

        // King-side castling (O-O)
        if (
          dy === 2 &&
          dx === 0 &&
          castlingRights[colorPrefix.toLowerCase()]?.kingSide
        ) {
          // Check if path is clear
          if (!isPathClear(0, 2)) return false;

          // Check if king or passing square is in check (simplified - should check for attacks)
          // This is a simplified check that doesn't fully validate all check conditions
          const oppColor = color === "WHITE" ? "BLACK" : "WHITE";
          if (
            isSquareAttacked(board, [fx, fy], oppColor) ||
            isSquareAttacked(board, [fx, fy + 1], oppColor)
          )
            return false;

          // Check if rook is in place
          const rookPos = board[fx][7];
          if (
            !rookPos ||
            rookPos[0] !== colorPrefix.toLowerCase() ||
            rookPos[1] !== "R"
          )
            return false;

          return true;
        }

        // Queen-side castling (O-O-O)
        if (
          dy === -2 &&
          dx === 0 &&
          castlingRights[colorPrefix.toLowerCase()]?.queenSide
        ) {
          // Check if path is clear
          if (!isPathClear(0, -2) || board[fx][1] !== null)
            // Extra check for b1/b8 square
            return false;

          // Check if king or passing square is in check (simplified)
          const oppColor = color === "WHITE" ? "BLACK" : "WHITE";
          if (
            isSquareAttacked(board, [fx, fy], oppColor) ||
            isSquareAttacked(board, [fx, fy - 1], oppColor)
          )
            return false;

          // Check if rook is in place
          const rookPos = board[fx][0];
          if (
            !rookPos ||
            rookPos[0] !== colorPrefix.toLowerCase() ||
            rookPos[1] !== "R"
          )
            return false;

          return true;
        }

        return false;
      }
      default:
        return false;
    }
  }

  // Send move to backend (convert [row, col] to {x, y})
  // Move piece on UI immediately, backend only checks win/lose
  const sendMove = (from, to) => {
    setGame((prev) => {
      if (!prev) return prev;
      const newBoard = prev.board.map((row) => [...row]);
      let movedPiece = newBoard[from[0]][from[1]];

      // Update castling rights
      const newCastlingRights = {
        ...(prev.castlingRights || {
          w: { kingSide: true, queenSide: true },
          b: { kingSide: true, queenSide: true },
        }),
      };

      // If king moves, lose all castling rights for that color
      if (movedPiece && movedPiece[1] === "K") {
        const colorKey = movedPiece[0];
        if (newCastlingRights[colorKey]) {
          newCastlingRights[colorKey].kingSide = false;
          newCastlingRights[colorKey].queenSide = false;
        }
      }

      // If rook moves, lose castling rights for that side
      if (movedPiece && movedPiece[1] === "R") {
        const colorKey = movedPiece[0];
        if (newCastlingRights[colorKey]) {
          // King-side rook (h1/h8)
          if (from[0] === (colorKey === "w" ? 7 : 0) && from[1] === 7) {
            newCastlingRights[colorKey].kingSide = false;
          }
          // Queen-side rook (a1/a8)
          else if (from[0] === (colorKey === "w" ? 7 : 0) && from[1] === 0) {
            newCastlingRights[colorKey].queenSide = false;
          }
        }
      }

      // Set en passant target for pawn double move
      let enPassantTarget = null;
      if (movedPiece && movedPiece[1] === "P") {
        // Double pawn move
        if (Math.abs(to[0] - from[0]) === 2) {
          // Set the en passant target to the square behind the pawn
          const direction = movedPiece[0] === "w" ? -1 : 1;
          enPassantTarget = {
            x: to[1],
            y: to[0] + direction,
          };
        }
      }

      // Handle en passant capture
      if (
        movedPiece &&
        movedPiece[1] === "P" &&
        Math.abs(to[1] - from[1]) === 1 && // Moving diagonally
        !newBoard[to[0]][to[1]] && // No piece at target
        prev.enPassantTarget && // There is an en passant target
        prev.enPassantTarget.x === to[1] && // Target matches column
        prev.enPassantTarget.y === to[0] // Target matches row
      ) {
        // Remove the captured pawn
        const capturedPawnRow = from[0];
        const capturedPawnCol = to[1];
        newBoard[capturedPawnRow][capturedPawnCol] = null;
      }

      // Handle castling
      if (
        movedPiece &&
        movedPiece[1] === "K" &&
        Math.abs(to[1] - from[1]) === 2
      ) {
        // Determine rook positions based on castling type
        const isKingSideCastling = to[1] > from[1]; // Moving right
        const rookFromCol = isKingSideCastling ? 7 : 0;
        const rookToCol = isKingSideCastling ? 5 : 3; // f1/f8 or d1/d8

        // Move the rook
        newBoard[to[0]][rookToCol] = newBoard[from[0]][rookFromCol];
        newBoard[from[0]][rookFromCol] = null;
      }

      // Pawn promotion: nếu tốt đi đến hàng cuối thì thành Queen
      if (
        movedPiece &&
        movedPiece[1] === "P" &&
        ((movedPiece[0] === "w" && to[0] === 0) ||
          (movedPiece[0] === "b" && to[0] === 7))
      ) {
        movedPiece = movedPiece[0] + "Q";
      }

      newBoard[to[0]][to[1]] = movedPiece;
      newBoard[from[0]][from[1]] = null;

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === "WHITE" ? "BLACK" : "WHITE",
        castlingRights: newCastlingRights,
        enPassantTarget: enPassantTarget,
        moveHistory: [
          ...(prev.moveHistory || []),
          {
            from: { x: from[1], y: from[0] },
            to: { x: to[1], y: to[0] },
            piece: newBoard[to[0]][to[1]],
            promotion:
              prev.board[from[0]][from[1]][1] === "P" &&
              ((from[0] === 1 && to[0] === 0) || (from[0] === 6 && to[0] === 7))
                ? "Q"
                : undefined,
            isCastling:
              prev.board[from[0]][from[1]][1] === "K" &&
              Math.abs(to[1] - from[1]) === 2,
            isEnPassant:
              prev.board[from[0]][from[1]][1] === "P" &&
              Math.abs(to[1] - from[1]) === 1 &&
              !prev.board[to[0]][to[1]],
          },
        ],
      };
    });
    // Gửi message cho backend sau mỗi lần di chuyển
    setTimeout(() => {
      if (!ws.current || ws.current.readyState !== 1) return;
      const msg = {
        action: "move",
        roomId: "default",
        from: { x: from[1], y: from[0] }, // col, row
        to: { x: to[1], y: to[0] }, // col, row
      };
      // Nếu là phong hậu thì gửi thêm promotion
      const movingPiece = game?.board?.[from[0]]?.[from[1]];
      if (
        movingPiece &&
        movingPiece[1] === "P" &&
        ((movingPiece[0] === "w" && to[0] === 0) ||
          (movingPiece[0] === "b" && to[0] === 7))
      ) {
        msg.promotion = "Q";
      }
      console.log("[SEND TO BACKEND]", msg);
      ws.current.send(JSON.stringify(msg));
    }, 0);
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

  // Compute all valid moves for a piece at [fx, fy]
  function getAllValidMoves(board, from, currentPlayer) {
    const moves = [];
    if (!board || !from) return moves;
    for (let tx = 0; tx < 8; tx++) {
      for (let ty = 0; ty < 8; ty++) {
        if (isLegalMove(board, from, [tx, ty], currentPlayer)) {
          moves.push([tx, ty]);
        }
      }
    }
    return moves;
  }

  // Helper: xác định connectionId này có phải lượt đi không
  function isMyTurn() {
    if (!game || !myConnectionId) return false;
    // Mặc định: players[0] là trắng, players[1] là đen
    const idx =
      game.players && Array.isArray(game.players)
        ? game.players.indexOf(myConnectionId)
        : -1;
    if (idx === -1) return false;
    const color = idx === 0 ? "WHITE" : "BLACK";
    return color === game.currentPlayer;
  }

  // Handle square click: chỉ cho phép đi khi đúng lượt
  const handleSquareClick = (i, j) => {
    if (!game || game.winner) return;
    if (!isMyTurn()) return;
    const clickedSquare = [i, j];
    if (!selected) {
      // Select only if it's your piece
      const cell = game.board[i][j];
      if (!cell) return;
      const color =
        cell[0] === "w" ? "WHITE" : cell[0] === "b" ? "BLACK" : null;
      if (color !== game.currentPlayer) return;
      setSelected(clickedSquare);
      // Highlight valid moves for this piece
      setValidMovesUI(
        getAllValidMoves(game.board, clickedSquare, game.currentPlayer)
      );
    } else {
      // If clicking same square, deselect
      if (selected[0] === i && selected[1] === j) {
        setSelected(null);
        setValidMovesUI([]);
        return;
      }
      // Only allow legal moves
      if (
        isLegalMove(game.board, selected, clickedSquare, game.currentPlayer)
      ) {
        sendMove(selected, clickedSquare);
        setSelected(null);
        setValidMovesUI([]);
      } else {
        // If clicked another own piece, select it and show its valid moves
        const cell = game.board[i][j];
        if (cell) {
          const color =
            cell[0] === "w" ? "WHITE" : cell[0] === "b" ? "BLACK" : null;
          if (color === game.currentPlayer) {
            setSelected(clickedSquare);
            setValidMovesUI(
              getAllValidMoves(game.board, clickedSquare, game.currentPlayer)
            );
            return;
          }
        }
        // Otherwise, do nothing
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 bg-gradient-to-b from-indigo-50 to-blue-100 rounded-xl shadow-xl border-2 border-indigo-300">
      {/* Modal xác định người đi trước */}
      {game &&
        (game.currentPlayer === undefined || game.currentPlayer === null) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:pt-24 bg-black bg-opacity-40">
            <div className="bg-gradient-to-br from-indigo-100 to-blue-50 rounded-2xl shadow-xl px-6 py-5 flex flex-col items-center gap-2 max-w-xs w-full mx-4 animate-fade-in border border-indigo-200">
              <div className="text-3xl mb-1 animate-spin-slow">🔄</div>
              <div className="text-lg font-semibold text-indigo-700 text-center">
                Đang chuẩn bị bàn cờ
              </div>
              <div className="text-xs text-gray-500 text-center">
                Vui lòng chờ hệ thống...
              </div>
            </div>
          </div>
        )}
      {/* Connection status */}
      {connectionStatus !== "connected" && (
        <div className="text-center text-red-600 font-semibold mb-2">
          Kết nối tới server: {connectionStatus}
        </div>
      )}
      {/* Waiting/Preparing modal */}
      {game &&
        !game.withAI &&
        (game.status === "waiting" ||
          (game.players && game.players.length < 2)) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:pt-24 bg-black bg-opacity-40">
            <div className="bg-gradient-to-br from-indigo-100 to-blue-50 rounded-2xl shadow-xl px-6 py-5 flex flex-col items-center gap-2 max-w-xs w-full mx-4 animate-fade-in border border-indigo-200">
              <div className="text-3xl mb-1 animate-spin-slow">⏳</div>
              <div className="text-lg font-semibold text-indigo-700 text-center">
                Đang chờ người chơi...
              </div>
              <div className="text-xs text-gray-500 text-center">
                Đang tìm người chơi phù hợp với bạn.
              </div>
            </div>
          </div>
        )}
      {/* Winner modal */}
      {game &&
        game.winner &&
        (() => {
          let result = null;
          let isWin = false;
          let isLose = false;
          let icon = null;
          let colorClass = "text-green-700";
          if (!game.players || !myConnectionId) {
            result = game.winner === "WHITE" ? "Trắng thắng!" : "Đen thắng!";
            icon = game.winner === "WHITE" ? "🏆" : "🏆";
          } else {
            const idx = game.players.indexOf(myConnectionId);
            if (idx === -1) {
              result = game.winner === "WHITE" ? "Trắng thắng!" : "Đen thắng!";
              icon = game.winner === "WHITE" ? "🏆" : "🏆";
            } else {
              const myColor = idx === 0 ? "WHITE" : "BLACK";
              if (game.winner === myColor) {
                result = "Bạn Thắng";
                isWin = true;
                icon = "🎉";
                colorClass = "text-green-700";
              } else if (
                game.winner &&
                (game.winner === "WHITE" || game.winner === "BLACK")
              ) {
                result = "Bạn Thua";
                isLose = true;
                icon = "😢";
                colorClass = "text-red-600";
              } else {
                result = "Kết thúc ván cờ";
                icon = "🏁";
                colorClass = "text-gray-700";
              }
            }
          }
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:pt-24 bg-black bg-opacity-40">
              <div
                className={`bg-white rounded-xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 max-w-md w-full mx-4 sm:mx-0 ${
                  isWin
                    ? "border-4 border-green-400"
                    : isLose
                    ? "border-4 border-red-400"
                    : "border-4 border-gray-300"
                }`}
              >
                <div
                  className={`text-4xl mb-2 ${isWin ? "animate-bounce" : ""}`}
                >
                  {icon}
                </div>
                <div className={`text-2xl font-bold text-center ${colorClass}`}>
                  {result}
                </div>
                <div className="text-base text-gray-700 mb-2 text-center">
                  Game Over !
                </div>
                <button
                  onClick={handleRestart}
                  className={`px-5 py-2 ${
                    isWin
                      ? "bg-green-500 hover:bg-green-600"
                      : isLose
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-indigo-500 hover:bg-indigo-600"
                  } text-white rounded-lg shadow font-semibold transition text-base`}
                >
                  Chơi lại
                </button>
              </div>
            </div>
          );
        })()}
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
                ? (isBlackPlayer ? [...game.board].reverse() : game.board).map(
                    (row, i) =>
                      (isBlackPlayer ? [...row].reverse() : row).map(
                        (cell, j) => {
                          // Map i, j to real board index
                          const realI = isBlackPlayer ? 7 - i : i;
                          const realJ = isBlackPlayer ? 7 - j : j;
                          const isWhiteSquare = (realI + realJ) % 2 === 0;
                          const isSelected =
                            selected &&
                            selected[0] === realI &&
                            selected[1] === realJ;
                          // Highlight valid moves for selected piece (UI)
                          let isValidMove = false;
                          if (selected && validMovesUI.length > 0) {
                            isValidMove = validMovesUI.some(
                              ([x, y]) => x === realI && y === realJ
                            );
                          }
                          // Map backend code (bR, wK, ...) to Unicode chess piece
                          let piece = null;
                          let pieceColorClass = "";
                          if (typeof cell === "string" && cell.length === 2) {
                            const color =
                              cell[0] === "w"
                                ? "WHITE"
                                : cell[0] === "b"
                                ? "BLACK"
                                : null;
                            const typeMap = {
                              K: "KING",
                              Q: "QUEEN",
                              R: "ROOK",
                              B: "BISHOP",
                              N: "KNIGHT",
                              P: "PAWN",
                            };
                            const type = typeMap[cell[1]];
                            if (color && type && PIECES[color][type]) {
                              piece = PIECES[color][type];
                              pieceColorClass =
                                color === "WHITE"
                                  ? "text-white drop-shadow-md font-bold"
                                  : "text-gray-900 drop-shadow-sm font-bold";
                            }
                          }
                          return (
                            <div
                              key={i + "-" + j}
                              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer text-2xl sm:text-3xl md:text-4xl transition-all duration-150
                            ${isWhiteSquare ? "bg-slate-400" : "bg-slate-700"}
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
                              onClick={() => handleSquareClick(realI, realJ)}
                            >
                              <span className="transform hover:scale-110 transition-transform duration-200">
                                {piece}
                              </span>
                            </div>
                          );
                        }
                      )
                  )
                : Array(8)
                    .fill(null)
                    .map((_, i) =>
                      Array(8)
                        .fill(null)
                        .map((_, j) => {
                          const realI = isBlackPlayer ? 7 - i : i;
                          const realJ = isBlackPlayer ? 7 - j : j;
                          const isWhiteSquare = (realI + realJ) % 2 === 0;
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
              {game
                ? `${game.currentPlayer}'s Turn${
                    game.withAI &&
                    game.currentPlayer !==
                      (myConnectionId &&
                      game.players &&
                      game.players.indexOf(myConnectionId) === 0
                        ? "WHITE"
                        : "BLACK")
                      ? " (AI)"
                      : ""
                  }`
                : "Đang tải..."}
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
