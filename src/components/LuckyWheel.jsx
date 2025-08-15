import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CoinIcon from "./CoinIcon";

// Dữ liệu giải thưởng với màu sắc được định nghĩa sẵn
const prizes = [
  { label: "10   ", value: 10, color: "#fef08a", showCoin: true },
  { label: "Quay lại", value: "retry", color: "#e5e7eb", showCoin: false },
  { label: "50   ", value: 50, color: "#fcd34d", showCoin: true },
  { label: "10   ", value: 10, color: "#a5b4fc", showCoin: true },
  { label: "5   ", value: 5, color: "#e5e7eb", showCoin: true },
  { label: "20   ", value: 20, color: "#fcd34d", showCoin: true },
  { label: "Vật Phẩm", value: "rare", color: "#a5b4fc", showCoin: false },
  { label: "30   ", value: 30, color: "#fef08a", showCoin: true },
];

const segmentCount = prizes.length;
const segmentAngle = 360 / segmentCount;
export default function LuckyWheel({ onWin, userId }) {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [angle, setAngle] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState("5000ms");
  const [wheelSize, setWheelSize] = useState({ width: 420, height: 420 });
  const [spinsLeft, setSpinsLeft] = useState(null); // Số lượt quay còn lại
  // Đã bỏ biến spinCountToday vì không sử dụng
  // Đã bỏ biến coin vì không sử dụng

  // Kiểm tra số lượt quay khi vào component
  useEffect(() => {
    async function fetchSpinStatus() {
      if (!userId) return;
      try {
        const token = localStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_API_URL || "";
        // Sử dụng GET để lấy số lượt quay còn lại
        const res = await fetch(`${apiUrl}/spin/getinfospin?userId=${userId}`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.spinsLeft !== undefined) {
          setSpinsLeft(data.spinsLeft);
        } else {
          setSpinsLeft(0);
        }
      } catch (err) {
        setSpinsLeft(0); // Nếu lỗi thì disable quay
      }
    }
    fetchSpinStatus();
  }, [userId]);
  // Responsive: điều chỉnh kích thước bánh xe theo màn hình
  useEffect(() => {
    function handleResize() {
      const screenWidth = window.innerWidth;
      const size = screenWidth < 768 ? Math.min(screenWidth - 40, 320) : 420;
      setWheelSize({ width: size, height: size });
    }

    handleResize(); // Chạy khi mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tạo refs để vẽ canvas
  const wheelRef = React.useRef(null);
  const arrowRef = React.useRef(null);

  // Vẽ vòng quay trên canvas
  useEffect(() => {
    if (!wheelRef.current) return;

    const canvas = wheelRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = wheelSize.width / 2;
    const centerY = wheelSize.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Điều chỉnh font size theo kích thước bánh xe
    const isMobile = wheelSize.width < 350;

    // Xóa canvas
    ctx.clearRect(0, 0, wheelSize.width, wheelSize.height);

    // Vẽ viền ngoài
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Vẽ các phần
    prizes.forEach((prize, i) => {
      // Vẽ phần bánh xe
      const startAngle = (i * segmentAngle * Math.PI) / 180;
      const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
      // Log góc bắt đầu, kết thúc và label
      console.log(
        `Phần ${i}: ${prize.label} | startAngle: ${(i * segmentAngle).toFixed(
          2
        )}° | endAngle: ${((i + 1) * segmentAngle).toFixed(2)}°`
      );

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = prize.color;
      ctx.fill();

      // Vẽ đường phân cách
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(startAngle),
        centerY + radius * Math.sin(startAngle)
      );
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#eab308";
      ctx.stroke();

      // Thêm text - đặt text ở vị trí tối ưu
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      const textRadius = radius * 0.65; // Đặt text ở vị trí tốt nhất để nhìn rõ
      const textX = centerX + textRadius * Math.cos(midAngle);
      const textY = centerY + textRadius * Math.sin(midAngle);

      // Lưu trạng thái canvas
      ctx.save();

      // Căn giữa text theo hướng của ô
      ctx.translate(textX, textY);
      ctx.rotate(midAngle + Math.PI / 2);

      // Chuẩn bị text - responsive font size
      const fontSize = isMobile ? 12 : 15;
      ctx.font = `bold ${fontSize}px Arial`;
      const textMetrics = ctx.measureText(prize.label);
      const textWidth = textMetrics.width + (isMobile ? 10 : 16); // Padding nhỏ hơn trên mobile
      const textHeight = isMobile ? 22 : 26; // Chiều cao nhỏ hơn trên mobile

      // Vẽ nền cho text (với đường viền)
      ctx.fillStyle = "rgba(255, 255, 255, 1.0)"; // Nền màu trắng đặc
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1.5; // Giảm độ đậm của đường viền

      // Tạo hình chữ nhật bo góc nhỏ gọn
      const borderRadius = 6;
      ctx.beginPath();
      ctx.moveTo(-textWidth / 2 + borderRadius, -textHeight / 2);
      ctx.arcTo(
        textWidth / 2,
        -textHeight / 2,
        textWidth / 2,
        textHeight / 2,
        borderRadius
      );
      ctx.arcTo(
        textWidth / 2,
        textHeight / 2,
        -textWidth / 2,
        textHeight / 2,
        borderRadius
      );
      ctx.arcTo(
        -textWidth / 2,
        textHeight / 2,
        -textWidth / 2,
        -textHeight / 2,
        borderRadius
      );
      ctx.arcTo(
        -textWidth / 2,
        -textHeight / 2,
        textWidth / 2,
        -textHeight / 2,
        borderRadius
      );
      ctx.closePath();

      ctx.fill();
      ctx.stroke();

      // Vẽ text
      ctx.fillStyle = "#000"; // Màu đen để tương phản tốt hơn
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Áp dụng hiệu ứng đổ bóng cho text để làm nổi bật hơn
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(prize.label, 0, 0);
      // Xóa hiệu ứng đổ bóng sau khi vẽ
      ctx.shadowColor = "transparent";

      // Vẽ icon đồng xu nếu cần
      if (prize.showCoin) {
        // Lưu context hiện tại
        ctx.save();
        // Di chuyển về vị trí ban đầu (0, 0) trong hệ tọa độ hiện tại

        // Nếu màn hình là mobile, giảm kích thước icon
        const coinSize = isMobile ? 10 : 12;
        // Vẽ đồng xu bên phải text
        ctx.translate(textWidth / 4, 0);

        // Vẽ vòng tròn nền vàng
        ctx.beginPath();
        ctx.arc(0, 0, coinSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffe066";
        ctx.fill();
        ctx.lineWidth = coinSize / 10;
        ctx.strokeStyle = "#bfa100";
        ctx.stroke();

        // Vẽ ký hiệu đồng xu "₵"
        ctx.fillStyle = "#bfa100";
        ctx.font = `bold ${coinSize * 0.8}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₵", 0, 1);

        // Khôi phục context
        ctx.restore();
      }

      // Khôi phục trạng thái canvas
      ctx.restore();
    });

    // Vẽ vòng tròn trung tâm nhỏ hơn - responsive size
    const centerSize = isMobile ? 35 : 50;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerSize, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = isMobile ? 3 : 4;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Thêm vòng tròn trang trí bên trong
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerSize * 0.8, 0, 2 * Math.PI);
    ctx.lineWidth = isMobile ? 1.5 : 2;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Thêm vòng tròn nhỏ nhất ở trung tâm để trang trí
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerSize * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = "#eab308";
    ctx.fill();
  }, [wheelSize]);

  // Vẽ mũi tên
  useEffect(() => {
    if (!arrowRef.current) return;

    const canvas = arrowRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 100, 100);

    // Vẽ mũi tên nhỏ hơn và nổi bật - điều chỉnh hướng mũi tên
    ctx.beginPath();
    ctx.moveTo(50, 70); // Đỉnh mũi tên - đặt ở dưới để trỏ vào bánh xe (nhỏ hơn)
    ctx.lineTo(30, 35); // Góc trái - đặt ở trên (di chuyển vào trong)
    ctx.lineTo(70, 35); // Góc phải - đặt ở trên (di chuyển vào trong)
    ctx.closePath();

    // Thêm hiệu ứng gradient - điều chỉnh vị trí gradient theo hướng mũi tên mới
    const gradient = ctx.createLinearGradient(50, 70, 50, 35);
    gradient.addColorStop(0, "#dc2626");
    gradient.addColorStop(1, "#b91c1c");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Thêm đường viền
    ctx.lineWidth = 2; // Giảm độ đậm đường viền
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Vẽ nút tròn ở đuôi mũi tên - di chuyển lên trên - nhỏ hơn
    ctx.beginPath();
    ctx.arc(50, 35, 15, 0, 2 * Math.PI); // Giảm kích thước từ 20 xuống 15
    ctx.fillStyle = "#dc2626";
    ctx.fill();
    ctx.lineWidth = 2.5; // Giảm độ đậm đường viền từ 4 xuống 2.5
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Thêm hiệu ứng bóng
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }, []);

  const spin = () => {
    if (spinning || spinsLeft <= 0) return;

    setSpinning(true);
    setResult(null);

    // Reset lại góc quay về 0, tắt transition để không bị chậm
    setTransitionDuration("0ms");
    setAngle(0);

    // Chọn giải thưởng ngẫu nhiên
    const prizeIndex = Math.floor(Math.random() * segmentCount);
    const selectedPrize = prizes[prizeIndex];
    console.log(
      `Quay trúng index: ${prizeIndex}, label: ${selectedPrize.label}`
    );

    // Tính toán góc quay cuối cùng
    const fullSpins = 6;
    const pointerOffset = 90;
    const stopAngle =
      360 - segmentAngle * prizeIndex - segmentAngle / 2 - pointerOffset;
    const finalAngle = 360 * fullSpins + stopAngle;
    setTimeout(() => {
      setTransitionDuration("5000ms");
      setAngle(finalAngle);
    }, 10);

    // Đợi animation kết thúc rồi gửi kết quả lên backend
    setTimeout(async () => {
      setSpinning(false);
      setResult(selectedPrize);
      if (onWin) onWin(selectedPrize);
      // Gửi kết quả lên backend
      let rewardType, reward;
      if (selectedPrize.value === "rare") {
        rewardType = "item";
        reward = null;
      } else if (typeof selectedPrize.value === "number") {
        rewardType = "coin";
        reward = selectedPrize.value;
      } else {
        // Không gửi nếu là ô "Quay lại" hoặc không hợp lệ
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const apiUrl = process.env.REACT_APP_API_URL || "";
        const res = await fetch(`${apiUrl}/spin/getspin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId, rewardType, reward }),
        });
        const data = await res.json();
        if (data.spinsLeft !== undefined) setSpinsLeft(data.spinsLeft);
        if (data.itemName) {
          setResult((prev) => ({ ...prev, itemName: data.itemName }));
        }
        if (data.error) {
          alert(data.error);
        }
      } catch (err) {
        alert("Lỗi kết nối máy chủ!");
      }
    }, 5010);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-8 py-6 sm:py-10 px-2 sm:px-4">
      <button
        className="mb-2 self-start flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-md text-sm font-medium shadow hover:from-blue-500 hover:to-indigo-600 transition"
        onClick={() => navigate("/rooms")}
      >
        <span className="text-sm">⬅️</span>
        <span>Quay lại chọn phòng</span>
      </button>

      <h2 className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text">
        <span className="block mt-0 mb-1 sm:mt-0 sm:mb-2">LUCKY WHEEL</span>
      </h2>

      <div className="relative">
        {/* Khung chứa vòng quay với đổ bóng */}
        <div className="p-2 sm:p-4 bg-gradient-to-b from-yellow-50 to-amber-50 rounded-full shadow-lg">
          {/* Vòng quay */}
          <div
            className="relative"
            style={{
              width: wheelSize.width,
              height: wheelSize.height,
              maxWidth: "100vw",
            }}
          >
            <canvas
              ref={wheelRef}
              width={wheelSize.width}
              height={wheelSize.height}
              className="transition-transform ease-out rounded-full shadow-xl"
              style={{
                transform: `rotate(${angle}deg)`,
                transitionDuration,
              }}
            />

            {/* Trục giữa - kích thước nhỏ hơn */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 sm:border-3 border-yellow-500 bg-gradient-to-b from-white to-gray-50 shadow-lg z-10 flex items-center justify-center">
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
                <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white shadow-inner"></div>
              </div>
            </div>
          </div>

          {/* Mũi tên - dịch lên trên một chút */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-20">
            <canvas ref={arrowRef} width="100" height="100" />
          </div>
        </div>
      </div>

      {/* Nút Quay */}
      <button
        className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-lg hover:from-pink-600 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={spin}
        disabled={spinning || spinsLeft === null || spinsLeft <= 0}
      >
        {spinning
          ? "Đang quay..."
          : spinsLeft === null
          ? "Đang kiểm tra lượt quay..."
          : spinsLeft > 0
          ? `Quay ngay (${spinsLeft} lượt)`
          : "Hết lượt quay hôm nay"}
      </button>

      {/* Kết quả */}
      {result && (
        <div className="text-base sm:text-xl font-bold text-green-700 mt-4 animate-bounce p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200 max-w-full">
          {result.value === 0 ? (
            "Rất tiếc! Bạn đã mất lượt"
          ) : result.value === "retry" ? (
            <>
              Chúc mừng! Bạn được quay lại
              <br />
              <span className="text-base text-gray-500">
                Bạn có thể bấm nút quay để tiếp tục.
              </span>
            </>
          ) : result.value === "rare" ? (
            result.itemName ? (
              <>
                Tuyệt vời! Bạn nhận vật phẩm:{" "}
                <span className="text-yellow-700">{result.itemName}</span>
              </>
            ) : (
              "Tuyệt vời! Bạn nhận vật phẩm"
            )
          ) : (
            <div className="flex items-center justify-center">
              Chúc mừng! Bạn nhận được: {result.label}
              {result.showCoin && <CoinIcon size={18} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
