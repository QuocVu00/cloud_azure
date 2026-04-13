# HƯỚNG DẪN CHẠY DỰ ÁN GOOGLE DRIVE MINI

## 1. Cài đặt môi trường
*   Cài đặt **Node.js** phiên bản LTS từ [nodejs.org](https://nodejs.org/).
*   Mở terminal (PowerShell hoặc Command Prompt) và kiểm tra phiên bản:
    ```bash
    node -v
    npm -v
    ```

## 2. Cài đặt Thư viện (Dependencies)
cần cài đặt thư viện cho cả Backend và Frontend.

**Cài cho Backend:**
1. Di chuyển vào thư mục backend: `cd backend`
2. Chạy lệnh: `npm install`

**Cài cho Frontend:**
1. Di chuyển vào thư mục frontend: `cd frontend`
2. Chạy lệnh: `npm install`

## 3. Khởi tạo Database (Azure PostgreSQL)
Nếu anh chưa có các bảng `users` và `files` trên database, hãy chạy lệnh sau:
1. Tại thư mục `backend`, chạy:
    ```bash
    node scripts/init-db.js
    ```
2. Nếu anh muốn tạo tài khoản Admin mặc định (`admin1`/`admin123`), hãy chạy thêm:
    ```bash
    node scripts/seedAdmin.js
    ```

## 4. Chạy ngrok (Để nhận thông báo thanh toán IPN)
Để VNPay có thể gửi thông báo thanh toán thành công về máy tính của anh, anh cần chạy ngrok:
1. Mở một terminal mới và chạy:
    ```bash
    ngrok http 5000
    ```
2. Copy đường dẫn `https://xxxx-xxxx.ngrok-free.app` và gửi cho VNPay hoặc cấu hình trong Merchant Admin.
    *   **IPN URL**: `https://xxxx-xxxx.ngrok-free.app/api/payment/vnpay-ipn`

## 5. Khởi chạy Hệ thống
Anh cần chạy đồng thời cả Backend và Frontend (mở 2 cửa sổ terminal riêng).

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 6. Kiểm tra Thanh toán VNPay (Tài khoản mới)
Sử dụng các thông tin sau để thanh toán thử nghiệm:

*   **Tài khoản Merchant Admin**: `nqv123tt@gmail.com`
*   **Terminal ID**: `1HFN1008`

**Thông tin thẻ Test (NCB):**
*   **Số thẻ**: `9704198526191432198`
*   **Tên chủ thẻ**: `NGUYEN VAN A`
*   **Ngày phát hành**: `07/15`
*   **Mật khẩu OTP**: `123456`

---

### Lưu ý quan trọng về Code:
Tôi đã cập nhật thuật toán băm (Hashing) trong `paymentController.js` để xử lý khoảng trắng theo chuẩn dấu `+` của VNPay 2.1.0, giúp anh không còn gặp lỗi "Sai chữ ký" hay "Invalid Checksum" nữa.
