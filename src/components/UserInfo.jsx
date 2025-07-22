import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function UserInfo({ userId }) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [itemInfoMap, setItemInfoMap] = useState({}); // Lưu thông tin vật phẩm theo id
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!userId) throw new Error("Không tìm thấy userId");
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_URL}/users/${userId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (!res.ok) throw new Error("Không thể lấy thông tin người dùng");
        const data = await res.json();
        setUserInfo(data.user || data);
      } catch (err) {
        setError(err.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Lấy thông tin vật phẩm inventory nếu có
  useEffect(() => {
    if (
      !userInfo ||
      !Array.isArray(userInfo.inventory) ||
      userInfo.inventory.length === 0
    )
      return;
    const token = localStorage.getItem("token");
    const API = API_URL;
    // Lọc ra các item id chưa có trong itemInfoMap
    const missingIds = userInfo.inventory
      .map((inv) => inv.item)
      .filter((id) => id && !itemInfoMap[id]);
    if (missingIds.length === 0) return;
    Promise.all(
      missingIds.map((id) =>
        fetch(`${API}/items/${id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => ({ id, data }))
          .catch(() => ({ id, data: null }))
      )
    ).then((results) => {
      const newMap = { ...itemInfoMap };
      results.forEach(({ id, data }) => {
        if (data && data.name) newMap[id] = data;
      });
      setItemInfoMap(newMap);
    });
    // eslint-disable-next-line
  }, [userInfo]);

  if (!userId) {
    return (
      <div className="max-w-md mx-auto my-10 bg-white rounded-xl shadow-md p-6 text-center">
        <div className="text-red-500">
          Không tìm thấy userId. Vui lòng đăng nhập lại.
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="text-center p-4">Đang tải thông tin người dùng...</div>
    );
  }
  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }
  if (!userInfo) {
    return (
      <div className="max-w-md mx-auto my-10 bg-white rounded-xl shadow-md p-6 text-center">
        <div className="text-gray-500">Không có thông tin người dùng.</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-10">
      <button
        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition mb-6 shadow-md"
        onClick={() => navigate("/rooms")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
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
        Quay lại
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header với gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-6 px-6 text-white">
          <div className="flex items-center justify-center">
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold shadow-lg">
                {(userInfo.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-center mt-4">
            {userInfo.name || userInfo.username || "Người dùng"}
          </h2>
          <p className="text-blue-100 text-center text-sm mt-1">
            ID: {userInfo.userId || userInfo.id || userInfo._id}
          </p>
        </div>

        {/* Thông tin chi tiết */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Tên</div>
              <div className="font-medium">{userInfo.name || "—"}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Tuổi</div>
              <div className="font-medium">{userInfo.age || "—"}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Level</div>
              <div className="font-medium flex items-center">
                <span className="mr-2">{userInfo.level || "0"}</span>
                {userInfo.level && (
                  <div className="h-2 flex-grow bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(userInfo.level * 10, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Score</div>
              <div className="font-medium text-blue-600">
                {userInfo.score || "0"}
              </div>
            </div>

            {userInfo.email && (
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Email</div>
                <div className="font-medium">{userInfo.email}</div>
              </div>
            )}
          </div>

          {/* INVENTORY */}
          {Array.isArray(userInfo.inventory) &&
            userInfo.inventory.length > 0 && (
              <div className="mt-8">
                <div className="font-bold text-lg text-green-700 mb-2 flex items-center gap-2">
                  <span className="text-base">🎒</span> Kho vật phẩm
                </div>
                <ul className="divide-y divide-gray-200 bg-gradient-to-b from-green-50 to-white rounded-lg border border-green-200 shadow-sm">
                  {userInfo.inventory.map((inv) => {
                    const item = itemInfoMap[inv.item];
                    return (
                      <li
                        key={inv._id || inv.item}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-green-900 text-base flex items-center gap-2">
                            <span className="text-sm">🧩</span>
                            {item ? (
                              item.name
                            ) : (
                              <span className="italic text-gray-400">
                                Đang tải...
                              </span>
                            )}
                          </div>
                          {item && (
                            <div className="text-xs text-gray-600 mt-1">
                              {item.type && (
                                <span className="mr-2">
                                  Loại:{" "}
                                  <span className="font-medium text-green-700">
                                    {item.type}
                                  </span>
                                </span>
                              )}
                              {item.effect && (
                                <span>
                                  Hiệu ứng:{" "}
                                  <span className="font-medium text-green-700">
                                    {item.effect}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right font-bold text-orange-700 text-sm min-w-[60px]">
                          x{inv.quantity || 1}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
