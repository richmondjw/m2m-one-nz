/* ============================================================
   MAIN.JS
   Site-wide JavaScript. Single file, organised into clear sections.
   Loaded with `defer` so it runs after the HTML is parsed.

   TABLE OF CONTENTS
 -----------------
      1. Mobile drawer (hamburger)
      2. Mobile drawer accordion sections
      3. Desktop dropdown click toggle for keyboard accessibility
      4. Configurator tabs (legacy; harmless if elements absent)
      5. Scroll progress bar
      6. Back to top
      7. Reveal: assign anim classes via selectors
      8. Stagger groups: assign --anim-delay based on index
      9. Reveal observer
     10. Hero animates immediately on load

   ADDING NEW BEHAVIOUR
 --------------------
 - Look for the most relevant section above and add to it.
 - For a new feature, add a new // --- Section --- block.
 - All DOM access happens inside DOMContentLoaded (already wrapped below).
 - For features that touch many elements, set up an IntersectionObserver
     in the Reveal section to keep DOM passes minimal.

   PERFORMANCE NOTES
 -----------------
 - Heavy mouse-move handlers are throttled via rAF (see Cursor spotlight).
 - Reveal-on-scroll uses IntersectionObserver, not scroll listeners.
 - Hero entrance plays once via setTimeout - does not block paint.
   ============================================================ */

