import timeText from '../util/timeText.js';

const otpTemplate = (otp) => `
  <div style="
    font-family: Arial, sans-serif; 
    max-width: 500px; 
    margin: auto; 
    border: 1px solid #ddd; 
    border-radius: 8px; 
    padding: 20px; 
    text-align: center; 
    background-color: #f9f9f9;"
  >
    <h2 style="color: #007bff; margin-bottom: 10px;">
      🔐 Mã Xác Minh
    </h2>

    <p style="font-size: 16px; color: #333; margin: 0 0 10px;">
      Chào bạn,
    </p>
    <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
      Dưới đây là mã xác minh của bạn:
    </p>

    <div style="
      font-size: 24px; 
      font-weight: bold; 
      color: #d9534f; 
      background: #f8d7da; 
      padding: 10px; 
      border-radius: 5px; 
      display: inline-block;"
    >
      ${otp}
    </div>

    <p style="font-size: 14px; color: #555; margin-top: 20px;">
      Mã này sẽ hết hạn sau <strong>5 phút</strong>. 
      Vui lòng không chia sẻ mã này với bất kỳ ai.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p style="font-size: 12px; color: #777; margin: 0;">
      Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.
    </p>
  </div>
`;

const ticketInfoTemplate = (name, event, order, tickets) => `
  <div style="
    font-family: Arial, sans-serif; 
    max-width: 600px; 
    margin: auto; 
    border: 1px solid #ddd; 
    border-radius: 8px; 
    padding: 20px; 
    background-color: #f9f9f9;
  ">
      <!-- Tiêu đề canh giữa -->
      <h2 style="color: #007bff; text-align: center;">
        🎫 Thông Tin Đặt Vé
      </h2>
      
      <!-- Phần chào hỏi, thông tin chính canh trái -->
      <div style="text-align: left; color: #333; font-size: 16px;">
        <p style="margin: 0 0 10px;">
          Chào <strong>${name}</strong>,
        </p>
        <p style="margin: 0 0 10px;">
          Cảm ơn bạn đã thanh toán thành công cho sự kiện 
          <strong>"${event.name}"</strong>.
        </p>
        <p style="margin: 0 0 10px;">
          Thời gian diễn ra sự kiện: 
          ${timeText(event) ? timeText(event) : 'Chưa cập nhật'}.
        </p>
        <p style="margin: 0 0 10px;">
          Tổng số tiền thanh toán: 
          <strong>${order.totalPrice.toLocaleString()} VND</strong>.
        </p>
        <p style="margin: 0 0 10px;">
          Dưới đây là thông tin vé của bạn:
        </p>
      </div>

      <!-- Danh sách vé canh trái -->
      <div style="text-align: left; margin: 20px 0;">
          ${
              tickets.length > 0
                  ? tickets
                        .map(
                            (ticket) => `
                <div style="
                  border: 1px solid #ddd; 
                  border-radius: 5px; 
                  padding: 10px; 
                  margin-bottom: 10px;
                ">
                    <p style="font-size: 16px; color: #333; margin: 0 0 5px 0;">
                        <strong>${ticket.name}</strong>
                    </p>
                    <p style="font-size: 14px; color: #555; margin: 0;">
                        Số lượng: ${ticket.quantity}
                    </p>
                    <p style="font-size: 14px; color: #555; margin: 0;">
                        Giá: ${ticket.price.toLocaleString()} VND
                    </p>
                </div>
              `,
                        )
                        .join('')
                  : '<p style="font-size: 14px; color: #555;">Chưa có thông tin vé.</p>'
          }
      </div>

      <!-- Đoạn cuối canh trái -->
      <div style="text-align: left; color: #555; font-size: 14px;">
        <p style="margin-top: 20px;">
          Vui lòng kiểm tra và liên hệ với chúng tôi nếu có bất kỳ thắc mắc nào.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      <!-- Chân trang canh giữa -->
      <p style="font-size: 12px; color: #777; text-align: center;">
          Melody Meet
      </p>
  </div>
`;

export default {
    otpTemplate,
    ticketInfoTemplate,
};
