/* Visitor counter + post likes
   Backed by Abacus (https://abacus.jasoncameron.dev) — a free, no-signup
   counter API. CORS-enabled, returns JSON like {"value": 123}. */
(function () {
  "use strict";

  var BASE = "https://abacus.jasoncameron.dev";
  var NS = "bhoomikalohana-blog-2026"; // namespace for this site's counters (starts fresh)

  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) return { value: 0 };
      return r.json();
    });
  }

  /* ── Site-wide visitor counter (private — owner only) ──────
     Every visit is still counted in the background. The number is
     hidden from everyone by default (.visit-counter { display:none }).
     The owner reveals it by visiting any page with "?stats" in the URL;
     that preference is remembered in this browser afterwards. */
  var visitEl = document.getElementById("visit-count");
  if (visitEl) {
    var line = visitEl.closest(".visit-counter");

    // Owner unlock: visiting with ?stats turns the display on for this browser.
    if (new URLSearchParams(location.search).has("stats")) {
      localStorage.setItem("bl-show-visits", "1");
    }
    var ownerView = localStorage.getItem("bl-show-visits") === "1";

    var counted = localStorage.getItem("bl-visit-counted");
    // Increment once per browser; on later visits just read the total.
    var path = counted ? "/get/" : "/hit/";
    getJSON(BASE + path + NS + "/site-visits")
      .then(function (d) {
        visitEl.textContent = Number(d.value || 0).toLocaleString();
        if (!counted) localStorage.setItem("bl-visit-counted", "1");
        // Reveal the line only for the owner.
        if (line && ownerView) line.style.display = "block";
      })
      .catch(function () { /* stays hidden */ });
  }

  /* ── Per-post like buttons ────────────────────────────── */
  var btns = document.querySelectorAll(".like-btn");
  Array.prototype.forEach.call(btns, function (btn) {
    var slug = btn.getAttribute("data-slug");
    if (!slug) return;

    var countEl = btn.querySelector(".like-count");
    var key = "like-" + slug;
    var likedFlag = "bl-liked-" + slug;

    // Show the current total.
    getJSON(BASE + "/get/" + NS + "/" + key).then(function (d) {
      if (countEl) countEl.textContent = Number(d.value || 0);
    });

    // Reflect a like already made from this browser.
    if (localStorage.getItem(likedFlag)) btn.classList.add("liked");

    btn.addEventListener("click", function () {
      if (localStorage.getItem(likedFlag)) return; // one like per browser
      btn.classList.add("liked");
      localStorage.setItem(likedFlag, "1");
      getJSON(BASE + "/hit/" + NS + "/" + key).then(function (d) {
        if (countEl) countEl.textContent = Number(d.value || 0);
      });
    });
  });
})();
