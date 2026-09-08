#!/usr/bin/env python3
"""
MAHFY — Daily Price Editor
==========================
A tiny desktop app to update the prices shown on the MAHFY website.

It reads/writes  prices.js  (the file the website loads).
You never touch code — just type the new rate, tick "in stock", Save.

Run as a script:      python price_editor.py
Or build an .exe:     see build_exe.bat  in this folder.
"""

import json
import os
import sys
import re
import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

START = "/* JSON_START */"
END = "/* JSON_END */"

# ---- palette (matches the website) -------------------------------------
BG      = "#140d08"
PANEL   = "#1e140d"
CARD    = "#241811"
INK     = "#f6ede2"
MUTED   = "#b8a998"
AMBER   = "#f0b869"
TERRA   = "#e0894f"
LINE    = "#3a2a1c"
GREEN   = "#8fbf7f"


def app_dir():
    """Folder the script/exe actually lives in."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def find_prices_js():
    """Look for prices.js next to the app, one level up, or nearby."""
    here = app_dir()
    candidates = [
        os.path.join(here, "prices.js"),
        os.path.join(here, "..", "prices.js"),
        os.path.join(here, "..", "..", "prices.js"),
        os.path.join(os.getcwd(), "prices.js"),
    ]
    for c in candidates:
        c = os.path.normpath(c)
        if os.path.isfile(c):
            return c
    return None


def load_prices(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if START not in content or END not in content:
        raise ValueError(
            "prices.js is missing the JSON_START / JSON_END markers.\n"
            "Please restore it from the original file."
        )
    i = content.index(START) + len(START)
    j = content.index(END)
    data = json.loads(content[i:j].strip())
    return content, data


def save_prices(path, content, data):
    prefix = content[: content.index(START) + len(START)]
    suffix = content[content.index(END):]
    body = json.dumps(data, indent=2, ensure_ascii=False)
    new = prefix + "\n" + body + "\n" + suffix
    # keep a .bak just in case
    try:
        with open(path + ".bak", "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)


class Editor(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MAHFY — Daily Price Editor")
        self.configure(bg=BG)
        self.geometry("560x720")
        self.minsize(480, 560)
        try:
            ico = os.path.join(app_dir(), "..", "assets", "icon.ico")
            if os.path.isfile(ico):
                self.iconbitmap(ico)
        except Exception:
            pass

        self.path = None
        self.content = ""
        self.data = {}
        self.rows = {}      # id -> {"price": StringVar, "stock": BooleanVar}
        self.currency = "₹"
        self.unit = "kg"

        self._build_style()
        self._build_header()
        self._build_scroll_area()
        self._build_footer()

        self.after(60, self.initial_load)

    # ---------- styling ----------
    def _build_style(self):
        s = ttk.Style(self)
        try:
            s.theme_use("clam")
        except Exception:
            pass
        s.configure("TCheckbutton", background=CARD, foreground=MUTED,
                    focuscolor=CARD)
        s.map("TCheckbutton", background=[("active", CARD)])

    def _build_header(self):
        top = tk.Frame(self, bg=BG)
        top.pack(fill="x", padx=18, pady=(16, 6))
        tk.Label(top, text="MAHFY", bg=BG, fg=INK,
                 font=("Georgia", 22, "bold")).pack(anchor="w")
        tk.Label(top, text="Daily Price Editor  ·  set today's rates and Save",
                 bg=BG, fg=TERRA, font=("Segoe UI", 9)).pack(anchor="w")

        datebar = tk.Frame(self, bg=BG)
        datebar.pack(fill="x", padx=18, pady=(4, 8))
        tk.Label(datebar, text="Prices for date:", bg=BG, fg=MUTED,
                 font=("Segoe UI", 9)).pack(side="left")
        self.date_var = tk.StringVar(value=datetime.date.today().isoformat())
        self.date_entry = tk.Entry(datebar, textvariable=self.date_var, width=14,
                                   bg=CARD, fg=INK, insertbackground=AMBER,
                                   relief="flat", justify="center",
                                   font=("Consolas", 10))
        self.date_entry.pack(side="left", padx=8, ipady=3)
        tk.Button(datebar, text="Today", command=self.set_today,
                  bg=PANEL, fg=MUTED, activebackground=LINE,
                  activeforeground=INK, relief="flat",
                  font=("Segoe UI", 8), cursor="hand2").pack(side="left")
        tk.Label(datebar, text="(YYYY-MM-DD)", bg=BG, fg=MUTED,
                 font=("Segoe UI", 8)).pack(side="left", padx=6)

    def _build_scroll_area(self):
        wrap = tk.Frame(self, bg=BG)
        wrap.pack(fill="both", expand=True, padx=12, pady=4)
        self.canvas = tk.Canvas(wrap, bg=BG, highlightthickness=0)
        vs = tk.Scrollbar(wrap, orient="vertical", command=self.canvas.yview)
        self.inner = tk.Frame(self.canvas, bg=BG)
        self.inner.bind("<Configure>", lambda e: self.canvas.configure(
            scrollregion=self.canvas.bbox("all")))
        self.win = self.canvas.create_window((0, 0), window=self.inner, anchor="nw")
        self.canvas.bind("<Configure>",
                         lambda e: self.canvas.itemconfig(self.win, width=e.width))
        self.canvas.configure(yscrollcommand=vs.set)
        self.canvas.pack(side="left", fill="both", expand=True)
        vs.pack(side="right", fill="y")
        # mouse wheel
        self.canvas.bind_all("<MouseWheel>",
                             lambda e: self.canvas.yview_scroll(int(-e.delta / 120), "units"))

    def _build_footer(self):
        foot = tk.Frame(self, bg=BG)
        foot.pack(fill="x", padx=18, pady=(6, 14))
        self.status = tk.Label(foot, text="", bg=BG, fg=MUTED,
                               font=("Segoe UI", 9), anchor="w")
        self.status.pack(side="left", fill="x", expand=True)
        self.save_btn = tk.Button(foot, text="  Save prices  ",
                                  command=self.save, bg=AMBER, fg="#1a0f08",
                                  activebackground=TERRA, activeforeground="#1a0f08",
                                  relief="flat", font=("Segoe UI", 11, "bold"),
                                  cursor="hand2")
        self.save_btn.pack(side="right", ipady=4)

    # ---------- category label from id ----------
    @staticmethod
    def _cat(item_id):
        if item_id.startswith("card"):
            return "CARDAMOM"
        if item_id.startswith("pepper"):
            return "PEPPER"
        if item_id.startswith("coffee"):
            return "COFFEE"
        if item_id.startswith("nutmeg"):
            return "NUTMEG"
        return "OTHER"

    # ---------- data ----------
    def initial_load(self):
        path = find_prices_js()
        if not path:
            messagebox.showinfo(
                "Find prices.js",
                "Couldn't find prices.js automatically.\n"
                "Please point me to it (it sits in the website folder).")
            path = filedialog.askopenfilename(
                title="Select prices.js",
                filetypes=[("JavaScript", "prices.js"), ("All files", "*.*")])
            if not path:
                self.status.config(text="No file loaded.", fg=TERRA)
                return
        self.load_file(path)

    def load_file(self, path):
        try:
            content, data = load_prices(path)
        except Exception as e:
            messagebox.showerror("Could not read prices.js", str(e))
            return
        self.path = path
        self.content = content
        self.data = data
        self.currency = data.get("currency", "₹")
        self.unit = data.get("unit", "kg")
        if data.get("updated"):
            self.date_var.set(data["updated"])
        self.build_rows()
        self.status.config(text="Loaded  " + os.path.basename(path), fg=GREEN)

    def build_rows(self):
        for w in self.inner.winfo_children():
            w.destroy()
        self.rows.clear()
        items = self.data.get("items", {})
        last_cat = None
        for iid, it in items.items():
            cat = self._cat(iid)
            if cat != last_cat:
                tk.Label(self.inner, text=cat, bg=BG, fg=AMBER,
                         font=("Segoe UI", 9, "bold")).pack(
                    anchor="w", padx=8, pady=(14, 4))
                last_cat = cat
            self._row(iid, it)

    def _row(self, iid, it):
        row = tk.Frame(self.inner, bg=CARD)
        row.pack(fill="x", padx=6, pady=3)
        name = it.get("name", iid)
        tk.Label(row, text=name, bg=CARD, fg=INK, anchor="w",
                 font=("Segoe UI", 10)).pack(side="left", padx=(12, 6),
                                             pady=10, fill="x", expand=True)

        tk.Label(row, text=self.currency, bg=CARD, fg=AMBER,
                 font=("Georgia", 12)).pack(side="left")
        pv = tk.StringVar(value=str(it.get("price", "")))
        ent = tk.Entry(row, textvariable=pv, width=8, bg=PANEL, fg=INK,
                       insertbackground=AMBER, relief="flat", justify="right",
                       font=("Consolas", 12))
        ent.pack(side="left", padx=(2, 4), ipady=4)
        tk.Label(row, text="/" + self.unit, bg=CARD, fg=MUTED,
                 font=("Segoe UI", 8)).pack(side="left", padx=(0, 8))

        sv = tk.BooleanVar(value=it.get("inStock", True))
        chk = ttk.Checkbutton(row, text="in stock", variable=sv,
                              style="TCheckbutton")
        chk.pack(side="left", padx=(0, 12))

        self.rows[iid] = {"price": pv, "stock": sv}

    # ---------- actions ----------
    def set_today(self):
        self.date_var.set(datetime.date.today().isoformat())

    def _valid_date(self, s):
        try:
            datetime.date.fromisoformat(s.strip())
            return True
        except ValueError:
            return False

    def save(self):
        if not self.path:
            messagebox.showwarning("Nothing loaded", "Load prices.js first.")
            return
        d = self.date_var.get().strip()
        if not self._valid_date(d):
            messagebox.showerror("Bad date",
                                 "Date must look like 2026-09-06 (YYYY-MM-DD).")
            return
        # validate + collect prices
        for iid, r in self.rows.items():
            raw = r["price"].get().strip().replace(",", "")
            if raw == "":
                messagebox.showerror(
                    "Missing price",
                    "Please enter a price for:\n" +
                    self.data["items"][iid].get("name", iid))
                return
            try:
                val = float(raw)
                val = int(val) if val == int(val) else round(val, 2)
            except ValueError:
                messagebox.showerror(
                    "Bad price",
                    f"'{raw}' is not a number for:\n" +
                    self.data["items"][iid].get("name", iid))
                return
            self.data["items"][iid]["price"] = val
            self.data["items"][iid]["inStock"] = bool(r["stock"].get())

        self.data["updated"] = d
        try:
            save_prices(self.path, self.content, self.data)
            # refresh the in-memory content so repeated saves keep working
            self.content, self.data = load_prices(self.path)
        except Exception as e:
            messagebox.showerror("Save failed", str(e))
            return
        self.status.config(
            text="Saved ✓  " + datetime.datetime.now().strftime("%H:%M:%S") +
                 "  —  refresh the website to see it.", fg=GREEN)
        messagebox.showinfo(
            "Saved",
            "Prices saved for " + d + ".\n\n"
            "Refresh the MAHFY website (or re-open index.html) "
            "to see the new rates.")


if __name__ == "__main__":
    Editor().mainloop()
