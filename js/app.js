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
    const extra = `<span class="tk tk-ship">Free delivery in India</span><span class="tk">Home kitchen</span><span class="tk">Going abroad</span><span class="tk">Cardamom seed</span>`;
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
    const ytFoot = $("#ytLinkFoot");
    if (ytFoot && CFG.youtubeUrl) ytFoot.href = CFG.youtubeUrl;
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
    const tel = phoneNumber() ? "+" + phoneNumber() : undefined;
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": SITE + "/#org",
          name: "MAHFY",
          url: SITE + "/",
          email: CFG.email,
          telephone: tel,
          logo: absAsset("assets/logo.png"),
          image: absAsset("assets/kerala-plantation.jpg"),
          address: { "@type": "PostalAddress", addressRegion: "Kerala", addressCountry: "IN" },
          sameAs: [CFG.instagramUrl, CFG.youtubeUrl].filter(Boolean)
        },
        {
          "@type": ["LocalBusiness", "OnlineStore"],
          "@id": SITE + "/#store",
          name: "MAHFY",
          url: SITE + "/",
          image: absAsset("assets/kerala-plantation.jpg"),
          telephone: tel,
          email: CFG.email,
          priceRange: "₹₹",
          openingHours: "Mo-Sa 09:00-18:00",
          address: { "@type": "PostalAddress", addressRegion: "Kerala", addressCountry: "IN" },
          areaServed: { "@type": "Country", name: "India" },
          currenciesAccepted: "INR",
          paymentAccepted: "UPI, Bank transfer, confirmed on WhatsApp",
          parentOrganization: { "@id": SITE + "/#org" }
        }
      ]
    });
  }

  const SITE = String(CFG.siteUrl || "https://mahfy.in").replace(/\/$/, "");
  const KEYWORDS = CFG.keywords || "";

  function absAsset(src) {
    if (!src) return SITE + "/assets/kerala-plantation.jpg";
    if (/^https?:/i.test(src)) return src.split("?")[0];
    return SITE + "/" + String(src).replace(/^\//, "").replace(/\?.*$/, "");
  }

  function pageUrl(path) {
    let p = path;
    if (!p) p = IS_FILE ? filePath : location.pathname || "/";
    if (!p.startsWith("/")) p = "/" + p;
    if (p !== "/" && p.endsWith("/")) p = p.slice(0, -1);
    return SITE + p;
  }

  function setHeadMeta(attr, key, value) {
    if (value == null || value === "") return;
    let el = document.head.querySelector("meta[" + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function setCanonical(href) {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.rel = "canonical";
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function setPageJson(data) {
    const el = $("#jsonld-page");
    if (!el) return;
    el.textContent = data ? JSON.stringify(data) : "";
  }

  function setSeo(opts) {
    const t = opts.title || "MAHFY";
    const full = /MAHFY/.test(t) ? t : t + " — MAHFY";
    document.title = full;
    const desc = opts.desc || "";
    const url = pageUrl(opts.path);
    const image = absAsset(opts.image || "assets/kerala-plantation.jpg");
    setHeadMeta("name", "description", desc);
    setHeadMeta("name", "keywords", opts.keywords || KEYWORDS);
    setCanonical(url);
    setHeadMeta("property", "og:title", full);
    setHeadMeta("property", "og:description", desc);
    setHeadMeta("property", "og:url", url);
    setHeadMeta("property", "og:image", image);
    setHeadMeta("property", "og:type", opts.type || "website");
    setHeadMeta("property", "og:site_name", "MAHFY");
    setHeadMeta("property", "og:locale", "en_IN");
    setHeadMeta("name", "twitter:card", "summary_large_image");
    setHeadMeta("name", "twitter:title", full);
    setHeadMeta("name", "twitter:description", desc);
    setHeadMeta("name", "twitter:image", image);
    if (!opts.json) setPageJson(null);
    else setPageJson(opts.json);
  }

  function title(t) {
    document.title = /MAHFY/.test(t) ? t : t + " — MAHFY";
  }

  function trackPage() {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: pageUrl(IS_FILE ? filePath : location.pathname),
      page_path: IS_FILE ? filePath : location.pathname
    });
  }

  const IS_FILE = location.protocol === "file:";
  let filePath = "/";

  function cleanPath(path) {
    let url = path || "/";
    if (url.charAt(0) === "#") url = url.slice(1);
    if (!url.startsWith("/")) url = "/" + url;
    if (url !== "/" && url.endsWith("/")) url = url.slice(0, -1);
    return url;
  }

  function stripHash() {
    if (!location.hash) return;
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
      location.hash = "";
    }
  }

  function go(path, replace) {
    const url = cleanPath(path);
    if (IS_FILE) {
      filePath = url;
      stripHash();
      render();
      return;
    }
    if (replace) history.replaceState(null, "", url);
    else if (url !== location.pathname) history.pushState(null, "", url);
    render();
  }

  function migrateHash() {
    const raw = location.hash || "";
    if (IS_FILE) {
      if (raw.indexOf("#/") === 0) {
        filePath = cleanPath(raw.slice(1));
      }
      stripHash();
      return;
    }
    if (!raw || raw === "#") return;
    if (raw === "#/") {
      history.replaceState(null, "", "/");
      return;
    }
    if (raw.indexOf("#/") === 0) {
      const next = "/" + raw.slice(2).replace(/^\/+/, "");
      history.replaceState(null, "", next || "/");
    }
  }

  function routeParts() {
    if (IS_FILE) {
      return filePath.replace(/^\/+/, "").split("/").filter(Boolean);
    }
    return location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  }

  function productCard(p) {
    const start = p.pricePerKg != null ? packPrice(p.pricePerKg, 100) : null;
    const cat = (CATS.find((c) => c.id === p.category) || {}).label || p.category;
    const seed = p.id === "card-seeds";
    return `<article class="card card-${p.category}${seed ? " card-featured" : ""}">
      <a href="/product/${p.id}" data-link>
        <div class="card-img"><img src="${p.images[0]}" alt="${p.name}" loading="lazy" />${seed ? `<span class="card-badge">Seed</span>` : ""}</div>
        <div class="card-body">
          <p class="kicker">${cat}</p>
          <h3>${p.name}</h3>
          <p class="meta">Grade: ${p.grade} · Origin: ${p.origin}</p>
          <p class="price">${start != null ? "From " + fmt(start) + " / 100 g" : "Price on enquiry"}</p>
          <p class="ship-flag">Free delivery</p>
          <div class="weights">${WEIGHTS.map((w) => `<span>${w.label}</span>`).join("")}</div>
          <span class="btn btn-line">Experience the aroma</span>
          <span class="micro">One opening. One aroma. You'll understand.</span>
        </div>
      </a>
      <p class="card-wa">
        <a class="btn btn-wa" href="${waLink(
          "Hi MAHFY, I would like to order " + p.name + (p.grade ? " (" + p.grade + ")" : "") + ". Packs from 100 g to 5 kg. Free delivery in India."
        )}" target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>
      </p>
    </article>`;
  }

  function sensoryLine(p) {
    if (p.id === "card-seeds") return "Open the pack. Let the aroma speak — seed, ready for chai.";
    if (p.category === "cardamom") return "Small pods. Big character — green cardamom from Kerala.";
    if (p.category === "pepper") return "Bold pepper. Real warmth.";
    if (p.category === "coffee") return "Coffee that makes the morning worth waiting for.";
    return "Some flavours don't need an introduction.";
  }

  function weightGroupsHtml(activeG) {
    const groups = [
      { label: "Just want to try it?", grams: [100] },
      { label: "Your regular kitchen supply", grams: [250, 500] },
      { label: "Stock up", grams: [1000, 2000] },
      { label: "Family / business kitchen", grams: [5000] }
    ];
    return groups
      .map((g) => {
        const btns = g.grams
          .map((gr) => {
            const w = WEIGHTS.find((x) => x.grams === gr);
            if (!w) return "";
            const on = Number(activeG) === gr ? "active" : "";
            return `<button type="button" data-g="${w.grams}" class="${on}">${w.label}</button>`;
          })
          .join("");
        return `<div class="size-group"><p>${g.label}</p><div class="weight-pick">${btns}</div></div>`;
      })
      .join("");
  }

  function loveList(p) {
    return `<ul class="love">
      <li>✓ Grade: ${p.grade}${p.type ? " · " + p.type : ""}</li>
      <li>✓ Origin: ${p.origin}</li>
      <li>✓ Packed to order in food-safe bags</li>
      <li>✓ Recommended use: ${p.description.split(".")[0]}.</li>
      <li>✓ Available sizes: ${WEIGHTS.map((w) => w.label).join(" · ")}</li>
    </ul>`;
  }

  function home() {
    setSeo({
      title: "Buy Kerala cardamom online | Premium Kerala spices | MAHFY",
      desc: "Buy Kerala cardamom online, including green cardamom from Kerala in 100 g packs. Premium Kerala spices online in India — buy black pepper from Kerala and Kerala coffee online. Order on WhatsApp.",
      path: "/",
      image: "assets/kerala-plantation.jpg"
    });
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
    const compareRows = [
      ["7 mm", "Everyday kitchen size", "Familiar green pods", "Daily cooking and tea", "100 g – 5 kg", "card-7mm"],
      ["7–8 mm", "Larger pods, stronger visual appeal", "Bolder-looking pods", "Regular cooking and presentation", "100 g – 5 kg", "card-7-8mm"],
      ["8 mm", "Extra-bold pods for premium use", "Largest listed pod size", "Gifting and special cooking", "100 g – 5 kg", "card-8mm"],
      ["Seed", "Kernel only — husk removed", "Seeds, not whole pods", "Chai, sweets, compact packing", "100 g – 5 kg", "card-seeds"]
    ]
      .map((r) => {
        const p = byId[r[5]];
        const price = p && p.pricePerKg != null ? "From " + fmt(packPrice(p.pricePerKg, 100)) + " / 100 g" : "On enquiry";
        return `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${price}</td><td><a href="/product/${r[5]}" data-link>View</a></td></tr>`;
      })
      .join("");
    const comboMsg = waLink(
      "Hi MAHFY, I would like the starter collection: Green Cardamom + Black Pepper + Coffee. Please suggest grades and pack sizes. Free delivery in India."
    );
    return `<section class="hero-cine">
      <img class="hero-bg" src="assets/kerala-plantation.jpg" alt="Green cardamom Kerala hills and Western Ghats plantations" fetchpriority="high" decoding="async" />
      <div class="hero-steam" aria-hidden="true"></div>
      <img class="hero-float a" src="assets/spices/cardamom-8mm.jpg" alt="Buy Kerala cardamom online — green cardamom pods" />
      <img class="hero-float b" src="assets/spices/pepper-malabar.jpg?v=2" alt="Buy black pepper from Kerala" />
      <div class="hero-inner">
        <p class="kicker" style="color:#e6d4a8">Kerala spices online India · Packed to order</p>
        <h1>Bring the Taste of the Hills Home.</h1>
        <p class="sub">Buy Kerala cardamom online, buy black pepper from Kerala, and order Kerala coffee online — premium Kerala spices packed from 100 g for kitchens across India.</p>
        <div class="hero-cta">
          <a class="btn btn-gold" href="/shop" data-link>Explore the Collection</a>
          <a class="btn btn-line" href="/finder" data-link style="border-color:#efe6d8;color:#f7f2ea">Find Your Perfect Spice</a>
        </div>
        <div class="hero-pills">
          <span>Premium</span><span>Natural</span><span>Kerala origin</span><span>Order on WhatsApp</span>
        </div>
      </div>
    </section>
    <div class="trust-bar">
      <span><b>✓</b> Carefully Selected</span>
      <span><b>✓</b> Premium Grades</span>
      <span><b>✓</b> Hygienically Packed</span>
      <span><b>✓</b> Freshly Delivered</span>
      <span><b>✓</b> WhatsApp confirmation</span>
    </div>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">The difference</p>
        <h2>You can smell the difference before you taste it.</h2>
        <p class="lead">Some spices simply add flavour.<br />The right spice changes the entire experience.</p>
      </div>
      <div class="sensory">
        <article>
          <p class="kicker">01</p>
          <h3>Aroma</h3>
          <p class="muted">That first burst of fragrance when you open the pack.</p>
        </article>
        <article>
          <p class="kicker">02</p>
          <h3>Flavour</h3>
          <p class="muted">Bold, natural character that stays with every bite.</p>
        </article>
        <article>
          <p class="kicker">03</p>
          <h3>Freshness</h3>
          <p class="muted">Carefully selected and packed to preserve what makes the spice special.</p>
        </article>
      </div>
    </section>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">Shop by experience</p>
        <h2>Choose What Your Kitchen Is Missing</h2>
      </div>
      <div class="xgrid">
        <article class="xcard">
          <img src="assets/spices/cardamom-8mm.jpg" alt="Green cardamom" loading="lazy" />
          <div class="xbody">
            <p class="kicker">For aroma</p>
            <h3>Green Cardamom</h3>
            <p class="muted">Green cardamom from Kerala — bright, fragrant pods, and seed if you want the kernel only. Buy cardamom 100 g online to try a grade.</p>
            <a class="btn btn-line" href="/shop/cardamom" data-link>Explore Cardamom</a>
          </div>
        </article>
        <article class="xcard">
          <img src="assets/spices/pepper-malabar.jpg?v=2" alt="Black pepper" loading="lazy" />
          <div class="xbody">
            <p class="kicker">For boldness</p>
            <h3>Black Pepper</h3>
            <p class="muted">Buy black pepper from Kerala — whole Malabar, extra-bold, white or ground.</p>
            <a class="btn btn-line" href="/shop/pepper" data-link>Explore Pepper</a>
          </div>
        </article>
        <article class="xcard">
          <img src="assets/spices/coffee-arabica.jpg?v=2" alt="Coffee beans" loading="lazy" />
          <div class="xbody">
            <p class="kicker">For your daily ritual</p>
            <h3>Premium Coffee</h3>
            <p class="muted">Kerala coffee online — Arabica, Robusta and filter blend for the morning cup.</p>
            <a class="btn btn-line" href="/shop/coffee" data-link>Explore Coffee</a>
          </div>
        </article>
        <article class="xcard">
          <img src="assets/packaging-care.jpg" alt="Gift-ready spice packs" loading="lazy" />
          <div class="xbody">
            <p class="kicker">For gifting</p>
            <h3>Premium Spice Selection</h3>
            <p class="muted">A pack that says you chose with care.</p>
            <a class="btn btn-line" href="/shop" data-link>Explore Gifts</a>
          </div>
        </article>
      </div>
    </section>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">Featured</p>
        <h2>Open the pack. Let the aroma speak.</h2>
        <p class="lead">Live MAHFY retail prices · Free delivery in India · 100 g to 5 kg</p>
      </div>
      <div class="grid-4" style="margin-top:2rem">${featured.map(productCard).join("")}</div>
      <p class="center" style="margin-top:1.6rem"><a class="btn btn-dark" href="/shop" data-link>Shop the full collection</a></p>
    </section>
    <section class="pace">
      <div class="wrap center">
        <p class="kicker" style="color:#e6d4a8">Tomorrow morning</p>
        <h2>Imagine opening the pack tomorrow...</h2>
        <p>Imagine opening your Mahfy cardamom tomorrow morning.
        That first fresh aroma reaches you before the first cup is poured.
        A little more fragrance.
        A little more character.
        A little more pleasure in an ordinary moment.</p>
        <p style="margin-top:1.6rem"><a class="btn btn-gold" href="/shop/cardamom" data-link>Make It Part of Your Kitchen</a></p>
      </div>
    </section>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">The journey</p>
        <h2>From the green hills to your kitchen.</h2>
        <p class="lead">How a MAHFY pack is put together. We describe the work we do — not farms we do not name.</p>
      </div>
      <div class="journey">
        <span><strong>Source</strong><br /><small>Kerala-origin lots</small></span><em>↓</em>
        <span><strong>Select</strong><br /><small>Chosen for the current packing</small></span><em>↓</em>
        <span><strong>Grade</strong><br /><small>Pods by millimetre; seed husked</small></span><em>↓</em>
        <span><strong>Pack</strong><br /><small>Food-safe bags, packed to order</small></span><em>↓</em>
        <span><strong>Deliver</strong><br /><small>Free delivery in India</small></span><em>↓</em>
        <span><strong>Enjoy</strong><br /><small>Open, smell, cook</small></span>
      </div>
    </section>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">Grades</p>
        <h2>Compare cardamom, simply.</h2>
        <p class="lead">Size is how lots are sorted. Larger pods look bolder; seed is the kernel without husk. Aroma still depends on the lot and how you store it.</p>
      </div>
      <div class="compare" style="margin-top:1.4rem">
        <table>
          <thead><tr><th>Size</th><th>Best thought of as</th><th>Appearance</th><th>Best use</th><th>Pack sizes</th><th>Price</th><th></th></tr></thead>
          <tbody>${compareRows}</tbody>
        </table>
      </div>
      <p class="note center">We do not rank these as “better” or “best in India” — choose the size and form that matches how you cook.</p>
    </section>
    <section class="wrap section reveal" id="finder">
      <div class="center">
        <p class="kicker">Product finder</p>
        <h2>Which one is right for you?</h2>
        <p class="lead">Two questions. Honest suggestions from what we actually sell.</p>
      </div>
      <div class="finder">
        <p><strong>What are you buying for?</strong></p>
        <div class="find-opts" id="findUse">
          <button type="button" data-v="daily" class="on">Daily cooking</button>
          <button type="button" data-v="tea">Tea / coffee</button>
          <button type="button" data-v="special">Special occasions</button>
          <button type="button" data-v="gift">Gifting</button>
          <button type="button" data-v="premium">Premium experience</button>
        </div>
        <p><strong>How much do you need?</strong></p>
        <div class="find-opts" id="findQty">
          <button type="button" data-v="100" class="on">Trial size (100 g)</button>
          <button type="button" data-v="250">100–250 g</button>
          <button type="button" data-v="500">500 g</button>
          <button type="button" data-v="1000">1 kg</button>
          <button type="button" data-v="5000">Up to 5 kg</button>
        </div>
        <button type="button" class="btn btn-dark" id="findGo">Show My Options</button>
        <div class="finder-out" id="findOut"></div>
      </div>
    </section>
    <section class="proof section">
      <div class="wrap center">
        <p class="kicker">Social proof</p>
        <h2>People who choose Mahfy come back for the experience.</h2>
        <p class="proof-note">We do not invent star ratings or reviews. Until we publish named, permissioned customer comments here, the honest place to see real kitchens is Instagram.</p>
        <p style="margin-top:1.2rem"><a class="btn btn-dark" href="${CFG.instagramUrl}" target="_blank" rel="noopener noreferrer">See real posts @mahfy_official</a></p>
      </div>
    </section>
    <section class="wrap section split reveal">
      <div>
        <p class="kicker">Start your Mahfy journey</p>
        <h2>Not sure where to start?</h2>
        <p class="muted">Start with the flavours that define the collection — cardamom, black pepper and coffee. Tell us on WhatsApp if the pack is for the kitchen at home, or for packing when you go abroad for work or study.</p>
        <p class="ship-callout">Packed to order · Free delivery in India</p>
        <p class="hero-cta">
          <a class="btn btn-dark" href="/combos" data-link>Explore the Starter Collection</a>
          <a class="btn btn-wa" href="${comboMsg}" target="_blank" rel="noopener noreferrer">Ask for this trio</a>
        </p>
      </div>
      <img class="benefits-img" src="assets/spices/cardamom-seed-kernels.jpg" alt="Cardamom seed" />
    </section>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">Know your spice</p>
        <h2>Authority without the lecture.</h2>
      </div>
      <div class="grid-3" style="margin-top:2rem">${ARTICLES.slice(0, 6).map(articleCard).join("")}</div>
      <p class="center" style="margin-top:1.4rem"><a class="btn btn-line" href="/kitchen" data-link>All kitchen notes</a></p>
    </section>
    <section class="wrap section center reveal">
      <p class="kicker">Instagram</p>
      <h2>See What We're Cooking</h2>
      <p class="lead">Spices, packing, coffee and Kerala light — @mahfy_official</p>
      <div class="ig-grid" style="margin:1.6rem 0">${ig.map((src) => `<img src="${src}" alt="" loading="lazy" />`).join("")}</div>
      <a class="btn btn-dark" href="${CFG.instagramUrl}" target="_blank" rel="noopener noreferrer">Follow @mahfy_official</a>
    </section>
    <section class="wrap section reveal">
      <div class="center">
        <p class="kicker">Kerala spices online India</p>
        <h2>Premium Kerala spices, packed to order.</h2>
        <p class="lead">MAHFY is a catalogue for people who want to buy Kerala cardamom online, choose green cardamom from Kerala by millimetre grade, buy black pepper from Kerala, and order Kerala coffee online. Start with 100 g if you are trying a lot; packs go up to 5 kg. Delivery in India is free — no extra shipping charges. There is no cart — confirm on WhatsApp.</p>
      </div>
    </section>
    <section class="final-cta wrap">
      <p class="kicker">MAHFY</p>
      <h2>Your kitchen deserves better ingredients.</h2>
      <p class="lead">Explore Mahfy's collection and find the flavour that belongs in your kitchen.</p>
      <p style="margin-top:1.4rem"><a class="btn btn-dark" href="/shop" data-link>Shop Mahfy</a></p>
      <p class="note">Prices updated: ${dateLabel}. ${CFG.priceNote}</p>
    </section>`;
  }

  function bindFinder() {
    const useBox = $("#findUse");
    const qtyBox = $("#findQty");
    if (!useBox || !qtyBox) return;
    let use = "daily";
    let qty = "100";
    function pick(box, v) {
      box.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    }
    useBox.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      use = b.dataset.v;
      pick(useBox, use);
    });
    qtyBox.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      qty = b.dataset.v;
      pick(qtyBox, qty);
    });
    const ids = {
      daily: ["card-7mm", "pepper-malabar", "card-6-7mm"],
      tea: ["card-seeds", "coffee-filter", "coffee-arabica"],
      special: ["card-8mm", "pepper-telli", "card-7-8mm"],
      gift: ["card-8mm", "pepper-telli", "coffee-arabica"],
      premium: ["card-8mm", "pepper-telli", "coffee-arabica"]
    };
    $("#findGo").onclick = () => {
      const list = (ids[use] || []).map((id) => byId[id]).filter(Boolean);
      const g = Number(qty);
      const size = gramsLabel(g);
      $("#findOut").innerHTML =
        `<p class="muted">Suggested starting pack: <strong>${size}</strong> (you can change this on the product page). These are real catalogue items — not invented SKUs.</p>
        <div class="grid-3" style="margin-top:1rem">${list.map(productCard).join("")}</div>`;
    };
  }

  function articleCard(a) {
    return `<article class="card">
      <a href="/kitchen/${a.slug}" data-link>
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
    const active = cat || "all";
    const list = products.filter((p) => active === "all" || p.category === active);
    const heads = {
      all: {
        t: "Premium Kerala spices online",
        d: "Cardamom, pepper, coffee and more — graded, priced, packed to order.",
        seoTitle: "Premium Kerala spices online India | Shop MAHFY",
        seoDesc: "Shop premium Kerala spices online in India. Buy Kerala cardamom online, buy black pepper from Kerala, and order Kerala coffee online. Packs from 100 g to 5 kg.",
        path: "/shop"
      },
      cardamom: {
        t: "Buy Kerala cardamom online",
        d: "Premium cardamom online India — green cardamom from Kerala, pods by millimetre, or seed without the husk. Buy cardamom 100 g online to try a grade.",
        seoTitle: "Buy Kerala cardamom online | Green cardamom Kerala | MAHFY",
        seoDesc: "Buy Kerala cardamom online. Green cardamom from Kerala in 100 g to 5 kg packs, graded by millimetre, plus cardamom seed. Premium cardamom online India. Order on WhatsApp.",
        path: "/shop/cardamom"
      },
      pepper: {
        t: "Buy black pepper from Kerala",
        d: "Bold pepper from Kerala. Whole, extra-bold, white and ground.",
        seoTitle: "Buy black pepper from Kerala | MAHFY",
        seoDesc: "Buy black pepper from Kerala — Malabar, Tellicherry-style extra bold, white and ground. Premium Kerala spices online. Packs from 100 g.",
        path: "/shop/pepper"
      },
      coffee: {
        t: "Kerala coffee online",
        d: "Kerala coffee online — Arabica, Robusta and filter blend.",
        seoTitle: "Kerala coffee online | MAHFY",
        seoDesc: "Order Kerala coffee online: Arabica, Robusta and filter blend. Premium Kerala spices and coffee, packed to order from 100 g.",
        path: "/shop/coffee"
      },
      other: {
        t: "Other spices",
        d: "Nutmeg and mace for the kitchen that already knows cardamom.",
        seoTitle: "Other Kerala spices | MAHFY",
        seoDesc: "Nutmeg and mace from the MAHFY Kerala spices collection. Packed to order, 100 g to 5 kg.",
        path: "/shop/other"
      }
    };
    const h = heads[active] || heads.all;
    setSeo({
      title: h.seoTitle,
      desc: h.seoDesc,
      path: h.path,
      image: active === "pepper" ? "assets/spices/pepper-malabar.jpg" : active === "coffee" ? "assets/spices/coffee-arabica.jpg" : "assets/spices/cardamom-8mm.jpg"
    });
    return `<section class="wrap page-head">
      <p class="kicker">Shop</p>
      <h1>${h.t}</h1>
      <p class="muted">${h.d} Packs from 100 g to 5 kg. Free delivery in India. Kerala spices online India — order on WhatsApp.</p>
      <div class="filters">
        <button class="chip ${active === "all" ? "active" : ""}" data-cat="all">All</button>
        ${CATS.map((c) => `<button class="chip ${active === c.id ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`).join("")}
      </div>
      <div class="grid-3">${list.map(productCard).join("") || `<p class="empty">Nothing in this category yet. <a href="${waLink(CFG.waMessage)}" target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>.</p>`}</div>
    </section>`;
  }

  function combos() {
    setSeo({
      title: "Starter collection | Premium Kerala spices online | MAHFY",
      desc: "Start with green cardamom Kerala, black pepper from Kerala and Kerala coffee online. Confirm grades and 100 g–5 kg packs on WhatsApp.",
      path: "/combos"
    });
    const ids = ["card-8mm", "pepper-malabar", "coffee-arabica"];
    const list = ids.map((id) => byId[id]).filter(Boolean);
    const msg = waLink(
      "Hi MAHFY, I would like the starter collection: Cardamom + Black Pepper + Coffee. Please suggest grades and sizes. Free delivery in India."
    );
    return `<section class="wrap page-head">
      <p class="kicker">Combos</p>
      <h1>Not sure where to start?</h1>
      <p class="muted">Start with the flavours that define the collection. This is not a discounted bundle with a made-up saving — it is a simple first order: one cardamom, one pepper, one coffee. Confirm grades and weights on WhatsApp.</p>
      <div class="grid-3" style="margin-top:1.6rem">${list.map(productCard).join("")}</div>
      <p class="hero-cta" style="margin-top:1.6rem">
        <a class="btn btn-wa" href="${msg}" target="_blank" rel="noopener noreferrer">Explore the Starter Collection</a>
        <a class="btn btn-line" href="/shop" data-link>Browse everything</a>
      </p>
    </section>`;
  }

  function productPage(id) {
    const p = byId[id];
    if (!p) return notFound();
    const path = "/product/" + p.id;
    const img0 = p.images && p.images[0];
    let seoTitle = p.name + " | MAHFY";
    let seoDesc = p.description;
    if (p.category === "cardamom") {
      seoTitle = p.name + " | Buy Kerala cardamom online | MAHFY";
      seoDesc = p.description + " Buy cardamom 100 g online, or larger packs to 5 kg. Green cardamom Kerala. Order on WhatsApp.";
    } else if (p.category === "pepper") {
      seoTitle = p.name + " | Buy black pepper from Kerala | MAHFY";
      seoDesc = p.description + " Premium Kerala spices online. Packs from 100 g.";
    } else if (p.category === "coffee") {
      seoTitle = p.name + " | Kerala coffee online | MAHFY";
      seoDesc = p.description + " Order Kerala coffee online in 100 g to 5 kg packs.";
    }
    const offer = p.pricePerKg
      ? {
          "@type": "Offer",
          url: pageUrl(path),
          priceCurrency: "INR",
          price: packPrice(p.pricePerKg, 100),
          priceValidUntil: "2026-12-31",
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": SITE + "/#store" }
        }
      : undefined;
    const json = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
            { "@type": "ListItem", position: 2, name: "Shop", item: SITE + "/shop" },
            { "@type": "ListItem", position: 3, name: p.name, item: pageUrl(path) }
          ]
        },
        {
          "@type": "Product",
          name: p.name,
          description: p.description,
          sku: p.id,
          image: (p.images || []).map(absAsset),
          brand: { "@type": "Brand", name: "MAHFY" },
          url: pageUrl(path),
          category: p.category,
          additionalProperty: p.grade
            ? [{ "@type": "PropertyValue", name: "Grade", value: p.grade }]
            : undefined,
          offers: offer
        }
      ]
    };
    setSeo({
      title: seoTitle,
      desc: seoDesc,
      path: path,
      image: img0,
      type: "product",
      json: json
    });
    const catLabel = (CATS.find((c) => c.id === p.category) || {}).label || p.category;
    return `<section class="wrap section pdp" data-product="${p.id}">
      <div class="gallery">
        <img id="mainPhoto" src="${p.images[0]}" alt="${p.name}" />
        <div class="thumbs">${p.images.map((src, i) => `<button type="button" data-src="${src}" class="${i === 0 ? "active" : ""}"><img src="${src}" alt="" loading="lazy" /></button>`).join("")}</div>
      </div>
      <div>
        <p class="kicker">${catLabel}</p>
        <h1>${p.name}</h1>
        <p class="meta">Grade: ${p.grade}${p.type ? " · " + p.type : ""} · Origin: ${p.origin}${p.inStock ? " · Packed to order" : " · Currently unavailable"}</p>
        <p class="sub" style="font-size:1.2rem;margin:.6rem 0 0;color:var(--earth)">${sensoryLine(p)}</p>
        <p>${p.description}</p>
        <p class="price" id="pdpPrice">${p.pricePerKg != null ? fmt(packPrice(p.pricePerKg, 100)) : "—"}</p>
        <p class="note" id="pdpUnit">${p.pricePerKg != null ? fmt(p.pricePerKg) + " / kg · MAHFY retail" : ""}</p>
        <p class="ship-callout">Free delivery in India — no extra shipping charges.</p>
        <h2 style="font-size:1.7rem;margin:1.4rem 0 .4rem">Why you'll love it</h2>
        ${loveList(p)}
        <div class="sell-path">
          <p class="kicker">Two kitchens</p>
          <div class="audience audience-compact">
            <article>
              <p class="kicker">Home use</p>
              <h3>For the kitchen at home</h3>
              <p class="muted">${p.id === "card-seeds" ? "Seed is ready for chai, sweets and masala — no husk to pick. Start with 100 g if you are trying the lot." : "Start with 100 g to try a grade. 250 g and 500 g suit weekly cooking. Whole pods keep aroma on the shelf."}</p>
              <p style="margin-top:.8rem"><a class="btn btn-line" href="${waLink(
                "Hi MAHFY, this is for home use. I would like " + p.name + (p.grade ? " (" + p.grade + ")" : "") + ". Please suggest a pack size."
              )}" target="_blank" rel="noopener noreferrer">WhatsApp — home pack</a></p>
            </article>
            <article>
              <p class="kicker">Going abroad</p>
              <h3>For work or study overseas</h3>
              <p class="muted">${p.id === "card-seeds" ? "Seed travels lighter than whole pods. Ask for a tight, sealed bag. Airline and destination rules are yours to check." : "Ask for a sealed pack to take with you. Cardamom seed is more compact if suitcase weight matters."}</p>
              <p style="margin-top:.8rem"><a class="btn btn-wa" href="${waLink(
                "Hi MAHFY, I am going abroad for work / study. I would like " + p.name + (p.grade ? " (" + p.grade + ")" : "") + ". Please suggest a sealed pack to take with me."
              )}" target="_blank" rel="noopener noreferrer">WhatsApp — going abroad</a></p>
            </article>
          </div>
        </div>
        <h2 style="font-size:1.7rem;margin:1.4rem 0 .3rem">Choose your quantity</h2>
        <p class="muted" style="margin-bottom:.6rem">A suggestion, not a rule. Smallest listed pack is 100 g.</p>
        <div id="weightPick">${weightGroupsHtml(100)}</div>
        <p class="kicker">How many packs</p>
        <div class="qty-row">
          <button type="button" id="qtyMinus">−</button>
          <strong id="qtyVal">1</strong>
          <button type="button" id="qtyPlus">+</button>
        </div>
        <p class="note">Maximum 5 kg per order. There is no cart on this site — WhatsApp is checkout.</p>
        <p class="kicker">You're one step away from bringing better flavour home.</p>
        <div class="hero-cta">
          <a class="btn btn-wa" id="waOrder" target="_blank" rel="noopener noreferrer" href="#">Add to order on WhatsApp</a>
          <a class="btn btn-dark" id="waBuyNow" target="_blank" rel="noopener noreferrer" href="#">Buy now</a>
        </div>
        <p class="micro">✓ Order confirmation on WhatsApp · ✓ Packed in India · ✓ Delivery updates when the courier is booked</p>
        <h2 style="font-size:1.55rem;margin:1.6rem 0 .5rem">What happens after you order?</h2>
        <div class="after">
          <div><strong>1. Confirmed</strong><p class="muted">We reply on WhatsApp with grade, weight and product total.</p></div>
          <div><strong>2. Packed</strong><p class="muted">Your spices are packed to order in a food-safe bag.</p></div>
          <div><strong>3. Dispatched</strong><p class="muted">Handed to a courier covering your PIN code in India.</p></div>
          <div><strong>4. Delivered</strong><p class="muted">To your door in India. Delivery is free — no extra shipping charge.</p></div>
        </div>
        <dl class="facts">
          <div><dt>Grade</dt><dd>${p.grade}</dd></div>
          <div><dt>Origin</dt><dd>${p.origin}</dd></div>
          <div><dt>Weight</dt><dd id="factWeight">100 g</dd></div>
          <div><dt>Packaging</dt><dd>${p.packaging}</dd></div>
          <div><dt>Storage</dt><dd>${p.storage}</dd></div>
          <div><dt>Best before</dt><dd>${p.bestBefore}</dd></div>
          <div><dt>Availability</dt><dd>${p.inStock ? "In stock · packed to order" : "Sold out"}</dd></div>
        </dl>
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
    const waBuyNow = $("#waBuyNow");
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
        bits.push("Approx. product total: " + fmt(packPrice(p.pricePerKg, grams) * qty) + " (free delivery in India)");
      }
      bits.push("", "Purpose: home use / going abroad for work or study (please confirm).", "Free delivery in India. Please confirm availability.");
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
        waOrder.textContent = over ? "Bulk enquiry on WhatsApp" : "Add to order on WhatsApp";
      }
      if (waBuyNow) {
        waBuyNow.href = waLink(orderText());
        waBuyNow.textContent = over ? "Bulk enquiry" : "Buy now";
      }
    }
    const weightRoot = $("#weightPick");
    if (weightRoot) {
      weightRoot.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-g]");
        if (!b) return;
        grams = Number(b.dataset.g);
        weightRoot.querySelectorAll("button[data-g]").forEach((x) => x.classList.toggle("active", x === b));
        refresh();
      });
    }
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
    setSeo({
      title: "Prices | Premium Kerala spices online | MAHFY",
      desc: "MAHFY retail prices for Kerala cardamom, black pepper and coffee. Buy cardamom 100 g online or larger packs. Free delivery in India.",
      path: "/prices"
    });
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
      <p class="muted">Our prices vary by product, grade and quantity. These are MAHFY retail rates — set above typical market/wholesale. Delivery in India is free; there is no extra shipping charge.</p>
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
    setSeo({
      title: "How to order | MAHFY",
      desc: "How to buy Kerala cardamom online and other premium Kerala spices: browse the catalogue, then confirm the pack on WhatsApp. Free delivery in India.",
      path: "/how-to-order"
    });
    return `<section class="wrap page-head">
      <p class="kicker">How to order</p>
      <h1>Order only on WhatsApp.</h1>
      <p class="muted">This site is a catalogue. There is no cart or checkout. Our selling method is simple: you tell us which kitchen the spices are for, we suggest the pack, you confirm on WhatsApp.</p>
      <div class="steps" style="margin-top:2rem">
        <article class="step"><span class="step-n">01</span><h3>Say home or going abroad</h3><p class="muted">Home kitchen in India, or packing spices to take with you for a job or studies. That decides pods vs seed, and how tightly we pack.</p></article>
        <article class="step"><span class="step-n">02</span><h3>Choose product and weight</h3><p class="muted">Cardamom pods, cardamom seed, pepper, coffee. 100 g to 5 kg.</p></article>
        <article class="step"><span class="step-n">03</span><h3>Message MAHFY on WhatsApp</h3><p class="muted">Share product, grade, quantity, PIN code, and whether you are flying.</p></article>
        <article class="step"><span class="step-n">04</span><h3>We confirm, pack and ship</h3><p class="muted">We pack in India. Delivery in India is free. If you carry the pack abroad, airline and customs rules are yours to check.</p></article>
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
    setSeo({
      title: "Know your spice | Green cardamom Kerala & pepper notes | MAHFY",
      desc: "Short notes on how to choose green cardamom from Kerala, store spices, and how much to buy — including 100 g starter packs.",
      path: "/kitchen"
    });
    return `<section class="wrap page-head">
      <p class="kicker">Know your spice</p>
      <h1>Choose with a clear head.</h1>
      <p class="muted">Short notes on grades, storage and how much to buy — so you can order without guessing.</p>
      <div class="grid-3" style="margin-top:2rem">${ARTICLES.map(articleCard).join("")}</div>
    </section>`;
  }

  function kitchenArticle(slug) {
    if (slug === "spices-for-home-and-pravasi") {
      go("/kitchen/spices-for-home-and-abroad", true);
      return "";
    }
    const a = ARTICLES.find((x) => x.slug === slug);
    if (!a) return notFound();
    setSeo({
      title: a.title + " | MAHFY",
      desc: a.excerpt || a.title,
      path: "/kitchen/" + a.slug,
      image: a.image,
      type: "article"
    });
    return `<article class="wrap section article">
      <p class="kicker">Know your spice</p>
      <h1>${a.title}</h1>
      <p class="meta">${a.date} · ${a.minutes} min read</p>
      <img class="cover" src="${a.image}" alt="" />
      <div class="body">${a.body.map((p) => `<p>${p}</p>`).join("")}</div>
      <p style="margin-top:1.5rem"><a class="btn btn-line" href="/kitchen" data-link>All articles</a></p>
    </article>`;
  }

  function faqPage() {
    setSeo({
      title: "FAQ | Buy Kerala spices online India | MAHFY",
      desc: "Questions about buying Kerala cardamom online, pack sizes from 100 g, black pepper from Kerala, coffee, shipping and WhatsApp orders.",
      path: "/faq"
    });
    const items = [
      ["What products does MAHFY sell?", "Kerala-origin cardamom (whole pods by millimetre grade, plus cardamom seed), black pepper, coffee and selected spices, in listed pack sizes."],
      ["What cardamom grades are available?", "Whole pods by size: 8 mm, 7–8 mm, 7 mm, 6–7 mm, 6 mm, 5 mm, 4 mm and 3 mm. We also sell cardamom seed (the inner kernel, husked). Check the shop for live availability and prices."],
      ["Who is MAHFY for?", "Home kitchens in India, and people going abroad for work or study who want to pack spices to take with them. Tell us which when you message — pack size and product (pods vs seed) often change with that."],
      ["Can you pack spices for me to carry abroad?", "Yes — we seal packs for suitcase packing. You must check airline, security and destination rules yourself. We do not ship the order as international cargo unless we agree that separately on WhatsApp."],
      ["What quantities can I order?", "Each product is offered in 100 g, 250 g, 500 g, 1 kg, 2 kg and 5 kg packs."],
      ["What is the maximum order quantity?", "5 kg per order. For more than 5 kg, please contact us for bulk enquiries."],
      ["Do you ship across India?", "We aim to ship across India. Availability and timing depend on courier service to your PIN code. We confirm this when we accept the order."],
      ["Is delivery free?", "Yes. Delivery in India is free — there are no extra shipping charges on the listed prices. Timing still depends on courier service to your PIN code."],
      ["How should I store cardamom?", "Whole pods, airtight, away from heat, steam and sunlight. Crush just before use."],
      ["How should I store pepper?", "Keep whole pepper airtight. Crack or grind when you cook. Ground pepper should stay tightly closed."],
      ["How should I store coffee?", "Airtight, away from heat and moisture. Whole beans keep longer than ground coffee. Avoid the fridge if you can."],
      ["How can I contact MAHFY?", "Orders go through WhatsApp. You can also email mahfyofficial@gmail.com, follow Instagram @mahfy_official, or watch YouTube @mahfyofficial."],
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
    setSeo({
      title: "Our story | Premium Kerala spices | MAHFY",
      desc: "MAHFY packs premium Kerala spices online — green cardamom from Kerala, black pepper and coffee — for home kitchens in India.",
      path: "/about"
    });
    return `<section class="wrap page-head">
      <p class="kicker">Our story</p>
      <h1>Mahfy is more than a spice store.</h1>
      <p class="lead" style="margin-left:0">Origin. Care. Selection. The joy of cooking. We tell only what we can stand behind.</p>
    </section>
    <section class="wrap split" style="padding-bottom:3rem">
      <div>
        <h2>Origin</h2>
        <p class="muted">MAHFY sells Kerala-origin cardamom, pepper, coffee and selected spices. The hills and the spice trade of Kerala are the context — not a farm we will invent a name for.</p>
        <h2 style="margin-top:1.4rem">Care and selection</h2>
        <p class="muted">Lots are graded (cardamom by millimetre; seed as husked kernel) and packed to order in food-safe bags. We describe the current product, not a certificate we do not hold.</p>
        <h2 style="margin-top:1.4rem">Craft and the kitchen</h2>
        <p class="muted">The work is practical: choose a grade, pack it cleanly, send it so someone can cook. Home kitchens in India, and people going abroad for work or study, order the same catalogue.</p>
        <p class="muted" style="margin-top:1rem"><em>[Place for a short, true founder or family note — insert only when ready. Do not invent a plantation partnership.]</em></p>
        <p class="hero-cta">
          <a class="btn btn-dark" href="/shop" data-link>Shop the collection</a>
          <a class="btn btn-line" href="/contact" data-link>Contact</a>
        </p>
      </div>
      <img src="assets/kerala-plantation.jpg" alt="Kerala hills" style="border-radius:18px;width:100%;object-fit:cover;aspect-ratio:4/5" />
    </section>`;
  }

  function contact() {
    setSeo({
      title: "Contact | MAHFY Kerala spices",
      desc: "Contact MAHFY to buy Kerala cardamom online, black pepper from Kerala and Kerala coffee. WhatsApp, call or email.",
      path: "/contact"
    });
    return `<section class="wrap page-head">
      <p class="kicker">Contact</p>
      <h1>Write to MAHFY</h1>
      <p class="muted">${CFG.location} · ${CFG.hours}</p>
      <p><a href="mailto:${CFG.email}">${CFG.email}</a></p>
      <p class="hero-cta">
        ${CFG.instagramUrl ? `<a class="btn btn-line" href="${CFG.instagramUrl}" target="_blank" rel="noopener noreferrer">Instagram @${CFG.instagram || "mahfy_official"}</a>` : ""}
        ${CFG.youtubeUrl ? `<a class="btn btn-line" href="${CFG.youtubeUrl}" target="_blank" rel="noopener noreferrer">YouTube @${CFG.youtube || "mahfy_official"}</a>` : ""}
      </p>
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
          "If Google Analytics is enabled on this site, it collects anonymised usage data (pages viewed, device type). You can block it with browser settings or extensions.",
          "We do not sell your contact details. Instagram and WhatsApp are third-party services with their own policies.",
          "Contact mahfyofficial@gmail.com for privacy questions."
        ]
      },
      terms: {
        t: "Terms & Conditions",
        b: [
          "This website is a catalogue. Orders are placed on WhatsApp, not through a cart or checkout on the site.",
          "Listed prices include free delivery in India. A standard order may not exceed 5 kg.",
          "Grades and availability can change with supply. We confirm the current lot when we accept the order on WhatsApp.",
          "Kerala, India."
        ]
      },
      shipping: {
        t: "Shipping Policy",
        b: [
          "Delivery in India is free. There are no extra shipping charges on listed prices.",
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
    setSeo({
      title: p.t + " | MAHFY",
      desc: p.b[0] || p.t,
      path: "/" + kind
    });
    return `<section class="wrap page-head article"><h1>${p.t}</h1>${p.b.map((x) => `<p class="muted">${x}</p>`).join("")}</section>`;
  }

  function notFound() {
    setSeo({
      title: "Page not found | MAHFY",
      desc: "This page is not in the MAHFY catalogue. Shop Kerala spices online India from the collection.",
      path: IS_FILE ? filePath : location.pathname
    });
    return `<section class="wrap page-head"><h1>Page not found</h1><p><a href="/shop" data-link>Back to shop</a></p></section>`;
  }

  function render() {
    const parts = routeParts();
    const root = parts[0] || "";
    if (root === "cart" || root === "checkout" || root === "order-confirmation") {
      go("/how-to-order", true);
      return;
    }
    let html = "";
    let after = null;
    if (!root || root === "finder") {
      html = home();
      after = () => {
        bindFinder();
        if (root === "finder") {
          const el = $("#finder");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
    } else if (root === "shop") {
      html = shop(parts[1]);
      after = () => {
        document.querySelectorAll(".chip").forEach((c) => {
          c.onclick = () => {
            const cat = c.dataset.cat;
            go(cat === "all" ? "/shop" : "/shop/" + cat);
          };
        });
      };
    } else if (root === "combos") html = combos();
    else if (root === "product") {
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
    const searchPanel = $("#searchPanel");
    if (searchPanel) searchPanel.hidden = true;
    const searchInput = $("#searchInput");
    if (searchInput) searchInput.value = "";
    const searchResults = $("#searchResults");
    if (searchResults) searchResults.innerHTML = "";
    document.querySelectorAll(".nav a[data-link]").forEach((a) => {
      const href = (a.getAttribute("href") || "").replace(/^#/, "") || "/";
      const sub = parts[1] || "";
      const homeOn = (!root || root === "finder") && (href === "/" || href === "");
      const shopAll = href === "/shop" && root === "shop" && !sub;
      const shopCat = href === "/shop/" + sub && root === "shop" && !!sub;
      const other = href === "/" + root && root && root !== "shop" && root !== "finder";
      a.classList.toggle("active", homeOn || shopAll || shopCat || other);
    });
    if (root !== "finder") window.scrollTo(0, 0);
    if (after) after();
    closeMenu();
    trackPage();
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
  menuBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (nav.classList.contains("open")) closeMenu();
    else openMenu();
  };
  if (nav) {
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a[data-link]")) closeMenu();
    });
  }
  if (navScrim) navScrim.onclick = closeMenu;

  function bindSearch() {
    const panel = $("#searchPanel");
    const input = $("#searchInput");
    const out = $("#searchResults");
    const openBtn = $("#searchBtn");
    const closeBtn = $("#searchClose");
    if (!panel || !input || !openBtn) return;
    function closeSearch() {
      panel.hidden = true;
      input.value = "";
      if (out) out.innerHTML = "";
    }
    function openSearch() {
      panel.hidden = false;
      input.focus();
    }
    openBtn.onclick = openSearch;
    if (closeBtn) closeBtn.onclick = closeSearch;
    panel.addEventListener("click", (e) => {
      if (e.target === panel) closeSearch();
    });
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!out) return;
      if (q.length < 2) {
        out.innerHTML = "";
        return;
      }
      const hits = products.filter((p) =>
        [p.name, p.grade, p.origin, p.category, p.description].join(" ").toLowerCase().includes(q)
      );
      out.innerHTML = hits.length
        ? hits
            .slice(0, 8)
            .map(
              (p) =>
                `<a href="/product/${p.id}" data-link>${p.name} <span class="muted">· ${p.grade}</span></a>`
            )
            .join("")
        : `<p class="muted">No matches. Try cardamom, pepper or coffee.</p>`;
    });
    if (out) {
      out.addEventListener("click", (e) => {
        if (e.target.closest("a")) closeSearch();
      });
    }
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) closeSearch();
    });
  }

  addEventListener("popstate", render);
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-link]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || /^(https?:|mailto:|tel:)/i.test(href)) return;
    if (href === "#app" || href === "#") return;
    e.preventDefault();
    go(href);
  });
  ticker();
  setWa();
  setOrgJson();
  bindSearch();
  migrateHash();
  render();
})();
