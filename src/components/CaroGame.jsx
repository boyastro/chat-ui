import React, { useState } from "react";

function calculateWinner(squares, size) {
  // Kiểm tra hàng, cột, chéo cho caro (5 liên tiếp)
  const lines = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      // Hàng ngang
      if (j + 4 < size)
        lines.push([
          [i, j],
          [i, j + 1],
          [i, j + 2],
          [i, j + 3],
          [i, j + 4],
        ]);
      // Hàng dọc
      if (i + 4 < size)
        lines.push([
          [i, j],
          [i + 1, j],
          [i + 2, j],
          [i + 3, j],
          [i + 4, j],
        ]);
      // Chéo chính
      if (i + 4 < size && j + 4 < size)
        lines.push([
          [i, j],
          [i + 1, j + 1],
          [i + 2, j + 2],
          [i + 3, j + 3],
          [i + 4, j + 4],
        ]);
      // Chéo phụ
      if (i + 4 < size && j - 4 >= 0)
        lines.push([
          [i, j],
          [i + 1, j - 1],
          [i + 2, j - 2],
          [i + 3, j - 3],
          [i + 4, j - 4],
        ]);
    }
  }
  for (let line of lines) {
    const [a, b, c, d, e] = line;
    const v = squares[a[0]][a[1]];
    if (
      v &&
      v === squares[b[0]][b[1]] &&
      v === squares[c[0]][c[1]] &&
      v === squares[d[0]][d[1]] &&
      v === squares[e[0]][e[1]]
    ) {
      return v;
    }
  }
  return null;
}

export default function CaroGame({ size = 15 }) {
  const [squares, setSquares] = useState(
    Array(size)
      .fill(null)
      .map(() => Array(size).fill(null))
  );
  const [xIsNext, setXIsNext] = useState(true);
  const winner = calculateWinner(squares, size);

  function handleClick(i, j) {
    if (squares[i][j] || winner) return;
    const next = squares.map((row) => row.slice());
    next[i][j] = xIsNext ? "X" : "O";
    setSquares(next);
    setXIsNext(!xIsNext);
  }

  return (
    <div className="flex flex-col items-center my-8">
      <h2 className="text-2xl font-bold mb-4">Caro Game (Gomoku)</h2>
      <div className="mb-2 text-lg">
        {winner ? `Người thắng: ${winner}` : `Lượt: ${xIsNext ? "X" : "O"}`}
      </div>
      <div className="inline-block border-2 border-gray-400 bg-white">
        {squares.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => (
              <button
                key={j}
                className="w-8 h-8 border border-gray-300 text-lg font-bold focus:outline-none hover:bg-blue-100 transition"
                onClick={() => handleClick(i, j)}
                style={{ width: 32, height: 32 }}
              >
                {cell}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        onClick={() => {
          setSquares(
            Array(size)
              .fill(null)
              .map(() => Array(size).fill(null))
          );
          setXIsNext(true);
        }}
      >
        Chơi lại
      </button>
    </div>
  );
}
