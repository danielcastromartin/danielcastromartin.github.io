(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const WA = 'https://wa.me/34603833919?text=';

  // Edad calculada a partir de la fecha de nacimiento, para que nunca se quede vieja.
  const born = new Date(2006, 11, 22);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
  document.querySelectorAll('[data-age]').forEach((el) => { el.textContent = age; });
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = now.getFullYear(); });

  // Entrada del inicio cuando las letras ya han cargado.
  // Si hay telón (primera visita), el inicio entra justo cuando el telón sube.
  const intro = root.classList.contains('has-intro');
  const start = () => setTimeout(() => requestAnimationFrame(() => root.classList.add('is-loaded')), intro ? 1250 : 0);
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(start);
  } else start();
  if (intro) setTimeout(() => { const c = document.querySelector('.curtain'); if (c) c.remove(); root.classList.remove('has-intro'); }, 2600);

  // Titulares que entran palabra a palabra.
  if (!reduce) {
    document.querySelectorAll('.h2').forEach((h) => {
      let i = 0;
      const wrap = (node) => {
        const w = document.createElement('span'); w.className = 'w';
        const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
        w.appendChild(inner); inner.appendChild(node); return w;
      };
      [...h.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            frag.appendChild(/\s/.test(part) ? document.createTextNode(part) : wrap(document.createTextNode(part)));
          });
          h.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          const ph = document.createComment(''); h.replaceChild(ph, n); h.replaceChild(wrap(n), ph);
        }
      });
      h.classList.add('split');
    });
  }

  // Entradas al bajar.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('is-in'));

  // Cabecera con fondo al bajar, botón flotante oculto en el inicio
  // y el nombre gigante de «Sobre mí» que se desliza con el scroll.
  const top = document.querySelector('[data-top]');
  const giant = document.querySelector('[data-drift]');
  const giantBox = giant ? giant.parentElement : null;
  const bar = document.querySelector('.progress');
  const heroIn = document.querySelector('.hero-in');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (bar) bar.style.setProperty('--p', (y / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4));
    if (heroIn && !reduce) {
      const k = Math.min(1, y / vh);
      heroIn.style.transform = k > 0 ? `translate3d(0, ${(k * vh * 0.28).toFixed(1)}px, 0) scale(${(1 - k * 0.06).toFixed(3)})` : '';
      heroIn.style.opacity = k > 0 ? (1 - k * 1.3).toFixed(3) : '';
    }
    if (top) top.classList.toggle('is-scrolled', y > 40);
    root.classList.toggle('at-top', y < window.innerHeight * 0.6);
    if (giant && giantBox && !reduce) {
      const r = giantBox.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - (r.bottom / (window.innerHeight + r.height))));
      giant.style.setProperty('--drift', (8 - p * 40).toFixed(2) + 'vw');
    }
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Contadores: las cifras suben desde cero cuando aparecen.
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    const fmt = (v, dec) => v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target;
        const raw = el.textContent.trim();
        const dec = raw.includes(',') ? raw.split(',')[1].length : 0;
        const end = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
        const t0 = performance.now();
        const dur = 1600;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = fmt(end * eased, dec);
          if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
        };
        el.textContent = fmt(0, dec);
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  // Efectos con ratón: cursor propio, botones magnéticos, tarjetas que se
  // inclinan con luz, y el fondo del inicio que sigue al puntero.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    // Cursor
    const cur = document.querySelector('.cursor');
    if (cur) {
      root.classList.add('has-cursor');
      let mx = -100, my = -100, cx = -100, cy = -100;
      window.addEventListener('pointermove', (e) => {
        mx = e.clientX; my = e.clientY; cur.classList.remove('is-out');
        const t = e.target;
        const view = t.closest && t.closest('.work-card');
        const hov = t.closest && t.closest('a, button, summary, label, input, textarea, .copy');
        cur.classList.toggle('is-view', !!view);
        cur.classList.toggle('is-hover', !view && !!hov);
        cur.classList.toggle('is-light', !!(t.closest && t.closest('.light')));
      }, { passive: true });
      document.addEventListener('pointerleave', () => cur.classList.add('is-out'));
      window.addEventListener('pointerdown', () => cur.classList.add('is-down'));
      window.addEventListener('pointerup', () => cur.classList.remove('is-down'));
      const loop = () => {
        cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
        cur.style.setProperty('--cx', cx.toFixed(1) + 'px');
        cur.style.setProperty('--cy', cy.toFixed(1) + 'px');
        requestAnimationFrame(loop);
      };
      loop();
    }

    // Botones magnéticos
    document.querySelectorAll('.btn, .pill-btn, .burger, .hero-down, .wa-float, .work-go').forEach((el) => {
      el.classList.add('magnetic');
      const pull = el.classList.contains('work-go') ? 0.18 : 0.3;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * pull;
        const y = (e.clientY - r.top - r.height / 2) * pull;
        el.classList.add('is-pulling');
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('is-pulling'); el.style.translate = ''; });
    });

    // Tarjetas que se inclinan y se iluminan
    const tilt = (el, max, target = el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        target.classList.add('is-tilting');
        target.style.setProperty('--tx', ((px - 0.5) * max).toFixed(2) + 'deg');
        target.style.setProperty('--ty', ((0.5 - py) * max).toFixed(2) + 'deg');
        target.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        target.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        target.classList.remove('is-tilting');
        target.style.setProperty('--tx', '0deg'); target.style.setProperty('--ty', '0deg');
      });
    };
    document.querySelectorAll('.work-card').forEach((c) => { const m = c.querySelector('.work-media'); if (m) tilt(c, 7, m); });
    document.querySelectorAll('.plan').forEach((p) => tilt(p, 0));
    const ap = document.querySelector('.about-photo');
    if (ap) tilt(ap, 12);

    // Inicio: luz y fondo que siguen al puntero
    const reel = document.querySelector('.reel');
    const heroBox = document.querySelector('.hero');
    if (heroBox && reel) {
      heroBox.addEventListener('pointermove', (e) => {
        const r = heroBox.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        heroBox.style.setProperty('--hx', (px * 100).toFixed(1) + '%');
        heroBox.style.setProperty('--hy', (py * 100).toFixed(1) + '%');
        reel.style.setProperty('--rx', ((0.5 - px) * 40).toFixed(1) + 'px');
        reel.style.setProperty('--ry', ((0.5 - py) * 30).toFixed(1) + 'px');
      }, { passive: true });
    }
  }

  // Menú a pantalla completa.
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  if (burger && menu) {
    menu.setAttribute('aria-hidden', 'true');
    const setOpen = (open) => {
      root.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar el menú' : 'Abrir el menú');
      menu.setAttribute('aria-hidden', String(!open));
      if (open) { const first = menu.querySelector('a'); if (first) setTimeout(() => first.focus(), 50); }
    };
    burger.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { setOpen(false); burger.focus(); }
    });
  }

  // Pausar el fondo en movimiento del inicio.
  const hero = document.querySelector('.hero');
  const pause = document.querySelector('.hero-pause');
  if (hero && pause) {
    pause.addEventListener('click', () => {
      const paused = !hero.classList.contains('is-paused');
      hero.classList.toggle('is-paused', paused);
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? 'Reanudar el movimiento del fondo' : 'Pausar el movimiento del fondo');
      pause.querySelector('use').setAttribute('href', paused ? '#i-play-s' : '#i-pause');
    });
  }

  // El vídeo solo se reproduce solo si el visitante no ha pedido menos movimiento.
  const vid = document.querySelector('.yt-main video');
  if (vid && reduce) { vid.removeAttribute('autoplay'); vid.pause(); vid.setAttribute('controls', ''); }

  // Formulario de contacto: abre el correo con el mensaje ya escrito.
  const mailForm = document.querySelector('[data-mail]');
  if (mailForm) {
    mailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(mailForm);
      const nombre = (f.get('nombre') || '').toString().trim();
      const negocio = (f.get('negocio') || '').toString().trim();
      const mensaje = (f.get('mensaje') || '').toString().trim();
      const subject = negocio ? 'Web para ' + negocio : 'Quiero una web';
      const firma = [nombre, negocio].filter(Boolean).join(', ');
      const body = `Hola Daniel,\n\n${mensaje || 'Me gustaría hablar contigo sobre una web.'}\n\n${firma}`;
      window.location.href = 'mailto:danielcastromartin22@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  // Copiar el email.
  document.querySelectorAll('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copiado'; }
      catch { window.location.href = 'mailto:' + b.dataset.copy; return; }
      setTimeout(() => { b.textContent = 'Copiar email'; }, 1800);
    });
  });

  // La prueba en vivo: nombre y tipo de negocio → vista previa y WhatsApp ya escrito.
  const form = document.querySelector('.try');
  const mock = document.querySelector('.mock');
  if (form && mock) {
    const input = form.querySelector('#try-name');
    const name = mock.querySelector('.mock-name');
    const tag = mock.querySelector('.mock-tag');
    const btn = mock.querySelector('.mock-btn');
    const url = mock.querySelector('.mock-url');
    const send = form.querySelector('[data-send]');
    const kinds = {
      barberia: { tag: 'Pide cita desde el móvil en un minuto.', btn: 'Pedir cita', label: 'una peluquería' },
      reformas: { tag: 'Reformas en Écija. Presupuesto sin compromiso.', btn: 'Pedir presupuesto', label: 'una empresa de reformas' },
      tienda: { tag: 'Mira el catálogo y pídelo por WhatsApp.', btn: 'Ver catálogo', label: 'una tienda' },
      bar: { tag: 'Carta, horario y reservas para esta noche.', btn: 'Ver la carta', label: 'un bar' },
    };
    const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 22) || 'tunegocio';
    const render = () => {
      const kind = form.querySelector('input[name="kind"]:checked').value;
      const k = kinds[kind];
      const typed = input.value.trim();
      mock.dataset.kind = kind;
      name.textContent = typed || 'Tu negocio';
      tag.textContent = k.tag;
      btn.textContent = k.btn;
      url.textContent = slug(typed) + '.es';
      const text = `Hola Daniel, tengo ${k.label}${typed ? ' que se llama ' + typed : ''} y me gustaría una web como la que he probado en tu página.`;
      send.href = WA + encodeURIComponent(text);
    };
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();
  }
})();
