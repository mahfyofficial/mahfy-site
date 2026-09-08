/* ============================================================
   MAHFY — front-end logic
   ============================================================ */
(function () {
  "use strict";
  const P = window.MAHFY_PRICES || { items: {}, currency: "₹", unit: "kg", updated: "" };
  const CFG = window.MAHFY_CONFIG || {};
  const CATS = window.MAHFY_CATEGORIES || [];
  const PRODUCTS = window.MAHFY_PRODUCTS || [];
  const TRADE = window.MAHFY_TRADEGRADES || [];
  const CUR = P.currency || "₹";
  const UNIT = P.unit || "kg";
  const $ = (s, r = document) => r.querySelector(s);

  const fmt = (n) => CUR + Number(n).toLocaleString("en-IN");

  // Merge catalog + live prices
  const items = PRODUCTS.map((p) => {
    const pr = (P.items && P.items[p.id]) || {};
    return { ...p, price: pr.price ?? null, inStock: pr.inStock !== false, priceName: pr.name };
  });

  /* ---------- updated label + config ---------- */
  const upd = P.updated ? new Date(P.updated + "T00:00:00") : null;
  const updText = upd
    ? upd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  $("#updatedLabel").textContent = updText;
  if (CFG.tagline) $("#heroTagline").textContent = CFG.tagline;
  $("#ciLoc").textContent = CFG.location || "—";
  const email = CFG.email || "";
  const emailEl = $("#ciEmail");
  emailEl.textContent = email || "—";
  emailEl.href = email ? "mailto:" + email : "#";

  const digits = (s) => (s || "").replace(/\D/g, "");
  function displayNumber(raw) {
    const s = String(raw || "").trim();
    if (!s) return "—";
    if (s.startsWith("+")) return s;
    const d = digits(s);
    if (d.length === 12 && d.startsWith("91") && /^\d+$/.test(s)) {
      return "+91 " + d.slice(2, 7) + " " + d.slice(7);
    }
    if (d.length === 10 && /^\d+$/.test(s)) {
      return "+91 " + d.slice(0, 5) + " " + d.slice(5);
    }
    return "+" + s;
  }
  const waRaw = CFG.whatsapp || CFG.phone || "";
  const phoneRaw = CFG.phone || CFG.whatsapp || "";
  const waNum = digits(waRaw);
  const phoneNum = digits(phoneRaw) || waNum;
  const waUrl = waNum ? `https://wa.me/${waNum}` : "#";
  const telHref = phoneNum ? "tel:+" + phoneNum : "#";
  const displayPhone = displayNumber(phoneRaw);
  const displayWa = displayNumber(waRaw);
  const phoneEl = $("#ciPhone");
  phoneEl.textContent = displayPhone;
  phoneEl.href = telHref;
  const waNumEl = $("#ciWaNum");
  if (waNumEl) waNumEl.textContent = displayWa;
  const waLink = $("#ciWa");
  if (waLink) waLink.href = waUrl;
  const floatWa = $("#floatWa");
  if (floatWa) floatWa.href = waUrl;
  const modalPhone = $("#modalPhone");
  const modalWa = $("#modalWa");
  const modalPhoneNum = $("#modalPhoneNum");
  const modalWaNum = $("#modalWaNum");
  if (modalPhone) modalPhone.href = telHref;
  if (modalWa) modalWa.href = waUrl;
  if (modalPhoneNum) modalPhoneNum.textContent = displayPhone;
  if (modalWaNum) modalWaNum.textContent = displayWa;
  const modalEmail = $("#modalEmail");
  const modalEmailAddr = $("#modalEmailAddr");
  if (modalEmail && email) modalEmail.href = "mailto:" + email;
  if (modalEmailAddr && email) modalEmailAddr.textContent = email;
  $("#year").textContent = new Date().getFullYear();

  /* ---------- ticker ---------- */
  (function ticker() {
    const track = $("#tickerTrack");
    const priced = items.filter((i) => i.price != null);
    const one = priced
      .map(
        (i) =>
          `<span class="tk"><span class="dot"></span>${i.priceName || i.tier} <b>${fmt(
            i.price
          )}</b>/<span>${UNIT}</span></span>`
      )
      .join("");
    track.innerHTML = one + one; // duplicate for seamless loop
  })();

  const PACK_DEFS = [
    { label: "100 g", g: 100 },
    { label: "250 g", g: 250 },
    { label: "500 g", g: 500 },
    { label: "1 kg", g: 1000 },
    { label: "2 kg", g: 2000 },
    { label: "5 kg", g: 5000 },
  ];
  const PACKS = CFG.cardamomPacks || PACK_DEFS.map((p) => p.label);
  const packPrice = (perKg, grams) => Math.round(Number(perKg) * grams / 1000);
  const packSizes = $("#packSizes");
  if (packSizes) {
    packSizes.innerHTML = PACKS.map(
      (s, i) =>
        `<span class="pack-chip${i === PACKS.length - 1 ? " pack-chip-max" : ""}">${s}</span>`
    ).join("");
  }

  /* ---------- filters ---------- */
  const filters = $("#filters");
  let active = "all";
  if (CATS.length <= 1) {
    filters.hidden = true;
    filters.innerHTML = "";
  } else {
  const chips = [{ id: "all", label: "All", icon: "✦" }, ...CATS];
  filters.innerHTML = chips
    .map(
      (c) =>
        `<button class="chip${c.id === "all" ? " active" : ""}" data-cat="${c.id}"><span class="i">${
          c.icon || ""
        }</span>${c.label}</button>`
    )
    .join("");
    filters.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      active = b.dataset.cat;
      filters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
      renderGrid();
    });
  }

  /* ---------- product grid ---------- */
  const grid = $("#productGrid");
  function renderGrid() {
    const list = items.filter((i) => active === "all" || i.category === active);
    grid.innerHTML = list
      .map((i) => {
        const foot = i.inStock
          ? `<button class="ask" type="button" aria-label="Enquire about ${i.tier}">Ask</button>`
          : `<span class="oos">Sold out</span>`;
        const img = i.image
          ? `<div class="card-photo"><img src="${i.image}" alt="${i.priceName || i.tier}" loading="lazy" width="480" height="320"></div>`
          : "";
        const packs =
          i.price != null
            ? `<div class="pack-row pack-prices" aria-label="Pack prices">${PACK_DEFS.map(
                (s) =>
                  `<span><em>${s.label}</em> ${fmt(packPrice(i.price, s.g))}</span>`
              ).join("")}</div>`
            : `<div class="pack-row" aria-label="Available pack sizes">${PACKS.map(
                (s) => `<span>${s}</span>`
              ).join("")}</div>`;
        const priceHtml =
          i.price != null
            ? `<div class="price">${fmt(i.price)}<small>/${UNIT}</small><em class="ship-mini">+ shipping extra</em></div>`
            : `<div class="price">—</div>`;
        return `
        <article class="card reveal${i.category === "cardamom" ? " card-elaichi" : ""}" data-tilt>
          ${img}
          <div class="card-top">
            <div><div class="tier">${i.tier}</div></div>
            <span class="size-pill">${i.size}</span>
          </div>
          <div class="grade-line">${i.grade}</div>
          <p class="blurb">${i.blurb}</p>
          ${packs}
          <div class="tags">${(i.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          <div class="card-foot">${priceHtml}${foot}</div>
        </article>`;
      })
      .join("");
    bindTilt();
    observeReveals();
  }

  /* ---------- grading scale ---------- */
  (function gradeScale() {
    const scale = [
      { t: "Premium", mm: "8 mm+", p: "Jumbo pods for premium retail, gifting & export." },
      { t: "Select", mm: "7–8 mm", p: "Bold, aromatic — premium everyday retail & food service." },
      { t: "Classic", mm: "6–7 mm", p: "Balanced flavour & aroma. The mainstream value grade." },
      { t: "Value", mm: "5–6 mm", p: "Smaller pods for home cooking & spice blending." },
      { t: "Processing", mm: "< 5 mm", p: "For powder, extracts & bulk spice blends." },
    ];
    $("#gradeScale").innerHTML = scale
      .map(
        (g) =>
          `<div class="gs reveal"><div class="bar"></div><h4>${g.t}</h4><span class="mm">${g.mm}</span><p>${g.p}</p></div>`
      )
      .join("");
  })();

  /* ---------- trade table ---------- */
  $("#tradeTable tbody").innerHTML = TRADE.map(
    (r) =>
      `<tr><td>${r.grade}</td><td>${r.size}</td><td>${r.note}</td><td class="band">${CUR}${r.band}</td></tr>`
  ).join("");

  const packTable = $("#packPriceTable tbody");
  if (packTable) {
    packTable.innerHTML = items
      .map((i) => {
        const cells =
          i.price != null
            ? PACK_DEFS.map((s) => `<td class="band">${fmt(packPrice(i.price, s.g))}</td>`).join("")
            : PACK_DEFS.map(() => `<td>—</td>`).join("");
        return `<tr><td>${i.tier}<br><small>${i.category} · ${i.size}</small></td>${cells}</tr>`;
      })
      .join("");
  }

  /* ---------- enquiry modal ---------- */
  const drawer = $("#drawer");
  const scrim = $("#drawerScrim");

  function openDrawer() {
    scrim.classList.add("open");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeDrawer() {
    scrim.classList.remove("open");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest(".ask")) return openDrawer();
  });
  $("#cartBtn").addEventListener("click", openDrawer);
  const visitEnquire = $("#visitEnquire");
  if (visitEnquire) visitEnquire.addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", (e) => {
    if (e.target === scrim) closeDrawer();
  });

  /* ---------- card tilt + glow ---------- */
  function bindTilt() {
    grid.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--mx", px + "%");
        el.style.setProperty("--my", py + "%");
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  let io;
  function observeReveals() {
    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12 }
      );
    }
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

  const toTop = $("#toTop");
  const onScroll = () => {
    if (toTop) toTop.classList.toggle("show", window.scrollY > 420);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- story count-up ---------- */
  (function countUp() {
    const nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    const play = (el) => {
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const dur = 900;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          play(en.target);
          cio.unobserve(en.target);
        });
      },
      { threshold: 0.4 }
    );
    nums.forEach((n) => cio.observe(n));
  })();
  renderGrid();
  observeReveals();
})();
