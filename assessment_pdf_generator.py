"""
IRAH Services LLP - Financial Health & Risk Assessment PDF Report Generator
Generates executive-tier, branded 4-page A4 PDF reports using ReportLab
with high-resolution Matplotlib radar (spider) charts.

Layout Architecture (Deterministic 4-Page Layout):
- Page 1: Executive Cover & Composite Assessment (Client profile, composite health & risk scores,
          substantive interpretive synthesis, top strengths & priority vulnerability areas).
- Page 2: Pillar I: Financial Health Analysis (Crisp radar chart, 8-factor breakdown
          table with weights, scores, and bands, key health analytical observations).
- Page 3: Pillar II: Financial Risk & Resilience Analysis (Crisp coral radar chart, 7-factor
          breakdown table with weights, scores, and bands, key risk resilience observations).
- Page 4: Prioritized Strategic Action Plan & Statutory Disclosures (Prioritized 6-step matrix
          with focus areas, concrete implementation actions, recommended asset classes & instruments,
          target horizons, execution guidance, and full statutory compliance disclosure).
"""

import io
import os
import re
import html
from datetime import datetime

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect


def _score_bar_drawing(score_pct, fill_color, width=130, height=7):
    """Draw a clean horizontal progress bar representing a 0-100 score."""
    pct = max(0.0, min(100.0, float(score_pct)))
    d = Drawing(width, height + 2)
    d.add(Rect(0, 1, width, height, rx=3, ry=3, fillColor=colors.HexColor('#E2E8F0'), strokeWidth=0))
    fill_w = max(4.0, width * (pct / 100.0)) if pct > 0 else 0.0
    if fill_w > 0:
        d.add(Rect(0, 1, fill_w, height, rx=3, ry=3, fillColor=fill_color, strokeWidth=0))
    return d

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Brand Palette Constants ──────────────────────────────────────────────────
NAVY_DARK   = colors.HexColor('#0A1428')  # Obsidian / Deep Brand Navy
NAVY_CARD   = colors.HexColor('#11203C')  # Institutional Navy Card Surface
NAVY_INNER  = colors.HexColor('#0D1A33')  # Dark Polar Plot Face
GOLD        = colors.HexColor('#C5A059')  # Brand Signature Gold
GOLD_LIGHT  = colors.HexColor('#E6CC99')  # Soft Gold Accent
WHITE       = colors.HexColor('#FFFFFF')
SLATE_50    = colors.HexColor('#F8FAFC')
SLATE_100   = colors.HexColor('#F1F5F9')
SLATE_200   = colors.HexColor('#E2E8F0')
SLATE_300   = colors.HexColor('#CBD5E1')
SLATE_400   = colors.HexColor('#94A3B8')
SLATE_500   = colors.HexColor('#64748B')
SLATE_700   = colors.HexColor('#334155')
SLATE_900   = colors.HexColor('#0F172A')
EMERALD     = colors.HexColor('#16A34A')
CORAL       = colors.HexColor('#EA580C')
AMBER       = colors.HexColor('#D97706')
BLUE_ACCENT = colors.HexColor('#2563EB')

PAGE_W, PAGE_H = A4  # 595.27 x 841.89 points

# ─── Statutory Compliance Disclosure ──────────────────────────────────────────
STATUTORY_DISCLOSURE = (
    "<b>IRAH SERVICES LLP</b> | AMFI-Registered Mutual Fund Distributor (ARN-352385) | "
    "APMI-Registered Distributor (APRN-08375) | LLPIN: ACU-3761 | GSTIN: 06AALFI9430M1ZW | PAN: AALFI9430M<br/>"
    "<b>Statutory Regulatory Notice:</b> Mutual Fund investments are subject to market risks; read all scheme related "
    "documents carefully. Past performance is not indicative of future returns. This report is generated strictly for "
    "financial readiness orientation, educational awareness, and quantitative self-assessment purposes. IRAH Services LLP "
    "distributes Mutual Funds, PMS, AIF, SIF, and Fixed Income products; it does not provide Financial Advisory Services "
    "or Financial Planning Services, and this report does not constitute personal investment advice, portfolio management "
    "services (PMS), or a research recommendation under SEBI (Investment Advisers) Regulations, 2013 or SEBI (Research Analysts) "
    "Regulations, 2014. IRAH Services LLP facilitates product distribution and receives distribution commissions from Asset "
    "Management Companies (AMCs) as permitted under SEBI regulations.<br/>"
    "<b>Investor Redressal & Verification Portals:</b> SEBI: sebi.gov.in | AMFI: amfiindia.com | APMI: apmiindia.org | "
    "SCORES 2.0: scores.sebi.gov.in | SMART ODR: smartodr.in"
)

