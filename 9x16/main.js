// 9x16 Media - motion layer (GSAP only).
// Adaptive nav theme per section. Hero cards fan -> ring. The flip: grid crop box
// reshapes 16:9 -> 9:16, zooms into a viewport-height orange frame, white copy fades in.

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const cards = Array.from(document.querySelectorAll(".ccard"));


/* ---------- adaptive nav theme ----------
   Every section declares its theme via data-nav. The flip has no data-nav, so the
   nav simply keeps the previous (light) variant through it - no dark switch. */
function initNav() {
  const nav = document.querySelector(".nav");
  if (!nav || !ScrollTrigger) return;
  document.querySelectorAll("[data-nav]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: "top 84px", end: "bottom 84px",
      onToggle: (s) => { if (s.isActive) nav.dataset.theme = sec.dataset.nav; },
    });
  });
}

/* ---------- generic scroll-reveal for content sections ---------- */
function initReveals() {
  if (!gsap || !ScrollTrigger || reduce) return;
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, { y: 28, autoAlpha: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 87%", once: true } });
  });
}

/* ---------- section 3 (receipts): pinned beats + lateral carousel ---------- */
function initReceipts() {
  const rec = document.querySelector(".rec");
  if (!rec || !gsap || !ScrollTrigger) return;

  if (reduce) {   // show all states, no scrubbing (CSS unpins the section)
    gsap.set(".rec__boxes", { opacity: 1 });
    gsap.set(".statbox__fill", { scaleY: 1 });
    gsap.set(".statbox__num, .statbox__label", { opacity: 1 });
    return;
  }

  const track = document.querySelector(".carousel__track");
  const pan = () => Math.max(0, track.scrollWidth - window.innerWidth);   // last card ends at the right edge
  const navEl = document.querySelector(".nav");

  gsap.timeline({ scrollTrigger: { trigger: ".rec", start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } })
    // beat 1 -> 2
    .to(".rec__text", { autoAlpha: 0, y: -30, ease: "power1.in", duration: 0.10 }, 0.10)
    .to(".rec__boxes", { autoAlpha: 1, duration: 0.04 }, 0.16)
    .to(".statbox__fill", { scaleY: 1, ease: "power2.out", duration: 0.10, stagger: 0.03 }, 0.20)   // boxes fill orange
    .to(".statbox__num", { opacity: 1, duration: 0.05, stagger: 0.03 }, 0.31)                        // numbers appear inside
    .to(".statbox__label", { opacity: 1, duration: 0.05, stagger: 0.03 }, 0.34)
    // beat 2 -> 3: black dashboard curtain-wipes UP from the bottom over the boxes (no dissolve)
    .fromTo(".rec__dash", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.13 }, 0.44)
    // lateral carousel: the middle grid row scrolls until the last card reaches the right edge
    .to(track, { x: () => -pan(), ease: "none", duration: 0.42 }, 0.57);

  // nav flips to the dark variant while the black dashboard is showing (progress-based, lag-free)
  ScrollTrigger.create({
    trigger: ".rec",
    start: () => rec.offsetTop + (rec.offsetHeight - window.innerHeight) * 0.56,   // flip up-wipe covers the nav near its end
    end: () => rec.offsetTop + (rec.offsetHeight - window.innerHeight),
    invalidateOnRefresh: true,
    onToggle: (s) => { navEl.dataset.theme = s.isActive ? "dark" : "light"; },
  });
}

/* ---------- section 9 (founder): black panel curtain-wipes UP from the bottom ----------
   §8 (projects) is pinned at its closing viewport (sticky, negative top) so the last cards +
   rule FREEZE as the black panel wipes up over them — same feel as the §3 dashboard wipe. */
function stickProjectsTail() {
  const proj = document.querySelector(".projects");
  const wrap = document.querySelector(".proj-freeze");
  if (!proj || !wrap) return;
  const off = window.matchMedia("(max-width: 820px)").matches || reduce;   // only freeze on the desktop scroll model
  if (off) { proj.style.top = ""; wrap.style.height = ""; return; }
  const vh = window.innerHeight;
  proj.style.top = Math.min(0, vh - proj.offsetHeight) + "px";   // freeze with the closing viewport at the bottom
  wrap.style.height = (proj.offsetHeight + vh) + "px";           // +100vh of freeze room, then §8 releases
}

