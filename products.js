/* ============================================================
   MAHFY — PRODUCT CATALOG (static)
   Prices come from prices.js and are merged in by id.
   Edit descriptions / sizes here; edit PRICES with the Editor.
   ============================================================ */

window.MAHFY_CONFIG = {
  brand: "MAHFY",
  tagline: "Unwrap it, smell it, and get ready for a wild ride.",
  // Where "Send enquiry" messages go. Change these to your real details.
  whatsapp: "919XXXXXXXXX",          // country code + number, no + or spaces
  phone: "919XXXXXXXXX",             // same format; used for tap-to-call
  email: "mahfyofficial@gmail.com",
  location: "Kerala, India",
  maxKg: 5,
  cardamomPacks: ["100 g", "250 g", "500 g", "1 kg", "2 kg", "5 kg"]
};

window.MAHFY_CATEGORIES = [
  { id: "cardamom", label: "Cardamom", icon: "◈" },
  { id: "pepper",   label: "Pepper",   icon: "◉" },
  { id: "coffee",   label: "Coffee",   icon: "◐" }
];

/* Cardamom grades taken directly from the Cardamom Grading & Trade Guide. */
window.MAHFY_PRODUCTS = [
  {
    id: "card-premium", category: "cardamom", tier: "Premium", size: "8 mm+",
    image: "assets/spices/cardamom-premium.jpg?v=2",
    grade: "AGEB — Alleppey Green Extra Bold",
    blurb: "Large, well-developed bold-green pods for discerning customers, luxury sweets, gifting and export. Packed from 100 g to 5 kg.",
    tags: ["Jumbo", "100 g – 5 kg", "Gifting"]
  },
  {
    id: "card-select", category: "cardamom", tier: "Select", size: "7–8 mm",
    image: "assets/spices/cardamom-select.jpg?v=2",
    grade: "AGB — Alleppey Green Bold",
    blurb: "Bold, high-quality cardamom with a desirable aroma — ideal for everyday premium retail and food service. Packed from 100 g to 5 kg.",
    tags: ["Bold pods", "100 g – 5 kg", "Retail"]
  },
  {
    id: "card-classic", category: "cardamom", tier: "Classic", size: "6–7 mm",
    image: "assets/spices/cardamom-classic.jpg?v=2",
    grade: "AGS — Alleppey Green Superior",
    blurb: "A balanced value proposition with good flavour and aroma. The mainstream home-cooking and tea grade. Packed from 100 g to 5 kg.",
    tags: ["Everyday", "100 g – 5 kg", "Tea"]
  },
  {
    id: "card-value", category: "cardamom", tier: "Value", size: "5–6 mm",
    image: "assets/spices/cardamom-value.jpg?v=2",
    grade: "AGS-1 — Shipment Green-1",
    blurb: "Accessible smaller-pod option for home cooking, spice blending and grinding. Packed from 100 g to 5 kg.",
    tags: ["Economy", "100 g – 5 kg", "Cooking"]
  },
  {
    id: "card-process", category: "cardamom", tier: "Processing", size: "Below 5 mm",
    image: "assets/spices/cardamom-process.jpg?v=2",
    grade: "AGS-2 — Shipment Green-2",
    blurb: "Smaller pods for powder, extracts and spice blends where size is not critical. Packed from 100 g to 5 kg.",
    tags: ["Powder", "100 g – 5 kg", "Extracts"]
  },

  {
    id: "pepper-malabar", category: "pepper", tier: "Malabar", size: "Whole",
    image: "assets/spices/pepper-malabar.jpg?v=2",
    grade: "Malabar Garbled",
    blurb: "Sun-dried Malabar black peppercorns — sharp, piney heat and clean pungency for daily cooking. Packed from 100 g to 5 kg.",
    tags: ["Whole", "Bold heat", "100 g – 5 kg"]
  },
  {
    id: "pepper-telli", category: "pepper", tier: "Tellicherry", size: "Extra Bold",
    image: "assets/spices/pepper-telli.jpg?v=2",
    grade: "TGSEB",
    blurb: "Vine-matured Tellicherry berries — the largest, most aromatic black pepper with fruity depth. Packed from 100 g to 5 kg.",
    tags: ["Extra bold", "Aromatic", "100 g – 5 kg"]
  },
  {
    id: "pepper-white", category: "pepper", tier: "White", size: "Whole",
    image: "assets/spices/pepper-white.jpg?v=2",
    grade: "Dehusked",
    blurb: "Fermented and dehusked peppercorns — earthy, mellow heat for light sauces and pale dishes. Packed from 100 g to 5 kg.",
    tags: ["Mellow", "Gourmet", "100 g – 5 kg"]
  },
  {
    id: "pepper-ground", category: "pepper", tier: "Ground", size: "Fine",
    image: "assets/spices/pepper-ground.jpg?v=2",
    grade: "Table Ground",
    blurb: "Freshly milled black pepper for instant table and kitchen use. Packed from 100 g to 5 kg.",
    tags: ["Ready to use", "Fine", "100 g – 5 kg"]
  },

  {
    id: "coffee-arabica", category: "coffee", tier: "Arabica", size: "Whole Bean",
    image: "assets/spices/coffee-arabica.jpg?v=2",
    grade: "Plantation A",
    blurb: "Shade-grown Arabica — smooth, low-acidity beans with floral and chocolate notes. Packed from 100 g to 5 kg.",
    tags: ["Whole bean", "Smooth", "100 g – 5 kg"]
  },
  {
    id: "coffee-robusta", category: "coffee", tier: "Robusta", size: "Whole Bean",
    image: "assets/spices/coffee-robusta.jpg?v=2",
    grade: "Cherry AB",
    blurb: "Full-bodied Robusta with a bold, punchy crema — the backbone of a strong South-Indian brew. Packed from 100 g to 5 kg.",
    tags: ["Whole bean", "Strong", "100 g – 5 kg"]
  },
  {
    id: "coffee-filter", category: "coffee", tier: "Filter Blend", size: "Ground",
    image: "assets/spices/coffee-filter.jpg?v=2",
    grade: "80:20 Coffee-Chicory",
    blurb: "Classic roasted-and-ground filter blend for the perfect frothy South-Indian filter coffee. Packed from 100 g to 5 kg.",
    tags: ["Ground", "Filter", "100 g – 5 kg"]
  }
];

/* Reference table from the guide — shown in the Grading section. */
window.MAHFY_TRADEGRADES = [
  { grade: "AGEB (Alleppey Green Extra Bold)", size: "7 mm+", note: "Premium 8mm+ supply. Extra-bold; premium colour.", band: "3,500 – 4,300" },
  { grade: "AGB (Alleppey Green Bold)",         size: "6 mm+", note: "7–8mm lots common. Bold pods, desirable aroma.", band: "3,200 – 3,900" },
  { grade: "AGS (Alleppey Green Superior)",     size: "5 mm+", note: "Regular commercial grade with good yield.",     band: "2,900 – 3,500" },
  { grade: "AGS-1 (Shipment Green-1)",          size: "4 mm+", note: "Smaller-size. Economy / commercial grade.",     band: "2,700 – 3,200" },
  { grade: "AGS-2 (Shipment Green-2)",          size: "4 mm+", note: "Lower-size for regular use / processing.",       band: "2,500 – 3,000" }
];
