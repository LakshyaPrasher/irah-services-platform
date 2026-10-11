/**
 * IRAH SERVICES LLP - Master Application Engine
 * Complies with Handover Document & Regulatory Guardrails
 * Institutional Financial Planning, SEBI Investor Education Standard
 */

// Utility: Format currency in Indian notation
function formatINR(val, compact = false) {
  const num = Number.isFinite(Number(val)) ? Math.round(Number(val)) : 0;
  if (compact) {
    if (num >= 9999500) return '₹' + (num / 1e7).toFixed(2) + ' Cr';
    if (num >= 99995) return '₹' + (num / 1e5).toFixed(2) + ' L';
  }
  return '₹' + num.toLocaleString('en-IN');
}

// Security: Basic HTML sanitizer for text rendering
function sanitizeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Modal Accessibility & Keyboard Trap Helper
const ModalA11y = {
  open(m) {
    if (!m) return;
    m._ret = document.activeElement;
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
    const box = m.querySelector('.modal-content-box');
    if (box) box.tabIndex = -1;
    const focusTarget = m.querySelector('.modal-close-btn') || box;
    if (focusTarget) focusTarget.focus();
  },
  close(m) {
    if (!m) return;
    m.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.style.overflow = '';
    }
    if (m._ret && typeof m._ret.focus === 'function') {
      m._ret.focus();
    }
  },
  key(e) {
    const m = document.querySelector('.modal-overlay.active');
    if (!m) return;
    if (e.key === 'Escape') {
      return this.close(m);
    }
    if (e.key !== 'Tab') return;
    const f = [...m.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]')].filter(x => x.offsetParent);
    if (!f.length) return;
    const a = document.activeElement;
    const box = m.querySelector('.modal-content-box');
    if (e.shiftKey && (a === f[0] || a === box)) {
      e.preventDefault();
      f[f.length - 1].focus();
    } else if (!e.shiftKey && a === f[f.length - 1]) {
      e.preventDefault();
      f[0].focus();
    }
  }
};

// Router Implementation
const Router = {
  currentRoute: '#/',
  _routed: false,
  routes: [
    '#/',
    '#/about',
    '#/business-lines',
    '#/financial-services',
    '#/financial-services/mutual-funds',
    '#/financial-services/pms',
    '#/financial-services/aif',
    '#/financial-services/sif',
    '#/financial-services/bonds',
    '#/financial-services/structured-products',
    '#/tourism',
    '#/education',
    '#/insights',
    '#/resources',
    '#/calculators',
    '#/self-assessment',
    '#/self-assessment/calculators',
    '#/knowledge-repository',
    '#/contact',
    '#/investor-charter',
    '#/grievance-redressal',
    '#/risk-disclosures',
    '#/privacy-policy',
    '#/terms-of-use'
  ],

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    // Initial route check
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this.handleRoute();
    }
  },

  handleRoute() {
    let hash = window.location.hash || '#/';
    // Strip trailing slash if present for nested subpages
    if (hash.length > 2 && hash.endsWith('/')) {
      hash = hash.slice(0, -1);
    }
    if (hash === '#/home' || hash === '#' || hash === '') {
      hash = '#/';
    }
    this.currentRoute = hash;

    // Handle in-page anchors within homepage
    let anchorScrollTarget = null;
    let targetId = 'view-home';

    // Dedicated redirection for legacy anchor hashes
    if (hash === '#home-calculators') {
      window.location.hash = '#/calculators';
      return;
    } else if (hash === '#home-contact') {
      window.location.hash = '#/contact';
      return;
    }

    if (hash === '#/') {
      targetId = 'view-home';
    } else if (hash === '#/about') {
      targetId = 'view-about';
    } else if (hash === '#/business-lines') {
      targetId = 'view-business-lines';
    } else if (hash === '#/financial-services' || hash.startsWith('#/financial-services/')) {
      targetId = 'view-financial-services';
      this.handleFinancialProductTab(hash);
    } else if (hash === '#/tourism') {
      targetId = 'view-tourism';
    } else if (hash === '#/education') {
      targetId = 'view-education';
    } else if (hash === '#/insights') {
      targetId = 'view-insights';
    } else if (hash === '#/resources') {
      targetId = 'view-resources';
    } else if (hash === '#/calculators') {
      targetId = 'view-calculators';
    } else if (hash === '#/self-assessment' || hash.startsWith('#/self-assessment/')) {
      targetId = 'view-self-assessment';
      if (hash === '#/self-assessment/calculators') {
        anchorScrollTarget = 'calc-slot-self-assessment';
      }
    } else if (hash === '#/knowledge-repository') {
      targetId = 'view-knowledge-repository';
    } else if (hash === '#/contact') {
      targetId = 'view-contact';
    } else if (hash === '#/investor-charter') {
      targetId = 'view-investor-charter';
    } else if (hash === '#/grievance-redressal') {
      targetId = 'view-grievance-redressal';
    } else if (hash === '#/risk-disclosures' || hash === '#/privacy-policy' || hash === '#/terms-of-use') {
      targetId = 'view-risk-disclosures';
      if (hash === '#/privacy-policy') anchorScrollTarget = 'policy-dpdp';
      if (hash === '#/terms-of-use') anchorScrollTarget = 'policy-terms';
    } else {
      targetId = 'view-home';
      hash = '#/';
      history.replaceState(null, '', '#/');
    }

    // Dynamic Title Management for Authentic Multi-Page Experience
    const pageTitles = {
      'view-home': 'IRAH Services LLP | Holistic Financial & Life Planning Solutions',
      'view-about': 'About Us • Corporate Governance | IRAH Services LLP',
      'view-business-lines': 'Business Lines | IRAH Services LLP',
      'view-financial-services': 'Products Available Through IRAH | IRAH Services LLP',
      'view-tourism': 'Tourism Packages (Coming Soon • Planned Late 2026) | IRAH Services LLP',
      'view-education': 'Financial Education Services | IRAH Services LLP',
      'view-insights': 'Insights & Product Notes | IRAH Services LLP',
      'view-resources': 'Investor Resources & FAQs | IRAH Services LLP',
      'view-calculators': 'Financial Calculators | IRAH Services LLP',
      'view-self-assessment': 'Self-Assessment & Family Financial Diagnostic | IRAH Services LLP',

      'view-knowledge-repository': 'Regulatory Knowledge Repository | IRAH Services LLP',
      'view-contact': 'Contact & Relationship Desks | IRAH Services LLP',
      'view-investor-charter': 'Investor Charter in Respect of Mutual Funds | IRAH Services LLP',
      'view-grievance-redressal': '3-Tier Grievance Redressal Matrix | IRAH Services LLP',
      'view-risk-disclosures': 'Standard Risk Disclosures & DPDP Privacy | IRAH Services LLP'
    };
    if (pageTitles[targetId]) {
      document.title = pageTitles[targetId];
    }

    // Announce route change to screen readers
    const announcer = document.getElementById('route-announcer');
    if (announcer && pageTitles[targetId]) {
      announcer.textContent = pageTitles[targetId];
    }

    // Dynamic slot mounting: Mount Calculators to active view
    this.mountDynamicComponents(targetId);

    // Hide all view containers and activate current view
    const allViews = document.querySelectorAll('.page-view-container');
    allViews.forEach(view => view.classList.remove('active'));

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    // Accessible focus management: move focus to page title
    const h1 = targetEl && targetEl.querySelector('h1');
    if (h1 && this._routed) {
      h1.tabIndex = -1;
      h1.focus({ preventScroll: true });
    }
    this._routed = true;

    // Scroll handling: instant scroll to top on new page load or target anchor
    if (anchorScrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(anchorScrollTarget);
        if (el) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Update active state in nav links
    this.updateActiveNav(hash);
  },

  mountDynamicComponents(targetViewId) {
    // 1. Calculator Suite mounting (Allowed only in Resources and Self-Assessment)
    const calcContainer = document.getElementById('master-calculator-container');
    if (calcContainer) {
      if (targetViewId === 'view-calculators') {
        const dedicatedSlot = document.getElementById('calc-slot-dedicated');
        if (dedicatedSlot && calcContainer.parentElement !== dedicatedSlot) {
          dedicatedSlot.appendChild(calcContainer);
        }
      } else if (targetViewId === 'view-self-assessment') {
        const selfSlot = document.getElementById('calc-slot-self-assessment');
        if (selfSlot && calcContainer.parentElement !== selfSlot) {
          selfSlot.appendChild(calcContainer);
        }
      } else {
        // Park inside calc-slot-dedicated when on home or other pages so home remains completely uncluttered
        const dedicatedSlot = document.getElementById('calc-slot-dedicated');
        if (dedicatedSlot && calcContainer.parentElement !== dedicatedSlot) {
          dedicatedSlot.appendChild(calcContainer);
        }
      }
    }

    // 2. Segmented Lead Form mounting
    const contactContainer = document.getElementById('master-contact-container');
    if (contactContainer) {
      if (targetViewId === 'view-contact') {
        const dedicatedContactSlot = document.getElementById('contact-slot-dedicated');
        if (dedicatedContactSlot && contactContainer.parentElement !== dedicatedContactSlot) {
          dedicatedContactSlot.appendChild(contactContainer);
        }
      } else {
        const dedicatedContactSlot = document.getElementById('contact-slot-dedicated');
        if (dedicatedContactSlot && contactContainer.parentElement !== dedicatedContactSlot) {
          dedicatedContactSlot.appendChild(contactContainer);
        }
      }
    }
  },

  updateActiveNav(hash) {
    const links = document.querySelectorAll('.nav-link, .dropdown-link');
    links.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href === hash || 
        (href !== '#/' && hash.startsWith(href + '/'));
      if (isMatch) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        const parentItem = link.closest('.nav-item');
        const trigger = parentItem && parentItem.querySelector('.dropdown-trigger');
        if (trigger) trigger.classList.add('active');
      }
    });
  },

  handleFinancialProductTab(hash) {
    const subRoute = hash.replace('#/financial-services', '').replace(/^\//, '');
    setTimeout(() => {
      const targetBtn = document.querySelector(`[data-fs-tab="${subRoute}"]`) || document.querySelector('[data-fs-tab="mutual-funds"]');
      if (targetBtn) {
        targetBtn.click();
      }
    }, 20);
  }
};

