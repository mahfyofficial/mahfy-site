/* MAHFY storefront */
(function () {
  "use strict";
  const CFG = window.MAHFY_CONFIG || {};
  const CATS = window.MAHFY_CATEGORIES || [];
  const RAW = window.MAHFY_PRODUCTS || [];
  const PRICES = window.MAHFY_PRICES || { items: {}, updated: "" };
  const ARTICLES = window.MAHFY_ARTICLES || [];
  const WEIGHTS = CFG.weights || [];
  const CUR = (PRICES.currency || CFG.currency || "₹");
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");

  const products = RAW.map((p) => {
    const pr = (PRICES.items && PRICES.items[p.id]) || {};
    return {
      ...p,
      pricePerKg: pr.price ?? p.pricePerKg ?? null,
      inStock: pr.inStock !== false,
      priceName: pr.name || p.name,
      updatedAt: PRICES.updated || p.updatedAt || ""
    };
  });

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const fmt = (n) => CUR + Number(n).toLocaleString("en-IN");
  const packPrice = (perKg, grams) => Math.round(Number(perKg) * Number(grams) / 1000);
  const dateLabel = PRICES.updated
    ? new Date(PRICES.updated + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "—";

  function digits(s) {
    return String(s || "").replace(/\D/g, "");
  }
  function inNumber(s) {
    let n = digits(s);
    if (n.length === 10) n = "91" + n;
    return n;
  }
  function waNumber() {
    return inNumber(CFG.whatsapp);
  }
  function phoneNumber() {
    return inNumber(CFG.phone);
  }
  function telHref() {
    const n = phoneNumber();
    return n ? "tel:+" + n : "";
  }
  function waBase() {
    const n = waNumber();
    return n ? "https://wa.me/" + n : "https://wa.me/";
  }
  function waLink(text) {
    const msg = encodeURIComponent(text || CFG.waMessage || "");
    const n = waNumber();
    if (n) return "https://api.whatsapp.com/send?phone=" + n + "&text=" + msg;
    return "https://api.whatsapp.com/send?text=" + msg;
  }
  function gramsLabel(g) {
    const w = WEIGHTS.find((x) => x.grams === Number(g));
    return w ? w.label : g + " g";
  }

  function ticker() {
    const bits = products
      .filter((p) => p.pricePerKg != null)
      .map((p) => `<span class="tk">${p.name}${p.grade ? " (" + p.grade + ")" : ""} <b>${fmt(p.pricePerKg)}</b>/kg</span>`);
    const extra = `<span class="tk tk-ship">Shipping charges extra</span><span class="tk">Home kitchen</span><span class="tk">Going abroad</span><span class="tk">Cardamom seed</span>`;
    const html = bits.join("<span class='tk'>·</span>") + extra;
    $("#tickerTrack").innerHTML = html + html;
  }

  function setWa() {
    const href = waLink(CFG.waMessage);
    ["enquiryBtn", "enquiryBtnNav", "enquiryBtnIcon", "floatWa"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.href = href;
    });
    const call = telHref();
    ["callBtn", "callBtnNav"].forEach((id) => {
      const el = $("#" + id);
      if (el && call) el.href = call;
    });
    const foot = $("#footerWa");
    if (foot) {
      const n = waNumber();
      foot.innerHTML = n
        ? `WhatsApp: <a href="${href}" target="_blank" rel="noopener noreferrer">+${n}</a>`
        : `WhatsApp: <a href="${href}" target="_blank" rel="noopener noreferrer">Chat with MAHFY</a>`;
    }
    const footPhone = $("#footerPhone");
    if (footPhone) {
      const n = phoneNumber();
      footPhone.innerHTML = n
        ? `Call: <a href="${call}">+${n}</a>`
        : "";
    }
  }

  function setOrgJson() {
    const el = $("#jsonld-org");
    if (!el) return;
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "MAHFY",
      email: CFG.email,
      telephone: phoneNumber() ? "+" + phoneNumber() : undefined,
      address: { "@type": "PostalAddress", addressRegion: "Kerala", addressCountry: "IN" },
      sameAs: [CFG.instagramUrl]
    });
  }

  function title(t) {
    document.title = t + " — MAHFY";
  }

  function productCard(p) {
    const start = p.pricePerKg != null ? packPrice(p.pricePerKg, 100) : null;
    const cat = (CATS.find((c) => c.id === p.category) || {}).label || p.category;
    const seed = p.id === "card-seeds";
    return `<article class="card card-${p.category}${seed ? " card-featured" : ""}">
      <a href="#/product/${p.id}" data-link>
        <div class="card-img"><img src="${p.images[0]}" alt="${p.name}" />${seed ? `<span class="card-badge">Home &amp; abroad</span>` : ""}</div>
        <div class="card-body">
          <p class="kicker">${cat}${seed ? " · Seed" : ""}</p>
          <h3>${p.name}</h3>
          <p class="meta">${p.grade}${p.type ? " · " + p.type : ""} · Origin: ${p.origin}</p>
          <p class="price">${start != null ? "From " + fmt(start) + " / 100 g" : "Price on enquiry"}</p>
          <p class="ship-flag">Shipping charges extra</p>
          <p class="meta">Available</p>
          <div class="weights">${WEIGHTS.map((w) => `<span>${w.label}</span>`).join("")}</div>
          <span class="btn btn-line">Choose pack</span>
        </div>
      </a>
      <p class="card-wa">
        <a class="btn btn-wa" href="${waLink(
          "Hi MAHFY, I would like to order " + p.name + (p.grade ? " (" + p.grade + ")" : "") + ". Packs from 100 g to 5 kg. Shipping extra."
        )}" target="_blank" rel="noopener noreferrer">Buy on WhatsApp</a>
      </p>
    </article>`;
  }

  function home() {
    title("Kerala spices for home and abroad");
    const featured = products.filter((p) =>
      ["card-seeds", "card-8mm", "pepper-malabar", "coffee-arabica"].includes(p.id)
    );
    const ig = [
      "assets/spices/cardamom-seed-kernels.jpg",
      "assets/spices/cardamom-8mm.jpg",
      "assets/kerala-plantation.jpg",
      "assets/spices/pepper-malabar.jpg?v=2",
      "assets/spices/coffee-arabica.jpg?v=2",
      "assets/packaging-care.jpg",
      "assets/spices/cardamom-7-8mm.jpg",
      "assets/spices/cardamom-6-7mm.jpg",
      "assets/spices/cardamom-benefits.jpg"
    ];
    return `<section class="wrap hero">
      <div class="hero-copy">
        <p class="kicker">In stock · Packed to order</p>
        <h1>Smell it. Cook it. Take it with you.</h1>
        <p class="sub">Kerala cardamom seed, pepper and coffee — packs from 100 g, ready for the kitchen or a suitcase.</p>
        <p>This is a shop, not a brochure. Pick a grade, tap WhatsApp, we pack. Home cooks and people going abroad for work or study order the same way.</p>
        <p class="ship-callout">${CFG.shippingNote}</p>
        <div class="hero-cta">
          <a class="btn btn-dark" href="#/product/card-seeds" data-link>Buy cardamom seed</a>
          <a class="btn btn-wa" href="${waLink(CFG.waMessage)}" target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>
          <a class="btn btn-line" href="#/shop" data-link>See all spices</a>
        </div>
        <div class="trust">
          <span class="pill">Cardamom seed in stock</span>
          <span class="pill">100 g – 5 kg</span>
          <span class="pill">Home kitchen</span>
          <span class="pill">Going abroad</span>
          <span class="pill pill-ship">Shipping extra</span>
        </div>
        <p class="note">Prices updated: ${dateLabel}. ${CFG.priceNote}</p>
      </div>
      <div class="hero-visual">
        <img class="hero-main" src="assets/spices/cardamom-seed-kernels.jpg" alt="Kerala cardamom seed" />
        <div class="hero-stack">
          <img src="assets/spices/cardamom-8mm.jpg" alt="Cardamom pods" />
          <img src="assets/spices/pepper-malabar.jpg?v=2" alt="Black pepper" />
          <img src="assets/spices/coffee-arabica.jpg?v=2" alt="Coffee beans" />
        </div>
      </div>
    </section>
    <section class="wrap section shop-first">
      <div class="center">
        <p class="kicker">Buy now</p>
        <h2>Start with a pack.</h2>
        <p class="lead">Cardamom seed is the compact kernel — chai, masala, and lighter to carry abroad. Prices from 100 g.</p>
      </div>
      <div class="grid-4" style="margin-top:2rem">${featured.map(productCard).join("")}</div>
      <p class="center" style="margin-top:1.5rem"><a class="btn btn-dark" href="#/shop" data-link>Shop the full cupboard</a></p>
    </section>
    <section class="wrap section">
      <div class="center">
        <p class="kicker">Who we pack for</p>
        <h2>Two kitchens. One order.</h2>
        <p class="lead">Tell us on WhatsApp whether the pack is for the house, or you are going abroad for work or study.</p>
      </div>
      <div class="audience">
        <article>
          <p class="kicker">Home use</p>
          <h3>For the Kerala kitchen at home</h3>
          <p class="muted">Smaller packs for chai, rice and weekly cooking. Choose a cardamom grade by pod size, or cardamom seed if you want the kernel ready for tea and sweets. Pepper and coffee in quantities you will actually finish.</p>
          <p style="margin-top:1rem"><a class="btn btn-line" href="#/shop" data-link>Shop home packs</a></p>
        </article>
        <article>
          <p class="kicker">Going abroad</p>
          <h3>For work or study overseas</h3>
          <p class="muted">Sealed packs for people migrating for a job or a course — Gulf, Europe, the UK, the US and elsewhere. Cardamom seed is compact — more flavour for the weight in a suitcase. We pack clean and tight; you check airline and destination rules before you fly.</p>
          <p style="margin-top:1rem"><a class="btn btn-wa" href="${waLink(
            "Hi MAHFY, I am going abroad for work / study and packing spices to take with me. Please suggest cardamom (pods or seed), pepper and pack sizes."
          )}" target="_blank" rel="noopener noreferrer">Pack for going abroad</a></p>
        </article>
      </div>
    </section>
    <section class="wrap section split">
      <div>
        <p class="kicker">Cardamom seed</p>
        <h2>The kernel. No husk. Ready for chai.</h2>
        <p class="muted">This is the inner seed, husked from green cardamom. Use it in tea, sweets and masala. People going abroad often choose seed because it travels lighter than a bag of pods. Whole pods are still listed by millimetre if you want the look of the pod.</p>
        <p class="ship-callout">From packs of 100 g · Shipping extra</p>
        <p class="hero-cta" style="margin-top:1.1rem">
          <a class="btn btn-dark" href="#/product/card-seeds" data-link>Buy cardamom seed</a>
          <a class="btn btn-line" href="#/shop/cardamom" data-link>See all cardamom</a>
        </p>
      </div>
      <img class="benefits-img" src="assets/spices/cardamom-seed-kernels.jpg" alt="Kerala cardamom seed kernels" />
    </section>
    <section class="dark-band why">
      <div class="wrap">
        <div class="center">
          <p class="kicker">Why MAHFY?</p>
          <h2>Home cook. Going abroad. Honest grades.</h2>
        </div>
        <div class="grid-4" style="margin-top:2rem">
          <article class="card"><div class="card-body"><h3>Home kitchen</h3><p>Packs you will use — 100 g to 5 kg — not wholesale lots.</p></div></article>
          <article class="card"><div class="card-body"><h3>Going abroad</h3><p>Sealed bags for suitcase packing when you leave for a job or studies. Ask us what travels well.</p></div></article>
          <article class="card"><div class="card-body"><h3>Clear grades</h3><p>Cardamom by pod size, plus cardamom seed. Choose by need and budget.</p></div></article>
          <article class="card"><div class="card-body"><h3>Kerala origin</h3><p>Cardamom, pepper and coffee sourced from Kerala.</p></div></article>
        </div>
      </div>
    </section>
    <section class="wrap section">
      <div class="split">
        <div>
          <p class="kicker">Packed with care.</p>
          <h2>Every order is prepared with attention to cleanliness, freshness and a seal that holds — on the shelf at home, and in a bag when you travel.</h2>
          <p class="muted" style="margin-top:1rem">We pack to order in food-safe bags. Shipping is arranged after you place the order. Shipping charges are extra unless a specific offer says otherwise. If you are flying, tell us on WhatsApp so we can pack tight; airline and customs rules are yours to check.</p>
        </div>
        <img src="assets/packaging-care.jpg" alt="Spices packed in kraft bags" style="border-radius:18px;width:100%;object-fit:cover;aspect-ratio:4/3" />
      </div>
    </section>
    <section class="wrap section">
      <div class="center">
        <p class="kicker">Kitchen</p>
        <h2>How to choose and store</h2>
      </div>
      <div class="grid-3" style="margin-top:2rem">
        ${ARTICLES.slice(0, 3).map(articleCard).join("")}
      </div>
      <p class="center" style="margin-top:1.4rem"><a class="btn btn-line" href="#/kitchen" data-link>Read the journal</a></p>
    </section>
    <section class="wrap section center">
      <p class="kicker">Instagram</p>
      <h2>Follow the MAHFY journey.</h2>
      <p class="lead">@mahfy_official</p>
      <div class="ig-grid" style="margin:1.6rem 0">${ig.map((src) => `<img src="${src}" alt="MAHFY" />`).join("")}</div>
      <a class="btn btn-dark" href="${CFG.instagramUrl}" target="_blank" rel="noopener noreferrer">Follow us on Instagram</a>
    </section>`;
  }

  function articleCard(a) {
    return `<article class="card">
      <a href="#/kitchen/${a.slug}" data-link>
        <div class="card-img"><img src="${a.image}" alt="" /></div>
        <div class="card-body">
          <p class="meta">${a.minutes} min · ${a.date}</p>
          <h3>${a.title}</h3>
          <p class="muted">${a.excerpt}</p>
        </div>
      </a>
    </article>`;
  }

  function shop(cat) {
    title("Shop");
    const active = cat || "all";
    const list = products.filter((p) => active === "all" || p.category === active);
    return `<section class="wrap page-head">
      <p class="kicker">Shop</p>
      <h1>Take a pack home.</h1>
      <p class="muted">Cardamom seed, pods by millimetre, pepper, coffee — tap WhatsApp and we pack. 100 g to 5 kg.</p>
      <div class="filters">
        <button class="chip ${active === "all" ? "active" : ""}" data-cat="all">All</button>
        ${CATS.map((c) => `<button class="chip ${active === c.id ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
      </div>
      <div class="grid-3">${list.map(productCard).join("") || `<p class="empty">Nothing in this category yet. <a href="${waLink(CFG.waMessage)}" target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>.</p>`}</div>
    </section>`;
  }

  function productPage(id) {
    const p = byId[id];
    if (!p) return notFound();
    title(p.name);
    const json = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      image: p.images,
      brand: { "@type": "Brand", name: "MAHFY" },
      offers: p.pricePerKg
        ? {
            "@type": "Offer",
            priceCurrency: "INR",
            price: packPrice(p.pricePerKg, 100),
            availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        : undefined
    };
    return `<section class="wrap section pdp" data-product="${p.id}">
      <script type="application/ld+json">${JSON.stringify(json)}</script>
      <div class="gallery">
        <img id="mainPhoto" src="${p.images[0]}" alt="${p.name}" />
        <div class="thumbs">${p.images.map((src, i) => `<button type="button" data-src="${src}" class="${i === 0 ? "active" : ""}"><img src="${src}" alt="" /></button>`).join("")}</div>
      </div>
      <div>
        <p class="kicker">${p.category}</p>
        <h1>${p.name}</h1>
        <p class="meta">Grade: ${p.grade}${p.type ? " · " + p.type : ""} · Origin: ${p.origin}</p>
        <p>${p.description}</p>
        <p class="price" id="pdpPrice">${p.pricePerKg != null ? fmt(packPrice(p.pricePerKg, 100)) : "—"}</p>
        <p class="note" id="pdpUnit">${p.pricePerKg != null ? fmt(p.pricePerKg) + " / kg · MAHFY retail" : ""}</p>
        <p class="ship-callout">Shipping charges extra — not included in this price.</p>
        <div class="sell-path">
          <p class="kicker">How to buy</p>
          <p>This is a catalogue. You choose the product, tell us <strong>home kitchen</strong> or <strong>going abroad for work or study</strong>, then order on WhatsApp. We confirm grade, weight and a seal that fits that use.</p>
          <div class="audience audience-compact">
            <article>
              <p class="kicker">Home use</p>
              <h3>For the kitchen at home</h3>
              <p class="muted">${p.id === "card-seeds" ? "Seed is ready for chai, sweets and masala — no husk to pick. Start with 100 g or 250 g if you are trying the lot; 500 g or 1 kg for the regular cupboard." : "Start with 100 g or 250 g to try a grade. 500 g and 1 kg suit weekly Kerala cooking. Whole pods keep aroma on the shelf."}</p>
              <p style="margin-top:.8rem"><a class="btn btn-line" href="${waLink(
                "Hi MAHFY, this is for home use. I would like " + p.name + (p.grade ? " (" + p.grade + ")" : "") + ". Please suggest a pack size."
              )}" target="_blank" rel="noopener noreferrer">WhatsApp — home pack</a></p>
            </article>
            <article>
              <p class="kicker">Going abroad</p>
              <h3>For work or study overseas</h3>
              <p class="muted">${p.id === "card-seeds" ? "Seed travels lighter than whole pods — you carry the kernel, not the husk. Ask for a tight, sealed bag. Airline and destination rules are yours to check." : "Ask for a sealed pack to take with you. Cardamom seed is more compact if suitcase weight matters. You check airline and customs rules before you fly."}</p>
              <p style="margin-top:.8rem"><a class="btn btn-wa" href="${waLink(
                "Hi MAHFY, I am going abroad for work / study. I would like " + p.name + (p.grade ? " (" + p.grade + ")" : "") + ". Please suggest a sealed pack to take with me."
              )}" target="_blank" rel="noopener noreferrer">WhatsApp — going abroad</a></p>
            </article>
          </div>
        </div>
        <p class="kicker">Weight</p>
        <div class="weight-pick" id="weightPick">
          ${WEIGHTS.map((w, i) => `<button type="button" data-g="${w.grams}" class="${i === 0 ? "active" : ""}">${w.label}</button>`).join("")}
        </div>
        <p class="kicker">Quantity</p>
        <div class="qty-row">
          <button type="button" id="qtyMinus">−</button>
          <strong id="qtyVal">1</strong>
          <button type="button" id="qtyPlus">+</button>
        </div>
        <p class="note">Maximum 5 kg per order. Orders are placed on WhatsApp — there is no cart on this site.</p>
        <div class="hero-cta">
          <a class="btn btn-wa" id="waOrder" target="_blank" rel="noopener noreferrer" href="#">Buy this pack on WhatsApp</a>
        </div>
        <dl class="facts">
          <div><dt>Grade</dt><dd>${p.grade}</dd></div>
          <div><dt>Origin</dt><dd>${p.origin}</dd></div>
          <div><dt>Weight</dt><dd id="factWeight">100 g</dd></div>
          <div><dt>Packaging</dt><dd>${p.packaging}</dd></div>
          <div><dt>Storage</dt><dd>${p.storage}</dd></div>
          <div><dt>Best before</dt><dd>${p.bestBefore}</dd></div>
          <div><dt>Availability</dt><dd>${p.inStock ? "In stock" : "Sold out"}</dd></div>
        </dl>
        <p>Need help choosing a grade?</p>
        <a class="btn btn-line" id="waHelp" target="_blank" rel="noopener noreferrer" href="${waLink(
          "Hi MAHFY, I need help choosing a grade for " + p.name + "."
        )}">Ask us on WhatsApp</a>
        <div class="warn" id="pdpWarn" hidden></div>
      </div>
    </section>`;
  }

  function bindProduct(id) {
    const p = byId[id];
    if (!p) return;
    let grams = 100;
    let qty = 1;
    const priceEl = $("#pdpPrice");
    const unitEl = $("#pdpUnit");
    const qtyEl = $("#qtyVal");
    const warn = $("#pdpWarn");
    const factW = $("#factWeight");
    const waOrder = $("#waOrder");
    const maxG = CFG.maxGrams || 5000;
    function orderText() {
      const totalG = grams * qty;
      if (totalG > maxG) {
        return (
          "Hi MAHFY, I would like a bulk enquiry for " +
          p.name +
          (p.grade ? " (" + p.grade + ")" : "") +
          ". Requested weight: " +
          (totalG / 1000).toFixed(2) +
          " kg (above the 5 kg standard order)."
        );
      }
      const bits = [
        "Hi MAHFY, I would like to order:",
        "",
        "Product: " + p.name,
        p.grade ? "Grade: " + p.grade : "",
        "Pack: " + gramsLabel(grams),
        "Quantity: " + qty
      ];
      if (p.pricePerKg != null) {
        bits.push("Approx. product total: " + fmt(packPrice(p.pricePerKg, grams) * qty) + " (shipping extra)");
      }
      bits.push("", "Purpose: home use / going abroad for work or study (please confirm).", "Shipping charges extra. Please confirm availability and shipping.");
      return bits.filter(Boolean).join("\n");
    }
    function refresh() {
      if (factW) factW.textContent = gramsLabel(grams);
      if (p.pricePerKg != null) {
        const line = packPrice(p.pricePerKg, grams) * qty;
        priceEl.textContent = fmt(line);
        unitEl.textContent = fmt(packPrice(p.pricePerKg, grams)) + " / " + gramsLabel(grams) + " · " + fmt(p.pricePerKg) + " / kg";
      }
      const over = grams * qty > maxG;
      if (warn) {
        warn.hidden = !over;
        if (over) {
          warn.textContent =
            "MAHFY currently accepts orders up to 5 kg. This selection is over 5 kg — WhatsApp will send a bulk enquiry.";
        }
      }
      if (waOrder) {
        waOrder.href = waLink(orderText());
        waOrder.textContent = over ? "Bulk enquiry on WhatsApp" : "Buy this pack on WhatsApp";
      }
    }
    $("#weightPick").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      grams = Number(b.dataset.g);
      $("#weightPick").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      refresh();
    });
    $("#qtyMinus").onclick = () => {
      qty = Math.max(1, qty - 1);
      qtyEl.textContent = qty;
      refresh();
    };
    $("#qtyPlus").onclick = () => {
      qty += 1;
      qtyEl.textContent = qty;
      refresh();
    };
    document.querySelectorAll(".thumbs button").forEach((b) => {
      b.onclick = () => {
        $("#mainPhoto").src = b.dataset.src;
      };
    });
    refresh();
  }

  function pricesPage() {
    title("Prices");
    const rows = products
      .map((p) => {
        const cells = WEIGHTS.map((w) =>
          p.pricePerKg != null ? fmt(packPrice(p.pricePerKg, w.grams)) : "—"
        );
        return `<tr><td><strong>${p.name}</strong></td><td>${p.grade}</td>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      })
      .join("");
    return `<section class="wrap page-head">
      <p class="kicker">Prices</p>
      <h1>Simple, transparent pricing.</h1>
      <p class="muted">Our prices vary by product, grade and quantity. These are MAHFY retail rates — set above typical market/wholesale. Shipping is never included in the table.</p>
      <p class="ship-callout">${CFG.shippingNote}</p>
      <p class="note">Prices updated on ${dateLabel}. ${CFG.priceNote}</p>
      <div class="table-wrap" style="margin-top:1.2rem">
        <table>
          <thead><tr><th>Product</th><th>Grade</th>${WEIGHTS.map((w) => `<th>${w.label}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
  }

  function how() {
    title("How to order");
    return `<section class="wrap page-head">
      <p class="kicker">How to order</p>
      <h1>Order only on WhatsApp.</h1>
      <p class="muted">This site is a catalogue. There is no cart or checkout. Our selling method is simple: you tell us which kitchen the spices are for, we suggest the pack, you confirm on WhatsApp.</p>
      <div class="steps" style="margin-top:2rem">
        <article class="step"><span class="step-n">01</span><h3>Say home or going abroad</h3><p class="muted">Home kitchen in India, or packing spices to take with you for a job or studies. That decides pods vs seed, and how tightly we pack.</p></article>
        <article class="step"><span class="step-n">02</span><h3>Choose product and weight</h3><p class="muted">Cardamom pods, cardamom seed, pepper, coffee. 100 g to 5 kg.</p></article>
        <article class="step"><span class="step-n">03</span><h3>Message MAHFY on WhatsApp</h3><p class="muted">Share product, grade, quantity, PIN code, and whether you are flying.</p></article>
        <article class="step"><span class="step-n">04</span><h3>We confirm, pack and ship</h3><p class="muted">We pack in India. Shipping extra. If you carry the pack abroad, airline and customs rules are yours to check.</p></article>
      </div>
      <div class="audience" style="margin-top:2.5rem">
        <article>
          <p class="kicker">Home use</p>
          <h3>Everyday packs</h3>
          <p class="muted">Order what you will cook through. 100 g and 250 g for trying a grade; 500 g and 1 kg for the regular cupboard.</p>
        </article>
        <article>
          <p class="kicker">Going abroad</p>
          <h3>Packing for work or study overseas</h3>
          <p class="muted">Ask for a sealed pack to take with you. Cardamom seed and whole pepper travel compactly. We do not advise on airline or customs rules — check those yourself before you fly.</p>
        </article>
      </div>
      <div class="split" style="margin-top:3rem">
        <div>
          <h2>Start a WhatsApp chat</h2>
          <p class="muted">You can also email ${CFG.email} if you prefer.</p>
        </div>
        <div class="hero-cta">
          <a class="btn btn-wa" href="${waLink(CFG.waMessage)}" target="_blank" rel="noopener noreferrer">Enquiry on WhatsApp</a>
          <a class="btn btn-line" href="mailto:${CFG.email}">Email us</a>
        </div>
      </div>
    </section>`;
  }

  function kitchenList() {
    title("Kitchen");
    return `<section class="wrap page-head">
      <p class="kicker">Kitchen</p>
      <h1>Notes from the cupboard.</h1>
      <p class="muted">Short guides on grades, storage and how to choose.</p>
      <div class="grid-3" style="margin-top:2rem">${ARTICLES.map(articleCard).join("")}</div>
    </section>`;
  }

  function kitchenArticle(slug) {
    if (slug === "spices-for-home-and-pravasi") {
      location.hash = "#/kitchen/spices-for-home-and-abroad";
      return "";
    }
    const a = ARTICLES.find((x) => x.slug === slug);
    if (!a) return notFound();
    title(a.title);
    return `<article class="wrap section article">
      <p class="kicker">Kitchen</p>
      <h1>${a.title}</h1>
      <p class="meta">${a.date} · ${a.minutes} min read</p>
      <img class="cover" src="${a.image}" alt="" />
      <div class="body">${a.body.map((p) => `<p>${p}</p>`).join("")}</div>
      <p style="margin-top:1.5rem"><a class="btn btn-line" href="#/kitchen" data-link>All articles</a></p>
    </article>`;
  }

  function faqPage() {
    title("FAQ");
    const items = [
      ["What products does MAHFY sell?", "Kerala-origin cardamom (whole pods by millimetre grade, plus cardamom seed), black pepper, coffee and selected spices, in listed pack sizes."],
      ["What cardamom grades are available?", "Whole pods by size: 8 mm, 7–8 mm, 7 mm, 6–7 mm, 6 mm, 5 mm, 4 mm and 3 mm. We also sell cardamom seed (the inner kernel, husked). Check the shop for live availability and prices."],
      ["Who is MAHFY for?", "Home kitchens in India, and people going abroad for work or study who want to pack spices to take with them. Tell us which when you message — pack size and product (pods vs seed) often change with that."],
      ["Can you pack spices for me to carry abroad?", "Yes — we seal packs for suitcase packing. You must check airline, security and destination rules yourself. We do not ship the order as international cargo unless we agree that separately on WhatsApp."],
      ["What quantities can I order?", "Each product is offered in 100 g, 250 g, 500 g, 1 kg, 2 kg and 5 kg packs."],
      ["What is the maximum order quantity?", "5 kg per order. For more than 5 kg, please contact us for bulk enquiries."],
      ["Do you ship across India?", "We aim to ship across India. Availability and timing depend on courier service to your PIN code. We confirm this when we accept the order."],
      ["How are shipping charges calculated?", "Shipping charges are extra unless a specific offer says otherwise. We calculate them from weight and destination after you share your PIN code."],
      ["How should I store cardamom?", "Whole pods, airtight, away from heat, steam and sunlight. Crush just before use."],
      ["How should I store pepper?", "Keep whole pepper airtight. Crack or grind when you cook. Ground pepper should stay tightly closed."],
      ["How should I store coffee?", "Airtight, away from heat and moisture. Whole beans keep longer than ground coffee. Avoid the fridge if you can."],
      ["How can I contact MAHFY?", "Orders and enquiries go through WhatsApp. You can also email mahfyofficial@gmail.com or write to Instagram @mahfy_official."],
      ["Can I order on this website?", "No. There is no cart or checkout. Browse products, then tap Enquiry on WhatsApp or Order on WhatsApp."],
      ["Can I request a specific grade?", "Yes. Tell us the grade on WhatsApp. We confirm what is currently packed."],
      ["Can I order more than 5 kg?", "Not as a standard order. Send a bulk enquiry on WhatsApp."]
    ];
    const faqJson = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a }
      }))
    };
    return `<section class="wrap page-head faq">
      <script type="application/ld+json">${JSON.stringify(faqJson)}</script>
      <p class="kicker">FAQ</p>
      <h1>Good to know</h1>
      ${items
        .map(
          ([q, a], i) =>
            `<details ${i === 0 ? "open" : ""}><summary>${q}</summary><p>${a}</p></details>`
        )
        .join("")}
      <p class="warn">For orders above 5 kg: please contact us for bulk enquiries.</p>
    </section>`;
  }

  function about() {
    title("About");
    return `<section class="wrap page-head split">
      <div>
        <p class="kicker">About MAHFY</p>
        <h1>From Kerala, for two kitchens.</h1>
        <p>MAHFY packs Kerala spices and coffee for the home cook, and for people going abroad for a job or studies who want that same cupboard after they land.</p>
        <p class="muted">We are not a wholesale mandi and not a gift shop. We sell graded cardamom — including cardamom seed — pepper and coffee in 100 g to 5 kg packs, so a family can cook this month, or pack a tight bag to take abroad.</p>
        <p class="muted">Tell us on WhatsApp if the order is for home use or for travel. We confirm grade, pack size and a seal that holds. We do not claim certifications we have not stated. What you see on each product page is what we stand behind.</p>
      </div>
      <img src="assets/kerala-plantation.jpg" alt="Kerala hills" style="border-radius:18px;width:100%;object-fit:cover;aspect-ratio:4/5" />
    </section>`;
  }

  function contact() {
    title("Contact");
    return `<section class="wrap page-head">
      <p class="kicker">Contact</p>
      <h1>Write to MAHFY</h1>
      <p class="muted">${CFG.location} · ${CFG.hours}</p>
      <p><a href="mailto:${CFG.email}">${CFG.email}</a> · <a href="${CFG.instagramUrl}" target="_blank" rel="noopener noreferrer">@mahfy_official</a></p>
      <p class="hero-cta">
        <a class="btn btn-wa" href="${waLink(CFG.waMessage)}" target="_blank" rel="noopener noreferrer">Enquiry on WhatsApp</a>
        <a class="btn btn-line" href="${waLink("Hi MAHFY, this order is for home use. Please help me choose packs.")}" target="_blank" rel="noopener noreferrer">Home kitchen</a>
        <a class="btn btn-line" href="${waLink("Hi MAHFY, I am going abroad for work / study and packing spices to take with me. Please suggest a pack.")}" target="_blank" rel="noopener noreferrer">Going abroad pack</a>
        ${telHref() ? `<a class="btn btn-line" href="${telHref()}">Call ${CFG.phone ? "+" + phoneNumber() : ""}</a>` : ""}
      </p>
      <p class="note">${CFG.shippingNote} Maximum 5 kg per standard order.</p>
    </section>`;
  }

  function policy(kind) {
    const pages = {
      privacy: {
        t: "Privacy Policy",
        b: [
          "When you message MAHFY on WhatsApp or email, we use the details you share so we can reply and fulfil your order.",
          "We do not sell your contact details. Instagram and WhatsApp are third-party services with their own policies.",
          "Contact mahfyofficial@gmail.com for privacy questions."
        ]
      },
      terms: {
        t: "Terms & Conditions",
        b: [
          "This website is a catalogue. Orders are placed on WhatsApp, not through a cart or checkout on the site.",
          "Listed prices are for the product only. Shipping is extra unless stated. A standard order may not exceed 5 kg.",
          "Grades and availability can change with supply. We confirm the current lot when we accept the order on WhatsApp.",
          "Kerala, India."
        ]
      },
      shipping: {
        t: "Shipping Policy",
        b: [
          "Shipping charges are extra unless a specific offer says otherwise.",
          "We pack after the order is accepted on WhatsApp. Processing time depends on the day’s packing load; we will share an estimate when we confirm.",
          "Delivery across India depends on courier coverage for your PIN code. We do not promise a fixed number of days until the courier booking is made.",
          "Tracking, when the courier provides it, will be shared on WhatsApp or email."
        ]
      },
      refund: {
        t: "Refund / Cancellation Policy",
        b: [
          "You may cancel an order before it is packed by writing to mahfyofficial@gmail.com or WhatsApp.",
          "Once packed and handed to a courier, cancellation may not be possible.",
          "If goods arrive damaged, contact us promptly with photos of the pack. We will review a replacement or refund on a case-by-case basis.",
          "Taste preference alone is not a reason for return of opened spices."
        ]
      }
    };
    const p = pages[kind];
    title(p.t);
    return `<section class="wrap page-head article"><h1>${p.t}</h1>${p.b.map((x) => `<p class="muted">${x}</p>`).join("")}</section>`;
  }

  function notFound() {
    return `<section class="wrap page-head"><h1>Page not found</h1><p><a href="#/shop" data-link>Back to shop</a></p></section>`;
  }

  function render() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const root = parts[0] || "";
    if (root === "cart" || root === "checkout" || root === "order-confirmation") {
      location.hash = "#/how-to-order";
      return;
    }
    let html = "";
    let after = null;
    if (!root) html = home();
    else if (root === "shop") {
      html = shop(parts[1]);
      after = () => {
        document.querySelectorAll(".chip").forEach((c) => {
          c.onclick = () => {
            const cat = c.dataset.cat;
            location.hash = cat === "all" ? "#/shop" : "#/shop/" + cat;
          };
        });
      };
    } else if (root === "product") {
      html = productPage(parts[1]);
      after = () => bindProduct(parts[1]);
    } else if (root === "prices") html = pricesPage();
    else if (root === "how-to-order") html = how();
    else if (root === "kitchen" && parts[1]) html = kitchenArticle(parts[1]);
    else if (root === "kitchen") html = kitchenList();
    else if (root === "faq") html = faqPage();
    else if (root === "about") html = about();
    else if (root === "contact") html = contact();
    else if (root === "privacy") html = policy("privacy");
    else if (root === "terms") html = policy("terms");
    else if (root === "shipping") html = policy("shipping");
    else if (root === "refund") html = policy("refund");
    else html = notFound();

    app.innerHTML = html;
    document.querySelectorAll(".nav a[data-link]").forEach((a) => {
      const href = a.getAttribute("href");
      const home = !root;
      const on = (href === "#/" && home) || (href === "#/" + root && !home) || (href === "#/shop" && root === "shop");
      a.classList.toggle("active", on);
    });
    window.scrollTo(0, 0);
    if (after) after();
    closeMenu();
  }

  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  const navScrim = $("#navScrim");
  function closeMenu() {
    nav.classList.remove("open");
    document.body.classList.remove("nav-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    if (navScrim) {
      navScrim.classList.remove("is-open");
      navScrim.hidden = true;
    }
  }
  function openMenu() {
    nav.classList.add("open");
    document.body.classList.add("nav-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close menu");
    if (navScrim) {
      navScrim.classList.add("is-open");
      navScrim.hidden = false;
    }
  }
  menuBtn.onclick = () => {
    if (nav.classList.contains("open")) closeMenu();
    else openMenu();
  };
  if (navScrim) navScrim.onclick = closeMenu;

  addEventListener("hashchange", render);
  ticker();
  setWa();
  setOrgJson();
  if (!location.hash) location.hash = "#/";
  else render();
})();
