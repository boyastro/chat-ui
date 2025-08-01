import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Chess pieces using Unicode characters
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

// Initialize board with pieces in starting positions
const initialBoard = () => {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Add pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = PIECES.BLACK.PAWN;
    board[6][i] = PIECES.WHITE.PAWN;
  }

  // Add other pieces
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

  // Files (columns) labels A-H
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  // Ranks (rows) labels 8-1
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gradient-to-b from-indigo-50 to-blue-100 rounded-xl shadow-xl border-2 border-indigo-300">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate("/rooms")}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-600 hover:to-purple-700 transition"
        >
          ← Back to Rooms
        </button>
        <h2 className="text-2xl font-bold text-center text-indigo-800">
          ♟️ Chess Game ♟️
        </h2>
      </div>

      <div className="flex mb-10">
        {/* Board with labels */}
        <div className="flex flex-col items-center">
          {/* Rank labels (left side) */}
          <div className="h-8 w-8"></div> {/* Empty corner space */}
          <div className="flex">
            <div className="flex flex-col mr-2">
              {ranks.map((rank) => (
                <div
                  key={rank}
                  className="w-6 h-10 sm:h-12 flex items-center justify-center font-bold text-indigo-800"
                >
                  {rank}
                </div>
              ))}
            </div>

            {/* Chess board */}
            <div className="rounded-lg overflow-hidden shadow-lg border-4 border-gray-800">
              <div className="grid grid-cols-8 gap-0">
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
          {/* File labels (bottom) */}
          <div className="flex ml-8 mt-2">
            {files.map((file) => (
              <div
                key={file}
                className="w-10 sm:w-12 h-6 flex items-center justify-center font-bold text-indigo-800"
              >
                {file}
              </div>
            ))}
          </div>
        </div>

        {/* Info sidebar */}
        <div className="ml-6 w-52 p-3 bg-white bg-opacity-60 rounded-lg shadow-md hidden md:block">
          <h3 className="font-bold text-indigo-700 mb-2">Selected Square</h3>
          {selected ? (
            <p className="text-gray-800">
              {files[selected[1]]}
              {ranks[selected[0]]}
              {board[selected[0]][selected[1]] && (
                <span className="ml-2 text-xl">
                  {board[selected[0]][selected[1]]}
                </span>
              )}
            </p>
          ) : (
            <p className="text-gray-600 italic">No square selected</p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <h3 className="font-bold text-indigo-700 mb-2">Game Status</h3>
            <p className="text-gray-800">Demo Mode</p>
            <p className="text-gray-600 text-sm mt-1">Pieces can't move yet</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-indigo-100 rounded-lg text-indigo-800 shadow-inner text-center text-sm">
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
