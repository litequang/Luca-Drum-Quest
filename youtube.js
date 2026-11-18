// Luca frontend 20261118-r2
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
/** Render a validated embed. Immediate mode is reserved for displayed journal entries.
 * @param {string|null|undefined} value
 * @param {boolean} [immediate=false]
 */
export function youtubeMarkup(value, immediate = false) {
  const id = youtubeVideoId(value);
  if (!id) return "";
  if (immediate) {
    return '<div class="youtube-player" data-youtube-video="' + id + '">' +
      '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=0&amp;playsinline=1" title="Video nhật ký · YouTube" loading="lazy" ' +
      'referrerpolicy="strict-origin-when-cross-origin" ' +
      'allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen ' +
      'sandbox="allow-scripts allow-same-origin allow-presentation" ' +
      'style="display:block;width:100%;height:100%;aspect-ratio:16/9;border:0"></iframe></div>';
  }
  return (
    '<div class="youtube-player" data-youtube-video="' +
    id +
    '"><button type="button" class="youtube-cover" data-youtube-load aria-label="Phát video ngay trên trang">' +
    '<span class="youtube-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z" fill="currentColor"/></svg></span>' +
    '<span class="youtube-play-label">Phát video tại đây</span><span class="youtube-play-hint">Trình phát YouTube · không rời trang</span></button></div>'
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
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&playsinline=1";
    frame.title = "Video nhật ký · YouTube";
    frame.loading = "eager";
    // YouTube needs a client Referer; send only the origin, never a private page path.
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-presentation",
    );
    frame.style.cssText =
      "display:block;width:100%;height:100%;aspect-ratio:16/9;border:0";
    mount.replaceChildren(frame);
  });
}

/** Stop playback when the viewer leaves a view or closes a dialog.
 * @param {ParentNode|null|undefined} root
 */
export function stopYouTubeEmbeds(root) {
  if (!root) return;
  for (const mount of Array.from(root.querySelectorAll("[data-youtube-video]"))) {
    if (!mount.querySelector("iframe")) continue;
    const id = mount.getAttribute("data-youtube-video");
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) continue;
    mount.outerHTML = youtubeMarkup("https://youtu.be/" + id);
  }
}
