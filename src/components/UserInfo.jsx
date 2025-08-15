import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserInfo({ userId }) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [itemInfoMap, setItemInfoMap] = useState({}); // Lưu thông tin vật phẩm theo id
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;

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
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-10 flex flex-col items-center border border-blue-100 animate-fade-in">
          <div className="mb-4">
            <svg
              className="animate-spin h-10 w-10 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
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
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>
          <div className="text-lg font-semibold text-blue-700 mb-1">
            Đang tải thông tin người dùng...
          </div>
          <div className="text-blue-400 text-sm">
            Vui lòng chờ trong giây lát
          </div>
        </div>
      </div>
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
    <div className="max-w-lg mx-auto my-10 px-4">
      <button
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full font-semibold shadow-md transition-all duration-300 mb-6 text-sm transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
        onClick={() => navigate("/rooms")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
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
        Về phòng chat
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
        {/* Header với gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-8 px-6 text-white relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/20"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/20"></div>
          </div>
          <div className="flex items-center justify-center relative z-10">
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt="avatar"
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-lg ring-4 ring-blue-300/30"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold shadow-lg border-4 border-white ring-4 ring-blue-300/30">
                {(userInfo.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-center mt-5 text-white drop-shadow-sm">
            {userInfo.name || userInfo.username || "Người dùng"}
          </h2>
          <p className="text-blue-100 text-center text-sm mt-1.5">
            ID: {userInfo.userId || userInfo.id || userInfo._id}
          </p>
        </div>

        {/* Thông tin chi tiết */}
        <div className="p-6 bg-gradient-to-b from-white to-blue-50/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Tên</span>
              </div>
              <div className="font-medium text-blue-900">
                {userInfo.name || "—"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Tuổi</span>
              </div>
              <div className="font-medium text-blue-900">
                {userInfo.age || "—"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                <span>Level</span>
              </div>
              <div className="font-medium flex items-center">
                <span className="mr-2 text-blue-900 font-semibold">
                  {userInfo.level || "0"}
                </span>
                {userInfo.level && (
                  <div className="h-2.5 flex-grow bg-blue-100 rounded-full">
                    <div
                      className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"
                      style={{
                        width: `${Math.min(userInfo.level * 10, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Score</span>
              </div>
              <div className="font-semibold text-blue-600">
                {userInfo.score || "0"}
              </div>
            </div>
            {/* Coin */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl shadow-md border border-yellow-200 col-span-2 hover:shadow-lg transition-shadow duration-300">
              <div className="text-sm text-yellow-700 mb-2 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Coin</span>
              </div>
              <div className="font-bold text-yellow-700 text-2xl flex items-center gap-2">
                {userInfo.coin ?? 0}
                <span className="text-yellow-500 text-sm">đồng</span>
              </div>
            </div>

            {userInfo.email && (
              <div className="col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>Email</span>
                </div>
                <div className="font-medium text-blue-900">
                  {userInfo.email}
                </div>
              </div>
            )}
          </div>

          {/* INVENTORY */}
          {Array.isArray(userInfo.inventory) &&
            userInfo.inventory.length > 0 && (
              <div className="mt-10">
                <div className="font-bold text-lg text-green-700 mb-4 flex items-center gap-2 border-b border-green-100 pb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
                      clipRule="evenodd"
                    />
                    <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                  </svg>
                  <span>Kho vật phẩm</span>
                </div>
                <ul className="divide-y divide-gray-100 rounded-xl border border-green-100 shadow-md overflow-hidden">
                  {userInfo.inventory.map((inv) => {
                    const item = itemInfoMap[inv.item];
                    return (
                      <li
                        key={inv._id || inv.item}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white hover:bg-green-50 transition-colors duration-150"
                      >
                        <div>
                          <div className="font-semibold text-green-800 text-base flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            {item ? (
                              item.name
                            ) : (
                              <span className="italic text-gray-400 flex items-center gap-1">
                                <svg
                                  className="animate-spin h-3 w-3"
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
                                Đang tải...
                              </span>
                            )}
                          </div>
                          {item && (
                            <div className="text-xs text-gray-600 mt-1 ml-9">
                              {item.type && (
                                <span className="mr-3">
                                  Loại:{" "}
                                  <span className="font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                    {item.type}
                                  </span>
                                </span>
                              )}
                              {item.effect && (
                                <span>
                                  Hiệu ứng:{" "}
                                  <span className="font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                    {item.effect}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="sm:text-right font-bold text-orange-700 text-sm min-w-[60px] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
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
