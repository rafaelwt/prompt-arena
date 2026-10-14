// Renders the home, challenge and viewer pages from static JSON files.
// Paths are root-absolute so they work with or without trailing slashes.

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

const challengeDir = (slug) => `/challenges/${slug}`;
// "dnf" = did not finish: the snapshot can still be opened.
const isOpenable = (run) => run.status === "done" || run.status === "dnf";
const STATUS_LABEL = { done: "Done", dnf: "Did not finish", pending: "In progress" };
const runUrl = (challenge, run) => `${challengeDir(challenge)}/runs/${run.slug}/${run.entry}`;
const viewerUrl = (challenge, run) =>
  `/view.html?c=${encodeURIComponent(challenge)}&r=${encodeURIComponent(run.slug)}`;

const showError = (root, err) => {
  root.replaceChildren(el("p", { class: "error" }, `Could not load data (${err.message}).`));
};

async function renderHome(root) {
  const challenges = await fetchJson("/challenges/index.json");
  const cards = await Promise.all(
    challenges.map(async (c) => {
      const runs = await fetchJson(`${challengeDir(c.slug)}/runs.json`).catch(() => []);
      const done = runs.filter(isOpenable).length;
      const pending = runs.length - done;
      return el("a", { class: "card", href: `${challengeDir(c.slug)}/` }, [
        el("h2", { class: "card-title" }, c.title),
        el("p", { class: "card-text" }, c.summary),
        el("div", { class: "tags" }, (c.tags || []).map((t) => el("span", { class: "tag" }, t))),
        el("div", { class: "card-footer" }, [
          el("span", {}, `${done} runs${pending ? ` · ${pending} pending` : ""}`),
          el("span", { class: "cta" }, "View →"),
        ]),
      ]);
    })
  );
  root.replaceChildren(...cards);
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const formatTokens = (run) =>
  run.tokens_in != null && run.tokens_out != null
    ? `${compact.format(run.tokens_in)} in · ${compact.format(run.tokens_out)} out`
    : null;

function runCard(challenge, run) {
  const canOpen = isOpenable(run);
  const rows = [
    ["Harness", run.harness],
    ["Provider", run.provider],
    ["Effort", run.effort],
    ["Tokens", formatTokens(run)],
    ["Cost", run.cost_usd != null ? `$${run.cost_usd.toFixed(2)}` : null],
    ["Turns", run.turns != null ? String(run.turns) : null],
    ["Nudges", run.nudges != null ? String(run.nudges) : null],
  ].filter(([, value]) => value);

  const children = [
    el("h2", { class: "card-title" }, run.model),
    el("div", { class: "time" }, run.duration || "—"),
    el("dl", { class: "meta" }, rows.flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)])),
    run.notes ? el("p", { class: "card-text" }, run.notes) : null,
    el("div", { class: "card-footer" }, [
      el("span", { class: `status status-${run.status}` }, STATUS_LABEL[run.status] || run.status),
      canOpen ? el("span", { class: "cta" }, "Open →") : null,
    ]),
  ];

  return canOpen
    ? el("a", { class: `card is-${run.status}`, href: viewerUrl(challenge, run) }, children)
    : el("div", { class: "card is-pending" }, children);
}

function setupCopy(button, text) {
  if (!button || !text) return;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
    setTimeout(() => (button.textContent = "Copy"), 1500);
  });
}

async function renderChallenge(root) {
  const slug = document.body.dataset.challenge;
  const [runs, prompt] = await Promise.all([
    fetchJson(`${challengeDir(slug)}/runs.json`),
    fetch(`${challengeDir(slug)}/prompt.md`).then((r) => (r.ok ? r.text() : "")),
  ]);

  document.getElementById("prompt-text").textContent = prompt.trim();
  setupCopy(document.getElementById("prompt-copy"), prompt.trim());
  root.replaceChildren(...runs.map((run) => runCard(slug, run)));
}

async function renderViewer() {
  const params = new URLSearchParams(location.search);
  const challenge = params.get("c");
  const runSlug = params.get("r");
  const back = document.getElementById("viewer-back");
  const title = document.getElementById("viewer-title");

  back.href = challenge ? `${challengeDir(challenge)}/` : "/";
  const runs = await fetchJson(`${challengeDir(challenge)}/runs.json`);
  const run = runs.find((r) => r.slug === runSlug && isOpenable(r));
  if (!run) {
    title.textContent = "Run not found";
    return;
  }

  const src = runUrl(challenge, run);
  document.title = `${run.model} · ${document.title}`;
  title.textContent = [run.model, run.harness, run.effort].filter(Boolean).join(" · ");
  document.getElementById("viewer-raw").href = src;
  document.getElementById("viewer-frame").src = src;
}

const pages = { home: renderHome, challenge: renderChallenge, viewer: renderViewer };
const root = document.getElementById("root");
const render = pages[document.body.dataset.page];
if (render) render(root).catch((err) => (root ? showError(root, err) : console.error(err)));
