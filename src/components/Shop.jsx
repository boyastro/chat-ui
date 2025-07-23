import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Component hiển thị danh sách vật phẩm từ API Opponent Shop
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    setError("");
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
    if (stripeError) {
      setError(stripeError.message);
      setPaying(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      setError("Thanh toán thất bại. Vui lòng thử lại.");
      setPaying(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-auto"
    >
      <div className="mb-1">
        <label className="block text-gray-700 font-semibold mb-2 text-lg">
          Nhập thông tin thẻ
        </label>
        <div className="rounded-lg border-2 border-blue-200 focus-within:border-blue-500 transition bg-gray-50 px-3 py-2">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "18px",
                  color: "#22223b",
                  "::placeholder": { color: "#a0aec0" },
                  fontFamily: "inherit",
                  letterSpacing: "0.03em",
                },
                invalid: { color: "#e53e3e" },
              },
            }}
            className="bg-white rounded-md px-2 py-3 border-none outline-none"
          />
        </div>
      </div>
      {error && (
        <div className="text-red-500 mb-2 text-sm text-center">{error}</div>
      )}
      <div className="flex gap-3 justify-center mt-2">
        <button
          type="submit"
          disabled={paying || !stripe}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-semibold shadow disabled:opacity-60 text-base"
        >
          {paying ? "Đang thanh toán..." : "Xác nhận thanh toán"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold shadow border border-gray-300 hover:bg-gray-300 text-base"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

export default function Shop({ userId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [buyMessage, setBuyMessage] = useState("");
  const [quantityMap, setQuantityMap] = useState({});
  const [clientSecret, setClientSecret] = useState("");
  const [showPayment, setShowPayment] = useState(false);

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
    setClientSecret("");
    setShowPayment(false);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem("token");
      const quantity =
        Number(quantityMap[itemId]) > 0 ? Number(quantityMap[itemId]) : 1;
      const res = await fetch(`${API_URL}/items/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ userId, itemId, quantity }),
      });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
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
      {/* Modal overlay for payment */}
      {showPayment && clientSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative w-full max-w-lg mx-auto">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={() => {
                  setShowPayment(false);
                  setClientSecret("");
                  setBuyMessage("");
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow border border-gray-300 focus:outline-none"
                aria-label="Đóng"
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
            </div>
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 p-8 pt-10 relative animate-fadeInUp">
              <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">
                Thanh toán vật phẩm
              </h3>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={() => {
                    setShowPayment(false);
                    setClientSecret("");
                    setBuyMessage(
                      "Thanh toán thành công! Vật phẩm sẽ được cộng vào kho của bạn."
                    );
                  }}
                  onCancel={() => {
                    setShowPayment(false);
                    setClientSecret("");
                    setBuyMessage("");
                  }}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}
      <div
        className={showPayment ? "pointer-events-none blur-sm select-none" : ""}
      >
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
