import { api, escapeHtml as e } from "/apiClient.js";
const $ = (s) => document.querySelector(s),
  money = (n) =>
    n == null ? "Chờ xác nhận" : new Intl.NumberFormat("vi-VN").format(n) + "đ";
let state,
  seasonId,
  tab = "dashboard";
const labels = {
  dashboard: "Tổng quan",
  project: "Dự án",
  seasons: "Các vòng",
  contributions: "Quà tặng",
  expenses: "Chi phí",
  journal: "Nhật ký",
  stages: "Chặng học",
  skills: "Kỹ năng",
  lessons: "Buổi học",
  practices: "Luyện tập",
  family: "Gia đình",
  audit: "Lịch sử",
};
const today = () => new Date().toLocaleDateString("en-CA");
const defaults = {
  seasons: () => ({
    ordinal: Math.max(...state.seasons.map((s) => s.ordinal)) + 1,
    title: "",
    durationMonths: null,
    objective: "",
    status: "draft",
    fundingGoal: null,
    plannedLessons: null,
    lessonLow: null,
    lessonHigh: null,
    equipmentBudget: null,
    contingency: 0,
    shareFinance: false,
    currentStageId: null,
  }),
  contributions: () => ({
    date: today(),
    kind: "gift",
    amount: null,
    description: "",
    supporterPrivate: "",
    status: "pending",
    publicAcknowledgement: false,
  }),
  expenses: () => ({
    date: today(),
    amount: 0,
    category: "other",
    description: "",
    status: "recorded",
    lessonId: null,
  }),
  journal: () => ({
    title: "",
    description: "",
    stageId: null,
    date: today(),
    tags: [],
    kind: "Bài học",
    visibility: "PARENT",
    published: false,
  }),
  stages: () => ({
    title: "",
    order: 1,
    period: "",
    goal: "",
    activities: [],
    checkpoint: "",
    short: "",
    icon: "♪",
  }),
  skills: () => ({
    code: "A-01",
    group: "A",
    title: "",
    stage: 1,
    goal: "",
    practice: "",
    pass: "",
    teacher: "",
    prerequisites: [],
    duration: "",
    status: null,
    teacherFeedback: "",
    teacherApproved: false,
  }),
  lessons: () => ({
    date: today(),
    attendance: "planned",
    cost: null,
    skillsTaught: [],
    skillsCorrect: [],
    homework: "",
    teacherComments: "",
    nextLesson: null,
  }),
  practices: () => ({ date: today(), skillIds: [], minutes: null, notes: "" }),
};
const fieldLabels = {
  currentStageId: "Chặng học hiện tại",
  description: "Mô tả",
  intro: "Giới thiệu công khai",
  currentSeasonId: "Vòng công khai hiện tại",
  ordinal: "Số thứ tự vòng",
  title: "Tiêu đề",
  durationMonths: "Thời hạn (tháng)",
  objective: "Mục tiêu",
  status: "Trạng thái",
  fundingGoal: "Mục tiêu quỹ (VND, trống = chưa chốt)",
  plannedLessons: "Số buổi dự toán",
  lessonLow: "Học phí thấp (VND)",
  lessonHigh: "Học phí cao (VND)",
  equipmentBudget: "Dự toán thiết bị (VND, trống = chưa chốt)",
  contingency: "Dự phòng (VND)",
  shareFinance: "Công khai tổng thu/chi",
  date: "Ngày",
  kind: "Loại",
  amount: "Số tiền (VND, in-kind để trống)",
  supporterPrivate: "Người tặng (chỉ phụ huynh)",
  publicAcknowledgement: "Đồng ý ghi nhận (danh tính vẫn riêng tư trong pilot)",
  category: "Hạng mục",
  lessonId: "Buổi học liên quan",
  stageId: "Chặng liên quan",
  tags: "Thẻ (mỗi dòng một thẻ)",
  visibility: "Quyền xem",
  published: "Đã xuất bản",
  order: "Thứ tự",
  period: "Khoảng tháng",
  goal: "Mục tiêu học",
  activities: "Hoạt động (mỗi dòng một mục)",
  checkpoint: "Minh chứng tham khảo",
  short: "Tóm tắt",
  icon: "Ký hiệu",
  code: "Mã kỹ năng",
  group: "Nhóm kỹ năng",
  stage: "Chặng (số)",
  practice: "Hướng dẫn luyện ở nhà",
  pass: "Gợi ý HOME READY",
  teacher: "Phần thầy cần kiểm tra",
  prerequisites: "Kỹ năng tiền đề",
  duration: "Thời lượng gợi ý",
  teacherFeedback: "Nhận xét của giáo viên (riêng tư)",
  teacherApproved: "Giáo trình được thầy duyệt",
  attendance: "Điểm danh",
  cost: "Học phí thực tế (không tự ghi chi)",
  skillsTaught: "Kỹ năng được dạy",
  skillsCorrect: "Kỹ năng cần sửa",
  homework: "Bài về nhà",
  teacherComments: "Nhận xét của thầy",
  nextLesson: "Buổi tiếp theo",
  skillIds: "Kỹ năng đã luyện",
  minutes: "Số phút (tùy chọn)",
  notes: "Ghi chú riêng",
};
const nullable = new Set([
  "durationMonths",
  "plannedLessons",
  "lessonLow",
  "lessonHigh",
  "fundingGoal",
  "equipmentBudget",
  "amount",
  "cost",
  "nextLesson",
  "minutes",
  "status",
]);
const numbers = new Set([
  "ordinal",
  "durationMonths",
  "fundingGoal",
  "plannedLessons",
  "lessonLow",
  "lessonHigh",
  "equipmentBudget",
  "contingency",
  "amount",
  "order",
  "stage",
  "cost",
  "minutes",
]);
const multiline = new Set([
  "description",
  "intro",
  "objective",
  "goal",
  "practice",
  "pass",
  "teacher",
  "teacherFeedback",
  "homework",
  "teacherComments",
  "notes",
  "checkpoint",
]);
const enums = {
  seasons: {
    status: [
      "draft",
      "fundraising",
      "fully_funded",
      "active",
      "completed",
      "archived",
    ],
  },
  contributions: {
    kind: ["gift", "in_kind"],
    status: ["pending", "confirmed", "void"],
  },
  expenses: {
    category: ["lesson", "equipment", "other"],
    status: ["recorded", "void"],
  },
  journal: {
    kind: ["Video luyện tập", "Bài học", "Cột mốc"],
    visibility: ["PARENT", "FAMILY", "PUBLIC"],
  },
  skills: {
    group: ["A", "B", "C", "D", "E", "F"],
    status: ["", "LEARNING", "PRACTICING", "HOME_READY", "TEACHER_PASS"],
  },
  lessons: { attendance: ["planned", "attended", "absent", "cancelled"] },
};
const refs = {
  currentStageId: "stages",
  currentSeasonId: "seasons",
  stageId: "stages",
  lessonId: "lessons",
  prerequisites: "skills",
  skillsTaught: "skills",
  skillsCorrect: "skills",
  skillIds: "skills",
};
function note(text) {
  $("#message").textContent = text;
}
function rows(kind) {
  return state.records.filter(
    (r) => r.entity === kind && r.seasonId === seasonId,
  );
}
function clean(row) {
  const { id, entity, seasonId, ...data } = row;
  return data;
}
async function reload() {
  state = await api("/admin/state");
  seasonId = state.seasons.some((s) => s.id === seasonId)
    ? seasonId
    : state.project.currentSeasonId || state.seasons[0].id;
  $("#season").innerHTML = state.seasons
    .map(
      (s) =>
        `<option value="${s.id}" ${s.id === seasonId ? "selected" : ""}>${e(s.title)} · ${e(s.status)}</option>`,
    )
    .join("");
  render();
}
function list(items, renderRow) {
  return '<ul class="admin-list">' + items.map(renderRow).join("") + "</ul>";
}
function render() {
  $("#editor").innerHTML = "";
  $("#tabs").innerHTML = Object.entries(labels)
    .map(
      ([key, label]) =>
        `<button data-tab="${key}" aria-pressed="${tab === key}">${label}</button>`,
    )
    .join("");
  const s = state.seasons.find((x) => x.id === seasonId),
    t = state.totals.find((x) => x.seasonId === seasonId);
  let body = "";
  if (tab === "dashboard") {
    const metrics = [
      ["Mục tiêu quỹ", money(t.goal)],
      ["Quà tặng đã xác nhận", money(t.received)],
      ["Đã chi", money(t.spent)],
      ["Số dư", money(t.balance)],
      ["Còn cần gây quỹ", money(t.unfunded)],
      [
        "Buổi đã học / dự toán",
        rows("lessons").filter((l) => l.attendance === "attended").length +
          " / " +
          (s.plannedLessons ?? "Chưa chốt"),
      ],
    ];
    body = `<h2>${e(s.title)} · ${e(s.status)}</h2><div class="admin-grid">${metrics.map(([k, v]) => `<div class="metric">${e(k)}<strong>${e(v)}</strong></div>`).join("")}</div><p>Dự toán học phí: ${money(t.lessonEstimateLow)}–${money(t.lessonEstimateHigh)}; thiết bị: ${money(t.equipmentBudget)}.</p><p>Kỹ năng: ${rows("skills").filter((k) => k.status === "TEACHER_PASS").length} được thầy xác nhận / ${rows("skills").length}. Chặng học hiện tại: ${e(rows("stages").find((stage) => stage.id === s.currentStageId)?.title || "Chưa có ghi nhận")}.</p><p class="warning">${[s.fundingGoal === null ? "Chưa chốt mục tiêu quỹ." : "", s.equipmentBudget === null ? "Chưa có báo giá thiết bị." : "", !s.shareFinance ? "Tổng thu/chi chưa công khai." : "", rows("journal").filter((p) => !p.published).length + " bài chưa xuất bản."].join(" ")}</p><h3>Nhật ký gần đây</h3>${list(
      rows("journal")
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
      (r) => `<li>${e(r.date)} · ${e(r.title)} · ${e(r.visibility)}</li>`,
    )}<p class="help">Đạt mục tiêu = quà tặng tiền mặt đã xác nhận ≥ mục tiêu. Chi phí không làm tăng số tiền còn cần gây quỹ. Học phí trong buổi học chỉ ghi nhận chi phí; tạo khoản chi riêng khi thực sự thanh toán, tránh ghi hai lần.</p>`;
  } else if (tab === "project") {
    body =
      "<h2>Nội dung công khai</h2><button data-edit-project>Chỉnh sửa</button><p>" +
      e(state.project.description) +
      "</p><p>" +
      e(state.project.intro) +
      "</p>";
  } else if (tab === "family") {
    body =
      '<h2>Quyền gia đình</h2><p class="help">Mã mời dùng một lần, hết hạn sau 7 ngày. Gửi riêng cho người được phép; không đặt mã trong URL. Thu hồi mời cũng thu hồi tài khoản đã nhận.</p><form id="invite" class="admin-form"><label>Nhãn riêng<input name="label" required maxlength="100"></label><button>Tạo mã mời</button></form>' +
      list(
        state.invitations,
        (r) =>
          `<li><span>${e(r.label)} · hết hạn ${e(r.expires_at)} · ${r.revoked ? "đã thu hồi" : r.used_by ? "đã nhận" : "chưa nhận"}</span><button data-revoke-invite="${r.id}">Thu hồi</button></li>`,
      ) +
      list(
        state.users.filter((u) => u.role === "FAMILY_VIEWER"),
        (r) =>
          `<li><span>${e(r.email)} · ${r.active ? "có quyền" : "đã thu hồi"}</span>${r.active ? `<button data-revoke-user="${r.id}">Thu hồi quyền</button>` : `<button data-grant-user="${r.id}">Cấp lại quyền</button>`}</li>`,
      );
  } else if (tab === "audit") {
    body =
      "<h2>Lịch sử quản trị (100 mục mới nhất)</h2>" +
      list(
        state.audit,
        (r) =>
          `<li>${e(r.created_at)} · ${e(r.action)} · ${e(r.target_id)} <button data-audit="${r.id}">Xem thay đổi</button></li>`,
      ) +
      "<h3>Lịch sử kỹ năng</h3>" +
      list(
        state.skillHistory,
        (r) =>
          `<li>${e(r.created_at)} · ${e(r.old_status)} → ${e(r.new_status)} · ${e(r.feedback)}</li>`,
      );
  } else {
    const items = tab === "seasons" ? state.seasons : rows(tab);
    body =
      `<h2>${labels[tab]}</h2><button data-new>Thêm mới</button>` +
      list(
        items,
        (r) =>
          `<li><span>${e(r.title || r.code || r.date)} ${e(r.description?.slice(0, 100) || "")} · ${e(r.status || r.attendance || r.visibility || "")}</span><button data-edit="${r.id}">Chỉnh sửa</button>${tab === "journal" ? `<button data-preview="${r.id}">Xem trước</button><button data-delete="${r.id}">Xóa bài + media</button>` : ""}</li>`,
      );
  }
  $("#content").innerHTML = '<div class="admin-card">' + body + "</div>";
}
function edit(kind, row) {
  const data =
    kind === "project"
      ? { ...state.project }
      : row
        ? clean(row)
        : defaults[kind]();
  const fields = Object.entries(data)
    .map(([key, value]) => {
      let input;
      const options = enums[kind]?.[key];
      if (refs[key]) {
        const items =
            refs[key] === "seasons"
              ? state.seasons
              : rows(refs[key]).filter((x) => x.id !== row?.id),
          multiple = Array.isArray(value);
        input = `<select name="${key}" ${multiple ? 'multiple size="5"' : ""}>${multiple ? "" : '<option value="">Chưa chọn</option>'}${items.map((x) => `<option value="${x.id}" ${(multiple ? value.includes(x.id) : value === x.id) ? "selected" : ""}>${e(x.code || x.title || x.date)}</option>`).join("")}</select>`;
      } else if (options)
        input = `<select name="${key}">${options.map((x) => `<option value="${x}" ${x === (value ?? "") ? "selected" : ""}>${e(x || "Chưa đánh giá")}</option>`).join("")}</select>`;
      else if (typeof value === "boolean")
        input = `<input name="${key}" type="checkbox" ${value ? "checked" : ""}>`;
      else if (Array.isArray(value) || multiline.has(key))
        input = `<textarea name="${key}">${e(Array.isArray(value) ? value.join("\n") : value)}</textarea>`;
      else
        input = `<input name="${key}" type="${numbers.has(key) ? "number" : key === "date" || key === "nextLesson" ? "date" : "text"}" ${numbers.has(key) ? 'min="0" max="1000000000000" step="1"' : ""} value="${e(value ?? "")}" ${key === "ordinal" && row ? "readonly" : ""}>`;
      return `<label class="${multiline.has(key) ? "wide" : ""}">${e(fieldLabels[key] || key)}${input}</label>`;
    })
    .join("");
  $("#editor").innerHTML =
    `<div class="admin-card"><h2>${row ? "Chỉnh sửa" : "Thêm"} · ${labels[kind]}</h2><form id="edit-form" class="admin-form">${fields}<div class="wide admin-actions"><button class="primary">Lưu</button><button type="button" id="cancel-edit">Hủy</button></div></form>${kind === "journal" && row ? `<h3>Ảnh minh họa</h3><p class="help">JPEG/PNG/WebP ≤5MB, tối đa 10 ảnh/bài. Video chưa được hỗ trợ trong pilot. Chỉ dùng ảnh giả.</p><form id="upload"><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required><button>Tải ảnh</button></form><div id="media-list"></div>` : ""}</div>`;
  $("#editor").scrollIntoView({ block: "start" });
  $("#cancel-edit").onclick = () => ($("#editor").innerHTML = "");
  $("#edit-form").onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      fd = new FormData(form),
      output = {};
    for (const [key, value] of Object.entries(data)) {
      const raw = fd.get(key);
      output[key] =
        typeof value === "boolean"
          ? fd.has(key)
          : refs[key]
            ? Array.isArray(value)
              ? fd.getAll(key)
              : raw || null
            : Array.isArray(value)
              ? String(raw)
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
              : numbers.has(key)
                ? raw === "" && nullable.has(key)
                  ? null
                  : Number(raw)
                : raw === "" && nullable.has(key)
                  ? null
                  : raw;
    }
    if (kind !== "project" && kind !== "seasons") output.seasonId = seasonId;
    const path =
      kind === "project"
        ? "/admin/project"
        : kind === "seasons"
          ? "/admin/seasons" + (row ? "/" + row.id : "")
          : "/admin/records/" + kind + (row ? "/" + row.id : "");
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      await api(path, {
        method: row || kind === "project" ? "PUT" : "POST",
        body: output,
      });
      await reload();
      note("Đã lưu. Nội dung công khai cập nhật khi tải lại website.");
    } catch (error) {
      note(error.message);
    } finally {
      button.disabled = false;
    }
  };
  if (kind === "journal" && row) {
    const media = state.media.filter((m) => m.journal_id === row.id);
    $("#media-list").innerHTML = list(
      media,
      (m) =>
        `<li><img class="media-image" src="/api/v1/media/${m.id}" alt="Ảnh đính kèm"><button data-delete-media="${m.id}">Xóa ảnh</button></li>`,
    );
    $("#upload").onsubmit = async (event) => {
      event.preventDefault();
      try {
        await api("/admin/journal/" + row.id + "/media", {
          method: "POST",
          body: new FormData(event.currentTarget),
        });
        await reload();
        edit(
          kind,
          state.records.find((r) => r.id === row.id),
        );
        note("Đã tải ảnh, loại metadata.");
      } catch (error) {
        note(error.message);
      }
    };
  }
}
async function preview(post, target) {
  const media = await api("/journal/" + post.id + "/media");
  target.innerHTML = `<article class="admin-card"><h2>${e(post.title)}</h2><p>${e(post.date)} · ${e(post.visibility)}</p><p>${e(post.description).replaceAll("\n", "<br>")}</p>${media.map((m) => `<img class="media-image" src="/api/v1/media/${m.id}" alt="Ảnh đính kèm">`).join("")}</article>`;
}
document.addEventListener("click", async (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  try {
    if (b.id === "logout") {
      await api("/auth/logout", { method: "POST" });
      location.href = "/admin/login";
      return;
    }
    if (
      b.dataset.grantUser &&
      confirm("Cấp lại quyền gia đình? Người này phải đăng nhập lại.")
    ) {
      await api("/admin/users/" + b.dataset.grantUser + "/access", {
        method: "PUT",
      });
      await reload();
      note("Đã cấp lại quyền. Cần đăng nhập mới.");
    }
    if (b.dataset.audit) {
      const log = await api("/admin/audit/" + b.dataset.audit);
      $("#editor").innerHTML =
        '<div class="admin-card"><h2>Chi tiết thay đổi (riêng tư)</h2><pre>' +
        e(JSON.stringify(log, null, 2)) +
        "</pre></div>";
    }
    if (b.dataset.tab) {
      tab = b.dataset.tab;
      render();
    }
    if (b.hasAttribute("data-edit-project")) edit("project");
    if (b.hasAttribute("data-new")) edit(tab);
    if (b.dataset.edit)
      edit(
        tab,
        (tab === "seasons" ? state.seasons : state.records).find(
          (r) => r.id === b.dataset.edit,
        ),
      );
    if (b.dataset.preview)
      await preview(
        state.records.find((r) => r.id === b.dataset.preview),
        $("#editor"),
      );
    const actions = [
      ["delete", "/admin/journal/", "Xóa bài và tất cả ảnh?"],
      ["deleteMedia", "/admin/media/", "Xóa ảnh?"],
      [
        "revokeInvite",
        "/admin/invitations/",
        "Thu hồi lời mời và quyền đã cấp?",
      ],
      ["revokeUser", "/admin/users/", "Thu hồi ngay quyền gia đình?"],
    ];
    for (const [key, path, question] of actions)
      if (b.dataset[key] && confirm(question)) {
        await api(path + b.dataset[key], { method: "DELETE" });
        await reload();
        note("Đã hoàn tất.");
      }
  } catch (error) {
    note(error.message);
  }
});
document.addEventListener("submit", async (event) => {
  if (event.target.id !== "invite") return;
  event.preventDefault();
  try {
    const result = await api("/admin/invitations", {
      method: "POST",
      body: Object.fromEntries(new FormData(event.target)),
    });
    await reload();
    note(
      "Mã mời (chỉ hiển thị lần này): " +
        result.token +
        "\nGửi riêng; nhận tại /admin/login → Nhận lời mời gia đình.",
    );
  } catch (error) {
    note(error.message);
  }
});
try {
  await api("/me");
  if ($("#family-posts")) {
    const posts = await api("/family/journal");
    $("#family-posts").textContent = posts.length
      ? ""
      : "Chưa có bài được chia sẻ.";
    for (const p of posts) {
      const container = document.createElement("div");
      $("#family-posts").append(container);
      await preview(p, container);
    }
  } else {
    await reload();
    $("#season").onchange = (event) => {
      seasonId = event.target.value;
      render();
    };
  }
} catch (error) {
  note(error.message);
  if (error.message === "Sign in required") location.href = "/admin/login";
}
