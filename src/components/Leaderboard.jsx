import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Leaderboard({ type = "totalScore", limit = 10 }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    fetch(`${apiUrl}/leaderboard?type=${type}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi lấy bảng xếp hạng");
        return res.json();
      })
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, limit]);

  return (
    <div className="bg-white rounded-xl shadow p-4 max-w-xl mx-auto my-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          🏆 Bảng xếp hạng
        </h3>
        <button
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 font-semibold text-sm shadow transition"
          onClick={() => navigate("/rooms")}
        >
          <span className="text-base">💬</span>
          <span>Phòng chat</span>
        </button>
      </div>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left">#</th>
              <th className="py-2 px-2 text-left">Tên</th>
              <th className="py-2 px-2 text-center">Điểm</th>
              <th className="py-2 px-2 text-center">Thắng</th>
              <th className="py-2 px-2 text-center">Thua</th>
              <th className="py-2 px-2 text-center">Hòa</th>
              <th className="py-2 px-2 text-center">Kỷ lục</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u._id || u.id} className="border-b hover:bg-blue-50">
                <td className="py-1 px-2 font-semibold text-blue-600">
                  {idx + 1}
                </td>
                <td className="py-1 px-2 flex items-center gap-2">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt="avatar"
                      className="w-7 h-7 rounded-full border"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 border text-xs">
                      ?
                    </span>
                  )}
                  <span>{u.name}</span>
                </td>
                <td className="py-1 px-2 text-center font-bold">
                  {u.totalScore ?? "-"}
                </td>
                <td className="py-1 px-2 text-center">{u.winCount ?? "-"}</td>
                <td className="py-1 px-2 text-center">{u.loseCount ?? "-"}</td>
                <td className="py-1 px-2 text-center">{u.drawCount ?? "-"}</td>
                <td className="py-1 px-2 text-center">
                  {u.highestScore ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