# ─── Asset Class & Instrument Mapping ─────────────────────────────────────────
ASSET_CLASS_MAPPING = {
    'monthly savings': 'Automated Systematic Investment Plans (SIP) in Flexi-Cap & Multi-Cap Mutual Funds',
    'emergency moat': 'Liquid Mutual Funds, Overnight Funds & Arbitrage Funds',
    'emergency fund': 'Liquid Mutual Funds, Overnight Funds & High-Yield Sweep Accounts',
    'liquidity buffer': 'Liquid Mutual Funds, Overnight Funds & Arbitrage Funds',
    'liquidity': 'Liquid Mutual Funds, Overnight Funds & Arbitrage Funds',
    'debt servicing': 'Debt Prepayment, EMI Restructuring & Short-Duration Debt Mutual Funds',
    'debt review': 'Debt Prepayment, Floating Loan Restructuring & EMI Optimization',
    'debt management': 'Debt Prepayment, Floating Loan Restructuring & EMI Optimization',
    'debt & credit': 'Debt Prepayment & High-Cost Liability Settlement',
    'debt': 'Debt Prepayment, Loan Consolidation & Structured Repayment',
    'life & health cover': 'Pure Term Life Insurance (10-15x Income) & Family Health Floater + Super Top-Up',
    'diversification': 'Multi-Asset Allocation Mutual Funds, Diversified Equity & Corporate Debt',
    'retirement readiness': 'Goal-Tagged Equity/Hybrid Mutual Funds, Balanced Advantage & NPS Tier-1',
    'children education': 'Dedicated Education Milestone Mutual Fund Folios with Duration Glide Paths',
    'estate governance': '100% Folio Nominee Verification, KYC Audit & Registered Will Documentation',
    'inflow stability': 'Arbitrage Mutual Funds & Short-Term Liquid Moats for Cashflow Cushioning',
    'drawdown tolerance': 'Balanced Advantage Funds (BAF) & Multi-Asset Allocation Mutual Funds',
    'investment horizon': 'Duration-Matched Equity Mutual Funds (Long Horizon) or Short-Duration Debt',
    'expense flexibility': 'Cashflow Partitioning & Staggered Systematic Transfer Plans (STP)',
    'dependent cushion': 'Pure Term Life Protection, Liquid Reserves & Conservative Hybrid Folios',
    'market track record': 'Staggered STP / Core Index & Flexi-Cap Mutual Funds',
    'allocation mandate': 'Diversified Mutual Funds, SEBI-Registered PMS (Rs. 50L+) & Cat II/III AIF Access',
    'income resilience': 'Short-Term Arbitrage, Recurring Cash-Flow Moats & Capital Preservation',
    'income health': 'Multi-Line Cash-Flow Moats & Professional Capital Compounding',
    'income': 'Recurring Inflow Moats & Professional Capacity Expansion',
    'expense management': 'Systematic Cash-Flow Partitioning & Discretionary Leakage Controls',
    'expense': 'Monthly Budgetary Reallocation & Automated Inflow Separation',
    'protection review': 'Pure Term Life Insurance (15-20x Income), Super Top-Up Health Floater',
    'protection & estate': 'Pure Term Insurance (15-20x Income) & Comprehensive Floater',
    'protection': 'Pure Term Life Insurance (15-20x Income) & Comprehensive Health Floater',
    'insurance adequacy': 'Pure Term Insurance & Comprehensive Family Health Coverage',
    'insurance': 'Pure Term Life Insurance & Family Medical Health Coverage',
    'investment review': 'Diversified Equity Mutual Funds (Large, Flexi & Mid Cap), Index Funds',
    'investment & wealth': 'Systematic Investment Plans (SIP) in Multi-Asset Allocation Funds',
    'investment': 'Diversified Equity Mutual Funds, Large & Mid-Cap Strategies',
    'wealth compounding': 'Multi-Cap & Flexi-Cap Mutual Funds, Index Funds & Balanced Advantage',
    'wealth': 'Diversified Multi-Cap Mutual Funds, Systematic SIPs & Hybrid Portfolios',
    'financial review': 'Semi-Annual Portfolio Statement & Goal-Alignment Review',
    'governance': 'Semi-Annual Relationship Desk Audit & Asset Weight Rebalancing',
    'estate': 'Comprehensive Will, Nomination Audit & Intergenerational Framework',
    'retirement': 'Target-Date Portfolios, Balanced Advantage Funds & NPS Tier-1',
}

# ─── Text & Numeric Sanitizers ────────────────────────────────────────────────
def _clean_text(value):
    """Sanitize strings for standard PDF Type-1 fonts (CP1252) and ReportLab XML tags."""
    if value is None:
        return ''
    text = str(value).replace('\u20b9', 'Rs. ').replace('\u2014', ' -- ').replace('\u2013', ' - ')
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = text.encode('cp1252', 'replace').decode('cp1252')
    return html.escape(text.strip(), quote=False)


def _num(value, default=0.0):
    try:
        v = float(value)
        return v if v == v and abs(v) != float('inf') else default
    except (TypeError, ValueError):
        return default


def _health_band(pct):
    if pct >= 75: return 'Strong'
    if pct >= 55: return 'Stable'
    return 'Needs Focus'


def _risk_band(pct):
    if pct >= 75: return 'High Buffer'
    if pct >= 55: return 'Moderate'
    return 'Elevated Exposure'


def _band_color(band_str):
    b = str(band_str).lower()
    if 'strong' in b or 'high buffer' in b or 'robust' in b:
        return EMERALD
    if 'stable' in b or 'moderate' in b or 'good' in b or 'controlled' in b:
        return BLUE_ACCENT
    if 'action' in b or 'elevated' in b:
        return AMBER
    return CORAL


# ─── Radar Chart Generator ────────────────────────────────────────────────────
def generate_radar_chart_image(categories, values, title,
                               line_hex='#C5A059', fill_hex='#C5A059',
                               text_hex='#E6CC99', is_health=True):
    """
    Generates a high-resolution, crisp polar radar (spider) chart image.
    Styled with IRAH obsidian/gold & coral palettes, circular polar grids,
    and vertex score callouts. Returns an io.BytesIO PNG buffer.
    """
    N = len(categories)
    if N < 3:
        # Fallback if too few categories
        fig, ax = plt.subplots(figsize=(5.6, 5.6), facecolor='#0A1428')
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=220, facecolor=fig.get_facecolor(), edgecolor='none')
        plt.close(fig)
        buf.seek(0)
        return buf

    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    values_f = [max(0.0, min(100.0, float(v))) for v in values]
    values_closed = values_f + [values_f[0]]
    angles_closed = angles + [angles[0]]

    fig, ax = plt.subplots(figsize=(5.6, 5.6), subplot_kw=dict(polar=True), facecolor='#0A1428')
    ax.set_facecolor('#0D1A33')
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)

    # Clean multi-line wrapping for polar axis labels
    wrapped_labels = []
    for cat in categories:
        parts = cat.split()
        if len(parts) > 2:
            mid = (len(parts) + 1) // 2
            wrapped_labels.append(" ".join(parts[:mid]) + "\n" + " ".join(parts[mid:]))
        else:
            wrapped_labels.append(cat)

    plt.xticks(angles, wrapped_labels, color='#F8FAFC', size=8.0, weight='bold')
    ax.tick_params(pad=14)

    ax.set_rscale('linear')
    plt.yticks([20, 40, 60, 80, 100], ['20%', '40%', '60%', '80%', '100%'],
               color='#94A3B8', size=6.5)
    plt.ylim(0, 100)
    ax.grid(color='#334155', linestyle='-', linewidth=0.75, alpha=0.75)

    # Plot data line and fill
    ax.plot(angles_closed, values_closed, color=line_hex, linewidth=2.4)
    ax.fill(angles_closed, values_closed, color=fill_hex, alpha=0.28)

    # Vertices
    ax.scatter(angles, values_f, color='#FFFFFF', edgecolors=line_hex,
               s=44, zorder=10, linewidths=2.0)

    # Exact score callout near each vertex
    for a, val in zip(angles, values_f):
        offset = -8.0 if val >= 88.0 else 7.5
        ax.annotate(f'{val:.0f}%', xy=(a, val), xytext=(a, val + offset),
                    color=text_hex, fontsize=7.2, weight='bold',
                    ha='center', va='center')

    plt.title(title, size=11, color='#FFFFFF', weight='bold', pad=22)
    fig.subplots_adjust(left=0.14, right=0.86, top=0.84, bottom=0.10)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=220, bbox_inches='tight',
                facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return buf


