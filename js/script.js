const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  // Elements appear when scrolling down and disappear again when scrolling back up.
  // "Below the viewport" (top > 0) means the user scrolled up past the element.
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.intersectionRatio >= .14) entry.target.classList.add('is-visible');
    else if (entry.intersectionRatio === 0 && entry.boundingClientRect.top > 0) entry.target.classList.remove('is-visible');
  }), { threshold: [0, .14], rootMargin: '0px 0px -35px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const typeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    const heading = entry.target;
    const chars = [...heading.querySelectorAll('.type-char')];
    if (entry.intersectionRatio >= .35) {
      // typing in: character by character
      chars.forEach((ch, i) => ch.style.transitionDelay = `${Math.min(i * 24, 850)}ms`);
      heading.classList.add('is-typed');
    } else if (entry.intersectionRatio === 0 && entry.boundingClientRect.top > 0) {
      // typing out: line by line, last line first
      const tops = [...new Set(chars.map(ch => Math.round(ch.getBoundingClientRect().top)))].sort((a, b) => a - b);
      chars.forEach(ch => {
        const line = tops.indexOf(Math.round(ch.getBoundingClientRect().top));
        ch.style.transitionDelay = `${(tops.length - 1 - line) * 140}ms`;
      });
      heading.classList.remove('is-typed');
    }
  }), { threshold: [0, .35] });

  document.querySelectorAll('.type-on-view').forEach(heading => {
    const split = (text, parent) => [...text].forEach(c => {
      const span = document.createElement('span');
      span.className = 'type-char';
      span.textContent = c;
      parent.appendChild(span);
    });
    const nodes = [...heading.childNodes];
    heading.textContent = '';
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) split(node.textContent, heading);
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const wrap = document.createElement(node.tagName.toLowerCase());
        wrap.className = node.className;
        split(node.textContent, wrap);
        heading.appendChild(wrap);
      }
    });
    typeObserver.observe(heading);
  });
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  document.querySelectorAll('.type-on-view').forEach(el => el.classList.add('is-typed'));
}

/* ---------- Forms (contact + developer application) ----------
   Emails are sent with Web3Forms (free, works on any host, including InfinityFree).
   The access key below is public by design (it can only send mail to suchobeast08@gmail.com).
   (If the key is ever replaced by 'PASTE...', the form falls back to FormSubmit.) */
const WEB3FORMS_KEY = '5e6a5981-7ba7-4de5-876f-fa0874c2532c';
const CONTACT_EMAIL = 'suchobeast-studios@gmail.com';

