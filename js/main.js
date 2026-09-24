/* M M Akbar — portfolio scripts (no dependencies). */

/**
 * Public contact links.
 * Elements marked with data-link="email" / data-link="fiverr" stay hidden until a value is set here.
 */
const SITE_LINKS = {
  email: "akbarmujeeb96@gmail.com",
  fiverr: "https://www.fiverr.com/s/qbDVrj5",
};

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Contact links from config ---------------- */

  function applyLinks() {
    const hrefs = {
      email: SITE_LINKS.email ? "mailto:" + SITE_LINKS.email : "",
      fiverr: SITE_LINKS.fiverr,
    };

    Object.keys(hrefs).forEach((key) => {
      const href = hrefs[key];
      if (!href) return;
      document.querySelectorAll('[data-link="' + key + '"]').forEach((el) => {
        el.setAttribute("href", href);
        el.hidden = false;
      });
      document.querySelectorAll('[data-link-item="' + key + '"]').forEach((el) => {
        el.hidden = false;
      });
    });

    document.querySelectorAll("[data-email-text]").forEach((el) => {
      el.textContent = SITE_LINKS.email;
    });
  }

  /* ---------------- Header: sticky state + mobile menu ---------------- */

  function initHeader() {
    const header = document.querySelector("[data-header]");
    const toggle = document.querySelector("[data-nav-toggle]");
    if (!header) return;

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle) return;

    const setOpen = (open) => {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));

    header.querySelectorAll(".nav a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------------- Active link for in-page sections ---------------- */

  function initScrollSpy(linkSelector) {
    const links = Array.from(document.querySelectorAll(linkSelector)).filter((a) =>
      (a.getAttribute("href") || "").startsWith("#")
    );
    const targets = links
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    if (!targets.length || !("IntersectionObserver" in window)) return;

    const setCurrent = (id) => {
      links.forEach((a) => {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };

    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));
        const current = targets.find((t) => visible.get(t.id));
        if (current) setCurrent(current.id);
        else links.forEach((a) => a.removeAttribute("aria-current"));
      },
      { rootMargin: "-35% 0px -60% 0px" }
    );
    targets.forEach((t) => observer.observe(t));
  }

  /* ---------------- Scroll reveal ---------------- */

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => observer.observe(el));
  }

  /* ---------------- Contact form ---------------- */

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const status = form.querySelector("[data-form-status]");
    const button = form.querySelector('button[type="submit"]');
    const label = form.querySelector("[data-submit-label]");
    const defaultLabel = label.textContent;

    const rules = {
      name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name."),
      email: (v) => (EMAIL_RE.test(v.trim()) ? "" : "Please enter a valid email address."),
      projectType: (v) => (v ? "" : "Please choose what you're building."),
      message: (v) =>
        v.trim().length >= 20 ? "" : "Please add a few more details (at least 20 characters).",
    };

    const setError = (name, message) => {
      const input = form.elements[name];
      const field = input.closest(".field");
      const error = field.querySelector(".field-error");
      field.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message;
    };

    const validate = () => {
      let firstInvalid = null;
      Object.keys(rules).forEach((name) => {
        const message = rules[name](form.elements[name].value);
        setError(name, message);
        if (message && !firstInvalid) firstInvalid = form.elements[name];
      });
      return firstInvalid;
    };

    // Re-validate a field as the user fixes it.
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      const evt = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(evt, () => {
        if (input.closest(".field").classList.contains("has-error")) {
          setError(name, rules[name](input.value));
        }
      });
      input.addEventListener("blur", () => {
        if (input.value) setError(name, rules[name](input.value));
      });
    });

    const showStatus = (type, html) => {
      const icon = type === "success" ? "i-check" : "i-alert";
      status.className = "form-status is-" + type;
      status.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="/images/icons.svg#' + icon + '"></use></svg><div>' + html + "</div>";
    };

    const fallbackContact = () => {
      const parts = [];
      if (SITE_LINKS.email) {
        parts.push('email me at <a href="mailto:' + SITE_LINKS.email + '">' + SITE_LINKS.email + "</a>");
      }
      parts.push('<a href="https://wa.me/message/QE7R322HXVBQM1" target="_blank" rel="noopener">message me on WhatsApp</a>');
      return parts.join(" or ");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      const firstInvalid = validate();
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());

      button.disabled = true;
      label.textContent = "Sending…";

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));

        if (res.ok && body.ok) {
          form.reset();
          form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
          showStatus(
            "success",
            "<strong>Thanks — your project details were sent.</strong> I'll reply to " +
              escapeHtml(data.email) +
              " as soon as I've reviewed them."
          );
        } else if (res.status === 400 && body.errors) {
          Object.keys(body.errors).forEach((name) => {
            if (form.elements[name]) setError(name, body.errors[name]);
          });
          showStatus("error", "Please check the highlighted fields and try again.");
        } else {
          throw new Error(body.error || "Request failed");
        }
      } catch (err) {
        showStatus(
          "error",
          "<strong>Your message couldn't be sent right now.</strong> Please try again in a moment, or " +
            fallbackContact() +
            "."
        );
      } finally {
        button.disabled = false;
        label.textContent = defaultLabel;
      }
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  /* ---------------- Misc ---------------- */

  function initYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = year));
  }

  applyLinks();
  initHeader();
  initScrollSpy(".nav-links a");
  initScrollSpy(".cs-toc a");
  initReveal();
  initContactForm();
  initYear();
})();