# ─── Page Decorator with Institutional Header/Footer ──────────────────────────
class _PageDecorator:
    """Canvas decorator applying running header & footer across all 4 pages."""

    def __init__(self, client_name, report_date, ref_id):
        self.client_name = html.unescape(str(client_name))
        self.report_date = report_date
        self.ref_id = ref_id

    def __call__(self, canv, doc):
        canv.saveState()
        w, h = A4

        # Header bar (Navy background)
        canv.setFillColor(NAVY_DARK)
        canv.rect(0, h - 1.25 * cm, w, 1.25 * cm, fill=1, stroke=0)

        canv.setFillColor(GOLD)
        canv.setFont('Helvetica-Bold', 8)
        canv.drawString(1.5 * cm, h - 0.8 * cm, 'IRAH SERVICES LLP  |  FINANCIAL ASSESSMENT REPORT')

        canv.setFillColor(SLATE_200)
        canv.setFont('Helvetica', 7.5)
        canv.drawRightString(w - 1.5 * cm, h - 0.8 * cm, f'Ref: {self.ref_id}')

        # Gold accent line below header
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(1)
        canv.line(0, h - 1.25 * cm, w, h - 1.25 * cm)

        # Footer bar (Navy Card background)
        canv.setFillColor(NAVY_CARD)
        canv.rect(0, 0, w, 0.95 * cm, fill=1, stroke=0)

        # Gold accent line above footer
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(0.75)
        canv.line(0, 0.95 * cm, w, 0.95 * cm)

        canv.setFillColor(SLATE_400)
        canv.setFont('Helvetica', 6.5)
        canv.drawString(1.5 * cm, 0.35 * cm,
                        f'Client: {self.client_name}  |  Assessment Date: {self.report_date}  |  Confidential -- For Client Use Only')
        canv.drawRightString(w - 1.5 * cm, 0.35 * cm, f'Page {doc.page} of 4')

        canv.restoreState()


# ─── Analytical Derivation Engine ─────────────────────────────────────────────
def derive_executive_overview(profile, health, risk):
    """
    Synthesizes rich, qualitative executive summary and interpretive context
    tailored to the client's demographic profile, composite scores, and goals.
    """
    goal = profile.get('main_financial_goal', 'Wealth Creation & Long-Term Compounding')
    h_score = _num(health.get('overall_score', 0))
    h_rating = health.get('rating', 'Stable / Good')
    r_score = _num(risk.get('overall_score', 0))
    r_rating = risk.get('rating', 'Moderate / Controlled')

    h_cats = sorted(health.get('categories') or [], key=lambda c: float(c.get('normalized_score', 0)), reverse=True)
    r_cats = sorted(risk.get('categories') or [], key=lambda c: float(c.get('normalized_score', 0)), reverse=True)
    h_top = f"{h_cats[0]['name']} ({float(h_cats[0]['normalized_score']):.0f}%)" if h_cats else "cashflow discipline"
    h_gap = f"{h_cats[-1]['name']} ({float(h_cats[-1]['normalized_score']):.0f}%)" if h_cats else "liquidity buffers"
    r_gap = f"{r_cats[-1]['name']} ({float(r_cats[-1]['normalized_score']):.0f}%)" if r_cats else "downside buffering"

    # Health context
    if h_score >= 80:
        h_text = (f"The family demonstrates strong financial health ({h_score:.1f}% -- {h_rating}), led by "
                  f"{h_top}. Focused reinforcement of {h_gap} will further insulate long-term wealth compounding.")
    elif h_score >= 60:
        h_text = (f"The family maintains a stable financial baseline ({h_score:.1f}% -- {h_rating}), anchored by "
                  f"{h_top}. Elevating {h_gap} toward the 75%+ institutional benchmark will meaningfully strengthen household resilience.")
    else:
        h_text = (f"The assessment identifies balance-sheet pressure ({h_score:.1f}% -- {h_rating}), particularly in "
                  f"{h_gap}. Immediate priority belongs to ring-fencing liquid reserves, trimming fixed EMI load, and verifying protection cover.")

    # Risk context
    if r_score >= 70:
        r_text = (f"On risk capacity ({r_score:.1f}% -- {r_rating}), the profile exhibits strong drawdown absorption, "
                  f"supporting diversified equity mutual funds and long-horizon compounding while monitoring {r_gap}.")
    elif r_score >= 50:
        r_text = (f"On risk capacity ({r_score:.1f}% -- {r_rating}), the profile reflects balanced exposure. "
                  f"Pairing core equity SIPs with liquid and hybrid cushions helps stabilize {r_gap} across market cycles.")
    else:
        r_text = (f"On risk capacity ({r_score:.1f}% -- {r_rating}), sensitivity around {r_gap} favors capital-preservation "
                  "categories (Liquid, Arbitrage, and Short-Duration Debt Mutual Funds) before scaling equity allocation.")

    # Educational product-distribution posture (strictly non-advisory)
    if h_score >= 75 and r_score >= 60:
        posture = f"Distribution Orientation (Educational): Growth-Oriented Mutual Funds, Multi-Asset & HNW PMS/AIF Access toward '{goal}'."
    elif h_score >= 60:
        posture = f"Distribution Orientation (Educational): Balanced Advantage & Core Equity SIPs paired with Liquid Moat Expansion toward '{goal}'."
    else:
        posture = "Distribution Orientation (Educational): Liquid Moat Stabilization, Debt Reduction & Protection Audit First."

    return f"{h_text} {r_text}<br/><br/><b>{posture}</b>"


def derive_health_observations(categories):
    """Extract top 2 health strengths and bottom 2 distinct vulnerabilities."""
    cats = list(categories or [])
    if not cats:
        return [("Baseline Resilience", "Personal financial profile is established.")], [("Review Needed", "Periodic review recommended.")]
    desc = sorted(cats, key=lambda c: float(c.get('normalized_score', 0)), reverse=True)
    asc = sorted(cats, key=lambda c: float(c.get('normalized_score', 0)))
    strengths = [(c.get('name', 'Health Factor'), f"Score of {float(c.get('normalized_score', 0)):.1f}% ({c.get('band', 'Stable')}) reflects solid operational discipline.")
                 for c in desc[:2]]
    top_names = {s[0] for s in strengths}
    vuln_pool = [c for c in asc if c.get('name', 'Health Factor') not in top_names] or asc
    vulnerabilities = [(c.get('name', 'Health Factor'), f"Score of {float(c.get('normalized_score', 0)):.1f}% ({c.get('band', 'Needs Focus')}) indicates priority area for optimization.")
                       for c in vuln_pool[:2]]
    return strengths, vulnerabilities


