/* WATL — site behaviour. No dependencies, no build step. */
(function () {
  "use strict";

  /* ---- Theme -------------------------------------------------- */
  var root = document.documentElement;
  var STORE = "watl-theme";

  function setTheme(mode) {
    root.setAttribute("data-theme", mode);
    try { localStorage.setItem(STORE, mode); } catch (e) { /* private mode */ }
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", mode === "dark" ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("aria-pressed", String(mode === "dark"));
    });
  }

  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  });
  setTheme(root.getAttribute("data-theme") || "light");

  /* ---- Nav ---------------------------------------------------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    var closeNav = function () {
      nav.setAttribute("data-open", "false");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ---- Reveal on scroll --------------------------------------- */
  var targets = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Number(el.getAttribute("data-reveal-delay") || 0);
        setTimeout(function () { el.classList.add("is-in"); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- Marquee: duplicate track so the loop is seamless -------- */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ---- Year ---------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Contact form ------------------------------------------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var org = String(data.get("org") || "").trim();
      var brief = String(data.get("brief") || "").trim();
      var horizon = String(data.get("horizon") || "");

      if (!name || !email || !brief) {
        status.textContent = "Name, email and brief are all required.";
        status.setAttribute("data-state", "err");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = "That email address does not look right.";
        status.setAttribute("data-state", "err");
        return;
      }

      var body = [
        "Name: " + name,
        "Email: " + email,
        "Organisation: " + (org || "—"),
        "Horizon: " + (horizon || "—"),
        "",
        brief
      ].join("\n");

      var href = "mailto:hello@wattle.technology" +
        "?subject=" + encodeURIComponent("New brief — " + (org || name)) +
        "&body=" + encodeURIComponent(body);

      status.textContent = "Opening your mail client…";
      status.setAttribute("data-state", "ok");
      window.location.href = href;
    });
  }
})();
