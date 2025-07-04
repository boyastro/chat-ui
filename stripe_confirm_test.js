// Test xác nhận payment intent Stripe bằng Node.js (chỉ dùng cho môi trường test)
// Hướng dẫn sử dụng:
// 1. Cài Stripe SDK: npm install stripe
// 2. Lấy clientSecret từ bước tạo payment intent (stripe_test.js)
// 3. Thay sk_test_xxx bằng secret key test của bạn (lấy ở Stripe Dashboard)
// 4. Chạy: node stripe_confirm_test.js

const STRIPE_SECRET_KEY =
  "sk_test_51RgjJ6Rkaxke7LhDpjIbwnErFMVfJlzRdByCqvDqwhAEqVNg8UXGiqqVxDgCeA3H99i9MH0Eh0Pk3b4Tc8JXecwQ00E0wlJfct"; // <--- Thay bằng secret key test của bạn
const CLIENT_SECRET =
  "pi_3RgzdrRkaxke7LhD1lIsGNV6_secret_EyBdbKaEnBwGOhWZDLCCqxnIG"; // <--- Thay bằng clientSecret bạn nhận được

const stripe = require("stripe")(STRIPE_SECRET_KEY);

async function confirmTestPaymentIntent(clientSecret) {
  // Lấy paymentIntentId từ clientSecret
  const paymentIntentId = clientSecret.split("_secret")[0];
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa", // payment method test của Stripe
    });
    console.log("Trạng thái:", paymentIntent.status); // 'succeeded' nếu thành công
    if (paymentIntent.status === "succeeded") {
      console.log("Xác nhận thanh toán thành công!");
    } else {
      console.log("Chưa thành công:", paymentIntent.status);
    }
  } catch (err) {
    console.error("Lỗi xác nhận:", err.message);
  }
}

// Chạy trực tiếp file này để test xác nhận payment intent
if (require.main === module) {
  if (
    STRIPE_SECRET_KEY === "sk_test_xxx" ||
    CLIENT_SECRET === "pi_xxx_secret_xxx"
  ) {
    console.error(
      "Vui lòng thay STRIPE_SECRET_KEY và CLIENT_SECRET bằng giá trị thực tế trước khi chạy!"
    );
  } else {
    confirmTestPaymentIntent(CLIENT_SECRET);
  }
}

module.exports = { confirmTestPaymentIntent };
