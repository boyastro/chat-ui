import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Component hiển thị danh sách vật phẩm từ API Opponent Shop
export default function Shop() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/items`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi khi lấy danh sách vật phẩm");
        return res.json();
      })
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Lỗi không xác định");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="text-center py-6">Đang tải danh sách vật phẩm...</div>
    );
  if (error)
    return <div className="text-center text-red-500 py-6">{error}</div>;

  return (
    <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
      <button
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg font-semibold shadow hover:from-blue-500 hover:to-indigo-600 transition"
        onClick={() => navigate("/rooms")}
      >
        <span className="text-lg">⬅️</span>
        <span>Quay lại chọn phòng</span>
      </button>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        🛒 Shop - Danh Sách Vật Phẩm
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item._id || item.id || item.name}
            className="border rounded-xl p-4 bg-gray-50 shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg text-gray-800">
                {item.name}
              </span>
              <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium capitalize">
                {item.type}
              </span>
            </div>
            {item.description && (
              <div className="text-gray-600 text-sm">{item.description}</div>
            )}
            {item.effect && (
              <div className="text-green-700 text-xs italic">
                Hiệu ứng: {item.effect}
              </div>
            )}
            <div className="mt-2 font-bold text-right text-orange-600">
              Giá: {item.price} 💰
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
