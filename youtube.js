/** Return an ID only for a direct HTTPS YouTube video URL, never arbitrary embeds.
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function youtubeVideoId(value) {
  if (typeof value !== "string" || value.length > 300) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    let id = null;
    if (url.hostname === "youtu.be")
      id = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1] ?? null;
    else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      if (
        url.pathname === "/watch" &&
        url.searchParams.getAll("v").length === 1
      )
        id = url.searchParams.get("v");
      else
        id =
          /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/.exec(
            url.pathname,
          )?.[1] ?? null;
    } else if (url.hostname === "www.youtube-nocookie.com")
      id = /^\/embed\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1] ?? null;
    return id &&
      !["videoseries", "live_stream"].includes(id) &&
      /^[A-Za-z0-9_-]{11}$/.test(id)
      ? id
      : null;
  } catch {
    return null;
  }
}
/** @param {string|null|undefined} value */
export function youtubeMarkup(value) {
  const id = youtubeVideoId(value);
  if (!id) return "";
  return (
    '<div data-youtube-video="' +
    id +
    '"><button type="button" class="button button-dark" data-youtube-load>Xem video YouTube</button><p>Chỉ kết nối YouTube khi bạn bấm xem. Quyền truy cập video do YouTube quyết định.</p></div>'
  );
}
/** Click-to-load avoids contacting YouTube before a deliberate viewer action.
 * @param {Document} doc
 */
export function installYouTubeEmbeds(doc) {
  doc.addEventListener("click", (event) => {
    const target = /** @type {Element|null} */ (event.target);
    const button = target?.closest("[data-youtube-load]");
    if (!button) return;
    const mount = button.closest("[data-youtube-video]"),
      id = mount?.getAttribute("data-youtube-video");
    if (!mount || !id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    const frame = doc.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + id;
    frame.title = "Video YouTube";
    frame.loading = "lazy";
    // YouTube needs a client Referer; send only the origin, never a private page path.
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow = "encrypted-media; picture-in-picture; fullscreen";
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-presentation",
    );
    frame.style.cssText =
      "width:100%;aspect-ratio:16/9;border:0;border-radius:12px";
    mount.replaceChildren(frame);
  });
}
