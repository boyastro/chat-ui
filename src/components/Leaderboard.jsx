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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2 sm:p-5 max-w-full sm:max-w-xl mx-auto my-3 sm:my-6">
      <div className="mb-2 sm:mb-3">
        <button
          className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded px-2 sm:px-4 py-1 sm:py-1.5 font-semibold text-xs sm:text-sm shadow-md transition-all duration-200 w-max"
          onClick={() => navigate("/rooms")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Về phòng Chat</span>
        </button>
      </div>
      <div className="mb-3 sm:mb-5 flex justify-center">
        <h3 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 flex items-center gap-2">
          🏆 Bảng xếp hạng
        </h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-4 sm:py-8 text-blue-600">
          <svg
            className="animate-spin h-5 w-5 sm:h-8 sm:w-8 mr-2"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-sm sm:text-lg font-medium">
            Đang tải dữ liệu...
          </span>
        </div>
      ) : error ? (
        <div className="text-center p-3 sm:p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-center mb-1 sm:mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Lỗi</span>
          </div>
          <p className="text-xs sm:text-sm">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-xs sm:text-lg">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 text-xs sm:text-lg">
                  <th className="py-2 sm:py-4 px-2 sm:px-4 text-left whitespace-nowrap font-bold">
                    #
                  </th>
                  <th className="py-2 sm:py-4 px-2 sm:px-4 text-left whitespace-nowrap font-bold">
                    Tên
                  </th>
                  <th className="py-2 sm:py-4 px-1 sm:px-4 text-center whitespace-nowrap font-bold">
                    Score
                  </th>
                  <th className="py-2 sm:py-4 px-1 sm:px-4 text-center whitespace-nowrap font-bold">
                    Thắng
                  </th>
                  <th className="py-2 sm:py-4 px-1 sm:px-4 text-center whitespace-nowrap font-bold">
                    Thua
                  </th>
                  <th className="py-2 sm:py-4 px-1 sm:px-4 text-center whitespace-nowrap font-bold">
                    Hòa
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  let rowClass =
                    "border-b hover:bg-blue-50/40 transition-colors";
                  let rankElement = idx + 1;

                  // Top 3 có style đặc biệt
                  if (idx === 0) {
                    rowClass =
                      "border-b bg-yellow-50 hover:bg-yellow-100/70 transition-colors";
                    rankElement = (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full shadow-sm font-bold">
                        1
                      </span>
                    );
                  } else if (idx === 1) {
                    rowClass =
                      "border-b bg-gray-50 hover:bg-gray-100/70 transition-colors";
                    rankElement = (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-400 text-white rounded-full shadow-sm font-bold">
                        2
                      </span>
                    );
                  } else if (idx === 2) {
                    rowClass =
                      "border-b bg-amber-50 hover:bg-amber-100/70 transition-colors";
                    rankElement = (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-600 text-white rounded-full shadow-sm font-bold">
                        3
                      </span>
                    );
                  }

                  return (
                    <tr key={u._id || u.id} className={rowClass}>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-blue-600 text-center sm:text-left text-xs sm:text-lg">
                        {rankElement}
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 flex items-center gap-2 min-w-[120px] text-xs sm:text-lg">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt="avatar"
                            className="w-8 h-8 rounded-full border-2 border-blue-100 flex-shrink-0 object-cover shadow-sm"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 border border-blue-200 text-xs flex-shrink-0 font-bold shadow-sm">
                            {u.name ? u.name[0].toUpperCase() : "?"}
                          </span>
                        )}
                        <span className="truncate max-w-[80px] sm:max-w-none font-bold">
                          {u.name}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-center font-bold whitespace-nowrap text-blue-700 text-xs sm:text-lg">
                        {u.totalScore ?? "-"}
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-center whitespace-nowrap text-green-600 font-bold text-xs sm:text-lg">
                        {u.winCount ?? "-"}
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-center whitespace-nowrap text-red-600 font-bold text-xs sm:text-lg">
                        {u.loseCount ?? "-"}
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-center whitespace-nowrap text-gray-600 font-bold text-xs sm:text-lg">
                        {u.drawCount ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-4 sm:py-6 px-2 sm:px-6 text-gray-500 text-xs sm:text-sm italic bg-gray-50">
                Chưa có dữ liệu người chơi
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Thắng</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Thua</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
          <span>Hòa</span>
        </div>
      </div>
    </div>
  );
}
