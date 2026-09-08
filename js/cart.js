/* ============================================================
   MAHFY — cart (localStorage) + 5 kg rule
   ============================================================ */
(function (w) {
  "use strict";
  const KEY = "mahfy_cart_v1";
  const ORDER_KEY = "mahfy_last_order";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    w.dispatchEvent(new CustomEvent("mahfy:cart"));
  }

  function gramsOf(item) {
    return (Number(item.grams) || 0) * (Number(item.qty) || 0);
  }

  function totalGrams(items) {
    return (items || load()).reduce((s, i) => s + gramsOf(i), 0);
  }

  function add(line) {
    const items = load();
    const idx = items.findIndex(
      (i) => i.id === line.id && Number(i.grams) === Number(line.grams)
    );
    const next = items.map((i) => ({ ...i }));
    if (idx >= 0) next[idx].qty += line.qty;
    else next.push({ ...line });
    const max = (w.MAHFY_CONFIG && w.MAHFY_CONFIG.maxGrams) || 5000;
    if (totalGrams(next) > max) {
      return { ok: false, overLimit: true, grams: totalGrams(next) };
    }
    save(next);
    return { ok: true, items: next };
  }

  function setQty(id, grams, qty) {
    const items = load();
    const next = items
      .map((i) =>
        i.id === id && Number(i.grams) === Number(grams) ? { ...i, qty } : i
      )
      .filter((i) => i.qty > 0);
    const max = (w.MAHFY_CONFIG && w.MAHFY_CONFIG.maxGrams) || 5000;
    if (totalGrams(next) > max) {
      return { ok: false, overLimit: true };
    }
    save(next);
    return { ok: true };
  }

  function remove(id, grams) {
    save(load().filter((i) => !(i.id === id && Number(i.grams) === Number(grams))));
  }

  function clear() {
    save([]);
  }

  function count() {
    return load().reduce((s, i) => s + (i.qty || 0), 0);
  }

  w.MAHFY_CART = {
    load,
    save,
    add,
    setQty,
    remove,
    clear,
    count,
    totalGrams,
    gramsOf
  };

  w.MAHFY_ORDERS = {
    save(order) {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    },
    last() {
      try {
        return JSON.parse(localStorage.getItem(ORDER_KEY) || "null");
      } catch (e) {
        return null;
      }
    }
  };
})(window);