def derive_risk_observations(categories):
    """Extract top 2 risk resilience buffers and bottom 2 distinct elevated exposures."""
    cats = list(categories or [])
    if not cats:
        return [("Buffer Capacity", "Risk indicators within standard operating range.")], [("Review Needed", "Ongoing periodic monitoring of risk indicators supports goal alignment.")]
    desc = sorted(cats, key=lambda c: float(c.get('normalized_score', 0)), reverse=True)
    asc = sorted(cats, key=lambda c: float(c.get('normalized_score', 0)))
    buffers = [(c.get('name', 'Risk Factor'), f"Buffer index of {float(c.get('normalized_score', 0)):.1f}% ({c.get('band', 'High Buffer')}) provides strong shock-absorption capacity.")
               for c in desc[:2]]
    top_names = {b[0] for b in buffers}
    exp_pool = [c for c in asc if c.get('name', 'Risk Factor') not in top_names] or asc
    exposures = [(c.get('name', 'Risk Factor'), f"Exposure index of {float(c.get('normalized_score', 0)):.1f}% ({c.get('band', 'Elevated Exposure')}) benefits from structured risk buffering.")
                 for c in exp_pool[:2]]
    return buffers, exposures


def enrich_action_plan(plan_items, health_cats, risk_cats):
    """
    Preserves incoming action plan items and supplements dynamically up to 6 items
    from lowest-scoring health and risk dimensions with regulated product mappings.
    """
    enriched = []
    sorted_risk = sorted(risk_cats or [], key=lambda c: float(c.get('normalized_score', 50)))
    sorted_health = sorted(health_cats or [], key=lambda c: float(c.get('normalized_score', 50)))
    r0 = sorted_risk[0]['name'] if sorted_risk else 'Liquidity Risk'
    h0 = sorted_health[0]['name'] if sorted_health else 'Savings & Liquidity'
    r1 = sorted_risk[1]['name'] if len(sorted_risk) > 1 else 'Drawdown Tolerance'
    h1 = sorted_health[1]['name'] if len(sorted_health) > 1 else 'Emergency Moat'

    synth = [
        {'priority': 1, 'area': h0, 'action': f"Strengthen {h0.lower()}: Build ring-fenced reserves and systematic allocation to lift score toward 80%+ benchmark.", 'timeframe': '0 - 30 Days', 'status': 'Immediate Priority'},
        {'priority': 2, 'area': r0, 'action': f"Mitigate {r0.lower()}: Calibrate liquid/hybrid buffers to cushion interim market or income volatility.", 'timeframe': '1 - 3 Months', 'status': 'High Priority'},
        {'priority': 3, 'area': h1, 'action': f"Reinforce {h1.lower()}: Automate monthly goal-linked mutual fund SIPs and eliminate cashflow leakage.", 'timeframe': '3 - 6 Months', 'status': 'Active'},
        {'priority': 4, 'area': r1, 'action': f"Balance {r1.lower()}: Match investment holding durations with appropriate equity, hybrid, or debt categories.", 'timeframe': '3 - 6 Months', 'status': 'Active'},
        {'priority': 5, 'area': 'Protection & Estate Governance', 'action': 'Conduct annual audit of family term life, comprehensive medical coverage, and ensure 100% folio nominee alignment.', 'timeframe': '6 Months', 'status': 'Governance'},
        {'priority': 6, 'area': 'Wealth Compounding & Review', 'action': 'Schedule semi-annual portfolio statement reviews with the IRAH distribution desk to track goal alignment.', 'timeframe': 'Ongoing', 'status': 'Monitoring'},
    ]

    items = []
    seen_areas = set()
    for it in list(plan_items or []):
        if isinstance(it, dict) and (it.get('action') or it.get('recommendation')):
            area_key = str(it.get('area', '')).strip().lower()
            seen_areas.add(area_key)
            items.append(it)
    for s in synth:
        if len(items) >= 6:
            break
        if s['area'].lower() in seen_areas and len(items) >= 5:
            continue
        seen_areas.add(s['area'].lower())
        items.append(s)

    for i, it in enumerate(items[:6], 1):
        area = it.get('area', '')
        action = it.get('action') or it.get('recommendation', '')
        horizon = it.get('horizon') or it.get('timeframe', '1 - 3 Months')
        status = it.get('status', 'Active')
        asset_class = it.get('asset_class') or it.get('asset_classes')

        if not asset_class:
            area_lower = area.lower()
            action_lower = action.lower()
            matched = None
            for k, ac in ASSET_CLASS_MAPPING.items():
                if k in area_lower or k in action_lower:
                    matched = ac
                    break
            asset_class = matched or 'Diversified Mutual Funds, Liquid Moats & Multi-Asset Allocation'

        enriched.append({
            'priority': i,
            'area': area,
            'action': action,
            'asset_class': asset_class,
            'horizon': horizon,
            'status': status
        })

    return enriched