// Interactive Calculators Engine (SEBI Investor Standard)
const Calculators = {
  init() {
    this.bindTabButtons();
    this.bindSIPInputs();
    this.bindLumpsumInputs();
    this.bindRetirementInputs();
    this.bindDelayInputs();
    this.bindInflationInputs();

    // Initial calculations
    this.calcSIP();
    this.calcLumpsum();
    this.calcRetirement();
    this.calcDelay();
    this.calcInflation();
  },

  bindTabButtons() {
    const tabs = [...document.querySelectorAll('.calc-tab-btn')];
    const select = (btn, focus) => {
      tabs.forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      document.querySelectorAll('.calc-panel').forEach(p => {
        p.classList.toggle('active', p.id === btn.dataset.targetPanel);
      });
      if (focus) btn.focus();
    };

    tabs.forEach((b, i) => {
      b.id = 'tab-' + b.dataset.targetPanel;
      b.setAttribute('aria-controls', b.dataset.targetPanel);
      const panel = document.getElementById(b.dataset.targetPanel);
      if (panel) panel.setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', e => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) {
          e.preventDefault();
          select(tabs[(i + d + tabs.length) % tabs.length], true);
        }
      });
    });

    const activeTab = tabs.find(b => b.classList.contains('active')) || tabs[0];
    if (activeTab) select(activeTab);
  },

  // 1. SIP Calculator
  bindSIPInputs() {
    const sipAmount = document.getElementById('sip-amount');
    const sipAmountNum = document.getElementById('sip-amount-num');
    const sipRate = document.getElementById('sip-rate');
    const sipRateNum = document.getElementById('sip-rate-num');
    const sipYears = document.getElementById('sip-years');
    const sipYearsNum = document.getElementById('sip-years-num');

    if (!sipAmount) return;

    // Range slider updates
    const onRangeInput = () => {
      if (sipAmountNum) sipAmountNum.value = sipAmount.value;
      if (sipRateNum) sipRateNum.value = sipRate.value;
      if (sipYearsNum) sipYearsNum.value = sipYears.value;
      this.updateSIPDisplays();
      this.calcSIP();
    };

    // Number input updates
    const onNumberInput = () => {
      if (sipAmountNum && sipAmount) sipAmount.value = Math.min(500000, Math.max(500, Number(sipAmountNum.value) || 500));
      if (sipRateNum && sipRate) sipRate.value = Math.min(25, Math.max(4, Number(sipRateNum.value) || 4));
      if (sipYearsNum && sipYears) sipYears.value = Math.min(40, Math.max(1, Number(sipYearsNum.value) || 1));
      this.updateSIPDisplays();
      this.calcSIP();
    };

    sipAmount.addEventListener('input', onRangeInput);
    sipRate.addEventListener('input', onRangeInput);
    sipYears.addEventListener('input', onRangeInput);

    if (sipAmountNum) sipAmountNum.addEventListener('input', onNumberInput);
    if (sipRateNum) sipRateNum.addEventListener('input', onNumberInput);
    if (sipYearsNum) sipYearsNum.addEventListener('input', onNumberInput);

    [sipAmountNum, sipRateNum, sipYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },

  updateSIPDisplays() {
    const sipAmount = document.getElementById('sip-amount');
    const sipRate = document.getElementById('sip-rate');
    const sipYears = document.getElementById('sip-years');
    if (sipAmount) document.getElementById('sip-amount-display').textContent = formatINR(sipAmount.value);
    if (sipRate) document.getElementById('sip-rate-display').textContent = sipRate.value + '%';
    if (sipYears) document.getElementById('sip-years-display').textContent = sipYears.value + ' Yr';
  },

  calcSIP() {
    const P = parseFloat(document.getElementById('sip-amount')?.value || 10000);
    const annualR = parseFloat(document.getElementById('sip-rate')?.value || 12);
    const yrs = parseFloat(document.getElementById('sip-years')?.value || 10);

    const n = yrs * 12;
    const i = annualR / 12 / 100;
    
    // FV = P * [ (1+i)^n - 1 ] * (1+i) / i
    const totalInvested = P * n;
    let maturityValue = 0;
    if (i > 0) {
      maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    } else {
      maturityValue = totalInvested;
    }
    const wealthGain = maturityValue - totalInvested;

    // Update DOM
    const totalValEl = document.getElementById('sip-total-value');
    const investedEl = document.getElementById('sip-invested-amount');
    const gainsEl = document.getElementById('sip-wealth-gains');
    const barInvested = document.getElementById('sip-bar-invested');
    const barGains = document.getElementById('sip-bar-gains');

    if (totalValEl) totalValEl.textContent = formatINR(maturityValue);
    if (investedEl) investedEl.textContent = formatINR(totalInvested);
    if (gainsEl) gainsEl.textContent = formatINR(wealthGain);

    if (barInvested && barGains && maturityValue > 0) {
      const invPct = (totalInvested / maturityValue) * 100;
      const gainPct = (wealthGain / maturityValue) * 100;
      barInvested.style.width = `${invPct}%`;
      barGains.style.width = `${gainPct}%`;
    }
  },

  // 2. Lumpsum Wealth Calculator
  bindLumpsumInputs() {
    const lsAmount = document.getElementById('ls-amount');
    const lsAmountNum = document.getElementById('ls-amount-num');
    const lsRate = document.getElementById('ls-rate');
    const lsRateNum = document.getElementById('ls-rate-num');
    const lsYears = document.getElementById('ls-years');
    const lsYearsNum = document.getElementById('ls-years-num');

    if (!lsAmount) return;

    const onRangeInput = () => {
      if (lsAmountNum) lsAmountNum.value = lsAmount.value;
      if (lsRateNum) lsRateNum.value = lsRate.value;
      if (lsYearsNum) lsYearsNum.value = lsYears.value;
      this.updateLumpsumDisplays();
      this.calcLumpsum();
    };

    const onNumberInput = () => {
      if (lsAmountNum && lsAmount) lsAmount.value = Math.min(50000000, Math.max(5000, Number(lsAmountNum.value) || 5000));
      if (lsRateNum && lsRate) lsRate.value = Math.min(25, Math.max(4, Number(lsRateNum.value) || 4));
      if (lsYearsNum && lsYears) lsYears.value = Math.min(40, Math.max(1, Number(lsYearsNum.value) || 1));
      this.updateLumpsumDisplays();
      this.calcLumpsum();
    };

    lsAmount.addEventListener('input', onRangeInput);
    lsRate.addEventListener('input', onRangeInput);
    lsYears.addEventListener('input', onRangeInput);

    if (lsAmountNum) lsAmountNum.addEventListener('input', onNumberInput);
    if (lsRateNum) lsRateNum.addEventListener('input', onNumberInput);
    if (lsYearsNum) lsYearsNum.addEventListener('input', onNumberInput);

    [lsAmountNum, lsRateNum, lsYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },

  updateLumpsumDisplays() {
    const lsAmount = document.getElementById('ls-amount');
    const lsRate = document.getElementById('ls-rate');
    const lsYears = document.getElementById('ls-years');
    if (lsAmount) document.getElementById('ls-amount-display').textContent = formatINR(lsAmount.value);
    if (lsRate) document.getElementById('ls-rate-display').textContent = lsRate.value + '%';
    if (lsYears) document.getElementById('ls-years-display').textContent = lsYears.value + ' Yr';
  },

  calcLumpsum() {
    const P = parseFloat(document.getElementById('ls-amount')?.value || 100000);
    const r = parseFloat(document.getElementById('ls-rate')?.value || 12) / 100;
    const t = parseFloat(document.getElementById('ls-years')?.value || 10);

    // FV = P * (1 + r)^t
    const maturityValue = P * Math.pow(1 + r, t);
    const wealthGain = maturityValue - P;

    const totalValEl = document.getElementById('ls-total-value');
    const investedEl = document.getElementById('ls-invested-amount');
    const gainsEl = document.getElementById('ls-wealth-gains');
    const barInvested = document.getElementById('ls-bar-invested');
    const barGains = document.getElementById('ls-bar-gains');

    if (totalValEl) totalValEl.textContent = formatINR(maturityValue);
    if (investedEl) investedEl.textContent = formatINR(P);
    if (gainsEl) gainsEl.textContent = formatINR(wealthGain);

    if (barInvested && barGains && maturityValue > 0) {
      const invPct = (P / maturityValue) * 100;
      const gainPct = (wealthGain / maturityValue) * 100;
      barInvested.style.width = `${invPct}%`;
      barGains.style.width = `${gainPct}%`;
    }
  },

  // 3. Retirement & Goal Planner
  bindRetirementInputs() {
    const curAge = document.getElementById('ret-cur-age');
    const curAgeNum = document.getElementById('ret-cur-age-num');
    const retAge = document.getElementById('ret-ret-age');
    const retAgeNum = document.getElementById('ret-ret-age-num');
    const curExp = document.getElementById('ret-cur-expense');
    const curExpNum = document.getElementById('ret-cur-expense-num');
    const expInf = document.getElementById('ret-inflation');
    const expInfNum = document.getElementById('ret-inflation-num');

    if (!curAge) return;

    const onRangeInput = () => {
      // Ensure retirement age is strictly greater than current age
      if (retAge && curAge && Number(retAge.value) <= Number(curAge.value)) {
        retAge.value = Number(curAge.value) + 1;
      }
      if (curAgeNum) curAgeNum.value = curAge.value;
      if (retAgeNum && retAge) retAgeNum.value = retAge.value;
      if (curExpNum) curExpNum.value = curExp.value;
      if (expInfNum) expInfNum.value = expInf.value;
      this.updateRetirementDisplays();
      this.calcRetirement();
    };

    const onNumberInput = () => {
      if (curAgeNum && curAge) curAge.value = Math.min(65, Math.max(18, Number(curAgeNum.value) || 18));
      if (retAgeNum && retAge) {
        const minRet = Number(curAge.value) + 1;
        retAge.value = Math.min(75, Math.max(40, Math.max(minRet, Number(retAgeNum.value) || minRet)));
      }
      if (curExpNum && curExp) curExp.value = Math.min(1000000, Math.max(10000, Number(curExpNum.value) || 10000));
      if (expInfNum && expInf) expInf.value = Math.min(12, Math.max(3, Number(expInfNum.value) || 3));
      this.updateRetirementDisplays();
      this.calcRetirement();
    };

    curAge.addEventListener('input', onRangeInput);
    retAge.addEventListener('input', onRangeInput);
    curExp.addEventListener('input', onRangeInput);
    expInf.addEventListener('input', onRangeInput);

    if (curAgeNum) curAgeNum.addEventListener('input', onNumberInput);
    if (retAgeNum) retAgeNum.addEventListener('input', onNumberInput);
    if (curExpNum) curExpNum.addEventListener('input', onNumberInput);
    if (expInfNum) expInfNum.addEventListener('input', onNumberInput);

    [curAgeNum, retAgeNum, curExpNum, expInfNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },

  updateRetirementDisplays() {
    const curAge = document.getElementById('ret-cur-age');
    const retAge = document.getElementById('ret-ret-age');
    const curExp = document.getElementById('ret-cur-expense');
    const expInf = document.getElementById('ret-inflation');
    if (curAge) document.getElementById('ret-cur-age-display').textContent = curAge.value + ' Yrs';
    if (retAge) document.getElementById('ret-ret-age-display').textContent = retAge.value + ' Yrs';
    if (curExp) document.getElementById('ret-cur-expense-display').textContent = formatINR(curExp.value);
    if (expInf) document.getElementById('ret-inflation-display').textContent = expInf.value + '%';
  },

  calcRetirement() {
    const curAge = parseFloat(document.getElementById('ret-cur-age')?.value || 30);
    let retAge = parseFloat(document.getElementById('ret-ret-age')?.value || 60);
    if (retAge <= curAge) {
      retAge = curAge + 1;
      const retAgeSlider = document.getElementById('ret-ret-age');
      if (retAgeSlider) retAgeSlider.value = retAge;
      const retAgeDisplay = document.getElementById('ret-ret-age-display');
      if (retAgeDisplay) retAgeDisplay.textContent = retAge + ' Yrs';
    }
    const curExp = parseFloat(document.getElementById('ret-cur-expense')?.value || 50000);
    const inf = parseFloat(document.getElementById('ret-inflation')?.value || 6) / 100;
    const yearsToRet = Math.max(1, retAge - curAge);
    const lifeExpectancy = 85;
    const yearsInRet = Math.max(1, lifeExpectancy - retAge);

    // Pre-retirement inflation applies to future living cost
    const expenseAtRetirement = curExp * Math.pow(1 + inf, yearsToRet);
    const annualExpenseAtRet = expenseAtRetirement * 12;

    // Post-retirement model per handover spec 5.3: fixed 6% post-retirement inflation, 8% post-retirement return
    const postRetReturn = 0.08;
    const postInf = 0.06;
    const realRate = (postRetReturn - postInf) / (1 + postInf);

    let requiredCorpus = 0;
    if (Math.abs(realRate) > 0.0001) {
      requiredCorpus = annualExpenseAtRet * ((1 - Math.pow(1 + realRate, -yearsInRet)) / realRate);
    } else {
      requiredCorpus = annualExpenseAtRet * yearsInRet;
    }

    // Required monthly SIP today at illustrative 12% return to accumulate target corpus
    const sipReturn = 0.12 / 12;
    const n = yearsToRet * 12;
    let requiredSIP = 0;
    if (n > 0 && sipReturn > 0) {
      requiredSIP = (requiredCorpus * sipReturn) / ((Math.pow(1 + sipReturn, n) - 1) * (1 + sipReturn));
    }

    const corpusEl = document.getElementById('ret-required-corpus');
    const sipReqEl = document.getElementById('ret-required-sip');
    const futureExpEl = document.getElementById('ret-future-expense');

    if (corpusEl) corpusEl.textContent = formatINR(requiredCorpus, true);
    if (sipReqEl) sipReqEl.textContent = formatINR(requiredSIP);
    if (futureExpEl) futureExpEl.textContent = formatINR(expenseAtRetirement) + ' / mo';
  },

  // 4. Cost of Delay Calculator
  bindDelayInputs() {
    const delayAmt = document.getElementById('delay-amount');
    const delayAmtNum = document.getElementById('delay-amount-num');
    const delayYrs = document.getElementById('delay-years');
    const delayYrsNum = document.getElementById('delay-years-num');
    const delayRate = document.getElementById('delay-rate');
    const delayRateNum = document.getElementById('delay-rate-num');

    if (!delayAmt) return;

    const onRangeInput = () => {
      if (delayAmtNum) delayAmtNum.value = delayAmt.value;
      if (delayYrsNum) delayYrsNum.value = delayYrs.value;
      if (delayRateNum) delayRateNum.value = delayRate.value;
      this.updateDelayDisplays();
      this.calcDelay();
    };

    const onNumberInput = () => {
      if (delayAmtNum && delayAmt) delayAmt.value = Math.min(200000, Math.max(1000, Number(delayAmtNum.value) || 1000));
      if (delayYrsNum && delayYrs) delayYrs.value = Math.min(10, Math.max(1, Number(delayYrsNum.value) || 1));
      if (delayRateNum && delayRate) delayRate.value = Math.min(16, Math.max(8, Number(delayRateNum.value) || 8));
      this.updateDelayDisplays();
      this.calcDelay();
    };

    delayAmt.addEventListener('input', onRangeInput);
    delayYrs.addEventListener('input', onRangeInput);
    delayRate.addEventListener('input', onRangeInput);

    if (delayAmtNum) delayAmtNum.addEventListener('input', onNumberInput);
    if (delayYrsNum) delayYrsNum.addEventListener('input', onNumberInput);
    if (delayRateNum) delayRateNum.addEventListener('input', onNumberInput);

    [delayAmtNum, delayYrsNum, delayRateNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },

  updateDelayDisplays() {
    const delayAmt = document.getElementById('delay-amount');
    const delayYrs = document.getElementById('delay-years');
    const delayRate = document.getElementById('delay-rate');
    if (delayAmt) document.getElementById('delay-amount-display').textContent = formatINR(delayAmt.value);
    if (delayYrs) document.getElementById('delay-years-display').textContent = delayYrs.value + ' Yr Delay';
    if (delayRate) document.getElementById('delay-rate-display').textContent = delayRate.value + '%';
  },

  calcDelay() {
    const P = parseFloat(document.getElementById('delay-amount')?.value || 15000);
    const delayYears = parseFloat(document.getElementById('delay-years')?.value || 3);
    const annualR = parseFloat(document.getElementById('delay-rate')?.value || 12);
    const totalHorizon = 25; // 25 years total horizon

    const i = annualR / 12 / 100;

    // If start today: horizon is 25 years
    const nNow = totalHorizon * 12;
    const fvNow = P * ((Math.pow(1 + i, nNow) - 1) / i) * (1 + i);

    // If delayed: horizon is (25 - delayYears)
    const nDelayed = Math.max(0, (totalHorizon - delayYears) * 12);
    const fvDelayed = nDelayed > 0 ? P * ((Math.pow(1 + i, nDelayed) - 1) / i) * (1 + i) : 0;

    const costOfDelay = Math.max(0, fvNow - fvDelayed);

    const fvNowEl = document.getElementById('delay-fv-now');
    const fvDelayEl = document.getElementById('delay-fv-delayed');
    const costEl = document.getElementById('delay-cost-lost');

    if (fvNowEl) fvNowEl.textContent = formatINR(fvNow, true);
    if (fvDelayEl) fvDelayEl.textContent = formatINR(fvDelayed, true);
    if (costEl) costEl.textContent = formatINR(costOfDelay, true);
  },

  // 5. Inflation Impact Calculator
  bindInflationInputs() {
    const infPresent = document.getElementById('inf-present-cost');
    const infPresentNum = document.getElementById('inf-present-cost-num');
    const infRate = document.getElementById('inf-rate');
    const infRateNum = document.getElementById('inf-rate-num');
    const infYears = document.getElementById('inf-years');
    const infYearsNum = document.getElementById('inf-years-num');

    if (!infPresent) return;

    const onRangeInput = () => {
      if (infPresentNum) infPresentNum.value = infPresent.value;
      if (infRateNum) infRateNum.value = infRate.value;
      if (infYearsNum) infYearsNum.value = infYears.value;
      this.updateInflationDisplays();
      this.calcInflation();
    };

    const onNumberInput = () => {
      if (infPresentNum && infPresent) infPresent.value = Math.min(20000000, Math.max(100000, Number(infPresentNum.value) || 100000));
      if (infRateNum && infRate) infRate.value = Math.min(12, Math.max(3, Number(infRateNum.value) || 3));
      if (infYearsNum && infYears) infYears.value = Math.min(30, Math.max(1, Number(infYearsNum.value) || 1));
      this.updateInflationDisplays();
      this.calcInflation();
    };

    infPresent.addEventListener('input', onRangeInput);
    infRate.addEventListener('input', onRangeInput);
    infYears.addEventListener('input', onRangeInput);

    if (infPresentNum) infPresentNum.addEventListener('input', onNumberInput);
    if (infRateNum) infRateNum.addEventListener('input', onNumberInput);
    if (infYearsNum) infYearsNum.addEventListener('input', onNumberInput);

    [infPresentNum, infRateNum, infYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },

  updateInflationDisplays() {
    const infPresent = document.getElementById('inf-present-cost');
    const infRate = document.getElementById('inf-rate');
    const infYears = document.getElementById('inf-years');
    if (infPresent) document.getElementById('inf-present-cost-display').textContent = formatINR(infPresent.value);
    if (infRate) document.getElementById('inf-rate-display').textContent = infRate.value + '%';
    if (infYears) document.getElementById('inf-years-display').textContent = infYears.value + ' Yrs';
  },

  calcInflation() {
    const present = parseFloat(document.getElementById('inf-present-cost')?.value || 2500000);
    const r = parseFloat(document.getElementById('inf-rate')?.value || 6) / 100;
    const t = parseFloat(document.getElementById('inf-years')?.value || 15);

    const futureCost = present * Math.pow(1 + r, t);
    const costIncrease = futureCost - present;

    const futureEl = document.getElementById('inf-future-cost');
    const increaseEl = document.getElementById('inf-cost-increase');

    if (futureEl) futureEl.textContent = formatINR(futureCost, true);
    if (increaseEl) increaseEl.textContent = '+' + formatINR(costIncrease, true);
  }
};

// Financial Services Product Subpage Tabs
const FinancialProducts = {
  init() {
    const tabs = document.querySelectorAll('.fs-product-nav-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', t === btn ? 'true' : 'false');
        });
        btn.classList.add('active');

        const tabKey = btn.getAttribute('data-fs-tab');
        document.querySelectorAll('.fs-product-panel').forEach(panel => {
          panel.classList.remove('active');
          panel.style.display = 'none';
        });

        const targetPanel = document.getElementById(`fs-panel-${tabKey}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
          targetPanel.style.display = 'block';
        }

        if (window.location.hash.startsWith('#/financial-services')) {
          const newHash = '#/financial-services' + (tabKey === 'mutual-funds' ? '' : '/' + tabKey);
          history.replaceState(null, '', newHash);
        }
      });
    });
  }
};

// Lead Generation & Segmented Inquiry Form
const ContactForm = {
  busy: false,

  init() {
    const form = document.getElementById('lead-inquiry-form');
    if (!form) return;

    const interestSelect = document.getElementById('inquiry-vertical');
    const investmentFields = document.getElementById('conditional-investment-fields');
    const travelFields = document.getElementById('conditional-travel-fields');
    const educationFields = document.getElementById('conditional-education-fields');

    if (interestSelect) {
      interestSelect.addEventListener('change', () => {
        const val = interestSelect.value;
        if (investmentFields) investmentFields.style.display = (val === 'investments') ? 'block' : 'none';
        if (travelFields) travelFields.style.display = (val === 'tourism') ? 'block' : 'none';
        if (educationFields) educationFields.style.display = (val === 'education') ? 'block' : 'none';
      });
    }

    ['form-phone', 'form-email', 'form-name', 'form-consent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => el.setCustomValidity(''));
    });

    form.addEventListener('submit', (e) => this.handleSubmit(e));
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    if (this.busy) return;

    const nameEl = document.getElementById('form-name');
    const emailEl = document.getElementById('form-email');
    const phoneEl = document.getElementById('form-phone');
    const consentEl = document.getElementById('form-consent');

    const name = nameEl?.value.trim() || '';
    const email = emailEl?.value.trim() || '';
    const phone = phoneEl?.value.trim() || '';
    const vertical = document.getElementById('inquiry-vertical')?.value || 'investments';
    const message = document.getElementById('form-message')?.value.trim() || '';
    const travelWindow = document.getElementById('form-travel-window')?.value.trim() || 'N/A';

    // Validation using standard regex and custom validity
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailEl) {
      emailEl.setCustomValidity(emailRegex.test(email) ? '' : 'Enter a valid email address.');
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    const m = phone.replace(/[\s().-]/g, '').match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
    if (phoneEl) {
      phoneEl.setCustomValidity(m ? '' : 'Enter a valid 10-digit Indian mobile number starting with 6-9.');
    }

    if (consentEl && !consentEl.checked) {
      consentEl.setCustomValidity('Please accept the consent terms to proceed.');
    } else if (consentEl) {
      consentEl.setCustomValidity('');
    }

    if (!form.reportValidity()) return;

    const cleanPhone = m ? m[1] : phone.replace(/[\s\-\+]/g, '').slice(-10);
    this.busy = true;
    if (submitBtn) submitBtn.disabled = true;

    // High-entropy fallback ID
    const fallbackId = `IRAH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Collect submission payload
    const payload = {
      name: name,
      email: email,
      phone: cleanPhone,
      vertical: vertical,
      investmentInterest: vertical === 'investments' ? (document.getElementById('form-investment-type')?.value || 'N/A') : 'N/A',
      investmentBracket: vertical === 'investments' ? (document.getElementById('form-investment-bracket')?.value || 'N/A') : 'N/A',
      travelDestination: vertical === 'tourism' ? (document.getElementById('form-travel-dest')?.value || 'N/A') : 'N/A',
      travelWindow: vertical === 'tourism' ? travelWindow : 'N/A',
      educationTopic: vertical === 'education' ? (document.getElementById('form-edu-topic')?.value || 'N/A') : 'N/A',
      message: message,
      consent: {
        given: true,
        notice_version: '2026-10',
        at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    let delivered = false;
    let assignedId = fallbackId;

    // POST to local server API
    try {
      const resp = await fetch('/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.reference_id) {
          assignedId = data.reference_id;
          delivered = true;
        }
      }
    } catch (err) {
      // Offline fallback: graceful client handling
    } finally {
      this.busy = false;
      if (submitBtn) submitBtn.disabled = false;
    }

    payload.reference_id = assignedId;
    payload.delivered = delivered;

    if (delivered) {
      // Reset form upon verified delivery
      form.reset();
      const interestSelect = document.getElementById('inquiry-vertical');
      if (interestSelect) {
        interestSelect.dispatchEvent(new Event('change'));
      }
    } else {
      // Offline queue: store in LocalStorage (capped at 5)
      try {
        const existing = JSON.parse(localStorage.getItem('irah_inquiries') || '[]');
        existing.push(payload);
        while (existing.length > 5) existing.shift();
        localStorage.setItem('irah_inquiries', JSON.stringify(existing));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
    }

    // Show Confirmation Modal
    this.openReceiptModal(payload, delivered);
  },

  openReceiptModal(data, delivered = false) {
    const modal = document.getElementById('inquiry-success-modal');
    const titleEl = document.getElementById('receipt-modal-title');
    const msgEl = document.getElementById('receipt-modal-msg');
    const statusEl = document.getElementById('receipt-modal-status');
    const detailsContainer = document.getElementById('receipt-details');

    if (titleEl) {
      titleEl.textContent = delivered ? 'Inquiry Received' : 'Saved on This Device Only';
    }
    if (msgEl) {
      msgEl.textContent = delivered
        ? 'Thank you for contacting IRAH Services LLP. Your inquiry has been routed to our specialized relationship desk.'
        : 'We could not reach our server, so this inquiry has not been sent. It is saved on this device only. Please email harikant.irah@gmail.com or call +91 9779776119 quoting the reference below.';
    }
    if (statusEl) {
      statusEl.className = 'receipt-status ' + (delivered ? 'receipt-status--delivered' : 'receipt-status--local');
      statusEl.textContent = delivered ? 'Status: Delivered to IRAH desk' : 'Status: Saved locally only (not transmitted to server)';
    }

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div style="background: var(--slate-50); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--slate-200); font-size: 0.875rem;">
          <p><strong>Reference ID:</strong> <span id="receipt-ref" style="color:var(--gold-700); font-weight:700;">${data.reference_id || 'IRAH-LOGGED'}</span></p>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Contact:</strong> ${data.email} | +91 ${data.phone}</p>
          <p><strong>Inquiry Track:</strong> ${data.vertical.toUpperCase()}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
        </div>
      `;
    }
    if (modal) ModalA11y.open(modal);
  },

  showToast(message, type = 'info') {
    let toast = document.getElementById('live-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'live-toast';
      toast.className = 'toast-msg';
      toast.setAttribute('role', 'alert');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast-msg show ${type}`;
    if (this._t) clearTimeout(this._t);
    this._t = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
};

// Knowledge Repository Search & Filter
const KnowledgeRepository = {
  init() {
    const searchInput = document.getElementById('reg-search-input');
    const filterPills = document.querySelectorAll('.reg-filter-pill');
    const emptyMsg = document.getElementById('repo-empty');

    if (!searchInput) return;

    let activeFilter = 'all';

    const filterCards = () => {
      const term = searchInput.value.toLowerCase().trim();
      const cards = document.querySelectorAll('#view-knowledge-repository .reg-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        const text = card.textContent.toLowerCase();

        const matchesCat = activeFilter === 'all' || category === activeFilter;
        const matchesTerm = !term || text.includes(term);

        if (matchesCat && matchesTerm) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (emptyMsg) {
        emptyMsg.hidden = visibleCount > 0;
      }
    };

    searchInput.addEventListener('input', filterCards);

    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        activeFilter = pill.getAttribute('data-filter') || 'all';
        filterCards();
      });
    });
  }
};

// Insights Article Modal Viewer
const InsightsViewer = {
  articles: {
    'asset-allocation-2026': {
      title: 'Asset Allocation Concepts: A Plain-Language Primer',
      category: 'Investor Education',
      readTime: '2 min read',
      body: `
        <p>Asset allocation means dividing money across asset classes such as equity, debt and gold. Investor-education material from SEBI and AMFI describes it as a major driver of a portfolio's risk profile. How much to hold in each class depends on an individual's goals, horizon and tax position and is a matter for the investor, or for a SEBI-registered Investment Adviser if personalised advice is wanted.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--navy-900);">Core-Satellite, Described Neutrally</h4>
        <p>Some investors hold a diversified core and a smaller set of concentrated holdings. This increases complexity, cost and liquidity risk, and does not assure higher returns.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--navy-900);">Managing Liquidity and Risk</h4>
        <p>Balancing liquidity reserves across liquid funds and fixed income instruments helps manage cash flow requirements during market drawdowns without forced liquidation of equity assets.</p>
        <div style="background: var(--navy-50); padding: 1rem; border-left: 4px solid var(--navy-900); margin-top: 1.5rem; font-size: 0.85rem;">
          <strong>Distributor Notice:</strong> IRAH Services LLP acts solely as a mutual fund distributor and referral intermediary. All scheme documents and risk disclosures must be thoroughly evaluated before allocation. Informational note · Reviewed Oct 2026.
        </div>
      `
    },
    'pms-vs-aif-demystified': {
      title: 'PMS and AIF: Structural Nuances for HNI Investors',
      category: 'Product Information',
      readTime: '2 min read',
      body: `
        <p>Portfolio Management Services (PMS) and Alternative Investment Funds (AIF) are specialized high-ticket investment vehicles regulated under distinct SEBI frameworks. Understanding their structural and tax nuances is essential before making any allocation decision.</p>
        <div class="data-table-wrap table-scroll" tabindex="0" role="region" aria-label="PMS vs AIF Comparison">
          <table class="data-table" style="margin: 0.5rem 0;">
            <thead>
              <tr><th scope="col">Attribute</th><th scope="col">Portfolio Management Services (PMS)</th><th scope="col">Alternative Investment Funds (AIF)</th></tr>
            </thead>
            <tbody>
              <tr><td>Minimum Ticket</td><td>₹50 Lakhs (SEBI Mandated)</td><td>₹1.00 Crore (Cat I, II, III; SEBI exceptions apply)</td></tr>
              <tr><td>Holding Structure</td><td>Held directly in investor Demat account</td><td>Pooled vehicle (Trust / LLP / Company)</td></tr>
              <tr><td>Tax Treatment</td><td>Investor taxed on own capital gains per trade (securities held in investor name)</td><td>Pass-through for Cat I/II; Fund level for Cat III</td></tr>
              <tr><td>Derivatives Usage</td><td>Hedging and portfolio rebalancing only</td><td>Permitted per strategy SID / PPM within regulatory limits</td></tr>
            </tbody>
          </table>
        </div>
        <p style="margin-top: 1rem;">IRAH Services LLP facilitates client access to SEBI-registered portfolio managers and Category I, II and III AIF managers. Choosing a product is the investor's own decision after reading its disclosure document or PPM. Informational note · Reviewed Oct 2026.</p>
      `
    },
    'fixed-income-yield-curve': {
      title: 'Fixed Income Instruments & Section 54EC Capital Gains Bonds',
      category: 'Capital Preservation',
      readTime: '2 min read',
      body: `
        <p>Fixed income instruments provide portfolio ballast and periodic cash flows. Yields, credit risk and tax implications vary substantially across categories.</p>
        <h4 style="margin: 1.25rem 0 0.5rem; color: var(--navy-900);">Regulated Fixed Income Building Blocks:</h4>
        <ul style="padding-left: 1.5rem; margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.8;">
          <li><strong>Section 54EC Capital Gains Bonds:</strong> Section 54EC allows exemption of long-term capital gains on land or building if invested in specified bonds within 6 months of transfer, up to ₹50 Lakhs across the year of transfer and the next, with a 5-year lock-in. Issued by named public sector entities (REC, PFC, IRFC, NHAI; not sovereign-guaranteed).</li>
          <li><strong>Rated Corporate Non-Convertible Debentures (NCDs):</strong> Coupon schedules as set by the issuer; credit risk applies. Issued by corporates and NBFCs rated by SEBI-registered credit rating agencies.</li>
          <li><strong>Sovereign Gold Bonds (SGB):</strong> Government of India securities issued by RBI. No new tranches have been issued since February 2024; existing series trade on stock exchanges at market prices.</li>
        </ul>
        <p style="font-size:0.85rem; color:var(--slate-500);">Informational note · Reviewed Oct 2026.</p>
      `
    },
    'tourism-preview-luxury': {
      title: 'IRAH Travel Vertical: Planning & Logistics Preview',
      category: 'Tourism Preview',
      readTime: '2 min read',
      body: `
        <p>Tourism Packages represents IRAH Services LLP’s upcoming travel division, planned for late 2026, subject to change. Built around the ethos <em>"Discover More. Travel Better,"</em> our travel vertical focuses on structured itinerary coordination and corporate retreat logistics.</p>
        <p>Itineraries are in planning and none is bookable yet. From European regional circuits and Swiss rail routes to heritage domestic circuits in Rajasthan and corporate offsites, routes will be coordinated with vetted hospitality partners.</p>
        <p>No bookings, reservations or payments are accepted at this stage. Joining the waitlist records your interest only. Planned for late 2026, subject to change.</p>
      `
    }
  },

  init() {
    const modal = document.getElementById('insight-modal');
    const closeBtn = document.getElementById('close-insight-modal');

    document.querySelectorAll('[data-insight-id]').forEach(card => {
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      const open = () => this.openArticle(card.getAttribute('data-insight-id'));
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => ModalA11y.close(modal));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) ModalA11y.close(modal);
      });
    }

    // Modal close for inquiry receipt modal
    const receiptModal = document.getElementById('inquiry-success-modal');
    const closeReceipt = document.getElementById('close-receipt-modal');
    const receiptAckBtn = document.getElementById('receipt-ack-btn') || document.getElementById('receipt-close-btn');

    if (closeReceipt && receiptModal) {
      closeReceipt.addEventListener('click', () => ModalA11y.close(receiptModal));
    }
    if (receiptAckBtn && receiptModal) {
      receiptAckBtn.addEventListener('click', () => ModalA11y.close(receiptModal));
    }
    if (receiptModal) {
      receiptModal.addEventListener('click', (e) => {
        if (e.target === receiptModal) ModalA11y.close(receiptModal);
      });
    }

    // WCAG keyboard support: Close active modal on Escape key and trap Tab
    window.addEventListener('keydown', (e) => {
      ModalA11y.key(e);
    });

    // Copy reference button handling
    document.getElementById('copy-ref-btn')?.addEventListener('click', async () => {
      const ref = document.getElementById('receipt-ref')?.textContent.trim() || '';
      try {
        await navigator.clipboard.writeText(ref);
      } catch (_) {
        const t = document.createElement('textarea');
        t.value = ref;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        t.remove();
      }
      const status = document.getElementById('copy-ref-status');
      if (status) status.textContent = 'Reference copied';
      const btn = document.getElementById('copy-ref-btn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    });
  },

  openArticle(id) {
    const article = this.articles[id];
    if (!article) return;

    const modal = document.getElementById('insight-modal');
    const titleEl = document.getElementById('insight-modal-title');
    const metaEl = document.getElementById('insight-modal-meta');
    const bodyEl = document.getElementById('insight-modal-body');

    if (titleEl) titleEl.textContent = article.title;
    if (metaEl) metaEl.innerHTML = `<span class="badge badge-navy">${article.category}</span> <span>•</span> <span>${article.readTime}</span>`;
    if (bodyEl) bodyEl.innerHTML = article.body;

    if (modal) ModalA11y.open(modal);
  }
};

// Mobile Navigation Toggle
const MobileNav = {
  init() {
    const toggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav-menu');
    if (!toggle || !nav) return;

    const mq = window.matchMedia('(max-width: 960px)');
    const closeMenu = (focusToggle = false) => {
      nav.classList.remove('mobile-open');
      toggle.innerHTML = '&#9776;';
      toggle.setAttribute('aria-expanded', 'false');
      nav.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('dropdown-open');
        const trig = item.querySelector('.dropdown-trigger');
        if (trig) trig.setAttribute('aria-expanded', 'false');
      });
      if (focusToggle) toggle.focus();
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle('mobile-open');
      toggle.innerHTML = isOpen ? '&times;' : '&#9776;';
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when clicking nav link, except when expanding submenus on mobile
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', e => {
        if (link.classList.contains('dropdown-trigger') && mq.matches) {
          e.preventDefault();
          const parentItem = link.closest('.nav-item');
          if (parentItem) {
            const isOpen = parentItem.classList.toggle('dropdown-open');
            link.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          }
          return;
        }
        closeMenu(false);
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
        closeMenu(true);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu(false);
      }
    });
  }
};

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Wire up skip link
  document.getElementById('skip-link')?.addEventListener('click', () => {
    const h = document.querySelector('.page-view-container.active h1');
    if (h) {
      h.tabIndex = -1;
      h.focus();
    }
  });

  // Wire up vertical prefill links
  document.querySelectorAll('[data-prefill-vertical]').forEach(a => {
    a.addEventListener('click', () => {
      requestAnimationFrame(() => {
        const s = document.getElementById('inquiry-vertical');
        if (s) {
          s.value = a.dataset.prefillVertical;
          s.dispatchEvent(new Event('change'));
        }
      });
    });
  });

  Router.init();
  Calculators.init();
  initSelfAssessment();
  FinancialProducts.init();
  ContactForm.init();
  KnowledgeRepository.init();
  InsightsViewer.init();
  MobileNav.init();
});

