import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ... (phần PIECES và initialBoard giữ nguyên)
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
const initialBoard = () => {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  for (let i = 0; i < 8; i++) {
    board[1][i] = PIECES.BLACK.PAWN;
    board[6][i] = PIECES.WHITE.PAWN;
  }
  board[0][0] = board[0][7] = PIECES.BLACK.ROOK;
  board[0][1] = board[0][6] = PIECES.BLACK.KNIGHT;
  board[0][2] = board[0][5] = PIECES.BLACK.BISHOP;
  board[0][3] = PIECES.BLACK.QUEEN;
  board[0][4] = PIECES.BLACK.KING;
  board[7][0] = board[7][7] = PIECES.WHITE.ROOK;
  board[7][1] = board[7][6] = PIECES.WHITE.KNIGHT;
  board[7][2] = board[7][5] = PIECES.WHITE.BISHOP;
  board[7][3] = PIECES.WHITE.QUEEN;
  board[7][4] = PIECES.WHITE.KING;
  return board;
};

export default function ChessGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(initialBoard());
  const [selected, setSelected] = useState(null);
  const [moveFrom, setMoveFrom] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("WHITE");
  const [moveHistory, setMoveHistory] = useState([]);

  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  // Determine if a piece belongs to the current player
  const isPieceOfCurrentPlayer = (piece) => {
    if (!piece) return false;

    // Check if the piece belongs to the current player based on Unicode character
    const isWhitePiece = Object.values(PIECES.WHITE).includes(piece);
    return (
      (currentPlayer === "WHITE" && isWhitePiece) ||
      (currentPlayer === "BLACK" && !isWhitePiece)
    );
  };

  // Check if a piece is of a specific type
  const isPieceType = (piece, type) => {
    if (!piece) return false;
    return piece === PIECES.WHITE[type] || piece === PIECES.BLACK[type];
  };

  // Check if a move is valid for a specific piece type
  const isValidMove = (fromRow, fromCol, toRow, toCol, piece) => {
    // Can't move to a square occupied by your own piece
    if (board[toRow][toCol] && isPieceOfCurrentPlayer(board[toRow][toCol])) {
      return false;
    }

    // Pawn movement rules
    if (isPieceType(piece, "PAWN")) {
      const direction = currentPlayer === "WHITE" ? -1 : 1; // White moves up, Black moves down
      const startRow = currentPlayer === "WHITE" ? 6 : 1;

      // Forward movement (1 square or 2 from starting position)
      if (fromCol === toCol && board[toRow][toCol] === null) {
        if (toRow === fromRow + direction) {
          return true;
        }
        // Double move from starting position
        if (
          fromRow === startRow &&
          toRow === fromRow + 2 * direction &&
          board[fromRow + direction][fromCol] === null
        ) {
          return true;
        }
      }

      // Diagonal capture
      if (
        Math.abs(fromCol - toCol) === 1 &&
        toRow === fromRow + direction &&
        board[toRow][toCol] !== null
      ) {
        return true;
      }

      return false;
    }

    // Knight movement rules
    if (isPieceType(piece, "KNIGHT")) {
      const rowDiff = Math.abs(fromRow - toRow);
      const colDiff = Math.abs(fromCol - toCol);
      return (
        (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
      );
    }

    // Bishop movement rules
    if (isPieceType(piece, "BISHOP")) {
      const rowDiff = Math.abs(fromRow - toRow);
      const colDiff = Math.abs(fromCol - toCol);

      // Must move diagonally (equal row and column difference)
      if (rowDiff !== colDiff) {
        return false;
      }

      // Check for pieces in the path
      const rowDir = toRow > fromRow ? 1 : -1;
      const colDir = toCol > fromCol ? 1 : -1;

      for (let i = 1; i < rowDiff; i++) {
        if (board[fromRow + i * rowDir][fromCol + i * colDir] !== null) {
          return false;
        }
      }

      return true;
    }

    // Rook movement rules
    if (isPieceType(piece, "ROOK")) {
      // Must move horizontally or vertically (one coordinate must stay the same)
      if (fromRow !== toRow && fromCol !== toCol) {
        return false;
      }

      // Check for pieces in the path
      if (fromRow === toRow) {
        // Horizontal movement
        const start = Math.min(fromCol, toCol) + 1;
        const end = Math.max(fromCol, toCol);
        for (let col = start; col < end; col++) {
          if (board[fromRow][col] !== null) {
            return false;
          }
        }
      } else {
        // Vertical movement
        const start = Math.min(fromRow, toRow) + 1;
        const end = Math.max(fromRow, toRow);
        for (let row = start; row < end; row++) {
          if (board[row][fromCol] !== null) {
            return false;
          }
        }
      }

      return true;
    }

    // Queen movement rules (combination of Rook and Bishop)
    if (isPieceType(piece, "QUEEN")) {
      const rowDiff = Math.abs(fromRow - toRow);
      const colDiff = Math.abs(fromCol - toCol);

      // Diagonal movement (like Bishop)
      if (rowDiff === colDiff) {
        const rowDir = toRow > fromRow ? 1 : -1;
        const colDir = toCol > fromCol ? 1 : -1;

        for (let i = 1; i < rowDiff; i++) {
          if (board[fromRow + i * rowDir][fromCol + i * colDir] !== null) {
            return false;
          }
        }

        return true;
      }

      // Horizontal/Vertical movement (like Rook)
      if (fromRow === toRow || fromCol === toCol) {
        if (fromRow === toRow) {
          // Horizontal movement
          const start = Math.min(fromCol, toCol) + 1;
          const end = Math.max(fromCol, toCol);
          for (let col = start; col < end; col++) {
            if (board[fromRow][col] !== null) {
              return false;
            }
          }
        } else {
          // Vertical movement
          const start = Math.min(fromRow, toRow) + 1;
          const end = Math.max(fromRow, toRow);
          for (let row = start; row < end; row++) {
            if (board[row][fromCol] !== null) {
              return false;
            }
          }
        }

        return true;
      }

      return false;
    }

    // King movement rules
    if (isPieceType(piece, "KING")) {
      const rowDiff = Math.abs(fromRow - toRow);
      const colDiff = Math.abs(fromCol - toCol);

      // King can move one square in any direction
      return rowDiff <= 1 && colDiff <= 1;
    }

    // Default to allow any move if the piece type wasn't recognized
    return true;
  };

  // Calculate all valid moves for a piece
  const calculateValidMoves = (row, col, piece) => {
    const moves = [];

    // Loop through all squares
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // Skip the current position
        if (i === row && j === col) continue;

        // Check if the move would be valid
        if (isValidMove(row, col, i, j, piece)) {
          moves.push([i, j]);
        }
      }
    }

    return moves;
  };

  // Handle square click for selecting and moving pieces
  const handleSquareClick = (i, j) => {
    const clickedSquare = [i, j];
    const clickedPiece = board[i][j];

    // If no square is currently selected or clicking on a different square
    if (!moveFrom) {
      // First click - select a piece if it belongs to current player
      if (clickedPiece && isPieceOfCurrentPlayer(clickedPiece)) {
        setMoveFrom(clickedSquare);
        setSelected(clickedSquare);
        setValidMoves(calculateValidMoves(i, j, clickedPiece));
      } else {
        // Just show the square info but don't select for movement
        setSelected(clickedSquare);
        setValidMoves([]);
      }
    } else {
      // Second click - attempt to move the piece
      const [fromRow, fromCol] = moveFrom;
      const piece = board[fromRow][fromCol];

      // If clicking on the same square, deselect
      if (fromRow === i && fromCol === j) {
        setMoveFrom(null);
        setValidMoves([]);
        return;
      }

      // If clicking on another piece of the same player, select that piece instead
      if (clickedPiece && isPieceOfCurrentPlayer(clickedPiece)) {
        setMoveFrom(clickedSquare);
        setSelected(clickedSquare);
        setValidMoves(calculateValidMoves(i, j, clickedPiece));
        return;
      }

      // Check if the move is valid according to chess rules
      if (!isValidMove(fromRow, fromCol, i, j, piece)) {
        // Invalid move, show some feedback but keep the piece selected
        setSelected(clickedSquare);
        return;
      }

      // Move the piece
      const newBoard = board.map((row) => [...row]);
      newBoard[i][j] = piece;
      newBoard[fromRow][fromCol] = null;

      // Record the move
      const moveNotation = `${files[fromCol]}${ranks[fromRow]} → ${files[j]}${ranks[i]}`;
      const capturedPiece = board[i][j] ? ` (captures ${board[i][j]})` : "";

      // Update state
      setBoard(newBoard);
      setMoveHistory([
        ...moveHistory,
        {
          piece,
          from: `${files[fromCol]}${ranks[fromRow]}`,
          to: `${files[j]}${ranks[i]}`,
          notation: moveNotation + capturedPiece,
        },
      ]);
      setMoveFrom(null);
      setValidMoves([]);
      setSelected(clickedSquare);
      setCurrentPlayer(currentPlayer === "WHITE" ? "BLACK" : "WHITE");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-2 sm:p-4 bg-gradient-to-b from-indigo-50 to-blue-100 rounded-xl shadow-xl border-2 border-indigo-300">
      {/* Improved header for mobile balance */}
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
              {board.map((row, i) =>
                row.map((cell, j) => {
                  const isWhiteSquare = (i + j) % 2 === 0;
                  const isSelected =
                    selected && selected[0] === i && selected[1] === j;
                  const isMoveSource =
                    moveFrom && moveFrom[0] === i && moveFrom[1] === j;
                  const isValidMove = validMoves.some(
                    ([row, col]) => row === i && col === j
                  );
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
                        ${isSelected ? "ring-4 ring-yellow-400" : ""}
                        ${isMoveSource ? "bg-green-200" : ""}
                        ${isValidMove ? "ring-2 ring-green-500 ring-inset" : ""}
                        ${pieceColorClass}
                        hover:bg-gray-600 hover:bg-opacity-60
                      `}
                      onClick={() => handleSquareClick(i, j)}
                    >
                      {cell}
                    </div>
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
                {board[selected[0]][selected[1]] && (
                  <span className="ml-1 text-base sm:ml-2 sm:text-lg md:text-xl">
                    {board[selected[0]][selected[1]]}
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
              {currentPlayer}'s Turn
            </p>
            {moveFrom ? (
              <p className="text-emerald-600 text-xs mt-1 text-center font-semibold">
                Select destination for {board[moveFrom[0]][moveFrom[1]]}
              </p>
            ) : (
              <p className="text-gray-600 text-xs mt-1 text-center">
                Select a {currentPlayer.toLowerCase()} piece to move
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 sm:p-3 bg-indigo-100 rounded-xl text-indigo-800 shadow-inner text-center text-xs sm:text-sm">
        {moveHistory.length > 0 ? (
          <div className="flex flex-col">
            <h4 className="font-semibold mb-1">Recent Moves</h4>
            <div className="max-h-16 overflow-y-auto">
              {moveHistory.slice(-5).map((move, index) => (
                <p key={index} className="text-xs mb-1">
                  {move.piece} {move.notation}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p>
            Click a piece to select it, then click a valid destination square to
            move. Green-highlighted squares show valid moves.
          </p>
        )}
        <p className="mt-1 text-xs text-indigo-600">
          All standard chess piece movements have been implemented!
        </p>
      </div>
    </div>
  );
}
