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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [quantityMap, setQuantityMap] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  // User info state
  const [userInfo, setUserInfo] = useState({ name: "", avatar: "", coin: 0 });

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
    // Fetch items
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
    // Fetch user info
    fetch(`${API_URL}/users/${userId || "me"}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUserInfo({
            name: data.name || data.username || "User",
            avatar:
              data.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                data.name || data.username || "U"
              )}&background=random`,
            coin: data.coin || data.coins || 0,
          });
        }
      });
  }, [userId]);

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
        // Fetch only coin value to update
        fetch(`${API_URL}/users/${userId || "me"}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setUserInfo((prev) => ({
                ...prev,
                coin: data.coin || data.coins || 0,
              }));
            }
          });
      } else {
        setBuyMessage(data.message || data.error || "Mua thất bại!");
        setShowErrorModal(true);
      }
    } catch (err) {
      setBuyMessage("Lỗi khi mua vật phẩm!");
      setShowErrorModal(true);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-8 border border-blue-100 relative overflow-hidden">
      {/* Back Button */}
      <div className="flex justify-start mb-6">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg font-semibold shadow hover:from-blue-500 hover:to-indigo-600 transition"
          onClick={() => navigate("/rooms")}
        >
          <span className="text-lg">⬅️</span>
          <span>Quay lại chọn phòng</span>
        </button>
      </div>
      {/* User Card */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-blue-100/80 to-indigo-100/60 shadow border border-blue-200 w-fit mx-auto">
        <img
          src={userInfo.avatar}
          alt="avatar"
          className="w-14 h-14 rounded-full border-2 border-blue-300 shadow-sm object-cover bg-white"
        />
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-lg text-blue-900">
            {userInfo.name}
          </span>
          <span className="flex items-center gap-1 text-yellow-600 font-bold text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="gold"
                strokeWidth="2"
                fill="#ffe066"
              />
              <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="10"
                fill="#bfa100"
              >
                ₵
              </text>
            </svg>
            {userInfo.coin} coin
          </span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        🛒 Shop - Danh Sách Vật Phẩm
      </h2>
      {/* Error Modal */}
      {showErrorModal && buyMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-300 p-6 max-w-sm w-full flex flex-col items-center animate-fadeInUp">
            <div className="flex flex-col items-center">
              <div className="bg-red-100 rounded-full p-3 mb-4 border-4 border-red-200">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-700 mb-2 text-center">
                Có lỗi xảy ra
              </h2>
              <p className="text-red-800 text-center mb-6">{buyMessage}</p>
              <button
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-red-600 hover:to-pink-600 transition text-base"
                onClick={() => {
                  setShowErrorModal(false);
                  setBuyMessage("");
                }}
              >
                Đóng
              </button>
            </div>
          </div>
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
