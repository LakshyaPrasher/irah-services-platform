function formatINR(val, compact = false) {
  const num = Number.isFinite(Number(val)) ? Math.round(Number(val)) : 0;
  if (compact) { if (num >= 9999500) return '₹' + (num / 1e7).toFixed(2) + ' Cr'; if (num >= 99995) return '₹' + (num / 1e5).toFixed(2) + ' L'; }
  return '₹' + num.toLocaleString('en-IN');
}
function sanitizeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const ModalA11y = {
  open(m) {
    if (!m) return; m._ret = document.activeElement; m.classList.add('active'); document.body.style.overflow = 'hidden';
    const box = m.querySelector('.modal-content-box'); if (box) box.tabIndex = -1; const focusTarget = m.querySelector('.modal-close-btn') || box;
    if (focusTarget) focusTarget.focus();
  },
  close(m) {
    if (!m) return; m.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active')) { document.body.style.overflow = ''; }
    if (m._ret && typeof m._ret.focus === 'function') { m._ret.focus(); }
  },
  key(e) {
    const m = document.querySelector('.modal-overlay.active'); if (!m) return;
    if (e.key === 'Escape') { return this.close(m); }
    if (e.key !== 'Tab') return; const f = [...m.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]')].filter(x => x.offsetParent);
    if (!f.length) return; const a = document.activeElement; const box = m.querySelector('.modal-content-box');
    if (e.shiftKey && (a === f[0] || a === box)) {
      e.preventDefault(); f[f.length - 1].focus();
    } else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
};
const Router = {
  currentRoute: '#/',
  _routed: false,
  routes: [
    '#/', '#/about', '#/business-lines', '#/financial-services', '#/financial-services/mutual-funds', '#/financial-services/pms', '#/financial-services/aif', '#/financial-services/sif',
    '#/financial-services/bonds', '#/financial-services/structured-products', '#/financial-services/retirement-plans', '#/financial-services/children-plans', '#/financial-services/ulip', '#/financial-services/gift-inbound', '#/financial-services/gift-outbound', '#/financial-services/global-equity',
    '#/education', '#/insurance-solutions', '#/will-inheritance', '#/loans-p2p', '#/insights', '#/resources', '#/calculators',
    '#/self-assessment', '#/self-assessment/calculators', '#/knowledge-repository', '#/contact', '#/investor-charter', '#/grievance-redressal', '#/risk-disclosures', '#/privacy-policy',
    '#/terms-of-use'
  ],
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    if (!window.location.hash) { window.location.hash = '#/'; } else { this.handleRoute(); }
  },
  handleRoute() {
    let hash = window.location.hash || '#/';
    if (hash.length > 2 && hash.endsWith('/')) { hash = hash.slice(0, -1); }
    if (hash === '#/home' || hash === '#' || hash === '') {
      hash = '#/';
    }
    this.currentRoute = hash; let anchorScrollTarget = null;
    let targetId = 'view-home';
    if (hash === '#home-calculators') {
      window.location.hash = '#/calculators'; return;
    } else if (hash === '#home-contact') { window.location.hash = '#/contact'; return; }
    if (hash === '#/') { targetId = 'view-home'; }
    else if (hash === '#/about') { targetId = 'view-about'; }
    else if (hash === '#/business-lines') { targetId = 'view-business-lines'; }
    else if (hash === '#/financial-services' || hash.startsWith('#/financial-services/')) { targetId = 'view-financial-services'; this.handleFinancialProductTab(hash); }
    else if (hash === '#/loans-p2p') { targetId = 'view-loans-p2p'; }
    else if (hash === '#/education') { targetId = 'view-education'; }
    else if (hash === '#/insurance-solutions' || hash === '#/will-inheritance') { targetId = 'view-coming-soon'; this.renderComingSoonView(hash); }
    else if (hash === '#/insights') { targetId = 'view-insights'; }
    else if (hash === '#/resources') { targetId = 'view-resources'; }
    else if (hash === '#/calculators') { targetId = 'view-calculators'; }
    else if (hash === '#/self-assessment' || hash.startsWith('#/self-assessment/')) {
      targetId = 'view-self-assessment';
      if (hash === '#/self-assessment/calculators') anchorScrollTarget = 'calc-slot-self-assessment';
    }
    else if (hash === '#/knowledge-repository') { targetId = 'view-knowledge-repository'; }
    else if (hash === '#/contact') { targetId = 'view-contact'; }
    else if (hash === '#/investor-charter') { targetId = 'view-investor-charter'; }
    else if (hash === '#/grievance-redressal') { targetId = 'view-grievance-redressal'; }
    else if (hash === '#/risk-disclosures' || hash === '#/privacy-policy' || hash === '#/terms-of-use') {
      targetId = 'view-risk-disclosures';
      if (hash === '#/privacy-policy') anchorScrollTarget = 'policy-dpdp'; if (hash === '#/terms-of-use') anchorScrollTarget = 'policy-terms';
    } else { targetId = 'view-home'; hash = '#/'; history.replaceState(null, '', '#/'); }
    const pageTitles = {
      'view-home': 'IRAH Services LLP | Regulated Mutual Fund & Wealth Product Distribution',
      'view-about': 'About Us • Corporate Governance | IRAH Services LLP',
      'view-business-lines': 'Business Lines | IRAH Services LLP',
      'view-financial-services': 'Products Available Through IRAH | IRAH Services LLP',
      'view-loans-p2p': 'Loans & P2P Lending (LenDenClub) | IRAH Services LLP',
      'view-education': 'Financial Education Services (Coming Soon) | IRAH Services LLP',
      'view-coming-soon': 'Coming Soon | IRAH Services LLP',
      'view-insights': 'Insights & Product Notes | IRAH Services LLP',
      'view-resources': 'Investor Resources & FAQs | IRAH Services LLP',
      'view-calculators': 'Financial Calculators | IRAH Services LLP',
      'view-self-assessment': 'Self-Assessment & Family Financial Assessment | IRAH Services LLP',
      'view-knowledge-repository': 'Regulatory Knowledge Repository | IRAH Services LLP',
      'view-contact': 'Contact & Relationship Desks | IRAH Services LLP',
      'view-investor-charter': 'Investor Charter in Respect of Mutual Funds | IRAH Services LLP',
      'view-grievance-redressal': 'Grievance Redressal | IRAH Services LLP',
      'view-risk-disclosures': 'Standard Risk Disclosures & DPDP Privacy | IRAH Services LLP'
    };
    let resolvedTitle = pageTitles[targetId];
    if (hash === '#/insurance-solutions') { resolvedTitle = 'Insurance Solutions (Coming Soon) | IRAH Services LLP'; } else if (hash === '#/will-inheritance') {
      resolvedTitle = 'Will Writing and Inheritance Planning (Coming Soon) | IRAH Services LLP'; }
    if (resolvedTitle) { document.title = resolvedTitle; }
    const announcer = document.getElementById('route-announcer');
    if (announcer && resolvedTitle) { announcer.textContent = resolvedTitle; }
    this.mountDynamicComponents(targetId);
    const allViews = document.querySelectorAll('.page-view-container');
    allViews.forEach(view => view.classList.remove('active'));
    const targetEl = document.getElementById(targetId);
    if (targetEl) { targetEl.classList.add('active'); }
    const h1 = targetEl && targetEl.querySelector('h1');
    if (h1 && this._routed) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    this._routed = true;
    if (anchorScrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(anchorScrollTarget);
        if (el) { const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' }); }
      }, 50);
    } else { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    this.updateActiveNav(hash);
    if (targetId === 'view-about' && typeof IrahAcronymEtymology !== 'undefined') { IrahAcronymEtymology.onEnterAbout(); }
    if (typeof LoansP2PStudio !== 'undefined') {
      if (targetId === 'view-loans-p2p') { if (typeof LoansP2PStudio.onEnter === 'function') LoansP2PStudio.onEnter(); }
      else { if (typeof LoansP2PStudio.onLeave === 'function') LoansP2PStudio.onLeave(); }
    }
  },
  mountDynamicComponents(targetViewId) {
    const calcContainer = document.getElementById('master-calculator-container');
    if (calcContainer) {
      if (targetViewId === 'view-calculators') {
        const dedicatedSlot = document.getElementById('calc-slot-dedicated');
        if (dedicatedSlot && calcContainer.parentElement !== dedicatedSlot) { dedicatedSlot.appendChild(calcContainer); }
      } else if (targetViewId === 'view-self-assessment') {
        const selfSlot = document.getElementById('calc-slot-self-assessment');
        if (selfSlot && calcContainer.parentElement !== selfSlot) { selfSlot.appendChild(calcContainer); }
      } else {
        const dedicatedSlot = document.getElementById('calc-slot-dedicated');
        if (dedicatedSlot && calcContainer.parentElement !== dedicatedSlot) { dedicatedSlot.appendChild(calcContainer); }
      }
    }
    const contactContainer = document.getElementById('master-contact-container');
    if (contactContainer) {
      if (targetViewId === 'view-contact') {
        const dedicatedContactSlot = document.getElementById('contact-slot-dedicated');
        if (dedicatedContactSlot && contactContainer.parentElement !== dedicatedContactSlot) { dedicatedContactSlot.appendChild(contactContainer); }
      } else {
        const dedicatedContactSlot = document.getElementById('contact-slot-dedicated');
        if (dedicatedContactSlot && contactContainer.parentElement !== dedicatedContactSlot) { dedicatedContactSlot.appendChild(contactContainer); }
      }
    }
  },
  updateActiveNav(hash) {
    const links = document.querySelectorAll('.nav-link, .dropdown-link');
    links.forEach(link => { link.classList.remove('active'); link.removeAttribute('aria-current'); });
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href === hash ||
        (href !== '#/' && hash.startsWith(href + '/'));
      if (isMatch) {
        link.classList.add('active'); link.setAttribute('aria-current', 'page');
        const parentItem = link.closest('.nav-item'); const trigger = parentItem && parentItem.querySelector('.dropdown-trigger');
        if (trigger) trigger.classList.add('active');
      }
    });
  },
  handleFinancialProductTab(hash) {
    const subRoute = hash.replace('#/financial-services', '').replace(/^\//, '');
    setTimeout(() => {
      const targetBtn = document.querySelector(`[data-fs-tab="${subRoute}"]`) || document.querySelector('[data-fs-tab="mutual-funds"]');
      if (targetBtn) { targetBtn.click(); }
    }, 20);
  },
  renderComingSoonView(hash) {
    const configs = {
      '#/insurance-solutions': { icon: '🛡️', title: 'Insurance Solutions', subline: 'Structured life, health, and protection facilitation. Launching soon.' },
      '#/will-inheritance': { icon: '📜', title: 'Will Writing and Inheritance Planning', subline: 'Structured estate documentation and succession facilitation. Launching soon.' }
    };
    const cfg = configs[hash]; if (!cfg) return; const iconEl = document.getElementById('cs-dynamic-icon'); const titleEl = document.getElementById('cs-dynamic-title');
    const sublineEl = document.getElementById('cs-dynamic-subline'); let partnerEl = document.querySelector('#view-coming-soon #cs-partner-callout');
    if (!partnerEl) {
      const card = document.querySelector('#view-coming-soon .coming-soon-card-pro');
      if (card && card.parentElement) {
        partnerEl = document.createElement('div'); partnerEl.id = 'cs-partner-callout'; partnerEl.className = 'cs-partner-callout';
        partnerEl.innerHTML = '<span class="cs-partner-dot" aria-hidden="true"></span><span>In partnership with <strong>LenDenClub</strong></span>';
        card.parentElement.appendChild(partnerEl);
      }
    }
    if (iconEl) iconEl.textContent = cfg.icon; if (titleEl) titleEl.textContent = cfg.title; if (sublineEl) sublineEl.textContent = cfg.subline;
    if (partnerEl) partnerEl.style.display = cfg.partner ? 'flex' : 'none';
  }
};
const Calculators = {
  init() {
    this.bindTabButtons(); this.bindSIPInputs(); this.bindLumpsumInputs(); this.bindRetirementInputs(); this.bindDelayInputs(); this.bindInflationInputs();
    this.calcSIP(); this.calcLumpsum(); this.calcRetirement(); this.calcDelay(); this.calcInflation();
  },
  bindTabButtons() {
    const tabs = [...document.querySelectorAll('.calc-tab-btn')];
    const select = (btn, focus) => {
      tabs.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      document.querySelectorAll('.calc-panel').forEach(p => { p.classList.toggle('active', p.id === btn.dataset.targetPanel); });
      if (focus) btn.focus();
    };
    tabs.forEach((b, i) => {
      b.id = 'tab-' + b.dataset.targetPanel; b.setAttribute('aria-controls', b.dataset.targetPanel); const panel = document.getElementById(b.dataset.targetPanel);
      if (panel) panel.setAttribute('aria-labelledby', b.id); b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', e => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    const activeTab = tabs.find(b => b.classList.contains('active')) || tabs[0]; if (activeTab) select(activeTab);
  },
  bindSIPInputs() {
    const sipAmount = document.getElementById('sip-amount'); const sipAmountNum = document.getElementById('sip-amount-num');
    const sipRate = document.getElementById('sip-rate'); const sipRateNum = document.getElementById('sip-rate-num'); const sipYears = document.getElementById('sip-years');
    const sipYearsNum = document.getElementById('sip-years-num'); if (!sipAmount) return;
    const onRangeInput = () => {
      if (sipAmountNum) sipAmountNum.value = sipAmount.value; if (sipRateNum) sipRateNum.value = sipRate.value; if (sipYearsNum) sipYearsNum.value = sipYears.value;
      this.updateSIPDisplays(); this.calcSIP();
    };
    const onNumberInput = () => {
      if (sipAmountNum && sipAmount) sipAmount.value = Math.min(500000, Math.max(500, Number(sipAmountNum.value) || 500));
      if (sipRateNum && sipRate) sipRate.value = Math.min(25, Math.max(4, Number(sipRateNum.value) || 4));
      if (sipYearsNum && sipYears) sipYears.value = Math.min(40, Math.max(1, Number(sipYearsNum.value) || 1)); this.updateSIPDisplays(); this.calcSIP();
    };
    sipAmount.addEventListener('input', onRangeInput); sipRate.addEventListener('input', onRangeInput); sipYears.addEventListener('input', onRangeInput);
    if (sipAmountNum) sipAmountNum.addEventListener('input', onNumberInput); if (sipRateNum) sipRateNum.addEventListener('input', onNumberInput);
    if (sipYearsNum) sipYearsNum.addEventListener('input', onNumberInput);
    [sipAmountNum, sipRateNum, sipYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },
  updateSIPDisplays() {
    const sipAmount = document.getElementById('sip-amount'); const sipRate = document.getElementById('sip-rate'); const sipYears = document.getElementById('sip-years');
    if (sipAmount) document.getElementById('sip-amount-display').textContent = formatINR(sipAmount.value);
    if (sipRate) document.getElementById('sip-rate-display').textContent = sipRate.value + '%';
    if (sipYears) document.getElementById('sip-years-display').textContent = sipYears.value + ' Yr';
  },
  calcSIP() {
    const P = parseFloat(document.getElementById('sip-amount')?.value || 10000); const annualR = parseFloat(document.getElementById('sip-rate')?.value || 12);
    const yrs = parseFloat(document.getElementById('sip-years')?.value || 10); const n = yrs * 12; const i = annualR / 12 / 100; const totalInvested = P * n;
    let maturityValue = 0;
    if (i > 0) { maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i); } else { maturityValue = totalInvested; }
    const wealthGain = maturityValue - totalInvested; const totalValEl = document.getElementById('sip-total-value');
    const investedEl = document.getElementById('sip-invested-amount'); const gainsEl = document.getElementById('sip-wealth-gains');
    const barInvested = document.getElementById('sip-bar-invested'); const barGains = document.getElementById('sip-bar-gains');
    if (totalValEl) totalValEl.textContent = formatINR(maturityValue); if (investedEl) investedEl.textContent = formatINR(totalInvested);
    if (gainsEl) gainsEl.textContent = formatINR(wealthGain);
    if (barInvested && barGains && maturityValue > 0) {
      const invPct = (totalInvested / maturityValue) * 100; const gainPct = (wealthGain / maturityValue) * 100; barInvested.style.width = `${invPct}%`;
      barGains.style.width = `${gainPct}%`;
    }
  },
  bindLumpsumInputs() {
    const lsAmount = document.getElementById('ls-amount'); const lsAmountNum = document.getElementById('ls-amount-num'); const lsRate = document.getElementById('ls-rate');
    const lsRateNum = document.getElementById('ls-rate-num'); const lsYears = document.getElementById('ls-years'); const lsYearsNum = document.getElementById('ls-years-num');
    if (!lsAmount) return;
    const onRangeInput = () => {
      if (lsAmountNum) lsAmountNum.value = lsAmount.value; if (lsRateNum) lsRateNum.value = lsRate.value; if (lsYearsNum) lsYearsNum.value = lsYears.value;
      this.updateLumpsumDisplays(); this.calcLumpsum();
    };
    const onNumberInput = () => {
      if (lsAmountNum && lsAmount) lsAmount.value = Math.min(50000000, Math.max(5000, Number(lsAmountNum.value) || 5000));
      if (lsRateNum && lsRate) lsRate.value = Math.min(25, Math.max(4, Number(lsRateNum.value) || 4));
      if (lsYearsNum && lsYears) lsYears.value = Math.min(40, Math.max(1, Number(lsYearsNum.value) || 1)); this.updateLumpsumDisplays(); this.calcLumpsum();
    };
    lsAmount.addEventListener('input', onRangeInput); lsRate.addEventListener('input', onRangeInput); lsYears.addEventListener('input', onRangeInput);
    if (lsAmountNum) lsAmountNum.addEventListener('input', onNumberInput); if (lsRateNum) lsRateNum.addEventListener('input', onNumberInput);
    if (lsYearsNum) lsYearsNum.addEventListener('input', onNumberInput);
    [lsAmountNum, lsRateNum, lsYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },
  updateLumpsumDisplays() {
    const lsAmount = document.getElementById('ls-amount'); const lsRate = document.getElementById('ls-rate'); const lsYears = document.getElementById('ls-years');
    if (lsAmount) document.getElementById('ls-amount-display').textContent = formatINR(lsAmount.value);
    if (lsRate) document.getElementById('ls-rate-display').textContent = lsRate.value + '%';
    if (lsYears) document.getElementById('ls-years-display').textContent = lsYears.value + ' Yr';
  },
  calcLumpsum() {
    const P = parseFloat(document.getElementById('ls-amount')?.value || 100000); const r = parseFloat(document.getElementById('ls-rate')?.value || 12) / 100;
    const t = parseFloat(document.getElementById('ls-years')?.value || 10); const maturityValue = P * Math.pow(1 + r, t); const wealthGain = maturityValue - P;
    const totalValEl = document.getElementById('ls-total-value'); const investedEl = document.getElementById('ls-invested-amount');
    const gainsEl = document.getElementById('ls-wealth-gains'); const barInvested = document.getElementById('ls-bar-invested');
    const barGains = document.getElementById('ls-bar-gains'); if (totalValEl) totalValEl.textContent = formatINR(maturityValue);
    if (investedEl) investedEl.textContent = formatINR(P); if (gainsEl) gainsEl.textContent = formatINR(wealthGain);
    if (barInvested && barGains && maturityValue > 0) {
      const invPct = (P / maturityValue) * 100; const gainPct = (wealthGain / maturityValue) * 100; barInvested.style.width = `${invPct}%`;
      barGains.style.width = `${gainPct}%`;
    }
  },
  bindRetirementInputs() {
    const curAge = document.getElementById('ret-cur-age'); const curAgeNum = document.getElementById('ret-cur-age-num');
    const retAge = document.getElementById('ret-ret-age'); const retAgeNum = document.getElementById('ret-ret-age-num');
    const curExp = document.getElementById('ret-cur-expense'); const curExpNum = document.getElementById('ret-cur-expense-num');
    const expInf = document.getElementById('ret-inflation'); const expInfNum = document.getElementById('ret-inflation-num');
    if (!curAge) return;
    const onRangeInput = () => {
      if (retAge && curAge && Number(retAge.value) <= Number(curAge.value)) { retAge.value = Number(curAge.value) + 1; }
      if (curAgeNum) curAgeNum.value = curAge.value; if (retAgeNum && retAge) retAgeNum.value = retAge.value; if (curExpNum) curExpNum.value = curExp.value;
      if (expInfNum) expInfNum.value = expInf.value; this.updateRetirementDisplays(); this.calcRetirement();
    };
    const onNumberInput = () => {
      if (curAgeNum && curAge) curAge.value = Math.min(65, Math.max(18, Number(curAgeNum.value) || 18));
      if (retAgeNum && retAge) { const minRet = Number(curAge.value) + 1; retAge.value = Math.min(75, Math.max(40, Math.max(minRet, Number(retAgeNum.value) || minRet))); }
      if (curExpNum && curExp) curExp.value = Math.min(1000000, Math.max(10000, Number(curExpNum.value) || 10000));
      if (expInfNum && expInf) expInf.value = Math.min(12, Math.max(3, Number(expInfNum.value) || 3)); this.updateRetirementDisplays(); this.calcRetirement();
    };
    curAge.addEventListener('input', onRangeInput); retAge.addEventListener('input', onRangeInput); curExp.addEventListener('input', onRangeInput);
    expInf.addEventListener('input', onRangeInput); if (curAgeNum) curAgeNum.addEventListener('input', onNumberInput);
    if (retAgeNum) retAgeNum.addEventListener('input', onNumberInput); if (curExpNum) curExpNum.addEventListener('input', onNumberInput);
    if (expInfNum) expInfNum.addEventListener('input', onNumberInput);
    [curAgeNum, retAgeNum, curExpNum, expInfNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },
  updateRetirementDisplays() {
    const curAge = document.getElementById('ret-cur-age'); const retAge = document.getElementById('ret-ret-age'); const curExp = document.getElementById('ret-cur-expense');
    const expInf = document.getElementById('ret-inflation'); if (curAge) document.getElementById('ret-cur-age-display').textContent = curAge.value + ' Yrs';
    if (retAge) document.getElementById('ret-ret-age-display').textContent = retAge.value + ' Yrs';
    if (curExp) document.getElementById('ret-cur-expense-display').textContent = formatINR(curExp.value);
    if (expInf) document.getElementById('ret-inflation-display').textContent = expInf.value + '%';
  },
  calcRetirement() {
    const curAge = parseFloat(document.getElementById('ret-cur-age')?.value || 30); let retAge = parseFloat(document.getElementById('ret-ret-age')?.value || 60);
    if (retAge <= curAge) {
      retAge = curAge + 1; const retAgeSlider = document.getElementById('ret-ret-age'); if (retAgeSlider) retAgeSlider.value = retAge;
      const retAgeDisplay = document.getElementById('ret-ret-age-display'); if (retAgeDisplay) retAgeDisplay.textContent = retAge + ' Yrs';
    }
    const curExp = parseFloat(document.getElementById('ret-cur-expense')?.value || 50000); const inf = parseFloat(document.getElementById('ret-inflation')?.value || 6) / 100;
    const yearsToRet = Math.max(1, retAge - curAge); const lifeExpectancy = 85; const yearsInRet = Math.max(1, lifeExpectancy - retAge);
    const expenseAtRetirement = curExp * Math.pow(1 + inf, yearsToRet); const annualExpenseAtRet = expenseAtRetirement * 12; const postRetReturn = 0.08; const postInf = 0.06;
    const realRate = (postRetReturn - postInf) / (1 + postInf); let requiredCorpus = 0;
    if (Math.abs(realRate) > 0.0001) { requiredCorpus = annualExpenseAtRet * ((1 - Math.pow(1 + realRate, -yearsInRet)) / realRate); } else {
      requiredCorpus = annualExpenseAtRet * yearsInRet;
    }
    const sipReturn = 0.12 / 12; const n = yearsToRet * 12; let requiredSIP = 0;
    if (n > 0 && sipReturn > 0) { requiredSIP = (requiredCorpus * sipReturn) / ((Math.pow(1 + sipReturn, n) - 1) * (1 + sipReturn)); }
    const corpusEl = document.getElementById('ret-required-corpus'); const sipReqEl = document.getElementById('ret-required-sip');
    const futureExpEl = document.getElementById('ret-future-expense'); if (corpusEl) corpusEl.textContent = formatINR(requiredCorpus, true);
    if (sipReqEl) sipReqEl.textContent = formatINR(requiredSIP); if (futureExpEl) futureExpEl.textContent = formatINR(expenseAtRetirement) + ' / mo';
  },
  bindDelayInputs() {
    const delayAmt = document.getElementById('delay-amount'); const delayAmtNum = document.getElementById('delay-amount-num');
    const delayYrs = document.getElementById('delay-years'); const delayYrsNum = document.getElementById('delay-years-num');
    const delayRate = document.getElementById('delay-rate'); const delayRateNum = document.getElementById('delay-rate-num');
    if (!delayAmt) return;
    const onRangeInput = () => {
      if (delayAmtNum) delayAmtNum.value = delayAmt.value; if (delayYrsNum) delayYrsNum.value = delayYrs.value; if (delayRateNum) delayRateNum.value = delayRate.value;
      this.updateDelayDisplays(); this.calcDelay();
    };
    const onNumberInput = () => {
      if (delayAmtNum && delayAmt) delayAmt.value = Math.min(200000, Math.max(1000, Number(delayAmtNum.value) || 1000));
      if (delayYrsNum && delayYrs) delayYrs.value = Math.min(10, Math.max(1, Number(delayYrsNum.value) || 1));
      if (delayRateNum && delayRate) delayRate.value = Math.min(16, Math.max(8, Number(delayRateNum.value) || 8)); this.updateDelayDisplays(); this.calcDelay();
    };
    delayAmt.addEventListener('input', onRangeInput); delayYrs.addEventListener('input', onRangeInput); delayRate.addEventListener('input', onRangeInput);
    if (delayAmtNum) delayAmtNum.addEventListener('input', onNumberInput); if (delayYrsNum) delayYrsNum.addEventListener('input', onNumberInput);
    if (delayRateNum) delayRateNum.addEventListener('input', onNumberInput);
    [delayAmtNum, delayYrsNum, delayRateNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },
  updateDelayDisplays() {
    const delayAmt = document.getElementById('delay-amount'); const delayYrs = document.getElementById('delay-years');
    const delayRate = document.getElementById('delay-rate'); if (delayAmt) document.getElementById('delay-amount-display').textContent = formatINR(delayAmt.value);
    if (delayYrs) document.getElementById('delay-years-display').textContent = delayYrs.value + ' Yr Delay';
    if (delayRate) document.getElementById('delay-rate-display').textContent = delayRate.value + '%';
  },
  calcDelay() {
    const P = parseFloat(document.getElementById('delay-amount')?.value || 15000); const delayYears = parseFloat(document.getElementById('delay-years')?.value || 3);
    const annualR = parseFloat(document.getElementById('delay-rate')?.value || 12);
    const totalHorizon = 25; // 25 years total horizon
    const i = annualR / 12 / 100; const nNow = totalHorizon * 12; const fvNow = P * ((Math.pow(1 + i, nNow) - 1) / i) * (1 + i);
    const nDelayed = Math.max(0, (totalHorizon - delayYears) * 12); const fvDelayed = nDelayed > 0 ? P * ((Math.pow(1 + i, nDelayed) - 1) / i) * (1 + i) : 0;
    const costOfDelay = Math.max(0, fvNow - fvDelayed); const fvNowEl = document.getElementById('delay-fv-now');
    const fvDelayEl = document.getElementById('delay-fv-delayed'); const costEl = document.getElementById('delay-cost-lost');
    if (fvNowEl) fvNowEl.textContent = formatINR(fvNow, true); if (fvDelayEl) fvDelayEl.textContent = formatINR(fvDelayed, true);
    if (costEl) costEl.textContent = formatINR(costOfDelay, true);
  },
  bindInflationInputs() {
    const infPresent = document.getElementById('inf-present-cost'); const infPresentNum = document.getElementById('inf-present-cost-num');
    const infRate = document.getElementById('inf-rate'); const infRateNum = document.getElementById('inf-rate-num'); const infYears = document.getElementById('inf-years');
    const infYearsNum = document.getElementById('inf-years-num'); if (!infPresent) return;
    const onRangeInput = () => {
      if (infPresentNum) infPresentNum.value = infPresent.value; if (infRateNum) infRateNum.value = infRate.value; if (infYearsNum) infYearsNum.value = infYears.value;
      this.updateInflationDisplays(); this.calcInflation();
    };
    const onNumberInput = () => {
      if (infPresentNum && infPresent) infPresent.value = Math.min(20000000, Math.max(100000, Number(infPresentNum.value) || 100000));
      if (infRateNum && infRate) infRate.value = Math.min(12, Math.max(3, Number(infRateNum.value) || 3));
      if (infYearsNum && infYears) infYears.value = Math.min(30, Math.max(1, Number(infYearsNum.value) || 1)); this.updateInflationDisplays(); this.calcInflation();
    };
    infPresent.addEventListener('input', onRangeInput); infRate.addEventListener('input', onRangeInput); infYears.addEventListener('input', onRangeInput);
    if (infPresentNum) infPresentNum.addEventListener('input', onNumberInput); if (infRateNum) infRateNum.addEventListener('input', onNumberInput);
    if (infYearsNum) infYearsNum.addEventListener('input', onNumberInput);
    [infPresentNum, infRateNum, infYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));
  },
  updateInflationDisplays() {
    const infPresent = document.getElementById('inf-present-cost'); const infRate = document.getElementById('inf-rate');
    const infYears = document.getElementById('inf-years'); if (infPresent) document.getElementById('inf-present-cost-display').textContent = formatINR(infPresent.value);
    if (infRate) document.getElementById('inf-rate-display').textContent = infRate.value + '%';
    if (infYears) document.getElementById('inf-years-display').textContent = infYears.value + ' Yrs';
  },
  calcInflation() {
    const present = parseFloat(document.getElementById('inf-present-cost')?.value || 2500000); const r = parseFloat(document.getElementById('inf-rate')?.value || 6) / 100;
    const t = parseFloat(document.getElementById('inf-years')?.value || 15); const futureCost = present * Math.pow(1 + r, t); const costIncrease = futureCost - present;
    const futureEl = document.getElementById('inf-future-cost'); const increaseEl = document.getElementById('inf-cost-increase');
    if (futureEl) futureEl.textContent = formatINR(futureCost, true); if (increaseEl) increaseEl.textContent = '+' + formatINR(costIncrease, true);
  }
};
const FinancialProducts = {
  init() {
    const tabs = document.querySelectorAll('.fs-product-nav-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-pressed', t === btn ? 'true' : 'false'); }); btn.classList.add('active');
        const tabKey = btn.getAttribute('data-fs-tab');
        document.querySelectorAll('.fs-product-panel').forEach(panel => { panel.classList.remove('active'); panel.style.display = 'none'; });
        const targetPanel = document.getElementById(`fs-panel-${tabKey}`);
        if (targetPanel) { targetPanel.classList.add('active'); targetPanel.style.display = 'block'; }
        if (window.location.hash.startsWith('#/financial-services')) {
          const newHash = '#/financial-services' + (tabKey === 'mutual-funds' ? '' : '/' + tabKey);
          history.replaceState(null, '', newHash);
        }
      });
    });
  }
};
const ContactForm = {
  busy: false,
  init() {
    const form = document.getElementById('lead-inquiry-form'); const interestSelect = document.getElementById('inquiry-vertical');
    const investmentFields = document.getElementById('conditional-investment-fields');
    const educationFields = document.getElementById('conditional-education-fields');
    if (interestSelect) {
      interestSelect.addEventListener('change', () => {
        const val = interestSelect.value; if (investmentFields) investmentFields.style.display = (val === 'investments') ? 'block' : 'none';
        if (educationFields) educationFields.style.display = (val === 'education') ? 'block' : 'none';
      });
    }
    ['form-phone', 'form-email', 'form-name', 'form-consent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.addEventListener('input', () => el.setCustomValidity('')); el.addEventListener('change', () => el.setCustomValidity('')); }
    });
    if (form) { form.addEventListener('submit', (e) => this.handleSubmit(e)); }
    const modalForm = document.getElementById('modal-lead-inquiry-form'); const closeBtn = document.getElementById('close-inquiry-modal');
    const modalOverlay = document.getElementById('inquiry-modal');
    if (closeBtn) { closeBtn.addEventListener('click', () => this.closeInquiryModal()); }
    if (modalOverlay) { modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) this.closeInquiryModal(); }); }
    const modalVertical = document.getElementById('modal-inquiry-vertical'); const modalInvestFields = document.getElementById('modal-conditional-investment-fields');
    const modalEducationFields = document.getElementById('modal-conditional-education-fields');
    if (modalVertical) {
      const syncModalConditional = () => {
        const val = modalVertical.value; if (modalInvestFields) modalInvestFields.style.display = (val === 'investments') ? 'block' : 'none';
        if (modalEducationFields) modalEducationFields.style.display = (val === 'education') ? 'block' : 'none';
      };
      modalVertical.addEventListener('change', syncModalConditional); syncModalConditional();
    }
    if (modalForm) { modalForm.addEventListener('submit', (e) => this.handleModalSubmit(e)); }
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('a[href="#/contact"], a[href="#contact"], .btn-contact-popup, [data-open-modal="inquiry"]');
      if (trigger) {
        e.preventDefault(); const vertical = trigger.getAttribute('data-prefill-vertical') || 'investments'; const asset = trigger.getAttribute('data-prefill-sub') || '';
        this.openInquiryModal({ vertical, asset });
      }
    });
  },
  openInquiryModal(prefill = {}) {
    const modal = document.getElementById('inquiry-modal'); if (!modal) return; const vEl = document.getElementById('modal-inquiry-vertical');
    if (vEl) { vEl.value = prefill.vertical || 'investments'; vEl.dispatchEvent(new Event('change')); }
    const aEl = document.getElementById('modal-form-investment-type');
    if (aEl) {
      aEl.selectedIndex = 0;
      if (prefill.asset) {
        for (let i = 0; i < aEl.options.length; i++) {
          const val = aEl.options[i].value;
          if (val === prefill.asset || val.includes(prefill.asset) || prefill.asset.includes(val)) { aEl.selectedIndex = i; break; }
        }
      }
    }
    const errEl = document.getElementById('modal-inquiry-status'); if (errEl) errEl.style.display = 'none';
    if (typeof ModalA11y !== 'undefined' && ModalA11y.open) { ModalA11y.open(modal); } else { modal.classList.add('active'); }
    const nameInput = document.getElementById('modal-form-name'); if (nameInput) setTimeout(() => nameInput.focus(), 150);
  },
  closeInquiryModal() {
    const modal = document.getElementById('inquiry-modal'); if (!modal) return;
    if (typeof ModalA11y !== 'undefined' && ModalA11y.close) { ModalA11y.close(modal); } else { modal.classList.remove('active'); }
  },
  async handleModalSubmit(e) {
    e.preventDefault();
    const form = e.target; const submitBtn = document.getElementById('btn-modal-inquiry-submit'); const statusEl = document.getElementById('modal-inquiry-status');
    const nameEl = document.getElementById('modal-form-name'); const emailEl = document.getElementById('modal-form-email');
    const phoneEl = document.getElementById('modal-form-phone'); const verticalEl = document.getElementById('modal-inquiry-vertical');
    const assetEl = document.getElementById('modal-form-investment-type'); const bracketEl = document.getElementById('modal-form-investment-bracket');
    const eduTopicEl = document.getElementById('modal-form-edu-topic'); const notesEl = document.getElementById('modal-form-notes'); const name = nameEl?.value.trim() || '';
    const email = emailEl?.value.trim() || ''; const phone = phoneEl?.value.trim() || ''; const vertical = verticalEl?.value || 'investments';
    const notes = notesEl?.value.trim() || ''; if (statusEl) statusEl.style.display = 'none';
    if (!name || !email || !phone) {
      if (statusEl) {
        statusEl.style.display = 'block'; statusEl.style.background = '#fef2f2'; statusEl.style.color = '#dc2626'; statusEl.style.border = '1px solid #fecaca';
        statusEl.textContent = 'Please provide your full name, email address, and contact number.';
      }
      return;
    }
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting inquiry...'; }
    const fallbackId = `IRAH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const payload = { name: name, email: email, phone: phone, vertical: vertical, investmentInterest: vertical === 'investments' ? (assetEl?.value || 'N/A') : 'N/A', investmentBracket: vertical === 'investments' ? (bracketEl?.value || 'N/A') : 'N/A', educationTopic: vertical === 'education' ? (eduTopicEl?.value || 'N/A') : 'N/A', message: notes, consent: { given: true, notice_version: '2026-10', at: new Date().toISOString() }, timestamp: new Date().toISOString() };
    let delivered = false; let assignedId = fallbackId; let serverRejectionMsg = '';
    try {
      const resp = await fetch('/api/enquire', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.reference_id) {
          assignedId = data.reference_id;
          delivered = !(data.email_delivery === 'not_configured' || data.email_delivery === 'fallback');
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        serverRejectionMsg = errData.error || errData.message || `Submission rejected (HTTP ${resp.status}). Please check your inputs.`;
      }
    } catch (err) {
      console.warn('API error:', err);
    } finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Inquiry →'; } }
    if (serverRejectionMsg) {
      if (statusEl) {
        statusEl.style.display = 'block'; statusEl.style.background = '#fef2f2'; statusEl.style.color = '#dc2626'; statusEl.style.border = '1px solid #fecaca';
        statusEl.textContent = serverRejectionMsg;
      }
      return;
    }
    payload.reference_id = assignedId; payload.delivered = delivered;
    if (!delivered) {
      try {
        const existing = JSON.parse(localStorage.getItem('irah_inquiries') || '[]'); existing.push(payload);
        while (existing.length > 5) existing.shift();
        localStorage.setItem('irah_inquiries', JSON.stringify(existing));
      } catch (err) { console.warn('LocalStorage error:', err); }
    }
    form.reset(); if (verticalEl) verticalEl.dispatchEvent(new Event('change')); this.closeInquiryModal(); this.openReceiptModal(payload, delivered);
  },
  async handleSubmit(e) {
    e.preventDefault(); const form = e.target; const submitBtn = form.querySelector('[type="submit"]'); if (this.busy) return;
    const nameEl = document.getElementById('form-name'); const emailEl = document.getElementById('form-email'); const phoneEl = document.getElementById('form-phone');
    const name = nameEl?.value.trim() || ''; const email = emailEl?.value.trim() || ''; const phone = phoneEl?.value.trim() || '';
    const vertical = document.getElementById('inquiry-vertical')?.value || 'investments'; const message = document.getElementById('form-message')?.value.trim() || '';
    if (nameEl) { nameEl.setCustomValidity(name.length > 0 ? '' : 'Please enter your name.'); }
    if (emailEl) { emailEl.setCustomValidity(email.length > 0 ? '' : 'Please enter your email address.'); }
    if (phoneEl) { phoneEl.setCustomValidity(phone.length > 0 ? '' : 'Please enter your contact number.'); }
    if (!form.reportValidity()) return; const cleanPhone = phone; this.busy = true; if (submitBtn) submitBtn.disabled = true;
    const fallbackId = `IRAH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const payload = { name: name, email: email, phone: cleanPhone, vertical: vertical, investmentInterest: vertical === 'investments' ? (document.getElementById('form-investment-type')?.value || 'N/A') : 'N/A', investmentBracket: vertical === 'investments' ? (document.getElementById('form-investment-bracket')?.value || 'N/A') : 'N/A', educationTopic: vertical === 'education' ? (document.getElementById('form-edu-topic')?.value || 'N/A') : 'N/A', message: message, consent: { given: true, notice_version: '2026-10', at: new Date().toISOString() }, timestamp: new Date().toISOString() };
    let delivered = false; let assignedId = fallbackId; let serverRejectionMsg = '';
    try {
      const resp = await fetch('/api/enquire', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.reference_id) {
          assignedId = data.reference_id;
          delivered = !(data.email_delivery === 'not_configured' || data.email_delivery === 'fallback');
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        serverRejectionMsg = errData.error || errData.message || `Submission rejected (HTTP ${resp.status}). Please check your inputs.`;
      }
    } catch (err) { } finally { this.busy = false; if (submitBtn) submitBtn.disabled = false; }
    if (serverRejectionMsg) { this.showToast(serverRejectionMsg, 'error'); return; }
    payload.reference_id = assignedId; payload.delivered = delivered;
    if (delivered) {
      form.reset(); const interestSelect = document.getElementById('inquiry-vertical');
      if (interestSelect) { interestSelect.dispatchEvent(new Event('change')); }
    } else {
      try {
        const existing = JSON.parse(localStorage.getItem('irah_inquiries') || '[]'); existing.push(payload);
        while (existing.length > 5) existing.shift();
        localStorage.setItem('irah_inquiries', JSON.stringify(existing));
      } catch (err) { console.warn('LocalStorage error:', err); }
    }
    this.openReceiptModal(payload, delivered);
  },
  openReceiptModal(data, delivered = false) {
    const modal = document.getElementById('inquiry-success-modal'); const titleEl = document.getElementById('receipt-modal-title');
    const msgEl = document.getElementById('receipt-modal-msg'); const statusEl = document.getElementById('receipt-modal-status');
    const detailsContainer = document.getElementById('receipt-details');
    if (titleEl) { titleEl.textContent = delivered ? 'Inquiry Received' : 'Saved on This Device Only'; }
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
      const safe = (v) => sanitizeHTML(String(v ?? ''));
      detailsContainer.innerHTML = `<div style="background: var(--slate-50); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--slate-200); font-size: 0.875rem;"> <p><strong>Reference ID:</strong> <span id="receipt-ref" style="color:var(--gold-700); font-weight:700;">${safe(data.reference_id || 'IRAH-LOGGED')}</span></p> <p><strong>Name:</strong> ${safe(data.name)}</p> <p><strong>Contact:</strong> ${safe(data.email)} | ${safe(data.phone)}</p> <p><strong>Inquiry Track:</strong> ${safe((data.vertical || '').toUpperCase())}</p> <p><strong>Timestamp:</strong> ${safe(new Date(data.timestamp).toLocaleString())}</p> </div>`;
    }
    if (modal) ModalA11y.open(modal);
  },
  showToast(message, type = 'info') {
    let toast = document.getElementById('live-toast');
    if (!toast) {
      toast = document.createElement('div'); toast.id = 'live-toast'; toast.className = 'toast-msg'; toast.setAttribute('role', 'alert');
      document.body.appendChild(toast);
    }
    toast.textContent = message; toast.className = `toast-msg show ${type}`; if (this._t) clearTimeout(this._t);
    this._t = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
};
const KnowledgeRepository = {
  init() {
    const searchInput = document.getElementById('reg-search-input'); const filterPills = document.querySelectorAll('.reg-filter-pill');
    const emptyMsg = document.getElementById('repo-empty'); if (!searchInput) return; let activeFilter = 'all';
    const filterCards = () => {
      const term = searchInput.value.toLowerCase().trim(); const cards = document.querySelectorAll('#view-knowledge-repository .reg-card'); let visibleCount = 0;
      cards.forEach(card => {
        const category = card.getAttribute('data-category'); const text = card.textContent.toLowerCase(); const matchesCat = activeFilter === 'all' || category === activeFilter;
        const matchesTerm = !term || text.includes(term);
        if (matchesCat && matchesTerm) {
          card.style.display = 'flex';
          visibleCount++; } else { card.style.display = 'none'; }
      });
      if (emptyMsg) { emptyMsg.hidden = visibleCount > 0; }
    };
    searchInput.addEventListener('input', filterCards);
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); }); pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true'); activeFilter = pill.getAttribute('data-filter') || 'all'; filterCards();
      });
    });
  }
};
const InsightsViewer = {
  articles: {
    'asset-allocation-2026': { title: 'Asset Allocation Concepts: A Plain-Language Primer', category: 'Investor Education', readTime: '2 min read', body: `<p>Asset allocation means dividing money across asset classes such as equity, debt and gold. Investor-education material from SEBI and AMFI describes it as a major driver of a portfolio's risk profile. How much to hold in each class depends on an individual's goals, horizon and tax position, and is determined by the investor after reviewing the relevant scheme documents.</p> <h4 style="margin: 1.25rem 0 0.5rem; color: var(--navy-900);">Core-Satellite, Described Neutrally</h4> <p>Some investors hold a diversified core and a smaller set of concentrated holdings. This increases complexity, cost and liquidity risk, and does not assure higher returns.</p> <h4 style="margin: 1.25rem 0 0.5rem; color: var(--navy-900);">Managing Liquidity and Risk</h4> <p>Balancing liquidity reserves across liquid funds and fixed income instruments helps manage cash flow requirements during market drawdowns without forced liquidation of equity assets.</p> <div style="background: var(--navy-50); padding: 1rem; border-left: 4px solid var(--navy-900); margin-top: 1.5rem; font-size: 0.85rem;"> <strong>Distributor Notice:</strong> IRAH Services LLP acts solely as a mutual fund distributor and referral intermediary. All scheme documents and risk disclosures must be thoroughly evaluated before allocation. Informational note · Reviewed Oct 2026. </div>` },
    'pms-vs-aif-demystified': { title: 'PMS and AIF: Structural Nuances for HNI Investors', category: 'Product Information', readTime: '2 min read', body: `<p>Portfolio Management Services (PMS) and Alternative Investment Funds (AIF) are specialized high-ticket investment vehicles regulated under distinct SEBI frameworks. Understanding their structural and tax nuances is essential before making any allocation decision.</p> <div class="data-table-wrap table-scroll" tabindex="0" role="region" aria-label="PMS vs AIF Comparison"> <table class="data-table" style="margin: 0.5rem 0;"> <thead> <tr><th scope="col">Attribute</th><th scope="col">Portfolio Management Services (PMS)</th><th scope="col">Alternative Investment Funds (AIF)</th></tr> </thead> <tbody> <tr><td>Minimum Ticket</td><td>₹50 Lakhs (SEBI Mandated)</td><td>₹1.00 Crore (Cat I, II, III; SEBI exceptions apply)</td></tr> <tr><td>Holding Structure</td><td>Held directly in investor Demat account</td><td>Pooled vehicle (Trust / LLP / Company)</td></tr> <tr><td>Tax Treatment</td><td>Investor taxed on own capital gains per trade (securities held in investor name)</td><td>Pass-through for Cat I/II; Fund level for Cat III</td></tr> <tr><td>Derivatives Usage</td><td>Hedging and portfolio rebalancing only</td><td>Permitted per strategy SID / PPM within regulatory limits</td></tr> </tbody> </table> </div> <p style="margin-top: 1rem;">IRAH Services LLP facilitates client access to SEBI-registered portfolio managers and Category I, II and III AIF managers. Choosing a product is the investor's own decision after reading its disclosure document or PPM. Informational note · Reviewed Oct 2026.</p>` },
    'fixed-income-yield-curve': { title: 'Fixed Income Instruments & Section 54EC Capital Gains Bonds', category: 'Capital Preservation', readTime: '2 min read', body: `<p>Fixed income instruments provide portfolio ballast and periodic cash flows. Yields, credit risk and tax implications vary substantially across categories.</p> <h4 style="margin: 1.25rem 0 0.5rem; color: var(--navy-900);">Regulated Fixed Income Building Blocks:</h4> <ul style="padding-left: 1.5rem; margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.8;"> <li><strong>Section 54EC Capital Gains Bonds:</strong> Section 54EC allows exemption of long-term capital gains on land or building if invested in specified bonds within 6 months of transfer, up to ₹50 Lakhs across the year of transfer and the next, with a 5-year lock-in. Issued by named public sector entities (REC, PFC, IRFC, NHAI; not sovereign-guaranteed).</li> <li><strong>Rated Corporate Non-Convertible Debentures (NCDs):</strong> Coupon schedules as set by the issuer; credit risk applies. Issued by corporates and NBFCs rated by SEBI-registered credit rating agencies.</li> <li><strong>Sovereign Gold Bonds (SGB):</strong> Government of India securities issued by RBI. No new tranches have been issued since February 2024; existing series trade on stock exchanges at market prices.</li> </ul> <p style="font-size:0.85rem; color:var(--slate-500);">Informational note · Reviewed Oct 2026.</p>` }
  },
  init() {
    const modal = document.getElementById('insight-modal'); const closeBtn = document.getElementById('close-insight-modal');
    document.querySelectorAll('[data-insight-id]').forEach(card => {
      card.setAttribute('role', 'button'); card.tabIndex = 0; const open = () => this.openArticle(card.getAttribute('data-insight-id'));
      card.addEventListener('click', open); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => ModalA11y.close(modal)); modal.addEventListener('click', (e) => { if (e.target === modal) ModalA11y.close(modal); });
    }
    const receiptModal = document.getElementById('inquiry-success-modal'); const closeReceipt = document.getElementById('close-receipt-modal');
    const receiptAckBtn = document.getElementById('receipt-ack-btn') || document.getElementById('receipt-close-btn');
    if (closeReceipt && receiptModal) { closeReceipt.addEventListener('click', () => ModalA11y.close(receiptModal)); }
    if (receiptAckBtn && receiptModal) { receiptAckBtn.addEventListener('click', () => ModalA11y.close(receiptModal)); }
    if (receiptModal) { receiptModal.addEventListener('click', (e) => { if (e.target === receiptModal) ModalA11y.close(receiptModal); }); }
    window.addEventListener('keydown', (e) => { ModalA11y.key(e); });
    document.getElementById('copy-ref-btn')?.addEventListener('click', async () => {
      const ref = document.getElementById('receipt-ref')?.textContent.trim() || '';
      try {
        await navigator.clipboard.writeText(ref);
      } catch (_) { const t = document.createElement('textarea'); t.value = ref; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
      const status = document.getElementById('copy-ref-status'); if (status) status.textContent = 'Reference copied'; const btn = document.getElementById('copy-ref-btn');
      if (btn) { const orig = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = orig; }, 2000); }
    });
  },
  openArticle(id) {
    const article = this.articles[id]; if (!article) return;
    const modal = document.getElementById('insight-modal'); const titleEl = document.getElementById('insight-modal-title');
    const metaEl = document.getElementById('insight-modal-meta'); const bodyEl = document.getElementById('insight-modal-body');
    if (titleEl) titleEl.textContent = article.title;
    if (metaEl) metaEl.innerHTML = `<span class="badge badge-navy">${article.category}</span> <span>•</span> <span>${article.readTime}</span>`;
    if (bodyEl) bodyEl.innerHTML = article.body; if (modal) ModalA11y.open(modal);
  }
};
const MobileNav = {
  init() {
    const toggle = document.querySelector('.mobile-toggle'); const nav = document.querySelector('.nav-menu'); const header = document.querySelector('.main-header'); if (!toggle || !nav) return;
    const mq = window.matchMedia('(max-width: 960px)');
    const closeMenu = (focusToggle = false) => {
      nav.classList.remove('mobile-open'); toggle.innerHTML = '&#9776;'; toggle.setAttribute('aria-expanded', 'false');
      nav.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('dropdown-open'); const trig = item.querySelector('.dropdown-trigger'); if (trig) trig.setAttribute('aria-expanded', 'false');
      });
      if (focusToggle) toggle.focus();
    };
    toggle.addEventListener('click', (e) => {
      e.stopPropagation(); const isOpen = nav.classList.toggle('mobile-open'); toggle.innerHTML = isOpen ? '&times;' : '&#9776;';
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', e => {
        if (link.classList.contains('dropdown-trigger') && mq.matches) {
          e.preventDefault(); const parentItem = link.closest('.nav-item');
          if (parentItem) { const isOpen = parentItem.classList.toggle('dropdown-open'); link.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); }
          return;
        }
        closeMenu(false);
      });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('mobile-open')) { closeMenu(true); } });
    document.addEventListener('click', (e) => { if (header ? !header.contains(e.target) : (!nav.contains(e.target) && !toggle.contains(e.target))) { closeMenu(false); } });
    window.addEventListener('hashchange', () => closeMenu(false));
  }
};
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('skip-link')?.addEventListener('click', () => {
    const h = document.querySelector('.page-view-container.active h1');
    if (h) { h.tabIndex = -1; h.focus(); }
  });
  document.querySelectorAll('[data-prefill-vertical]').forEach(a => {
    a.addEventListener('click', () => {
      requestAnimationFrame(() => {
        const s = document.getElementById('inquiry-vertical');
        if (s) { s.value = a.dataset.prefillVertical; s.dispatchEvent(new Event('change')); }
      });
    });
  });
  Router.init(); Calculators.init(); initSelfAssessment(); FinancialProducts.init(); ContactForm.init(); KnowledgeRepository.init(); InsightsViewer.init();
  MobileNav.init(); IrahAcronymEtymology.init(); if (typeof LoansP2PStudio !== 'undefined' && LoansP2PStudio.init) { LoansP2PStudio.init(); }
});
const IrahAcronymEtymology = {
  pillars: [
    { letter: 'I', word: 'Investments', caption: 'Disciplined capital allocation across regulated market instruments.' },
    { letter: 'R', word: 'Returns', caption: 'Risk-aligned, long-term compounding across market cycles.' },
    { letter: 'A', word: 'Actualization', caption: 'Turning life milestones and family aspirations into reality.' },
    { letter: 'H', word: 'Happiness', caption: 'Structural clarity, peace of mind, and intergenerational security.' }
  ],
  activeIndex: 0,
  cycleTimer: null,
  isHovering: false,
  _initialized: false,
  init() {
    if (this._initialized) return; const rail = document.getElementById('irah-etymology-rail'); const wordmark = document.getElementById('about-irah-wordmark');
    if (!rail || !wordmark) return; this._initialized = true;
    const chars = wordmark.querySelectorAll('.irah-char'); const nodes = rail.querySelectorAll('.irah-pillar-node');
    const bindInteractive = (el, idx) => {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { this.isHovering = true; this.stopCycle(); this.setActive(idx); } });
      el.addEventListener('click', () => { this.setActive(idx); if (!this.isHovering) { this.startCycle(); } });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault(); const next = (idx + 1) % this.pillars.length; this.setActive(next); nodes[next]?.focus(); this.startCycle();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault(); const prev = (idx - 1 + this.pillars.length) % this.pillars.length; this.setActive(prev); nodes[prev]?.focus(); this.startCycle();
        } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.setActive(idx); this.startCycle(); }
      });
    };
    chars.forEach((ch, idx) => bindInteractive(ch, idx)); nodes.forEach((nd, idx) => bindInteractive(nd, idx));
    const handlePointerLeave = (e) => { if (e.pointerType === 'mouse') { this.isHovering = false; this.startCycle(); } };
    wordmark.addEventListener('pointerleave', handlePointerLeave); rail.addEventListener('pointerleave', handlePointerLeave);
    const aboutView = document.getElementById('view-about');
    if (aboutView && aboutView.classList.contains('active')) { this.onEnterAbout(); }
  },
  onEnterAbout() {
    this.init(); this.isHovering = false; this.setActive(0); this.startCycle();
  },
  setActive(idx) {
    this.activeIndex = idx; const rail = document.getElementById('irah-etymology-rail'); const wordmark = document.getElementById('about-irah-wordmark');
    if (!rail || !wordmark) return; const chars = wordmark.querySelectorAll('.irah-char'); const nodes = rail.querySelectorAll('.irah-pillar-node');
    chars.forEach((c, i) => c.classList.toggle('is-active', i === idx));
    nodes.forEach((n, i) => { const active = i === idx; n.classList.toggle('is-active', active); n.setAttribute('aria-pressed', active ? 'true' : 'false'); });
    this.updateCaption(idx);
  },
  updateCaption(idx) {
    const pillar = this.pillars[idx]; if (!pillar) return;
    const capWrap = document.getElementById('irah-etymology-caption'); const letterEl = document.getElementById('irah-caption-letter');
    const textEl = document.getElementById('irah-caption-text'); if (!capWrap || !letterEl || !textEl) return;
    if (letterEl.textContent === pillar.letter && textEl.textContent === pillar.caption) return; capWrap.classList.add('is-switching'); clearTimeout(this._capTimer);
    this._capTimer = setTimeout(() => {
      letterEl.textContent = pillar.letter; textEl.textContent = pillar.caption; capWrap.classList.remove('is-switching');
    }, 120);
  },
  startCycle() {
    this.stopCycle();
    this.cycleTimer = setInterval(() => {
      const aboutView = document.getElementById('view-about');
      if (!aboutView || !aboutView.classList.contains('active') || this.isHovering) return; const next = (this.activeIndex + 1) % this.pillars.length;
      this.setActive(next);
    }, 2600);
  },
  stopCycle() { if (this.cycleTimer) { clearInterval(this.cycleTimer); this.cycleTimer = null; } }
};
const P2PConceptPlayer = {
  DURATION: 10000,
  CH_LEN: 2500,
  chapters: [
    {
      badge: '01 · Allocation',
      caption: 'KYC-verified lender transfers capital directly from their bank account after selecting loans.'
    },
    {
      badge: '02 · Bank Escrow · T+1',
      caption: "Funds route via segregated bank-appointed trustee escrow accounts (T+1 settlement · zero platform custody)."
    },
    {
      badge: '03 · Diversification',
      caption: 'Capital splits across screened borrowers from ₹250 per loan (RBI max ₹50,000 per borrower).'
    },
    {
      badge: '04 · Monthly Repayments',
      caption: "Scheduled borrower EMIs return via Borrowers' Escrow directly to the lender's bank account."
    }
  ],
  _initialized: false,
  _running: false,
  _rafId: null,
  _elapsed: 0,
  _lastTs: 0,
  _lastChapter: -1,
  _width: 0,
  _height: 0,
  _dpr: 1,
  _resizeObs: null,
  _canvas: null,
  _ctx: null,

  init() {
    if (this._initialized) return;
    const canvas = document.getElementById('p2p-concept-canvas');
    if (!canvas) return;
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    if (!this._ctx) return;
    this._initialized = true;

    document.querySelectorAll('#view-loans-p2p .p2p-chapter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-p2p-chapter') || '0', 10);
        if (!Number.isNaN(idx)) this.seekChapter(idx);
      });
    });

    const stage = document.getElementById('p2p-canvas-stage');
    if (stage && typeof ResizeObserver !== 'undefined') {
      this._resizeObs = new ResizeObserver(() => {
        this.resize();
        if (!this._running && this.isViewActive()) this.renderFrame(this._elapsed);
      });
      this._resizeObs.observe(stage);
    }
    window.addEventListener('resize', () => {
      if (this.isViewActive()) {
        this.resize();
        if (!this._running) this.renderFrame(this._elapsed);
      }
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._stopLoop();
      } else if (this.isViewActive()) {
        this._startLoop();
      }
    });

    this.resize();
    this.syncUI(0);
    this.renderFrame(0);
  },

  isViewActive() {
    const view = document.getElementById('view-loans-p2p');
    return Boolean(view && view.classList.contains('active'));
  },

  resize() {
    const canvas = this._canvas;
    const stage = document.getElementById('p2p-canvas-stage');
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const cssW = Math.max(260, Math.round(rect.width || stage.clientWidth || 960));
    const isPortrait = cssW < 640;
    const cssH = isPortrait ? Math.round(Math.max(360, Math.min(430, cssW * 1.05))) : Math.round(Math.min(420, Math.max(350, cssW * 0.37)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (this._width !== cssW || this._height !== cssH || this._dpr !== dpr) {
      this._width = cssW;
      this._height = cssH;
      this._dpr = dpr;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
  },

  start() {
    this.init();
    if (!this._initialized) return;
    this.resize();
    this.syncUI(this._elapsed);
    this.renderFrame(this._elapsed);
    this._startLoop();
  },

  stop() {
    this._stopLoop();
  },

  seekChapter(index) {
    const clamped = Math.max(0, Math.min(this.chapters.length - 1, index));
    this._elapsed = clamped * this.CH_LEN + 25;
    this._lastTs = performance.now();
    this.syncUI(this._elapsed);
    this.renderFrame(this._elapsed);
    if (this.isViewActive() && !this._running) {
      this._startLoop();
    }
  },

  _startLoop() {
    if (this._running || !this._initialized) return;
    this._running = true;
    this._lastTs = performance.now();
    const step = (now) => {
      if (!this._running) return;
      if (!this.isViewActive() || document.hidden) {
        this._stopLoop();
        return;
      }
      const dt = Math.min(50, Math.max(0, now - this._lastTs));
      this._lastTs = now;
      this._elapsed = (this._elapsed + dt) % this.DURATION;
      this.syncUI(this._elapsed);
      this.renderFrame(this._elapsed);
      this._rafId = requestAnimationFrame(step);
    };
    this._rafId = requestAnimationFrame(step);
  },

  _stopLoop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  },

  syncUI(ms) {
    const ch = Math.min(3, Math.floor(ms / this.CH_LEN));
    const localP = (ms % this.CH_LEN) / this.CH_LEN;
    const pills = document.querySelectorAll('#view-loans-p2p .p2p-chapter-pill');
    pills.forEach((pill, i) => {
      const active = i === ch;
      pill.classList.toggle('is-active', active);
      pill.setAttribute('aria-selected', active ? 'true' : 'false');
      const fill = i < ch ? 1 : (i === ch ? localP : 0);
      pill.style.setProperty('--p2p-ch-progress', fill.toFixed(4));
    });

    if (ch !== this._lastChapter) {
      this._lastChapter = ch;
      const meta = this.chapters[ch];
      const badge = document.getElementById('p2p-chapter-badge');
      const cap = document.getElementById('p2p-chapter-caption');
      if (badge && meta) badge.textContent = meta.badge;
      if (cap && meta) cap.textContent = meta.caption;
    }
  },

  _smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },

  _cubic(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return {
      x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
    };
  },

  _roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  },

  _drawParticle(ctx, curve, t, radius, coreColor, glowColor, alpha) {
    if (t < 0 || t > 1 || alpha <= 0.02) return;
    const steps = 14;
    const trailSpan = 0.115;
    const pts = [];
    for (let s = steps; s >= 0; s--) {
      const ts = t - (s / steps) * trailSpan;
      if (ts < 0) continue;
      const pt = this._cubic(curve[0], curve[1], curve[2], curve[3], ts);
      pts.push({ x: pt.x, y: pt.y, frac: 1 - s / (steps + 1) });
    }
    if (pts.length >= 2) {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const f = b.frac;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = radius * (0.42 + f * 1.45);
        ctx.globalAlpha = alpha * Math.pow(f, 1.35) * 0.42;
        ctx.stroke();

        if (f > 0.48) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = radius * (0.22 + f * 0.68);
          ctx.globalAlpha = alpha * Math.pow(f, 1.8) * 0.72;
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    const head = this._cubic(curve[0], curve[1], curve[2], curve[3], t);
    const halo = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, radius * 3.4);
    halo.addColorStop(0, coreColor);
    halo.addColorStop(0.38, glowColor);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(head.x, head.y, radius * 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFDF5';
    ctx.beginPath();
    ctx.arc(head.x, head.y, radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  },

  _drawFlowChevron(ctx, curve, t, strokeStyle, alpha) {
    if (alpha <= 0.02) return;
    const p0 = this._cubic(curve[0], curve[1], curve[2], curve[3], Math.max(0, t - 0.015));
    const p1 = this._cubic(curve[0], curve[1], curve[2], curve[3], Math.min(1, t + 0.015));
    const pt = this._cubic(curve[0], curve[1], curve[2], curve[3], t);
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(ang);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -3.5);
    ctx.lineTo(2.5, 0);
    ctx.lineTo(-4, 3.5);
    ctx.stroke();
    ctx.restore();
  },

  renderFrame(ms) {
    const ctx = this._ctx;
    if (!ctx || !this._width || !this._height) return;
    const W = this._width;
    const H = this._height;
    const isPortrait = W < 640;

    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const ch = Math.min(3, Math.floor(ms / this.CH_LEN));
    const p = (ms % this.CH_LEN) / this.CH_LEN;
    const tSec = ms / 1000;

    const weights = [0.22, 0.22, 0.22, 0.22];
    const fadeIn = this._smoothstep(0, 0.13, p);
    const fadeOut = 1 - this._smoothstep(0.88, 1, p);
    const activeGain = 0.78 * Math.min(fadeIn, fadeOut);
    weights[ch] = 0.22 + activeGain;
    const prevCh = (ch + 3) % 4;
    if (p < 0.14) weights[prevCh] = 0.22 + 0.55 * (1 - p / 0.14);

    // 1. Clean Velvety Obsidian Navy Studio Backdrop
    const bgGrad = ctx.createRadialGradient(W * 0.46, H * 0.48, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.76);
    bgGrad.addColorStop(0, '#0C1B3A');
    bgGrad.addColorStop(0.56, '#071124');
    bgGrad.addColorStop(1, '#040914');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Bolder, Well-Proportioned Geometry (Desktop Widescreen vs Mobile Portrait)
    let lender, vault, lendersBox, borrowersBox, borrowers, allocCurve, returnCurveA, returnCurveB;

    if (!isPortrait) {
      lender = { x: W * 0.125, y: H * 0.49, r: Math.min(44, Math.max(33, W * 0.04)) };
      const vw = Math.min(254, Math.max(194, W * 0.248));
      const vh = Math.min(224, H * 0.58);
      vault = { x: W * 0.445 - vw / 2, y: H * 0.49 - vh / 2, w: vw, h: vh, cx: W * 0.445, cy: H * 0.49 };
      const pad = 13;
      const chH = (vh - pad * 2 - 30) / 2;
      lendersBox = { x: vault.x + pad, y: vault.y + pad, w: vw - pad * 2, h: chH };
      borrowersBox = { x: vault.x + pad, y: vault.y + vh - pad - chH, w: vw - pad * 2, h: chH };

      borrowers = [];
      const cols = 3;
      const rows = 5;
      const xStart = W * 0.725;
      const xEnd = W * 0.92;
      const yStart = H * 0.20;
      const yEnd = H * 0.80;
      for (let c = 0; c < cols; c++) {
        const cf = c / (cols - 1);
        for (let r = 0; r < rows; r++) {
          const rf = r / (rows - 1);
          const archOffset = Math.sin(rf * Math.PI) * 9 * (c === 0 ? -1 : c === 2 ? 0.6 : 0);
          borrowers.push({
            x: xStart + cf * (xEnd - xStart) + archOffset,
            y: yStart + rf * (yEnd - yStart),
            r: 8,
            idx: c * rows + r
          });
        }
      }

      const lPort = { x: lender.x + lender.r + 3, y: lender.y - 7 };
      const leIn = { x: lendersBox.x, y: lendersBox.y + lendersBox.h * 0.5 };
      allocCurve = [
        lPort,
        { x: (lPort.x + leIn.x) * 0.48, y: lPort.y - H * 0.14 },
        { x: (lPort.x + leIn.x) * 0.58, y: leIn.y - H * 0.04 },
        leIn
      ];

      const beOut = { x: borrowersBox.x, y: borrowersBox.y + borrowersBox.h * 0.55 };
      const lRet = { x: lender.x + lender.r * 0.75, y: lender.y + lender.r * 0.7 };
      returnCurveB = [
        beOut,
        { x: (beOut.x + lRet.x) * 0.52, y: beOut.y + H * 0.09 },
        { x: (beOut.x + lRet.x) * 0.44, y: lRet.y + H * 0.15 },
        lRet
      ];
      returnCurveA = { x: borrowersBox.x + borrowersBox.w, y: borrowersBox.y + borrowersBox.h * 0.5 };
    } else {
      lender = { x: W * 0.5, y: 62, r: 26 };
      const vw = Math.min(W - 24, 344);
      const vh = 118;
      vault = { x: W * 0.5 - vw / 2, y: 142, w: vw, h: vh, cx: W * 0.5, cy: 142 + vh / 2 };
      const pad = W < 340 ? 8 : 11;
      const gap = W < 340 ? 8 : 12;
      const halfW = (vw - pad * 2 - gap) / 2;
      lendersBox = { x: vault.x + pad, y: vault.y + 24, w: halfW, h: vh - 50 };
      borrowersBox = { x: vault.x + vw - pad - halfW, y: vault.y + 24, w: halfW, h: vh - 50 };

      borrowers = [];
      const rows = 2;
      const cols = 6;
      const xPad = Math.max(26, W * 0.1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cf = c / (cols - 1);
          borrowers.push({
            x: xPad + cf * (W - xPad * 2),
            y: 338 + r * 52 + Math.sin(cf * Math.PI) * 8,
            r: W < 340 ? 5.8 : 6.5,
            idx: r * cols + c
          });
        }
      }

      const lPort = { x: lender.x - lender.r * 0.78, y: lender.y + lender.r * 0.65 };
      const leIn = { x: lendersBox.x + lendersBox.w * 0.5, y: vault.y };
      allocCurve = [
        lPort,
        { x: leIn.x - 24, y: lPort.y + 20 },
        { x: leIn.x - 10, y: leIn.y - 24 },
        leIn
      ];

      const beOut = { x: borrowersBox.x + borrowersBox.w * 0.5, y: vault.y };
      const lRet = { x: lender.x + lender.r * 0.78, y: lender.y + lender.r * 0.65 };
      returnCurveB = [
        beOut,
        { x: beOut.x + 12, y: beOut.y - 26 },
        { x: lRet.x + 28, y: lRet.y + 18 },
        lRet
      ];
      returnCurveA = { x: borrowersBox.x + borrowersBox.w * 0.5, y: vault.y + vault.h };
    }

    // 2b. Gliding Stage Spotlight
    const anchors = !isPortrait
      ? [
          { x: (lender.x + vault.cx) * 0.48, y: H * 0.46 },
          { x: vault.cx, y: vault.cy },
          { x: (vault.cx + W * 0.82) * 0.56, y: H * 0.49 },
          { x: (lender.x + vault.cx) * 0.5, y: H * 0.54 }
        ]
      : [
          { x: W * 0.5, y: 112 },
          { x: W * 0.5, y: vault.cy },
          { x: W * 0.5, y: 360 },
          { x: W * 0.5, y: 150 }
        ];
    const spotMix = this._smoothstep(0, 0.22, p);
    const sx = anchors[prevCh].x + (anchors[ch].x - anchors[prevCh].x) * spotMix;
    const sy = anchors[prevCh].y + (anchors[ch].y - anchors[prevCh].y) * spotMix;
    const spotR = Math.min(W, H) * 0.64;
    const spotGrad = ctx.createRadialGradient(sx, sy, 10, sx, sy, spotR);
    spotGrad.addColorStop(0, ch === 3 ? 'rgba(52, 211, 153, 0.11)' : 'rgba(223, 190, 118, 0.11)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, W, H);

    // 3. Draw Allocation Highway (Ch 0)
    const w0 = weights[0];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(allocCurve[0].x, allocCurve[0].y);
    ctx.bezierCurveTo(allocCurve[1].x, allocCurve[1].y, allocCurve[2].x, allocCurve[2].y, allocCurve[3].x, allocCurve[3].y);
    ctx.strokeStyle = 'rgba(216, 183, 117, ' + (0.16 + w0 * 0.54).toFixed(3) + ')';
    ctx.lineWidth = 2.1 + w0 * 1.5;
    ctx.stroke();
    ctx.restore();
    this._drawFlowChevron(ctx, allocCurve, 0.34, '#EBCF93', 0.28 + w0 * 0.56);
    this._drawFlowChevron(ctx, allocCurve, 0.68, '#EBCF93', 0.28 + w0 * 0.56);

    if (w0 > 0.25 || ch === 1) {
      const streamAlpha = ch === 0 ? 1 : (ch === 1 ? Math.max(0, 1 - p * 1.6) * 0.85 : w0);
      for (let i = 0; i < 5; i++) {
        const ptT = ((tSec * 0.62 + i * 0.2) % 1);
        this._drawParticle(ctx, allocCurve, ptT, 4.0, '#F7E7BE', '#C5A059', streamAlpha);
      }
    }

    // 4. Draw Diversification Fan-Out Curves (Ch 2)
    const w2 = weights[2];
    const leOut = !isPortrait
      ? { x: lendersBox.x + lendersBox.w, y: lendersBox.y + lendersBox.h * 0.5 }
      : { x: lendersBox.x + lendersBox.w * 0.5, y: vault.y + vault.h };

    const fanCurves = borrowers.map((b) => {
      if (!isPortrait) {
        return [
          leOut,
          { x: leOut.x + (b.x - leOut.x) * 0.45, y: leOut.y },
          { x: leOut.x + (b.x - leOut.x) * 0.56, y: b.y },
          { x: b.x - b.r - 2, y: b.y }
        ];
      }
      return [
        leOut,
        { x: leOut.x, y: leOut.y + (b.y - leOut.y) * 0.46 },
        { x: b.x, y: leOut.y + (b.y - leOut.y) * 0.55 },
        { x: b.x, y: b.y - b.r - 2 }
      ];
    });

    fanCurves.forEach((curve, idx) => {
      const stagger = (idx / borrowers.length) * 0.36;
      const reveal = ch === 2 ? this._smoothstep(stagger, stagger + 0.34, p) : 1;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(curve[0].x, curve[0].y);
      ctx.bezierCurveTo(curve[1].x, curve[1].y, curve[2].x, curve[2].y, curve[3].x, curve[3].y);
      ctx.strokeStyle = 'rgba(216, 183, 117, ' + ((0.09 + w2 * 0.36) * reveal).toFixed(3) + ')';
      ctx.lineWidth = ch === 2 ? 1.35 : 0.95;
      ctx.stroke();
      ctx.restore();

      if (ch === 2) {
        const sparkT = ((p - stagger * 0.85) * 1.45);
        if (sparkT >= 0 && sparkT <= 1) {
          this._drawParticle(ctx, curve, sparkT, 3.0, '#FFF7DE', '#D8B775', Math.sin(sparkT * Math.PI) * 0.96);
        }
        const sparkT2 = sparkT - 0.48;
        if (sparkT2 >= 0 && sparkT2 <= 1) {
          this._drawParticle(ctx, curve, sparkT2, 2.5, '#F7E7BE', '#C5A059', Math.sin(sparkT2 * Math.PI) * 0.74);
        }
      }
    });

    // 5. Draw Monthly Repayment Return Arcs (Ch 3)
    const w3 = weights[3];
    const returnSources = !isPortrait
      ? [borrowers[1], borrowers[3], borrowers[7], borrowers[11], borrowers[13]].filter(Boolean)
      : [borrowers[1], borrowers[3], borrowers[5], borrowers[7], borrowers[9], borrowers[11]].filter(Boolean);
    const returnSrcMap = new Map();
    returnSources.forEach((src, i) => returnSrcMap.set(src.idx, i));

    const emiCurvesA = returnSources.map((b) => {
      if (!isPortrait) {
        return [
          { x: b.x - b.r, y: b.y + 2 },
          { x: (b.x + returnCurveA.x) * 0.52, y: Math.max(b.y, returnCurveA.y) + 28 },
          { x: returnCurveA.x + 42, y: returnCurveA.y + 18 },
          returnCurveA
        ];
      }
      return [
        { x: b.x, y: b.y - b.r },
        { x: Math.max(b.x, returnCurveA.x) + 18, y: (b.y + returnCurveA.y) * 0.55 },
        { x: returnCurveA.x + 12, y: returnCurveA.y + 28 },
        returnCurveA
      ];
    });

    emiCurvesA.forEach((curve, idx) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(curve[0].x, curve[0].y);
      ctx.bezierCurveTo(curve[1].x, curve[1].y, curve[2].x, curve[2].y, curve[3].x, curve[3].y);
      ctx.strokeStyle = 'rgba(52, 211, 153, ' + (0.08 + w3 * 0.34).toFixed(3) + ')';
      ctx.lineWidth = ch === 3 ? 1.4 : 0.95;
      ctx.stroke();
      ctx.restore();

      if (ch === 3) {
        const ptT = ((p * 1.35 + idx * 0.14) % 1);
        this._drawParticle(ctx, curve, ptT, 3.0, '#D1FAE5', '#34D399', 0.94 * Math.min(1, p * 4));
      }
    });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(returnCurveB[0].x, returnCurveB[0].y);
    ctx.bezierCurveTo(returnCurveB[1].x, returnCurveB[1].y, returnCurveB[2].x, returnCurveB[2].y, returnCurveB[3].x, returnCurveB[3].y);
    ctx.strokeStyle = 'rgba(52, 211, 153, ' + (0.14 + w3 * 0.58).toFixed(3) + ')';
    ctx.lineWidth = 2.1 + w3 * 1.5;
    ctx.stroke();
    ctx.restore();
    this._drawFlowChevron(ctx, returnCurveB, 0.34, '#6EE7B7', 0.24 + w3 * 0.6);
    this._drawFlowChevron(ctx, returnCurveB, 0.68, '#6EE7B7', 0.24 + w3 * 0.6);

    if (ch === 3) {
      for (let i = 0; i < 5; i++) {
        const ptT = ((tSec * 0.68 + i * 0.2) % 1);
        this._drawParticle(ctx, returnCurveB, ptT, 4.0, '#ECFDF5', '#34D399', 0.96);
      }
    }

    // 6. Draw Dual Bank-Appointed Trustee Escrow Vault (Centerpiece)
    const w1 = weights[1];
    ctx.save();
    const auraR = Math.max(vault.w, vault.h) * (0.7 + w1 * 0.18);
    const aura = ctx.createRadialGradient(vault.cx, vault.cy, 12, vault.cx, vault.cy, auraR);
    aura.addColorStop(0, 'rgba(216, 183, 117, ' + (0.06 + w1 * 0.14).toFixed(3) + ')');
    aura.addColorStop(0.6, 'rgba(16, 185, 129, ' + (0.02 + w3 * 0.08).toFixed(3) + ')');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(vault.cx, vault.cy, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing security outline in Chapter 2
    if (ch === 1) {
      const pulse = (p * 1.6) % 1;
      const expand = pulse * 18;
      this._roundRect(ctx, vault.x - expand, vault.y - expand, vault.w + expand * 2, vault.h + expand * 2, 18 + expand * 0.4);
      ctx.strokeStyle = 'rgba(223, 190, 118, ' + ((1 - pulse) * 0.38).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Vault outer shell
    this._roundRect(ctx, vault.x, vault.y, vault.w, vault.h, 14);
    const vGrad = ctx.createLinearGradient(vault.x, vault.y, vault.x, vault.y + vault.h);
    vGrad.addColorStop(0, 'rgba(16, 31, 60, 0.96)');
    vGrad.addColorStop(1, 'rgba(8, 16, 34, 0.98)');
    ctx.fillStyle = vGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(223, 190, 118, ' + (0.34 + w1 * 0.51).toFixed(3) + ')';
    ctx.lineWidth = 1.5 + w1 * 0.5;
    ctx.stroke();

    // Top-edge specular catchlight
    ctx.beginPath();
    ctx.moveTo(vault.x + 18, vault.y + 1);
    ctx.lineTo(vault.x + vault.w - 18, vault.y + 1);
    ctx.strokeStyle = 'rgba(247, 231, 190, ' + (0.24 + w1 * 0.34).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Specular verification sweep across vault during Chapter 2
    if (ch === 1) {
      ctx.save();
      this._roundRect(ctx, vault.x + 1, vault.y + 1, vault.w - 2, vault.h - 2, 13);
      ctx.clip();
      const sweepX = vault.x - vault.w * 0.4 + p * (vault.w * 1.8);
      const swGrad = ctx.createLinearGradient(sweepX - 38, vault.y, sweepX + 38, vault.y + vault.h);
      swGrad.addColorStop(0, 'rgba(235, 207, 147, 0)');
      swGrad.addColorStop(0.5, 'rgba(235, 207, 147, 0.16)');
      swGrad.addColorStop(1, 'rgba(235, 207, 147, 0)');
      ctx.fillStyle = swGrad;
      ctx.fillRect(vault.x, vault.y, vault.w, vault.h);
      ctx.restore();
    }

    // Lenders' Escrow chamber + left gold accent bar + level bar
    const leGlow = Math.max(w0, w1, w2);
    this._roundRect(ctx, lendersBox.x, lendersBox.y, lendersBox.w, lendersBox.h, 8);
    ctx.fillStyle = 'rgba(216, 183, 117, ' + (0.065 + leGlow * 0.11).toFixed(3) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(216, 183, 117, ' + (0.26 + leGlow * 0.48).toFixed(3) + ')';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    this._roundRect(ctx, lendersBox.x + 5, lendersBox.y + 9, 3, lendersBox.h - 20, 1.5);
    ctx.fillStyle = '#DFBE76';
    ctx.fill();

    const leLevel = ch === 0
      ? 0.22 + this._smoothstep(0.12, 0.92, p) * 0.72
      : (ch === 1 ? 0.94 - p * 0.06 : (ch === 2 ? Math.max(0.18, 0.88 - this._smoothstep(0.1, 0.9, p) * 0.7) : 0.18));
    const leTrackW = Math.max(24, lendersBox.w - 28);
    this._roundRect(ctx, lendersBox.x + 14, lendersBox.y + lendersBox.h - 7, leTrackW, 2.5, 1.25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    this._roundRect(ctx, lendersBox.x + 14, lendersBox.y + lendersBox.h - 7, leTrackW * leLevel, 2.5, 1.25);
    ctx.fillStyle = 'rgba(235, 207, 147, ' + (0.46 + leGlow * 0.48).toFixed(3) + ')';
    ctx.fill();

    // Borrowers' Escrow chamber + left emerald accent bar + level bar
    const beGlow = Math.max(w1 * 0.7, w3);
    this._roundRect(ctx, borrowersBox.x, borrowersBox.y, borrowersBox.w, borrowersBox.h, 8);
    ctx.fillStyle = 'rgba(16, 185, 129, ' + (0.065 + beGlow * 0.12).toFixed(3) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, ' + (0.24 + beGlow * 0.5).toFixed(3) + ')';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    this._roundRect(ctx, borrowersBox.x + 5, borrowersBox.y + 9, 3, borrowersBox.h - 20, 1.5);
    ctx.fillStyle = '#34D399';
    ctx.fill();

    const beLevel = ch === 3 ? 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2)) : 0.22;
    const beTrackW = Math.max(24, borrowersBox.w - 28);
    this._roundRect(ctx, borrowersBox.x + 14, borrowersBox.y + borrowersBox.h - 7, beTrackW, 2.5, 1.25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    this._roundRect(ctx, borrowersBox.x + 14, borrowersBox.y + borrowersBox.h - 7, beTrackW * beLevel, 2.5, 1.25);
    ctx.fillStyle = 'rgba(52, 211, 153, ' + (0.42 + beGlow * 0.54).toFixed(3) + ')';
    ctx.fill();

    // Chamber Typography
    const chFontMain = !isPortrait ? '12px' : (W < 340 ? '8.5px' : '9.8px');
    const chFontSub = !isPortrait ? '10px' : (W < 340 ? '7.5px' : '8.4px');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + chFontMain + ' "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillStyle = '#F7E7BE';
    ctx.fillText("LENDERS' ESCROW", lendersBox.x + lendersBox.w / 2 + 2, lendersBox.y + lendersBox.h * 0.36);
    ctx.font = '500 ' + chFontSub + ' Inter, sans-serif';
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText('Inflow · Disbursal', lendersBox.x + lendersBox.w / 2 + 2, lendersBox.y + lendersBox.h * 0.63);

    ctx.font = '700 ' + chFontMain + ' "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText("BORROWERS' ESCROW", borrowersBox.x + borrowersBox.w / 2 + 2, borrowersBox.y + borrowersBox.h * 0.36);
    ctx.font = '500 ' + chFontSub + ' Inter, sans-serif';
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText('EMI Repayment Pool', borrowersBox.x + borrowersBox.w / 2 + 2, borrowersBox.y + borrowersBox.h * 0.63);

    // Plain Architectural T+1 Status Divider (zero pill bubble)
    const sealY = !isPortrait ? vault.cy : vault.y + vault.h - 14;
    if (!isPortrait) {
      ctx.strokeStyle = 'rgba(216, 183, 117, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vault.x + 14, sealY);
      ctx.lineTo(vault.cx - 56, sealY);
      ctx.moveTo(vault.cx + 56, sealY);
      ctx.lineTo(vault.x + vault.w - 14, sealY);
      ctx.stroke();
    }

    if (ch === 1) {
      const ckAlpha = this._smoothstep(0.12, 0.35, p);
      ctx.save();
      ctx.globalAlpha = ckAlpha;
      const cxTick = vault.cx - 42;
      ctx.beginPath();
      ctx.moveTo(cxTick - 3.5, sealY + 0.5);
      ctx.lineTo(cxTick - 1, sealY + 3);
      ctx.lineTo(cxTick + 4, sealY - 2.5);
      ctx.strokeStyle = '#6EE7B7';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = '700 10px "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillStyle = ch === 1 ? '#ECFDF5' : '#EBCF93';
    ctx.fillText(ch === 1 ? 'T+1 VERIFIED' : 'T+1 SETTLEMENT', ch === 1 ? vault.cx + 7 : vault.cx, sealY + 0.5);

    // Vault Outer / Header Labels
    if (!isPortrait) {
      ctx.font = '700 11px "Plus Jakarta Sans", Inter, sans-serif';
      ctx.fillStyle = '#DFBE76';
      ctx.fillText('BANK-APPOINTED TRUSTEE ESCROW', vault.cx, vault.y - 16);
      ctx.font = '500 10.5px Inter, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Zero Platform Custody · RBI Norms', vault.cx, vault.y + vault.h + 18);
    } else {
      ctx.font = '700 ' + (W < 340 ? '8.5px' : '9.5px') + ' "Plus Jakarta Sans", Inter, sans-serif';
      ctx.fillStyle = '#DFBE76';
      ctx.fillText('BANK TRUSTEE ESCROW · ZERO CUSTODY', vault.cx, vault.y + 13);
    }
    ctx.restore();

    // 7. Draw Lender Node (Bolder & Clean)
    const lGlow = Math.max(w0, w3);
    ctx.save();
    if (ch === 3) {
      const rp = (tSec * 0.9) % 1;
      ctx.beginPath();
      ctx.arc(lender.x, lender.y, lender.r + rp * 26, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(52, 211, 153, ' + ((1 - rp) * 0.55).toFixed(3) + ')';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Quiet static architectural bezel ring
    ctx.beginPath();
    ctx.arc(lender.x, lender.y, lender.r + 8, 0, Math.PI * 2);
    ctx.strokeStyle = ch === 3 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(216, 183, 117, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const lGrad = ctx.createRadialGradient(lender.x - 8, lender.y - 8, 2, lender.x, lender.y, lender.r);
    lGrad.addColorStop(0, '#1D3365');
    lGrad.addColorStop(1, '#09142B');
    ctx.beginPath();
    ctx.arc(lender.x, lender.y, lender.r, 0, Math.PI * 2);
    ctx.fillStyle = lGrad;
    ctx.fill();
    ctx.strokeStyle = ch === 3 ? '#34D399' : '#DFBE76';
    ctx.lineWidth = 2.2 + lGlow * 0.7;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 ' + (isPortrait ? '21px' : '28px') + ' "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillStyle = ch === 3 ? '#A7F3D0' : '#F7E3AC';
    ctx.fillText('₹', lender.x, lender.y + 1);

    if (!isPortrait) {
      ctx.font = '700 12.5px "Plus Jakarta Sans", Inter, sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('LENDER', lender.x, lender.y + lender.r + 24);
      ctx.font = '500 10.5px Inter, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Bank Account', lender.x, lender.y + lender.r + 41);
    } else {
      ctx.textAlign = 'left';
      ctx.font = '700 11px "Plus Jakarta Sans", Inter, sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('LENDER', lender.x + lender.r + 16, lender.y - 6);
      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Bank Account', lender.x + lender.r + 16, lender.y + 10);
    }
    ctx.restore();

    // 8. Draw Bolder Borrower Constellation Pool (15 desktop / 12 portrait, zero floating pills)
    ctx.save();
    const bHeaderX = !isPortrait ? W * 0.822 : W * 0.5;
    const bHeaderY = !isPortrait ? H * 0.08 : 448;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 11px "Plus Jakarta Sans", Inter, sans-serif';
    ctx.fillStyle = ch === 2 ? '#F7E7BE' : '#CBD5E1';
    ctx.fillText('CREDIT-SCREENED BORROWER POOL', bHeaderX, bHeaderY);
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Fractional loans from ₹250+', bHeaderX, bHeaderY + 15);

    borrowers.forEach((b, idx) => {
      const stagger = (idx / borrowers.length) * 0.36;
      const landAt = 0.24 + (idx / borrowers.length) * 0.42;
      const lit = ch === 2 ? this._smoothstep(landAt, landAt + 0.16, p) : (ch === 3 ? 0.72 : 0.22);

      // Expanding golden landing ripple as comet reaches borrower in Ch 2
      if (ch === 2) {
        const sparkT = (p - stagger * 0.85) * 1.45;
        if (sparkT >= 0.92 && sparkT <= 1.38) {
          const imp = (sparkT - 0.92) / 0.46;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + imp * 16, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(247, 231, 190, ' + ((1 - imp) * 0.62).toFixed(3) + ')';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      // Outbound emerald pulse on repaying borrowers in Ch 3
      if (ch === 3 && returnSrcMap.has(b.idx)) {
        const rIdx = returnSrcMap.get(b.idx);
        const rpB = ((p * 1.35 + rIdx * 0.14) % 1);
        if (rpB < 0.45) {
          const outImp = rpB / 0.45;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + outImp * 13, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(52, 211, 153, ' + ((1 - outImp) * 0.55).toFixed(3) + ')';
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      }

      if (lit > 0.35) {
        const haloR = b.r + 6 + lit * 5;
        const bAura = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, haloR);
        bAura.addColorStop(0, ch === 3 ? 'rgba(52, 211, 153, 0.46)' : 'rgba(235, 207, 147, 0.5)');
        bAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bAura;
        ctx.beginPath();
        ctx.arc(b.x, b.y, haloR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = lit > 0.45 ? (ch === 3 ? '#064E3B' : '#2C2312') : '#0F1D38';
      ctx.fill();
      ctx.strokeStyle = ch === 3
        ? 'rgba(52, 211, 153, ' + (0.34 + lit * 0.65).toFixed(3) + ')'
        : 'rgba(223, 190, 118, ' + (0.28 + lit * 0.72).toFixed(3) + ')';
      ctx.lineWidth = 1.4 + lit * 0.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = lit > 0.45 ? (ch === 3 ? '#A7F3D0' : '#F7E7BE') : 'rgba(148, 163, 184, 0.62)';
      ctx.fill();
    });
    ctx.restore();
  }
};

const LoansP2PStudio = {
  _initialized: false,
  sliceSize: 500,
  borrowerTenure: 6,

  _inr(val, compact = false) {
    if (typeof formatINR === 'function') return formatINR(val, compact);
    const num = Number.isFinite(Number(val)) ? Math.round(Number(val)) : 0;
    if (compact) {
      if (num >= 9999500) return '₹' + (num / 1e7).toFixed(2) + ' Cr';
      if (num >= 99995) return '₹' + (num / 1e5).toFixed(2) + ' L';
    }
    return '₹' + num.toLocaleString('en-IN');
  },

  init() {
    if (this._initialized) return;
    const view = document.getElementById('view-loans-p2p');
    if (!view) return;
    this._initialized = true;

    // Mode toggle (Lenders / Borrowers)
    const modeBtns = view.querySelectorAll('.p2p-mode-btn');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-p2p-mode') || 'investor';
        modeBtns.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        const invPanel = document.getElementById('p2p-panel-investor');
        const borPanel = document.getElementById('p2p-panel-borrower');
        if (invPanel) invPanel.classList.toggle('is-active', mode === 'investor');
        if (borPanel) borPanel.classList.toggle('is-active', mode === 'borrower');
      });
    });

    // Investor sliders
    ['p2p-amount', 'p2p-rate', 'p2p-tenure'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.syncPresets();
          this.updateInvestor();
        });
      }
    });

    // Quick portfolio amount presets
    view.querySelectorAll('.p2p-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-p2p-preset');
        const slider = document.getElementById('p2p-amount');
        if (slider && val) {
          slider.value = val;
          this.syncPresets();
          this.updateInvestor();
        }
      });
    });

    // Fractional slice-size pills
    const sliceBtns = view.querySelectorAll('.p2p-slice-btn');
    sliceBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sz = parseInt(btn.getAttribute('data-p2p-slice') || '500', 10);
        if (!Number.isNaN(sz) && sz > 0) {
          this.sliceSize = sz;
          sliceBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
          this.updateInvestor();
        }
      });
    });

    // Borrower controls
    const bAmt = document.getElementById('p2p-b-amount');
    if (bAmt) bAmt.addEventListener('input', () => this.updateBorrower());

    const bTenBtns = view.querySelectorAll('.p2p-b-tenure-btn');
    bTenBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mo = parseInt(btn.getAttribute('data-b-tenure') || '6', 10);
        if (!Number.isNaN(mo) && mo > 0) {
          this.borrowerTenure = mo;
          bTenBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
          this.updateBorrower();
        }
      });
    });

    this.syncPresets();
    this.updateInvestor();
    this.updateBorrower();
    P2PConceptPlayer.init();

    if (view.classList.contains('active')) {
      this.onEnter();
    }
  },

  onEnter() {
    this.init();
    this.updateInvestor();
    this.updateBorrower();
    requestAnimationFrame(() => {
      P2PConceptPlayer.start();
    });
  },

  onLeave() {
    P2PConceptPlayer.stop();
  },

  _setRangeFill(input) {
    if (!input) return;
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const val = parseFloat(input.value) || min;
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
    input.style.setProperty('--p2p-pct', pct.toFixed(2) + '%');
  },

  syncPresets() {
    const slider = document.getElementById('p2p-amount');
    if (!slider) return;
    const cur = String(slider.value);
    document.querySelectorAll('#view-loans-p2p .p2p-preset-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-p2p-preset') === cur);
    });
  },

  updateInvestor() {
    const amtEl = document.getElementById('p2p-amount');
    const rateEl = document.getElementById('p2p-rate');
    const tenEl = document.getElementById('p2p-tenure');
    if (!amtEl || !rateEl || !tenEl) return;

    this.syncPresets();
    this._setRangeFill(amtEl);
    this._setRangeFill(rateEl);
    this._setRangeFill(tenEl);

    const amount = Math.max(25000, Math.min(5000000, Number(amtEl.value) || 250000));
    const rate = Math.max(10, Math.min(18, Number(rateEl.value) || 12));
    const tenure = Math.max(3, Math.min(36, Number(tenEl.value) || 12));

    const monthlyEMI = this._calcEMI(amount, rate, tenure);
    const totalPayout = monthlyEMI * tenure;
    const totalInterest = Math.max(0, totalPayout - amount);
    const breakEvenMonth = monthlyEMI > 0 ? Math.min(tenure, amount / monthlyEMI) : tenure;
    const estBorrowers = Math.max(1, Math.round(amount / this.sliceSize));
    const sharePct = 100 / estBorrowers;
    const needsCA = amount > 1000000;

    const amtVal = document.getElementById('p2p-amount-val');
    const rateVal = document.getElementById('p2p-rate-val');
    const tenVal = document.getElementById('p2p-tenure-val');
    if (amtVal) amtVal.textContent = this._inr(amount);
    if (rateVal) rateVal.textContent = rate.toFixed(1) + '% p.a.*';
    if (tenVal) tenVal.textContent = tenure + ' Months';

    const kEmi = document.getElementById('p2p-kpi-emi');
    const kTot = document.getElementById('p2p-kpi-total');
    const kInt = document.getElementById('p2p-kpi-interest');
    const kBor = document.getElementById('p2p-kpi-borrowers');
    if (kEmi) kEmi.textContent = this._inr(monthlyEMI, monthlyEMI >= 1000000) + '/mo';
    if (kTot) kTot.textContent = this._inr(totalPayout, totalPayout >= 1000000);
    if (kInt) kInt.textContent = '+' + this._inr(totalInterest, totalInterest >= 1000000);
    if (kBor) kBor.textContent = estBorrowers.toLocaleString('en-IN');

    const perBor = document.getElementById('p2p-per-borrower');
    if (perBor) {
      const pctLabel = sharePct < 0.01 ? '<0.01%' : sharePct.toFixed(2) + '%';
      perBor.textContent = this._inr(this.sliceSize) + ' (' + pctLabel + ')';
    }
    const caStatus = document.getElementById('p2p-ca-status');
    if (caStatus) {
      caStatus.textContent = needsCA ? 'Required (₹50L Net Worth)' : 'Not required (≤ ₹10L)';
      caStatus.classList.toggle('is-alert', needsCA);
    }

    this.renderGrowthSVG(amount, monthlyEMI, tenure, totalPayout, breakEvenMonth);
    this.renderDiversifySVG(estBorrowers, sharePct);
  },

  renderGrowthSVG(amount, monthlyEMI, tenure, totalPayout, breakEvenMonth) {
    const svg = document.getElementById('p2p-growth-svg');
    if (!svg) return;
    const W = 600;
    const H = 230;
    const padL = 62;
    const padR = 26;
    const padT = 26;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const minY = 0;
    const maxY = Math.max(totalPayout * 1.14, amount * 1.16);
    const spanY = Math.max(1, maxY - minY);
    const xOf = (m) => padL + (m / tenure) * plotW;
    const yOf = (v) => padT + plotH - ((v - minY) / spanY) * plotH;

    const pts = [];
    for (let m = 0; m <= tenure; m++) {
      const v = m * monthlyEMI;
      pts.push({ x: xOf(m), y: yOf(v), m, v });
    }

    const lineD = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1)).join(' ');
    const baseY = yOf(amount);
    const areaD = lineD + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (padT + plotH).toFixed(1) + ' L' + padL + ',' + (padT + plotH).toFixed(1) + ' Z';
    const last = pts[pts.length - 1];
    const midMonth = Math.round(tenure / 2);

    const gridVals = [maxY * 0.25, maxY * 0.50, maxY * 0.75];
    const gridMarkup = gridVals.map((gv) => {
      const gy = yOf(gv).toFixed(1);
      return '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="rgba(148,163,184,0.14)" stroke-width="1"/>'
        + '<text x="' + (padL - 8) + '" y="' + (Number(gy) + 3.5).toFixed(1) + '" text-anchor="end" fill="#94A3B8" font-size="10" font-family="Inter,sans-serif">' + this._inr(gv, true) + '</text>';
    }).join('');

    const bx = xOf(breakEvenMonth);
    const showBreakEven = breakEvenMonth > 0 && breakEvenMonth < tenure;
    const breakEvenMarkup = showBreakEven
      ? '<circle cx="' + bx.toFixed(1) + '" cy="' + baseY.toFixed(1) + '" r="7" fill="rgba(52,211,153,0.18)"/>'
        + '<circle cx="' + bx.toFixed(1) + '" cy="' + baseY.toFixed(1) + '" r="3.8" fill="#34D399" stroke="#050A16" stroke-width="1.4"/>'
        + ((bx - padL > 260)
          ? '<text x="' + (bx - 8).toFixed(1) + '" y="' + (baseY - 7).toFixed(1) + '" text-anchor="end" fill="#6EE7B7" font-size="9.5" font-weight="700" font-family="Inter,sans-serif">Break-even ~Mo ' + breakEvenMonth.toFixed(1) + '</text>'
          : '')
      : '';

    const endLabel = this._inr(totalPayout, true);

    svg.innerHTML =
      '<defs>'
      + '<linearGradient id="p2pGrowthFill" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="#D8B775" stop-opacity="0.34"/>'
      + '<stop offset="100%" stop-color="#C5A059" stop-opacity="0.02"/>'
      + '</linearGradient>'
      + '<linearGradient id="p2pGrowthStroke" x1="0" y1="0" x2="1" y2="0">'
      + '<stop offset="0%" stop-color="#C5A059"/>'
      + '<stop offset="100%" stop-color="#F7E7BE"/>'
      + '</linearGradient>'
      + '</defs>'
      + gridMarkup
      + '<path d="' + areaD + '" fill="url(#p2pGrowthFill)"/>'
      + '<line x1="' + padL + '" y1="' + baseY.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + baseY.toFixed(1) + '" stroke="#64748B" stroke-width="1.35" stroke-dasharray="5 5"/>'
      + '<text x="' + (padL + 6) + '" y="' + (baseY - 7).toFixed(1) + '" text-anchor="start" fill="#94A3B8" font-size="9.5" font-weight="600" font-family="Inter,sans-serif">Principal Deployed (' + this._inr(amount, true) + ')</text>'
      + '<path d="' + lineD + '" fill="none" stroke="url(#p2pGrowthStroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
      + breakEvenMarkup
      + '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="8" fill="rgba(235,207,147,0.22)"/>'
      + '<circle cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="4.2" fill="#F7E7BE" stroke="#060C1A" stroke-width="1.5"/>'
      + '<text x="' + last.x.toFixed(1) + '" y="' + Math.max(14, last.y - 11).toFixed(1) + '" text-anchor="end" fill="#F7E7BE" font-size="11.5" font-weight="700" font-family="Plus Jakarta Sans,Inter,sans-serif">' + endLabel + '</text>'
      + '<text x="' + padL + '" y="' + (H - 10) + '" text-anchor="start" fill="#94A3B8" font-size="10" font-family="Inter,sans-serif">Month 0</text>'
      + '<text x="' + xOf(midMonth).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" fill="#94A3B8" font-size="10" font-family="Inter,sans-serif">Month ' + midMonth + '</text>'
      + '<text x="' + (W - padR) + '" y="' + (H - 10) + '" text-anchor="end" fill="#EBCF93" font-size="10" font-weight="700" font-family="Inter,sans-serif">Month ' + tenure + '</text>';
  },

  renderDiversifySVG(estBorrowers, sharePct) {
    const svg = document.getElementById('p2p-diversify-svg');
    if (!svg) return;
    const cx = 120;
    const cy = 120;
    const r = 88;
    const segCount = this.sliceSize === 250
      ? Math.min(54, Math.max(18, Math.round(Math.sqrt(estBorrowers) * 2.2)))
      : (this.sliceSize === 1000
        ? Math.min(28, Math.max(10, Math.round(Math.sqrt(estBorrowers) * 1.4)))
        : Math.min(40, Math.max(14, Math.round(Math.sqrt(estBorrowers) * 1.8))));

    const palette = ['#C5A059', '#14254B', '#D8B775', '#1D3365', '#10B981', '#294685'];
    const gapDeg = segCount > 40 ? 2.1 : 3.0;
    const spanDeg = (360 / segCount) - gapDeg;
    let arcs = '';

    for (let i = 0; i < segCount; i++) {
      const a0 = (-90 + i * (360 / segCount)) * Math.PI / 180;
      const a1 = (-90 + i * (360 / segCount) + spanDeg) * Math.PI / 180;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const color = palette[i % palette.length];
      arcs += '<path d="M ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + '" fill="none" stroke="' + color + '" stroke-width="14" stroke-linecap="butt"/>';
    }

    const shareLabel = sharePct < 0.01 ? '<0.01% / borrower' : sharePct.toFixed(2) + '% / borrower';
    const countLabel = estBorrowers.toLocaleString('en-IN');

    svg.innerHTML =
      '<circle cx="120" cy="120" r="103" fill="none" stroke="rgba(197,160,89,0.22)" stroke-width="1" stroke-dasharray="3 4"/>'
      + '<circle cx="120" cy="120" r="71" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>'
      + arcs
      + '<text x="120" y="109" text-anchor="middle" fill="#0A142A" font-size="28" font-weight="800" font-family="Plus Jakarta Sans,Inter,sans-serif">' + countLabel + '</text>'
      + '<text x="120" y="128" text-anchor="middle" fill="#64748B" font-size="9.5" font-weight="700" letter-spacing="0.08em" font-family="Inter,sans-serif">EST. BORROWERS</text>'
      + '<text x="120" y="148" text-anchor="middle" fill="#85651F" font-size="10.5" font-weight="700" font-family="Inter,sans-serif">' + shareLabel + '</text>';
  },

  _calcEMI(principal, annualPct, months) {
    const r = annualPct / 1200;
    const f = Math.pow(1 + r, months);
    return (principal * r * f) / (f - 1);
  },

  updateBorrower() {
    const amtEl = document.getElementById('p2p-b-amount');
    if (!amtEl) return;
    this._setRangeFill(amtEl);
    const amount = Math.max(5000, Math.min(100000, Number(amtEl.value) || 35000));
    const months = this.borrowerTenure || 6;

    const emiLow = this._calcEMI(amount, 24, months);
    const emiHigh = this._calcEMI(amount, 48, months);

    const amtVal = document.getElementById('p2p-b-amount-val');
    const tenVal = document.getElementById('p2p-b-ten-val');
    const emiEl = document.getElementById('p2p-b-emi-range');
    if (amtVal) amtVal.textContent = this._inr(amount);
    if (tenVal) tenVal.textContent = months + ' Months';
    if (emiEl) emiEl.textContent = this._inr(emiLow) + ' – ' + this._inr(emiHigh) + ' / mo';

    const ticketPct = Math.round(((amount - 5000) / 95000) * 100);
    const tenurePct = Math.round(((months - 3) / 9) * 100);
    const tFill = document.getElementById('p2p-b-ticket-fill');
    const tPct = document.getElementById('p2p-b-ticket-pct');
    const mFill = document.getElementById('p2p-b-tenure-fill');
    const mPct = document.getElementById('p2p-b-tenure-pct');
    if (tFill) tFill.style.width = Math.max(6, ticketPct) + '%';
    if (tPct) tPct.textContent = this._inr(amount);
    if (mFill) mFill.style.width = Math.max(10, tenurePct) + '%';
    if (mPct) mPct.textContent = months + ' Mo';
  }
};
const ASSESSMENT_ENGINE_DATA = {
  "methodology_version": "2026.4-condensed-15", "total_questions": 15,
  "financial_health": {
    "title": "Part A: Financial Health & Balance Sheet Resilience", "description": "Evaluates surplus generation, debt prudence, liquidity buffer, and foundational security.", "weight": 0.5,
    "questions": [
      {"id": "h_q1", "title": "1. Monthly Savings & Surplus Velocity", "description": "What percentage of your household net monthly earnings is systematically saved or invested?", "weight": 0.15, "options": [{"label": "Under 10% (Limited surplus accumulation)", "score": 1}, {"label": "10% to 20% (Moderate disciplined savings)", "score": 2.5}, {"label": "20% to 35% (Strong systematic velocity)", "score": 4}, {"label": "Above 35% (High surplus capital compounding)", "score": 5}]},
      {"id": "h_q2", "title": "2. Ring-Fenced Emergency Liquidity Moat", "description": "How many months of essential living expenses are segregated in liquid mutual funds / bank accounts?", "weight": 0.15, "options": [{"label": "Less than 2 months (High liquidity risk)", "score": 1}, {"label": "2 to 4 months (Emerging liquidity cushion)", "score": 2.5}, {"label": "5 to 8 months (Prudent liquid moat)", "score": 4}, {"label": "9+ months (Robust multi-season buffer)", "score": 5}]},
      {"id": "h_q3", "title": "3. Debt Servicing & Leverage Headroom", "description": "What proportion of your monthly income is committed to total loan EMIs / debt obligations?", "weight": 0.15, "options": [{"label": "Over 50% (High leverage pressure)", "score": 1}, {"label": "35% to 50% (Elevated debt commitment)", "score": 2.5}, {"label": "15% to 34% (Healthy controlled leverage)", "score": 4}, {"label": "Under 15% or zero debt (Maximal cashflow freedom)", "score": 5}]},
      {"id": "h_q4", "title": "4. Life & Health Insurance Protection Audit", "description": "Does your family have dedicated pure term life cover and comprehensive medical insurance?", "weight": 0.15, "options": [{"label": "Minimal or employer corporate group cover only", "score": 1}, {"label": "Basic health policy, but term life is under 5x income", "score": 2.5}, {"label": "Family floater (₹15L+) & pure term life at 10x-15x income", "score": 4}, {"label": "Comprehensive health + super top-up + 15x+ term cover", "score": 5}]},
      {"id": "h_q5", "title": "5. Asset Class Diversification Quality", "description": "How is your investable net worth distributed across mutual funds, equities, debt, and liquid assets?", "weight": 0.1, "options": [{"label": "Heavily concentrated in real estate or single asset", "score": 1}, {"label": "Primarily traditional bank FDs and endowment plans", "score": 2.5}, {"label": "Balanced mix across Mutual Funds, Equities & Debt", "score": 4}, {"label": "Multi-asset institutional structure with periodic re-balancing", "score": 5}]},
      {"id": "h_q6", "title": "6. Retirement & Longevity Compounding", "description": "Have you calculated your retirement corpus and mapped active systematic SIP compounding toward it?", "weight": 0.1, "options": [{"label": "Not started or relying solely on statutory provident fund", "score": 1}, {"label": "Ad-hoc savings without a structured corpus roadmap", "score": 2.5}, {"label": "Defined corpus target with active monthly SIP investments", "score": 4}, {"label": "Advanced multi-pillar compounding roadmap on track", "score": 5}]},
      {"id": "h_q7", "title": "7. Children Higher Education & Milestone Segregation", "description": "Are major upcoming lifecycle goals (e.g. child education, marriage) earmarked in dedicated folios?", "weight": 0.1, "options": [{"label": "No segregated accounts or duration matching", "score": 1}, {"label": "General pooling without timeline de-risking glide paths", "score": 2.5}, {"label": "Dedicated mutual fund folios mapped to milestone dates", "score": 4}, {"label": "Earmarked portfolios with automated asset de-risking schedules", "score": 5}]},
      {"id": "h_q8", "title": "8. Estate Governance & Account Operational Readiness", "description": "Are nominations active across all investments, folios, bank accounts, and is estate documentation updated?", "weight": 0.1, "options": [{"label": "Gaps in nominations and missing document inventory", "score": 1}, {"label": "Basic nominations exist; no consolidated estate review", "score": 2.5}, {"label": "100% active nominations, verified KYC & documented inventory", "score": 4}, {"label": "Comprehensive family governance with registered estate plan", "score": 5}]}
    ]
  },
  "financial_risk": {
    "title": "Part B: Risk Capacity & Drawdown Resilience", "description": "Evaluates volatility tolerance, income shock runway, horizon matching, and drawdown recovery capacity.", "weight": 0.5,
    "questions": [
      {"id": "r_q1", "title": "9. Inflow Stability & Earnings Concentration", "description": "How stable and diversified are your primary professional or corporate income streams?", "weight": 0.15, "options": [{"label": "Cyclical income or single client/customer concentration", "score": 1}, {"label": "Single salary or moderately variable consulting revenues", "score": 2.5}, {"label": "Stable corporate employment or established firm operations", "score": 4}, {"label": "Multiple uncorrelated cashflow streams & dividend income", "score": 5}]},
      {"id": "r_q2", "title": "10. Drawdown Tolerance & Market Correction Reaction", "description": "If a macroeconomic downturn caused market-linked assets to decline 20% over 6 months, you would:", "weight": 0.15, "options": [{"label": "Liquidate immediately to cash to prevent further downside", "score": 1}, {"label": "Pause systematic investments with heightened concern", "score": 2.5}, {"label": "Stay invested calmly, acknowledging standard market cycles", "score": 4}, {"label": "Deploy additional surplus into equities at discounted valuations", "score": 5}]},
      {"id": "r_q3", "title": "11. Investment Holding Duration & Capital Horizon", "description": "What is the primary timeline for the core capital deployed in your investment portfolio?", "weight": 0.15, "options": [{"label": "Under 12 months (Immediate liquidity requirements)", "score": 1}, {"label": "1 to 3 years (Short to medium-term allocation)", "score": 2.5}, {"label": "4 to 7 years (Medium to long-term compounding)", "score": 4}, {"label": "8+ years or multi-generational legacy wealth creation", "score": 5}]},
      {"id": "r_q4", "title": "12. Discretionary Expense Curtailment Flexibility", "description": "If household earnings contracted by 25%, how easily could lifestyle expenses be curtailed?", "weight": 0.15, "options": [{"label": "Fixed commitments dominate; very difficult to cut spending", "score": 1}, {"label": "Modest flexibility; could trim non-essentials with effort", "score": 2.5}, {"label": "Good flexibility; travel and leisure outlays easily reduced", "score": 4}, {"label": "High expenditure flexibility with substantial lifestyle buffer", "score": 5}]},
      {"id": "r_q5", "title": "13. Dependent Liabilities & Family Financial Support", "description": "How many non-earning family dependents currently rely on your ongoing cashflow support?", "weight": 0.15, "options": [{"label": "4+ dependents with extensive recurring financial needs", "score": 1}, {"label": "2 to 3 dependents with moderate education/medical outlays", "score": 2.5}, {"label": "1 to 2 dependents with well-planned support reserves", "score": 4}, {"label": "Independent financial unit with zero dependent liability", "score": 5}]},
      {"id": "r_q6", "title": "14. Track Record with Market-Linked Products", "description": "What is your historical personal investment experience across mutual funds and equities?", "weight": 0.15, "options": [{"label": "Exclusively fixed deposits, postal schemes, and gold", "score": 1}, {"label": "1 to 3 years primarily in basic mutual fund SIPs", "score": 2.5}, {"label": "4 to 9 years across varied market and interest rate cycles", "score": 4}, {"label": "10+ years across Mutual Funds, PMS, AIFs and Direct Equities", "score": 5}]},
      {"id": "r_q7", "title": "15. Core Wealth Allocation Mandate", "description": "Which strategic statement best reflects your mandate for your wealth architecture?", "weight": 0.1, "options": [{"label": "Capital preservation is paramount; cannot accept nominal loss", "score": 1}, {"label": "Cautious yield generation with low volatility exposure", "score": 2.5}, {"label": "Balanced wealth compounding beating inflation by 4-6%", "score": 4}, {"label": "Aggressive capital compounding targeting alpha outperformance", "score": 5}]}
    ]
  }
};
const AssessmentEngine = {
  currentStage: 1,
  activePillar: 'health',
  answers: {},
  clientProfile: {},
  results: null,
  init() {
    this.initDefaultDate(); this.answers = {}; this.renderQuestions(); this.bindEvents(); this.updateProgress(); this.bindCommissionDisclosure();
  },
  bindCommissionDisclosure() {
    const commSel = document.getElementById('commission-disclosure-select'); const commBtn = document.getElementById('btn-open-commission-pdf');
    if (commBtn && commSel) { commBtn.addEventListener('click', () => { const url = commSel.value; if (url) { window.open(url, '_blank', 'noopener,noreferrer'); } }); }
  },
  initDefaultDate() {
    const dateInput = document.getElementById('assessment-date-input');
    if (dateInput && !dateInput.value) { const today = new Date().toISOString().split('T')[0]; dateInput.value = today; }
  },
  renderQuestions() {
    const healthMount = document.getElementById('health-questions-mount');
    if (healthMount) { healthMount.innerHTML = this.buildQuestionsListHTML(ASSESSMENT_ENGINE_DATA.financial_health.questions, 'health'); }
    const riskMount = document.getElementById('risk-questions-mount');
    if (riskMount) { riskMount.innerHTML = this.buildQuestionsListHTML(ASSESSMENT_ENGINE_DATA.financial_risk.questions, 'risk'); }
    this.bindOptionSelection();
  },
  buildQuestionsListHTML(questions, pillarType) {
    return questions.map((q) => {
      const optionsHTML = q.options.map((opt, optIdx) => `<label class="assessment-option-label" data-qid="${q.id}" data-score="${opt.score}"> <input type="radio" name="${q.id}" value="${opt.score}"> <span class="option-score-tag">Option ${optIdx + 1}</span> <span>${opt.label}</span> </label>`).join('');
      return `<div class="assessment-q-card" id="card-${q.id}" style="background:var(--white); border:1px solid var(--slate-200); border-radius:var(--radius-lg); padding:1.5rem; margin-bottom:1.25rem; transition:border-color 0.2s ease, box-shadow 0.2s ease;"> <div style="margin-bottom:0.6rem;"> <div class="assessment-q-prompt" style="font-size:1.05rem; font-weight:700; color:var(--navy-900);">${q.title}</div> </div> <div class="assessment-q-why" style="font-size:0.875rem; color:var(--slate-600); line-height:1.5; margin-bottom:1.15rem;">${q.description}</div> <div class="assessment-options-group" style="display:grid; grid-template-columns:1fr; gap:0.65rem;"> ${optionsHTML} </div> </div>`;
    }).join('');
  },
  bindOptionSelection() {
    document.querySelectorAll('.assessment-option-label').forEach(lbl => {
      lbl.addEventListener('click', (e) => {
        const qid = lbl.getAttribute('data-qid'); const score = Number(lbl.getAttribute('data-score')); const parentCard = document.getElementById(`card-${qid}`);
        if (parentCard) {
          parentCard.querySelectorAll('.assessment-option-label').forEach(l => l.classList.remove('selected')); lbl.classList.add('selected');
          const radio = lbl.querySelector('input[type="radio"]'); if (radio) radio.checked = true; parentCard.style.borderColor = 'var(--gold-400)';
        }
        this.answers[qid] = score; this.updateProgress();
      });
    });
  },
  updateProgress() {
    const totalCount = 15; const answeredCount = Object.keys(this.answers).length; const disp = document.getElementById('survey-progress-display');
    if (disp) {
      disp.textContent = `Answered: ${answeredCount} / ${totalCount}`;
      if (answeredCount === totalCount) {
        disp.classList.add('completed'); disp.style.background = '#ECFDF5'; disp.style.color = '#065F46'; disp.style.borderColor = '#A7F3D0';
      } else { disp.classList.remove('completed'); disp.style.background = ''; disp.style.color = ''; disp.style.borderColor = ''; }
    }
  },
  bindEvents() {
    document.getElementById('step-nav-1')?.addEventListener('click', () => this.goToStage(1));
    document.getElementById('step-nav-2')?.addEventListener('click', () => this.goToStage(2));
    document.getElementById('step-nav-3')?.addEventListener('click', () => { if (this.results) this.goToStage(3); });
    document.getElementById('btn-to-stage-2')?.addEventListener('click', () => {
      const nameInput = document.getElementById('client-name-input');
      if (nameInput && !nameInput.value.trim()) { nameInput.focus(); nameInput.reportValidity(); return; }
      this.collectProfile(); this.goToStage(2);
    });
    document.getElementById('btn-back-to-stage-1')?.addEventListener('click', () => this.goToStage(1));
    document.querySelectorAll('.pillar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pillar-tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); const pillar = btn.getAttribute('data-pillar-tab'); this.activePillar = pillar;
        const hView = document.getElementById('pillar-health-view'); const rView = document.getElementById('pillar-risk-view');
        const calcBtn = document.getElementById('btn-calculate-assessment');
        if (pillar === 'health') {
          if (hView) hView.style.display = 'block'; if (rView) rView.style.display = 'none'; if (calcBtn) calcBtn.style.display = 'none';
        } else { if (hView) hView.style.display = 'none'; if (rView) rView.style.display = 'block'; if (calcBtn) calcBtn.style.display = ''; }
      });
    });
    document.getElementById('btn-next-to-part-2')?.addEventListener('click', () => {
      document.querySelector('[data-pillar-tab="risk"]')?.click(); document.querySelector('.survey-controls-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('btn-back-to-part-1')?.addEventListener('click', () => {
      document.querySelector('[data-pillar-tab="health"]')?.click();
      document.querySelector('.survey-controls-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('btn-calculate-assessment')?.addEventListener('click', () => {
      const totalCount = 15; const answeredCount = Object.keys(this.answers).length;
      if (answeredCount < totalCount) {
        const allQuestions = [
          ...ASSESSMENT_ENGINE_DATA.financial_health.questions,
          ...ASSESSMENT_ENGINE_DATA.financial_risk.questions
        ];
        const missing = allQuestions.find(q => this.answers[q.id] === undefined);
        if (missing) {
          if (missing.id.startsWith('r_') && this.activePillar !== 'risk') { document.querySelector('[data-pillar-tab="risk"]')?.click(); } else if (missing.id.startsWith('h_') && this.activePillar !== 'health') {
            document.querySelector('[data-pillar-tab="health"]')?.click();
          }
          const card = document.getElementById(`card-${missing.id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.style.borderColor = 'var(--gold-600)';
            card.style.boxShadow = '0 0 0 3px rgba(197, 160, 89, 0.35)';
            setTimeout(() => {
              card.style.borderColor = ''; card.style.boxShadow = '';
            }, 2500);
          }
        }
        alert(`Please answer all 15 questions (${answeredCount} of 15 completed). We have scrolled to the next required question.`);
        return;
      }
      this.calculateAndRenderResults(); this.goToStage(3);
    });
    document.getElementById('btn-back-to-stage-2')?.addEventListener('click', () => this.goToStage(2));
    document.getElementById('btn-reset-assessment')?.addEventListener('click', () => {
      this.answers = {}; this.results = null; document.querySelectorAll('.assessment-option-label').forEach(l => l.classList.remove('selected'));
      document.querySelectorAll('.assessment-q-card').forEach(c => c.style.borderColor = '');
      document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false); this.updateProgress(); this.goToStage(1);
    });
    document.getElementById('btn-generate-pdf-report')?.addEventListener('click', () => { this.generateReport(); });
    document.getElementById('client-profile-form')?.addEventListener('submit', (e) => e.preventDefault());
  },
  goToStage(stage) {
    this.currentStage = stage;
    const s1 = document.getElementById('wizard-stage-1'); const s2 = document.getElementById('wizard-stage-2'); const s3 = document.getElementById('wizard-stage-3');
    if (s1) s1.style.display = (stage === 1) ? 'block' : 'none'; if (s2) s2.style.display = (stage === 2) ? 'block' : 'none';
    if (s3) s3.style.display = (stage === 3) ? 'block' : 'none';
    ['step-nav-1', 'step-nav-2', 'step-nav-3'].forEach((id, idx) => {
      const el = document.getElementById(id); if (!el) return; el.classList.remove('active', 'completed'); const num = idx + 1;
      if (num === stage) { el.classList.add('active'); } else if (num < stage) { el.classList.add('completed'); }
    });
    const tool = document.getElementById('self-assessment-tool');
    if (tool) { tool.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }, collectProfile() {
    this.clientProfile = { client_name: document.getElementById('client-name-input')?.value.trim() || 'Valued Client', assessment_date: document.getElementById('assessment-date-input')?.value || new Date().toISOString().split('T')[0], age: document.getElementById('client-age-select')?.value || '36 – 45', family_size: document.getElementById('client-family-size-select')?.value || '4 Members', dependents_count: document.getElementById('client-dependents-select')?.value || '2 Dependents', work_status: document.getElementById('client-work-status-select')?.value || 'Business Owner / Professional', income_source: document.getElementById('client-income-source-select')?.value || 'Corporate / Business Profits', annual_income: document.getElementById('client-annual-income-select')?.value || '₹50 Lakhs – ₹1.00 Crore', financial_goal: document.getElementById('client-financial-goal-select')?.value || 'Wealth Creation & Long-Term Compounding' };
  }, calculateAndRenderResults() {
    this.collectProfile(); const healthQuestions = ASSESSMENT_ENGINE_DATA.financial_health.questions;
    const healthTitles = { 'h_q1': 'Monthly Savings', 'h_q2': 'Emergency Moat', 'h_q3': 'Debt Servicing', 'h_q4': 'Life & Health Cover', 'h_q5': 'Diversification', 'h_q6': 'Retirement Readiness', 'h_q7': 'Children Education', 'h_q8': 'Estate Governance' };
    const healthCats = healthQuestions.map(q => {
      const raw = this.answers[q.id] || 3; const scorePct = Number(((raw / 5.0) * 100).toFixed(1)); const weightedScore = Number((scorePct * q.weight).toFixed(2));
      let band = 'Stable / Good'; if (scorePct >= 80) band = 'Optimal Resilience';
      else if (scorePct >= 60) band = 'Satisfactory';
      else if (scorePct >= 40) band = 'Moderate Buffer';
      else band = 'Needs Optimization'; const shortName = healthTitles[q.id] || q.title.replace(/^\d+\.\s*/, '').split('&')[0].trim();
      return { id: q.id, name: shortName, full_title: q.title, weight: q.weight, raw_score: raw, max_score: 5, score_pct: scorePct, normalized_score: scorePct, weighted_score: weightedScore, band: band };
    });
    const healthOverall = Number(healthCats.reduce((sum, c) => sum + c.weighted_score, 0).toFixed(1)); let healthRating = 'Stable / Good';
    if (healthOverall >= 80) { healthRating = 'Strong Financial Foundation'; } else if (healthOverall >= 60) {
      healthRating = 'Moderate Foundation';
    } else if (healthOverall >= 40) {
      healthRating = 'Requires Strategic Optimization'; } else { healthRating = 'Critical Attention Needed'; }
    const riskQuestions = ASSESSMENT_ENGINE_DATA.financial_risk.questions;
    const riskTitles = { 'r_q1': 'Inflow Stability', 'r_q2': 'Drawdown Tolerance', 'r_q3': 'Investment Horizon', 'r_q4': 'Expense Flexibility', 'r_q5': 'Dependent Cushion', 'r_q6': 'Market Track Record', 'r_q7': 'Allocation Mandate' };
    const riskCats = riskQuestions.map(q => {
      const raw = this.answers[q.id] || 3; const scorePct = Number(((raw / 5.0) * 100).toFixed(1)); const weightedScore = Number((scorePct * q.weight).toFixed(2));
      let band = 'Balanced Growth'; if (scorePct >= 80) band = 'High Risk Tolerance';
      else if (scorePct >= 60) band = 'Moderate Risk Buffer';
      else if (scorePct >= 40) band = 'Cautious Allocation';
      else band = 'Capital Preservation'; const shortName = riskTitles[q.id] || q.title.replace(/^\d+\.\s*/, '').split('&')[0].trim();
      return { id: q.id, name: shortName, full_title: q.title, weight: q.weight, raw_score: raw, max_score: 5, score_pct: scorePct, normalized_score: scorePct, weighted_score: weightedScore, band: band };
    });
    const riskOverall = Number(riskCats.reduce((sum, c) => sum + c.weighted_score, 0).toFixed(1)); let riskRating = 'Balanced Growth Focus';
    if (riskOverall >= 75) { riskRating = 'Aggressive Growth Focus'; } else if (riskOverall >= 55) {
      riskRating = 'Balanced Growth Focus';
    } else if (riskOverall >= 40) {
      riskRating = 'Moderate Conservative'; } else { riskRating = 'Conservative Capital Preservation'; }
    const sortedHealth = [...healthCats].sort((a, b) => a.score_pct - b.score_pct); const sortedRisk = [...riskCats].sort((a, b) => a.score_pct - b.score_pct);
    const actionPlan = [
      { priority: 1, area: sortedHealth[0].name, action: `Strengthen ${sortedHealth[0].name.toLowerCase()}: Optimize cash reserve and asset buffer to elevate score towards 85%+ benchmark.`, asset_class: 'Liquid Mutual Funds, Overnight Funds & Sweep Accounts', timeframe: '0–30 Days', status: 'Immediate Priority' }, { priority: 2, area: sortedRisk[0].name, action: `Mitigate ${sortedRisk[0].name.toLowerCase()}: Review portfolio asset allocation and risk parameters to curtail downside exposure.`, asset_class: 'Multi-Asset Hybrid Allocation & Systematic Investment Plans (SIP)', timeframe: '1–3 Months', status: 'High Priority' }, { priority: 3, area: sortedHealth[1].name, action: `Reinforce ${sortedHealth[1].name.toLowerCase()}: Establish disciplined systematic monthly allocation toward long-term wealth milestones.`, asset_class: 'Diversified Large & Mid-Cap Equity Funds', timeframe: '3–6 Months', status: 'Active' }, { priority: 4, area: 'Comprehensive Family Protection', action: 'Review family term life, comprehensive medical coverage, and verify institutional nominee registrations across all holdings.', asset_class: 'Pure Term Insurance (15–20x Income) & Super Top-up Health', timeframe: '6 Months', status: 'Governance' }, { priority: 5, area: 'Wealth Compounding & Review', action: 'Schedule semi-annual portfolio statement reviews with the IRAH relationship desk to track goal alignment.', asset_class: 'Semi-Annual Portfolio Statement & Goal-Alignment Review', timeframe: 'Ongoing', status: 'Monitoring' }
    ];
    this.results = { client_profile: this.clientProfile, health_results: { overall_score: healthOverall, rating: healthRating, categories: healthCats }, risk_results: { overall_score: riskOverall, rating: riskRating, categories: riskCats }, action_plan: actionPlan };
    this.renderResultsDOM();
  }, renderResultsDOM() {
    const res = this.results; if (!res) return; const nameEl = document.getElementById('res-client-name');
    if (nameEl) nameEl.textContent = res.client_profile.client_name; const dateEl = document.getElementById('res-assess-date');
    if (dateEl) dateEl.textContent = res.client_profile.assessment_date; const ageEl = document.getElementById('res-client-age');
    if (ageEl) ageEl.textContent = res.client_profile.age; const incEl = document.getElementById('res-client-income');
    if (incEl) incEl.textContent = res.client_profile.annual_income; const goalEl = document.getElementById('res-client-goal');
    if (goalEl) goalEl.textContent = res.client_profile.financial_goal; const badgeH = document.getElementById('assessment-score-badge');
    if (badgeH) badgeH.textContent = `${res.health_results.overall_score}%`; const ratingH = document.getElementById('health-rating-badge');
    if (ratingH) ratingH.textContent = res.health_results.rating; const badgeR = document.getElementById('risk-score-badge');
    if (badgeR) badgeR.textContent = `${res.risk_results.overall_score}%`; const ratingR = document.getElementById('risk-rating-badge');
    if (ratingR) ratingR.textContent = res.risk_results.rating;
    const healthNames = res.health_results.categories.map(c => c.name); const healthScores = res.health_results.categories.map(c => c.score_pct);
    this.renderSpiderChartSVG(healthNames, healthScores, 'spider-chart-health', true);
    const riskNames = res.risk_results.categories.map(c => c.name); const riskScores = res.risk_results.categories.map(c => c.score_pct);
    this.renderSpiderChartSVG(riskNames, riskScores, 'spider-chart-risk', false);
  }, renderSpiderChartSVG(categories, scores, containerId, isHealth) {
    const container = document.getElementById(containerId) ||
      document.getElementById(containerId === 'spider-chart-health' ? 'health-spider-svg-wrap' : 'risk-spider-svg-wrap');
    if (!container) return; const N = categories.length; const cx = 250; const cy = 250; const R = 135; const primaryColor = isHealth ? '#C5A059' : '#EA580C';
    const fillColor = isHealth ? 'rgba(197, 160, 89, 0.35)' : 'rgba(234, 88, 12, 0.35)'; const angles = [];
    for (let i = 0; i < N; i++) { angles.push(-Math.PI / 2 + (i * 2 * Math.PI / N)); }
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const gridPolygons = gridLevels.map(level => {
      const pts = angles.map(a => {
        const x = cx + R * level * Math.cos(a); const y = cy + R * level * Math.sin(a);
        return `${x.toFixed(1)}, ${y.toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#334155" stroke-width="0.8" stroke-dasharray="3, 3" />`;
    }).join('');
    const axisLines = angles.map(a => {
      const x = cx + R * Math.cos(a); const y = cy + R * Math.sin(a);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#334155" stroke-width="1" />`;
    }).join('');
    const dataPoints = angles.map((a, i) => {
      const val = Math.max(0, Math.min(100, scores[i] || 0)) / 100; const x = cx + R * val * Math.cos(a); const y = cy + R * val * Math.sin(a);
      return { x, y, val: scores[i] };
    });
    const dataPolyPoints = dataPoints.map(p => `${p.x.toFixed(1)}, ${p.y.toFixed(1)}`).join(' ');
    const dataPolygon = `<polygon points="${dataPolyPoints}" fill="${fillColor}" stroke="${primaryColor}" stroke-width="2.8" />`;
    const dataCircles = dataPoints.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#FFFFFF" stroke="${primaryColor}" stroke-width="2.5" />`).join('');
    const labelElements = angles.map((a, i) => {
      const labelDist = R + 26; const x = cx + labelDist * Math.cos(a); const y = cy + labelDist * Math.sin(a); let anchor = 'middle';
      if (Math.abs(Math.cos(a)) > 0.3) { anchor = Math.cos(a) > 0 ? 'start' : 'end'; }
      const words = categories[i].split(' '); let line1 = words.slice(0, Math.ceil(words.length / 2)).join(' '); let line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
      return `<text x="${x.toFixed(1)}" y="${(y - (line2 ? 6 : 0)).toFixed(1)}" text-anchor="${anchor}" fill="#E2E8F0" font-size="10" font-weight="700" font-family="system-ui, sans-serif"> <tspan x="${x.toFixed(1)}" dy="0">${line1}</tspan> ${line2 ?`<tspan x="${x.toFixed(1)}" dy="12">${line2}</tspan>`: ''} </text>`;
    }).join('');
    const svg = `<svg viewBox="-20 0 540 500" width="100%" height="auto" style="max-width: 460px; margin: 0 auto; display: block;" role="img" aria-label="Assessment Radar Chart"> <rect x="-20" y="0" width="540" height="500" fill="#0A1428" rx="16" /> <g>${gridPolygons}</g> <g>${axisLines}</g> <g>${dataPolygon}</g> <g>${dataCircles}</g> <g>${labelElements}</g> </svg>`;
    container.innerHTML = svg;
  }, async generateReport() {
    const statusEl = document.getElementById('report-action-status');
    const setStatus = (kind, text) => {
      if (!statusEl) return; statusEl.style.display = 'block'; statusEl.className = 'report-status report-status--' + kind; statusEl.textContent = text;
    };
    if (!this.results) { if (typeof this.calculateAndRenderResults === 'function') { this.calculateAndRenderResults(); } }
    if (!this.results) { setStatus('error', 'Please complete the assessment questions above to generate your report.'); return; }
    const btn = document.getElementById('btn-generate-pdf-report'); const consent = document.getElementById('assessment-share-consent');
    if (consent && !consent.checked) { setStatus('error', 'Please tick the consent box to confirm you agree to share this report with IRAH.'); consent.focus(); return; }
    if (location.protocol === 'file:') {
      setStatus('error', 'Reports are generated by the IRAH server. Start it with launch.bat and open http://127.0.0.1:8088 instead of opening the file directly.');
      return;
    }
    const label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Generating report...'; }
    setStatus('info', 'Generating your PDF report. This usually takes a few seconds.');
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const resp = await fetch('/api/submit-assessment-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({}, this.results, { consent_to_share: true })), signal: controller.signal
      });
      if (!resp.ok) {
        throw new Error(resp.status === 503
          ? 'The PDF engine is not available on this server.'
          : 'The server could not create the report (code ' + resp.status + ').');
      }
      const data = await resp.json();
      if (data.pdf_base64) {
        const bin = atob(data.pdf_base64); const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); const a = document.createElement('a'); a.href = url;
        a.download = String(data.filename || 'IRAH_Financial_Assessment_Report.pdf').replace(/[^a-zA-Z0-9_.\-]/g, '_'); document.body.appendChild(a); a.click();
        a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      const ref = data.reference_id ? ' Reference: ' + data.reference_id + '.' : '';
      if (data.email_dispatched) { setStatus('success', 'PDF downloaded and emailed to ' + (data.recipient || 'IRAH') + '.' + ref); } else {
        setStatus('warn', 'PDF downloaded. ' + (data.message || 'The email was not sent.') + ref);
      }
    } catch (err) {
      console.error('Report generation error:', err);
      const msg = err && err.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : (err && err.message) || 'Something went wrong.';
      setStatus('error', 'Report not generated. ' + msg);
    } finally { clearTimeout(timer); if (btn) { btn.disabled = false; btn.textContent = label; } }
  }
};
function initSelfAssessment() {
  AssessmentEngine.init(); const scrollBtn = document.getElementById('btn-scroll-to-calcs');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => { const slot = document.getElementById('calc-slot-self-assessment'); if (slot) slot.scrollIntoView({ behavior: 'smooth' }); });
  }
  const q_goals = document.querySelector('input[name="q_goals"]');
  if (q_goals) { q_goals.addEventListener('change', () => {}); }
}
(function () {
  'use strict'; let runHeroCountersFn = null; let revealVisibleFn = null;
  function prefersReducedMotion() { return false; }
  function canUseHoverPointer() { return Boolean(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches); }
  function getStaggerDelayMs(index) {
    const isMobile = (window.innerWidth || 1024) <= 640; const stepMs = isMobile ? 35 : 55; const capMs = isMobile ? 180 : 275;
    return `${Math.min(index * stepMs, capMs)}ms`;
  }
  function initScrollProgressAndHeader() {
    if (!document.querySelector('.pm-scroll-progress')) {
      const bar = document.createElement('div'); bar.className = 'pm-scroll-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
    }
    const header = document.querySelector('.main-header'); let ticking = false;
    const updateScrollMetrics = () => {
      ticking = false;
      const scrollY = window.scrollY || window.pageYOffset || 0; const docEl = document.documentElement; const maxScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0; docEl.style.setProperty('--scroll-progress', ratio.toFixed(4));
      if (header) { header.classList.toggle('is-scrolled', scrollY > 18); }
    };
    const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateScrollMetrics); } };
    window.addEventListener('scroll', requestTick, { passive: true }); window.addEventListener('resize', requestTick, { passive: true });
    window.addEventListener('hashchange', () => { requestAnimationFrame(updateScrollMetrics); setTimeout(updateScrollMetrics, 90); });
    updateScrollMetrics();
  }
  function initSubheroAmbientInjector() {
    const navySections = document.querySelectorAll('.section-bg-navy');
    navySections.forEach((section) => {
      if (section.querySelector(':scope > .pm-subhero-ambient')) return; const ambient = document.createElement('div'); ambient.className = 'pm-subhero-ambient';
      ambient.setAttribute('aria-hidden', 'true');
      ambient.innerHTML =
        '<div class="pm-subhero-aurora pm-subhero-aurora--gold"></div>' +
        '<div class="pm-subhero-aurora pm-subhero-aurora--sapphire"></div>' +
        '<div class="pm-subhero-grid"></div>';
      section.insertBefore(ambient, section.firstChild);
    });
  }
  function initSpotlightCards() {
    const spotlightSelectors = ['.aesthetic-stat-bubble', '.business-card-major', '.horizon-cell--item', '.fs-solution-card', '.fs-spec-card', '.leadership-card', '.other-partner-card', '.resource-category-card', '.insight-card'];
    const cards = document.querySelectorAll(spotlightSelectors.join(', '));
    cards.forEach((card) => {
      if (card.classList.contains('pm-spotlight-card')) return; card.classList.add('pm-spotlight-card');
      const isMajorCard = card.classList.contains('business-card-major');
      const noTilt = card.classList.contains('horizon-cell--item');
      const maxTilt = noTilt ? 0 : (isMajorCard ? 0.8 : 2.2);
      const liftVal = noTilt ? '0px' : '-3px';
      let rafId = null;
      card.addEventListener(
        'pointermove', (e) => {
          if (e.pointerType !== 'mouse' || !canUseHoverPointer()) return; if (prefersReducedMotion()) return; const clientX = e.clientX; const clientY = e.clientY;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect(); if (!rect.width || !rect.height) return;
            const localX = clientX - rect.left; const localY = clientY - rect.top; const normX = Math.max(-1, Math.min(1, (localX / rect.width - 0.5) * 2));
            const normY = Math.max(-1, Math.min(1, (localY / rect.height - 0.5) * 2)); const rx = -normY * maxTilt; const ry = normX * maxTilt;
            card.style.setProperty('--mx', `${localX.toFixed(1)}px`); card.style.setProperty('--my', `${localY.toFixed(1)}px`);
            card.style.setProperty('--rx', `${rx.toFixed(2)}deg`); card.style.setProperty('--ry', `${ry.toFixed(2)}deg`); card.style.setProperty('--lift', liftVal);
          });
        }, { passive: true }
      );
      const resetCard = () => {
        if (rafId) cancelAnimationFrame(rafId); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); card.style.setProperty('--lift', '0px');
      };
      card.addEventListener('pointerleave', resetCard, { passive: true }); card.addEventListener('pointercancel', resetCard, { passive: true });
    });
  }
  function initScrollReveals() {
    document.documentElement.classList.add('pm-reveal-ready');
    const groupSelectors = [
      '#home-business-lines .section-header', '#home-business-lines .business-card-major', '#home-business-lines .upcoming-horizon-matrix', '#home-business-lines .horizon-cell', '#view-about .irah-etymology', '#about-leadership .section-header', '#about-leadership .leadership-card', '#about-leadership .other-partner-card', '#view-about .card-interactive', '#view-business-lines .business-card-major', '#view-business-lines .upcoming-horizon-matrix', '#view-business-lines .horizon-cell', '#view-financial-services .section-header-left', '#view-financial-services .fs-compliance-callout', '#view-financial-services .fs-spec-card', '#view-financial-services .fs-solution-card', '#view-financial-services .fs-cta-bar', '#view-insights .insight-card', '#view-resources .business-card', '#view-resources .resource-category-card', '#view-resources .section-header-left', '#master-calculator-container .calc-input-group', '#master-calculator-container .calc-output-card', '#view-self-assessment .assessment-card', '#view-self-assessment .wizard-stage-panel', '#view-self-assessment .score-summary-card', '#view-self-assessment .radar-chart-card', '#view-knowledge-repository .reg-card', '#view-contact .desk-card', '#view-contact .form-card', '#view-investor-charter .section:not(.section-bg-navy) .container > div', '#view-grievance-redressal .section:not(.section-bg-navy) .container > div > div', '#view-risk-disclosures .section:not(.section-bg-navy) .container > div'
    ];
    const allTargets = document.querySelectorAll(groupSelectors.join(', ')); if (!allTargets.length) return; const parentCounters = new Map();
    allTargets.forEach((el) => {
      el.classList.add('pm-reveal');
      const parentKey = el.parentElement || document.body; const idx = parentCounters.get(parentKey) || 0; const delay = getStaggerDelayMs(idx % 6);
      el.style.setProperty('--pm-delay', delay); parentCounters.set(parentKey, idx + 1);
    });
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('pm-in'); } });
        }, { threshold: 0.06, rootMargin: '0px 0px -18px 0px' }
      );
      allTargets.forEach((el) => io.observe(el)); } else { allTargets.forEach((el) => el.classList.add('pm-in')); }
    const revealVisibleInActiveView = () => {
      const vh = window.innerHeight || 900;
      const activeView = document.querySelector('.page-view-container.active');
      const scope = activeView || document; const candidates = scope.querySelectorAll('.pm-reveal');
      candidates.forEach((el) => {
        if (el.classList.contains('pm-in')) return; const rect = el.getBoundingClientRect(); if (rect.width === 0 && rect.height === 0) return;
        if (rect.top < vh * 0.96 && rect.bottom > -20) { el.classList.add('pm-in'); }
      });
    };
    revealVisibleFn = revealVisibleInActiveView; window.addEventListener('hashchange', () => { setTimeout(revealVisibleInActiveView, 50); });
    document.querySelectorAll('.fs-product-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabKey = btn.getAttribute('data-fs-tab'); const panel = tabKey ? document.getElementById(`fs-panel-${tabKey}`) : null;
        if (panel) {
          const panelItems = panel.querySelectorAll('.pm-reveal');
          panelItems.forEach((item, i) => { item.classList.remove('pm-in'); item.style.setProperty('--pm-delay', getStaggerDelayMs(i % 6)); });
          requestAnimationFrame(() => { requestAnimationFrame(() => { panelItems.forEach((item) => item.classList.add('pm-in')); }); });
        }
      });
    });
    document.querySelectorAll('.calc-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panelId = btn.getAttribute('data-target-panel'); const panel = panelId ? document.getElementById(panelId) : null;
        if (panel) {
          const panelItems = panel.querySelectorAll('.pm-reveal');
          panelItems.forEach((item, i) => { item.classList.remove('pm-in'); item.style.setProperty('--pm-delay', getStaggerDelayMs(i % 6)); });
          requestAnimationFrame(() => { requestAnimationFrame(() => { panelItems.forEach((item) => item.classList.add('pm-in')); }); });
        }
      });
    });
    const syncWizardStages = () => {
      const stages = document.querySelectorAll('#view-self-assessment .wizard-stage-panel');
      stages.forEach((stageEl) => {
        const isVisible = stageEl.style.display !== 'none'; stageEl.classList.toggle('active', isVisible);
        if (isVisible) { stageEl.classList.add('pm-in'); stageEl.querySelectorAll('.pm-reveal').forEach((child) => child.classList.add('pm-in')); }
      });
    };
    [
      'step-nav-1', 'step-nav-2', 'step-nav-3', 'btn-to-stage-2', 'btn-back-to-stage-1', 'btn-calculate-assessment', 'btn-back-to-stage-2', 'btn-reset-assessment', 'btn-next-to-part-2', 'btn-back-to-part-1'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.addEventListener('click', () => setTimeout(syncWizardStages, 30)); }
    });
    document.querySelectorAll('.pillar-tab-btn').forEach((btn) => { btn.addEventListener('click', () => setTimeout(syncWizardStages, 30)); });
    setTimeout(revealVisibleInActiveView, 60);
  }
  function initHeroStatCounters() {
    const bubbles = document.querySelectorAll('#view-home .stat-bubble-val'); if (!bubbles.length) return;
    const specs = [
      { target: 20, prefix: '', suffix: '+ Years', start: 0 },
      { target: 55, prefix: '₹', suffix: ' Cr', start: 0 },
      { target: 150, prefix: '', suffix: '', start: 0 },
      { target: 50, prefix: '', suffix: '+', start: 0 }
    ];
    let activeRaf = null;
    const runCounters = (force = false) => {
      if (prefersReducedMotion() && !force) { bubbles.forEach((el, idx) => { const s = specs[idx]; if (s) el.textContent = `${s.prefix}${s.target}${s.suffix}`; }); return; }
      if (activeRaf) cancelAnimationFrame(activeRaf); const duration = 920; const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1); const eased = 1 - Math.pow(1 - progress, 3);
        bubbles.forEach((el, idx) => {
          const s = specs[idx]; if (!s) return; const val = Math.round(s.start + (s.target - s.start) * eased); el.textContent = `${s.prefix}${val}${s.suffix}`;
        });
        if (progress < 1) { activeRaf = requestAnimationFrame(tick); } else {
          bubbles.forEach((el, idx) => { const s = specs[idx]; if (s) el.textContent = `${s.prefix}${s.target}${s.suffix}`; }); activeRaf = null;
        }
      };
      activeRaf = requestAnimationFrame(tick);
    };
    runHeroCountersFn = () => runCounters(true);
    const homeView = document.getElementById('view-home');
    if (homeView && homeView.classList.contains('active')) { setTimeout(() => runCounters(false), 160); }
    window.addEventListener('hashchange', () => { if (homeView && homeView.classList.contains('active')) { setTimeout(() => runCounters(false), 140); } });
  }
  function initCalculatorValuePulse() {
    const calcContainer = document.getElementById('master-calculator-container'); if (!calcContainer) return;
    const inputs = calcContainer.querySelectorAll('.calc-range-slider, .calc-number-input');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        const group = input.closest('.calc-input-group'); const display = group && group.querySelector('.calc-value-display');
        if (display) {
          display.classList.add('is-updated'); clearTimeout(display._pulseTimer); display._pulseTimer = setTimeout(() => display.classList.remove('is-updated'), 240);
        }
        const panel = input.closest('.calc-panel'); const bigMetric = panel && panel.querySelector('.calc-metric-big');
        if (bigMetric) {
          bigMetric.classList.add('is-ticking'); clearTimeout(bigMetric._tickTimer);
          bigMetric._tickTimer = setTimeout(() => bigMetric.classList.remove('is-ticking'), 260);
        }
      });
    });
  }
  function initMobileTabRailScroll() {
    const centerInRail = (btn) => {
      if (!btn) return; const rail = btn.parentElement;
      if (rail && rail.scrollWidth > rail.clientWidth) {
        const left = btn.offsetLeft - (rail.clientWidth / 2) + (btn.offsetWidth / 2);
        rail.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };
    document.querySelectorAll('.fs-product-nav-btn, .calc-tab-btn, .pillar-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => centerInRail(btn));
    });
  }
  function initMobileScrollSpotlight() {
    if (!('IntersectionObserver' in window)) return;
    const isMobileOrTouch = () => window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);
    const selectors = ['.aesthetic-stat-bubble', '.horizon-cell--item', '.fs-solution-card', '.fs-spec-card', '.leadership-card', '.other-partner-card', '.resource-category-card', '.insight-card'];
    const cards = document.querySelectorAll(selectors.join(', ')); if (!cards.length) return;
    const io = new IntersectionObserver((entries) => {
      const activeTouch = isMobileOrTouch();
      entries.forEach((entry) => {
        if (!activeTouch) { entry.target.classList.remove('is-mobile-focused'); return; }
        entry.target.classList.toggle('is-mobile-focused', entry.isIntersecting);
      });
    }, { rootMargin: '-18% 0px -22% 0px', threshold: [0.25, 0.55] });
    cards.forEach((c) => io.observe(c));
  }
  function replayActiveViewAnimations() {
    const activeView = document.querySelector('.page-view-container.active');
    if (!activeView) return; activeView.classList.remove('active'); void activeView.offsetWidth; activeView.classList.add('active');
    const reveals = activeView.querySelectorAll('.pm-reveal');
    reveals.forEach((el, idx) => { el.classList.remove('pm-in'); el.style.setProperty('--pm-delay', getStaggerDelayMs(idx % 6)); });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { if (typeof revealVisibleFn === 'function') { revealVisibleFn(); } else { reveals.forEach((el) => el.classList.add('pm-in')); } });
    });
    if (activeView.id === 'view-home' && typeof runHeroCountersFn === 'function') { runHeroCountersFn(); }
    if (
      activeView.id === 'view-about' &&
      typeof IrahAcronymEtymology !== 'undefined' &&
      typeof IrahAcronymEtymology.onEnterAbout === 'function'
    ) { IrahAcronymEtymology.onEnterAbout(); }
    if (
      activeView.id === 'view-loans-p2p' &&
      typeof LoansP2PStudio !== 'undefined' &&
      typeof LoansP2PStudio.onEnter === 'function'
    ) { LoansP2PStudio.onEnter(); }
  }
  function initMailerGallery() {
    const foldersGrid = document.getElementById('mailer-folders-grid');
    const overviewEl = document.getElementById('mailer-folders-overview');
    const detailEl = document.getElementById('mailer-folder-detail');
    const detailGrid = document.getElementById('mailer-detail-grid');
    const detailNum = document.getElementById('mailer-detail-num');
    const detailCount = document.getElementById('mailer-detail-count');
    const detailTitle = document.getElementById('mailer-detail-title');
    const detailDesc = document.getElementById('mailer-detail-desc');
    const switcherEl = document.getElementById('mailer-folder-switcher');
    const backBtn = document.getElementById('mailer-folder-back');
    const lb = document.getElementById('mailer-lightbox');
    if (!foldersGrid || !overviewEl || !detailEl || !lb) return;

    const folders = [
      {
        id: 'wealth-investments',
        num: '01',
        title: 'Wealth & Investments',
        desc: 'Investment fundamentals, asset allocation, market behaviour and wealth creation.',
        cover: 'assets/images/folders/wealth-investments.jpg',
        guides: []
      },
      {
        id: 'protection-risk',
        num: '02',
        title: 'Protection & Risk',
        desc: 'Health insurance, life cover, emergency funds and risk preparedness.',
        cover: 'assets/images/folders/protection-risk.jpg',
        guides: [
          {
            src: 'assets/images/mailers/emergency-fund.jpg',
            title: 'Emergency & Medical Fund',
            note: 'Keep 6–9 months of household expenses and a separate medical buffer in liquid, low-risk instruments.'
          },
          {
            src: 'assets/images/mailers/medical-insurance.jpg',
            title: 'Medical Insurance',
            note: 'Maintain active family health cover—ideally ₹40–50 Lakhs with top-ups—and declare medical history accurately.'
          },
          {
            src: 'assets/images/mailers/term-insurance.jpg',
            title: 'Term Insurance',
            note: 'Pure term cover sized to your liabilities and dependents’ needs, kept active through your earning years.'
          }
        ]
      },
      {
        id: 'retirement-income',
        num: '03',
        title: 'Retirement & Income',
        desc: 'Retirement corpus, income planning, pensions and withdrawal strategies.',
        cover: 'assets/images/folders/retirement-income.jpg',
        guides: []
      },
      {
        id: 'legacy-succession',
        num: '04',
        title: 'Legacy & Succession',
        desc: 'Wills, nominations, inheritance, family asset registers and succession.',
        cover: 'assets/images/folders/legacy-succession.jpg',
        guides: [
          {
            src: 'assets/images/mailers/family-asset-register.jpg',
            title: 'Family Asset Register',
            note: 'Document bank accounts, investments, properties, and key contacts in one accessible place—without passwords.'
          },
          {
            src: 'assets/images/mailers/nominations-succession.jpg',
            title: 'Nominations & Succession Planning',
            note: 'Keep nominations updated across every account and folio, backed by a valid Will stored safely.'
          }
        ]
      },
      {
        id: 'digital-safety',
        num: '05',
        title: 'Digital & Financial Safety',
        desc: 'Fraud prevention, cyber safety, digital banking and identity protection.',
        cover: 'assets/images/folders/digital-safety.jpg',
        guides: [
          {
            src: 'assets/images/mailers/card-safety.jpg',
            title: 'Credit & Debit Card Safety',
            note: 'Keep daily card limits low, disable unused international or cash access, and never share OTPs or PINs.'
          }
        ]
      },
      {
        id: 'family-milestones',
        num: '06',
        title: 'Family & Milestones',
        desc: 'Children’s education, marriage, major purchases and family financial preparedness.',
        cover: 'assets/images/folders/family-milestones.jpg',
        guides: []
      },
      {
        id: 'market-perspectives',
        num: '07',
        title: 'Market Perspectives',
        desc: 'Market developments, economic trends, investor behaviour and concepts.',
        cover: 'assets/images/folders/market-perspectives.jpg',
        guides: []
      },
      {
        id: 'nri-global-wealth',
        num: '08',
        title: 'NRI & Global Wealth',
        desc: 'Cross-border financial considerations, repatriation, global investing and NRI awareness.',
        cover: 'assets/images/folders/nri-global-wealth.jpg',
        guides: []
      }
    ];

    const imgEl = document.getElementById('mailer-lb-img');
    const titleEl = document.getElementById('mailer-lb-title');
    const countEl = document.getElementById('mailer-lb-count');
    const openEl = document.getElementById('mailer-lb-open');
    const prevBtn = document.getElementById('mailer-lb-prev');
    const nextBtn = document.getElementById('mailer-lb-next');
    let activeGuides = [];
    let lbIdx = 0;

    const renderLb = (i) => {
      if (!activeGuides.length) return;
      lbIdx = (i + activeGuides.length) % activeGuides.length;
      const item = activeGuides[lbIdx];
      imgEl.src = item.src;
      imgEl.alt = item.title;
      titleEl.textContent = item.title;
      countEl.textContent = `${lbIdx + 1} / ${activeGuides.length}`;
      openEl.href = item.src;
      const multi = activeGuides.length > 1;
      if (prevBtn) prevBtn.style.display = multi ? '' : 'none';
      if (nextBtn) nextBtn.style.display = multi ? '' : 'none';
    };
    const openLb = (guides, startIndex) => {
      activeGuides = guides;
      renderLb(startIndex);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
    };
    const closeLb = () => {
      lb.hidden = true;
      document.body.style.overflow = '';
    };

    const openFolder = (folderIndex) => {
      const f = folders[folderIndex];
      if (!f) return;
      overviewEl.hidden = true;
      detailEl.hidden = false;
      detailNum.textContent = f.num;
      if (f.guides.length) {
        detailCount.textContent = `${f.guides.length} ${f.guides.length === 1 ? 'Guide' : 'Guides'}`;
        detailCount.hidden = false;
      } else {
        detailCount.textContent = '';
        detailCount.hidden = true;
      }
      detailTitle.textContent = f.title;
      detailDesc.textContent = f.desc;

      switcherEl.innerHTML = '';
      folders.forEach((item, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `mailer-switch-pill${idx === folderIndex ? ' is-active' : ''}`;
        pill.textContent = `${item.num} · ${item.title}`;
        pill.addEventListener('click', () => openFolder(idx));
        switcherEl.appendChild(pill);
      });

      detailGrid.innerHTML = '';
      if (f.guides.length) {
        f.guides.forEach((g, gi) => {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'mailer-guide-card';
          card.innerHTML = `
            <div class="mailer-guide-thumb"><img src="${g.src}" alt="${g.title}" loading="lazy"></div>
            <h3 class="mailer-guide-title">${g.title}</h3>
            <p class="mailer-guide-note">${g.note}</p>
            <span class="mailer-guide-cta">Read Full Guide ↗</span>
          `;
          card.addEventListener('click', () => openLb(f.guides, gi));
          detailGrid.appendChild(card);
        });
      } else {
        const empty = document.createElement('div');
        empty.className = 'mailer-empty-card';
        empty.innerHTML = `
          <div class="mailer-empty-cover"><img src="${f.cover}" alt="${f.title}"></div>
          <div class="mailer-empty-body">
            <h3>Guides for ${f.title} are on the way</h3>
            <p>New visual awareness mailers covering ${f.desc.toLowerCase()} are being prepared for this folder.</p>
            <button type="button" class="mailer-back-btn" data-jump-active="true">Browse Folders with Guides →</button>
          </div>
        `;
        empty.querySelector('[data-jump-active]').addEventListener('click', () => openFolder(1));
        detailGrid.appendChild(empty);
      }
      const section = document.querySelector('.mailers-folders-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    foldersGrid.innerHTML = '';
    folders.forEach((f, idx) => {
      const hasGuides = f.guides.length > 0;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `mailer-folder-card${hasGuides ? '' : ' is-empty'}`;
      card.setAttribute('data-has-guides', hasGuides ? 'true' : 'false');
      card.innerHTML = `
        <div class="mailer-folder-cover">
          <img src="${f.cover}" alt="${f.title}" loading="lazy">
          ${hasGuides ? `<span class="mailer-folder-badge has-guides">${f.guides.length} ${f.guides.length === 1 ? 'Guide' : 'Guides'}</span>` : ''}
        </div>
        <div class="mailer-folder-body">
          <h3 class="mailer-folder-title"><span>${f.num} ·</span>${f.title}</h3>
          <p class="mailer-folder-desc">${f.desc}</p>
          <div class="mailer-folder-foot">
            <span>${hasGuides ? 'Open folder' : 'Explore topic'}</span>
            <span class="mailer-folder-arrow">→</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => openFolder(idx));
      foldersGrid.appendChild(card);
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        detailEl.hidden = true;
        overviewEl.hidden = false;
      });
    }

    document.querySelectorAll('[data-folder-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-folder-filter');
        document.querySelectorAll('[data-folder-filter]').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        foldersGrid.querySelectorAll('.mailer-folder-card').forEach((card) => {
          const show = mode === 'all' || card.getAttribute('data-has-guides') === 'true';
          card.classList.toggle('is-hidden', !show);
        });
      });
    });

    lb.querySelectorAll('[data-mailer-close]').forEach((el) => el.addEventListener('click', closeLb));
    if (prevBtn) prevBtn.addEventListener('click', () => renderLb(lbIdx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => renderLb(lbIdx + 1));
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') renderLb(lbIdx - 1);
      else if (e.key === 'ArrowRight') renderLb(lbIdx + 1);
    });
  }
  window.replayActiveViewAnimations = replayActiveViewAnimations;
  function bootMotionEngine() {
    initScrollProgressAndHeader(); initSubheroAmbientInjector(); initSpotlightCards(); initScrollReveals(); initHeroStatCounters(); initCalculatorValuePulse(); initMobileTabRailScroll(); initMobileScrollSpotlight(); initMailerGallery();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', bootMotionEngine); } else { bootMotionEngine(); }
})();
