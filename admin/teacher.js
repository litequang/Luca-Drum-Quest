import { api, escapeHtml as e } from "/apiClient.js";
import { youtubeMarkup, installYouTubeEmbeds } from "/youtube.js";
installYouTubeEmbeds(document);
const $ = (s) => document.querySelector(s);
const statuses = ["", "LEARNING", "PRACTICING", "HOME_READY", "TEACHER_PASS"];
function note(text) {
  $("#message").textContent = text;
}
async function reload() {
  const state = await api("/teacher/state");
  const skills = state.records.filter((r) => r.entity === "skills"),
    practices = state.records.filter((r) => r.entity === "practices");
  $("#teacher-skills").innerHTML =
    "<h2>Kỹ năng được chia sẻ</h2>" +
    (skills.length
      ? skills
          .map(
            (s) =>
              `<article class="admin-card"><h3>${e(s.code)} · ${e(s.title)}</h3><p>${e(s.goal)}</p><p class="help">Tập ở nhà: ${e(s.practice)}<br>Gợi ý đánh giá: ${e(s.pass)}</p><form class="admin-form" data-skill="${s.id}"><label>Trạng thái<select name="status">${statuses.map((v) => `<option value="${v}" ${v === (s.status ?? "") ? "selected" : ""}>${e(v || "Chưa đánh giá")}</option>`).join("")}</select></label><label>Giáo trình được thầy duyệt<input name="teacherApproved" type="checkbox" ${s.teacherApproved ? "checked" : ""}></label><label class="wide">Nhận xét của giáo viên<textarea name="teacherFeedback" maxlength="10000">${e(s.teacherFeedback)}</textarea></label><button class="primary">Lưu đánh giá</button></form></article>`,
          )
          .join("")
      : "<p>Chưa có kỹ năng được phân quyền.</p>");
  $("#teacher-practices").innerHTML = "<h2>Buổi luyện được chia sẻ</h2>";
  if (!practices.length)
    $("#teacher-practices").append(
      document.createTextNode("Chưa có buổi luyện được phân quyền."),
    );
  for (const p of practices) {
    const media = await api("/practices/" + p.id + "/media");
    const article = document.createElement("article");
    article.className = "admin-card";
    article.innerHTML = `<h3>${e(p.date)}</h3><p>${p.minutes == null ? "Chưa ghi thời lượng" : e(p.minutes) + " phút"}</p><p>${e(p.notes).replaceAll("\n", "<br>")}</p>${youtubeMarkup(p.youtubeUrl)}${media.map((m) => `<img class="media-image" src="/api/v1/media/${m.id}" alt="Ảnh bằng chứng luyện tập">`).join("")}`;
    $("#teacher-practices").append(article);
  }
}
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.dataset.skill) return;
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const fd = new FormData(form);
    await api("/teacher/skills/" + form.dataset.skill, {
      method: "PATCH",
      body: {
        status: fd.get("status") || null,
        teacherFeedback: fd.get("teacherFeedback"),
        teacherApproved: fd.has("teacherApproved"),
      },
    });
    await reload();
    note("Đã lưu đánh giá. Lịch sử ghi rõ tài khoản giáo viên.");
  } catch (error) {
    note(error.message);
  } finally {
    button.disabled = false;
  }
});
$("#logout").onclick = async () => {
  try {
    await api("/auth/logout", { method: "POST" });
    location.href = "/admin/login";
  } catch (error) {
    note(error.message);
  }
};
window.addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
try {
  await api("/me");
  await reload();
} catch (error) {
  note(error.message);
  if (error.message === "Sign in required") location.href = "/admin/login";
}
