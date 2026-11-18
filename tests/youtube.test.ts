import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  youtubeVideoId,
  youtubeMarkup,
  installYouTubeEmbeds,
  stopYouTubeEmbeds,
} from "../youtube.js";
test("YouTube accepts direct video links and rejects arbitrary embeds/URLs", () => {
  for (const url of [
    "https://youtu.be/AbC_123-xYz?t=12",
    "https://www.youtube.com/watch?v=AbC_123-xYz&feature=shared",
    "https://youtube.com/shorts/AbC_123-xYz",
    "https://www.youtube-nocookie.com/embed/AbC_123-xYz",
  ])
    assert.equal(youtubeVideoId(url), "AbC_123-xYz");
  for (const url of [
    "javascript:alert(1)",
    "http://youtu.be/AbC_123-xYz",
    "https://youtu.be.evil.invalid/AbC_123-xYz",
    "https://www.youtube.com/embed/videoseries",
    "https://www.youtube.com/watch?v=AbC_123-xYz&v=ZyX-987_CbA",
    "https://user:pass@youtube.com/watch?v=AbC_123-xYz",
    '<iframe src="https://evil.invalid">',
  ]) {
    assert.equal(youtubeVideoId(url), null);
    assert.equal(youtubeMarkup(url), "");
  }
});
test("YouTube click-to-load creates only the fixed privacy-enhanced iframe", () => {
  const dom = new JSDOM(youtubeMarkup("https://youtu.be/AbC_123-xYz"));
  try {
    const d = dom.window.document;
    installYouTubeEmbeds(d);
    assert.equal(d.querySelector("iframe"), null);
    assert.equal(d.querySelector("img"), null);
    (d.querySelector("button") as HTMLButtonElement).click();
    const f = d.querySelector("iframe")!;
    assert.equal(f.src, "https://www.youtube-nocookie.com/embed/AbC_123-xYz?autoplay=1&playsinline=1");
    assert.match(f.allow, /autoplay/);
    assert.equal(d.querySelector("a[href]"), null);
    assert.equal(f.referrerPolicy, "strict-origin-when-cross-origin");
    assert.equal(
      f.getAttribute("sandbox"),
      "allow-scripts allow-same-origin allow-presentation",
    );
    assert.match(f.style.aspectRatio, /^16\s*\/\s*9$/);
    assert.equal(d.querySelectorAll("iframe").length, 1);
    stopYouTubeEmbeds(d);
    assert.equal(d.querySelector("iframe"), null);
    assert.ok(d.querySelector(".youtube-cover[data-youtube-load]"));
  } finally {
    dom.window.close();
  }
});
