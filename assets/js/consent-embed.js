/* Phoenix consent-gated embed loader.
 *
 * The generator emits YouTube embeddings as click-to-load facades whenever the
 * consent gate is active (see build_youtube_embed_markdown): no third-party
 * frame, and no third-party request, exists in the initial HTML.  This loader
 * performs the only injection point, and only after the visitor has consented.
 *
 * The storage key and the event names are injected by the Stage 3 generator
 * from measurement_config, so this asset carries no key literal of its own and
 * cannot drift to a rival spelling.
 */
(function () {
  "use strict";
  var STORAGE_KEY = "phoenix-consent-v1";
  var GRANTED_EVENT = "phoenix-consent-granted";
  var REQUEST_EVENT = "phoenix-consent-request";
  var FACADE_SELECTOR = "[data-phoenix-embed]";
  var PLAY_ATTR = "data-phoenix-embed-play";
  var LOADED_ATTR = "data-phoenix-embed-loaded";
  var pending = [];

  function consentGranted() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "granted";
    } catch (err) {
      return false;
    }
  }

  function facadeFrom(node) {
    while (node && node !== document) {
      if (node.getAttribute && node.getAttribute("data-phoenix-embed")) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  function loadFacade(facade) {
    if (!facade || facade.getAttribute(LOADED_ATTR) === "1") {
      return;
    }
    var src = facade.getAttribute("data-embed-src") || "";
    // Only the privacy-preserving host is ever injected, whatever a page (or a
    // later mutation pass) puts in the attribute.
    if (src.indexOf("https://www.youtube-nocookie.com/embed/") !== 0) {
      return;
    }
    facade.setAttribute(LOADED_ATTR, "1");
    var play = facade.querySelector("[" + PLAY_ATTR + "]");
    if (play && play.parentNode) {
      play.parentNode.removeChild(play);
    }
    // The attribute template is a static literal, so no page data is ever
    // parsed as HTML; only the dynamic values go through setAttribute.
    facade.insertAdjacentHTML(
      "beforeend",
      '<iframe loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
    );
    var iframe = facade.querySelector("iframe");
    if (!iframe) {
      return;
    }
    iframe.setAttribute("src", src + "?autoplay=1");
    iframe.setAttribute(
      "title",
      facade.getAttribute("data-embed-title") || "YouTube video"
    );
  }

  function flushPending() {
    var queued = pending.slice();
    pending.length = 0;
    for (var index = 0; index < queued.length; index += 1) {
      loadFacade(queued[index]);
    }
  }

  function handleClick(event) {
    var facade = facadeFrom(event.target);
    if (!facade) {
      return;
    }
    // Consent is re-read at click time: a choice stored after page load (or
    // made in another tab) is honoured without a reload.
    if (consentGranted()) {
      loadFacade(facade);
      return;
    }
    // Without consent the third-party frame is never loaded; the click is
    // remembered and the consent choice is surfaced instead.
    if (pending.indexOf(facade) === -1) {
      pending.push(facade);
    }
    document.dispatchEvent(new CustomEvent(REQUEST_EVENT));
  }

  document.addEventListener("click", handleClick);
  document.addEventListener(GRANTED_EVENT, flushPending);
})();
