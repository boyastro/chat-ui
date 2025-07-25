import React, { useState } from "react";
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

export default function CoinShop({ userId }) {
  const stripePromise = loadStripe(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ""
  );
  const [clientSecret, setClientSecret] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);

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
    <div className="max-w-4xl mx-auto my-10 p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100">
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="text-3xl">✨</span>
        <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-600">
          Mua Coin
        </h2>
        <span className="text-3xl">✨</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coinPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="group flex flex-col h-full bg-white border-2 border-yellow-100 rounded-2xl p-6 shadow-md hover:shadow-xl hover:border-yellow-300 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                <span className="text-2xl">🪙</span>
              </div>
              <span className="font-extrabold text-yellow-700 text-2xl">
                {pkg.amount}{" "}
                <span className="text-yellow-600 text-lg">Coin</span>
              </span>
            </div>
            <div className="mt-auto pt-4 border-t border-yellow-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-medium text-gray-500">
                  Giá:
                </span>
                <span className="text-xl font-bold text-green-600">
                  {pkg.price.toLocaleString()}$
                </span>
              </div>
              <button
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 flex items-center justify-center gap-2"
                onClick={() => handleBuy(pkg)}
              >
                <span>Mua ngay</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
          />
        </Elements>
      )}

      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-500"
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

function PaymentModal({ pkg, clientSecret, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // clientSecret nhận từ prop

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
      setTimeout(onClose, 2000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[380px] w-full max-w-md animate-fadeIn transform transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
              <span className="text-xl">🪙</span>
            </div>
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-700">
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
                className="h-6 w-6"
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

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
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
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
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
                <div className="text-xl font-bold text-green-600 mb-1">
                  Thanh toán thành công!
                </div>
                <p className="text-gray-600">
                  Bạn được cộng thêm{" "}
                  <span className="font-bold text-yellow-700">
                    {pkg.amount} coin
                  </span>{" "}
                  vào tài khoản.
                </p>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden"
              disabled={loading || !stripe}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                    className="h-5 w-5"
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
          <div className="mt-5 text-center text-sm text-gray-500">
            <p>Giao dịch được bảo mật bởi Stripe</p>
          </div>
        )}

        {success && (
          <button
            className="mt-4 w-full py-2 px-4 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
