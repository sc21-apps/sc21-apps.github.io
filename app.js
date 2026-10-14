// Последние версии из релизов GitHub + рекомендация под устройство посетителя.
(function () {
  "use strict";

  var REPOS = {
    android: "Dlzxn/school_21_mobile",
    ios: "Dlzxn/school_21_ios",
    desktop: "Dlzxn/school_21_desktop",
  };

  // Какие файлы релиза показывать кнопками (по порядку).
  var ASSETS = {
    android: [{ test: /\.apk$/i, label: "Скачать APK" }],
    ios: [{ test: /\.ipa$/i, label: "Скачать IPA" }],
    desktop: [
      { test: /x64-setup\.exe$/i, label: "Windows", os: "windows" },
      { test: /aarch64\.dmg$/i, label: "macOS · Apple Silicon", os: "mac" },
      { test: /x64\.dmg$/i, label: "macOS · Intel", os: "mac" },
      { test: /\.AppImage$/i, label: "Linux · AppImage", os: "linux" },
      { test: /\.deb$/i, label: ".deb", os: "linux" },
      { test: /\.rpm$/i, label: ".rpm", os: "linux" },
    ],
  };

  function detect() {
    var ua = navigator.userAgent || "";
    var touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPadOS выдаёт себя за Mac
    if (/Android/i.test(ua)) return { platform: "android" };
    if (/iPhone|iPad|iPod/i.test(ua) || touchMac) return { platform: "ios" };
    if (/Windows/i.test(ua)) return { platform: "desktop", os: "windows" };
    if (/Mac OS X|Macintosh/i.test(ua)) return { platform: "desktop", os: "mac" };
    if (/Linux|X11/i.test(ua)) return { platform: "desktop", os: "linux" };
    return { platform: null };
  }

  function sizeLabel(bytes) {
    return bytes > 1048576 ? (bytes / 1048576).toFixed(1) + " МБ" : Math.max(1, Math.round(bytes / 1024)) + " КБ";
  }

  function button(href, text, primary) {
    var a = document.createElement("a");
    a.className = "btn small " + (primary ? "primary" : "alt");
    a.href = href;
    a.textContent = text;
    return a;
  }

  var device = detect();
  var heroBtn = document.getElementById("hero-download");

  function fill(platform, release) {
    var box = document.querySelector('[data-buttons="' + platform + '"]');
    var version = document.querySelector('[data-version="' + platform + '"]');
    var page = "https://github.com/" + REPOS[platform] + "/releases/latest";
    box.textContent = "";

    if (!release) {
      version.textContent = "релизы";
      box.appendChild(button(page, "Открыть релизы на GitHub", true));
      return;
    }
    version.textContent = release.tag_name;

    ASSETS[platform].forEach(function (rule) {
      var asset = release.assets.find(function (a) { return rule.test.test(a.name); });
      if (!asset) return;
      var primary = platform !== "desktop" || (device.platform === "desktop" && device.os === rule.os && /Windows|Apple Silicon|AppImage/.test(rule.label));
      box.appendChild(button(asset.browser_download_url, rule.label + " · " + sizeLabel(asset.size), primary));
      if (platform === device.platform && primary && heroBtn && !heroBtn.dataset.set) {
        heroBtn.href = asset.browser_download_url;
        heroBtn.textContent = "Скачать " + rule.label.replace("Скачать ", "") + " · " + release.tag_name;
        heroBtn.dataset.set = "1";
      }
    });
    if (!box.children.length) box.appendChild(button(page, "Открыть релиз", true));
  }

  // Карточка под устройство — первой и подсвеченной.
  if (device.platform) {
    var card = document.querySelector('[data-platform="' + device.platform + '"]');
    if (card) {
      card.classList.add("recommended");
      card.parentNode.insertBefore(card, card.parentNode.firstChild);
    }
    var tab = document.querySelector('.tab[data-tab="' + device.platform + '"]');
    if (tab) showTab(device.platform);
  }

  Object.keys(REPOS).forEach(function (platform) {
    fetch("https://api.github.com/repos/" + REPOS[platform] + "/releases/latest", { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (release) { fill(platform, release); });
  });

  // Вкладки «Как установить».
  function showTab(name) {
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t.dataset.tab === name); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("hidden", p.dataset.panel !== name); });
  }
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { showTab(t.dataset.tab); });
  });
  document.querySelectorAll('a.more[href^="#install-"]').forEach(function (a) {
    a.addEventListener("click", function () { showTab(a.getAttribute("href").replace("#install-", "")); });
  });
})();
