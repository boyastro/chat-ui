import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function UserInfo() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy userId từ token
  let userId = null;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.userId || payload.id || payload._id || payload.uid;
    } catch (e) {}
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) throw new Error("Không tìm thấy token đăng nhập");
        if (!userId) throw new Error("Không tìm thấy userId");
        const res = await fetch(`${API_URL}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
  }, [token]);

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
        </div>
      </div>
    </div>
  );
}