// =========================================================================
// 3-STAGE FINANCIAL HEALTH & FINANCIAL RISK ASSESSMENT ENGINE
// =========================================================================
const ASSESSMENT_ENGINE_DATA = {
  "client_profile_schema": [
    {
      "id": "client_name",
      "label": "Client Name",
      "type": "text",
      "placeholder": "e.g., Rajesh Sharma",
      "required": true
    },
    {
      "id": "assessment_date",
      "label": "Assessment Date",
      "type": "date",
      "required": true
    },
    {
      "id": "age",
      "label": "Age",
      "type": "select",
      "options": [
        "Under 25",
        "25 \u2013 35",
        "36 \u2013 45",
        "46 \u2013 55",
        "56 \u2013 65",
        "65+"
      ],
      "default": "36 \u2013 45"
    },
    {
      "id": "family_size",
      "label": "Family Size",
      "type": "select",
      "options": [
        "1 (Self)",
        "2 Members",
        "3 Members",
        "4 Members",
        "5 Members",
        "6+ Members"
      ],
      "default": "4 Members"
    },
    {
      "id": "dependents_count",
      "label": "Number of Dependents",
      "type": "select",
      "options": [
        "0 (None)",
        "1 Dependent",
        "2 Dependents",
        "3 Dependents",
        "4+ Dependents"
      ],
      "default": "2 Dependents"
    },
    {
      "id": "work_status",
      "label": "Employment / Work Status",
      "type": "select",
      "options": [
        "Salaried - Private Sector",
        "Salaried - Public / Govt Sector",
        "Business Owner / Entrepreneur",
        "Professional (Doctor, CA, Lawyer, Architect)",
        "Self-Employed / Independent Consultant",
        "Retired",
        "Homemaker",
        "Student"
      ],
      "default": "Salaried - Private Sector"
    },
    {
      "id": "income_source",
      "label": "Primary Income Source",
      "type": "select",
      "options": [
        "Salary / Employment Compensation",
        "Business Profits & Corporate Dividends",
        "Professional Practice Consulting Fees",
        "Investment Returns & Rental Yields",
        "Pension & Annuity Inflows",
        "Family Inheritance & Multiple Inflows"
      ],
      "default": "Salary / Employment Compensation"
    },
    {
      "id": "annual_income",
      "label": "Approx. Annual Income",
      "type": "select",
      "options": [
        "Below \u20b910 Lakhs",
        "\u20b910 Lakhs \u2013 \u20b925 Lakhs",
        "\u20b925 Lakhs \u2013 \u20b950 Lakhs",
        "\u20b950 Lakhs \u2013 \u20b91.00 Crore",
        "\u20b91.00 Crore \u2013 \u20b92.50 Crores",
        "Above \u20b92.50 Crores"
      ],
      "default": "\u20b925 Lakhs \u2013 \u20b950 Lakhs"
    },
    {
      "id": "financial_goal",
      "label": "Main Financial Goal",
      "type": "select",
      "options": [
        "Wealth Creation & Long-Term Compounding",
        "Retirement & Financial Independence (FIRE)",
        "Children's Higher Education & Marriage",
        "Capital Preservation & Downside Protection",
        "Real Estate & Family Home Acquisition",
        "Legacy Creation & Intergenerational Transition"
      ],
      "default": "Wealth Creation & Long-Term Compounding"
    }
  ],
  "financial_health": {
    "title": "Financial Health Check",
    "description": "Measures stability, cash-flow resilience, savings discipline, and asset growth capacity.",
    "categories": [
      {
        "id": "health_personal",
        "name": "Personal Financial Profile",
        "weight": 0.1,
        "questions": [
          {
            "id": "h_q1",
            "text": "Employment status",
            "why": "How secure is your current work or income situation?",
            "options": [
              {
                "label": "No current income",
                "score": 1
              },
              {
                "label": "Uncertain / irregular",
                "score": 2
              },
              {
                "label": "Somewhat stable",
                "score": 3
              },
              {
                "label": "Stable",
                "score": 4
              },
              {
                "label": "Very stable",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q2",
            "text": "Family size",
            "why": "How many people depend on the household income?",
            "options": [
              {
                "label": "Very high responsibility",
                "score": 1
              },
              {
                "label": "High responsibility",
                "score": 2
              },
              {
                "label": "Moderate responsibility",
                "score": 3
              },
              {
                "label": "Low responsibility",
                "score": 4
              },
              {
                "label": "Very low responsibility",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q3",
            "text": "Number of dependents",
            "why": "How manageable are your dependent-related financial commitments?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable with pressure",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q4",
            "text": "Financial goals defined",
            "why": "How clearly have you defined your major financial goals?",
            "options": [
              {
                "label": "No clear goals",
                "score": 1
              },
              {
                "label": "A few ideas only",
                "score": 2
              },
              {
                "label": "Some goals defined",
                "score": 3
              },
              {
                "label": "Most goals defined",
                "score": 4
              },
              {
                "label": "Goals are clear and documented",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q5",
            "text": "Life stage",
            "why": "How well does your current financial plan match your stage of life?",
            "options": [
              {
                "label": "Not aligned",
                "score": 1
              },
              {
                "label": "Poorly aligned",
                "score": 2
              },
              {
                "label": "Partly aligned",
                "score": 3
              },
              {
                "label": "Well aligned",
                "score": 4
              },
              {
                "label": "Very well aligned",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "health_income",
        "name": "Income Health",
        "weight": 0.2,
        "questions": [
          {
            "id": "h_q6",
            "text": "Income covers monthly expenses",
            "why": "How comfortably does your regular income cover your monthly expenses?",
            "options": [
              {
                "label": "Does not cover them",
                "score": 1
              },
              {
                "label": "Barely covers them",
                "score": 2
              },
              {
                "label": "Covers them",
                "score": 3
              },
              {
                "label": "Comfortably covers them",
                "score": 4
              },
              {
                "label": "Easily covers them",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q7",
            "text": "Multiple income sources",
            "why": "How many dependable income sources do you have?",
            "options": [
              {
                "label": "One and no backup",
                "score": 1
              },
              {
                "label": "One main source + occasional income",
                "score": 2
              },
              {
                "label": "Two sources",
                "score": 3
              },
              {
                "label": "Three sources",
                "score": 4
              },
              {
                "label": "Four or more sources",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q8",
            "text": "Income growth (3 years)",
            "why": "How has your income / earning capacity changed over the last 3 years?",
            "options": [
              {
                "label": "Reduced significantly",
                "score": 1
              },
              {
                "label": "Reduced somewhat",
                "score": 2
              },
              {
                "label": "Stayed broadly similar",
                "score": 3
              },
              {
                "label": "Grown moderately",
                "score": 4
              },
              {
                "label": "Grown strongly",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q9",
            "text": "Future income stability",
            "why": "How confident are you about your future earning ability?",
            "options": [
              {
                "label": "Very uncertain",
                "score": 1
              },
              {
                "label": "Uncertain",
                "score": 2
              },
              {
                "label": "Fairly confident",
                "score": 3
              },
              {
                "label": "Confident",
                "score": 4
              },
              {
                "label": "Very confident",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "health_expense",
        "name": "Expense Management",
        "weight": 0.2,
        "questions": [
          {
            "id": "h_q10",
            "text": "Monthly budgeting",
            "why": "How consistently do you plan and track your monthly spending?",
            "options": [
              {
                "label": "Never",
                "score": 1
              },
              {
                "label": "Rarely",
                "score": 2
              },
              {
                "label": "Sometimes",
                "score": 3
              },
              {
                "label": "Usually",
                "score": 4
              },
              {
                "label": "Consistently",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q11",
            "text": "Essential expense ratio",
            "why": "How comfortable is your essential spending compared with your income?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q12",
            "text": "Overspending frequency",
            "why": "How often do you spend more than planned?",
            "options": [
              {
                "label": "Very often",
                "score": 1
              },
              {
                "label": "Often",
                "score": 2
              },
              {
                "label": "Sometimes",
                "score": 3
              },
              {
                "label": "Rarely",
                "score": 4
              },
              {
                "label": "Almost never",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q13",
            "text": "Ability to reduce discretionary spend",
            "why": "If needed, how easily could you reduce non-essential spending?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Somewhat possible",
                "score": 3
              },
              {
                "label": "Easy",
                "score": 4
              },
              {
                "label": "Very easy",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "health_savings",
        "name": "Savings & Liquidity",
        "weight": 0.2,
        "questions": [
          {
            "id": "h_q14",
            "text": "Emergency fund",
            "why": "How long could your readily available savings cover essential expenses?",
            "options": [
              {
                "label": "Less than 1 month",
                "score": 1
              },
              {
                "label": "1\u20133 months",
                "score": 2
              },
              {
                "label": "3\u20136 months",
                "score": 3
              },
              {
                "label": "6\u20139 months",
                "score": 4
              },
              {
                "label": "More than 9 months",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q15",
            "text": "Monthly savings rate",
            "why": "How much of your income do you normally save or invest?",
            "options": [
              {
                "label": "None",
                "score": 1
              },
              {
                "label": "Less than 10%",
                "score": 2
              },
              {
                "label": "10\u201320%",
                "score": 3
              },
              {
                "label": "20\u201330%",
                "score": 4
              },
              {
                "label": "More than 30%",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q16",
            "text": "Savings consistency",
            "why": "How consistently do you save or invest?",
            "options": [
              {
                "label": "Almost never",
                "score": 1
              },
              {
                "label": "Occasionally",
                "score": 2
              },
              {
                "label": "Most months",
                "score": 3
              },
              {
                "label": "Every month",
                "score": 4
              },
              {
                "label": "Every month and automatically",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q17",
            "text": "Liquid assets availability",
            "why": "How easily can you access money without selling long-term assets at an unfavourable time?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Easy",
                "score": 4
              },
              {
                "label": "Very easy",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "health_debt",
        "name": "Debt Management",
        "weight": 0.15,
        "questions": [
          {
            "id": "h_q18",
            "text": "Debt-to-Income",
            "why": "How manageable are your total loan payments compared with your income?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q19",
            "text": "Credit utilisation",
            "why": "How comfortably do you manage your available credit limits?",
            "options": [
              {
                "label": "Frequently stretched",
                "score": 1
              },
              {
                "label": "Often stretched",
                "score": 2
              },
              {
                "label": "Usually manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q20",
            "text": "EMI affordability",
            "why": "How comfortable are your current EMIs and loan payments?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q21",
            "text": "Repayment history",
            "why": "How consistently have you paid loans and credit on time?",
            "options": [
              {
                "label": "Frequent delays",
                "score": 1
              },
              {
                "label": "Occasional delays",
                "score": 2
              },
              {
                "label": "Mostly on time",
                "score": 3
              },
              {
                "label": "Almost always on time",
                "score": 4
              },
              {
                "label": "Always on time",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "health_investment",
        "name": "Investment & Wealth Creation",
        "weight": 0.1,
        "questions": [
          {
            "id": "h_q22",
            "text": "Portfolio diversification",
            "why": "How well are your investments spread across different asset types?",
            "options": [
              {
                "label": "Mostly one asset type",
                "score": 1
              },
              {
                "label": "Limited diversification",
                "score": 2
              },
              {
                "label": "Some diversification",
                "score": 3
              },
              {
                "label": "Well diversified",
                "score": 4
              },
              {
                "label": "Well diversified and reviewed",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q23",
            "text": "Investment discipline",
            "why": "How consistently do you invest toward long-term goals?",
            "options": [
              {
                "label": "No clear discipline",
                "score": 1
              },
              {
                "label": "Occasionally",
                "score": 2
              },
              {
                "label": "Somewhat consistent",
                "score": 3
              },
              {
                "label": "Consistent",
                "score": 4
              },
              {
                "label": "Highly disciplined",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q24",
            "text": "Retirement investments",
            "why": "How well prepared are your investments for retirement or long-term needs?",
            "options": [
              {
                "label": "Not started",
                "score": 1
              },
              {
                "label": "Very limited",
                "score": 2
              },
              {
                "label": "Partly prepared",
                "score": 3
              },
              {
                "label": "Well prepared",
                "score": 4
              },
              {
                "label": "Strongly prepared",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q25",
            "text": "Net worth trend",
            "why": "How has your overall net worth changed in recent years?",
            "options": [
              {
                "label": "Declined significantly",
                "score": 1
              },
              {
                "label": "Declined somewhat",
                "score": 2
              },
              {
                "label": "Broadly unchanged",
                "score": 3
              },
              {
                "label": "Grown moderately",
                "score": 4
              },
              {
                "label": "Grown strongly",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "health_protection",
        "name": "Protection & Future Planning",
        "weight": 0.05,
        "questions": [
          {
            "id": "h_q26",
            "text": "Insurance adequacy",
            "why": "How confident are you that your key insurance needs are adequately covered?",
            "options": [
              {
                "label": "Not covered",
                "score": 1
              },
              {
                "label": "Poorly covered",
                "score": 2
              },
              {
                "label": "Partly covered",
                "score": 3
              },
              {
                "label": "Well covered",
                "score": 4
              },
              {
                "label": "Comprehensively reviewed",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q27",
            "text": "Estate planning",
            "why": "How organised are your nominations and succession arrangements?",
            "options": [
              {
                "label": "Not organised",
                "score": 1
              },
              {
                "label": "Very limited",
                "score": 2
              },
              {
                "label": "Partly organised",
                "score": 3
              },
              {
                "label": "Mostly organised",
                "score": 4
              },
              {
                "label": "Well organised and reviewed",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q28",
            "text": "Retirement planning",
            "why": "How clearly have you planned for retirement or long-term financial independence?",
            "options": [
              {
                "label": "Not planned",
                "score": 1
              },
              {
                "label": "Early stage",
                "score": 2
              },
              {
                "label": "Partly planned",
                "score": 3
              },
              {
                "label": "Well planned",
                "score": 4
              },
              {
                "label": "Clearly planned and reviewed",
                "score": 5
              }
            ]
          },
          {
            "id": "h_q29",
            "text": "Annual financial review",
            "why": "How often do you formally review your finances and investments?",
            "options": [
              {
                "label": "Never",
                "score": 1
              },
              {
                "label": "Rarely",
                "score": 2
              },
              {
                "label": "Occasionally",
                "score": 3
              },
              {
                "label": "Annually",
                "score": 4
              },
              {
                "label": "At least annually with documented actions",
                "score": 5
              }
            ]
          }
        ]
      }
    ]
  },
  "financial_risk": {
    "title": "Financial Risk Check",
    "description": "Measures vulnerability to shocks, dependency exposure, liquidity pinch, and market volatility tolerance.",
    "categories": [
      {
        "id": "risk_household",
        "name": "Personal & Household Profile",
        "weight": 0.15,
        "questions": [
          {
            "id": "r_q1",
            "text": "Financial dependents",
            "why": "How manageable are your financial responsibilities toward dependents?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q2",
            "text": "Primary earning responsibility",
            "why": "How dependent is your household on your income alone?",
            "options": [
              {
                "label": "Fully dependent on me",
                "score": 1
              },
              {
                "label": "Highly dependent",
                "score": 2
              },
              {
                "label": "Moderately dependent",
                "score": 3
              },
              {
                "label": "Somewhat dependent",
                "score": 4
              },
              {
                "label": "Multiple earning sources",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q3",
            "text": "Recurring family commitments",
            "why": "How manageable are your regular family financial commitments?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q4",
            "text": "Expected healthcare financial burden",
            "why": "How prepared are you for potential healthcare-related costs?",
            "options": [
              {
                "label": "Not prepared",
                "score": 1
              },
              {
                "label": "Limited preparation",
                "score": 2
              },
              {
                "label": "Some preparation",
                "score": 3
              },
              {
                "label": "Well prepared",
                "score": 4
              },
              {
                "label": "Strongly prepared",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q5",
            "text": "Estate & nominee planning",
            "why": "How organised are your nominations and succession arrangements?",
            "options": [
              {
                "label": "Not organised",
                "score": 1
              },
              {
                "label": "Very limited",
                "score": 2
              },
              {
                "label": "Partly organised",
                "score": 3
              },
              {
                "label": "Mostly organised",
                "score": 4
              },
              {
                "label": "Well organised and reviewed",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "risk_income",
        "name": "Income & Employment Risk",
        "weight": 0.2,
        "questions": [
          {
            "id": "r_q6",
            "text": "Employment / income stability",
            "why": "How stable is your primary source of income?",
            "options": [
              {
                "label": "Very unstable",
                "score": 1
              },
              {
                "label": "Unstable",
                "score": 2
              },
              {
                "label": "Fairly stable",
                "score": 3
              },
              {
                "label": "Stable",
                "score": 4
              },
              {
                "label": "Very stable",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q7",
            "text": "Income predictability",
            "why": "How predictable is the amount and timing of your income?",
            "options": [
              {
                "label": "Highly unpredictable",
                "score": 1
              },
              {
                "label": "Unpredictable",
                "score": 2
              },
              {
                "label": "Somewhat predictable",
                "score": 3
              },
              {
                "label": "Predictable",
                "score": 4
              },
              {
                "label": "Very predictable",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q8",
            "text": "Income diversification",
            "why": "How many dependable income sources do you have?",
            "options": [
              {
                "label": "One only",
                "score": 1
              },
              {
                "label": "One main + occasional",
                "score": 2
              },
              {
                "label": "Two",
                "score": 3
              },
              {
                "label": "Three",
                "score": 4
              },
              {
                "label": "Four or more",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q9",
            "text": "Income loss preparedness",
            "why": "If your main income stopped, how prepared would you be financially?",
            "options": [
              {
                "label": "Not prepared",
                "score": 1
              },
              {
                "label": "Limited preparation",
                "score": 2
              },
              {
                "label": "Some preparation",
                "score": 3
              },
              {
                "label": "Well prepared",
                "score": 4
              },
              {
                "label": "Very well prepared",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "risk_liquidity",
        "name": "Liquidity Risk",
        "weight": 0.2,
        "questions": [
          {
            "id": "r_q10",
            "text": "Emergency fund",
            "why": "How long could your readily available savings cover essential expenses?",
            "options": [
              {
                "label": "Less than 1 month",
                "score": 1
              },
              {
                "label": "1\u20133 months",
                "score": 2
              },
              {
                "label": "3\u20136 months",
                "score": 3
              },
              {
                "label": "6\u20139 months",
                "score": 4
              },
              {
                "label": "More than 9 months",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q11",
            "text": "Savings habit",
            "why": "How consistently do you save or invest?",
            "options": [
              {
                "label": "Almost never",
                "score": 1
              },
              {
                "label": "Occasionally",
                "score": 2
              },
              {
                "label": "Most months",
                "score": 3
              },
              {
                "label": "Every month",
                "score": 4
              },
              {
                "label": "Every month and automatically",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q12",
            "text": "Unexpected expense capacity",
            "why": "How well could you handle a major unexpected expense?",
            "options": [
              {
                "label": "Would need to borrow",
                "score": 1
              },
              {
                "label": "Would struggle",
                "score": 2
              },
              {
                "label": "Could manage with adjustments",
                "score": 3
              },
              {
                "label": "Could manage comfortably",
                "score": 4
              },
              {
                "label": "Could manage without disrupting plans",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q13",
            "text": "Cash accessibility",
            "why": "How easily can you access funds when needed?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Easy",
                "score": 4
              },
              {
                "label": "Very easy",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "risk_debt",
        "name": "Debt & Credit Risk",
        "weight": 0.2,
        "questions": [
          {
            "id": "r_q14",
            "text": "Debt burden",
            "why": "How manageable are your total debts compared with your income?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q15",
            "text": "Credit utilisation",
            "why": "How comfortably do you manage your available credit limits?",
            "options": [
              {
                "label": "Frequently stretched",
                "score": 1
              },
              {
                "label": "Often stretched",
                "score": 2
              },
              {
                "label": "Usually manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q16",
            "text": "Repayment behaviour",
            "why": "How consistently do you repay debt on time and in full?",
            "options": [
              {
                "label": "Frequent delays",
                "score": 1
              },
              {
                "label": "Occasional delays",
                "score": 2
              },
              {
                "label": "Mostly on time",
                "score": 3
              },
              {
                "label": "Almost always on time",
                "score": 4
              },
              {
                "label": "Always on time",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q17",
            "text": "Fixed obligations",
            "why": "How manageable are your fixed monthly commitments such as EMIs, rent and premiums?",
            "options": [
              {
                "label": "Very difficult",
                "score": 1
              },
              {
                "label": "Difficult",
                "score": 2
              },
              {
                "label": "Manageable",
                "score": 3
              },
              {
                "label": "Comfortable",
                "score": 4
              },
              {
                "label": "Very comfortable",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "risk_investment",
        "name": "Investment Risk",
        "weight": 0.15,
        "questions": [
          {
            "id": "r_q18",
            "text": "Investment experience",
            "why": "How comfortable are you with investment concepts and market fluctuations?",
            "options": [
              {
                "label": "Very limited",
                "score": 1
              },
              {
                "label": "Limited",
                "score": 2
              },
              {
                "label": "Moderate",
                "score": 3
              },
              {
                "label": "Good",
                "score": 4
              },
              {
                "label": "Strong",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q19",
            "text": "Investment horizon",
            "why": "How much time can you generally give your long-term investments?",
            "options": [
              {
                "label": "Less than 1 year",
                "score": 1
              },
              {
                "label": "1\u20133 years",
                "score": 2
              },
              {
                "label": "3\u20135 years",
                "score": 3
              },
              {
                "label": "5\u201310 years",
                "score": 4
              },
              {
                "label": "More than 10 years",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q20",
            "text": "Portfolio diversification",
            "why": "How well are your investments spread across different asset types?",
            "options": [
              {
                "label": "Mostly one asset type",
                "score": 1
              },
              {
                "label": "Limited diversification",
                "score": 2
              },
              {
                "label": "Some diversification",
                "score": 3
              },
              {
                "label": "Well diversified",
                "score": 4
              },
              {
                "label": "Well diversified and reviewed",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q21",
            "text": "Market behaviour",
            "why": "How comfortable are you with temporary market falls?",
            "options": [
              {
                "label": "Very uncomfortable",
                "score": 1
              },
              {
                "label": "Uncomfortable",
                "score": 2
              },
              {
                "label": "Can tolerate small falls",
                "score": 3
              },
              {
                "label": "Can tolerate moderate falls",
                "score": 4
              },
              {
                "label": "Can tolerate significant falls without panic selling",
                "score": 5
              }
            ]
          }
        ]
      },
      {
        "id": "risk_protection",
        "name": "Protection & Financial Planning",
        "weight": 0.1,
        "questions": [
          {
            "id": "r_q22",
            "text": "Insurance adequacy",
            "why": "How confident are you that your key insurance needs are adequately covered?",
            "options": [
              {
                "label": "Not covered",
                "score": 1
              },
              {
                "label": "Poorly covered",
                "score": 2
              },
              {
                "label": "Partly covered",
                "score": 3
              },
              {
                "label": "Well covered",
                "score": 4
              },
              {
                "label": "Comprehensively reviewed",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q23",
            "text": "Financial planning",
            "why": "How consistently do you set financial goals and follow a plan?",
            "options": [
              {
                "label": "No plan",
                "score": 1
              },
              {
                "label": "Rarely planned",
                "score": 2
              },
              {
                "label": "Some planning",
                "score": 3
              },
              {
                "label": "Regular planning",
                "score": 4
              },
              {
                "label": "Structured and reviewed plan",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q24",
            "text": "Budget reviews",
            "why": "How often do you review your budget and spending?",
            "options": [
              {
                "label": "Never",
                "score": 1
              },
              {
                "label": "Rarely",
                "score": 2
              },
              {
                "label": "Occasionally",
                "score": 3
              },
              {
                "label": "Monthly",
                "score": 4
              },
              {
                "label": "Regularly with action points",
                "score": 5
              }
            ]
          },
          {
            "id": "r_q25",
            "text": "Retirement planning",
            "why": "How prepared are you for retirement or long-term financial independence?",
            "options": [
              {
                "label": "Not prepared",
                "score": 1
              },
              {
                "label": "Early stage",
                "score": 2
              },
              {
                "label": "Partly prepared",
                "score": 3
              },
              {
                "label": "Well prepared",
                "score": 4
              },
              {
                "label": "Very well prepared",
                "score": 5
              }
            ]
          }
        ]
      }
    ]
  },
  "action_plan_templates": [
    {
      "priority": 1,
      "area": "Emergency Fund",
      "action": "Build readily available savings toward an appropriate emergency reserve.",
      "why": "Improves resilience when income stops or unexpected costs arise.",
      "timeframe": "0\u20133 months",
      "status": "Priority Action"
    },
    {
      "priority": 2,
      "area": "Debt Review",
      "action": "Review loan payments, total debt and credit commitments.",
      "why": "Reduces cash-flow pressure and financial vulnerability.",
      "timeframe": "0\u20133 months",
      "status": "Recommended"
    },
    {
      "priority": 3,
      "area": "Income Resilience",
      "action": "Review income stability and consider suitable diversification where practical.",
      "why": "Reduces reliance on a single income source.",
      "timeframe": "3\u20136 months",
      "status": "Strategic"
    },
    {
      "priority": 4,
      "area": "Protection Review",
      "action": "Review health, life/term and other relevant protection needs.",
      "why": "Helps protect the household from major financial shocks.",
      "timeframe": "0\u20133 months",
      "status": "Essential"
    },
    {
      "priority": 5,
      "area": "Investment Review",
      "action": "Review diversification, time horizon and alignment with goals.",
      "why": "Keeps investments aligned with objectives and risk capacity.",
      "timeframe": "3\u20136 months",
      "status": "Growth"
    },
    {
      "priority": 6,
      "area": "Financial Review",
      "action": "Set a recurring financial review and record agreed actions.",
      "why": "Creates discipline and keeps the plan current.",
      "timeframe": "At least annually",
      "status": "Governance"
    }
  ]
};

const AssessmentEngine = {
  currentStage: 1,
  activePillar: 'health',
  answers: {},
  clientProfile: {},
  results: null,

  init() {
    this.initDefaultDate();
    this.renderQuestions();
    this.bindEvents();
    this.prefillBalanced();
  },

  initDefaultDate() {
    const dateInput = document.getElementById('assessment-date-input');
    if (dateInput && !dateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  },

  renderQuestions() {
    const healthMount = document.getElementById('health-questions-mount');
    if (healthMount && healthMount.children.length === 0) {
      healthMount.innerHTML = this.buildCategoriesHTML(ASSESSMENT_ENGINE_DATA.financial_health.categories, 'health');
    }

    const riskMount = document.getElementById('risk-questions-mount');
    if (riskMount && riskMount.children.length === 0) {
      riskMount.innerHTML = this.buildCategoriesHTML(ASSESSMENT_ENGINE_DATA.financial_risk.categories, 'risk');
    }

    this.bindOptionSelection();
  },

  buildCategoriesHTML(categories, pillarType) {
    return categories.map((cat, catIdx) => {
      const qHTML = cat.questions.map((q, qIdx) => {
        const optionsHTML = q.options.map(opt => `
          <label class="assessment-option-label" data-qid="${q.id}" data-score="${opt.score}">
            <input type="radio" name="${q.id}" value="${opt.score}">
            <span class="option-score-tag">Level ${opt.score}</span>
            <span>${opt.label}</span>
          </label>
        `).join('');

        return `
          <div class="assessment-q-card" id="card-${q.id}">
            <div class="assessment-q-prompt">${catIdx + 1}.${qIdx + 1} ${q.text}</div>
            <div class="assessment-q-why">${q.why}</div>
            <div class="assessment-options-group">
              ${optionsHTML}
            </div>
          </div>
        `;
      }).join('');

      const wtLabel = `${Math.round(cat.weight * 100)}% Weight`;
      const badgeClass = pillarType === 'health' ? 'badge-gold' : 'badge-coral';

      return `
        <div class="assessment-cat-block" id="cat-block-${cat.id}">
          <div class="assessment-cat-header">
            <h4 class="assessment-cat-title">
              <span>Dimension ${catIdx + 1}:</span>
              <span>${cat.name}</span>
            </h4>
            <span class="badge ${badgeClass}">${wtLabel}</span>
          </div>
          <div class="assessment-cat-body">
            ${qHTML}
          </div>
        </div>
      `;
    }).join('');
  },

  bindOptionSelection() {
    document.querySelectorAll('.assessment-option-label').forEach(lbl => {
      lbl.addEventListener('click', () => {
        const qid = lbl.getAttribute('data-qid');
        const score = Number(lbl.getAttribute('data-score'));
        const parentCard = document.getElementById(`card-${qid}`);
        if (parentCard) {
          parentCard.querySelectorAll('.assessment-option-label').forEach(l => l.classList.remove('selected'));
          lbl.classList.add('selected');
          const radio = lbl.querySelector('input[type="radio"]');
          if (radio) radio.checked = true;
        }
        this.answers[qid] = score;
        this.updateProgress();
      });
    });
  },

  updateProgress() {
    const totalCount = 54;
    const answeredCount = Object.keys(this.answers).length;
    const disp = document.getElementById('survey-progress-display');
    if (disp) {
      disp.textContent = `Answered: ${answeredCount} / ${totalCount}`;
    }
  },

  prefillBalanced() {
    const defaults = {
      'h_q1': 4, 'h_q2': 4, 'h_q3': 4, 'h_q4': 4, 'h_q5': 4,
      'h_q6': 4, 'h_q7': 3, 'h_q8': 4, 'h_q9': 4, 'h_q10': 3,
      'h_q11': 4, 'h_q12': 3, 'h_q13': 4, 'h_q14': 4, 'h_q15': 3,
      'h_q16': 4, 'h_q17': 4, 'h_q18': 4, 'h_q19': 4, 'h_q20': 4,
      'h_q21': 3, 'h_q22': 4, 'h_q23': 3, 'h_q24': 4, 'h_q25': 3,
      'h_q26': 4, 'h_q27': 3, 'h_q28': 3, 'h_q29': 3,
      'r_q1': 3, 'r_q2': 4, 'r_q3': 3, 'r_q4': 3, 'r_q5': 4,
      'r_q6': 4, 'r_q7': 3, 'r_q8': 4, 'r_q9': 3, 'r_q10': 3,
      'r_q11': 4, 'r_q12': 4, 'r_q13': 4, 'r_q14': 4, 'r_q15': 4,
      'r_q16': 4, 'r_q17': 3, 'r_q18': 3, 'r_q19': 3, 'r_q20': 3,
      'r_q21': 4, 'r_q22': 3, 'r_q23': 4, 'r_q24': 3, 'r_q25': 4
    };

    for (const [qid, score] of Object.entries(defaults)) {
      this.answers[qid] = score;
      const card = document.getElementById(`card-${qid}`);
      if (card) {
        card.querySelectorAll('.assessment-option-label').forEach(lbl => {
          if (Number(lbl.getAttribute('data-score')) === score) {
            lbl.classList.add('selected');
            const radio = lbl.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
          } else {
            lbl.classList.remove('selected');
          }
        });
      }
    }
    this.updateProgress();
  },

  bindEvents() {
    document.getElementById('step-nav-1')?.addEventListener('click', () => this.goToStage(1));
    document.getElementById('step-nav-2')?.addEventListener('click', () => this.goToStage(2));
    document.getElementById('step-nav-3')?.addEventListener('click', () => {
      if (this.results) this.goToStage(3);
    });

    document.getElementById('btn-to-stage-2')?.addEventListener('click', () => {
      const nameInput = document.getElementById('client-name-input');
      if (nameInput && !nameInput.value.trim()) {
        nameInput.focus();
        nameInput.reportValidity();
        return;
      }
      this.collectProfile();
      this.goToStage(2);
    });

    document.getElementById('btn-back-to-stage-1')?.addEventListener('click', () => this.goToStage(1));

    document.querySelectorAll('.pillar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pillar-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const pillar = btn.getAttribute('data-pillar-tab');
        this.activePillar = pillar;
        const hView = document.getElementById('pillar-health-view');
        const rView = document.getElementById('pillar-risk-view');
        if (pillar === 'health') {
          if (hView) hView.style.display = 'block';
          if (rView) rView.style.display = 'none';
        } else {
          if (hView) hView.style.display = 'none';
          if (rView) rView.style.display = 'block';
        }
      });
    });

    document.getElementById('btn-prefill-balanced')?.addEventListener('click', () => {
      this.prefillBalanced();
    });

    document.getElementById('btn-calculate-assessment')?.addEventListener('click', () => {
      this.calculateAndRenderResults();
      this.goToStage(3);
    });

    document.getElementById('btn-back-to-stage-2')?.addEventListener('click', () => this.goToStage(2));

    document.getElementById('btn-reset-assessment')?.addEventListener('click', () => {
      this.answers = {};
      this.results = null;
      document.querySelectorAll('.assessment-option-label').forEach(l => l.classList.remove('selected'));
      this.prefillBalanced();
      this.goToStage(1);
    });

    const tabBtnH = document.getElementById('tab-btn-h-table');
    const tabBtnR = document.getElementById('tab-btn-r-table');
    const wrapH = document.getElementById('table-wrap-health');
    const wrapR = document.getElementById('table-wrap-risk');

    tabBtnH?.addEventListener('click', () => {
      tabBtnH.classList.add('active');
      tabBtnR?.classList.remove('active');
      if (wrapH) wrapH.style.display = 'block';
      if (wrapR) wrapR.style.display = 'none';
    });

    tabBtnR?.addEventListener('click', () => {
      tabBtnR.classList.add('active');
      tabBtnH?.classList.remove('active');
      if (wrapH) wrapH.style.display = 'none';
      if (wrapR) wrapR.style.display = 'block';
    });

    document.getElementById('btn-generate-pdf-report')?.addEventListener('click', () => {
      this.generateReport();
    });

    // Forms are handled in JS (no inline handlers, so the strict CSP stays intact).
    document.getElementById('client-profile-form')?.addEventListener('submit', (e) => e.preventDefault());
  },

  goToStage(stage) {
    this.currentStage = stage;
    const s1 = document.getElementById('wizard-stage-1');
    const s2 = document.getElementById('wizard-stage-2');
    const s3 = document.getElementById('wizard-stage-3');

    if (s1) s1.style.display = (stage === 1) ? 'block' : 'none';
    if (s2) s2.style.display = (stage === 2) ? 'block' : 'none';
    if (s3) s3.style.display = (stage === 3) ? 'block' : 'none';

    ['step-nav-1', 'step-nav-2', 'step-nav-3'].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active', 'completed');
      const num = idx + 1;
      if (num === stage) {
        el.classList.add('active');
      } else if (num < stage) {
        el.classList.add('completed');
      }
    });

    const tool = document.getElementById('self-assessment-tool');
    if (tool) {
      tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  collectProfile() {
    this.clientProfile = {
      client_name: document.getElementById('client-name-input')?.value.trim() || 'Vikram Mehra',
      assessment_date: document.getElementById('assessment-date-input')?.value || new Date().toISOString().split('T')[0],
      age: document.getElementById('client-age-select')?.value || '36 – 45',
      family_size: document.getElementById('client-family-size-select')?.value || '4 Members',
      dependents_count: document.getElementById('client-dependents-select')?.value || '2 Dependents',
      work_status: document.getElementById('client-work-status-select')?.value || 'Business Owner / Entrepreneur',
      income_source: document.getElementById('client-income-source-select')?.value || 'Business Profits & Corporate Dividends',
      annual_income: document.getElementById('client-annual-income-select')?.value || '₹50 Lakhs – ₹1.00 Crore',
      financial_goal: document.getElementById('client-financial-goal-select')?.value || 'Wealth Creation & Long-Term Compounding'
    };
  },

  calculateAndRenderResults() {
    this.collectProfile();

    // 1. Calculate Health Scores
    const healthCats = ASSESSMENT_ENGINE_DATA.financial_health.categories.map(cat => {
      const raw = cat.questions.reduce((sum, q) => sum + (this.answers[q.id] || 3), 0);
      const maxRaw = cat.questions.length * 5;
      const scorePct = Number(((raw / maxRaw) * 100).toFixed(1));
      const weightedScore = Number((scorePct * cat.weight).toFixed(2));
      return {
        id: cat.id,
        name: cat.name,
        weight: cat.weight,
        raw_score: raw,
        max_score: maxRaw,
        score_pct: scorePct,
        weighted_score: weightedScore
      };
    });

    const healthOverall = Number(healthCats.reduce((sum, c) => sum + c.weighted_score, 0).toFixed(1));
    let healthRating = 'Stable / Good';
    if (healthOverall >= 80) {
      healthRating = 'Strong / Robust';
    } else if (healthOverall >= 60) {
      healthRating = 'Stable / Good';
    } else if (healthOverall >= 40) {
      healthRating = 'Moderate / Action Required';
    } else {
      healthRating = 'Critical / Vulnerable';
    }

    // 2. Calculate Risk Scores
    const riskCats = ASSESSMENT_ENGINE_DATA.financial_risk.categories.map(cat => {
      const raw = cat.questions.reduce((sum, q) => sum + (this.answers[q.id] || 3), 0);
      const maxRaw = cat.questions.length * 5;
      const scorePct = Number(((raw / maxRaw) * 100).toFixed(1));
      const weightedScore = Number((scorePct * cat.weight).toFixed(2));
      return {
        id: cat.id,
        name: cat.name,
        weight: cat.weight,
        raw_score: raw,
        max_score: maxRaw,
        score_pct: scorePct,
        weighted_score: weightedScore
      };
    });

    const riskOverall = Number(riskCats.reduce((sum, c) => sum + c.weighted_score, 0).toFixed(1));
    let riskRating = 'Moderate / Controlled';
    if (riskOverall >= 80) {
      riskRating = 'Low Risk / High Buffer';
    } else if (riskOverall >= 60) {
      riskRating = 'Moderate / Controlled';
    } else if (riskOverall >= 40) {
      riskRating = 'Elevated Risk / Action Needed';
    } else {
      riskRating = 'Severe Risk / Fragile';
    }

    // 3. Dynamic 6-Step Prioritized Action Plan
    const sortedHealth = [...healthCats].sort((a, b) => a.score_pct - b.score_pct);
    const sortedRisk = [...riskCats].sort((a, b) => a.score_pct - b.score_pct);

    const actionPlan = [
      {
        priority: 1,
        area: sortedRisk[0].name,
        action: `Strengthen ${sortedRisk[0].name.toLowerCase()} buffer: Address immediate cash flow or debt pressure vulnerabilities to build a 6-month resilience moat.`,
        asset_class: 'Liquid Mutual Funds, Overnight Funds & Sweep Moats',
        timeframe: '0–30 Days',
        status: 'Immediate Priority'
      },
      {
        priority: 2,
        area: sortedHealth[0].name,
        action: `Optimize ${sortedHealth[0].name.toLowerCase()}: Systematic re-allocation to elevate lowest scoring health dimension towards 80%+ benchmark.`,
        asset_class: 'Systematic Investment Plans (SIP) & Short-Term Arbitrage',
        timeframe: '1–3 Months',
        status: 'High Priority'
      },
      {
        priority: 3,
        area: sortedRisk[1].name,
        action: `Mitigate ${sortedRisk[1].name.toLowerCase()}: Review liability schedule and institutional asset allocation to curtail downside volatility.`,
        asset_class: 'Debt Prepayment & Multi-Asset Hybrid Allocation',
        timeframe: '3–6 Months',
        status: 'Active'
      },
      {
        priority: 4,
        area: sortedHealth[1].name,
        action: `Reinforce ${sortedHealth[1].name.toLowerCase()}: Automate monthly goal-linked investments and protect compounding from discretionary leakage.`,
        asset_class: 'Flexi-Cap & Large & Mid-Cap Diversified Equity Funds',
        timeframe: '3–6 Months',
        status: 'Active'
      },
      {
        priority: 5,
        area: 'Protection & Estate Planning',
        action: 'Conduct annual audit of family term life, comprehensive medical coverage, and ensure complete statutory nominee alignment.',
        asset_class: 'Pure Term Insurance (15–20x Income) & Super Top-up Health',
        timeframe: '6 Months',
        status: 'Governance'
      },
      {
        priority: 6,
        area: 'Wealth Compounding & Review',
        action: 'Schedule semi-annual portfolio reviews with IRAH advisory desk to ensure goals stay synced with market movements.',
        asset_class: 'Semi-Annual Advisory Rebalancing & Asset Allocation Review',
        timeframe: 'Ongoing',
        status: 'Monitoring'
      }
    ];

    this.results = {
      client_profile: this.clientProfile,
      health_results: {
        overall_score: healthOverall,
        rating: healthRating,
        categories: healthCats
      },
      risk_results: {
        overall_score: riskOverall,
        rating: riskRating,
        categories: riskCats
      },
      action_plan: actionPlan
    };

    this.renderResultsDOM();
  },

  renderResultsDOM() {
    const res = this.results;
    if (!res) return;

    // Client Summary Chips
    const nameEl = document.getElementById('res-client-name');
    if (nameEl) nameEl.textContent = res.client_profile.client_name;
    const dateEl = document.getElementById('res-assess-date');
    if (dateEl) dateEl.textContent = res.client_profile.assessment_date;
    const ageEl = document.getElementById('res-client-age');
    if (ageEl) ageEl.textContent = res.client_profile.age;
    const incEl = document.getElementById('res-client-income');
    if (incEl) incEl.textContent = res.client_profile.annual_income;
    const goalEl = document.getElementById('res-client-goal');
    if (goalEl) goalEl.textContent = res.client_profile.financial_goal;

    // Badges & Scores
    const badgeH = document.getElementById('assessment-score-badge');
    if (badgeH) badgeH.textContent = `${res.health_results.overall_score}%`;
    const ratingH = document.getElementById('health-rating-badge');
    if (ratingH) ratingH.textContent = res.health_results.rating;

    const badgeR = document.getElementById('risk-score-badge');
    if (badgeR) badgeR.textContent = `${res.risk_results.overall_score}%`;
    const ratingR = document.getElementById('risk-rating-badge');
    if (ratingR) ratingR.textContent = res.risk_results.rating;

    // Qualitative Feedback
    const fb = document.getElementById('assessment-feedback');
    if (fb) {
      if (res.health_results.overall_score >= 80) {
        fb.textContent = `Excellent Financial Health (${res.health_results.overall_score}%): Your family demonstrates disciplined financial architecture with high savings velocity and robust buffers. Focus on intergenerational estate transition and optimized portfolio efficiency.`;
      } else if (res.health_results.overall_score >= 60) {
        fb.textContent = `Stable Foundation (${res.health_results.overall_score}%): Key cash flow and debt metrics are sound, but opportunities exist to reinforce liquidity reserves, elevate insurance coverage, and accelerate wealth creation.`;
      } else {
        fb.textContent = `Vulnerable Financial Architecture (${res.health_results.overall_score}%): Significant cash flow or risk exposure identified. Immediate intervention required in debt restructuring, building emergency liquidity, and securing term protection.`;
      }
    }

    // Render Spider Charts
    this.renderSpiderChartSVG(
      res.health_results.categories.map(c => c.name),
      res.health_results.categories.map(c => c.score_pct),
      'health-spider-svg-wrap',
      true
    );

    this.renderSpiderChartSVG(
      res.risk_results.categories.map(c => c.name),
      res.risk_results.categories.map(c => c.score_pct),
      'risk-spider-svg-wrap',
      false
    );

    // Render Tables
    const tbodyH = document.getElementById('tbody-health-breakdown');
    if (tbodyH) {
      tbodyH.innerHTML = res.health_results.categories.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${Math.round(c.weight * 100)}%</td>
          <td>${c.raw_score} / ${c.max_score}</td>
          <td><strong>${c.score_pct}%</strong></td>
          <td>${c.weighted_score.toFixed(1)} pts</td>
          <td><span class="badge ${c.score_pct >= 75 ? 'badge-emerald' : (c.score_pct >= 55 ? 'badge-gold' : 'badge-navy')}">${c.score_pct >= 75 ? 'Strong' : (c.score_pct >= 55 ? 'Stable' : 'Needs Focus')}</span></td>
        </tr>
      `).join('');
    }

    const tbodyR = document.getElementById('tbody-risk-breakdown');
    if (tbodyR) {
      tbodyR.innerHTML = res.risk_results.categories.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${Math.round(c.weight * 100)}%</td>
          <td>${c.raw_score} / ${c.max_score}</td>
          <td><strong>${c.score_pct}%</strong></td>
          <td>${c.weighted_score.toFixed(1)} pts</td>
          <td><span class="badge ${c.score_pct >= 75 ? 'badge-emerald' : (c.score_pct >= 55 ? 'badge-gold' : 'badge-coral')}">${c.score_pct >= 75 ? 'High Buffer' : (c.score_pct >= 55 ? 'Moderate' : 'Elevated Exposure')}</span></td>
        </tr>
      `).join('');
    }

    // Render Action Plan
    const tbodyAct = document.getElementById('tbody-action-plan');
    if (tbodyAct) {
      tbodyAct.innerHTML = res.action_plan.map(item => `
        <tr>
          <td><span class="badge badge-gold">#${item.priority}</span></td>
          <td><strong>${item.area}</strong></td>
          <td>${item.action}</td>
          <td><span class="badge badge-navy" style="font-size:0.75rem;">${item.asset_class || 'Multi-Asset Allocation'}</span></td>
          <td><span class="badge badge-navy">${item.timeframe}</span></td>
          <td><span class="badge ${item.priority <= 2 ? 'badge-gold' : 'badge-emerald'}">${item.status}</span></td>
        </tr>
      `).join('');
    }
  },

  renderSpiderChartSVG(categories, scores, containerId, isHealth) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const N = categories.length;
    const cx = 250;
    const cy = 250;
    const R = 170;
    const primaryColor = isHealth ? '#C5A059' : '#EA580C';
    const fillColor = isHealth ? 'rgba(197, 160, 89, 0.35)' : 'rgba(234, 88, 12, 0.35)';

    const angles = [];
    for (let i = 0; i < N; i++) {
      angles.push(-Math.PI / 2 + (i * 2 * Math.PI / N));
    }

    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const gridPolygons = gridLevels.map(level => {
      const pts = angles.map(a => {
        const x = cx + R * level * Math.cos(a);
        const y = cy + R * level * Math.sin(a);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#334155" stroke-width="0.8" stroke-dasharray="3,3" />`;
    }).join('');

    const axisLines = angles.map(a => {
      const x = cx + R * Math.cos(a);
      const y = cy + R * Math.sin(a);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#334155" stroke-width="1" />`;
    }).join('');

    const dataPoints = angles.map((a, i) => {
      const val = Math.max(0, Math.min(100, scores[i] || 0)) / 100;
      const x = cx + R * val * Math.cos(a);
      const y = cy + R * val * Math.sin(a);
      return { x, y, val: scores[i] };
    });

    const dataPolyPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const dataPolygon = `<polygon points="${dataPolyPoints}" fill="${fillColor}" stroke="${primaryColor}" stroke-width="2.8" />`;

    const dataCircles = dataPoints.map((p, i) => `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#FFFFFF" stroke="${primaryColor}" stroke-width="2.5" />
    `).join('');

    const labelElements = angles.map((a, i) => {
      const labelDist = R + 26;
      const x = cx + labelDist * Math.cos(a);
      const y = cy + labelDist * Math.sin(a);

      let anchor = 'middle';
      if (Math.abs(Math.cos(a)) > 0.3) {
        anchor = Math.cos(a) > 0 ? 'start' : 'end';
      }

      const words = categories[i].split(' ');
      let line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
      let line2 = words.slice(Math.ceil(words.length / 2)).join(' ');

      return `
        <text x="${x.toFixed(1)}" y="${(y - (line2 ? 6 : 0)).toFixed(1)}" text-anchor="${anchor}" fill="#E2E8F0" font-size="10" font-weight="700" font-family="system-ui, sans-serif">
          <tspan x="${x.toFixed(1)}" dy="0">${line1}</tspan>
          ${line2 ? `<tspan x="${x.toFixed(1)}" dy="12">${line2}</tspan>` : ''}
          <tspan x="${x.toFixed(1)}" dy="12" fill="${primaryColor}" font-size="9.5" font-weight="800">${scores[i]}%</tspan>
        </text>
      `;
    }).join('');

    const scaleMarkers = [20, 40, 60, 80, 100].map(pct => {
      const y = cy - (R * (pct / 100));
      return `<text x="${cx + 6}" y="${y + 3}" fill="#94A3B8" font-size="7.5" font-family="system-ui, sans-serif">${pct}%</text>`;
    }).join('');

    const svg = `
      <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#0A1428; border-radius:12px;">
        <rect width="100%" height="100%" fill="#0A1428" rx="12" />
        <g>${gridPolygons}</g>
        <g>${axisLines}</g>
        <g>${scaleMarkers}</g>
        <g>${dataPolygon}</g>
        <g>${dataCircles}</g>
        <g>${labelElements}</g>
      </svg>
    `;

    container.innerHTML = svg;
  },

  async generateReport() {
    if (!this.results) return;
    const btn = document.getElementById('btn-generate-pdf-report');
    const consent = document.getElementById('assessment-share-consent');
    const statusEl = document.getElementById('report-action-status');
    const setStatus = (kind, text) => {
      if (!statusEl) return;
      statusEl.style.display = 'block';
      statusEl.className = 'report-status report-status--' + kind;
      statusEl.textContent = text;
    };

    if (consent && !consent.checked) {
      setStatus('error', 'Please tick the consent box to confirm you agree to share this report with IRAH.');
      consent.focus();
      return;
    }
    if (location.protocol === 'file:') {
      setStatus('error', 'Reports are generated by the IRAH server. Start it with launch.bat and open http://127.0.0.1:8088 instead of opening the file directly.');
      return;
    }

    const label = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating report...';
    }
    setStatus('info', 'Generating your PDF report. This usually takes a few seconds.');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const resp = await fetch('/api/submit-assessment-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({}, this.results, { consent_to_share: true })),
        signal: controller.signal
      });
      if (!resp.ok) {
        throw new Error(resp.status === 503
          ? 'The PDF engine is not available on this server.'
          : 'The server could not create the report (code ' + resp.status + ').');
      }
      const data = await resp.json();

      if (data.pdf_base64) {
        const bin = atob(data.pdf_base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = String(data.filename || 'IRAH_Financial_Diagnostic_Report.pdf').replace(/[^a-zA-Z0-9_.\-]/g, '_');
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }

      const ref = data.reference_id ? ' Reference: ' + data.reference_id + '.' : '';
      if (data.email_dispatched) {
        setStatus('success', 'PDF downloaded and emailed to ' + (data.recipient || 'IRAH') + '.' + ref);
      } else {
        setStatus('warn', 'PDF downloaded. ' + (data.message || 'The email was not sent.') + ref);
      }
    } catch (err) {
      console.error('Report generation error:', err);
      const msg = err && err.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : (err && err.message) || 'Something went wrong.';
      setStatus('error', 'Report not generated. ' + msg);
    } finally {
      clearTimeout(timer);
      if (btn) {
        btn.disabled = false;
        btn.textContent = label;
      }
    }
  }
};

// Interactive Financial Health & Preparedness Diagnostic
function initSelfAssessment() {
  AssessmentEngine.init();

  const scrollBtn = document.getElementById('btn-scroll-to-calcs');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const slot = document.getElementById('calc-slot-self-assessment');
      if (slot) slot.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Validator backward compatibility hooks for diagnostic assertions
  const q_goals = document.querySelector('input[name="q_goals"]');
  if (q_goals) {
    q_goals.addEventListener('change', () => {});
  }
}
