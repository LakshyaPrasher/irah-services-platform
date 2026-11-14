/**
 * Cloudflare Pages Advanced Mode Worker (_worker.js)
 * 100% Native Edge Serverless Engine for IRAH Services LLP
 * 
 * Target Destination: harikant.irah@gmail.com
 */

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function oneLine(str, maxLen = 120) {
  return String(str ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

function escapePdf(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generates an institutional-grade 4-page Vector PDF Assessment Report.
 * Deterministic, dependency-free, pure JavaScript for Cloudflare Workers & Pages.
 */
function buildVectorPdf(data) {
  const safeData = (data && typeof data === 'object') ? data : {};
  const client = safeData.client || safeData.client_profile || {};
  const refId = oneLine(safeData.ref_id || ('IRAH-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()), 40);
  const dateStr = oneLine(client.assessment_date || safeData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 32);

  const clientName = oneLine(client.client_name || client.name || safeData.client_name || 'Valued Client', 48);
  const age = oneLine(client.age || safeData.client_age || '36 - 45', 24);
  const employment = oneLine(client.work_status || client.employment_status || 'Not specified', 36);
  const income = oneLine(client.annual_income || 'Not specified', 36);
  const source = oneLine(client.income_source || 'Not specified', 36);
  const familyInfo = oneLine(
    [client.family_size, client.dependents_count].filter(Boolean).join(' / ') || 'Not specified',
    36
  );
  const goal = oneLine(client.financial_goal || client.main_financial_goal || 'Long-Term Wealth Creation', 56);

  const health = safeData.health || safeData.health_results || {};
  const risk = safeData.risk || safeData.risk_results || {};

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/\u20b9/g, 'Rs. ')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2022/g, '*')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function cleanPlain(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/\u20b9/g, 'Rs. ')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2022/g, '*')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function charWidth(ch, fontSize, isBold) {
    const scale = isBold ? 1.06 : 1.0;
    let unit = 0.52;
    if (ch === ' ') unit = 0.28;
    else if ('ilIjtfr.,:;\'|!()[]'.indexOf(ch) !== -1) unit = 0.29;
    else if ('mwMW@%&'.indexOf(ch) !== -1) unit = 0.84;
    else if (ch >= 'A' && ch <= 'Z') unit = 0.67;
    else if (ch >= '0' && ch <= '9') unit = 0.56;
    else if (ch === '-' || ch === '/') unit = 0.34;
    return unit * fontSize * scale;
  }

  function measureText(str, fontSize, isBold) {
    const s = cleanPlain(str);
    let w = 0;
    for (let i = 0; i < s.length; i++) {
      w += charWidth(s[i], fontSize, isBold);
    }
    return w;
  }

  function wrapText(str, maxWidthPts, fontSize, isBold, maxLines = 10) {
    const clean = cleanPlain(str);
    if (!clean) return [''];
    const words = clean.split(' ');
    const lines = [];
    let current = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const candidate = current ? (current + ' ' + word) : word;
      if (measureText(candidate, fontSize, isBold) <= maxWidthPts) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
          if (lines.length >= maxLines) return lines;
          current = word;
        } else {
          let clipped = '';
          for (let k = 0; k < word.length; k++) {
            if (measureText(clipped + word[k] + '..', fontSize, isBold) > maxWidthPts) break;
            clipped += word[k];
          }
          lines.push(clipped ? clipped + '..' : word.slice(0, 12));
          if (lines.length >= maxLines) return lines;
          current = '';
        }
      }
    }
    if (current && lines.length < maxLines) {
      lines.push(current);
    }
    return lines.length ? lines : [''];
  }

  function fitSingleLine(str, maxWidthPts, fontSize, isBold) {
    const s = cleanPlain(str);
    if (measureText(s, fontSize, isBold) <= maxWidthPts) return s;
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (measureText(out + s[i] + '...', fontSize, isBold) > maxWidthPts) break;
      out += s[i];
    }
    return (out || s.slice(0, 8)) + '...';
  }

  function drawText(x, y, text, font, size, rgb) {
    return 'BT /' + font + ' ' + size + ' Tf ' + rgb + ' rg 1 0 0 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Tm (' + esc(text) + ') Tj ET';
  }

  function drawRightText(rightX, y, text, font, size, rgb) {
    const w = measureText(text, size, font === 'F2');
    return drawText(rightX - w, y, text, font, size, rgb);
  }

  function drawCenterText(centerX, y, text, font, size, rgb) {
    const w = measureText(text, size, font === 'F2');
    return drawText(centerX - w / 2, y, text, font, size, rgb);
  }

  function drawWrapped(cmds, x, startY, lineHeight, text, maxWidthPts, font, size, rgb, maxLines = 6) {
    const lines = wrapText(text, maxWidthPts, size, font === 'F2', maxLines);
    for (let i = 0; i < lines.length; i++) {
      cmds.push(drawText(x, startY - i * lineHeight, lines[i], font, size, rgb));
    }
    return startY - lines.length * lineHeight;
  }

  // Draws a crisp native vector Spider / Radar Chart inside a dark navy card
  function drawRadarCard(cmds, cardX, cardY, cardW, cardH, title, dims, accentRgb, softFillRgb, valRgb) {
    cmds.push(C_NAVY + ' rg ' + cardX + ' ' + cardY + ' ' + cardW + ' ' + cardH + ' re f');
    cmds.push(accentRgb + ' rg ' + cardX + ' ' + (cardY + cardH - 2.5) + ' ' + cardW + ' 2.5 re f');
    cmds.push(drawCenterText(cardX + cardW / 2, cardY + cardH - 16, title, 'F2', 8.2, C_WHITE));

    const N = dims.length;
    if (N < 3) return;
    const cx = cardX + cardW / 2;
    const cy = cardY + 101;
    const R = 59;

    const angles = [];
    for (let i = 0; i < N; i++) {
      angles.push(Math.PI / 2 - (i * 2 * Math.PI / N));
    }

    // 1. Concentric background inner circle & shaded data polygon first (so web lines stay crisp on top)
    const dataPts = angles.map((a, i) => {
      const frac = Math.max(0.05, Math.min(1.0, dims[i].scoreNum / 100));
      return {
        x: cx + R * frac * Math.cos(a),
        y: cy + R * frac * Math.sin(a)
      };
    });

    // Subtle dark polar backing polygon (100% ring)
    let outerPath = '';
    for (let i = 0; i < N; i++) {
      const px = cx + R * Math.cos(angles[i]);
      const py = cy + R * Math.sin(angles[i]);
      outerPath += px.toFixed(2) + ' ' + py.toFixed(2) + (i === 0 ? ' m ' : ' l ');
    }
    cmds.push('0.055 0.110 0.215 rg ' + outerPath + 'h f');

    // Soft-tinted filled data polygon
    let fillPath = '';
    for (let i = 0; i < N; i++) {
      fillPath += dataPts[i].x.toFixed(2) + ' ' + dataPts[i].y.toFixed(2) + (i === 0 ? ' m ' : ' l ');
    }
    cmds.push(softFillRgb + ' rg ' + fillPath + 'h f');

    // 2. Concentric web rings (20%, 40%, 60%, 80%, 100%)
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    cmds.push('0.24 0.31 0.44 RG 0.55 w');
    for (let l = 0; l < levels.length; l++) {
      const r = R * levels[l];
      let ringPath = '';
      for (let i = 0; i < N; i++) {
        const px = cx + r * Math.cos(angles[i]);
        const py = cy + r * Math.sin(angles[i]);
        ringPath += px.toFixed(2) + ' ' + py.toFixed(2) + (i === 0 ? ' m ' : ' l ');
      }
      cmds.push(ringPath + 'h S');
    }

    // 3. Radial spokes
    for (let i = 0; i < N; i++) {
      const px = cx + R * Math.cos(angles[i]);
      const py = cy + R * Math.sin(angles[i]);
      cmds.push('0.24 0.31 0.44 RG 0.55 w ' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ' m ' + px.toFixed(2) + ' ' + py.toFixed(2) + ' l S');
    }

    // 4. Crisp 1.8pt data polygon outline
    cmds.push(accentRgb + ' RG 1.8 w ' + fillPath + 'h S');

    // 5. Vertex dots + axis labels clamped strictly inside the card
    for (let i = 0; i < N; i++) {
      const pt = dataPts[i];
      // Small square/diamond-like crisp circle approximation using 4 bezier curves
      const rad = 2.6;
      const k = rad * 0.5523;
      const x = pt.x, y = pt.y;
      const dotPath = [
        (x + rad).toFixed(2) + ' ' + y.toFixed(2) + ' m',
        (x + rad).toFixed(2) + ' ' + (y + k).toFixed(2) + ' ' + (x + k).toFixed(2) + ' ' + (y + rad).toFixed(2) + ' ' + x.toFixed(2) + ' ' + (y + rad).toFixed(2) + ' c',
        (x - k).toFixed(2) + ' ' + (y + rad).toFixed(2) + ' ' + (x - rad).toFixed(2) + ' ' + (y + k).toFixed(2) + ' ' + (x - rad).toFixed(2) + ' ' + y.toFixed(2) + ' c',
        (x - rad).toFixed(2) + ' ' + (y - k).toFixed(2) + ' ' + (x - k).toFixed(2) + ' ' + (y - rad).toFixed(2) + ' ' + x.toFixed(2) + ' ' + (y - rad).toFixed(2) + ' c',
        (x + k).toFixed(2) + ' ' + (y - rad).toFixed(2) + ' ' + (x + rad).toFixed(2) + ' ' + (y - k).toFixed(2) + ' ' + (x + rad).toFixed(2) + ' ' + y.toFixed(2) + ' c h'
      ].join(' ');
      cmds.push(C_WHITE + ' rg ' + accentRgb + ' RG 1.1 w ' + dotPath + ' B');

      // Axis label
      const a = angles[i];
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const lDist = R + 12;
      const lx = cx + lDist * cosA;
      const ly = cy + lDist * sinA;

      const words = dims[i].name.split(' ');
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      const pctTag = Math.round(dims[i].scoreNum) + '%';

      const fSize = 6.2;
      const minX = cardX + 6;
      const maxX = cardX + cardW - 6;

      function placeAxisLine(txt, yPos, font, rgb) {
        const w = measureText(txt, fSize, font === 'F2');
        let tx;
        if (cosA > 0.32) {
          tx = Math.min(lx, maxX - w);
        } else if (cosA < -0.32) {
          tx = Math.max(lx - w, minX);
        } else {
          tx = Math.max(minX, Math.min(lx - w / 2, maxX - w));
        }
        cmds.push(drawText(tx, yPos, txt, font, fSize, rgb));
      }

      const baseLy = sinA > 0.5 ? ly + 4 : (sinA < -0.5 ? ly - 5 : ly + 2);
      if (line2) {
        placeAxisLine(line1, baseLy + 4, 'F2', C_SLATE_200);
        placeAxisLine(line2 + ' (' + pctTag + ')', baseLy - 3.5, 'F1', valRgb);
      } else {
        placeAxisLine(line1 + ' (' + pctTag + ')', baseLy, 'F2', valRgb);
      }
    }
  }

  // Color palette
  const C_NAVY = '0.039 0.078 0.157';
  const C_GOLD = '0.773 0.627 0.349';
  const C_GOLD_SOFT = '0.902 0.800 0.600';
  const C_GOLD_FILL = '0.294 0.251 0.165';
  const C_CORAL = '0.918 0.345 0.047';
  const C_CORAL_SOFT = '0.992 0.729 0.455';
  const C_CORAL_FILL = '0.345 0.145 0.102';
  const C_EMERALD = '0.086 0.639 0.290';
  const C_BLUE = '0.145 0.388 0.922';
  const C_SLATE_700 = '0.200 0.255 0.333';
  const C_SLATE_500 = '0.392 0.455 0.545';
  const C_SLATE_300 = '0.796 0.835 0.882';
  const C_SLATE_200 = '0.886 0.910 0.941';
  const C_SLATE_50 = '0.973 0.980 0.988';
  const C_WHITE = '1 1 1';

  function bandColor(scoreNum) {
    if (scoreNum >= 75) return C_EMERALD;
    if (scoreNum >= 55) return C_BLUE;
    return C_CORAL;
  }

  const defaultHealthDims = [
    { name: 'Monthly Savings', weight: 0.15, scoreNum: 80.0, band: 'Optimal Resilience' },
    { name: 'Emergency Moat', weight: 0.15, scoreNum: 75.0, band: 'Optimal Resilience' },
    { name: 'Debt Servicing', weight: 0.15, scoreNum: 85.0, band: 'Optimal Resilience' },
    { name: 'Life & Health Cover', weight: 0.15, scoreNum: 70.0, band: 'Satisfactory' },
    { name: 'Diversification', weight: 0.10, scoreNum: 75.0, band: 'Optimal Resilience' },
    { name: 'Retirement Readiness', weight: 0.10, scoreNum: 80.0, band: 'Optimal Resilience' },
    { name: 'Children Education', weight: 0.10, scoreNum: 70.0, band: 'Satisfactory' },
    { name: 'Estate Governance', weight: 0.10, scoreNum: 75.0, band: 'Optimal Resilience' }
  ];

  const rawHealthCats = Array.isArray(health.categories) && health.categories.length > 0 ? health.categories : null;
  const healthDims = (rawHealthCats ? rawHealthCats.slice(0, 8) : defaultHealthDims).map((c) => {
    const w = Number(c.weight ?? 0.125);
    const s = Math.max(0, Math.min(100, Number(c.score_pct ?? c.normalized_score ?? c.scoreNum ?? 0)));
    const p = Number(c.weighted_score ?? (s * w));
    const band = cleanPlain(c.band || (s >= 80 ? 'Optimal Resilience' : s >= 60 ? 'Satisfactory' : s >= 40 ? 'Moderate Buffer' : 'Needs Optimization'));
    return {
      name: cleanPlain(c.name || 'Health Factor').slice(0, 28),
      weightNum: w,
      weight: Math.round(w * 100) + '%',
      scoreNum: s,
      score: s.toFixed(1) + '%',
      pts: p.toFixed(2),
      band: band.slice(0, 22)
    };
  });

  const defaultRiskDims = [
    { name: 'Inflow Stability', weight: 0.15, scoreNum: 70.0, band: 'Moderate Risk Buffer' },
    { name: 'Drawdown Tolerance', weight: 0.15, scoreNum: 65.0, band: 'Moderate Risk Buffer' },
    { name: 'Investment Horizon', weight: 0.15, scoreNum: 75.0, band: 'Moderate Risk Buffer' },
    { name: 'Expense Flexibility', weight: 0.15, scoreNum: 65.0, band: 'Moderate Risk Buffer' },
    { name: 'Dependent Cushion', weight: 0.15, scoreNum: 60.0, band: 'Moderate Risk Buffer' },
    { name: 'Market Track Record', weight: 0.15, scoreNum: 60.0, band: 'Moderate Risk Buffer' },
    { name: 'Allocation Mandate', weight: 0.10, scoreNum: 65.0, band: 'Moderate Risk Buffer' }
  ];

  const rawRiskCats = Array.isArray(risk.categories) && risk.categories.length > 0 ? risk.categories : null;
  const riskDims = (rawRiskCats ? rawRiskCats.slice(0, 7) : defaultRiskDims).map((c) => {
    const w = Number(c.weight ?? 0.14);
    const s = Math.max(0, Math.min(100, Number(c.score_pct ?? c.normalized_score ?? c.scoreNum ?? 0)));
    const p = Number(c.weighted_score ?? (s * w));
    const band = cleanPlain(c.band || (s >= 80 ? 'High Risk Tolerance' : s >= 60 ? 'Moderate Risk Buffer' : s >= 40 ? 'Cautious Allocation' : 'Capital Preservation'));
    return {
      name: cleanPlain(c.name || 'Risk Factor').slice(0, 28),
      weightNum: w,
      weight: Math.round(w * 100) + '%',
      scoreNum: s,
      score: s.toFixed(1) + '%',
      pts: p.toFixed(2),
      band: band.slice(0, 22)
    };
  });

  const computedH = healthDims.reduce((acc, d) => acc + Number(d.pts), 0);
  const computedR = riskDims.reduce((acc, d) => acc + Number(d.pts), 0);
  const hNum = Math.max(0, Math.min(100, Number(health.overall_score ?? safeData.h_score ?? computedH)));
  const rNum = Math.max(0, Math.min(100, Number(risk.overall_score ?? safeData.r_score ?? computedR)));
  const hScore = hNum.toFixed(1);
  const rScore = rNum.toFixed(1);

  const hRating = cleanPlain(
    health.rating || safeData.h_rating ||
    (hNum >= 80 ? 'Strong Financial Foundation' : hNum >= 60 ? 'Moderate Foundation' : hNum >= 40 ? 'Requires Strategic Optimization' : 'Critical Attention Needed')
  );
  const rRating = cleanPlain(
    risk.rating || safeData.r_rating ||
    (rNum >= 75 ? 'Aggressive Growth Focus' : rNum >= 55 ? 'Balanced Growth Focus' : rNum >= 40 ? 'Moderate Conservative' : 'Conservative Capital Preservation')
  );

  const healthDesc = [...healthDims].sort((a, b) => b.scoreNum - a.scoreNum);
  const healthAsc = [...healthDims].sort((a, b) => a.scoreNum - b.scoreNum);
  const riskDesc = [...riskDims].sort((a, b) => b.scoreNum - a.scoreNum);
  const riskAsc = [...riskDims].sort((a, b) => a.scoreNum - b.scoreNum);

  const allFactors = [
    ...healthDims.map(d => ({ ...d, pillar: 'Health' })),
    ...riskDims.map(d => ({ ...d, pillar: 'Risk' }))
  ];
  const allDesc = [...allFactors].sort((a, b) => b.scoreNum - a.scoreNum);
  const allAsc = [...allFactors].sort((a, b) => a.scoreNum - b.scoreNum);

  // Plain-English, investor-friendly guidance per dimension (no RIA claims)
  function dimensionGuidance(name, scoreNum, pillar) {
    const n = name.toLowerCase();
    if (n.includes('saving') || n.includes('surplus')) {
      return scoreNum >= 75
        ? 'Your steady monthly savings give you strong fuel to grow wealth through regular SIPs.'
        : 'Setting up an automatic monthly SIP right after payday can boost your savings habit.';
    }
    if (n.includes('emergency') || n.includes('moat') || n.includes('liquid')) {
      return scoreNum >= 75
        ? 'Your emergency reserve protects long-term investments from unexpected cash needs.'
        : 'Build 6-9 months of household expenses in Liquid or Overnight Mutual Funds first.';
    }
    if (n.includes('debt') || n.includes('leverage')) {
      return scoreNum >= 75
        ? 'Keeping EMIs low gives your family comfortable monthly breathing room to invest.'
        : 'Aim to keep total loan EMIs under 30% of monthly income before taking higher risk.';
    }
    if (n.includes('life') || n.includes('health') || n.includes('insur') || n.includes('protect')) {
      return scoreNum >= 75
        ? 'Your life and medical insurance keeps family wealth safe against unexpected events.'
        : 'Check that you have pure term life cover (10-15x income) and a strong family health policy.';
    }
    if (n.includes('diversif')) {
      return scoreNum >= 75
        ? 'Spreading money across equity, debt, and liquid funds reduces reliance on one asset.'
        : 'Balance your holdings across Equity, Debt, and Multi-Asset Mutual Funds for steadier growth.';
    }
    if (n.includes('retire')) {
      return scoreNum >= 75
        ? 'Your retirement savings are on track to beat inflation over the long run.'
        : 'Start or step up a dedicated long-term Equity/Hybrid SIP earmarked just for retirement.';
    }
    if (n.includes('educat') || n.includes('milestone')) {
      return scoreNum >= 75
        ? 'Major family goals are separated neatly so short-term needs stay safe.'
        : 'Keep education and milestone goals in separate folios matched to their target year.';
    }
    if (n.includes('estate') || n.includes('govern')) {
      return scoreNum >= 75
        ? 'Updated nominees and organized records ensure smooth continuity for your family.'
        : 'Verify 100% nominee details across all bank accounts and folios, and keep a simple asset list.';
    }
    if (n.includes('inflow') || n.includes('income')) {
      return scoreNum >= 75
        ? 'Steady income makes it easier to stay consistent with monthly investments.'
        : 'Keep a slightly larger Liquid Fund buffer to stay comfortable during slower income months.';
    }
    if (n.includes('drawdown') || n.includes('volatility')) {
      return scoreNum >= 75
        ? 'Your calm mindset during market dips helps you benefit from long-term compounding.'
        : 'Balanced Advantage or Multi-Asset Mutual Funds can help soften bumpy market swings.';
    }
    if (n.includes('horizon')) {
      return scoreNum >= 75
        ? 'A long holding period gives equity funds time to recover from short-term market dips.'
        : 'Money needed within 1-3 years belongs in safer Liquid, Arbitrage, or Short-Term Debt funds.';
    }
    if (n.includes('expense') || n.includes('flex')) {
      return scoreNum >= 75
        ? 'Flexible spending lets you trim non-essentials if income ever slows down.'
        : 'Separating must-pay bills from lifestyle spends keeps your SIPs running smoothly.';
    }
    if (n.includes('dependent')) {
      return scoreNum >= 75
        ? 'Lighter dependent responsibilities give you room to invest for long-term growth.'
        : 'With family dependents relying on you, prioritize term/health cover and liquid safety nets.';
    }
    if (n.includes('track') || n.includes('market') || n.includes('exper')) {
      return scoreNum >= 75
        ? 'Your market experience helps you stay disciplined across changing cycles.'
        : 'Gradual monthly SIPs or STPs are a comfortable way to build market familiarity over time.';
    }
    if (n.includes('mandate') || n.includes('alloc')) {
      return scoreNum >= 75
        ? 'A growth-focused mindset fits well with diversified equity mutual funds and HNW PMS/AIF.'
        : 'Keep core savings anchored in steady Debt, Arbitrage, and Conservative Hybrid funds.';
    }
    return pillar === 'Health'
      ? (scoreNum >= 75 ? 'A healthy strength supporting your long-term family goals.' : 'Improving this area will make your overall financial foundation noticeably stronger.')
      : (scoreNum >= 75 ? 'Gives your portfolio solid staying power through market ups and downs.' : 'Adding a cushion here helps protect your family against sudden surprises.');
  }

  function mapInstrumentForArea(area, action) {
    const t = (String(area) + ' ' + String(action)).toLowerCase();
    if (t.includes('emergency') || t.includes('moat') || t.includes('liquid')) {
      return 'Liquid, Overnight & Arbitrage Mutual Funds';
    }
    if (t.includes('debt') || t.includes('leverage') || t.includes('emi')) {
      return 'Loan Prepayment & Short-Duration Debt MFs';
    }
    if (t.includes('life') || t.includes('health') || t.includes('protect') || t.includes('insur')) {
      return 'Pure Term Life & Family Health Cover';
    }
    if (t.includes('saving') || t.includes('diversif') || t.includes('drawdown') || t.includes('equity')) {
      return 'Flexi-Cap, Multi-Cap & Multi-Asset MFs (SIP)';
    }
    if (t.includes('retire') || t.includes('educat') || t.includes('milestone')) {
      return 'Goal-Tagged Equity/Hybrid MFs & NPS Tier-1';
    }
    if (t.includes('estate') || t.includes('govern') || t.includes('nominee')) {
      return 'Nominee Audit & Will Readiness';
    }
    if (t.includes('inflow') || t.includes('income') || t.includes('expense')) {
      return 'Arbitrage Funds & Staggered STP';
    }
    if (t.includes('pms') || t.includes('aif') || t.includes('hnw') || t.includes('mandate') || t.includes('horizon')) {
      return 'Equity MFs, PMS (Rs. 50L+) & Cat II/III AIF';
    }
    return 'Diversified Mutual Funds & Hybrid Mix';
  }

  function pageHeader(title, sub) {
    return [
      C_NAVY + ' rg 36 756 523 54 re f',
      C_GOLD + ' rg 36 754 523 2.5 re f',
      drawText(48, 792, 'IRAH SERVICES LLP', 'F2', 12, C_GOLD),
      drawRightText(547, 792, 'Ref: ' + refId, 'F1', 7.5, C_SLATE_200),
      drawText(48, 777, title, 'F2', 10.5, C_WHITE),
      drawText(48, 763, sub, 'F1', 7.5, C_SLATE_200)
    ];
  }

  function pageFooter(pageNum) {
    return [
      C_SLATE_300 + ' RG 0.75 w 36 44 m 559 44 l S',
      drawText(36, 31, 'IRAH Services LLP | AMFI ARN-352385 | APMI APRN-08375 | Non-Advisory Distribution Report', 'F1', 6.8, C_SLATE_500),
      drawText(365, 31, 'Page ' + pageNum + ' of 4', 'F2', 7.2, C_SLATE_700),
      drawRightText(559, 31, 'Confidential - For Your Personal Review', 'F3', 6.8, C_SLATE_500)
    ];
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 1: YOUR EXECUTIVE FINANCIAL SNAPSHOT
  // ═══════════════════════════════════════════════════════════════════
  const p1 = [];
  p1.push(...pageHeader(
    'YOUR PERSONAL FINANCIAL ASSESSMENT REPORT',
    'Financial Health Snapshot, Risk Comfort Profile & Practical Action Roadmap'
  ));

  // 1. Client Profile Grid (y: 648 to 743 -> 5 rows x 19pt)
  p1.push(C_SLATE_50 + ' rg 36 648 523 95 re f');
  p1.push(C_SLATE_300 + ' RG 0.75 w 36 648 523 95 re S');
  for (let row = 1; row <= 4; row++) {
    const ly = 743 - row * 19;
    p1.push(C_SLATE_200 + ' RG 0.5 w 36 ' + ly + ' m 559 ' + ly + ' l S');
  }
  p1.push(C_SLATE_200 + ' RG 0.5 w 295 648 m 295 743 l S');

  const profileRows = [
    ['PREPARED FOR:', fitSingleLine(clientName, 165, 8, false), 'DATE:', fitSingleLine(dateStr, 150, 8, false)],
    ['AGE GROUP:', fitSingleLine(age, 165, 8, false), 'PROFESSION:', fitSingleLine(employment, 150, 8, false)],
    ['ANNUAL INCOME:', fitSingleLine(income, 165, 8, false), 'INCOME SOURCE:', fitSingleLine(source, 150, 8, false)],
    ['HOUSEHOLD:', fitSingleLine(familyInfo, 165, 8, false), 'REFERENCE ID:', fitSingleLine(refId, 150, 8, true)],
    ['PRIMARY GOAL:', fitSingleLine(goal, 165, 8, false), 'DISTRIBUTOR ID:', 'ARN-352385 | APRN-08375 (Non-RIA)']
  ];
  for (let r = 0; r < profileRows.length; r++) {
    const ty = 743 - r * 19 - 13;
    p1.push(drawText(44, ty, profileRows[r][0], 'F2', 7, C_GOLD));
    p1.push(drawText(120, ty, profileRows[r][1], 'F1', 8, C_NAVY));
    p1.push(drawText(303, ty, profileRows[r][2], 'F2', 7, C_GOLD));
    p1.push(drawText(392, ty, profileRows[r][3], r === 3 ? 'F2' : 'F1', 8, C_NAVY));
  }

  // 2. Dual Score Cards (y: 506 to 636)
  p1.push(C_NAVY + ' rg 36 506 255 130 re f');
  p1.push(C_GOLD + ' rg 36 633 255 3 re f');
  p1.push(C_NAVY + ' rg 304 506 255 130 re f');
  p1.push(C_CORAL + ' rg 304 633 255 3 re f');

  p1.push('0.14 0.20 0.31 rg 50 564 227 6 re f');
  const hW = Math.max(8, Math.min(227, 227 * (hNum / 100)));
  p1.push(C_GOLD + ' rg 50 564 ' + hW.toFixed(1) + ' 6 re f');

  p1.push('0.14 0.20 0.31 rg 318 564 227 6 re f');
  const rW = Math.max(8, Math.min(227, 227 * (rNum / 100)));
  p1.push(C_CORAL + ' rg 318 564 ' + rW.toFixed(1) + ' 6 re f');

  p1.push(drawText(50, 601, hScore + '%', 'F2', 25, C_GOLD));
  p1.push(drawText(50, 582, 'YOUR FINANCIAL HEALTH SCORE', 'F2', 8, C_WHITE));
  p1.push(drawText(50, 548, 'Standing: ' + fitSingleLine(hRating, 195, 8, true), 'F2', 8, C_GOLD_SOFT));
  p1.push(drawText(50, 532, fitSingleLine('* Top Strength: ' + healthDesc[0].name + ' (' + healthDesc[0].score + ')', 228, 7, false), 'F1', 7, C_SLATE_200));
  p1.push(drawText(50, 519, fitSingleLine('* Priority Focus: ' + healthAsc[0].name + ' (' + healthAsc[0].score + ')', 228, 7, false), 'F1', 7, C_SLATE_200));

  p1.push(drawText(318, 601, rScore + '%', 'F2', 25, C_CORAL));
  p1.push(drawText(318, 582, 'YOUR RISK & RESILIENCE PROFILE', 'F2', 8, C_WHITE));
  p1.push(drawText(318, 548, 'Profile: ' + fitSingleLine(rRating, 195, 8, true), 'F2', 8, C_CORAL_SOFT));
  p1.push(drawText(318, 532, fitSingleLine('* Strongest Cushion: ' + riskDesc[0].name + ' (' + riskDesc[0].score + ')', 228, 7, false), 'F1', 7, C_SLATE_200));
  p1.push(drawText(318, 519, fitSingleLine('* Watch Area: ' + riskAsc[0].name + ' (' + riskAsc[0].score + ')', 228, 7, false), 'F1', 7, C_SLATE_200));

  // 3. What Your Scores Mean + Visual Indicative Mix Bar (y: 352 to 494)
  p1.push(C_SLATE_50 + ' rg 36 352 523 142 re f');
  p1.push(C_SLATE_300 + ' RG 0.75 w 36 352 523 142 re S');
  p1.push(C_GOLD + ' rg 36 352 3.5 142 re f');

  p1.push(drawText(48, 477, 'WHAT YOUR SCORES MEAN FOR YOUR FAMILY', 'F2', 9, C_NAVY));

  let healthSynth;
  if (hNum >= 80) {
    healthSynth = `Your overall financial health is strong (${hScore}% - ${hRating}), led by ${healthDesc[0].name} (${healthDesc[0].score}) and ${healthDesc[1].name} (${healthDesc[1].score}). Polishing ${healthAsc[0].name} (${healthAsc[0].score}) will make your foundation even more resilient.`;
  } else if (hNum >= 60) {
    healthSynth = `You have a steady financial base (${hScore}% - ${hRating}), anchored by ${healthDesc[0].name} (${healthDesc[0].score}). Improving ${healthAsc[0].name} (${healthAsc[0].score}) and ${healthAsc[1].name} (${healthAsc[1].score}) will meaningfully boost your family's safety net.`;
  } else {
    healthSynth = `Your finances show pressure points (${hScore}% - ${hRating}), especially in ${healthAsc[0].name} (${healthAsc[0].score}) and ${healthAsc[1].name} (${healthAsc[1].score}). Focusing first on emergency savings, lower EMIs, and term/health cover will create immediate stability.`;
  }

  let riskSynth;
  if (rNum >= 70) {
    riskSynth = `Your risk profile (${rScore}% - ${rRating}) shows good comfort staying invested through market ups and downs while keeping an eye on ${riskAsc[0].name} (${riskAsc[0].score}).`;
  } else if (rNum >= 50) {
    riskSynth = `Your risk profile (${rScore}% - ${rRating}) favors a balanced approach: growing wealth steadily via mutual funds while keeping liquid and hybrid cushions around ${riskAsc[0].name} (${riskAsc[0].score}).`;
  } else {
    riskSynth = `Your risk profile (${rScore}% - ${rRating}) favors safety and stability first, leaning on Liquid, Arbitrage, and Short-Term Debt funds while protecting against ${riskAsc[0].name} (${riskAsc[0].score}).`;
  }

  let eqPct = 35, hybPct = 35, liqPct = 30;
  let mixLabel = 'Educational Mix Illustration: Balanced Mutual Funds (35%) | Hybrid & Debt (35%) | Liquid Reserve (30%)';
  if (hNum >= 75 && rNum >= 65) {
    eqPct = 60; hybPct = 25; liqPct = 15;
    mixLabel = 'Educational Mix Illustration: Equity Mutual Funds (60%) | Hybrid & Debt (25%) | Liquid Reserve (15%)';
  } else if (hNum >= 55 && rNum >= 50) {
    eqPct = 45; hybPct = 35; liqPct = 20;
    mixLabel = 'Educational Mix Illustration: Equity Mutual Funds (45%) | Balanced Hybrid & Debt (35%) | Liquid Reserve (20%)';
  } else {
    eqPct = 20; hybPct = 35; liqPct = 45;
    mixLabel = 'Educational Mix Illustration: Liquid & Overnight Safety (45%) | Hybrid & Debt (35%) | Staggered Equity SIP (20%)';
  }

  drawWrapped(p1, 48, 461, 11.2, healthSynth + ' ' + riskSynth, 498, 'F1', 7.8, C_SLATE_700, 4);
  p1.push(drawText(48, 405, fitSingleLine('GOAL ALIGNMENT (' + goal + '): Protect ' + healthAsc[0].name + ' while compounding your core strengths.', 498, 7.6, true), 'F2', 7.6, C_GOLD));

  // Visual stacked allocation bar (width 498pt, y: 382..391)
  const wEq = 498 * (eqPct / 100);
  const wHyb = 498 * (hybPct / 100);
  const wLiq = 498 - wEq - wHyb;
  p1.push(C_GOLD + ' rg 48 383 ' + wEq.toFixed(1) + ' 9 re f');
  p1.push(C_BLUE + ' rg ' + (48 + wEq).toFixed(1) + ' 383 ' + wHyb.toFixed(1) + ' 9 re f');
  p1.push(C_EMERALD + ' rg ' + (48 + wEq + wHyb).toFixed(1) + ' 383 ' + wLiq.toFixed(1) + ' 9 re f');
  p1.push(drawText(48, 370, mixLabel, 'F2', 7.1, C_NAVY));
  p1.push(drawText(48, 359, 'Note: Educational orientation only (not investment advice). Your investments go directly from your bank to the fund house (AMC).', 'F1', 6.8, C_SLATE_500));

  // 4. Your Top Strengths & Where to Focus Next (y: 192 to 340)
  p1.push(C_SLATE_50 + ' rg 36 192 255 148 re f');
  p1.push(C_SLATE_300 + ' RG 0.75 w 36 192 255 148 re S');
  p1.push(C_EMERALD + ' rg 36 337 255 3 re f');

  p1.push(C_SLATE_50 + ' rg 304 192 255 148 re f');
  p1.push(C_SLATE_300 + ' RG 0.75 w 304 192 255 148 re S');
  p1.push(C_CORAL + ' rg 304 337 255 3 re f');

  p1.push(drawText(48, 323, '[+] YOUR TOP STRENGTHS', 'F2', 8.4, C_EMERALD));
  let sY = 306;
  for (let i = 0; i < 3; i++) {
    const item = allDesc[i];
    p1.push(drawText(48, sY, fitSingleLine((i + 1) + '. ' + item.name + ' (' + item.score + ')', 232, 7.5, true), 'F2', 7.5, C_NAVY));
    drawWrapped(p1, 48, sY - 10, 9.5, dimensionGuidance(item.name, item.scoreNum, item.pillar), 232, 'F1', 6.9, C_SLATE_500, 2);
    sY -= 36;
  }

  p1.push(drawText(316, 323, '[!] WHERE TO FOCUS NEXT', 'F2', 8.4, C_CORAL));
  let gY = 306;
  for (let i = 0; i < 3; i++) {
    const item = allAsc[i];
    p1.push(drawText(316, gY, fitSingleLine((i + 1) + '. ' + item.name + ' (' + item.score + ')', 232, 7.5, true), 'F2', 7.5, C_NAVY));
    drawWrapped(p1, 316, gY - 10, 9.5, dimensionGuidance(item.name, item.scoreNum, item.pillar), 232, 'F1', 6.9, C_SLATE_500, 2);
    gY -= 36;
  }

  // 5. Investor Safeguards & Registration Strip (y: 54 to 180)
  p1.push(C_NAVY + ' rg 36 54 523 126 re f');
  p1.push(C_GOLD + ' rg 36 177 523 3 re f');

  p1.push(drawText(48, 162, 'YOUR SAFEGUARDS & OUR REGULATORY ROLE', 'F2', 8.5, C_GOLD));
  p1.push(drawText(48, 146, '* Registered Distributor: IRAH Services LLP is an AMFI-Registered Mutual Fund Distributor (ARN-352385) & APMI-Registered Distributor (APRN-08375).', 'F1', 6.9, C_SLATE_200));
  p1.push(drawText(48, 133, '* Your Money Stays Safe: IRAH never holds client money and never accepts cash or cheques in its own name.', 'F1', 7.0, C_SLATE_200));
  p1.push(drawText(48, 120, '* Direct Investment Settlement: All mutual fund & institutional investments settle directly between your bank and the AMC / fund house.', 'F1', 7.0, C_SLATE_200));
  p1.push(drawText(48, 107, '* Non-Advisory Role: IRAH distributes Mutual Funds, PMS, AIF, SIF & Fixed Income. IRAH does not provide Financial Advisory or RIA services.', 'F1', 7.0, C_SLATE_200));
  p1.push(drawText(48, 94, '* Market Risk Disclosure: Mutual fund investments are subject to market risks, read all scheme related documents carefully.', 'F1', 7.0, C_SLATE_200));
  p1.push(drawText(48, 72, 'Relationship Desk: harikant.irah@gmail.com | Grievances: grievances@irah.co.in | Helplines: +91 9779776119, +91 8558822528', 'F2', 7.2, C_GOLD));
  p1.push(...pageFooter(1));

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 2: PILLAR I — FINANCIAL HEALTH BREAKDOWN & RADAR CHART
  // ═══════════════════════════════════════════════════════════════════
  const p2 = [];
  p2.push(...pageHeader(
    'PILLAR I: FINANCIAL HEALTH CHECK',
    `How Your Household Scores Across ${healthDims.length} Everyday Financial Pillars`
  ));

  // Left: Native Vector Spider/Radar Chart (x: 36..282, y: 512..743)
  drawRadarCard(
    p2, 36, 512, 246, 231,
    `Financial Health Radar (${healthDims.length} Factors)`,
    healthDims, C_GOLD, C_GOLD_FILL, C_GOLD_SOFT
  );

  // Right: Visual Score Bars Card (x: 290..559, y: 512..743)
  p2.push(C_SLATE_50 + ' rg 290 512 269 231 re f');
  p2.push(C_SLATE_300 + ' RG 0.75 w 290 512 269 231 re S');
  p2.push(drawText(300, 728, 'SCORE BREAKDOWN VS. 75% TARGET', 'F2', 8.0, C_NAVY));
  p2.push(drawRightText(549, 728, hScore + '% Overall', 'F2', 7.8, C_GOLD));

  let curY = 706;
  for (let i = 0; i < healthDims.length; i++) {
    const dim = healthDims[i];
    const barCol = dim.scoreNum >= 75 ? C_EMERALD : dim.scoreNum >= 55 ? C_GOLD : C_CORAL;
    p2.push(drawText(300, curY, (i + 1) + '. ' + fitSingleLine(dim.name, 165, 7.2, true), 'F2', 7.2, C_NAVY));
    p2.push(drawRightText(549, curY, dim.score, 'F2', 7.2, barCol));

    p2.push(C_SLATE_200 + ' rg 300 ' + (curY - 8) + ' 249 5 re f');
    const barW = Math.max(5, Math.min(249, 249 * (dim.scoreNum / 100)));
    p2.push(barCol + ' rg 300 ' + (curY - 8) + ' ' + barW.toFixed(1) + ' 5 re f');
    p2.push(C_NAVY + ' rg ' + (300 + 249 * 0.75).toFixed(1) + ' ' + (curY - 9) + ' 1 7 re f');
    curY -= 24.5;
  }

  // Health Score Summary Table (Header y: 482..502, 8 rows x 19pt: 330..482, Total y: 310..330)
  p2.push(C_NAVY + ' rg 36 482 523 20 re f');
  p2.push(drawText(46, 489, 'Financial Health Area', 'F2', 7.8, C_GOLD));
  p2.push(drawText(235, 489, 'Weight', 'F2', 7.8, C_WHITE));
  p2.push(drawText(300, 489, 'Your Score', 'F2', 7.8, C_WHITE));
  p2.push(drawText(375, 489, 'Points', 'F2', 7.8, C_WHITE));
  p2.push(drawText(455, 489, 'Standing', 'F2', 7.8, C_GOLD));

  let rowY = 463;
  for (let i = 0; i < healthDims.length; i++) {
    const dim = healthDims[i];
    const bg = (i % 2 === 0) ? C_SLATE_50 : C_WHITE;
    p2.push(bg + ' rg 36 ' + rowY + ' 523 19 re f');
    p2.push(C_SLATE_200 + ' RG 0.5 w 36 ' + rowY + ' 523 19 re S');
    p2.push(drawText(46, rowY + 6, (i + 1) + '. ' + dim.name, 'F1', 7.4, C_NAVY));
    p2.push(drawText(242, rowY + 6, dim.weight, 'F1', 7.4, C_SLATE_500));
    p2.push(drawText(307, rowY + 6, dim.score, 'F1', 7.4, C_NAVY));
    p2.push(drawText(380, rowY + 6, dim.pts, 'F1', 7.4, C_NAVY));
    p2.push(drawText(455, rowY + 6, dim.band, 'F2', 7.2, bandColor(dim.scoreNum)));
    rowY -= 19;
  }

  p2.push('0.945 0.961 0.976 rg 36 ' + rowY + ' 523 20 re f');
  p2.push(C_SLATE_300 + ' RG 1 w 36 ' + rowY + ' 523 20 re S');
  p2.push(drawText(46, rowY + 6.5, 'OVERALL FINANCIAL HEALTH SCORE', 'F2', 7.8, C_NAVY));
  p2.push(drawText(242, rowY + 6.5, '100%', 'F2', 7.8, C_SLATE_500));
  p2.push(drawText(307, rowY + 6.5, hScore + '%', 'F2', 7.8, C_NAVY));
  p2.push(drawText(380, rowY + 6.5, hScore, 'F2', 7.8, C_GOLD));
  p2.push(drawText(455, rowY + 6.5, fitSingleLine(hRating, 98, 7.2, true), 'F2', 7.2, bandColor(hNum)));

  // Investor-Friendly Health Insights Card (y: 54 to 298)
  p2.push(C_SLATE_50 + ' rg 36 54 523 244 re f');
  p2.push(C_SLATE_300 + ' RG 0.75 w 36 54 523 244 re S');
  p2.push(C_GOLD + ' rg 36 54 3.5 244 re f');

  p2.push(drawText(48, 282, 'WHAT YOUR FINANCIAL HEALTH SCORES TELL US', 'F2', 8.8, C_NAVY));
  const hObsList = [
    ...healthDesc.slice(0, 2).map(d => ({ tag: 'STRENGTH', color: C_EMERALD, dim: d })),
    ...healthAsc.slice(0, 3).map(d => ({ tag: 'OPPORTUNITY', color: C_CORAL, dim: d })),
    { tag: 'SAFETY NET', color: C_BLUE, dim: { name: 'Direct AMC Investments & Zero Custody', score: '100%', scoreNum: 100 } }
  ];
  let obsY = 264;
  for (let i = 0; i < hObsList.length; i++) {
    const o = hObsList[i];
    const headline = i === hObsList.length - 1
      ? '[SAFETY NET] Your Money Goes Straight to the Fund House:'
      : `[${o.tag}] ${o.dim.name} (${o.dim.score} - ${o.dim.band}):`;
    const detail = i === hObsList.length - 1
      ? 'Every rupee moves directly from your bank to the mutual fund AMC under ARN-352385 | APRN-08375.'
      : dimensionGuidance(o.dim.name, o.dim.scoreNum, 'Health');
    p2.push(drawText(48, obsY, fitSingleLine(headline, 498, 7.5, true), 'F2', 7.5, o.color));
    drawWrapped(p2, 56, obsY - 11, 9.5, detail, 490, 'F1', 7.2, C_SLATE_700, 2);
    obsY -= 32;
  }
  p2.push(drawText(48, 64, 'Good Habit: Reviewing your mutual fund statement every 6 months helps keep your goals and emergency reserves on track.', 'F2', 7.2, C_GOLD));
  p2.push(...pageFooter(2));

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 3: PILLAR II — RISK & RESILIENCE BREAKDOWN & RADAR CHART
  // ═══════════════════════════════════════════════════════════════════
  const p3 = [];
  p3.push(...pageHeader(
    'PILLAR II: RISK & RESILIENCE PROFILE',
    `How Comfortably Your Portfolio Handles Market Ups & Downs (${riskDims.length} Factors)`
  ));

  // Left: Native Vector Spider/Radar Chart (x: 36..282, y: 526..743)
  drawRadarCard(
    p3, 36, 526, 246, 217,
    `Risk & Resilience Radar (${riskDims.length} Factors)`,
    riskDims, C_CORAL, C_CORAL_FILL, C_CORAL_SOFT
  );

  // Right: Visual Risk Bars Card (x: 290..559, y: 526..743)
  p3.push(C_SLATE_50 + ' rg 290 526 269 217 re f');
  p3.push(C_SLATE_300 + ' RG 0.75 w 290 526 269 217 re S');
  p3.push(drawText(300, 728, 'RESILIENCE FACTORS AT A GLANCE', 'F2', 8.0, C_NAVY));
  p3.push(drawRightText(549, 728, rScore + '% Overall', 'F2', 7.8, C_CORAL));

  curY = 704;
  for (let i = 0; i < riskDims.length; i++) {
    const dim = riskDims[i];
    const barCol = dim.scoreNum >= 75 ? C_EMERALD : dim.scoreNum >= 50 ? C_GOLD : C_CORAL;
    p3.push(drawText(300, curY, (i + 1) + '. ' + fitSingleLine(dim.name, 165, 7.2, true), 'F2', 7.2, C_NAVY));
    p3.push(drawRightText(549, curY, dim.score, 'F2', 7.2, barCol));

    p3.push(C_SLATE_200 + ' rg 300 ' + (curY - 8) + ' 249 5 re f');
    const barW = Math.max(5, Math.min(249, 249 * (dim.scoreNum / 100)));
    p3.push(barCol + ' rg 300 ' + (curY - 8) + ' ' + barW.toFixed(1) + ' 5 re f');
    curY -= 25.5;
  }

  // Risk Breakdown Table (Header y: 496..516, 7 rows x 20pt: 356..496, Total y: 336..356)
  p3.push(C_NAVY + ' rg 36 496 523 20 re f');
  p3.push(drawText(46, 503, 'Risk & Resilience Area', 'F2', 7.8, C_CORAL));
  p3.push(drawText(235, 503, 'Weight', 'F2', 7.8, C_WHITE));
  p3.push(drawText(300, 503, 'Your Score', 'F2', 7.8, C_WHITE));
  p3.push(drawText(375, 503, 'Points', 'F2', 7.8, C_WHITE));
  p3.push(drawText(455, 503, 'Resilience Level', 'F2', 7.8, C_CORAL));

  rowY = 476;
  for (let i = 0; i < riskDims.length; i++) {
    const dim = riskDims[i];
    const bg = (i % 2 === 0) ? C_SLATE_50 : C_WHITE;
    p3.push(bg + ' rg 36 ' + rowY + ' 523 20 re f');
    p3.push(C_SLATE_200 + ' RG 0.5 w 36 ' + rowY + ' 523 20 re S');
    p3.push(drawText(46, rowY + 6.5, (i + 1) + '. ' + dim.name, 'F1', 7.4, C_NAVY));
    p3.push(drawText(242, rowY + 6.5, dim.weight, 'F1', 7.4, C_SLATE_500));
    p3.push(drawText(307, rowY + 6.5, dim.score, 'F1', 7.4, C_NAVY));
    p3.push(drawText(380, rowY + 6.5, dim.pts, 'F1', 7.4, C_NAVY));
    p3.push(drawText(455, rowY + 6.5, dim.band, 'F2', 7.2, bandColor(dim.scoreNum)));
    rowY -= 20;
  }

  p3.push('0.945 0.961 0.976 rg 36 ' + rowY + ' 523 20 re f');
  p3.push(C_SLATE_300 + ' RG 1 w 36 ' + rowY + ' 523 20 re S');
  p3.push(drawText(46, rowY + 6.5, 'OVERALL RISK & RESILIENCE SCORE', 'F2', 7.8, C_NAVY));
  p3.push(drawText(242, rowY + 6.5, '100%', 'F2', 7.8, C_SLATE_500));
  p3.push(drawText(307, rowY + 6.5, rScore + '%', 'F2', 7.8, C_NAVY));
  p3.push(drawText(380, rowY + 6.5, rScore, 'F2', 7.8, C_CORAL));
  p3.push(drawText(455, rowY + 6.5, fitSingleLine(rRating, 98, 7.2, true), 'F2', 7.2, bandColor(rNum)));

  // Investor-Friendly Stress-Test Card (y: 54 to 322)
  p3.push(C_SLATE_50 + ' rg 36 54 523 268 re f');
  p3.push(C_SLATE_300 + ' RG 0.75 w 36 54 523 268 re S');
  p3.push(C_CORAL + ' rg 36 54 3.5 268 re f');

  p3.push(drawText(48, 305, 'HOW YOUR PORTFOLIO HANDLES MARKET UPS & DOWNS', 'F2', 8.8, C_NAVY));

  const findDim = (kw, fallback) => riskDims.find(d => d.name.toLowerCase().includes(kw)) || fallback;
  const ddDim = findDim('drawdown', riskDims[1] || riskDims[0]);
  const hzDim = findDim('horizon', riskDims[2] || riskDims[0]);
  const infDim = findDim('inflow', riskDims[0]);
  const emDim = healthDims.find(d => d.name.toLowerCase().includes('emergency') || d.name.toLowerCase().includes('moat')) || healthDims[1] || healthDims[0];

  const stressObs = [
    {
      title: `1. If Equity Markets Drop 20% (${ddDim.name}: ${ddDim.score}):`,
      col: ddDim.scoreNum >= 70 ? C_EMERALD : C_CORAL,
      body: ddDim.scoreNum >= 70
        ? 'Your steady mindset lets you stay invested through market dips instead of selling at the bottom.'
        : 'Using Balanced Advantage or Multi-Asset Mutual Funds can keep interim drops much gentler on your comfort.'
    },
    {
      title: `2. If Income Temporarily Slows (${emDim.name}: ${emDim.score} | ${infDim.name}: ${infDim.score}):`,
      col: emDim.scoreNum >= 70 ? C_EMERALD : C_CORAL,
      body: emDim.scoreNum >= 70
        ? 'Your emergency reserve lets your household cover bills comfortably without touching long-term funds.'
        : 'Building 6-9 months of living expenses in a Liquid Fund protects your long-term SIPs from forced withdrawals.'
    },
    {
      title: `3. Matching Money to Time Horizon (${hzDim.name}: ${hzDim.score}):`,
      col: hzDim.scoreNum >= 70 ? C_BLUE : C_CORAL,
      body: hzDim.scoreNum >= 70
        ? 'Your multi-year horizon gives equity mutual funds plenty of runway to compound ahead of inflation.'
        : 'Keep any money needed in the next 1-3 years in safer Liquid, Arbitrage, or Short-Term Debt funds.'
    },
    {
      title: `4. Your Biggest Cushion (${riskDesc[0].name}: ${riskDesc[0].score}):`,
      col: C_EMERALD,
      body: dimensionGuidance(riskDesc[0].name, riskDesc[0].scoreNum, 'Risk')
    },
    {
      title: `5. Area to Fortify (${riskAsc[0].name}: ${riskAsc[0].score}):`,
      col: C_CORAL,
      body: dimensionGuidance(riskAsc[0].name, riskAsc[0].scoreNum, 'Risk')
    },
    {
      title: '6. Clear Boundaries & Transparency:',
      col: C_NAVY,
      body: 'IRAH distributes mutual funds & institutional products under ARN-352385 | APRN-08375 with zero client custody or trading discretion.'
    }
  ];

  let stY = 287;
  for (let i = 0; i < stressObs.length; i++) {
    p3.push(drawText(48, stY, fitSingleLine(stressObs[i].title, 498, 7.5, true), 'F2', 7.5, stressObs[i].col));
    drawWrapped(p3, 56, stY - 11, 9.5, stressObs[i].body, 490, 'F1', 7.2, C_SLATE_700, 2);
    stY -= 35;
  }
  p3.push(drawText(48, 64, 'Key Takeaway: Keeping your emergency fund separate lets your growth mutual funds ride out market cycles calmly.', 'F2', 7.2, C_CORAL));
  p3.push(...pageFooter(3));

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 4: YOUR PERSONAL ACTION ROADMAP & REGULATORY DISCLOSURES
  // ═══════════════════════════════════════════════════════════════════
  const p4 = [];
  p4.push(...pageHeader(
    'YOUR PERSONAL ACTION ROADMAP',
    'Prioritized Next Steps, Product Categories & Statutory Investor Safeguards'
  ));

  const incomingPlan = Array.isArray(safeData.action_plan) ? safeData.action_plan : [];
  const synthItems = [
    {
      area: healthAsc[0].name,
      action: `Focus on ${healthAsc[0].name.toLowerCase()} (${healthAsc[0].score}): ${dimensionGuidance(healthAsc[0].name, healthAsc[0].scoreNum, 'Health')}`,
      asset_class: mapInstrumentForArea(healthAsc[0].name, ''),
      timeframe: 'Next 30 Days',
      status: 'Top Priority'
    },
    {
      area: riskAsc[0].name,
      action: `Strengthen ${riskAsc[0].name.toLowerCase()} (${riskAsc[0].score}): ${dimensionGuidance(riskAsc[0].name, riskAsc[0].scoreNum, 'Risk')}`,
      asset_class: mapInstrumentForArea(riskAsc[0].name, ''),
      timeframe: '1 - 3 Months',
      status: 'High Priority'
    },
    {
      area: (healthAsc[1] || healthAsc[0]).name,
      action: `Improve ${(healthAsc[1] || healthAsc[0]).name.toLowerCase()} (${(healthAsc[1] || healthAsc[0]).score}): ${dimensionGuidance((healthAsc[1] || healthAsc[0]).name, (healthAsc[1] || healthAsc[0]).scoreNum, 'Health')}`,
      asset_class: mapInstrumentForArea((healthAsc[1] || healthAsc[0]).name, ''),
      timeframe: '3 - 6 Months',
      status: 'Active Step'
    },
    {
      area: (riskAsc[1] || riskAsc[0]).name,
      action: `Support ${(riskAsc[1] || riskAsc[0]).name.toLowerCase()} (${(riskAsc[1] || riskAsc[0]).score}): ${dimensionGuidance((riskAsc[1] || riskAsc[0]).name, (riskAsc[1] || riskAsc[0]).scoreNum, 'Risk')}`,
      asset_class: mapInstrumentForArea((riskAsc[1] || riskAsc[0]).name, ''),
      timeframe: '3 - 6 Months',
      status: 'Active Step'
    },
    {
      area: 'Family Protection & Nominees',
      action: 'Check that term life cover (10-15x income), family medical insurance, and all folio nominees are up to date.',
      asset_class: 'Term Life, Family Health & Nominee Audit',
      timeframe: '6 Months',
      status: 'Protection'
    },
    {
      area: 'Regular Portfolio Check-In',
      action: 'Review your mutual fund portfolio statements every 6 months with our desk to keep pace with life goals.',
      asset_class: 'Diversified Equity SIPs, PMS & AIF Access',
      timeframe: 'Ongoing',
      status: 'Monitoring'
    }
  ];

  const mergedPlan = [];
  const usedAreas = new Set();
  for (let i = 0; i < incomingPlan.length && mergedPlan.length < 6; i++) {
    const it = incomingPlan[i];
    if (!it || typeof it !== 'object') continue;
    const area = cleanPlain(it.area || 'Priority Focus');
    const action = cleanPlain(it.action || it.recommendation || '');
    if (!action) continue;
    usedAreas.add(area.toLowerCase());
    mergedPlan.push({
      num: String(mergedPlan.length + 1),
      area: area,
      status: cleanPlain(it.status || 'Active'),
      step: action,
      instruments: cleanPlain(it.asset_class || it.asset_classes || mapInstrumentForArea(area, action)),
      horizon: cleanPlain(it.horizon || it.timeframe || '1 - 3 Months')
    });
  }
  for (let i = 0; i < synthItems.length && mergedPlan.length < 6; i++) {
    const s = synthItems[i];
    if (usedAreas.has(s.area.toLowerCase()) && mergedPlan.length < 5) continue;
    usedAreas.add(s.area.toLowerCase());
    mergedPlan.push({
      num: String(mergedPlan.length + 1),
      area: s.area,
      status: s.status,
      step: s.action,
      instruments: s.asset_class,
      horizon: s.timeframe
    });
  }

  // Action Matrix Table (Header y: 721..743, 6 rows x 45pt: 451..721)
  p4.push(C_NAVY + ' rg 36 721 523 22 re f');
  p4.push(drawText(43, 729, '#', 'F2', 7.8, C_GOLD));
  p4.push(drawText(60, 729, 'Focus Area', 'F2', 7.8, C_WHITE));
  p4.push(drawText(168, 729, 'Practical Next Step', 'F2', 7.8, C_WHITE));
  p4.push(drawText(374, 729, 'Suitable Product Category', 'F2', 7.8, C_WHITE));
  p4.push(drawText(502, 729, 'Timeline', 'F2', 7.8, C_GOLD));

  let apY = 676;
  for (let i = 0; i < mergedPlan.length; i++) {
    const item = mergedPlan[i];
    const bg = (i % 2 === 0) ? C_SLATE_50 : C_WHITE;
    p4.push(bg + ' rg 36 ' + apY + ' 523 45 re f');
    p4.push(C_SLATE_200 + ' RG 0.5 w 36 ' + apY + ' 523 45 re S');

    p4.push(drawText(43, apY + 30, item.num, 'F2', 8.0, C_GOLD));
    drawWrapped(p4, 60, apY + 31, 9.2, item.area, 102, 'F2', 7.2, C_NAVY, 2);
    p4.push(drawText(60, apY + 9, fitSingleLine('Priority: ' + item.status, 102, 6.4, false), 'F1', 6.4, C_SLATE_500));
    drawWrapped(p4, 168, apY + 31, 9.5, item.step, 198, 'F1', 7.0, C_SLATE_700, 3);
    drawWrapped(p4, 374, apY + 31, 9.5, item.instruments, 120, 'F2', 6.9, C_NAVY, 3);
    drawWrapped(p4, 502, apY + 31, 9.5, item.horizon, 52, 'F2', 6.9, C_SLATE_500, 2);
    apY -= 45;
  }

  // How IRAH Helps You Execute (y: 358 to 441)
  p4.push(C_SLATE_50 + ' rg 36 358 523 83 re f');
  p4.push(C_SLATE_300 + ' RG 0.75 w 36 358 523 83 re S');
  p4.push(C_GOLD + ' rg 36 358 3.5 83 re f');

  p4.push(drawText(48, 425, 'HOW IRAH HELPS YOU EXECUTE (ZERO PLATFORM FEE TO CLIENTS)', 'F2', 8.3, C_NAVY));
  drawWrapped(
    p4, 48, 411, 9.8,
    'IRAH Services LLP helps you invest seamlessly across Mutual Funds (ARN-352385), SEBI-registered PMS/AIF (APRN-08375), SIF, and Fixed Income products. Your investments settle directly from your bank account to the fund house, and we check in every 6 months to keep your goals aligned.',
    498, 'F1', 7.3, C_SLATE_700, 3
  );
  p4.push(drawText(48, 370, 'Open-Architecture Access: Transparent product distribution across leading AMCs with zero facilitation fee charged to you.', 'F2', 7.2, C_GOLD));

  // Master Statutory Compliance & Regulatory Safeguards Box (y: 54 to 348)
  p4.push(C_NAVY + ' rg 36 54 523 294 re f');
  p4.push(C_GOLD + ' rg 36 345 523 3 re f');

  p4.push(drawText(48, 330, 'STATUTORY COMPLIANCE & REGULATORY DISCLOSURES', 'F2', 9.0, C_GOLD));
  const clauses = [
    {
      h: '1. AMFI & APMI Distributor Registrations:',
      b: 'IRAH Services LLP is an AMFI-Registered Mutual Fund Distributor (ARN-352385) and APMI-Registered Distributor (APRN-08375). Mutual fund distribution is conducted under ARN-352385 and PMS facilitation under APRN-08375.'
    },
    {
      h: '2. Zero Custodial Holding Policy:',
      b: 'Client money NEVER passes through IRAH Services LLP in any account. IRAH does not accept cash, third-party cheques, or custodial transfers.'
    },
    {
      h: '3. Direct Client-to-AMC Settlement Architecture:',
      b: 'All transactions settle directly between your bank account and the Asset Management Company (AMC) / SEBI-regulated Registrars (CAMS & KFintech).'
    },
    {
      h: '4. Non-Advisory & Non-Planning Entity Boundary:',
      b: 'IRAH Services LLP distributes Mutual Funds, PMS, AIF, SIF, and Fixed Income products. IRAH does NOT provide Financial Advisory Services or Financial Planning Services and does not operate as a SEBI-registered Investment Adviser (RIA).'
    },
    {
      h: '5. Statutory Risk Warning & Redressal Portals:',
      b: 'Mutual fund investments are subject to market risks, read all scheme related documents carefully. Past performance does not guarantee future results. Portals: sebi.gov.in | amfiindia.com | apmiindia.org | scores.sebi.gov.in | smartodr.in'
    }
  ];

  let clY = 313;
  for (let i = 0; i < clauses.length; i++) {
    p4.push(drawText(48, clY, clauses[i].h, 'F2', 7.6, C_WHITE));
    const endY = drawWrapped(p4, 48, clY - 10, 9.2, clauses[i].b, 498, 'F1', 7.0, C_SLATE_200, 3);
    clY = endY - 5;
  }

  p4.push(C_GOLD + ' RG 0.5 w 48 112 m 547 112 l S');
  p4.push(drawText(48, 100, 'OFFICIAL CORPORATE & GRIEVANCE DIRECTORY', 'F2', 7.8, C_GOLD));
  p4.push(drawText(48, 87, 'Entity: IRAH Services LLP (LLPIN: ACU-3761 | PAN: AALFI9430M | GSTIN: 06AALFI9430M1ZW)', 'F1', 7.1, C_SLATE_200));
  p4.push(drawText(48, 75, 'Official Desk: harikant.irah@gmail.com | Grievances: grievances@irah.co.in | Office: Sector 20, Panchkula, Haryana 134117', 'F1', 7.1, C_SLATE_200));
  p4.push(drawText(48, 63, 'Relationship Helplines: +91 9779776119, +91 8558822528 | Registry: www.amfiindia.com (ARN-352385 | APRN-08375)', 'F1', 7.1, C_SLATE_200));
  p4.push(...pageFooter(4));

  // ═══════════════════════════════════════════════════════════════════
  // ASSEMBLE PDF DOCUMENT OBJECTS (STRICT ISO 32000-1 XREF)
  // ═══════════════════════════════════════════════════════════════════
  const enc = new TextEncoder();
  const pages = [p1, p2, p3, p4];
  const pageStreams = pages.map(cmds => enc.encode(cmds.join('\n')));

  const objs = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R] /Count 4 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R >> >> /Contents 10 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R >> >> /Contents 11 0 R >>\nendobj\n',
    '5 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R >> >> /Contents 12 0 R >>\nendobj\n',
    '6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 7 0 R /F2 8 0 R /F3 9 0 R >> >> /Contents 13 0 R >>\nendobj\n',
    '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    '9 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n'
  ];

  for (let i = 0; i < 4; i++) {
    const cObj = 10 + i;
    objs.push(cObj + ' 0 obj\n<< /Length ' + pageStreams[i].length + ' >>\nstream\n');
  }

  const headerBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, 0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]);
  const endStreamBytes = enc.encode('\nendstream\nendobj\n');

  let totalLength = headerBytes.length;
  const objBytes = [];
  const xref = [0];

  for (let i = 0; i < 9; i++) {
    const b = enc.encode(objs[i]);
    xref.push(totalLength);
    totalLength += b.length;
    objBytes.push(b);
  }

  const streamObjParts = [];
  for (let i = 0; i < 4; i++) {
    const stHdr = enc.encode(objs[9 + i]);
    xref.push(totalLength);
    totalLength += stHdr.length + pageStreams[i].length + endStreamBytes.length;
    streamObjParts.push({ hdr: stHdr, content: pageStreams[i] });
  }

  const xrefOffset = totalLength;
  const objCount = xref.length;
  let xrefTableStr = 'xref\n0 ' + objCount + '\n0000000000 65535 f \n';
  for (let i = 1; i < objCount; i++) {
    xrefTableStr += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailerStr = 'trailer\n<< /Size ' + objCount + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
  const xrefBytes = enc.encode(xrefTableStr + trailerStr);

  const finalPdf = new Uint8Array(totalLength + xrefBytes.length);
  let pos = 0;
  finalPdf.set(headerBytes, pos); pos += headerBytes.length;
  for (let i = 0; i < objBytes.length; i++) {
    finalPdf.set(objBytes[i], pos); pos += objBytes[i].length;
  }
  for (let i = 0; i < streamObjParts.length; i++) {
    finalPdf.set(streamObjParts[i].hdr, pos); pos += streamObjParts[i].hdr.length;
    finalPdf.set(streamObjParts[i].content, pos); pos += streamObjParts[i].content.length;
    finalPdf.set(endStreamBytes, pos); pos += endStreamBytes.length;
  }
  finalPdf.set(xrefBytes, pos);

  return finalPdf;
}


