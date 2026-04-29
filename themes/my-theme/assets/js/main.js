(function () {
  "use strict";

  var currentPage = 1;
  var isLoading = false;
  var hasMore = true;

  function initLazyLoading() {
    var images = document.querySelectorAll(".lazy-image");
    if (!images.length) return;

    var loadedImages = JSON.parse(sessionStorage.getItem("loadedImages") || "{}");

    if ("IntersectionObserver" in window) {
      var imageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            var src = img.getAttribute("data-src");
            // If we previously loaded this src, prefer parsing dims from URL to avoid extra request
            var parsed = parseDimsFromUrl(src);
            if (loadedImages[src]) {
              if (parsed) {
                try { img.setAttribute('width', parsed.width); img.setAttribute('height', parsed.height); } catch (e) {}
                if (img.parentElement) try { img.parentElement.style.aspectRatio = parsed.width + '/' + parsed.height; } catch (e) {}
                img.src = src;
                img.classList.add('loaded');
                observer.unobserve(img);
                requestAnimationFrame(function () { updateMasonryGrid(); });
                return;
              }
              if (!img.getAttribute('width') || !img.getAttribute('height')) {
                var tmpCached = new Image();
                tmpCached.onload = function () {
                  try { img.setAttribute('width', tmpCached.naturalWidth); img.setAttribute('height', tmpCached.naturalHeight); } catch (e) {}
                  if (img.parentElement) try { img.parentElement.style.aspectRatio = tmpCached.naturalWidth + '/' + tmpCached.naturalHeight; } catch (e) {}
                  img.src = src;
                  img.classList.add('loaded');
                  observer.unobserve(img);
                  requestAnimationFrame(function () { updateMasonryGrid(); });
                };
                tmpCached.src = src;
              } else {
                img.src = src;
                img.classList.add('loaded');
                observer.unobserve(img);
              }
              return;
            }

            // if URL contains dims, use them and avoid extra temp image request
            var dims = parsed || parseDimsFromUrl(src);
            if (dims) {
              try { img.setAttribute('width', dims.width); img.setAttribute('height', dims.height); } catch (e) {}
              if (img.parentElement) try { img.parentElement.style.aspectRatio = dims.width + '/' + dims.height; } catch (e) {}
              img.src = src;
              img.classList.add('loaded');
              loadedImages[src] = true;
              sessionStorage.setItem('loadedImages', JSON.stringify(loadedImages));
              observer.unobserve(img);
              requestAnimationFrame(function () { updateMasonryGrid(); });
            } else {
              var tempImg = new Image();
              tempImg.onload = function () {
                // write intrinsic dimensions before setting src so browser can reserve aspect ratio and avoid reflow
                try { img.setAttribute('width', tempImg.naturalWidth); img.setAttribute('height', tempImg.naturalHeight); } catch (e) {}
                if (img.parentElement) try { img.parentElement.style.aspectRatio = tempImg.naturalWidth + '/' + tempImg.naturalHeight; } catch (e) {}
                img.src = src;
                img.classList.add('loaded');
                loadedImages[src] = true;
                sessionStorage.setItem('loadedImages', JSON.stringify(loadedImages));
                observer.unobserve(img);
                // After image loads, reflow masonry
                requestAnimationFrame(function () { updateMasonryGrid(); });
              };
              tempImg.onerror = function () {
                img.classList.add('error');
                observer.unobserve(img);
              };
              tempImg.src = src;
            }
          }
        });
      }, {
        rootMargin: "100px 0px",
        threshold: 0.01
      });

      images.forEach(function (img) {
        imageObserver.observe(img);
      });
    } else {
      images.forEach(function (img) {
        var src = img.getAttribute('data-src');
        var dims = parseDimsFromUrl(src);
        if (dims) {
          try { img.setAttribute('width', dims.width); img.setAttribute('height', dims.height); } catch (e) {}
          if (img.parentElement) try { img.parentElement.style.aspectRatio = dims.width + '/' + dims.height; } catch (e) {}
          img.src = src;
          img.classList.add('loaded');
          requestAnimationFrame(function () { updateMasonryGrid(); });
          return;
        }
        // fallback to temp image to measure
        var tmp = new Image();
        tmp.onload = function () {
          try { img.setAttribute('width', tmp.naturalWidth); img.setAttribute('height', tmp.naturalHeight); } catch (e) {}
          if (img.parentElement) try { img.parentElement.style.aspectRatio = tmp.naturalWidth + '/' + tmp.naturalHeight; } catch (e) {}
          img.src = src;
          img.classList.add('loaded');
          requestAnimationFrame(function () { updateMasonryGrid(); });
        };
        tmp.onerror = function () {
          img.src = src;
          img.classList.add('loaded');
          requestAnimationFrame(function () { updateMasonryGrid(); });
        };
        tmp.src = src;
      });
    }
  }

  /* -------------------------
   JS Masonry helpers (Grid + JS row-span)
     - keeps DOM order left->right/top->bottom
     - computes grid-row-end based on element heights and grid-auto-rows
  ------------------------- */
  function getGridMetrics(grid) {
    var style = window.getComputedStyle(grid);
    var rowHeight = parseFloat(style.getPropertyValue('grid-auto-rows')) || 8;
    var rowGap = parseFloat(style.getPropertyValue('gap')) || 24;
    return { rowHeight: rowHeight, rowGap: rowGap };
  }

  // Try to parse width/height from common image URLs (e.g. picsum.photos/.../WIDTH/HEIGHT.webp)
  function parseDimsFromUrl(url) {
    try {
      // match /<width>/<height> before extension or query
      var m = url.match(/\/(\d+)\/(\d+)(?:\.|$|\?|#)/);
      if (m && m.length >= 3) {
        var w = parseInt(m[1], 10);
        var h = parseInt(m[2], 10);
        if (w > 0 && h > 0) return { width: w, height: h };
      }
    } catch (e) {}
    return null;
  }

  function resizeMasonryItem(item) {
    var grid = document.querySelector('.masonry');
    if (!grid || !item) return;
    var metrics = getGridMetrics(grid);
    var rowHeight = metrics.rowHeight;
    var rowGap = metrics.rowGap;
  // Allow the item to size naturally to measure its full content height
  var prev = item.style.gridRowEnd;
  item.style.gridRowEnd = 'auto';
  // Use scrollHeight to get the full content height even if the item was previously constrained
  var baseHeight = item.scrollHeight || item.getBoundingClientRect().height;
  // include vertical margins and borders in measurement, so rendered height matches visual box
  var style = window.getComputedStyle(item);
  var marginTop = parseFloat(style.marginTop) || 0;
  var marginBottom = parseFloat(style.marginBottom) || 0;
  var borderTop = parseFloat(style.borderTopWidth) || 0;
  var borderBottom = parseFloat(style.borderBottomWidth) || 0;
  var itemHeight = Math.ceil(baseHeight + marginTop + marginBottom + borderTop + borderBottom);
  // ensure at least 1 row span to avoid items collapsing to zero height
  var rowSpan = Math.max(1, Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap)));
  item.style.gridRowEnd = 'span ' + rowSpan;
  // Debug: log first few items to console to help diagnose height issues (will be ignored in production)
  if (window.__MASONRY_DEBUG) {
    try {
      var idx = Array.prototype.indexOf.call(item.parentNode.children, item);
      if (idx < 6) console.debug('masonry: item', idx, 'h=' + itemHeight, 'rowHeight=' + rowHeight, 'gap=' + rowGap, 'span=' + rowSpan);
    } catch (e) {}
  }
  // preserve previous style if needed (we already set the correct span)
  // (no need to restore prev)
  }

  function updateMasonryGrid() {
    var grid = document.querySelector('.masonry');
    if (!grid) return;
    var items = grid.querySelectorAll('.card');
    items.forEach(function (it) { resizeMasonryItem(it); });
  }

  function debounce(fn, wait) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, wait); };
  }

  function loadMorePosts() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    currentPage++;
    
    var loadBtn = document.getElementById("load-more-btn");
    var spinner = document.getElementById("loading-spinner");
    
    if (loadBtn) loadBtn.style.display = "none";
    if (spinner) spinner.style.display = "flex";

    var url = "/notes/page/" + currentPage + "/";
    
    fetch(url)
      .then(function (response) {
        if (response.status === 404) {
          hasMore = false;
          throw new Error("No more pages");
        }
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then(function (html) {
        var tempContainer = document.createElement("div");
        tempContainer.innerHTML = html;
        
        var newCards = tempContainer.querySelectorAll(".card");
        var masonryContainer = document.getElementById("masonry-container");
        
        if (newCards.length === 0) {
          hasMore = false;
          if (spinner) spinner.style.display = "none";
          if (loadBtn) {
            loadBtn.style.display = "none";
          }
          isLoading = false;
          return;
        }
        
        newCards.forEach(function (card) {
          masonryContainer.appendChild(card);
        });

  initLazyLoading();
  // reflow after images are registered
  requestAnimationFrame(function () { updateMasonryGrid(); });
  // save a snapshot of the home masonry so back navigation can restore quickly
  saveHomeCache();
        
        if (spinner) spinner.style.display = "none";
        if (loadBtn) loadBtn.style.display = "inline-flex";
        isLoading = false;
      })
      .catch(function (error) {
        console.error("Error loading more posts:", error);
        hasMore = false;
        if (spinner) spinner.style.display = "none";
        if (loadBtn) {
          loadBtn.style.display = "none";
        }
        isLoading = false;
      });
  }

  function initLoadMore() {
    var loadBtn = document.getElementById("load-more-btn");
    if (!loadBtn) return;

    loadBtn.addEventListener("click", function () {
      loadMorePosts();
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !isLoading && hasMore) {
            loadMorePosts();
          }
        });
      }, {
        rootMargin: "200px 0px"
      });

      observer.observe(loadBtn);
    }
  }

  function initBackButton() {
    var backBtn = document.querySelector(".back-btn");
    if (!backBtn) return;

    backBtn.addEventListener("click", function (e) {
      if (window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }

  // --- Home snapshot cache for fast back navigation ---
  var HOME_CACHE_KEY = 'home_snapshot_v1';

  function saveHomeCache() {
    try {
  var container = document.getElementById('masonry-container') || document.querySelector('.masonry');
  if (!container) return;
  // Only save if this container is the home container
  if (container.dataset.home !== 'true') return;
      var html = container.innerHTML;
  var scroll = window.scrollY || window.pageYOffset || 0;
  var payload = { html: html, scroll: scroll, ts: Date.now(), path: window.location.pathname };
      sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify(payload));
    } catch (e) { console.warn('saveHomeCache failed', e); }
  }

  function restoreHomeCache() {
    try {
      var data = sessionStorage.getItem(HOME_CACHE_KEY);
      if (!data) return false;
      var payload = JSON.parse(data);
      var container = document.getElementById('masonry-container') || document.querySelector('.masonry');
      if (!container) return false;
  // Only restore if the saved snapshot path matches current path (avoid restoring taxonomy into home)
  if (payload.path && payload.path !== window.location.pathname) return false;
      container.innerHTML = payload.html;
      // re-init lazy loading for restored images
      initLazyLoading();
      // small delay to let images register, then reflow and restore scroll
      setTimeout(function () { updateMasonryGrid(); window.scrollTo(0, payload.scroll || 0); }, 40);
      return true;
    } catch (e) { console.warn('restoreHomeCache failed', e); return false; }
  }

  function interceptCardLinks() {
    var container = document.getElementById('masonry-container') || document.querySelector('.masonry');
    if (!container) return;
    container.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.card');
      if (!a) return;
  // save snapshot before navigating away (only if this is home)
  if (container.dataset.home === 'true') saveHomeCache();
      // allow default navigation
    });
  }

  function initScrollHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    window.addEventListener("scroll", function () {
      var currentScroll = window.pageYOffset;
      if (currentScroll > 10) {
        header.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      } else {
        header.style.boxShadow = "none";
      }
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLazyLoading();
    initBackButton();
    initScrollHeader();
    initLoadMore();
  // initial masonry layout
  // try to restore cached homepage state (fast back navigation)
  var restored = restoreHomeCache();
  if (!restored) {
    requestAnimationFrame(function () { updateMasonryGrid(); });
  }

  // reflow on window resize
  window.addEventListener('resize', debounce(function () { updateMasonryGrid(); }, 120));
  // intercept card clicks to save snapshot
  interceptCardLinks();
  });

  // browsers fire pageshow when navigating back/forward — attempt restore there too
  window.addEventListener('pageshow', function (evt) {
    // if persisted (bfcache) the DOM may already be present; still attempt to restore scroll
    var restored = restoreHomeCache();
    if (!restored) {
      // run a reflow in case DOM was preserved but heights need adjusting
      requestAnimationFrame(function () { updateMasonryGrid(); });
    }
  });

  // Ensure we reflow after all resources (images/fonts) have loaded on first full load
  window.addEventListener('load', function () {
    requestAnimationFrame(function () { updateMasonryGrid(); });
    // Additional delayed reflows to catch late-loading images or font reflows
    setTimeout(updateMasonryGrid, 120);
    setTimeout(updateMasonryGrid, 400);
  });

  // Observe masonry container for new children or image src attribute changes and trigger reflow (debounced)
  function observeMasonryMutations() {
    var container = document.getElementById('masonry-container') || document.querySelector('.masonry');
    if (!container || typeof MutationObserver === 'undefined') return;
    var mo = new MutationObserver(debounce(function (mutationsList) {
      // run a reflow after DOM changes (new cards appended or images src updated)
      updateMasonryGrid();
    }, 80));

    mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }

  // start observing after DOM ready
  document.addEventListener('DOMContentLoaded', function () { observeMasonryMutations(); });
})();