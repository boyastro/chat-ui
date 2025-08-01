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
  const [board] = useState(initialBoard());
  const [selected, setSelected] = useState(null);

  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

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
                  const isWhite = (i + j) % 2 === 0;
                  const isSelected =
                    selected && selected[0] === i && selected[1] === j;
                  return (
                    <div
                      key={i + "-" + j}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer text-2xl transition-all duration-150
                        ${isWhite ? "bg-amber-100" : "bg-amber-800"}
                        ${isSelected ? "ring-4 ring-yellow-400" : ""}
                        ${isWhite ? "text-black" : "text-white"}
                        hover:bg-yellow-300 hover:bg-opacity-40
                      `}
                      onClick={() => setSelected([i, j])}
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
              Demo Mode
            </p>
            <p className="text-gray-600 text-xs mt-1 text-center">
              Pieces can't move yet
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 sm:p-3 bg-indigo-100 rounded-xl text-indigo-800 shadow-inner text-center text-xs sm:text-sm">
        <p>
          Click any square to select it. This is a demo chess board with
          starting positions.
        </p>
        <p className="mt-1 text-xs text-indigo-600">
          Drag & drop movement functionality coming soon!
        </p>
      </div>
    </div>
  );
}
