import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import "./CoinShop.css";
// Giả sử bạn đã có Stripe public key và backend xử lý thanh toán
// Các gói coin mẫu
const coinPackages = [
  { id: "coin_10", amount: 10, price: 10 },
  { id: "coin_50", amount: 50, price: 50 },
  { id: "coin_100", amount: 100, price: 85 },
  { id: "coin_500", amount: 500, price: 399 },
];

function CoinShop({ userId }) {
  const [userInfo, setUserInfo] = useState({ name: "", avatar: "", coin: 0 });
  // Hàm fetch user info để tái sử dụng, dùng useCallback để tránh warning
  const fetchUserInfo = React.useCallback(() => {
    const API_URL = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");
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
  const stripePromise = loadStripe(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ""
  );
  const [clientSecret, setClientSecret] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // ...existing code...
  const handleBuy = async (pkg) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "";
      const res = await fetch(`${apiUrl}/items/create-coin-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ packageId: pkg.id, userId }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSelectedPkg(pkg);
        setShowModal(true);
      } else {
        alert(data.error || "Không thể tạo phiên thanh toán");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-start mb-3">
        <button
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-xs transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 whitespace-nowrap"
          onClick={() => navigate("/rooms")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>Trở Lại Phòng Chát</span>
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
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-600">
          Mua Coin
        </h2>
        <span className="text-xl">✨</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {coinPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="group flex flex-col bg-white border border-yellow-100 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                <span className="text-lg">🪙</span>
              </div>
              <span className="font-bold text-yellow-700 text-lg">
                {pkg.amount}{" "}
                <span className="text-yellow-600 text-sm">Coin</span>
              </span>
            </div>
            <div className="mt-auto pt-2 border-t border-yellow-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">Giá:</span>
                <span className="text-base font-bold text-green-600">
                  {pkg.price.toLocaleString()}$
                </span>
              </div>
              <button
                className="w-full py-2 px-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-lg font-bold shadow-sm hover:shadow-md hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 flex items-center justify-center gap-1 text-sm"
                onClick={() => handleBuy(pkg)}
              >
                <span>Mua ngay</span>
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
              </button>
            </div>
          </div>
        ))}
      </div>
      {showModal && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentModal
            pkg={selectedPkg}
            clientSecret={clientSecret}
            onClose={() => setShowModal(false)}
            onPaymentSuccess={fetchUserInfo}
          />
        </Elements>
      )}

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Giao dịch an toàn, bảo mật bởi Stripe</span>
        </div>
      </div>
    </div>
  );
}

export default CoinShop;
// ...existing code...

function PaymentModal({ pkg, clientSecret, onClose, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // clientSecret nhận từ prop

  // Thêm useEffect để xử lý thêm/xóa class khi modal mở
  React.useEffect(() => {
    // Thêm class vào body khi component được mount
    document.body.classList.add("payment-modal-open");

    // Clean up function để xóa class khi component unmount
    return () => {
      document.body.classList.remove("payment-modal-open");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!stripe || !elements || !clientSecret) {
      setError("Không tìm thấy clientSecret cho thanh toán");
      setLoading(false);
      return;
    }
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else if (
      result.paymentIntent &&
      result.paymentIntent.status === "succeeded"
    ) {
      setSuccess(true);
      if (typeof onPaymentSuccess === "function") {
        onPaymentSuccess();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50 p-2"
      style={{ touchAction: "none" }}
    >
      <div
        className="payment-wrapper bg-white rounded-lg shadow-lg p-3 w-full max-w-[300px] animate-fadeIn transform transition-all duration-300"
        style={{ touchAction: "pan-y", userSelect: "none" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100">
              <span className="text-sm">🪙</span>
            </div>
            <h3 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-700">
              Thanh toán <span className="font-extrabold">{pkg.amount}</span>{" "}
              Coin
            </h3>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
          <div className="p-2 bg-gray-50 border border-gray-100 rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px", // Tăng kích thước font để tránh bị zoom
                    fontWeight: "500",
                    color: "#4B5563",
                    "::placeholder": {
                      color: "#9CA3AF",
                    },
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1 text-red-600 text-xs bg-red-50 p-1.5 rounded-md border border-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-600 mb-0.5">
                  Thanh toán thành công!
                </div>
                <p className="text-gray-600 text-xs">
                  Đã cộng{" "}
                  <span className="font-bold text-yellow-700">
                    {pkg.amount} coin
                  </span>{" "}
                  vào tài khoản
                </p>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="py-1.5 px-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-md font-bold shadow-sm hover:shadow-md hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 flex items-center justify-center gap-1.5 relative overflow-hidden text-xs"
              disabled={loading || !stripe}
            >
              {loading ? (
                <div className="flex items-center gap-1">
                  <svg
                    className="animate-spin h-3 w-3 text-white"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <>
                  <span>Xác nhận thanh toán</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </form>

        {!success && (
          <div className="mt-2 text-center text-[10px] text-gray-500">
            <p>Giao dịch được bảo mật bởi Stripe</p>
          </div>
        )}

        {success && (
          <div className="flex flex-col gap-1.5 mt-1">
            <button
              className="w-full py-1 px-2 bg-gray-100 rounded-md text-gray-700 font-medium hover:bg-gray-200 transition-colors text-xs"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
