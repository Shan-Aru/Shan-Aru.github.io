/* ==========================================================================
   Shandhiya Chhetri — portfolio interactions
   1. Theme toggle (remembers your choice)
   2. Mobile menu
   3. Nav border once you scroll
   4. Highlight the nav link for the section on screen
   5. Gentle reveal as sections scroll into view
   6. Copy email button
   7. Current year in the footer
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  const nav = document.getElementById('nav');

  // localStorage can be blocked (private windows, strict privacy settings).
  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (err) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (err) { /* ignore */ }
    }
  };

  const media = (query) => (window.matchMedia ? window.matchMedia(query) : null);

  /* ---------- 1. Theme toggle ---------- */
  const themeButton = document.getElementById('theme-toggle');
  const prefersDark = media('(prefers-color-scheme: dark)');

  const savedTheme = storage.get('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.setAttribute('data-theme', savedTheme);
  }

  function currentTheme() {
    const set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return prefersDark && prefersDark.matches ? 'dark' : 'light';
  }

  function updateThemeLabel() {
    if (!themeButton) return;
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', `Switch to ${next} theme`);
    themeButton.title = `Switch to ${next} theme`;
  }

  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      storage.set('theme', next);
      updateThemeLabel();
    });
    if (prefersDark && prefersDark.addEventListener) {
      prefersDark.addEventListener('change', updateThemeLabel);
    }
    updateThemeLabel();
  }

  /* ---------- 2. Mobile menu ---------- */
  const menuButton = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  function setMenu(open) {
    if (!nav || !menuButton) return;
    nav.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));

    // Close after picking a section, on Escape, or when the screen gets wide.
    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
    const wide = media('(min-width: 780px)');
    if (wide && wide.addEventListener) {
      wide.addEventListener('change', (event) => { if (event.matches) setMenu(false); });
    }
  }

  /* ---------- 3. Nav border on scroll ---------- */
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 4. Active nav link ---------- */
  const sectionLinks = navLinks ? Array.from(navLinks.querySelectorAll('a[href^="#"]')) : [];

  if ('IntersectionObserver' in window && sectionLinks.length) {
    const ids = ['top'].concat(sectionLinks.map((link) => link.getAttribute('href').slice(1)));
    const sections = [...new Set(ids)]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const hash = `#${entry.target.id}`;
        sectionLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === hash);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- 5. Scroll reveal ---------- */
  const reduceMotion = media('(prefers-reduced-motion: reduce)');
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  if (revealItems.length && !(reduceMotion && reduceMotion.matches)) {
    let pending = revealItems.slice();

    // Shows every item whose top has reached the lower part of the screen,
    // including items you jumped past with a nav link. Only a handful of
    // elements are checked, so running this on each scroll event is cheap.
    const revealInView = () => {
      const limit = (window.innerHeight || root.clientHeight) * 0.92;
      pending = pending.filter((item) => {
        if (item.getBoundingClientRect().top < limit) {
          item.classList.add('is-visible');
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', revealInView);
        window.removeEventListener('resize', revealInView);
      }
    };

    // Anything already on screen is shown before the effect switches on, so it never fades.
    revealInView();
    root.classList.add('reveal-ready');
    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView);
  }

  /* ---------- 6. Copy email ---------- */
  const copyButton = document.getElementById('copy-email');
  const email = document.getElementById('email');

  if (copyButton && email) {
    const defaultLabel = copyButton.textContent;
    let resetTimer;

    const flash = (label) => {
      copyButton.textContent = label;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { copyButton.textContent = defaultLabel; }, 1800);
    };

    const selectEmail = () => {
      const range = document.createRange();
      range.selectNodeContents(email);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      flash('Selected');
    };

    copyButton.addEventListener('click', () => {
      const text = email.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => flash('Copied'), selectEmail);
      } else {
        selectEmail();
      }
    });
  }

  /* ---------- 7. Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