(function() {
  'use strict';

// --- Mobile drawer (hamburger) ---
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navDrawer = document.querySelector('[data-nav-drawer]');
  const closeDrawer = () => {
    navDrawer.classList.remove('is-open');
    navDrawer.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('no-scroll');
  };
  const openDrawer = () => {
    navDrawer.classList.add('is-open');
    navDrawer.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('no-scroll');
  };
  if (navToggle && navDrawer) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      open ? closeDrawer() : openDrawer();
    });
    // Close on link tap inside drawer
    navDrawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => closeDrawer());
    });
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navDrawer.classList.contains('is-open')) closeDrawer();
    });
  }

  // --- Mobile drawer accordion sections ---
  document.querySelectorAll('[data-drawer-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.parentElement.classList.toggle('is-open');
    });
  });

  // --- Desktop mega-menu: hover-with-delay UX pattern ---
  // Open on hover (immediate), close on mouseleave after a 250ms grace period,
  // and cancel the close if the user re-enters either the trigger or the
  // dropdown. Click still toggles for keyboard / touch users.
  (function setupMegaMenu(){
    const items = document.querySelectorAll('.nav-item');
    if (!items.length) return;
    let closeTimer = null;

    function closeAll(){
      items.forEach(i => i.classList.remove('is-open'));
      document.querySelectorAll('.nav-toplevel').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }
    function openItem(item){
      if (closeTimer){ clearTimeout(closeTimer); closeTimer = null; }
      items.forEach(i => { if (i !== item) i.classList.remove('is-open'); });
      document.querySelectorAll('.nav-toplevel').forEach(b => {
        b.setAttribute('aria-expanded', b.parentElement === item ? 'true' : 'false');
      });
      item.classList.add('is-open');
    }
    function scheduleClose(){
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => { closeAll(); closeTimer = null; }, 250);
    }
    function cancelClose(){
      if (closeTimer){ clearTimeout(closeTimer); closeTimer = null; }
    }

    items.forEach(item => {
      // Only items with a dropdown participate; plain links (e.g. Free trial) skip
      const btn = item.querySelector('.nav-toplevel');
      if (!btn) return;
      // Pointer-based open / delayed close, on the WHOLE nav-item (button + dropdown)
      item.addEventListener('mouseenter', () => openItem(item));
      item.addEventListener('mouseleave', scheduleClose);
      // Re-entering the dropdown after a brief mouseleave cancels the close
      const dd = item.querySelector('.dropdown');
      if (dd){
        dd.addEventListener('mouseenter', cancelClose);
      }
      // Click toggles (for keyboard activation and touch)
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const wasOpen = item.classList.contains('is-open');
        closeAll();
        if (!wasOpen) openItem(item);
      });
    });

    // Click outside closes all
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item')) closeAll();
    });
    // Esc closes all
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  })();

  // --- Configurator tabs (legacy; harmless if elements absent) ---
  const tabs = document.querySelectorAll('.config-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    });
  });

  // ============================================================
  // PLAN FINDER : two-question chip selector + recommendation
  // ============================================================
  const finderState = { usecase: 'monitor', size: 'small' };

  const sizeTier = {
    small: 'Standard',
    mid:   'Pool',
    large: 'Scale',
    xl:    'Enterprise'
  };

  const usecaseProfile = {
    monitor: {
      label: 'Monitor',
      desc:  "Reliable connectivity for fleets that check in rather than stream. Pooled data, real-time visibility, ready when you scale.",
      features: [
        'Multi-network coverage across AU & NZ',
        'Real-time monitoring & alerts',
        'IPX failover ready'
      ]
    },
    track: {
      label: 'Track',
      desc:  "Mobile-first connectivity for vehicles and assets on the move, with multi-network failover and bulk activation.",
      features: [
        'Multi-network failover',
        'Real-time location reporting',
        'Bulk SIM activation & APIs'
      ]
    },
    connect: {
      label: 'Connect',
      desc:  "Always-on connectivity for connected devices and cloud workflows. Static IPs, VPN-ready, and resilient by default.",
      features: [
        'Static IP & private APN options',
        'VPN-ready integration',
        'Always-on resilience'
      ]
    },
    critical: {
      label: 'Critical',
      desc:  "Multi-path resilience for mission-critical infrastructure, with active-active failover and Iridium satellite ready.",
      features: [
        'Active-active multi-network failover',
        'Iridium® satellite failover ready',
        'Priority NOC support'
      ]
    }
  };

  // Enterprise-tier addendum: subtly upgrade messaging at scale
  const enterpriseFeatures = {
    Scale:      'Custom data pools & API-first provisioning',
    Enterprise: 'Dedicated NOC & custom contract terms'
  };

  function updateFinderResult() {
    const profile = usecaseProfile[finderState.usecase];
    const tier = sizeTier[finderState.size];
    if (!profile || !tier) return;

    const nameEl = document.querySelector('[data-result="name"]');
    const descEl = document.querySelector('[data-result="desc"]');
    const featEl = document.querySelector('[data-result="features"]');
    const wrap = document.querySelector('.finder-result');
    if (!nameEl || !descEl || !featEl || !wrap) return;

    // Brief fade for the content swap
    wrap.classList.add('is-updating');
    setTimeout(() => {
      // Use a thin space + middle dot + thin space for visual separation
      nameEl.innerHTML = profile.label + ' \u00a0&middot;\u00a0 ' + tier;
      descEl.textContent = profile.desc;

      const features = profile.features.slice();
      if (enterpriseFeatures[tier]) {
        features.splice(2, 1, enterpriseFeatures[tier]);
      }
      featEl.innerHTML = features.map(f => '<li>' + f + '</li>').join('');

      wrap.classList.remove('is-updating');
    }, 180);
  }

  document.querySelectorAll('.finder-chips').forEach(group => {
    const groupName = group.dataset.group;
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.finder-chip');
      if (!chip) return;
      group.querySelectorAll('.finder-chip').forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      if (groupName === 'usecase') finderState.usecase = chip.dataset.case;
      if (groupName === 'size') finderState.size = chip.dataset.size;
      updateFinderResult();
    });
  });

  // --- Scroll progress bar ---
  const progress = document.querySelector('.scroll-progress');
  let ticking = false;
  const updateScroll = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    if (progress) progress.style.setProperty('--scroll', pct + '%');
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });

  // --- Back to top ---
  const btt = document.querySelector('[data-back-to-top]');
  if (btt) {
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) btt.classList.add('is-visible');
      else btt.classList.remove('is-visible');
    }, { passive: true });
  }

  // ============================================================
  // MICROANIMATIONS
  // ============================================================
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Reveal: assign anim classes via selectors ---
  const animTargets = [
    ['.section-header', 'anim-up'],
    ['.solution-copy', 'anim-up'],
    ['.solution-visual', 'anim-up'],
    ['.config-panel', 'anim-scale'],
    ['.compare-table-wrap', 'anim-scale'],
    ['.capabilities-banner h2', 'anim-up'],
    ['.capabilities-banner p', 'anim-up'],
    ['.cta-final h2', 'anim-up'],
    ['.cta-final-btns', 'anim-up'],
    ['.cta-final-note', 'anim-up'],
    ['.cta-final .eyebrow', 'anim-up'],
    ['.why-copy', 'anim-up'],
    ['.industries-cta', 'anim-up'],
    ['.stack-cta', 'anim-up'],
    ['.stack-annotations.left', 'anim-right'],
    ['.stack-annotations.right', 'anim-left'],
    ['.stack-visual', 'anim-scale'],
    ['.hero-copy > *', 'anim-up'],
    ['.hero-visual', 'anim-scale'],
    ['.logo-strip-label', 'anim-up'],
    ['.footer-grid', 'anim-fade'],
  ];
  animTargets.forEach(([selector, cls]) => {
    document.querySelectorAll(selector).forEach(el => el.classList.add(cls));
  });

  // --- Stagger groups: assign --anim-delay based on index ---
  const staggerGroups = [
    ['.services-grid', '.service-card', 80],
    ['.industries-grid', '.industry-tile', 60],
    ['.compliance-grid', '.compliance-badge', 50],
    ['.why-credentials', '.credential-card', 80],
    ['.stats-final-grid', '.stat-cell', 100],
    ['.logo-strip-row', '.logo-item', 80],
    ['.compare-table tbody', 'tr', 50],
    ['.dropdown-grid > div > .dropdown-link', null, 40],
    ['.stack-annotations.left', '.stack-anno', 80],
    ['.stack-annotations.right', '.stack-anno', 80],
  ];
  staggerGroups.forEach(([parentSel, childSel, step]) => {
    try {
      document.querySelectorAll(parentSel).forEach(group => {
        const children = childSel ? group.querySelectorAll(childSel) : [group];
        children.forEach((el, i) => {
          if (!el.classList.contains('anim-up') &&
              !el.classList.contains('anim-scale') &&
              !el.classList.contains('anim-fade') &&
              !el.classList.contains('anim-left') &&
              !el.classList.contains('anim-right')) {
            el.classList.add('anim-up');
          }
          const delay = Math.min(i * step, 600);
          el.style.setProperty('--anim-delay', delay + 'ms');
        });
      });
    } catch (err) {
      console.warn('Stagger group skipped:', parentSel, err.message);
    }
  });

  // --- Reveal observer ---
  if ('IntersectionObserver' in window && !prefersReduced) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.anim-up, .anim-fade, .anim-scale, .anim-left, .anim-right')
      .forEach(el => animObserver.observe(el));
  } else {
    document.querySelectorAll('.anim-up, .anim-fade, .anim-scale, .anim-left, .anim-right')
      .forEach(el => el.classList.add('in'));
  }

  // --- Hero animates immediately on load ---
  const heroAnimEls = document.querySelectorAll('.hero .anim-up, .hero .anim-scale, .hero .anim-fade');
  setTimeout(() => heroAnimEls.forEach(el => el.classList.add('in')), 60);

  // ============================================================
  // COUNT-UP for stats and credentials
  // ============================================================
  function parseStat(text) {
    text = text.trim();
    // "850k" → 850 with 'k' suffix
    if (/^\d+k$/i.test(text)) {
      return { to: parseInt(text), format: (n) => Math.round(n) + 'k' };
    }
    // "99.30" → float, 2 decimals
    if (/^\d+\.\d+$/.test(text)) {
      const decimals = (text.split('.')[1] || '').length;
      return { to: parseFloat(text), format: (n) => n.toFixed(decimals) };
    }
    // "10+", "5+" → int with + suffix
    if (/^\d+\+$/.test(text)) {
      return { to: parseInt(text), format: (n) => Math.round(n) + '+' };
    }
    // Plain "35", "10"
    if (/^\d+$/.test(text)) {
      return { to: parseInt(text), format: (n) => Math.round(n).toString() };
    }
    return null; // Skip non-numeric
  }

  function animateNum(numEl) {
    if (prefersReduced) return;
    // Find the text node holding the leading number
    const textNode = Array.from(numEl.childNodes)
      .find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!textNode) return;
    const parsed = parseStat(textNode.textContent);
    if (!parsed) return;

    const { to, format } = parsed;
    const duration = 1800;
    const start = performance.now();

    textNode.textContent = format(0);

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      textNode.textContent = format(to * eased);
      if (t < 1) requestAnimationFrame(tick);
      else textNode.textContent = format(to);
    }
    requestAnimationFrame(tick);
  }

  // Count-up animation intentionally disabled. Same reasoning as the inline
  // homepage script: the brief "0+" flash before the rAF tick caught
  // mid-animation was unacceptable for a live demo. Static values render
  // correctly and survive SPA-router navigation. parseStat / animateNum
  // retained above for future use.

  // ============================================================
  // CURSOR-TRACKING SPOTLIGHT on .tilt-card
  // ============================================================
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
      let pending = false;
      card.addEventListener('mousemove', (e) => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mx', x + '%');
          card.style.setProperty('--my', y + '%');
          pending = false;
        });
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });

    // ============================================================
    // MAGNETIC PRIMARY BUTTONS
    // ============================================================
    document.querySelectorAll('.btn-primary').forEach(btn => {
      const strength = 0.18;
      const maxShift = 6;
      let pending = false;
      btn.addEventListener('mousemove', (e) => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * strength;
          const dy = (e.clientY - cy) * strength;
          const clamp = (v) => Math.max(-maxShift, Math.min(maxShift, v));
          btn.style.setProperty('--magX', clamp(dx) + 'px');
          btn.style.setProperty('--magY', clamp(dy) + 'px');
          pending = false;
        });
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--magX', '0px');
        btn.style.setProperty('--magY', '0px');
      });
    });

    // ============================================================
    // HERO VISUAL CURSOR SPOTLIGHT
    // ============================================================
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
      let pending = false;
      heroVisual.addEventListener('mousemove', (e) => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          const rect = heroVisual.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          heroVisual.style.setProperty('--spot-x', x + '%');
          heroVisual.style.setProperty('--spot-y', y + '%');
          pending = false;
        });
      });
    }

    // ============================================================
    // PARALLAX ORBS on dark sections (mouse-tracking)
    // ============================================================
    document.querySelectorAll('.hero, .stack, .why, .stats-final, .cta-final').forEach(section => {
      let pending = false;
      section.addEventListener('mousemove', (e) => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          const rect = section.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          section.querySelectorAll('.orb').forEach((orb, i) => {
            const factor = i % 2 === 0 ? 24 : -16;
            const tx = x * factor;
            const ty = y * factor;
            orb.style.transform = `translate(${tx}px, ${ty}px)`;
          });
          pending = false;
        });
      });
      section.addEventListener('mouseleave', () => {
        section.querySelectorAll('.orb').forEach(orb => {
          orb.style.transform = '';
        });
      });
    });
  }

})();
