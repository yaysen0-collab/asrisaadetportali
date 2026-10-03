(function () {
  "use strict";

  function closeMenu(nav, toggle, links) {
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    links.querySelectorAll("a").forEach(function (link) {
      link.removeAttribute("tabindex");
    });
  }

  function openMenu(nav, toggle, links) {
    nav.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    links.querySelectorAll("a").forEach(function (link) {
      link.removeAttribute("tabindex");
    });
  }

  function initMobileMenu() {
    var nav = document.querySelector(".site-nav");
    var toggle = nav && nav.querySelector(".menu-toggle");
    var links = nav && nav.querySelector("#primary-navigation");

    if (!nav || !toggle || !links) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("menu-open");
      if (isOpen) {
        closeMenu(nav, toggle, links);
      } else {
        openMenu(nav, toggle, links);
      }
    });

    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeMenu(nav, toggle, links);
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("menu-open") || nav.contains(event.target)) return;
      closeMenu(nav, toggle, links);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("menu-open")) {
        closeMenu(nav, toggle, links);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 941px)").matches) {
        closeMenu(nav, toggle, links);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileMenu);
  } else {
    initMobileMenu();
  }
}());
