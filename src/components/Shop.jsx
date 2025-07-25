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
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full font-semibold text-sm shadow-md border border-blue-400 transition-all duration-150"
          onClick={() => navigate("/rooms")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-0.5"
            fill="none"
            viewBox="0 0 20 20"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
              fill="none"
              stroke="white"
            />
          </svg>
          <span>Về phòng chat</span>
        </button>
      </div>
      {/* User Card */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-gradient-to-r from-blue-100/80 to-indigo-100/60 shadow border border-blue-200 w-fit mx-auto">
        {userInfo.avatar ? (
          <img
            src={userInfo.avatar}
            alt="avatar"
            className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-md object-cover bg-white"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-md object-cover bg-white flex items-center justify-center text-2xl text-blue-400 font-bold">
            {userInfo.name ? userInfo.name[0] : "U"}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-xl text-blue-900">
            {userInfo.name}
          </span>
          <span className="flex items-center gap-1 text-yellow-600 font-bold text-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => {
            const itemKey = item._id || item.id || item.name;
            const quantity = Number(quantityMap[itemKey]) || 1;
            return (
              <div
                key={itemKey}
                className="group border-2 border-blue-100 rounded-2xl p-5 bg-white shadow-lg flex flex-col gap-3 hover:border-blue-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-lg text-blue-800 flex items-center gap-2">
                    <span className="inline-block text-2xl">🎁</span>{" "}
                    {item.name}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold uppercase tracking-wide">
                    {item.type}
                  </span>
                </div>
                {item.description && (
                  <div className="text-gray-600 text-sm mb-1">
                    {item.description}
                  </div>
                )}
                {item.effect && (
                  <div className="text-green-700 text-xs italic mb-1">
                    Hiệu ứng: {item.effect}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="font-bold text-orange-600 text-base">
                    <span className="inline-flex items-center gap-1 align-middle">
                      Giá: {item.price}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 align-middle"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ display: "inline", verticalAlign: "middle" }}
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
                          y="13.5"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#bfa100"
                          alignmentBaseline="middle"
                          dominantBaseline="middle"
                          style={{
                            fontWeight: 700,
                            fontFamily: "inherit",
                            alignmentBaseline: "middle",
                            dominantBaseline: "middle",
                          }}
                        >
                          ₵
                        </text>
                      </svg>
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 font-bold text-xl border border-blue-200 shadow-sm transition-all duration-150 active:scale-90 disabled:opacity-50"
                      onClick={() =>
                        setQuantityMap((q) => ({
                          ...q,
                          [itemKey]: Math.max(1, quantity - 1),
                        }))
                      }
                      disabled={quantity <= 1}
                      tabIndex={-1}
                      aria-label="Giảm số lượng"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <rect
                          x="5"
                          y="9"
                          width="10"
                          height="2"
                          rx="1"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantityMap((q) => ({
                          ...q,
                          [itemKey]: Math.max(1, Number(e.target.value)),
                        }))
                      }
                      className="w-14 px-2 py-1 border border-blue-200 rounded-lg text-center text-base font-semibold focus:ring-2 focus:ring-blue-300 outline-none bg-white shadow-sm"
                      style={{ minWidth: 44 }}
                      title="Số lượng"
                    />
                    <button
                      type="button"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 font-bold text-xl border border-blue-200 shadow-sm transition-all duration-150 active:scale-90"
                      onClick={() =>
                        setQuantityMap((q) => ({
                          ...q,
                          [itemKey]: quantity + 1,
                        }))
                      }
                      tabIndex={-1}
                      aria-label="Tăng số lượng"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <rect
                          x="9"
                          y="5"
                          width="2"
                          height="10"
                          rx="1"
                          fill="currentColor"
                        />
                        <rect
                          x="5"
                          y="9"
                          width="10"
                          height="2"
                          rx="1"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg px-5 py-2 font-bold text-base shadow-md transition-all duration-200 border border-green-400 disabled:opacity-60 flex items-center justify-center gap-2 group-hover:scale-105 group-active:scale-95"
                  disabled={buyingId === itemKey}
                  onClick={() => handleBuy(itemKey)}
                >
                  {buyingId === itemKey ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-1"
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
                      Đang mua...
                    </>
                  ) : (
                    <>
                      <span>Mua</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
