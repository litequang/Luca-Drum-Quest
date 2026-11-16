import { api } from "/apiClient.js";
// Obtain CSRF when revisiting login with an already valid session.
await api("/me").catch(() => {});
for (const [id, endpoint] of [
  ["login", "login"],
  ["accept", "accept-invitation"],
])
  document.getElementById(id).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      button = form.querySelector("button");
    button.disabled = true;
    try {
      const result = await api("/auth/" + endpoint, {
        method: "POST",
        body: Object.fromEntries(new FormData(form)),
      });
      location.href =
        result.role === "PARENT_ADMIN"
          ? "/admin"
          : result.role === "TEACHER"
            ? "/teacher"
            : "/family";
    } catch (error) {
      document.getElementById("message").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
