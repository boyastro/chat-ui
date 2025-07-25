import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import Stripe dependencies removed

export default function Shop({ userId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [buyMessage, setBuyMessage] = useState("");
  const [quantityMap, setQuantityMap] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleBuy = async (itemId) => {
    setBuyingId(itemId);
    setBuyMessage("");
    let quantity = Number(quantityMap[itemId]);
    if (!quantity || quantity < 1) quantity = 1;
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/items/buy-coin-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ userId, itemId, quantity }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowSuccess(true);
        setBuyMessage("");
      } else {
        setBuyMessage(data.message || data.error || "Mua thất bại!");
      }
    } catch (err) {
      setBuyMessage("Lỗi khi mua vật phẩm!");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200 relative">
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
      {buyMessage && (
        <div className="mb-4 text-center font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-4">
          {buyMessage}
        </div>
      )}
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-green-300 p-8 max-w-sm w-full flex flex-col items-center animate-fadeInUp">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-full p-4 mb-4 border-4 border-green-200">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2 text-center">
                Mua thành công!
              </h2>
              <p className="text-green-800 text-center mb-6">
                Vật phẩm đã được cộng vào kho của bạn.
              </p>
              <button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition text-base"
                onClick={() => {
                  setShowSuccess(false);
                  setBuyMessage("");
                }}
              >
                Quay lại Shop
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
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
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-bold text-orange-600">
                  Giá: {item.price} 💰
                </span>
                <input
                  type="number"
                  min={1}
                  value={quantityMap[item._id || item.id || item.name] || 1}
                  onChange={(e) =>
                    setQuantityMap((q) => ({
                      ...q,
                      [item._id || item.id || item.name]: e.target.value,
                    }))
                  }
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-green-400 outline-none"
                  style={{ minWidth: 48 }}
                  title="Số lượng"
                />
              </div>
              <button
                className="mt-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg px-4 py-2 font-semibold text-sm shadow-md transition border border-green-400 disabled:opacity-60"
                disabled={buyingId === (item._id || item.id || item.name)}
                onClick={() => handleBuy(item._id || item.id || item.name)}
              >
                {buyingId === (item._id || item.id || item.name)
                  ? "Đang mua..."
                  : "Mua"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