function initFounder() {
  const sec = document.querySelector(".founder");
  if (!sec || !gsap || !ScrollTrigger) return;
  const panel = sec.querySelector(".founder__panel");
  const navEl = document.querySelector(".nav");

  if (reduce) { gsap.set(panel, { clipPath: "inset(0% 0% 0% 0%)" }); return; }

  stickProjectsTail();
  ScrollTrigger.addEventListener("refreshInit", stickProjectsTail);

  const WIPE = 0.4;   // wipe fraction of the pinned scroll; the rest holds on the founder
  gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } })
    .fromTo(panel, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: WIPE })   // wipe up from bottom
    .to({}, { duration: 1 - WIPE });   // hold on the founder

  // nav flips dark exactly as the rising panel reaches the nav (just before the wipe completes)
  ScrollTrigger.create({
    trigger: sec,
    start: () => sec.offsetTop + (sec.offsetHeight - window.innerHeight) * (WIPE * 0.92),
    end: () => sec.offsetTop + (sec.offsetHeight - window.innerHeight),
    invalidateOnRefresh: true,
    onToggle: (s) => { navEl.dataset.theme = s.isActive ? "dark" : "light"; },
  });
}

/* ---------- section 11 (pricing): applications counter tallies up on view ---------- */
function initCounter() {
  const el = document.querySelector(".pcount__num");
  if (!el) return;
  const target = +el.dataset.count || 0;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  if (reduce || !gsap || !ScrollTrigger) { el.textContent = fmt(target); return; }
  ScrollTrigger.create({
    trigger: el, start: "top 88%", once: true,
    onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: () => { el.textContent = fmt(o.v); } }); },
  });
}

/* ---------- scroll-to-top button: appears past the hero, orange on dark sections, top-right in footer ---------- */
function initToTop() {
  const btn = document.querySelector(".totop");
  if (!btn) return;
  const nav = document.querySelector(".nav");
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  const onScroll = () => btn.classList.toggle("is-on", window.scrollY > window.innerHeight);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mirror the nav theme: orange box on black-bg sections (nav goes dark there), black otherwise
  if (nav) {
    const sync = () => btn.classList.toggle("totop--dark", nav.dataset.theme === "dark");
    new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ["data-theme"] });
    sync();
  }
  // in the footer, dock to the top-right of the viewport (beside the nav) instead of bottom-right
  if (gsap && ScrollTrigger) {
    ScrollTrigger.create({
      trigger: ".footer", start: "top center", end: "bottom top", invalidateOnRefresh: true,
      onToggle: (s) => btn.classList.toggle("totop--footer", s.isActive),
    });
  }
}

/* ---------- shared: rectangle "label ↗" cursor that rides a set of targets ----------
   desktop + hover only. label is set per target via labelFor(); arrow rotates right on press. */
function makeRectCursor(sec, container, targets, labelFor) {
  if (!sec || !container || !targets.length || reduce || !window.matchMedia("(hover: hover)").matches) return;
  const cur = document.createElement("div");
  cur.className = "rcursor";
  cur.innerHTML =
    '<div class="rcursor__box"><span class="rcursor__label"></span>' +
    '<span class="rcursor__arw"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>';
  sec.appendChild(cur);
  const box = cur.querySelector(".rcursor__box");
  const label = cur.querySelector(".rcursor__label");
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const tick = () => { x += (tx - x) * 0.22; y += (ty - y) * 0.22; cur.style.transform = `translate3d(${x}px, ${y}px, 0)`; raf = requestAnimationFrame(tick); };
  container.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
  container.addEventListener("mouseenter", (e) => { tx = x = e.clientX; ty = y = e.clientY; box.classList.add("is-on"); if (!raf) tick(); });
  container.addEventListener("mouseleave", () => { box.classList.remove("is-on", "is-click"); cancelAnimationFrame(raf); raf = 0; });
  container.addEventListener("mousedown", () => box.classList.add("is-click"));
  window.addEventListener("mouseup", () => box.classList.remove("is-click"));
  targets.forEach((t) => { t.classList.add("rcur-target"); t.addEventListener("mouseenter", () => { label.textContent = labelFor(t); }); });
}

/* ---------- section 5 (what we do): cursor rides the rows, label = each row's data-cta ---------- */
function initWhatWeDo() {
  const sec = document.querySelector(".wwd");
  const rows = sec && sec.querySelector(".wwd__rows");
  if (!rows) return;
  makeRectCursor(sec, rows, [...rows.querySelectorAll(".wwd-row")], (r) => r.dataset.cta || "get in touch");
}

