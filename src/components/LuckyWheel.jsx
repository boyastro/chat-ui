import React, { useState, useEffect } from "react";

// Dữ liệu giải thưởng với màu sắc được định nghĩa sẵn
const prizes = [
  { label: "100💰", value: 100, color: "#fef08a" },
  { label: "Quay lại", value: "retry", color: "#e5e7eb" },
  { label: "500💰", value: 500, color: "#fcd34d" },
  { label: "Hiếm", value: "rare", color: "#a5b4fc" },
  { label: "Hiếm", value: "rare", color: "#e5e7eb" },
  { label: "1000💰", value: 1000, color: "#fcd34d" },
  { label: "Hiếm", value: "rare", color: "#a5b4fc" },
  { label: "300💰", value: 300, color: "#fef08a" },
];

const segmentCount = prizes.length;
const segmentAngle = 360 / segmentCount;

export default function LuckyWheel({ onWin }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [angle, setAngle] = useState(0);
  const [wheelSize] = useState({ width: 420, height: 420 }); // Tăng kích thước bánh xe lớn hơn nữa

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

      // Chuẩn bị text
      ctx.font = "bold 15px Arial"; // Giảm kích thước chữ xuống nhỏ hơn
      const textMetrics = ctx.measureText(prize.label);
      const textWidth = textMetrics.width + 16; // Giảm padding cho text box
      const textHeight = 26; // Giảm chiều cao cho text box

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

      // Khôi phục trạng thái canvas
      ctx.restore();
    });

    // Vẽ vòng tròn trung tâm nhỏ hơn
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Thêm vòng tròn trang trí bên trong
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    // Thêm vòng tròn nhỏ nhất ở trung tâm để trang trí
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#eab308";
    ctx.fill();
  }, [wheelSize]);

  // Vẽ mũi tên
  useEffect(() => {
    if (!arrowRef.current) return;

    const canvas = arrowRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 100, 100);

    // Vẽ mũi tên to hơn và nổi bật - điều chỉnh hướng mũi tên
    ctx.beginPath();
    ctx.moveTo(50, 80); // Đỉnh mũi tên - đặt ở dưới để trỏ vào bánh xe
    ctx.lineTo(20, 30); // Góc trái - đặt ở trên
    ctx.lineTo(80, 30); // Góc phải - đặt ở trên
    ctx.closePath();

    // Thêm hiệu ứng gradient - điều chỉnh vị trí gradient theo hướng mũi tên mới
    const gradient = ctx.createLinearGradient(50, 80, 50, 30);
    gradient.addColorStop(0, "#dc2626");
    gradient.addColorStop(1, "#b91c1c");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Thêm đường viền
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Vẽ nút tròn ở đuôi mũi tên - di chuyển lên trên
    ctx.beginPath();
    ctx.arc(50, 30, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#dc2626";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Thêm hiệu ứng bóng
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }, []);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    // Chọn giải thưởng ngẫu nhiên
    const prizeIndex = Math.floor(Math.random() * segmentCount);
    const selectedPrize = prizes[prizeIndex];
    console.log(
      `Quay trúng index: ${prizeIndex}, label: ${selectedPrize.label}`
    );

    // Tính toán góc quay cuối cùng
    // Mũi tên ở vị trí 12h (top), canvas 0° là 3h, nên cần offset -90°
    const fullSpins = 6;
    const pointerOffset = 90; // offset để mũi tên trỏ đúng 12h
    const stopAngle =
      360 - segmentAngle * prizeIndex - segmentAngle / 2 - pointerOffset;
    const finalAngle = 360 * fullSpins + stopAngle;
    console.log(
      `stopAngle: ${stopAngle.toFixed(2)}°, finalAngle: ${finalAngle.toFixed(
        2
      )}°`
    );

    setAngle(finalAngle);

    // Đợi animation kết thúc rồi cập nhật kết quả
    setTimeout(() => {
      setSpinning(false);
      setResult(selectedPrize);
      if (onWin) onWin(selectedPrize);
      console.log(
        `Kết quả: ${selectedPrize.label}, value: ${selectedPrize.value}`
      );
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-4">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text">
        Vòng Quay May Mắn
      </h2>

      <div className="relative">
        {/* Khung chứa vòng quay với đổ bóng */}
        <div className="p-4 bg-gradient-to-b from-yellow-50 to-amber-50 rounded-full shadow-lg">
          {/* Vòng quay */}
          <div
            className="relative"
            style={{ width: wheelSize.width, height: wheelSize.height }}
          >
            <canvas
              ref={wheelRef}
              width={wheelSize.width}
              height={wheelSize.height}
              className="transition-transform ease-out rounded-full shadow-xl"
              style={{
                transform: `rotate(${angle}deg)`,
                transitionDuration: "5000ms",
              }}
            />

            {/* Trục giữa - kích thước nhỏ hơn */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-3 border-yellow-500 bg-gradient-to-b from-white to-gray-50 shadow-lg z-10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white shadow-inner"></div>
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
        className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white px-10 py-4 rounded-full font-bold text-xl shadow-lg hover:from-pink-600 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? "Đang quay..." : "Quay ngay"}
      </button>

      {/* Kết quả */}
      {result && (
        <div className="text-xl font-bold text-green-700 mt-4 animate-bounce p-4 bg-green-50 rounded-lg border border-green-200">
          {result.value === 0
            ? "Rất tiếc! Bạn đã mất lượt"
            : result.value === "retry"
            ? "Chúc mừng! Bạn được quay lại"
            : result.value === "rare"
            ? "Tuyệt vời! Bạn nhận vật phẩm hiếm"
            : `Chúc mừng! Bạn nhận được: ${result.label}`}
        </div>
      )}
    </div>
  );
}
