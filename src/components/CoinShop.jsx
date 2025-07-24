import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
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
    <div className="max-w-lg mx-auto my-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6 text-yellow-600">
        Mua Coin
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {coinPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex flex-col sm:flex-row items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪙</span>
              <span className="font-bold text-yellow-700 text-lg">
                {pkg.amount} Coin
              </span>
            </div>
            <div className="flex flex-col items-end gap-2 mt-2 sm:mt-0">
              <span className="text-base font-semibold text-gray-700">
                Giá:{" "}
                <span className="text-green-700">
                  {pkg.price.toLocaleString()}$
                </span>
              </span>
              <button
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg font-bold shadow hover:from-yellow-500 hover:to-yellow-700 transition"
                onClick={() => handleBuy(pkg)}
              >
                Mua ngay
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[320px] flex flex-col items-center">
        <div className="text-xl font-bold mb-2 text-yellow-700">
          Thanh toán {pkg.amount} Coin
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <CardElement
            options={{
              style: { base: { fontSize: "18px" } },
              hidePostalCode: true,
            }}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success ? (
            <div className="text-green-600 font-bold">
              Thanh toán thành công!
              <br />
              Bạn được cộng thêm{" "}
              <span className="text-yellow-700">{pkg.amount} coin</span> vào tài
              khoản.
            </div>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 text-white rounded font-bold shadow hover:bg-yellow-600 transition"
              disabled={loading || !stripe}
            >
              {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </button>
          )}
        </form>
        <button
          className="mt-4 px-3 py-1 bg-gray-300 rounded text-gray-700 font-semibold"
          onClick={onClose}
          disabled={loading}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
