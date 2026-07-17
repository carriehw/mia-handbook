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

  /* ---------- site header / nav (two pages only) ---------- */
  var NAV = [
    { href: "index.html", label: "功能指南" },
    { href: "part2.html", label: "最新更新" }
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

  /* ---------- scroll-spy for in-page TOC ---------- */
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

  ready(function () {
    try { buildNav(); } catch (e) {}
    try { backToTop(); } catch (e) {}
    try { enhanceRecipes(); } catch (e) {}
    try { scrollSpy(); } catch (e) {}
  });
})();
