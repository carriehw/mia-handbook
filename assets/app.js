/* Mia 團隊說明書 — shared client-side enhancements (vanilla JS, no deps) */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ---------- toast ---------- */
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  /* ---------- clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("已複製 ✓"); },
        function () { fallbackCopy(text); }
      );
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      toast("已複製 ✓");
    } catch (e) { toast("請長按選取複製"); }
  }

  /* ---------- site header / nav ---------- */
  var NAV = [
    { href: "index.html", label: "首頁" },
    { href: "learn.html", label: "上手學習" },
    { href: "part1.html", label: "功能指南" },
    { href: "gallery.html", label: "用例藝廊" },
    { href: "part2.html", label: "更新情報" },
    { href: "contribute.html", label: "團隊飛輪" }
  ];
  function currentPage() {
    var seg = location.pathname.split("/").filter(Boolean).pop() || "index.html";
    if (seg.indexOf(".html") === -1) seg = "index.html";
    return seg;
  }
  function buildNav() {
    if (document.querySelector("header.site")) return; // page already has one
    var cur = currentPage();
    var h = document.createElement("header");
    h.className = "site";
    var links = NAV.map(function (n) {
      var on = n.href === cur ? ' class="cur"' : "";
      return '<a href="' + n.href + '"' + on + ">" + n.label + "</a>";
    }).join("");
    h.innerHTML =
      '<div class="site-in">' +
      '<a class="logo" href="index.html">✦ Mia 說明書</a>' +
      '<nav class="site-nav">' + links + "</nav></div>";
    document.body.insertBefore(h, document.body.firstChild);
  }

  /* ---------- back to top ---------- */
  function backToTop() {
    var b = document.getElementById("top");
    if (!b) { b = document.createElement("button"); b.id = "top"; b.setAttribute("aria-label", "回到頂部"); b.textContent = "↑"; document.body.appendChild(b); }
    b.onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
    document.addEventListener("scroll", function () { b.classList.toggle("show", window.scrollY > 600); }, { passive: true });
  }

  /* ---------- one-click copy on every .recipe ---------- */
  function enhanceRecipes() {
    var nodes = document.querySelectorAll(".recipe");
    nodes.forEach(function (r) {
      if (r.dataset.copyReady) return;
      r.dataset.copyReady = "1";
      var text = r.innerText.trim();
      var row = document.createElement("div");
      row.className = "copyrow";
      var btn = document.createElement("button");
      btn.className = "copybtn"; btn.type = "button"; btn.textContent = "📋 複製提示詞";
      btn.onclick = function () { copyText(text); };
      row.appendChild(btn);
      r.parentNode.insertBefore(row, r.nextSibling);
    });
  }

  /* ---------- scroll-spy for in-page TOC (part1/part2) ---------- */
  function scrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll("nav.toc a"));
    if (!links.length) return;
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    function on() {
      var y = window.scrollY + 120, idx = 0;
      for (var i = 0; i < secs.length; i++) { if (secs[i] && secs[i].offsetTop <= y) idx = i; }
      links.forEach(function (l, i) { l.classList.toggle("active", i === idx); });
    }
    document.addEventListener("scroll", on, { passive: true }); on();
  }

  /* ---------- gallery ---------- */
  var GROUPS = [
    { key: "task", label: "任務" },
    { key: "client", label: "客戶" },
    { key: "cap", label: "能力" },
    { key: "level", label: "程度", map: { day1: "Day 1", week1: "Week 1", adv: "進階" } }
  ];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function gallery() {
    var root = document.getElementById("gallery-root");
    if (!root) return;
    var state = { q: "", sel: { task: [], client: [], cap: [], level: [] } };
    var data = [];
    fetch("recipes.json").then(function (r) { return r.json(); }).then(function (j) {
      data = (j.recipes || []).map(function (r) {
        r.level_arr = r.level ? [r.level] : [];
        return r;
      });
      buildFilters(data);
      render();
    }).catch(function () { root.innerHTML = '<div class="empty">載入用例資料時發生問題，請稍後再試。</div>'; });

    function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }
    function valuesFor(key) {
      var all = [];
      data.forEach(function (r) {
        var v = key === "level" ? r.level_arr : (r[key] || []);
        all = all.concat(v);
      });
      return uniq(all);
    }
    function buildFilters(d) {
      var box = document.getElementById("filters");
      var html = "";
      GROUPS.forEach(function (g) {
        var vals = valuesFor(g.key);
        if (!vals.length) return;
        html += '<div class="filter-group"><div class="flabel">' + g.label + '</div><div class="chips">';
        vals.forEach(function (v) {
          var lbl = g.map && g.map[v] ? g.map[v] : v;
          html += '<span class="fchip" data-g="' + g.key + '" data-v="' + esc(v) + '">' + esc(lbl) + "</span>";
        });
        html += "</div></div>";
      });
      box.innerHTML = html;
      box.querySelectorAll(".fchip").forEach(function (c) {
        c.onclick = function () {
          var g = c.dataset.g, v = c.dataset.v, arr = state.sel[g];
          var i = arr.indexOf(v);
          if (i === -1) { arr.push(v); c.classList.add("on"); }
          else { arr.splice(i, 1); c.classList.remove("on"); }
          render();
        };
      });
      var search = document.getElementById("gsearch");
      if (search) search.addEventListener("input", function () { state.q = this.value.trim().toLowerCase(); render(); });
      var clear = document.getElementById("gclear");
      if (clear) clear.onclick = function () {
        state.q = ""; if (search) search.value = "";
        GROUPS.forEach(function (g) { state.sel[g.key] = []; });
        box.querySelectorAll(".fchip.on").forEach(function (c) { c.classList.remove("on"); });
        render();
      };
    }
    function match(r) {
      // AND across groups, OR within a group
      var ok = GROUPS.every(function (g) {
        var sel = state.sel[g.key]; if (!sel.length) return true;
        var v = g.key === "level" ? r.level_arr : (r[g.key] || []);
        return sel.some(function (s) { return v.indexOf(s) !== -1; });
      });
      if (!ok) return false;
      if (state.q) {
        var hay = (r.title + " " + r.prompt + " " + (r.task || []).join(" ") + " " + (r.client || []).join(" ") + " " + (r.cap || []).join(" ")).toLowerCase();
        if (hay.indexOf(state.q) === -1) return false;
      }
      return true;
    }
    function render() {
      var list = data.filter(match);
      var cnt = document.getElementById("gcount");
      if (cnt) cnt.textContent = "顯示 " + list.length + " / " + data.length + " 則用例";
      if (!list.length) { root.innerHTML = '<div class="empty">沒有符合的用例，試試放寬篩選或清除條件。</div>'; return; }
      root.innerHTML = list.map(function (r) {
        var tags = []
          .concat((r.task || []).map(function (t) { return '<span class="t">' + esc(t) + "</span>"; }))
          .concat((r.client || []).map(function (t) { return '<span class="t cli">' + esc(t) + "</span>"; }))
          .concat((r.cap || []).map(function (t) { return '<span class="t cap">' + esc(t) + "</span>"; }))
          .join("");
        return '<div class="gcard"><h4>' + esc(r.title) + "</h4>" +
          '<div class="tags">' + tags + "</div>" +
          "<pre>" + esc(r.prompt) + "</pre>" +
          '<div class="copyrow"><button class="copybtn" type="button" data-id="' + r.id + '">📋 複製提示詞</button></div></div>';
      }).join("");
      root.querySelectorAll(".copybtn[data-id]").forEach(function (b) {
        b.onclick = function () {
          var r = data.filter(function (x) { return x.id === b.dataset.id; })[0];
          if (r) copyText(r.prompt);
        };
      });
    }
  }

  /* ---------- learn: checklist + progress ---------- */
  function checklist() {
    var boxes = document.querySelectorAll("#checklist input[type=checkbox]");
    if (!boxes.length) return;
    var bar = document.querySelector("#progress > i");
    function update() {
      var done = 0;
      boxes.forEach(function (b) {
        var li = b.closest("li"); var lbl = li && li.querySelector(".step-t");
        if (b.checked) { done++; if (lbl) lbl.classList.add("done"); } else { if (lbl) lbl.classList.remove("done"); }
      });
      if (bar) bar.style.width = Math.round((done / boxes.length) * 100) + "%";
      var pct = document.getElementById("progress-pct");
      if (pct) pct.textContent = done + " / " + boxes.length + " 完成";
    }
    boxes.forEach(function (b) {
      var key = "mia.learn." + b.value;
      try { if (localStorage.getItem(key) === "1") b.checked = true; } catch (e) {}
      b.addEventListener("change", function () {
        try { localStorage.setItem(key, b.checked ? "1" : "0"); } catch (e) {}
        update();
      });
    });
    update();
  }

  /* ---------- learn: tip of the day ---------- */
  function tipOfDay() {
    var el = document.getElementById("tip-body");
    var data = document.getElementById("tips-data");
    if (!el || !data) return;
    var tips;
    try { tips = JSON.parse(data.textContent); } catch (e) { return; }
    if (!tips || !tips.length) return;
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var doy = Math.floor((now - start) / 86400000);
    el.textContent = tips[doy % tips.length];
  }

  /* ---------- learn: quiz ---------- */
  function quiz() {
    var root = document.getElementById("quiz-root");
    var data = document.getElementById("quiz-data");
    if (!root || !data) return;
    var qs;
    try { qs = JSON.parse(data.textContent); } catch (e) { return; }
    root.innerHTML = qs.map(function (q, qi) {
      var opts = q.opts.map(function (o, oi) {
        return '<label class="opt" data-q="' + qi + '" data-o="' + oi + '">' + esc(o) + "</label>";
      }).join("");
      return '<div class="q"><p>' + (qi + 1) + ". " + esc(q.q) + "</p>" + opts + '<div class="fb" id="fb-' + qi + '"></div></div>';
    }).join("");
    root.querySelectorAll(".opt").forEach(function (o) {
      o.onclick = function () {
        var qi = +o.dataset.q, oi = +o.dataset.o, q = qs[qi];
        var group = root.querySelectorAll('.opt[data-q="' + qi + '"]');
        group.forEach(function (g) { g.classList.remove("right", "wrong"); });
        if (oi === q.answer) { o.classList.add("right"); }
        else { o.classList.add("wrong"); group[q.answer].classList.add("right"); }
        var fb = document.getElementById("fb-" + qi);
        if (fb) fb.textContent = (oi === q.answer ? "✓ 正確！" : "正解：" + q.opts[q.answer] + "。") + (q.fb ? " " + q.fb : "");
      };
    });
  }

  ready(function () {
    try { buildNav(); } catch (e) {}
    try { backToTop(); } catch (e) {}
    try { enhanceRecipes(); } catch (e) {}
    try { scrollSpy(); } catch (e) {}
    try { gallery(); } catch (e) {}
    try { checklist(); } catch (e) {}
    try { tipOfDay(); } catch (e) {}
    try { quiz(); } catch (e) {}
  });
})();