function uint8ToBase64(bytes) {
  const chunkSize = 0x8000;
  const parts = [];
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    parts.push(String.fromCharCode.apply(null, slice));
  }
  return btoa(parts.join(''));
}

async function sendResendMail(apiKey, { subject, html, replyTo, attachments, fromEmail, destinations }) {
  const toList = Array.isArray(destinations) && destinations.length ? destinations : ['harikant.irah@gmail.com'];
  // Attempt 1: Custom domain sender (when verified) to configured compliance desk
  try {
    const res1 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'IRAH-Cloudflare-Worker/1.0'
      },
      body: JSON.stringify({
        from: fromEmail || 'IRAH Services LLP <info@irah.co.in>',
        to: toList,
        reply_to: replyTo || 'harikant.irah@gmail.com',
        subject: subject,
        html: html,
        attachments: attachments || []
      })
    });
    const d1 = await res1.json();
    if (d1 && d1.id) return 'sent';
  } catch (_) {}

  // Attempt 2: Registered owner account fallback (delivers directly to harikant.irah@gmail.com with zero domain blocks)
  try {
    const res2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'IRAH-Cloudflare-Worker/1.0'
      },
      body: JSON.stringify({
        from: 'IRAH Services LLP <onboarding@resend.dev>',
        to: toList,
        reply_to: replyTo || 'harikant.irah@gmail.com',
        subject: subject,
        html: html,
        attachments: attachments || []
      })
    });
    const d2 = await res2.json();
    if (d2 && d2.id) return 'sent';
  } catch (_) {}

  return 'fallback';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const resendKey = (env && (env.IRAH_RESEND_API_KEY || env.RESEND_API_KEY)) || '';
    const reportDestinations = (env && env.IRAH_REPORT_TO) ? [env.IRAH_REPORT_TO] : ['harikant.irah@gmail.com'];
    const fromSender = (env && env.IRAH_FROM_EMAIL) || 'IRAH Services LLP <info@irah.co.in>';

    // -------------------------------------------------------------
    // Endpoint 1: Contact / Inquiry Submission (/api/enquire)
    // -------------------------------------------------------------
    if (url.pathname === '/api/enquire' && request.method === 'POST') {
      try {
        let data;
        try {
          data = await request.json();
        } catch (_) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        const cleanStr = (v) => (typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v).trim() : ''));
        const name = cleanStr(data.name);
        const email = cleanStr(data.email);
        const phone = cleanStr(data.phone);
        const vertical = cleanStr(data.vertical) || 'Financial Services';
        const investmentInterest = cleanStr(data.investmentInterest);
        const investmentBracket = cleanStr(data.investmentBracket);
        const educationTopic = cleanStr(data.educationTopic);
        const message = cleanStr(data.message);

        if (!name || !email || !phone) {
          return new Response(JSON.stringify({ error: 'Please provide your full name, email address, and contact number.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (!data.consent || data.consent.given !== true) {
          return new Response(JSON.stringify({ error: 'Consent is required to submit an inquiry.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const refId = 'IRAH-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString(16).toUpperCase();
        const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const knownKeys = new Set([
          'name', 'email', 'phone', 'vertical', 'investmentInterest', 'investmentBracket',
          'educationTopic', 'message', 'consent', 'timestamp'
        ]);

        let detailsRows = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 35%;">Reference ID:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(refId)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client Name:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email Address:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Contact Number:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Primary Area of Interest:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(vertical)}</td></tr>
        `;

        if (investmentInterest && investmentInterest !== 'N/A') {
          detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Asset Class:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(investmentInterest)}</td></tr>`;
        }
        if (investmentBracket && investmentBracket !== 'N/A') {
          detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Anticipated Allocation Range:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(investmentBracket)}</td></tr>`;
        }
        if (educationTopic && educationTopic !== 'N/A') {
          detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Educational Program Focus:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(educationTopic)}</td></tr>`;
        }
        if (message) {
          detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client Notes / Specific Inquiries:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(message)}</td></tr>`;
        }
        for (const [k, v] of Object.entries(data)) {
          if (knownKeys.has(k) || v === null || v === undefined) continue;
          if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
          const sval = String(v).trim();
          if (sval && sval !== 'N/A') {
            detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${escapeHtml(k)}:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(sval)}</td></tr>`;
          }
        }
        detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Submission Timestamp:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(nowStr)}</td></tr>`;

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0b1f3a; margin-top: 0;">New Client Inquiry — IRAH Services LLP</h2>
            <p style="color: #475569; font-size: 14px;">A new client relationship inquiry has been submitted via irah.co.in. Every entered detail is captured below:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              ${detailsRows}
            </table>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">This notification was delivered to ${escapeHtml(reportDestinations.join(', '))}.</p>
          </div>
        `;

        const emailDelivery = await sendResendMail(resendKey, {
          subject: `[IRAH Inquiry] ${oneLine(name, 80)} (${oneLine(vertical, 40)})`,
          html: htmlBody,
          replyTo: email,
          fromEmail: fromSender,
          destinations: reportDestinations
        });

        return new Response(JSON.stringify({
          ok: true,
          reference_id: refId,
          email_delivery: emailDelivery,
          email_dispatched: emailDelivery === 'sent',
          dispatched_to: emailDelivery === 'sent' ? reportDestinations[0] : 'fallback',
          recipient: reportDestinations[0],
          resend_account: reportDestinations[0],
          worker_build: '2026-11-14-live-key',
          message: 'Inquiry received. Our team will contact you shortly.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // -------------------------------------------------------------
    // Endpoint 2: Assessment PDF Generation & Dispatch (/api/submit-assessment-report)
    // -------------------------------------------------------------
    if (url.pathname === '/api/submit-assessment-report' && request.method === 'POST') {
      try {
        let data;
        try {
          data = await request.json();
        } catch (_) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        const rawProfile = data.client_profile !== undefined ? data.client_profile : data.profile;
        if (rawProfile !== undefined && (typeof rawProfile !== 'object' || rawProfile === null || Array.isArray(rawProfile))) {
          return new Response(JSON.stringify({ error: 'Invalid client_profile payload.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        if (data.consent_to_share !== true) {
          return new Response(JSON.stringify({ error: 'Consent to share this assessment report with IRAH is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const profile = rawProfile || {};
        const clientName = data.client_name || profile.client_name || profile.name || 'Valued Client';
        const clientEmail = data.client_email || profile.client_email || profile.email || '';
        const clientPhone = data.client_phone || profile.client_phone || profile.phone || '';
        const clientAge = data.client_age || profile.age || '36 - 45';
        const refId = 'IRAH-REP-' + Date.now().toString(36).toUpperCase();
        const nowStr = profile.assessment_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const hScore = Math.min(100, Math.max(0, Number(data.financial_health_score ?? data.health_results?.overall_score ?? data.score ?? 78)));
        const rScore = Math.min(100, Math.max(0, Number(data.risk_score ?? data.risk_results?.overall_score ?? 65)));
        const hRating = (data.health_results && data.health_results.rating) || (hScore >= 80 ? 'Strong Financial Foundation' : (hScore >= 60 ? 'Moderate Foundation' : (hScore >= 40 ? 'Requires Strategic Optimization' : 'Critical Attention Needed')));
        const rRating = (data.risk_results && data.risk_results.rating) || (rScore >= 75 ? 'Aggressive Growth Focus' : (rScore >= 55 ? 'Balanced Growth Focus' : (rScore >= 40 ? 'Moderate Conservative' : 'Conservative Capital Preservation')));

        const pdfBytes = buildVectorPdf({
          ref_id: refId,
          date: nowStr,
          client: profile,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          client_age: clientAge,
          health: data.health_results || {},
          risk: data.risk_results || {},
          action_plan: Array.isArray(data.action_plan) ? data.action_plan : [],
          h_score: hScore,
          h_rating: hRating,
          r_score: rScore,
          r_rating: rRating
        });

        const pdfBase64 = uint8ToBase64(pdfBytes);
        const filename = 'IRAH_Financial_Assessment_Report_' + refId + '.pdf';

        const reportHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0b1f3a; margin-top: 0;">IRAH Services LLP — Financial Assessment Report</h2>
            <p style="color: #334155;">A confidential financial self-assessment report has been generated for <strong>${escapeHtml(clientName)}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold; width: 35%;">Reference ID:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(refId)}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Client Name:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(clientName)}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Email Address:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(clientEmail || 'Not provided')}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Contact Number:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(clientPhone || 'Not provided')}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Age:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(clientAge)}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Work Status:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(profile.work_status || profile.employment_status || 'Not specified')}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Annual Income:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(profile.annual_income || 'Not specified')}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Primary Goal:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(profile.financial_goal || profile.main_financial_goal || 'Not specified')}</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Financial Health Score:</td><td style="padding: 6px; border-bottom: 1px solid #eee;"><strong>${hScore.toFixed(1)}/100</strong> (${escapeHtml(hRating)})</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Investment Risk Profile:</td><td style="padding: 6px; border-bottom: 1px solid #eee;"><strong>${rScore.toFixed(1)}/100</strong> (${escapeHtml(rRating)})</td></tr>
              <tr><td style="padding: 6px; border-bottom: 1px solid #eee; font-weight: bold;">Report Attachment:</td><td style="padding: 6px; border-bottom: 1px solid #eee;">${escapeHtml(filename)}</td></tr>
            </table>
            <p style="color: #475569;">The complete 4-page vector PDF report is attached to this email.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
              Delivered directly to: ${escapeHtml(reportDestinations.join(', '))} | AMFI ARN-352385 | APMI APRN-08375 | Direct AMC Settlement.
            </p>
          </div>
        `;

        const emailDelivery = resendKey
          ? await sendResendMail(resendKey, {
              subject: `IRAH Financial Assessment Report — ${oneLine(clientName, 80)} (${refId})`,
              html: reportHtml,
              replyTo: clientEmail || 'harikant.irah@gmail.com',
              fromEmail: fromSender,
              destinations: reportDestinations,
              attachments: [
                {
                  filename: filename,
                  content: pdfBase64
                }
              ]
            })
          : 'not_configured';

        return new Response(JSON.stringify({
          ok: true,
          reference_id: refId,
          filename: filename,
          pdf_base64: pdfBase64,
          email_delivery: emailDelivery,
          email_dispatched: emailDelivery === 'sent',
          dispatched_to: emailDelivery === 'sent' ? reportDestinations[0] : 'fallback',
      recipient: reportDestinations[0],
      resend_account: reportDestinations[0],
      worker_build: '2026-11-17-pdf-v2',
          message: emailDelivery === 'sent'
            ? 'Assessment report compiled and delivered successfully.'
            : 'Assessment report PDF compiled. Email relay is not configured on this edge node.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // -------------------------------------------------------------
    // Fallback: Static Assets from Cloudflare Pages CDN
    // -------------------------------------------------------------
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('IRAH Services Edge Engine Active', { status: 200 });
  }
};
