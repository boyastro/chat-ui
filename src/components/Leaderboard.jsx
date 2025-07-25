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
    <div className="bg-white rounded-xl shadow p-2 sm:p-4 max-w-xl mx-auto my-6">
      <div className="mb-2">
        <button
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 font-semibold text-sm shadow transition w-max"
          onClick={() => navigate("/rooms")}
        >
          <span>Về phòng Chat</span>
        </button>
      </div>
      <div className="mb-4 flex justify-center">
        <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          🏆 Bảng xếp hạng
        </h3>
      </div>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-2 text-left whitespace-nowrap">#</th>
                <th className="py-2 px-2 text-left whitespace-nowrap">Tên</th>
                <th className="py-2 px-2 text-center whitespace-nowrap">
                  Điểm
                </th>
                <th className="py-2 px-2 text-center whitespace-nowrap">
                  Thắng
                </th>
                <th className="py-2 px-2 text-center whitespace-nowrap">
                  Thua
                </th>
                <th className="py-2 px-2 text-center whitespace-nowrap">Hòa</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u._id || u.id} className="border-b hover:bg-blue-50">
                  <td className="py-1 px-2 font-semibold text-blue-600 text-center sm:text-left">
                    {idx + 1}
                  </td>
                  <td className="py-1 px-2 flex items-center gap-2 min-w-[120px]">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt="avatar"
                        className="w-7 h-7 rounded-full border flex-shrink-0"
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 border text-xs flex-shrink-0">
                        ?
                      </span>
                    )}
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {u.name}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center font-bold whitespace-nowrap">
                    {u.totalScore ?? "-"}
                  </td>
                  <td className="py-1 px-2 text-center whitespace-nowrap">
                    {u.winCount ?? "-"}
                  </td>
                  <td className="py-1 px-2 text-center whitespace-nowrap">
                    {u.loseCount ?? "-"}
                  </td>
                  <td className="py-1 px-2 text-center whitespace-nowrap">
                    {u.drawCount ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
