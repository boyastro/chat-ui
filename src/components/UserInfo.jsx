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
    <div className="max-w-md mx-auto my-10 bg-white rounded-xl shadow-md p-6">
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition self-start"
        onClick={() => navigate("/rooms")}
      >
        ← Quay lại
      </button>
      <div className="flex flex-col items-center">
        {userInfo.avatar && (
          <img
            src={userInfo.avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full mb-4 border-2 border-blue-400 object-cover"
          />
        )}
        <h2 className="text-2xl font-bold text-blue-600 mb-2">
          {userInfo.name || userInfo.username || "Người dùng"}
        </h2>
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">ID:</span>{" "}
          {userInfo.userId || userInfo.id || userInfo._id}
        </div>
        {/* Hiển thị các trường thông tin cơ bản */}
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Tên:</span> {userInfo.name}
        </div>
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Tuổi:</span> {userInfo.age}
        </div>
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Level:</span> {userInfo.level}
        </div>
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Score:</span> {userInfo.score}
        </div>
        {userInfo.email && (
          <div className="text-gray-700 mb-1">
            <span className="font-semibold">Email:</span> {userInfo.email}
          </div>
        )}
      </div>
    </div>
  );
}