# ─── Payload Normalizer ───────────────────────────────────────────────────────
def _normalise(report_data):
    """
    Normalizes report payload structure, sanitizes strings, computes
    band classifications and fallback values without modifying input.
    """
    src = report_data if isinstance(report_data, dict) else {}
    profile_in = src.get('client_profile') if isinstance(src.get('client_profile'), dict) else {}
    profile = {k: _clean_text(v) for k, v in profile_in.items()}
    profile['age'] = profile.get('age') or profile.get('age_band') or ' -- '
    profile['employment_status'] = profile.get('employment_status') or profile.get('work_status') or ' -- '
    profile['main_financial_goal'] = profile.get('main_financial_goal') or profile.get('financial_goal') or 'Wealth Creation & Long-Term Compounding'

    def block(key, band_fn):
        raw = src.get(key) if isinstance(src.get(key), dict) else {}
        cats = []
        for c in raw.get('categories') or []:
            if not isinstance(c, dict):
                continue
            pct = max(0.0, min(100.0, _num(c.get('normalized_score', c.get('score_pct', 0)))))
            wt = _num(c.get('weight', 0))
            ws = _num(c.get('weighted_score', 0)) or round(pct * wt, 2)
            cats.append({
                'name': _clean_text(c.get('name', '')),
                'weight': wt,
                'normalized_score': pct,
                'weighted_score': ws,
                'band': _clean_text(c.get('band') or band_fn(pct)),
            })
        return {
            'overall_score': _num(raw.get('overall_score', 0)),
            'rating': _clean_text(raw.get('rating', 'N/A')),
            'categories': cats
        }

    health_block = block('health_results', _health_band)
    risk_block = block('risk_results', _risk_band)

    # Recompute overall score if categories exist and overall is 0
    if health_block['categories'] and health_block['overall_score'] == 0:
        health_block['overall_score'] = round(sum(c['weighted_score'] for c in health_block['categories']), 1)
    if risk_block['categories'] and risk_block['overall_score'] == 0:
        risk_block['overall_score'] = round(sum(c['weighted_score'] for c in risk_block['categories']), 1)

    plan = []
    for item in src.get('action_plan') or []:
        if isinstance(item, dict):
            plan.append({k: (_clean_text(v) if isinstance(v, (str, int, float)) else '') for k, v in item.items()})

    enriched_plan = enrich_action_plan(plan, health_block['categories'], risk_block['categories'])

    return {
        'client_profile': profile,
        'health_results': health_block,
        'risk_results': risk_block,
        'action_plan': enriched_plan
    }


