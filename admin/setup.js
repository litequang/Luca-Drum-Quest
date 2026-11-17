import { api } from "/apiClient.js";
const form = document.getElementById("setup"),
  message = document.getElementById("message");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (data.password !== data.confirmPassword) {
    message.textContent = "Hai mật khẩu chưa khớp.";
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  message.textContent = "Đang chuẩn bị dữ liệu và tạo Admin…";
  const { setupToken, ...credentials } = data;
  try {
    await api("/setup", {
      method: "POST",
      headers: { "x-setup-token": String(setupToken) },
      body: credentials,
    });
    form.reset();
    form.hidden = true;
    message.textContent =
      "Đã tạo Admin. Hãy đăng nhập bằng email và mật khẩu bạn vừa đặt. Bạn có thể xóa SETUP_TOKEN khỏi cấu hình trên host.";
    const link = document.createElement("a");
    link.href = "/admin/login";
    link.textContent = "Đến trang đăng nhập";
    message.append(document.createElement("br"), link);
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
});
