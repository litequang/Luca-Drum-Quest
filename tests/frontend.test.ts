import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { youtubeMarkup, installYouTubeEmbeds } from "../youtube.js";
const { stages, skills, skillGroups } = await import("../data.js" as string);
const publicSeason = {
  id: "season",
  ordinal: 1,
  title: "Season 1",
  fundingGoal: 100000000,
  plannedLessons: 104,
  durationMonths: 24,
  lessonLow: 500000,
  lessonHigh: 700000,
  equipmentBudget: null,
};
async function bootPublic(fail = false) {
  const html = await readFile("index.html", "utf8"),
    js = await readFile("app.js", "utf8");
  const dom = new JSDOM(html, {
      url: "http://localhost:3000",
      runScripts: "outside-only",
    }),
    w = dom.window;
  (w as any).__youtubeMarkup = youtubeMarkup;
  (w as any).__installYouTubeEmbeds = installYouTubeEmbeds;
  w.scrollTo = () => {};
  w.matchMedia = () => ({ matches: false }) as any;
  (w.document.querySelector("dialog") as any).showModal = function () {
    this.open = true;
  };
  (w.document.querySelector("dialog") as any).close = function () {
    this.open = false;
  };
  (w as any).__skillGroups = skillGroups;
  const post = {
    id: "post-1",
    title: "Public placeholder",
    description: "<img src=x onerror=alert(1)>",
    date: "2026-11-16",
    tags: [],
    kind: "Bài học",
    youtubeUrl: "https://youtu.be/AbC_123-xYz",
  };
  (w as any).__api = async (path: string) => {
    if (fail) throw new Error("Offline");
    return (
      {
        "/public/project": {
          description: "Stored introduction <script>x</script>",
          intro: "Stored family intro",
          season: publicSeason,
        },
        "/public/catalogue": {
          stages: stages.map((s: any) => ({ ...s, order: s.id })),
          skills: skills.map((s: any) => ({
            ...s,
            code: s.id,
            prerequisites: [],
          })),
        },
        "/public/journal": [post],
        "/public/budget": {
          available: true,
          received: 2000000,
          spent: 500000,
          balance: 1500000,
          unfunded: 98000000,
        },
        "/journal/post-1/media": [],
      } as any
    )[path];
  };
  await w.eval(
    "(async()=>{" +
      js
        .replace(
          "import { skillGroups } from './data.js';",
          "const skillGroups=window.__skillGroups;",
        )
        .replace(
          "import { api } from './apiClient.js';",
          "const api=window.__api;",
        )
        .replace(
          "import { youtubeMarkup, installYouTubeEmbeds } from './youtube.js';",
          "const youtubeMarkup=window.__youtubeMarkup,installYouTubeEmbeds=window.__installYouTubeEmbeds;",
        ) +
      "})()",
  );
  return dom;
}
test("public DOM interactions: stored copy, four routes, filters, dialogs and budget separation", async () => {
  const dom = await bootPublic(),
    w = dom.window,
    d = w.document;
  try {
    assert.equal(
      d.querySelector(".hero-description")!.textContent,
      "Stored introduction <script>x</script>",
    );
    assert.equal(d.querySelector(".hero-description script"), null);
    for (const nav of [".desktop-nav", ".mobile-nav"])
      for (const route of ["home", "learning", "journal", "funding"]) {
        (d.querySelector(nav + ' [data-route="' + route + '"]') as any).click();
        assert.equal(
          (d.querySelector('[data-view="' + route + '"]') as any).hidden,
          false,
        );
        assert.equal(d.querySelectorAll(".view:not([hidden])").length, 1);
        assert.equal(
          d
            .querySelector(nav + ' [aria-current="page"]')!
            .getAttribute("data-route"),
          route,
        );
      }
    (d.querySelector('[data-skill-filter="B"]') as any).click();
    assert.equal(
      d.querySelectorAll(".skill-card").length,
      skills.filter((s: any) => s.group === "B").length,
    );
    (d.querySelector(".skill-card") as any).click();
    assert.equal((d.querySelector("dialog") as any).open, true);
    (d.querySelector("[data-dialog-close]") as any).click();
    assert.equal((d.querySelector("dialog") as any).open, false);
    (d.querySelector('[data-stage="2"]') as any).click();
    assert.match(d.querySelector("#stage-detail")!.textContent!, /Giữ nhịp/);
    (d.querySelector("[data-entry]") as any).click();
    await new Promise((r) => setTimeout(r, 0));
    assert.match(d.querySelector("#dialog-body")!.textContent!, /<img src=x/);
    assert.equal(d.querySelector("#dialog-body img"), null);
    assert.equal(d.querySelector("#dialog-body iframe"), null);
    (
      d.querySelector("#dialog-body [data-youtube-load]") as HTMLButtonElement
    ).click();
    assert.equal(
      (d.querySelector("#dialog-body iframe") as HTMLIFrameElement).src,
      "https://www.youtube-nocookie.com/embed/AbC_123-xYz",
    );
    const goal = d.querySelector("#funding-goal")!.textContent;
    const equipment = d.querySelector("#equipment-budget") as HTMLInputElement;
    equipment.value = "20000000";
    equipment.dispatchEvent(new w.Event("input"));
    assert.equal(d.querySelector("#funding-goal")!.textContent, goal);
    assert.match(
      d.querySelector("#budget-full-total")!.textContent!,
      /tính thử/,
    );
  } finally {
    dom.window.close();
  }
});
test("API failure shows unavailable and never renders demo journal or progress", async () => {
  const dom = await bootPublic(true);
  try {
    assert.match(
      dom.window.document.querySelector(".hero-description")!.textContent!,
      /chưa khả dụng/,
    );
    assert.equal(
      dom.window.document.querySelectorAll(".journal-card").length,
      0,
    );
    assert.equal(dom.window.document.querySelectorAll(".skill-card").length, 0);
  } finally {
    dom.window.close();
  }
});
test("admin DOM form submits stored project edits and renders persisted state safely", async () => {
  const dom = new JSDOM(await readFile("admin/index.html", "utf8"), {
      url: "http://localhost:3000/admin",
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  (w.HTMLElement.prototype as any).scrollIntoView = () => {};
  const state = {
    project: {
      description: "Before",
      intro: "Intro",
      currentSeasonId: "season",
    },
    seasons: [
      {
        ...publicSeason,
        status: "draft",
        ordinal: 1,
        contingency: 0,
        shareFinance: false,
        currentStageId: null,
      },
    ],
    records: [],
    totals: [
      {
        seasonId: "season",
        goal: null,
        received: 0,
        spent: 0,
        balance: 0,
        unfunded: null,
        lessonEstimateLow: 52000000,
        lessonEstimateHigh: 72800000,
        equipmentBudget: null,
      },
    ],
    media: [],
    users: [],
    invitations: [],
    audit: [],
    skillHistory: [],
  };
  let saved: any;
  (w as any).__api = async (path: string, options: any) => {
    if (path === "/me") return { role: "PARENT_ADMIN", csrf: "test" };
    if (path === "/admin/state") return structuredClone(state);
    if (path === "/admin/project") {
      saved = options.body;
      state.project = { ...saved };
      return { ok: true };
    }
    throw new Error(path);
  };
  const { escapeHtml } = await import("../apiClient.js" as string);
  (w as any).__escape = escapeHtml;
  (w as any).__youtubeMarkup = youtubeMarkup;
  (w as any).__installYouTubeEmbeds = installYouTubeEmbeds;
  try {
    const js = (await readFile("admin/admin.js", "utf8"))
      .replace(
        'import { api, escapeHtml as e } from "/apiClient.js";',
        "const api=window.__api,e=window.__escape;",
      )
      .replace(
        'import { youtubeMarkup, installYouTubeEmbeds } from "/youtube.js";',
        "const youtubeMarkup=window.__youtubeMarkup,installYouTubeEmbeds=window.__installYouTubeEmbeds;",
      );
    await w.eval("(async()=>{" + js + "})()");
    (d.querySelector('[data-tab="project"]') as any).click();
    (d.querySelector("[data-edit-project]") as any).click();
    (d.querySelector('[name="description"]') as HTMLTextAreaElement).value =
      "Changed in admin";
    d.querySelector("#edit-form")!.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(saved.description, "Changed in admin");
    assert.match(d.querySelector("#content")!.textContent!, /Changed in admin/);
  } finally {
    dom.window.close();
  }
});

test("teacher DOM submits explicit feedback and renders only assigned practice evidence", async () => {
  const dom = new JSDOM(await readFile("admin/teacher.html", "utf8"), {
      url: "http://localhost:3000/teacher",
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  const skill = {
    id: "assigned-skill",
    entity: "skills",
    code: "A-01",
    title: "Fictional",
    goal: "Listen",
    practice: "Short play",
    pass: "Teacher assessment",
    status: null,
    teacherFeedback: "",
    teacherApproved: false,
  };
  let saved: any;
  (w as any).__api = async (path: string, options: any) => {
    if (path === "/me") return { role: "TEACHER", csrf: "fixture" };
    if (path === "/teacher/state")
      return {
        records: [
          skill,
          {
            id: "practice",
            entity: "practices",
            date: "2026-11-16",
            minutes: null,
            notes: "<script>private fixture</script>",
            youtubeUrl: "https://youtu.be/AbC_123-xYz",
          },
        ],
      };
    if (path === "/practices/practice/media") return [];
    if (path === "/teacher/skills/assigned-skill") {
      assert.equal(options.method, "PATCH");
      saved = options.body;
      Object.assign(skill, saved);
      return { ok: true };
    }
    throw new Error(path);
  };
  const { escapeHtml } = await import("../apiClient.js" as string);
  (w as any).__escape = escapeHtml;
  (w as any).__youtubeMarkup = youtubeMarkup;
  (w as any).__installYouTubeEmbeds = installYouTubeEmbeds;
  try {
    const js = (await readFile("admin/teacher.js", "utf8"))
      .replace(
        /^import .*?from ["']\/apiClient\.js["'];$/m,
        "const api=window.__api,e=window.__escape;",
      )
      .replace(
        /^import .*?from ["']\/youtube\.js["'];$/m,
        "const youtubeMarkup=window.__youtubeMarkup,installYouTubeEmbeds=window.__installYouTubeEmbeds;",
      );
    await w.eval("(async()=>{" + js + "})()");
    assert.equal(d.querySelectorAll("form[data-skill]").length, 1);
    assert.equal(d.querySelector("#teacher-practices script"), null);
    assert.match(
      d.querySelector("#teacher-practices")!.textContent!,
      /private fixture/,
    );
    assert.equal(d.querySelector("iframe"), null);
    (d.querySelector("[name=status]") as HTMLSelectElement).value =
      "TEACHER_PASS";
    (d.querySelector("[name=teacherFeedback]") as HTMLTextAreaElement).value =
      "Fictional explicit assessment";
    (d.querySelector("[name=teacherApproved]") as HTMLInputElement).checked =
      true;
    d.querySelector("form")!.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 5));
    assert.deepEqual(structuredClone(saved), {
      status: "TEACHER_PASS",
      teacherFeedback: "Fictional explicit assessment",
      teacherApproved: true,
    });
  } finally {
    w.close();
  }
});

test("first-admin form checks password confirmation, sends the setup key only in a header and clears credentials", async () => {
  const dom = new JSDOM(await readFile("admin/setup.html", "utf8"), {
      url: "http://localhost:3000/setup",
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  let sent: any;
  (w as any).__api = async (path: string, options: any) => {
    sent = { path, ...structuredClone(options) };
    return { ok: true, loginUrl: "/admin/login" };
  };
  try {
    const js = (await readFile("admin/setup.js", "utf8")).replace(
      /^import .*?from ["']\/apiClient\.js["'];$/m,
      "const api=window.__api;",
    );
    await w.eval("(async()=>{" + js + "})()");
    const form = d.querySelector("form")!;
    (d.querySelector("[name=setupToken]") as HTMLInputElement).value =
      "a".repeat(64);
    (d.querySelector("[name=email]") as HTMLInputElement).value =
      "parent@example.invalid";
    (d.querySelector("[name=password]") as HTMLInputElement).value =
      "Fictional passphrase only";
    (d.querySelector("[name=confirmPassword]") as HTMLInputElement).value =
      "Mismatch";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.equal(Boolean(sent), false);
    assert.match(d.querySelector("#message")!.textContent!, /chưa khớp/);
    (d.querySelector("[name=confirmPassword]") as HTMLInputElement).value =
      "Fictional passphrase only";
    form.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(sent.path, "/setup");
    assert.equal(sent.headers["x-setup-token"], "a".repeat(64));
    assert.equal("setupToken" in sent.body, false);
    assert.equal(form.hidden, true);
    assert.equal(
      (d.querySelector("[name=password]") as HTMLInputElement).value,
      "",
    );
    assert.equal(
      d.querySelector("#message a")!.getAttribute("href"),
      "/admin/login",
    );
  } finally {
    w.close();
  }
});