/* ---------- section 7 (completely unrelated): "join the conversation" cursor + chat modal ---------- */
const CHATS = [
  { topic: "reel or short?", msgs: [
    { who: "Aditya", text: "it's a reel. it's always been a reel." },
    { who: "Meera", text: "instagram says reel, youtube says short. we contain multitudes." },
    { who: "Rehan", text: "it's a vertical video. can we please just say vertical video." },
    { who: "Aditya", text: "absolutely not." },
  ] },
  { topic: "founder maths", msgs: [
    { who: "Meera", text: "arsalan just did 7,314 × 892 before I finished typing the question" },
    { who: "Rehan", text: "ask him where his phone is though" },
    { who: "Arsalan", text: "it's on the desk" },
    { who: "Meera", text: "it is not on the desk" },
    { who: "Arsalan", text: "...it's not on the desk" },
  ] },
  { topic: "the IT crowd", msgs: [
    { who: "Rehan", text: "have you tried turning it off and on again" },
    { who: "Meera", text: "we are NOT quoting it again" },
    { who: "Aditya", text: "0118 999 881 999 119 725… 3" },
    { who: "Meera", text: "rehan started it" },
  ] },
  { topic: "hot dog: sandwich?", msgs: [
    { who: "Aditya", text: "a hot dog is a sandwich. bread + filling. case closed." },
    { who: "Meera", text: "structurally it's a taco. I won't be taking questions." },
    { who: "Rehan", text: "it's a hot dog. it's its own thing. stop." },
    { who: "Aditya", text: "forty minutes and counting" },
  ] },
  { topic: "the office plant", msgs: [
    { who: "Meera", text: "watered the office plant today 🌱" },
    { who: "Rehan", text: "meera it's plastic" },
    { who: "Meera", text: "it's thriving though" },
    { who: "Rehan", text: "...it is thriving" },
  ] },
];
const QUIPS = ["noted. changes nothing.", "bold. the debate continues.", "adding you to the group chat.", "this is exactly why we have meetings.", "screenshotting this for later."];

function initUnrelated() {
  const sec = document.querySelector(".unrel");
  const chat = document.querySelector(".chat");
  if (!sec || !chat) return;
  const grid = sec.querySelector(".unrel__grid");
  const cards = [...sec.querySelectorAll(".ucard")];
  makeRectCursor(sec, grid, cards, () => "join the conversation");

  const log = chat.querySelector(".chat__log");
  const input = chat.querySelector(".chat__input");
  const topicEl = chat.querySelector(".chat__topic");
  let opener = null;
  const bubble = (who, text, me) => {
    const wrap = document.createElement("div");
    wrap.className = "chat__msg" + (me ? " chat__msg--me" : "");
    const w = document.createElement("p"); w.className = "who"; w.textContent = me ? "you" : who;
    const b = document.createElement("div"); b.className = "chat__bubble"; b.textContent = text;   // textContent = XSS-safe
    wrap.append(w, b); return wrap;
  };
  const open = (i, card) => {
    const d = CHATS[i]; if (!d) return;
    opener = card;
    topicEl.textContent = d.topic;
    log.innerHTML = "";
    d.msgs.forEach((m) => log.appendChild(bubble(m.who, m.text, false)));
    chat.hidden = false;
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; input.focus(); });
  };
  const close = () => { chat.hidden = true; if (opener) opener.focus(); };
  cards.forEach((c, i) => {
    c.setAttribute("role", "button");
    c.setAttribute("tabindex", "0");
    c.addEventListener("click", () => open(i, c));
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i, c); } });
  });
  chat.querySelector(".chat__close").addEventListener("click", close);
  chat.addEventListener("mousedown", (e) => { if (e.target === chat) close(); });   // backdrop
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !chat.hidden) close(); });
  chat.querySelector(".chat__bar").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input.value.trim(); if (!val) return;
    log.appendChild(bubble("you", val, true));
    input.value = "";
    log.scrollTop = log.scrollHeight;
    const q = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    setTimeout(() => { if (!chat.hidden) { log.appendChild(bubble("Rehan", q, false)); log.scrollTop = log.scrollHeight; } }, 700);
  });
}

