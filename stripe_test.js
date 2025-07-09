// Stripe payment intent API test (Node.js, dùng với Jest hoặc chạy trực tiếp bằng node)
// Cần cài: npm install axios

const axios = require("axios");

async function testCreatePaymentIntent() {
  try {
    // Gửi thêm userId và itemId để test metadata
    const response = await axios.post(
      "https://m35vxg11jc.execute-api.ap-southeast-1.amazonaws.com/prod/payments/create-payment-intent",
      {
        amount: 10000, // số tiền test (ví dụ: 100 USD nếu đơn vị là cent)
        currency: "usd",
        userId: "685d2558e25fb6b90efff6c5",
        itemId: "685e07d3509937e71714b9bb",
      }
    );
    console.log("Kết quả:", response.data);
    if (response.data && response.data.clientSecret) {
      console.log("Tạo payment intent thành công!");
    } else {
      console.error("Không nhận được clientSecret!");
    }
  } catch (err) {
    if (err.response) {
      console.error("Lỗi từ server:", err.response.status, err.response.data);
    } else {
      console.error("Lỗi:", err.message);
    }
  }
}

// Chạy test
if (require.main === module) {
  testCreatePaymentIntent();
}
