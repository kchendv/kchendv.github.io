/* Interactive behaviour: theme, navigation, scroll effects and entrance animations. */
(function () {
  "use strict";

  var STORAGE_KEY = "kc-theme";

  /* Both settings are resolved before first paint by the inline script in
     index.html, which is also where DEFAULT_THEME and MOTION are configured. */
  var reduceMotion = document.documentElement.getAttribute("data-motion") === "reduced";

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function storedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      /* Private browsing can throw on storage access. */
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#f6f8fb" : "#080b10");
    }
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-label", "Switch to " + (theme === "light" ? "dark" : "light") + " theme");
    }
  }

  function initTheme() {
    applyTheme(document.documentElement.getAttribute("data-theme") || systemTheme());

    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (err) {
        /* Preference simply will not persist. */
      }
    });

    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
      if (!storedTheme()) applyTheme(systemTheme());
    });
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    var scrim = document.querySelector(".nav__scrim");
    if (!toggle || !nav) return;

    function close() {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    if (scrim) scrim.addEventListener("click", close);

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  /* ----------------------------------------------------------------------
     Scroll progress bar + header state
     ---------------------------------------------------------------------- */
  function initScroll() {
    var progress = document.querySelector(".progress");
    var ticking = false;

    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      if (progress) progress.style.setProperty("--progress", String(Math.min(1, Math.max(0, ratio))));
      document.body.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Active nav link tracking
     ---------------------------------------------------------------------- */
  function initActiveSection() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
     Count-up statistics
     ---------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    function render(el, value) {
      var decimals = Number(el.dataset.decimals || 0);
      el.textContent = (el.dataset.prefix || "") + value.toFixed(decimals) + (el.dataset.suffix || "");
    }

    function run(el) {
      var target = Number(el.dataset.count);
      if (reduceMotion) {
        render(el, target);
        return;
      }

      var duration = 1500;
      var start = performance.now();

      function step(now) {
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        render(el, target * eased);
        if (t < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      render(el, 0);
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     Hero typewriter
     ---------------------------------------------------------------------- */
  function initTypewriter() {
    var el = document.querySelector("[data-typewriter]");
    if (!el) return;

    var words;
    try {
      words = JSON.parse(el.dataset.typewriter);
    } catch (err) {
      return;
    }
    if (!Array.isArray(words) || !words.length) return;

    if (reduceMotion) {
      el.textContent = words[0];
      return;
    }

    var index = 0;
    var chars = 0;
    var deleting = false;

    function tick() {
      var word = words[index];
      chars += deleting ? -1 : 1;
      el.textContent = word.slice(0, chars);

      var delay = deleting ? 45 : 85;
      if (!deleting && chars === word.length) {
        deleting = true;
        delay = 1900;
      } else if (deleting && chars === 0) {
        deleting = false;
        index = (index + 1) % words.length;
        delay = 320;
      }

      setTimeout(tick, delay);
    }

    setTimeout(tick, 700);
  }

  /* ----------------------------------------------------------------------
     Cursor-following highlight on project cards
     ---------------------------------------------------------------------- */
  function initCardSpotlight() {
    if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;

    document.querySelectorAll(".work-card").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", event.clientX - rect.left + "px");
        card.style.setProperty("--my", event.clientY - rect.top + "px");
      });
    });
  }

  /* ----------------------------------------------------------------------
     Current year in the footer
     ---------------------------------------------------------------------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function init() {
    initTheme();
    initNav();
    initScroll();
    initReveal();
    initActiveSection();
    initCounters();
    initTypewriter();
    initCardSpotlight();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