# ─── Main PDF Builder ─────────────────────────────────────────────────────────
def build_pdf(report_data, ref_id='IRAH-ASSESS'):
    """
    Builds a deterministic 4-page branded PDF assessment report and
    returns an in-memory io.BytesIO object.
    """
    buf = io.BytesIO()

    data = _normalise(report_data)
    client      = data.get('client_profile', {})
    health      = data.get('health_results', {})
    risk        = data.get('risk_results', {})
    action_plan = data.get('action_plan', [])

    client_name = client.get('client_name') or 'Valued Client'
    assess_date = client.get('assessment_date') or datetime.now().strftime('%d %B %Y')

    page_decorator = _PageDecorator(client_name, assess_date, ref_id)

    TOP_MARGIN    = 1.65 * cm  # Below canvas header
    BOTTOM_MARGIN = 1.35 * cm  # Above canvas footer
    SIDE_MARGIN   = 1.50 * cm  # Standard corporate margin
    CONTENT_W     = PAGE_W - 2 * SIDE_MARGIN  # 510.27 points

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        leftMargin=SIDE_MARGIN,
        rightMargin=SIDE_MARGIN,
    )

    styles = getSampleStyleSheet()

    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    # ── Custom Typography Styles ──────────────────────────────────────────────
    brand_style = S('CoverBrand', fontSize=8.5, textColor=GOLD, fontName='Helvetica-Bold', leading=11, spaceAfter=2)
    cover_kicker = S('CoverKicker', fontSize=8.5, textColor=GOLD_LIGHT, fontName='Helvetica', leading=11, spaceAfter=3)
    cover_title = S('CoverTitle', fontSize=18, textColor=WHITE, fontName='Helvetica-Bold', leading=22, spaceAfter=2)
    cover_sub = S('CoverSub', fontSize=7.5, textColor=SLATE_400, fontName='Helvetica', leading=10)

    sec_kicker = S('SecKicker', fontSize=8.0, textColor=GOLD, fontName='Helvetica-Bold', leading=10, spaceAfter=1)
    sec_title = S('SecTitle', fontSize=12.0, textColor=NAVY_DARK, fontName='Helvetica-Bold', leading=15, spaceAfter=2)
    sec_sub = S('SecSub', fontSize=7.5, textColor=SLATE_500, fontName='Helvetica', leading=10, spaceAfter=4)

    card_head = S('CardHead', fontSize=8.0, textColor=NAVY_DARK, fontName='Helvetica-Bold', leading=10.5, spaceAfter=2)
    card_body = S('CardBody', fontSize=7.2, textColor=SLATE_700, fontName='Helvetica', leading=9.8)

    gold_label = S('GoldLabel', fontSize=7.5, textColor=GOLD, fontName='Helvetica-Bold', leading=9.5)
    val_text = S('ValText', fontSize=7.5, textColor=NAVY_DARK, fontName='Helvetica', leading=9.5)

    score_big = S('ScoreBig', fontSize=26, textColor=WHITE, fontName='Helvetica-Bold', leading=28, alignment=TA_CENTER)
    score_label = S('ScoreLabel', fontSize=7.5, textColor=GOLD_LIGHT, fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)

    th_left = S('THL', fontSize=7.5, textColor=WHITE, fontName='Helvetica-Bold', leading=9.5)
    th_center = S('THC', fontSize=7.5, textColor=WHITE, fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)
    td_left = S('TDL', fontSize=7.2, textColor=NAVY_DARK, fontName='Helvetica', leading=9.2)
    td_center = S('TDC', fontSize=7.2, textColor=NAVY_DARK, fontName='Helvetica', leading=9.2, alignment=TA_CENTER)
    td_bold_left = S('TDBL', fontSize=7.2, textColor=NAVY_DARK, fontName='Helvetica-Bold', leading=9.2)
    td_bold_center = S('TDBC', fontSize=7.2, textColor=NAVY_DARK, fontName='Helvetica-Bold', leading=9.2, alignment=TA_CENTER)

    story = []

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 1: EXECUTIVE COVER & COMPOSITE ASSESSMENT
    # ═════════════════════════════════════════════════════════════════════════

    # 1. Masthead Banner with Official Brand Logo Emblem
    logo_path = os.path.join(BASE_DIR, "assets", "images", "logo.png")
    if os.path.exists(logo_path):
        from reportlab.platypus import Image as RLImage
        logo_flowable = RLImage(logo_path, width=1.15 * inch, height=0.80 * inch)
        masthead_tbl = Table([
            [
                logo_flowable,
                [
                    Paragraph('IRAH SERVICES LLP', brand_style),
                    Paragraph('Comprehensive Financial Health &amp; Risk Assessment', cover_kicker),
                    Paragraph('Executive Financial Assessment Report', cover_title),
                    Paragraph('Institutional Wealth Assessment, Resilience Stress-Test &amp; Strategic Roadmap', cover_sub),
                ]
            ]
        ], colWidths=[1.35 * inch, CONTENT_W - 1.35 * inch])
        masthead_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), NAVY_DARK),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEBELOW', (0, 0), (-1, -1), 2.0, GOLD),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (0, 0), 12),
            ('RIGHTPADDING', (0, 0), (0, 0), 8),
            ('LEFTPADDING', (1, 0), (1, 0), 6),
            ('RIGHTPADDING', (1, 0), (1, 0), 12),
        ]))
    else:
        masthead_tbl = Table([[[
            Paragraph('IRAH SERVICES LLP', brand_style),
            Paragraph('Comprehensive Financial Health &amp; Risk Assessment', cover_kicker),
            Paragraph('Executive Financial Assessment Report', cover_title),
            Paragraph('Institutional Wealth Assessment, Resilience Stress-Test &amp; Strategic Roadmap', cover_sub),
        ]]], colWidths=[CONTENT_W])
        masthead_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), NAVY_DARK),
            ('LINEBELOW', (0, 0), (-1, -1), 2.0, GOLD),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ]))
    story.append(masthead_tbl)
    story.append(Spacer(1, 6))

    # 2. Client Profile Card (2-column compact grid)
    profile_rows = [
        [
            Paragraph('Client Name', gold_label), Paragraph(client_name, val_text),
            Paragraph('Assessment Date', gold_label), Paragraph(assess_date, val_text),
        ],
        [
            Paragraph('Age Bracket', gold_label), Paragraph(client.get('age', ' -- '), val_text),
            Paragraph('Employment Status', gold_label), Paragraph(client.get('employment_status', ' -- '), val_text),
        ],
        [
            Paragraph('Annual Income (Approx.)', gold_label), Paragraph(client.get('annual_income', ' -- '), val_text),
            Paragraph('Primary Income Source', gold_label), Paragraph(client.get('income_source', ' -- '), val_text),
        ],
        [
            Paragraph('Main Financial Goal', gold_label), Paragraph(client.get('main_financial_goal', ' -- '), val_text),
            Paragraph('Assessment Reference ID', gold_label), Paragraph(ref_id, val_text),
        ]
    ]
    profile_tbl = Table(profile_rows, colWidths=[CONTENT_W * 0.22, CONTENT_W * 0.28, CONTENT_W * 0.22, CONTENT_W * 0.28])
    profile_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_50),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [SLATE_50, SLATE_100]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, SLATE_200),
    ]))
    story.append(profile_tbl)
    story.append(Spacer(1, 6))

    # 3. Dual Composite Index Score Cards
    h_score = _num(health.get('overall_score', 0))
    h_rating = health.get('rating', 'Stable / Good')
    r_score = _num(risk.get('overall_score', 0))
    r_rating = risk.get('rating', 'Moderate / Controlled')

    score_card_rows = [
        [
            Paragraph(f'{h_score:.1f}%', score_big),
            Paragraph(f'{r_score:.1f}%', score_big),
        ],
        [
            Paragraph('Composite Financial Health Index', score_label),
            Paragraph('Composite Financial Risk &amp; Resilience Index', score_label),
        ],
        [
            Paragraph(f'Standing: {h_rating}', S('HRat', fontSize=8.5, textColor=_band_color(h_rating), fontName='Helvetica-Bold', leading=10.5, alignment=TA_CENTER)),
            Paragraph(f'Resilience: {r_rating}', S('RRat', fontSize=8.5, textColor=_band_color(r_rating), fontName='Helvetica-Bold', leading=10.5, alignment=TA_CENTER)),
        ]
    ]
    score_tbl = Table(score_card_rows, colWidths=[CONTENT_W / 2, CONTENT_W / 2])
    score_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('LINEAFTER', (0, 0), (0, -1), 1.0, GOLD),
        ('BOX', (0, 0), (-1, -1), 1.25, GOLD),
    ]))
    story.append(score_tbl)
    story.append(Spacer(1, 6))

    # 4. Executive Overview & Interpretive Context Box
    overview_text = derive_executive_overview(client, health, risk)
    overview_tbl = Table([[[
        Paragraph('EXECUTIVE ASSESSMENT SYNTHESIS &amp; INTERPRETIVE CONTEXT', S('EOH', fontSize=8.0, textColor=GOLD, fontName='Helvetica-Bold', leading=10.5, spaceAfter=3)),
        Paragraph(overview_text, S('EOB', fontSize=7.2, textColor=SLATE_700, fontName='Helvetica', leading=10.0)),
    ]]], colWidths=[CONTENT_W])
    overview_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_50),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
        ('LINELEFT', (0, 0), (0, 0), 2.5, NAVY_DARK),
    ]))
    story.append(overview_tbl)
    story.append(Spacer(1, 6))

    # 5. Key Assessment Snapshot (Top Strengths & Priority Focus Areas)
    h_strengths, h_vulns = derive_health_observations(health.get('categories', []))
    r_buffers, r_exposures = derive_risk_observations(risk.get('categories', []))

    str_items = [f"<b>{s[0]}:</b> {s[1]}" for s in h_strengths[:1] + r_buffers[:1]]
    vuln_items = [f"<b>{v[0]}:</b> {v[1]}" for v in h_vulns[:1] + r_exposures[:1]]

    snapshot_data = [
        [
            Paragraph('TOP FINANCIAL STRENGTHS &amp; BUFFERS', S('SSH', fontSize=7.5, textColor=EMERALD, fontName='Helvetica-Bold', leading=9.5, spaceAfter=2)),
            Paragraph('PRIORITY VULNERABILITIES &amp; ACTION AREAS', S('SVH', fontSize=7.5, textColor=CORAL, fontName='Helvetica-Bold', leading=9.5, spaceAfter=2)),
        ],
        [
            Paragraph("<br/>".join(str_items), S('SSB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=9.2)),
            Paragraph("<br/>".join(vuln_items), S('SVB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=9.2)),
        ]
    ]
    snapshot_tbl = Table(snapshot_data, colWidths=[CONTENT_W / 2, CONTENT_W / 2])
    snapshot_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_100),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('LINEAFTER', (0, 0), (0, -1), 0.5, SLATE_300),
        ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
    ]))
    story.append(snapshot_tbl)
    story.append(Spacer(1, 5))

    # Page 1 Confidentiality Footnote
    p1_note = Paragraph(
        "<b>Notice:</b> This assessment report is prepared by IRAH Services LLP (AMFI ARN-352385 | APMI APRN-08375) for financial readiness orientation and educational self-assessment purposes only. "
        "Strictly Confidential -- Prepared for the sole use of the client named above.",
        S('P1N', fontSize=6.2, textColor=SLATE_500, fontName='Helvetica', leading=8.5)
    )
    story.append(p1_note)

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 2: PILLAR I: FINANCIAL HEALTH FACTOR ANALYSIS
    # ═════════════════════════════════════════════════════════════════════════
    h_categories = health.get('categories', [])
    h_count = len(h_categories) or 8
    story.append(Paragraph('PILLAR I: FINANCIAL HEALTH CHECK', sec_kicker))
    story.append(Paragraph('Financial Health Factor Analysis &amp; Capital Structure', sec_title))
    story.append(Paragraph(f'Evaluates cash-flow resilience, savings discipline, and asset growth capacity across {h_count} weighted health factors.', sec_sub))
    story.append(Spacer(1, 4))

    if h_categories:
        h_names = [c.get('name', '') for c in h_categories]
        h_vals  = [float(c.get('normalized_score', 0)) for c in h_categories]
        h_buf = generate_radar_chart_image(
            h_names, h_vals, f'Financial Health Profile ({h_count} Factors)',
            line_hex='#C5A059', fill_hex='#C5A059', text_hex='#E6CC99', is_health=True
        )
        h_img = Image(h_buf, width=8.8 * cm, height=8.8 * cm)
        h_img.hAlign = 'CENTER'
        story.append(h_img)
        story.append(Spacer(1, 5))

        # Visual Investor-Friendly Health Breakdown Table (no Weight / Normalized % / Weighted Pts)
        h_table_data = [
            [
                Paragraph('Health Area', th_left),
                Paragraph('Visual Score (Out of 100)', th_left),
                Paragraph('Score', th_center),
                Paragraph('Standing', th_center),
            ]
        ]
        for c in h_categories:
            ns = float(c.get('normalized_score', 0))
            band = c.get('band', _health_band(ns))
            b_col = _band_color(band)
            h_table_data.append([
                Paragraph(c.get('name', ''), td_left),
                _score_bar_drawing(ns, b_col, width=128, height=7),
                Paragraph(f"<b>{ns:.0f}</b> / 100", td_center),
                Paragraph(band, S(f'HB_{c.get("name")}', fontSize=7.2, textColor=b_col, fontName='Helvetica-Bold', leading=9.2, alignment=TA_CENTER)),
            ])

        # Composite Health Total Row
        h_table_data.append([
            Paragraph('OVERALL FINANCIAL HEALTH', td_bold_left),
            _score_bar_drawing(h_score, _band_color(h_rating), width=128, height=8),
            Paragraph(f"<b>{h_score:.1f}</b> / 100", S('HTS', fontSize=7.5, textColor=_band_color(h_rating), fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)),
            Paragraph(h_rating, S('HTR', fontSize=7.5, textColor=_band_color(h_rating), fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)),
        ])

        col_w = [CONTENT_W * 0.34, CONTENT_W * 0.30, CONTENT_W * 0.14, CONTENT_W * 0.22]
        h_tbl = Table(h_table_data, colWidths=col_w)
        h_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY_DARK),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [SLATE_50, SLATE_100]),
            ('BACKGROUND', (0, -1), (-1, -1), SLATE_200),
            ('TOPPADDING', (0, 0), (-1, -1), 3.2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.2),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, SLATE_200),
        ]))
        story.append(h_tbl)
        story.append(Spacer(1, 5))

        # Pillar I Analytical Findings Box
        obs_h_str, obs_h_vuln = derive_health_observations(h_categories)
        p2_findings_data = [
            [
                Paragraph('KEY HEALTH STRENGTHS', S('KHSH', fontSize=7.2, textColor=EMERALD, fontName='Helvetica-Bold', leading=9.0)),
                Paragraph('HEALTH VULNERABILITIES &amp; FOCUS AREAS', S('KHVH', fontSize=7.2, textColor=CORAL, fontName='Helvetica-Bold', leading=9.0)),
            ],
            [
                Paragraph("<br/>".join([f"&bull; <b>{s[0]}:</b> {s[1]}" for s in obs_h_str]), S('KHSB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=8.8)),
                Paragraph("<br/>".join([f"&bull; <b>{v[0]}:</b> {v[1]}" for v in obs_h_vuln]), S('KHVB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=8.8)),
            ]
        ]
        p2_findings_tbl = Table(p2_findings_data, colWidths=[CONTENT_W / 2, CONTENT_W / 2])
        p2_findings_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_50),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, SLATE_200),
        ]))
        story.append(p2_findings_tbl)

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 3: PILLAR II: FINANCIAL RISK & RESILIENCE ANALYSIS
    # ═════════════════════════════════════════════════════════════════════════
    r_categories = risk.get('categories', [])
    r_count = len(r_categories) or 7
    story.append(Paragraph('PILLAR II: FINANCIAL RISK &amp; RESILIENCE', sec_kicker))
    story.append(Paragraph('Risk Factor Analysis &amp; Drawdown Resilience Profiling', sec_title))
    story.append(Paragraph(f'Evaluates debt vulnerability, income shock absorption, liquidity stress, and drawdown tolerance across {r_count} risk factors.', sec_sub))
    story.append(Spacer(1, 4))

    if r_categories:
        r_names = [c.get('name', '') for c in r_categories]
        r_vals  = [float(c.get('normalized_score', 0)) for c in r_categories]
        r_buf = generate_radar_chart_image(
            r_names, r_vals, f'Financial Risk & Resilience Profile ({r_count} Factors)',
            line_hex='#EA580C', fill_hex='#EA580C', text_hex='#FDBA74', is_health=False
        )
        r_img = Image(r_buf, width=8.8 * cm, height=8.8 * cm)
        r_img.hAlign = 'CENTER'
        story.append(r_img)
        story.append(Spacer(1, 5))

        # Visual Investor-Friendly Risk Breakdown Table (no Weight / Normalized % / Weighted Pts)
        r_table_data = [
            [
                Paragraph('Risk &amp; Resilience Area', th_left),
                Paragraph('Visual Buffer (Out of 100)', th_left),
                Paragraph('Score', th_center),
                Paragraph('Standing', th_center),
            ]
        ]
        for c in r_categories:
            ns = float(c.get('normalized_score', 0))
            band = c.get('band', _risk_band(ns))
            b_col = _band_color(band)
            r_table_data.append([
                Paragraph(c.get('name', ''), td_left),
                _score_bar_drawing(ns, b_col, width=128, height=7),
                Paragraph(f"<b>{ns:.0f}</b> / 100", td_center),
                Paragraph(band, S(f'RB_{c.get("name")}', fontSize=7.2, textColor=b_col, fontName='Helvetica-Bold', leading=9.2, alignment=TA_CENTER)),
            ])

        # Composite Risk Total Row
        r_table_data.append([
            Paragraph('OVERALL RISK RESILIENCE', td_bold_left),
            _score_bar_drawing(r_score, _band_color(r_rating), width=128, height=8),
            Paragraph(f"<b>{r_score:.1f}</b> / 100", S('RTS', fontSize=7.5, textColor=_band_color(r_rating), fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)),
            Paragraph(r_rating, S('RTR', fontSize=7.5, textColor=_band_color(r_rating), fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)),
        ])

        r_tbl = Table(r_table_data, colWidths=col_w)
        r_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY_DARK),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [SLATE_50, SLATE_100]),
            ('BACKGROUND', (0, -1), (-1, -1), SLATE_200),
            ('TOPPADDING', (0, 0), (-1, -1), 3.2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.2),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, SLATE_200),
        ]))
        story.append(r_tbl)
        story.append(Spacer(1, 5))

        # Pillar II Analytical Findings Box
        obs_r_buf, obs_r_exp = derive_risk_observations(r_categories)
        p3_findings_data = [
            [
                Paragraph('RESILIENCE BUFFERS &amp; MOATS', S('KRSH', fontSize=7.2, textColor=EMERALD, fontName='Helvetica-Bold', leading=9.0)),
                Paragraph('ELEVATED EXPOSURE VULNERABILITIES', S('KRVH', fontSize=7.2, textColor=CORAL, fontName='Helvetica-Bold', leading=9.0)),
            ],
            [
                Paragraph("<br/>".join([f"&bull; <b>{s[0]}:</b> {s[1]}" for s in obs_r_buf]), S('KRSB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=8.8)),
                Paragraph("<br/>".join([f"&bull; <b>{v[0]}:</b> {v[1]}" for v in obs_r_exp]), S('KRVB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=8.8)),
            ]
        ]
        p3_findings_tbl = Table(p3_findings_data, colWidths=[CONTENT_W / 2, CONTENT_W / 2])
        p3_findings_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_50),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, SLATE_200),
        ]))
        story.append(p3_findings_tbl)

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════════════
    # PAGE 4: PRIORITIZED ACTION PLAN & STATUTORY DISCLOSURES
    # ═════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('RECOMMENDED STRATEGIC ROADMAP', sec_kicker))
    story.append(Paragraph('Prioritized Action Plan Matrix &amp; Asset Allocation Roadmap', sec_title))
    story.append(Paragraph('Formulated dynamically from lowest scoring health factors and elevated risk exposures.', sec_sub))
    story.append(Spacer(1, 4))

    # Action Plan Matrix Table (5 columns)
    # Widths: # (22pt), Priority Area (92pt), Recommended Action (172pt), Target Asset Classes (138pt), Horizon & Status (86pt)
    ap_header = [
        Paragraph('#', th_center),
        Paragraph('Priority Focus Area', th_left),
        Paragraph('Recommended Implementation Step', th_left),
        Paragraph('Target Asset Classes &amp; Instruments', th_left),
        Paragraph('Target Horizon', th_center),
    ]
    ap_data = [ap_header]

    for item in action_plan[:6]:
        idx = item.get('priority', 1)
        area = item.get('area', ' -- ')
        action = item.get('action', ' -- ')
        asset_class = item.get('asset_class', 'Multi-Asset Allocation')
        horizon = item.get('horizon', '1 - 3 Months')
        status = item.get('status', 'Active')

        ap_data.append([
            Paragraph(str(idx), S(f'AP_IDX_{idx}', fontSize=7.5, textColor=GOLD, fontName='Helvetica-Bold', leading=9.5, alignment=TA_CENTER)),
            Paragraph(f"<b>{area}</b><br/><font color='#64748B' size='6.2'>Status: {status}</font>", S(f'AP_AR_{idx}', fontSize=7.0, textColor=NAVY_DARK, fontName='Helvetica', leading=8.8)),
            Paragraph(action, S(f'AP_AC_{idx}', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=8.8)),
            Paragraph(asset_class, S(f'AP_AS_{idx}', fontSize=6.8, textColor=NAVY_DARK, fontName='Helvetica', leading=8.8)),
            Paragraph(horizon, S(f'AP_HZ_{idx}', fontSize=6.8, textColor=SLATE_500, fontName='Helvetica-Bold', leading=8.8, alignment=TA_CENTER)),
        ])

    ap_col_w = [22, 92, 172, 138, 86]
    ap_tbl = Table(ap_data, colWidths=ap_col_w)
    ap_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY_DARK),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [SLATE_50, SLATE_100]),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.75, SLATE_300),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, SLATE_200),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(ap_tbl)
    story.append(Spacer(1, 5))

    # Implementation Guidance Card
    guidance_data = [[
        Paragraph(
            "<b>Facilitation &amp; Execution Guidance:</b> IRAH Services LLP facilitates execution across regulated mutual fund "
            "schemes and institutional wealth frameworks. Strategy reviews are conducted semi-annually with your dedicated relationship desk "
            "to re-balance asset weights and ensure alignment with emerging lifecycle milestones.",
            S('GDB', fontSize=6.8, textColor=SLATE_700, fontName='Helvetica', leading=9.2)
        )
    ]]
    guidance_tbl = Table(guidance_data, colWidths=[CONTENT_W])
    guidance_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_50),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, SLATE_300),
        ('LINELEFT', (0, 0), (0, 0), 2.0, GOLD),
    ]))
    story.append(guidance_tbl)
    story.append(Spacer(1, 6))

    # Complete Statutory Compliance & Regulatory Disclosures Box
    statutory_data = [
        [Paragraph('STATUTORY COMPLIANCE &amp; REGULATORY DISCLOSURES', S('SDH', fontSize=7.2, textColor=GOLD, fontName='Helvetica-Bold', leading=9.0, spaceAfter=2))],
        [Paragraph(STATUTORY_DISCLOSURE, S('SDB', fontSize=6.0, textColor=SLATE_500, fontName='Helvetica', leading=8.0))],
    ]
    statutory_tbl = Table(statutory_data, colWidths=[CONTENT_W])
    statutory_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY_DARK),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1.0, GOLD),
    ]))
    story.append(statutory_tbl)

    # Build the document
    doc.build(story, onFirstPage=page_decorator, onLaterPages=page_decorator)
    buf.seek(0)
    return buf
