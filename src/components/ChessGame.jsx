import React, { useState } from "react";

// Simple chess board rendering (8x8)
const initialBoard = () => {
  // Empty board, can be extended to include pieces
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
};

export default function ChessGame() {
  const [board] = useState(initialBoard());
  // For demo: select cell
  const [selected, setSelected] = useState(null);

  return (
    <div className="max-w-lg mx-auto p-4 bg-gradient-to-b from-gray-100 to-gray-300 rounded-xl shadow-lg border-2 border-gray-400">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-700">
        ♟️ Chess Game ♟️
      </h2>
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-500 rounded-lg overflow-hidden">
        {board.map((row, i) =>
          row.map((cell, j) => {
            const isWhite = (i + j) % 2 === 0;
            const isSelected =
              selected && selected[0] === i && selected[1] === j;
            return (
              <div
                key={i + "-" + j}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center cursor-pointer text-lg font-bold transition-all duration-150
                  ${isWhite ? "bg-white" : "bg-gray-700 text-white"}
                  ${isSelected ? "ring-4 ring-yellow-400" : ""}
                `}
                onClick={() => setSelected([i, j])}
              >
                {/* Render piece here if any */}
                {cell}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 text-center text-gray-600 text-sm">
        <span>Click any square to select. (Demo only, no chess logic yet)</span>
      </div>
    </div>
  );
}