/* ---------- section 6 (creative): auto-scrolling sine band + drag-to-scrub grid reel ---------- */
const CBAND_REPEATS = 4;   // must match the phrase-block count in the .cband textPath
function initCreative() {
  // band text scrolls continuously along the curved path (time-based, NOT scroll-linked)
  const tp = document.querySelector(".cband__text");
  if (tp && !reduce) {
    let off = 0, unit = 0;
    const step = () => {
      if (!unit) { const total = tp.getComputedTextLength(); if (total) unit = total / CBAND_REPEATS; }
      off -= 0.6;
      if (unit && off <= -unit) off += unit;   // wrap seamlessly (one phrase block)
      tp.setAttribute("startOffset", off);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  // reel: drag-to-scrub on desktop, native swipe on touch
  const reel = document.querySelector(".reel");
  if (reel) {
    let down = false, sx = 0, sl = 0;
    reel.addEventListener("pointerdown", (e) => { down = true; sx = e.clientX; sl = reel.scrollLeft; reel.classList.add("is-drag"); reel.setPointerCapture(e.pointerId); });
    reel.addEventListener("pointermove", (e) => { if (down) reel.scrollLeft = sl - (e.clientX - sx); });
    const end = () => { down = false; reel.classList.remove("is-drag"); };
    reel.addEventListener("pointerup", end);
    reel.addEventListener("pointercancel", end);
  }
}

/* ---------- hero card positions ----------
   Landing: a loosely dropped stack - uneven overlap + varied angles (not a
   perfect arc), so it reads like real cards set down, not a fanned template. */
const FAN = [
  { x: -0.225, y:   8, r: -12 },
  { x: -0.130, y: -11, r:   6 },
  { x: -0.030, y:   3, r:  -5 },
  { x:  0.078, y: -13, r:  11 },
  { x:  0.171, y:   5, r:  -8 },
  { x:  0.255, y:  13, r:  15 },
];
function fanPos(i) {
  const s = Math.min(window.innerWidth, 1180);
  const f = FAN[i] || { x: 0, y: 0, r: 0 };
  // anchor the stack's TOP at a fixed fraction so bigger cards keep the old gap below the CTA
  // (adding cardH/2 cancels the card height from the top position).
  const cardW = Math.max(112, Math.min(192, window.innerWidth * 0.125));
  const cardH = cardW * 16 / 9;
  return { x: f.x * s, y: window.innerHeight * 0.29 + cardH / 2 + f.y, r: f.r };
}
function ringPos(i) {
  const rx = window.innerWidth * 0.34, ry = window.innerHeight * 0.32;
  const ring = [
    { x: -rx, y: -ry * 0.72, r: -9 }, { x: rx, y: -ry * 0.78, r: 8 },
    { x: -rx * 1.16, y: ry * 0.16, r: -5 }, { x: rx * 1.16, y: ry * 0.10, r: 5 },
    { x: -rx * 0.52, y: ry * 0.98, r: 4 }, { x: rx * 0.58, y: ry * 0.98, r: -7 },
  ];
  return ring[i % ring.length];
}
function placeFan() { cards.forEach((c, i) => { const f = fanPos(i); gsap.set(c, { x: f.x, y: f.y, rotation: f.r, xPercent: -50, yPercent: -50 }); }); }

function initScroll() {
  if (!gsap || !ScrollTrigger) return;

  if (reduce) {
    cards.forEach((c, i) => { const r = ringPos(i); gsap.set(c, { x: r.x, y: r.y, rotation: r.r, xPercent: -50, yPercent: -50 }); });
    return;
  }

  placeFan();
  ScrollTrigger.addEventListener("refreshInit", placeFan);

  // HERO: fan -> ring
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } });
  cards.forEach((c, i) => {
    heroTl.to(c, { x: () => ringPos(i).x, y: () => ringPos(i).y, rotation: () => ringPos(i).r, ease: "power2.inOut", duration: 0.7 }, 0);
  });

  // THE FLIP: 16:9 crop collapses to a 9:16 cell -> orange fills the cell -> the crop
  // becomes the border of the orange and they expand together to cover the viewport
  // (the one place the crop is allowed to cut the grid) -> crop fades once filled ->
  // white grid fades in -> copy resolves.
  const COVER = 12;
  gsap.timeline({ scrollTrigger: { trigger: ".flip", start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } })
    .to(".crop", { width: "16.4%", ease: "power2.inOut", duration: 0.22 }, 0.08)      // collapse 3 cells -> centre cell
    .fromTo(".flip__orange", { scale: 0 }, { scale: 1, ease: "power1.out", duration: 0.12 }, 0.32)  // fill cell up to the crop border
    .to([".flip__orange", ".crop"], { scale: COVER, ease: "power2.in", duration: 0.28 }, 0.44)      // crop = border, expands with the orange
    .to(".flip__whitegrid", { opacity: 1, duration: 0.14 }, 0.60)
    .to(".crop", { autoAlpha: 0, duration: 0.08 }, 0.66)                              // crop disappears once it has filled
    .fromTo(".flip__copy", { autoAlpha: 0, y: () => -window.innerHeight * 0.055 + 24 }, { autoAlpha: 1, y: () => -window.innerHeight * 0.055, ease: "power2.out", duration: 0.20 }, 0.70)
    .to({}, { duration: 0.08 });
  // nav stays in its light variant through the flip (no dark switch on the orange fill).
}

initNav();
initScroll();
initReveals();
initReceipts();
initWhatWeDo();
initCreative();
initUnrelated();
initFounder();
initCounter();
initToTop();
window.addEventListener("load", () => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