async function sendForm(fields, subject) {
  const hasKey = !WEB3FORMS_KEY.startsWith('PASTE');
  const url = hasKey ? 'https://api.web3forms.com/submit' : `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
  const payload = hasKey
    ? { ...fields, access_key: WEB3FORMS_KEY, subject, from_name: fields.name }
    : { ...fields, _subject: subject, _replyto: fields.email, _template: 'table' };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === 'false' || result.success === false) throw new Error(result.message || 'Send failed');
}

document.querySelectorAll('form[data-ajax]').forEach(form => {
  const note = form.querySelector('.form-note');
  const setNote = (text, cls) => { if (!note) return; note.textContent = text; note.className = 'form-note' + (cls ? ' ' + cls : ''); };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = new FormData(form);
    if (data.get('_honey')) return; // spam bot
    data.delete('_honey');
    const fields = Object.fromEntries(data);
    const subject = `${form.dataset.subject} ${fields.name}`;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setNote('Sending…');
    try {
      await sendForm(fields, subject);
      form.reset();
      setNote(form.dataset.success || 'Message sent.', 'is-ok');
    } catch (error) {
      const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
      setNote('Could not send the message. Opening your email app instead, or write to ' + CONTACT_EMAIL + '.', 'is-error');
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      button.disabled = false;
    }
  });
});

/* ---------- Stats counters ----------
   The numbers are written by hand in index.html (data-count). They count up when they scroll into view
   and reset when scrolled back above, like the other animations. */
const counters = document.querySelectorAll('.count');
if (counters.length) {
  const setValue = (el, n) => { el.textContent = n.toLocaleString('en-US') + (el.dataset.suffix || ''); };
  const finalValue = el => Number(el.dataset.count) || 0;
  const animate = el => {
    const target = finalValue(el);
    cancelAnimationFrame(el._raf);
    if (target === 0) { setValue(el, 0); return; }
    const start = performance.now(), duration = 1800;
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      setValue(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  };
  if (!reduceMotion && 'IntersectionObserver' in window) {
    counters.forEach(el => setValue(el, 0));
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const el = entry.target;
      if (entry.intersectionRatio >= .5 && !el._counted) { el._counted = true; animate(el); }
      else if (entry.intersectionRatio === 0 && entry.boundingClientRect.top > 0 && el._counted) {
        el._counted = false; cancelAnimationFrame(el._raf); setValue(el, 0);
      }
    }), { threshold: [0, .5] });
    counters.forEach(el => counterObserver.observe(el));
  } else counters.forEach(el => setValue(el, finalValue(el)));
}

/* ---------- Projects page: click a card to open its section ---------- */
const projectCards = document.querySelectorAll('.pcard');
if (projectCards.length) {
  const panels = document.querySelectorAll('.pdetail');
  const openProject = (id, scroll = true) => {
    const panel = document.getElementById(id);
    if (!panel || !panel.classList.contains('pdetail')) return;
    projectCards.forEach(c => {
      const on = c.dataset.target === id;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-expanded', String(on));
    });
    panels.forEach(p => {
      const on = p === panel;
      p.hidden = !on;
      p.classList.toggle('is-open', on);
      const video = p.querySelector('video');
      if (video) { if (on) video.play().catch(() => {}); else video.pause(); }
    });
    history.replaceState(null, '', '#' + id);
    if (scroll) panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  projectCards.forEach(card => card.addEventListener('click', () => openProject(card.dataset.target)));
  window.addEventListener('hashchange', () => openProject(location.hash.slice(1)));
  if (location.hash) setTimeout(() => openProject(location.hash.slice(1)), 60);
}

/* ---------- Content sliders (project galleries) ----------
   Automatic: a thin progress bar fills in 5.5s and, when it ends, the next image shows.
   It pauses while the mouse is over it or while it is out of view. */
document.querySelectorAll('.slider').forEach(slider => {
  const slides = [...slider.querySelectorAll('.slide')];
  const counter = slider.querySelector('.sl-count');
  const bar = slider.querySelector('.sl-progress');
  if (slides.length < 2) return;
  let index = 0, hovered = false, inView = true;
  const syncPause = () => slider.classList.toggle('is-paused', hovered || !inView);
  const restartBar = () => {
    if (reduceMotion || !bar) return;
    bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run');
  };
  const show = n => {
    index = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    if (counter) counter.textContent = `${index + 1}/${slides.length}`;
    restartBar();
  };
  if (bar) bar.addEventListener('animationend', () => show(index + 1));
  slider.querySelector('.sl-prev')?.addEventListener('click', () => show(index - 1));
  slider.querySelector('.sl-next')?.addEventListener('click', () => show(index + 1));
  slider.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  slider.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovered = true; syncPause(); } });
  slider.addEventListener('pointerleave', () => { hovered = false; syncPause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncPause(); }, { threshold: .25 }).observe(slider);
  }
  let startX = null;
  slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
  show(0);
});

/* ---------- Portfolio gallery: category filter + lightbox ---------- */
const pfGrid = document.querySelector('.pf-grid[data-gallery]');
if (pfGrid) {
  const items = [...pfGrid.querySelectorAll('.pf-item')];
  const tabs = [...document.querySelectorAll('.pf-tab')];
  const catDesc = document.querySelector('#pf-catdesc');
  const empty = document.querySelector('.pf-empty');
  tabs.forEach(tab => {
    const f = tab.dataset.filter;
    const n = f === 'all' ? items.length : items.filter(i => i.dataset.cat === f).length;
    const badge = tab.querySelector('.pf-count'); if (badge) badge.textContent = n;
  });
  const setFilter = (cat, updateHash = true) => {
    if (!tabs.some(t => t.dataset.filter === cat)) cat = 'all';
    let shown = 0;
    items.forEach(it => { const on = cat === 'all' || it.dataset.cat === cat; it.hidden = !on; if (on) shown++; });
    tabs.forEach(t => { const on = t.dataset.filter === cat; t.classList.toggle('is-active', on); t.setAttribute('aria-pressed', String(on)); if (on && catDesc) catDesc.textContent = t.dataset.desc || ''; });
    if (empty) empty.hidden = shown > 0;
    if (updateHash) history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
  };
  tabs.forEach(t => t.addEventListener('click', () => setFilter(t.dataset.filter)));
  setFilter(tabs.some(t => t.dataset.filter === location.hash.slice(1)) ? location.hash.slice(1) : 'all', false);

  const lb = document.querySelector('#lightbox');
  if (lb) {
    const media = lb.querySelector('.lb-media'), lbTitle = lb.querySelector('h3'), lbDesc = lb.querySelector('.lb-cap p');
    let current = 0, lastFocus = null;
    const visible = () => items.filter(i => !i.hidden);
    const render = () => {
      const it = visible()[current]; if (!it) return;
      const { type, full, title, desc } = it.dataset;
      media.textContent = '';
      let el;
      if (type === 'video') { el = document.createElement('video'); Object.assign(el, { src: full, controls: true, autoplay: true, loop: true, muted: true, playsInline: true }); }
      else { el = document.createElement('img'); el.src = full; el.alt = title || ''; }
      media.appendChild(el);
      lbTitle.textContent = title || ''; lbDesc.textContent = desc || '';
    };
    const open = item => { lastFocus = document.activeElement; current = visible().indexOf(item); lb.hidden = false; document.body.style.overflow = 'hidden'; render(); lb.querySelector('.lb-close').focus(); };
    const close = () => { lb.hidden = true; media.textContent = ''; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    const step = d => { const n = visible().length; current = (current + d + n) % n; render(); };
    items.forEach(it => it.querySelector('.pf-thumb').addEventListener('click', () => open(it)));
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
    lb.querySelector('.lb-next').addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }
}

/* ---------- Portfolio sub-nav: highlight the section being viewed ---------- */
const pfLinks = [...document.querySelectorAll('.pf-nav a[href^="#"]')];
if (pfLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(pfLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const pfObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    pfLinks.forEach(a => a.classList.remove('active'));
    byId.get(entry.target.id)?.classList.add('active');
  }), { rootMargin: '-35% 0px -55% 0px' });
  byId.forEach((a, id) => { const el = document.getElementById(id); if (el) pfObserver.observe(el); });
}

/* ---------- Media kit: click to copy a color / the about text ---------- */
document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const label = btn.tagName === 'BUTTON' && btn.classList.contains('mk-copy') ? btn : btn.querySelector('small');
  const original = label ? label.textContent : '';
  try { await navigator.clipboard.writeText(btn.dataset.copy); if (label) label.textContent = 'Copied!'; }
  catch { if (label) label.textContent = 'Press Ctrl+C'; }
  if (label) setTimeout(() => { label.textContent = original; }, 1400);
}));

/* ---------- Email links: on desktop many browsers have no mail app, so we also copy the address ---------- */
const mailLinks = document.querySelectorAll('a[href^="mailto:"]');
if (mailLinks.length) {
  let toast = null, hideTimer = null;
  const say = msg => {
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(hideTimer); hideTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch { return false; }
  };
  mailLinks.forEach(a => a.addEventListener('click', async () => {
    if (!window.matchMedia('(hover: hover)').matches) return; // phones open their mail app
    const address = a.getAttribute('href').slice(7).split('?')[0];
    if (await copy(address)) say(`Email copied: ${address}`);
  }));
}

/* ---------- Always open pages at the top ----------
   Some browsers restore an old scroll position, or an embedded video player takes focus and
   scrolls the page down (it looked like "Team" opened the contact form). Unless the link has a
   #hash or the visitor already scrolled, force the top for the first few seconds. */
(() => {
  if (location.hash) return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let touched = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => window.addEventListener(t, () => { touched = true; }, { passive: true, once: true }));
  const toTop = () => { if (!touched && window.scrollY > 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
  toTop();
  window.addEventListener('load', toTop);
  [300, 800, 1500, 3000].forEach(ms => setTimeout(toTop, ms));
})();
