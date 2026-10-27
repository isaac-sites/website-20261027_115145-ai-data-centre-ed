/* Phoenix consent gate: non-essential measurement/ads stay denied until consent. */
(function () {
  "use strict";
  var STORAGE_KEY = "phoenix-consent-v1";
  var BANNER_MESSAGE = "This site uses cookies for audience measurement and ads. Choose Accept to allow them, or Reject to continue without them.";
  var ACCEPT_LABEL = "Accept";
  var REJECT_LABEL = "Reject";
  var GRANTED = {
    "ad_storage": "granted",
    "ad_user_data": "granted",
    "ad_personalization": "granted",
    "analytics_storage": "granted"
  };
  var DENIED = {
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied",
    "analytics_storage": "denied"
  };

  function phxGtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function storedConsent() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === "granted" || value === "denied" ? value : "";
    } catch (err) {
      return "";
    }
  }

  function persist(consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, consent);
    } catch (err) {
      // Storage unavailable: honour the choice for this page view only.
    }
  }

  function bannerRoot() {
    return document.querySelector("[data-phoenix-consent-banner]");
  }

  function showBanner() {
    if (bannerRoot()) {
      return;
    }
    var root = document.createElement("div");
    root.setAttribute("data-phoenix-consent-banner", "");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Cookie consent");
    root.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;padding:12px 16px;background:#101828;color:#f5f7fa;font:14px/1.4 system-ui,sans-serif;box-shadow:0 -2px 8px rgba(0,0,0,.35);";
    var text = document.createElement("span");
    text.style.cssText = "max-width:640px;";
    text.textContent = BANNER_MESSAGE;
    var accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = ACCEPT_LABEL;
    accept.style.cssText = "padding:8px 18px;border:1px solid #4c9aff;border-radius:6px;background:#1f6feb;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer;";
    var reject = document.createElement("button");
    reject.type = "button";
    reject.textContent = REJECT_LABEL;
    reject.style.cssText = "padding:8px 18px;border:1px solid #57606a;border-radius:6px;background:transparent;color:#f5f7fa;font:14px system-ui,sans-serif;cursor:pointer;";
    accept.addEventListener("click", function () {
      persist("granted");
      phxGtag("consent", "update", GRANTED);
      document.dispatchEvent(new CustomEvent("phoenix-consent-granted"));
      root.remove();
    });
    reject.addEventListener("click", function () {
      persist("denied");
      phxGtag("consent", "update", DENIED);
      root.remove();
    });
    root.appendChild(text);
    root.appendChild(accept);
    root.appendChild(reject);
    document.body.appendChild(root);
  }

  function init() {
    var consent = storedConsent();
    if (consent === "granted") {
      phxGtag("consent", "update", GRANTED);
      return;
    }
    if (consent === "denied") {
      phxGtag("consent", "update", DENIED);
      return;
    }
    if (document.body) {
      showBanner();
    } else {
      document.addEventListener("DOMContentLoaded", showBanner);
    }
  }

  // An explicit visitor action on a gated component re-surfaces the
  // choice instead of loading the third party.
  document.addEventListener("phoenix-consent-request", function () {
    if (document.body) {
      showBanner();
    } else {
      document.addEventListener("DOMContentLoaded", showBanner);
    }
  });

  init();
})();
