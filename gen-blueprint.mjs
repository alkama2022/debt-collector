import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.join("docs","CollectNaija_Blueprint_v1.0.pdf");
fs.mkdirSync(path.dirname(OUT), {recursive:true});

// Colors
const BRAND = "#0F4C81";
const BRAND_LIGHT = "#E6EEF6";
const SLATE900 = "#0F172A";
const SLATE600 = "#475569";
const SLATE400 = "#94A3B8";
const EMERALD = "#059669";
const AMBER = "#D97706";
const RED = "#DC2626";
const BG = "#F8FAFC";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  autoFirstPage: false,
  info: {
    Title: "CollectNaija — Product Requirements & Software Development Blueprint v1.0",
    Author: "CollectNaija Product Architecture Team",
    Subject: "AI-Powered Collections & Payment Management Platform — Nigeria-first, Globally Scalable SaaS",
    Keywords: "SaaS, FinTech, Collections, AI Agent, Django, React, PostgreSQL",
    Creator: "CollectNaija Blueprint Generator (pdfkit)",
    CreationDate: new Date()
  }
});
doc.pipe(fs.createWriteStream(OUT));

let pageNumber = 0;
function addPage() {
  doc.addPage();
  pageNumber++;
  // footer
  const bottom = doc.page.height - 30;
  doc.save();
  doc.font("Helvetica").fontSize(7).fillColor(SLATE400)
    .text(`CollectNaija Blueprint v1.0  •  Confidential  •  ${new Date().toISOString().slice(0,10)}`, 50, bottom, { align: "left", width: 200 })
    .text(`Page ${pageNumber}`, 0, bottom, { align: "right" });
  // top thin brand line for interior pages (not cover)
  if(pageNumber > 1) {
    doc.rect(0,0, doc.page.width, 3).fill(BRAND);
  }
  doc.restore();
  return pageNumber;
}

// helpers
function heading1(doc, num, title, subtitle) {
  if(doc.y > 650) addPage();
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND).text(`SECTION ${String(num).padStart(2,'0')}`, { characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(SLATE900).text(title, { lineGap: 2 });
  if(subtitle) {
    doc.font("Helvetica").fontSize(9).fillColor(SLATE600).text(subtitle, { lineGap: 3 });
  }
  doc.moveDown(0.3);
  doc.save(); doc.strokeColor(BRAND).lineWidth(2).moveTo(50, doc.y).lineTo(140, doc.y).stroke(); doc.restore();
  doc.moveDown(0.8);
}
function heading2(doc, text) {
  if(doc.y > 700) addPage();
  doc.font("Helvetica-Bold").fontSize(10).fillColor(SLATE900).text(text, { lineGap: 2 });
  doc.moveDown(0.3);
}
function heading3(doc, text) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor(SLATE900).text(text);
  doc.moveDown(0.2);
}
function para(doc, text, opts={}) {
  doc.font("Helvetica").fontSize(8.5).fillColor(SLATE900).text(text, { align: "justify", lineGap: 3, paragraphGap: 4, ...opts });
  doc.moveDown(0.2);
}
function bullets(doc, items) {
  items.forEach(it => {
    if(doc.y > 750) addPage();
    doc.font("Helvetica").fontSize(8.5).fillColor(SLATE900).text("•  " + it, { indent: 12, lineGap: 2, paragraphGap: 2 });
  });
  doc.moveDown(0.3);
}
function tagBox(doc, label, text) {
  if(doc.y > 720) addPage();
  const colors = { FACT:"#0F4C81", REQUIREMENT:"#059669", ASSUMPTION:"#D97706", HYPOTHESIS:"#7C3AED", RECOMMENDATION:"#0E7490", "FUTURE IDEA":"#475569" };
  const c = colors[label] || BRAND;
  const y0 = doc.y;
  doc.save();
  // background
  const w = doc.page.width - 100;
  // measure height first by writing invisible
  doc.font("Helvetica").fontSize(7.5);
  const h = doc.heightOfString(text, { width: w - 70 });
  const boxH = Math.max(22, h + 14);
  if(y0 + boxH > 810) { addPage(); }
  doc.roundedRect(50, doc.y, w, boxH, 6).fillAndStroke("#F1F5F9", "#E2E8F0");
  doc.fillColor(c).font("Helvetica-Bold").fontSize(7).text(label, 58, doc.y + 5, { width: 58 });
  doc.fillColor(SLATE900).font("Helvetica").fontSize(7.5).text(text, 120, doc.y - 9, { width: w - 75, lineGap: 2 });
  doc.y = y0 + boxH + 6;
  doc.restore();
}
function table(doc, headers, rows, colWidths) {
  if(doc.y > 700) addPage();
  const W = doc.page.width - 100;
  const widths = colWidths || headers.map(()=> W / headers.length);
  const startX = 50;
  let y = doc.y;
  // header
  doc.save();
  doc.roundedRect(startX, y, W, 18, 4).fill(BRAND);
  let x = startX;
  headers.forEach((h,i)=>{
    doc.fillColor("white").font("Helvetica-Bold").fontSize(7).text(h, x+6, y+6, { width: widths[i]-12, align: "left" });
    x += widths[i];
  });
  doc.restore();
  y += 20;
  doc.y = y;
  rows.forEach((row, idx)=>{
    if(doc.y > 780) { addPage(); y = doc.y; }
    const rowH = 16;
    const bg = idx %2===0 ? "#FFFFFF" : "#F8FAFC";
    doc.save();
    doc.rect(startX, doc.y, W, rowH).fill(bg).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.restore();
    let cx = startX;
    row.forEach((cell,i)=>{
      doc.fillColor(SLATE900).font(idx===rows.length-1 && cell.startsWith("TOTAL") ? "Helvetica-Bold" : "Helvetica").fontSize(7).text(String(cell), cx+6, doc.y+5, { width: widths[i]-12, align: i===widths.length-1 ? "right" : "left" });
      cx += widths[i];
    });
    doc.y += rowH;
  });
  doc.moveDown(0.6);
  // ensure doc.y correct
}
function codeBlock(doc, lines) {
  if(doc.y > 700) addPage();
  const W = doc.page.width - 100;
  const h = lines.length * 9 + 14;
  if(doc.y + h > 810) addPage();
  const y0 = doc.y;
  doc.save();
  doc.roundedRect(50, y0, W, h, 6).fill("#0F172A");
  doc.fillColor("#E2E8F0").font("Helvetica").fontSize(7);
  lines.forEach((ln,i)=>{
    doc.text(ln, 58, y0+7 + i*9, { width: W-16, lineBreak:false });
  });
  doc.restore();
  doc.y = y0 + h + 8;
}
function flowBox(doc, steps) {
  // horizontal flow with boxes + arrows
  if(doc.y > 700) addPage();
  const W = doc.page.width - 100;
  const boxW = Math.min(92, (W - (steps.length-1)*12)/steps.length);
  const boxH = 28;
  let x = 50;
  const y0 = doc.y;
  if(y0 + boxH + 12 > 810) addPage();
  steps.forEach((s,i)=>{
    doc.save();
    doc.roundedRect(x, doc.y, boxW, boxH, 6).fillAndStroke(i===0 ? BRAND : i===steps.length-1 ? "#059669" : "white", i===0 || i===steps.length-1 ? "transparent" : "#E2E8F0");
    doc.fillColor(i===0 || i===steps.length-1 ? "white" : SLATE900).font("Helvetica-Bold").fontSize(6.5).text(s, x+4, doc.y+6, { width: boxW-8, align:"center" });
    doc.restore();
    if(i < steps.length-1) {
      doc.save();
      doc.strokeColor(SLATE400).lineWidth(0.8).moveTo(x+boxW+2, doc.y+boxH/2).lineTo(x+boxW+10, doc.y+boxH/2).stroke();
      doc.polygon([x+boxW+10, doc.y+boxH/2-3],[x+boxW+10, doc.y+boxH/2+3],[x+boxW+14, doc.y+boxH/2]).fill(SLATE400);
      doc.restore();
    }
    x += boxW + 12;
  });
  doc.y = y0 + boxH + 12;
}
function noteCard(doc, title, text) {
  if(doc.y > 740) addPage();
  const W = doc.page.width - 100;
  const h = doc.heightOfString(text, { width: W-20 }) + 28;
  if(doc.y + h > 810) addPage();
  const y0 = doc.y;
  doc.save();
  doc.roundedRect(50, y0, W, h, 8).fillAndStroke("#FFFBEB","#FDE68A");
  doc.fillColor("#92400E").font("Helvetica-Bold").fontSize(7.5).text(title, 58, y0+8, { width: W-16 });
  doc.fillColor(SLATE900).font("Helvetica").fontSize(7.5).text(text, 58, doc.y+2, { width: W-16, lineGap:2 });
  doc.restore();
  doc.y = y0 + h + 8;
}

// COVER
addPage();
const coverY = 90;
doc.save();
doc.rect(0,0, doc.page.width, 8).fill(BRAND);
doc.restore();
doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND).text("COLLECTNAIJA  •  NIGERIA-FIRST  •  GLOBALLY SCALABLE", 50, 48, { align: "center", width: doc.page.width-100, characterSpacing: 1.5 });
doc.font("Helvetica-Bold").fontSize(34).fillColor(SLATE900).text("CollectNaija", 50, coverY, { align: "center", width: doc.page.width-100, lineGap: 4 });
doc.font("Helvetica").fontSize(11).fillColor(SLATE600).text("AI-Powered Collections & Payment Management Platform", 50, coverY+48, { align: "center", width: doc.page.width-100 });
doc.font("Helvetica-Oblique").fontSize(11).fillColor(BRAND).text("“Collect what you're owed. Stay in control.”", 50, coverY+68, { align: "center", width: doc.page.width-100 });

doc.save();
doc.roundedRect(50, coverY+98, doc.page.width-100, 2, 1).fill(BRAND);
doc.restore();

doc.font("Helvetica-Bold").fontSize(14).fillColor(SLATE900).text("Product Requirements &", 50, coverY+112, { align:"center", width: doc.page.width-100 });
doc.font("Helvetica-Bold").fontSize(14).fillColor(BRAND).text("Software Development Blueprint", 50, coverY+130, { align:"center", width: doc.page.width-100 });
doc.font("Helvetica").fontSize(9).fillColor(SLATE600).text("Version 1.0  •  September 2026  •  Confidential  •  For Founders, Product, Engineering & Investors", 50, coverY+152, { align:"center", width: doc.page.width-100 });

 // hero stats cards mock
const cardW = (doc.page.width-100-24)/3;
let cx = 50;
const cy = coverY+180;
[
  {k:"CORE FLOW", v:"Customer → Invoice → Debt → Payment → Reminder → Conversation → Collection → Receipt → Analytics"},
  {k:"AI PRINCIPLE", v:"Professional • Respectful • Helpful • AI-assisted, not AI-controlled"},
  {k:"STACK", v:"React + Django + DRF + PostgreSQL + Redis + Celery • Provider-agnostic AI"},
].forEach(c=>{
  doc.save();
  doc.roundedRect(cx, cy, cardW, 62, 10).fillAndStroke("white","#E2E8F0");
  doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(7).text(c.k, cx+12, cy+10, { width: cardW-24 });
  doc.fillColor(SLATE900).font("Helvetica").fontSize(7).text(c.v, cx+12, cy+22, { width: cardW-24, lineGap:2 });
  doc.restore();
  cx += cardW+12;
});

// bottom meta table
const metaY = cy+86;
doc.save();
doc.roundedRect(50, metaY, doc.page.width-100, 74, 10).fillAndStroke("#F1F5F9","#E2E8F0");
doc.restore();
doc.font("Helvetica-Bold").fontSize(7).fillColor(SLATE600).text("DOCUMENT CONTROL", 58, metaY+10, { width: 120 });
let mx = 58, my = metaY+22;
[
  ["Classification","Confidential — Internal & Selected Investors"],
  ["Prepared by","CollectNaija Product Architecture Team (PM, Design, Engineering, AI, Security, Compliance)"],
  ["Review Status","Draft v1.0 — pending founder validation & pilot feedback"],
  ["Distribution","Founders • CTO • Lead Engineers • Design • AI Safety Reviewer • Legal/Compliance"],
].forEach(([k,v])=>{
  doc.font("Helvetica-Bold").fontSize(7).fillColor(SLATE600).text(k+":", mx, my, { width: 110 });
  doc.font("Helvetica").fontSize(7).fillColor(SLATE900).text(v, mx+112, my, { width: doc.page.width-100-130 });
  my += 10;
});
doc.font("Helvetica-Oblique").fontSize(6.5).fillColor(SLATE400).text("This blueprint distinguishes FACT / REQUIREMENT / ASSUMPTION / HYPOTHESIS / RECOMMENDATION / FUTURE IDEA throughout. Do not present assumptions as proven market facts.", 58, metaY+62, { width: doc.page.width-100-16, align:"center" });

// footer on cover
doc.font("Helvetica").fontSize(7).fillColor(SLATE400).text("CollectNaija  •  collectnaija.com (placeholder)  •  Lagos, Nigeria  •  Mobile-first • WhatsApp-first • Offline-aware", 50, doc.page.height-36, { align:"center", width: doc.page.width-100 });

// PAGE 2 - HOW TO USE
addPage();
heading1(doc, 0, "How to Use This Blueprint", "Read order, conventions, and acceptance gate before build");
heading2(doc, "Who this is for");
bullets(doc, [
  "Founders & Product: scope, roadmap, pricing, validation — sections 1–9, 45–54, 63.",
  "Engineering (FE/BE/Mobile/DevOps/QA): architecture, DB, API, security, testing — sections 15–44, 55–58.",
  "AI Team: agent, voice, safety, channel engine, cost — sections 10–14, 22–23, 30, 34, 36.",
  "Compliance/Legal & GTM: privacy, risk, compliance, metrics — sections 31, 43–51."
]);
heading2(doc, "Conventions");
table(doc, ["Tag","Meaning","Example"], [
  ["FACT","Verifiable or evidence-backed","Nigeria has >100M mobile subscribers (NCC data)"],
  ["REQUIREMENT","Must-have for launch/quality gate","Backend is source of truth for balances"],
  ["ASSUMPTION","Working belief to validate","SMBs will pay ₦5k–15k/mo for automation"],
  ["HYPOTHESIS","Testable, may be wrong","WhatsApp outperforms SMS for collections"],
  ["RECOMMENDATION","Suggested approach, not mandatory","Use Paystack abstraction first"],
  ["FUTURE IDEA","Post-stabilization","Cash-flow forecasting & churn signals"],
], [110,120,265]);
para(doc, "Every financially significant action requires deterministic backend validation. The AI never fabricates balances, deadlines, penalties, or payment confirmations.");
noteCard(doc, "Golden Rule — AI-assisted, not AI-controlled", "The AI is a respectful assistant. The business owner controls policies. The backend is the source of truth. Humans handle complex, disputed, or sensitive cases. Every page of this blueprint enforces that separation.");

// TOC
addPage();
doc.font("Helvetica-Bold").fontSize(14).fillColor(SLATE900).text("Contents", 50, doc.y);
doc.font("Helvetica").fontSize(8).fillColor(SLATE600).text("65 sections  •  ~70 pages  •  Architecture diagrams, ERD, state machines, API examples, checklists", 50, doc.y+4);
doc.moveDown(0.6);
doc.save(); doc.strokeColor("#E2E8F0").lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width-50, doc.y).stroke(); doc.restore();
doc.moveDown(0.6);
const toc = [
 "1. Executive Summary","2. Product Vision","3. Problem Definition","4. Market Validation Strategy","5. Target Customers","6. Personas","7. User Journeys","8. Product Requirements","9. MVP Scope","10. AI Collections Agent",
 "11. AI Conversation Architecture","12. AI Voice Architecture","13. Communication Architecture","14. Collection Automation","15. Payment Architecture","16. Database Architecture","17. Entity-Relationship Diagram (ERD)","18. Multi-Tenant Architecture","19. Backend Architecture","20. Frontend Architecture",
 "21. Mobile Architecture","22. AI Architecture","23. AI Safety Architecture","24. Security Architecture","25. Privacy Architecture","26. API Design","27. Webhook Architecture","28. Notification System","29. Reminder Engine","30. Human Escalation System",
 "31. UI/UX System","32. Accessibility","33. Internationalization","34. Performance","35. Offline / Poor-Network Strategy","36. Testing Strategy","37. AI Testing","38. DevOps","39. Docker","40. CI/CD",
 "41. Monitoring","42. Logging","43. Backups","44. Disaster Recovery","45. Monetization","46. SaaS Pricing Strategy","47. Unit Economics","48. Customer Acquisition","49. Metrics","50. Risk Register",
 "51. Compliance Considerations","52. Build-vs-Buy Analysis","53. Technology Decisions","54. 12-Month Roadmap","55. Weekly Development Process","56. Definition of Done","57. GitHub Strategy","58. Production Deployment Checklist","59. Pilot Launch Strategy","60. Future AI Roadmap",
 "61. Flutter Roadmap","62. Global Expansion Strategy","63. Master Development Checklist","64. Glossary","65. Final Product Principles"
];
let cols = 2;
let colW = (doc.page.width-100-20)/2;
let tY = doc.y;
let leftX = 50, rightX = 50+colW+20;
toc.forEach((t,i)=>{
  const col = i %2===0 ? 0 : 1; // we will interleave for 2 columns reading top-down per column to keep nice: simpler sequential 2-col
});
// simpler: sequential flow in 2 columns by splitting array
const half = Math.ceil(toc.length/2);
[toc.slice(0,half), toc.slice(half)].forEach((list, colIdx)=>{
  let y = tY;
  let x = colIdx===0 ? leftX : rightX;
  list.forEach(entry=>{
    if(y > 780) { addPage(); y = 60; } // not perfect but TOC is short
    const num = entry.split(".")[0];
    const title = entry.substring(entry.indexOf(".")+1).trim();
    doc.font("Helvetica-Bold").fontSize(7).fillColor(BRAND).text(num+".", x, y, { width: 14 });
    doc.font("Helvetica").fontSize(7).fillColor(SLATE900).text(title, x+14, y-7, { width: colW-14, lineGap:2 });
    y = doc.y + 2;
    if(colIdx===0) doc.y = y; // keep tracking for column 1 to not affect 2
  });
  if(colIdx===0) tY = doc.y; // after first column
});
doc.y = Math.max(doc.y, tY+10);
doc.moveDown(1);
para(doc, "Reading path for builders: skim sections 1–9, then deep-dive 14–23 (automation & AI), 15–19 (data & backend), 26–30 (integration), 24–25/38–44 (hardening), 54–59 (execution). Mark every HYPOTHESIS for pilot validation before coding it into policy defaults.");

// Helper to add chapter content quickly
function chapter(num, title, subtitle, contentFn) {
  addPage();
  heading1(doc, num, title, subtitle);
  contentFn(doc);
}

// CHAPTERS 1-65
chapter(1, "Executive Summary", "Why CollectNaija, what we build, and what commercial outcome we chase", (doc)=>{
  para(doc, "CollectNaija is a Nigeria-first, globally scalable SaaS platform for tracking customers, invoices, debts, payments and collections, with an intelligent AI Collections Agent that communicates respectfully via WhatsApp, voice, SMS and email. The product promise is simple: know who owes you, know how much, know when they promised to pay — and follow up automatically without damaging customer relationships.");
  bullets(doc, [
    "Problem: SMBs track debts in notebooks/Excel/WhatsApp/memory → forgotten debts, late payments, disputes, wasted staff time, no history or accountability.",
    "Solution: Centralized flow Customer → Invoice → Debt → Payment → Reminder → Conversation → Collection → Receipt → Analytics, with policy-driven automation and an AI assistant that behaves like a professional, calm, business-aware human — not an aggressive collector.",
    "Commercial lens: Nigeria’s credit-informal economy + WhatsApp ubiquity + mobile-money/bank-transfer rails make respectful, automated collections a high-frequency, high-ROI workflow. Land with SMBs (schools, clinics, traders, agencies), expand to branches and enterprise, monetize automation & AI usage separately.",
    "Architecture: React frontend, Django+DRF backend, PostgreSQL, Redis/Celery, object storage, provider-agnostic AI abstraction, channel abstraction (WhatsApp/SMS/Email/Voice), payment-provider abstraction, Docker/CI/CD on cloud.",
    "Guardrails: Backend is source of truth for all financial state; AI is tool-constrained, policy-gated, tenant-isolated, logged, and escalates early. Payment verification is webhook + idempotency, never frontend confirmation. Reminders cancel deterministically after verified payment."
  ]);
  tagBox(doc, "FACT", "Nigeria is a mobile-first market with WhatsApp as the dominant SMB-to-customer channel. (NCC & GSMA mobile penetration reports; observable SMB behavior).");
  tagBox(doc, "HYPOTHESIS", "Businesses will pay a premium for AI that reduces manual follow-up while preserving customer goodwill. Must validate via 20+ interviews and a paid pilot before pricing locks.");
  table(doc, ["Pillar","What success looks like at 12 months"], [
    ["Paid SMBs","200–500 paying orgs, <8% monthly churn, 40% from WhatsApp-first verticals"],
    ["Collection lift","15–30% reduction in average days-to-payment vs baseline"],
    ["AI adoption","60% of paid orgs enable at least one AI channel; escalation <18%"],
    ["Reliability","99.5% API availability, zero cross-tenant leaks in audit"],
  ], [150,345]);
  noteCard(doc, "What makes this investable", "Not ‘a chatbot that asks for money’ — a financial collections operating system where automation compounds. Network of payment history + promise-to-pay + channel preference becomes defensible data moat per org, and anonymized benchmarks per vertical.");
});

chapter(2, "Product Vision", "“Collect what you’re owed. Stay in control.” — respectful, reliable, global-ready", (doc)=>{
  para(doc, "CollectNaija helps businesses get paid without destroying the relationship between business and customer. The vision is a collections operating system that is simple for owners, powerful for collection teams, respectful to customers, reliable for financial records, safe for AI communication, and scalable internationally.");
  bullets(doc, [
    "North star: Every business knows its outstanding in one screen, every customer has a clear, respectful payment experience, every interaction is recorded, every naira is reconciled.",
    "Experience principles: Simplicity over configurability at first; clarity over cleverness; transparency over manipulation; consent and escalation over persistence.",
    "Nigeria-first doesn’t mean Nigeria-only: localize currency, payment rails, language, time zone, and compliance behind abstractions; default brand remains Nigerian-credible and globally legible.",
    "AI posture: The agent is a professional assistant — concise, empathetic, context-aware, never threatening, never fabricating, always disclosing automation where required."
  ]);
  codeBlock(doc, [
    "Vision hierarchy:",
    "Purpose: Help businesses stay in control of money owed.",
    "Positioning: Collect what you're owed. Stay in control.",
    "Personality: Professional + Respectful + Calm + Helpful + Human-like + Concise + Empathetic + Business-aware"
  ]);
  tagBox(doc, "REQUIREMENT", "The AI must never threaten, insult, harass, publicly embarrass, or invent penalties/consequences. All wording comes from business-approved templates or policy-gated LLM generation with safety review.");
  tagBox(doc, "RECOMMENDATION", "Keep the marketing promise narrow for year one: debt tracking + respectful automation. Defer ‘predictive finance’ claims until data moat exists.");
});

chapter(3, "Problem Definition", "From notebooks and screenshots to missed follow-ups and poor cash-flow visibility", (doc)=>{
  para(doc, "Target businesses manage debts informally: notebooks, Excel, WhatsApp messages, paper invoices, bank screenshots, mental math, and ad-hoc calls. This creates systemic failure modes across the Cash → Conversation → Collection chain.");
  table(doc, ["Current behavior","Failure mode","Business impact"], [
    ["Notebook/Excel","Forgotten debts, duplicate records","Revenue leakage, disputes"],
    ["WhatsApp threads","No central history, staff-dependent memory","No accountability, knowledge loss on turnover"],
    ["Manual calls","Inconsistent tone, wasted hours","Staff burnout, unprofessional impression"],
    ["Screenshots for proof","Difficult reconciliation","Payment disputes, trust erosion"],
    ["Memory-based promises","Missed follow-ups","Cash-flow unpredictability"],
  ], [140,170,185]);
  heading2(doc, "Root causes");
  bullets(doc, [
    "No single source of truth for Customer → Invoice → Payment.",
    "No policy engine for when/how to remind — every reminder is a judgment call.",
    "No structured promise-to-pay — commitments live in chat history.",
    "No closed loop between payment verification and reminder cancellation → customers reminded after paying.",
    "No tenant-isolated audit trail — who changed what, when, why is untraceable."
  ]);
  heading2(doc, "Opportunity");
  para(doc, "Centralization + automation + respectful AI turns a daily chore into a system: balances are authoritative, reminders are policy-driven, conversations are recorded, receipts are automatic, and analytics answer ‘who owes what, when, and what to do next’ in one glance.");
  tagBox(doc, "FACT", "SMB cash-flow visibility is low when receivables are unmanaged; late payments are a leading cause of working-capital stress for SMEs (World Bank SME finance literature).");
  tagBox(doc, "ASSUMPTION", "Businesses that self-report ‘we use WhatsApp to chase payments’ are reachable and willing to trial a dedicated collections workspace — to be validated in Phase 0.");
});

chapter(4, "Market Validation Strategy", "Interview 20+ businesses before locking price or policy defaults", (doc)=>{
  para(doc, "Phase 0 is discovery, not coding. The goal is to recruit pilot customers, measure current state, and kill attractive fictions before they become hard-coded flows.");
  heading2(doc, "Validation plan (3–4 weeks)");
  bullets(doc, [
    "Recruit 20–30 businesses across 5 verticals: private schools, pharmacies/clinics, trade/retail, agencies/freelancers, cooperatives/lending-adjacent (non-regulated). Include Lagos + one secondary city (Ibadan/Abeokuta) to test network/market variance.",
    "Interview guide (45 min): Show current tracking (photo of notebook/sheet), walk through last 5 collections, count outstanding, days-to-pay, channel used, time spent, tools tried, willingness to pay (Van Westendorp).",
    "Artifact per interview: one-page canvas — org size, monthly receivables, % overdue >7/30 days, primary channel, biggest pain, price sensitivity, pilot interest (yes/maybe/no).",
    "Success gate: ≥12 ‘pilot-ready’ orgs (active receivables, WhatsApp-reachable customers, willing to import 20+ customers/invoices). Otherwise narrow ICP or reposition."
  ]);
  table(doc, ["Signal","How measured","Kill/Proceed threshold"], [
    ["Problem intensity","Hours/week on follow-ups, % overdue","≥6 hrs/week or ≥20% overdue"],
    ["Channel fit","% customers reachable on WhatsApp/SMS","≥60% reachable"],
    ["Willingness to pay","Van Westendorp + ‘pay today’ test","≥40% say ≥₦5k/mo"],
    ["Data readiness","Can provide customer/invoice list","≥70% can provide within 48h"],
  ], [150,170,175]);
  heading2(doc, "Pilot design");
  bullets(doc, [
    "10 pilot orgs, 4 weeks, white-glove import, weekly check-in, Slack/WhatsApp group. Track: days-to-payment, reminder response rate, promise-to-pay fulfillment, staff time saved, NPS, ‘would pay’ question.",
    "Pricing hypothesis tested in pilot: Free→Starter→Business→Professional ladder, with AI minutes/messages metered separately. Do not lock annual discount until churn data exists."
  ]);
  tagBox(doc, "REQUIREMENT", "No AI voice launch before pilot proves WhatsApp+SMS+Email baseline lifts collections. Voice is Phase 4, not Phase 1.");
  noteCard(doc, "Anti-pattern", "Do not build for ‘all businesses’. Anchor on one wedge vertical first — schools (recurring fees, parent contact, term cycles) are the sharpest pilot fit for Nigeria.");
});

chapter(5, "Target Customers", "Start narrow — schools, clinics, traders — then expand to branches and enterprise", (doc)=>{
  para(doc, "Initial customer profile (ICP) — Nigeria SMB that invoices repeatedly, has 30–1,000 active customers, collects via bank transfer or Paystack/Flutterwave, and already uses WhatsApp for follow-ups. Secondary profile: multi-branch SMEs needing role separation and audit.");
  table(doc, ["Segment","Example","Receivables pattern","Why CollectNaija fits"], [
    ["Schools","Private nursery/primary","Term fees, per-student arrears","Recurring, parent contact, promise-to-pay"],
    ["Clinics/Pharmacies","Health SMEs","Post-service billing","High dispute sensitivity → respectful AI"],
    ["Trade/Retail","Distributors","Credit sales","Volume, WhatsApp-first, receipt need"],
    ["Services","Agencies, tutors","Milestone invoices","Professional tone, payment links"],
    ["Branches","Multi-site SMB","Consolidated + branch view","RBAC, branch isolation, analytics"],
  ], [95,105,135,160]);
  heading2(doc, "Non-targets (for now)");
  bullets(doc, [
    "Regulated lending/loan-recovery needing licensed collection practices — out of scope and high risk.",
    "Enterprises needing on-prem or deep ERP integration before product maturity — serve via API in Phase 5, not Phase 1.",
    "Businesses with <10 invoices/month and no follow-up pain — acquisition cost exceeds value."
  ]);
  tagBox(doc, "ASSUMPTION", "Education vertical will have the shortest sales cycle due to term-driven urgency. Validate against traders who may have higher volume but lower willingness to formalize.");
  tagBox(doc, "FACT", "Nigeria’s SME sector is large but fragmented; trust and referrals outperform cold outreach. Pilot referrals are the primary acquisition lever in month 1–6.");
});

chapter(6, "Personas", "Owner, Staff, Customer — plus AI as a fourth actor with constrained agency", (doc)=>{
  heading2(doc, "Primary personas");
  table(doc, ["Persona","Goals","Pains","Success metric"], [
    ["Mama Emeka — Shop Owner","Know who owes, get paid faster","Notebook chaos, forgets to call","Days-to-payment ↓, no duplicate reminders"],
    ["Mr. Ahmed — School Admin","Term fees collected, parent trust kept","Manual calls, disputes after payment","Collection rate ↑, complaints ↓"],
    ["Tolu — Collections Staff","Clear list, script, handoff","No history, tone inconsistency","Touches per collection ↓, escalation clarity"],
    ["Customer — Parent/Buyer","Clear invoice, easy to pay","Confusing reminders, repeat asks after paying","One reminder → pay → receipt, no spam"],
  ], [130,150,150,65]);
  heading2(doc, "AI as actor");
  bullets(doc, [
    "AI Collections Agent: monitors due dates, drafts reminders from approved templates + context, handles simple objections, records promises, escalates uncertainty. Never decides balance, status, or confirmation — queries backend.",
    "Voice Agent: identifies business, discloses automation properly, verifies identity before discussing sensitive amounts, records outcome, respects quiet hours and opt-outs.",
    "Policy Owner: Business owner defines reminder policy, tone, channels, limits, escalation. AI obeys policy + customer preference — never bypasses either."
  ]);
  tagBox(doc, "REQUIREMENT", "Map each persona to RBAC roles (Owner, Admin, Staff, Read-only) with tenant-isolated data. Customer is not a platform user in v1 — they interact via payment link + comms channel without platform login.");
  noteCard(doc, "Empathy guardrail", "The person receiving a reminder is a customer, not an enemy. Every prompt, template, and voice script is reviewed for respect and clarity at a Primary-3 reading level where possible.");
});

chapter(7, "User Journeys", "End-to-end: Create → Remind → Respond → Pay → Verify → Receipt → Insight", (doc)=>{
  heading2(doc, "Journey A — Business creates invoice and gets paid");
  flowBox(doc, ["Create Customer","Add Invoice + Items","Invoice Sent","Reminder (policy)","Customer Pays","Webhook Verify","Receipt + Cancel Reminders","Dashboard Updated"]);
  bullets(doc, [
    "Entry: Owner imports customers (CSV) or adds manually → creates invoice with items, discount, tax → total/balance calculated on backend.",
    "Automation: Scheduler enqueues reminders per policy (e.g., 7d/2d before, due date, 2/7/14d after). Channel engine picks WhatsApp/SMS/Email per preference + history.",
    "Payment: Customer pays via link/transfer → provider webhook → idempotency → balance updated → pending reminders cancelled → receipt sent → AI notified.",
    "Edge: If customer responded ‘already paid’ before webhook, conversation is marked ‘awaiting verification’ and auto-resolves on webhook match or escalates after grace window."
  ]);
  heading2(doc, "Journey B — Customer responds to AI reminder");
  bullets(doc, [
    "AI sends polite, context-rich reminder (name, amount, due date, link, how to reach business). Customer replies in natural language.",
    "NLU classifies: Promise-to-Pay (‘next week’), Already-Paid, Can't-Pay-Full, Stop-Contact, Confused, Wants-Human.",
    "AI handles with tools: records promise with date, requests reference if ‘already paid’, explains invoice from verified data, offers approved payment plan only if policy allows, pauses collection on opt-out, escalates on dispute/fraud/distress.",
    "Every turn is logged as AIMessage + CommunicationEvent; promise creates PromiseToPay; escalation creates SupportTicket + notifies staff."
  ]);
  heading2(doc, "Journey C — Staff handoff");
  bullets(doc, [
    "Trigger: dispute, repeated non-verifiable ‘already paid’, harassment/fraud flag, low confidence, or business escalation rule.",
    "System: creates ticket with full transcript, invoice snapshot, payment history, promised date, and suggested next step. Staff claims ticket, resolves, and policy engine pauses/resumes collection accordingly.",
    "Outcome: Customer experiences one continuous thread — human sees AI context, not a cold restart."
  ]);
  tagBox(doc, "REQUIREMENT", "E2E journey must pass automated test weekly (section 39): business creates invoice → reminder → customer reply → promise → payment webhook → idempotency → cancellation → receipt → dashboard reflects truth.");
});

chapter(8, "Product Requirements", "Functional and non-functional requirements — the build contract", (doc)=>{
  heading2(doc, "Functional — Core SaaS");
  bullets(doc, [
    "FR-01 Auth & org: signup, login, JWT, email verification, password reset, org creation, org switch, profile, last-login display, session management.",
    "FR-02 Customers: CRUD, search/filter/sort, outstanding/overdue aggregates, communication preferences, opt-out, CSV import, duplicate detection.",
    "FR-03 Invoices: create with items (qty, price), discount/tax, backend-computed totals, status (draft/sent/partial/paid/overdue/cancelled), due dates, customer scoping, audit log.",
    "FR-04 Payments: record (manual + provider), status (pending/successful/failed/refunded), idempotency key, receipt generation, balance propagation.",
    "FR-05 Reminders: template variables {{customer_name}}, {{amount}}, {{due_date}}, {{payment_link}}, {{business_name}}, {{invoice_number}}, channel/content preview, scheduled/sent/failed/cancelled states.",
    "FR-06 Collection Policy & Campaigns: per-org policy (frequency, channels, quiet hours, max attempts, grace, escalation, payment-plan rules) + per-cohort campaigns (e.g., School Fees).",
    "FR-07 AI Conversations: sessions, messages, actions, promise-to-pay, escalation, channel selection, safety layer, tenant-isolated tool calls.",
    "FR-08 Voice Calls: call attempts, duration, outcome, transcription, recording policy (metadata vs content separation), consent handling, retry with backoff.",
    "FR-09 Dashboards & Analytics: KPIs (outstanding, due today, overdue, collected this month), Needs Attention, cash-flow chart, AI activity timeline, insights (data-driven, never fabricated).",
    "FR-10 Admin & Compliance: RBAC, audit log, webhook logs, data retention controls, deletion/export (privacy)."
  ]);
  heading2(doc, "Non-functional");
  table(doc, ["NFR","Target","Rationale"], [
    ["Availability","99.5% monthly (Phase 1)","SMB collections cannot afford downtime at term end"],
    ["Latency p95","API <400ms, AI turn <2.5s","Respectful turn-taking on WhatsApp/voice"],
    ["Data isolation","Zero cross-tenant read","Security acceptance gate"],
    ["Mobile perf","LCP <2.5s on 3G, bundle <200kb gz","Low-end Android, 3G reality"],
    ["Cost guard","AI cost per org tracked & quota’d","Protect SaaS margins"],
    ["Observability","AI/tool/comm/payment tracing","Debug revenue-critical flow"],
  ], [110,120,265]);
  tagBox(doc, "REQUIREMENT", "Every financial write (invoice total, payment status, balance) is backend-computed using Decimal (not float) with explicit rounding rules. Frontend math is preview-only.");
});

chapter(9, "MVP Scope", "What ships on Day 1 vs what waits — ruthless sequencing", (doc)=>{
  para(doc, "MVP is ‘trustworthy debt tracking + respectful automation’ without voice. AI text assistant ships as controlled state machine with human escalation, but voice waits until text baseline is validated.");
  table(doc, ["In","Out (Phase 2/3/4)"], [
    ["Auth, orgs, RBAC, customers, invoices, payments, receipts","Voice AI calls (Phase 4)"],
    ["Reminders: WhatsApp + SMS + Email (provider abstraction)","Advanced call analytics & STT/TTS at scale"],
    ["Policy engine: quiet hours, max attempts, channel prefs","Full campaign optimizer & prediction"],
    ["AI text agent: reminder + simple conversation + promise + escalation","Multi-language NLU (Pidgin/Hausa/Yoruba/Igbo) — EN first"],
    ["Payment verification: webhook + idempotency + auto-cancel","Complex payment plans (installments with interest)"],
    ["Dashboard, reports, audit log, basic insights","Flutter mobile (Phase 6)"],
  ], [250,245]);
  heading2(doc, "MVP acceptance checklist (ship blocker)");
  bullets(doc, [
    "Org can onboard in <5 min, import 20 customers, create 5 invoices, collect one payment end-to-end (manual + provider).",
    "Reminder respects quiet hours and max attempts; paid invoice cancels pending reminders within seconds of verified webhook.",
    "AI retrieves balance from backend, never invents amount, records promise-to-pay, escalates ‘already paid’ without proof, respects ‘stop contacting me’.",
    "Tenant isolation test suite green; audit log captures who changed what; receipts downloadable.",
    "P95 API <400ms in staging with seed of 10k invoices; offline banner and retry for poor network."
  ]);
  tagBox(doc, "RECOMMENDATION", "Cut pixel-perfect marketing site before you cut the webhook idempotency test. Revenue correctness beats polish in v1.");
});

chapter(10, "AI Collections Agent", "Professional, respectful, business-aware — the agent’s charter and toolbelt", (doc)=>{
  para(doc, "The AI Collections Agent is a policy-gated, tool-constrained service that turns outstanding invoices into respectful conversations. It is not a free chatbot — it is a state machine that queries the backend for truth and acts only through audited tools.");
  heading2(doc, "Capabilities (and explicit non-capabilities)");
  bullets(doc, [
    "Can: monitor due dates, schedule reminders, send templated messages, answer invoice/balance questions from verified data, record promises, provide payment instructions/links, handle simple objections, escalate.",
    "Cannot: change invoice amounts, confirm payment without verification, waive fees without authorization, invent penalties or deadlines, reveal another tenant’s data, contact beyond policy limits, pretend to be human where disclosure is required."
  ]);
  heading2(doc, "Personality contract");
  codeBlock(doc, [
    "You are the payment assistant for {business_name}. Tone: Professional, Calm, Respectful, Concise, Empathetic.",
    "Always: identify the business, state the invoice/amount/due date from verified data, offer a payment link and a human path.",
    "Never: threaten, insult, harass, invent consequences, or argue with ‘I already paid.’ Acknowledge, request reference, mark for verification, pause further nudges.",
    "If you do not know, say so and escalate. If distress/fraud/legal cue, escalate immediately."
  ]);
  heading2(doc, "Toolbelt (all audited, rate-limited, tenant-scoped)");
  table(doc, ["Tool","Purpose","Side effect"], [
    ["get_customer / get_invoice / get_outstanding_balance","Verified read","None — read-only"],
    ["get_payment_history / get_payment_link","Explain & pay","None"],
    ["get_collection_policy / get_customer_preferences","Policy gate","None"],
    ["record_customer_response / record_promise_to_pay","Capture intent","Creates PromiseToPay + follow-up"],
    ["schedule_follow_up / send_payment_link","Next step","Enqueues CommunicationEvent"],
    ["create_support_ticket / escalate_to_human","Handoff","Creates ticket, pauses AI turn"],
    ["pause_collection / resume_collection","Consent","Updates policy state"],
  ], [180,180,135]);
  tagBox(doc, "REQUIREMENT", "Every tool call is authenticated (org+user/agent), authorized (RBAC + tenant check), validated (input/output schema), logged (AuditLog + AIAgentAction), and rate-limited. High-impact writes (promise, pause, escalation) require backend deterministic validation.");
});

chapter(11, "AI Conversation Architecture", "State machine, memory, NLU, and generation with grounding", (doc)=>{
  para(doc, "Conversation is a controlled state machine, not an open chat. States are persisted, transitions are validated, and context is bounded.");
  flowBox(doc, ["INVOICE_CREATED","UPCOMING_PAYMENT","DUE_SOON","DUE_TODAY","OVERDUE","REMINDER_SENT","RESPONDED","CONVERSATION","PROMISE_TO_PAY","PAYMENT_PENDING","PAYMENT_CONFIRMED"]);
  para(doc, "Alternative states: DISPUTED, HUMAN_ESCALATION, CUSTOMER_REQUESTED_STOP, INVALID_CONTACT, PAYMENT_PLAN, FAILED_COMMUNICATION, COLLECTION_PAUSED, COLLECTION_COMPLETED. Each has allowed transitions — e.g., CUSTOMER_REQUESTED_STOP cannot go to REMINDER_SENT without explicit resume_collection after consent.");
  heading2(doc, "Memory — bounded and governed");
  bullets(doc, [
    "Retained: customer identity, invoice snapshot, outstanding, due date, payment records, last 90 days of collection interactions, preferences, promised date, approved arrangements, ticket refs.",
    "Not retained: full chat beyond retention window, biometric voice prints, unauthenticated personal data, other tenants’ data (never in context).",
    "Retention: conversation content 12 months (configurable per org, lower where regulation demands) then soft-delete + hard-delete per schedule; metadata (who/when/channel/outcome) retained longer for audit. Deletion is org-triggered and honoured within 30 days.",
    "Access: AI sees only the current org/customer/invoice slice via tools; humans see via RBAC + audit; no cross-tenant retrieval."
  ]);
  heading2(doc, "NLU → Policy → Generation pipeline");
  codeBlock(doc, [
    "Inbound message → normalize → classify intent (Promise/AlreadyPaid/CannotPayFull/Stop/Confused/WantsHuman/Other) →",
    "fetch verified context via tools → policy gate (quiet hours, max attempts, tone, channel) →",
    "generate grounding-blocked response (must cite tool outputs, no invention) → safety layer (threat/harassment/finance-hallucination scan) →",
    "act via tool(s) or send message → log AIMessage + AIAgentAction → schedule next check"
  ]);
  heading2(doc, "Grounding rule");
  para(doc, "The model may not output any amount, date, or status that did not come from a tool. A post-generation validator regex-matches currency/dates and cross-checks against the last tool payload; mismatch triggers a safe fallback (‘Let me confirm that with the business’) and an incident log.");
  tagBox(doc, "FACT", "State machines reduce hallucination and cost versus open-ended chat by constraining turns and tool order — essential for finance-adjacent AI.");
});

chapter(12, "AI Voice Architecture", "Approved calls, verification, STT → LLM → TTS, with strict retention separation", (doc)=>{
  flowBox(doc, ["Scheduler","Voice Service","STT","Conversation Engine","Policy/Safety","TTS","Customer","Logging"]);
  heading2(doc, "Call choreography (every call)");
  bullets(doc, [
    "1) Scheduler checks policy: allowed hours, max call attempts, quiet hours, opt-out, cooldown since last contact. If blocked, do not dial.",
    "2) Dial via provider abstraction (e.g., Twilio/ Africa’s Talking–compatible). On answer: identify business, disclose automation as required, ask ‘Am I speaking with <name>?’ — do not discuss amounts until identity is affirmed.",
    "3) If affirmed: state purpose, summarize invoice (amount/due date from tool), ask if now is a good time, listen (STT), handle intents as in text (promise/already-paid/escalate).",
    "4) Record promise date, provide payment instructions, offer human transfer on request, end politely with summary SMS/WhatsApp.",
    "5) If not affirmed, wrong person, or distress/fraud cue: end without sensitive disclosure, log INVALID_CONTACT or escalation."
  ]);
  heading2(doc, "Data handling");
  table(doc, ["Data class","Content","Retention / access"], [
    ["Call metadata","status, duration, outcome, retry, consent flag","Retained 24 months, RBAC-visible"],
    ["Recording/transcription","audio + text","Separate store, encrypted at rest, opt-in per org, 90-day default then delete, downloadable only by Owner/Admin with audit"],
    ["Analytics","promise captured, escalation, call success","Aggregated, no PII sharing across tenants"],
  ], [130,200,165]);
  tagBox(doc, "REQUIREMENT", "Voice must not discuss balances with unverified persons. Verification is a gate, not a suggestion. Every dial, attempt, and outcome is a CommunicationEvent + VoiceCall + CallAttempt row for audit.");
  noteCard(doc, "Nigeria reality", "Voice is powerful for low-literacy or inbox-fatigued customers, but also sensitive. Default to WhatsApp/SMS first in v1; enable voice per customer only after text response pattern or explicit consent, and always respect time-of-day norms (e.g., 9am–7pm WAT configurable).");
});

chapter(13, "Communication Architecture", "Gateway + channel abstraction + delivery lifecycle", (doc)=>{
  flowBox(doc, ["Collection Orchestrator","Comm Gateway","WhatsApp Provider","SMS Provider","Email Provider","Voice Provider","Future Channel"]);
  para(doc, "All outbound comm goes through a Communication Gateway that enforces policy, tenant isolation, templating, and lifecycle tracking. Channels are providers behind a common interface so WhatsApp (Meta Cloud API), SMS (Termii/Africa’s Talking), Email (SES/SendGrid), and Voice (Twilio) can be swapped per org or per region without rewriting orchestration.");
  heading2(doc, "Message lifecycle");
  codeBlock(doc, [
    "REQUESTED → POLICY_GATED → QUEUED → SENDING → SENT / FAILED → DELIVERED? → RESPONDED? → BOUNCED? → RETRY? → CANCELLED (if paid/opt-out)",
    "Every transition is a CommunicationEvent with provider message_id, timestamps, error codes, and cost.",
    "Idempotency key = org_id + invoice_id + campaign_step + channel + scheduled_for (prevents duplicates on retries)."
  ]);
  heading2(doc, "Template system");
  bullets(doc, [
    "Variables: {{customer_name}}, {{business_name}}, {{invoice_number}}, {{amount}}, {{balance}}, {{due_date}}, {{payment_link}}, {{support_phone}}. All rendered server-side with escaping; amounts formatted with Intl.NumberFormat and currency config.",
    "Tone presets (configurable): Formal, Friendly, Concise — mapped to template variants and LLM style hints, but policy still caps contacts.",
    "Language: template per locale; LLM generation is locale-aware but must still pass safety and grounding checks."
  ]);
  heading2(doc, "Delivery intelligence");
  bullets(doc, [
    "Gateway tracks per-channel delivery/read/reply rates per org/customer and suggests (but does not enforce) the best channel — final choice is always policy + customer preference.",
    "Fallback: if WhatsApp not delivered in N minutes, optionally retry via SMS if policy allows — never both simultaneously without explicit campaign step."
  ]);
  tagBox(doc, "REQUIREMENT", "No direct provider call bypasses the gateway. All sends are queued via Celery with retry/backoff and respect the policy engine pre-send check. Failed sends surface to the owner with actionable reason, not raw provider codes.");
});

chapter(14, "Collection Automation", "Policy-driven scheduler that makes follow-up systematic", (doc)=>{
  para(doc, "Automation is a deterministic scheduler (Celery Beat) + policy engine + campaign definitions. The AI generates wording, but the scheduler decides when and whether a message is allowed to go.");
  heading2(doc, "CollectionPolicy (per-organization) fields");
  table(doc, ["Field","Type","Default (example)"], [
    ["reminder_intervals","list of offsets","-7d, -2d, 0, +2d, +7d, +14d"],
    ["channels_per_step","map step→channels","WhatsApp primary, SMS fallback"],
    ["quiet_hours","time range + timezone","20:00–08:00 WAT, plus holidays"],
    ["max_contacts_per_day/week","int","1/day, 3/week"],
    ["min_interval_between_contacts","duration","24h"],
    ["max_whatsapp/sms/calls","int","5 / 3 / 2 per campaign"],
    ["grace_period","duration","48h after promise before next nudge"],
    ["escalation_rules","predicates","dispute, already-paid-no-proof, distress"],
    ["payment_plan_rules","bool + terms","allow_partial = false by default"],
    ["tone / language","enum","Friendly, en-NG"],
  ], [140,140,215]);
  heading2(doc, "CollectionCampaign (per cohort)");
  para(doc, "Example — School Fees Campaign: target = invoices where customer_type=student and due_date in term window. Steps: -7d WhatsApp, -2d WhatsApp, 0d WhatsApp+SMS, +3d WhatsApp, +7d AI call, +14d human review. Each org can clone and customize; steps are provider-agnostic and time-zone aware.");
  heading2(doc, "Scheduler loop (simplified)");
  codeBlock(doc, [
    "@shared_task",
    "def enqueue_due_reminders():",
    "  for invoice in invoices_due_for_step(now()):",
    "    policy = invoice.org.policy; prefs = invoice.customer.prefs",
    "    if not policy_engine.allowed(invoice, policy, prefs, now()): continue",
    "    with transaction.atomic():",
    "      event = CommunicationEvent.create(..., idempotency_key=..., status='QUEUED')",
    "      send_via_gateway.delay(event.id)"
  ]);
  tagBox(doc, "REQUIREMENT", "Policy engine executes before every outbound communication, including AI turns and voice dials. No path bypasses it. Policy changes apply to future enqueues only — already-QUEUED events keep their original policy snapshot for audit.");
});

chapter(15, "Payment Architecture", "Provider abstraction, webhook verification, idempotency, closed-loop cancellation", (doc)=>{
  flowBox(doc, ["Customer Pays","Payment Provider","Webhook","Backend Verify","Idempotency","Record Payment","Update Invoice","Cancel Reminders","Receipt","Notify AI/Dashboard"]);
  heading2(doc, "Principles");
  bullets(doc, [
    "Never trust frontend confirmation. Provider webhook + server-to-server verification is the only source of truth.",
    "Idempotency key = provider + provider_reference + amount + currency. Duplicate webhooks (retries) create exactly one Payment row and one balance mutation.",
    "Balance math uses Decimal with ROUND_HALF_UP per currency config (NGN has 0–2 decimals; store minor units to avoid float). Invoice totals, balances, and receipts are backend-computed.",
    "Partial payments allowed; overpayments create credit or are flagged per org setting; refunds are explicit and reverse balances with audit."
  ]);
  heading2(doc, "Abstraction layer");
  table(doc, ["Interface","Paystack example","Future provider"], [
    ["create_payment_link(amount, currency, reference)","initialize transaction","Flutterwave / Stripe adapter"],
    ["verify_webhook(signature, payload)","HMAC check + retrieve transaction","Same"],
    ["map_status(provider_status)","success/failed/pending","Same"],
    ["refund(payment, reason)","refund API","Same"],
  ], [150,170,175]);
  heading2(doc, "Webhook handler sketch");
  codeBlock(doc, [
    "POST /api/v1/webhooks/payments/{provider}  (no auth, HMAC verified, rate-limited, idempotent)",
    "1) verify signature 2) parse event 3) fetch raw event -> WebhookEvent row (store before processing)",
    "4) SELECT FOR UPDATE on idempotency_key 5) if exists, return 200 (ack) 6) else create Payment",
    "7) update Invoice.balance inside transaction 8) emit: cancel pending reminders, send receipt, notify AI, update analytics",
    "Always return 200 after durable store — never 500-retry a successfully stored event."
  ]);
  tagBox(doc, "REQUIREMENT", "Payment confirmation via webhook must cancel pending reminders/calls within seconds and reflect in dashboard without manual refresh (poll or realtime). Customer must never receive a debt reminder after verified payment.");
  noteCard(doc, "Reconciliation edge", "Bank-transfer payments without provider link require manual ‘Mark as received’ with reference + proof upload, then a second-person approval if amount > threshold (configurable). Avoids social-engineering via fake screenshots.");
});

chapter(16, "Database Architecture", "Django, PostgreSQL, Redis — normalized core, auditable, soft-deletable, tenant-aware", (doc)=>{
  para(doc, "Core tables are normalized; financial tables are append-friendly and audited. Soft deletion keeps history; hard deletion is a scheduled job after retention. Every tenant-scoped table has org_id and is filtered via Row-Level Security or manager scoping — never by frontend filter alone.");
  table(doc, ["Group","Tables","Key constraints"], [
    ["Tenancy & Identity","Organization, User, Membership, Role","org slug unique, email unique, membership (org,user) unique"],
    ["Business core","Customer, Invoice, InvoiceItem, Payment, PaymentMethod","invoice_number unique per org, Decimal amounts, FKs with RESTRICT"],
    ["Collections","Reminder, CollectionCampaign, CollectionPolicy, CommunicationPreference, CommunicationEvent, Notification","policy one-to-one org, event idempotency unique"],
    ["AI","AIConversation, AIMessage, AIAgentSession, AIAgentAction, PromiseToPay, PaymentPlan","conversation per customer/invoice, action audited"],
    ["Voice","VoiceCall, CallAttempt","attempt per call, outcome enum, consent flag"],
    ["Ops","SupportTicket, Escalation, AuditLog, WebhookEvent, Subscription","immutable audit, webhook payload retained"],
  ], [120,230,145]);
  heading2(doc, "Cross-cutting concerns");
  bullets(doc, [
    "Soft delete: deleted_at timestamp + manager that excludes by default; unique indexes are partial (WHERE deleted_at IS NULL) to allow natural keys to be reused after deletion.",
    "AuditLog: actor_id, action, target_type/id, before/after JSON, ip, user_agent, created_at — never updated, only inserted.",
    "Indexes: (org_id, status, due_date) on Invoice; (org_id, customer_id, created_at) on Payment; (org_id, status, scheduled_for) on CommunicationEvent; GIN on Customer search (name, phone, email).",
    "Data retention: messages/recordings/transcripts have org-configurable TTL; metadata retained longer; deletion jobs logged.",
    "Migrations: Django migrations with explicit SQL for partial indexes and check constraints (amount >=0, due_date not null when sent)."
  ]);
  tagBox(doc, "FACT", "PostgreSQL + Django ORM is proven for multi-tenant SaaS with strong consistency needs. Soft-delete + partial unique indexes + RLS/manager scoping is a standard isolation pattern.");
});

chapter(17, "Entity-Relationship Diagram (ERD)", "Complete map — relationships, keys, and tenant spine", (doc)=>{
  para(doc, "Tenant spine: Organization is the root for all business data. Every Customer, Invoice, Payment, Reminder, Policy, Conversation, Call, Ticket, and WebhookEvent belongs to one org. Users belong to orgs via Membership with a Role. This spine is enforced at DB and service layers.");
  codeBlock(doc, [
    "Organization 1──* User (via Membership)    Organization 1──* Customer",
    "Organization 1──* Invoice                 Customer 1──* Invoice",
    "Invoice 1──* InvoiceItem                 Invoice 1──* Payment (via invoice_id)  Payment *──1 Invoice",
    "Invoice 1──* Reminder                    Invoice 1──* CommunicationEvent",
    "Organization 1──1 CollectionPolicy       Organization 1──* CollectionCampaign",
    "Customer 1──1 CommunicationPreference    Customer 1──* AIConversation",
    "AIConversation 1──* AIMessage            AIConversation 1──* AIAgentAction",
    "AIConversation 1──* PromiseToPay (0..1 active)   AIConversation 1──* PaymentPlan (optional)",
    "AIConversation 1──* VoiceCall            VoiceCall 1──* CallAttempt",
    "Organization 1──* SupportTicket / Escalation      Everything *──* AuditLog (polymorphic)",
    "WebhookEvent *──1 Organization (nullable until verified)   Subscription 1──1 Organization"
  ]);
  heading2(doc, "Representative DDL excerpts (illustrative)");
  codeBlock(doc, [
    "organizations (id PK, slug UNIQUE, name, country, currency, timezone, created_at, deleted_at)",
    "users (id PK, email UNIQUE, name, password_hash, created_at)",
    "memberships (id PK, org_id FK→organizations RESTRICT, user_id FK→users CASCADE, role ENUM, UNIQUE(org_id,user_id))",
    "customers (id PK, org_id FK, customer_code UNIQUE PER ORG WHERE deleted_at IS NULL, name, phone, email, outstanding DECIMAL, overdue DECIMAL, prefs JSONB)",
    "invoices (id PK, org_id FK, customer_id FK, invoice_number UNIQUE PER ORG WHERE deleted_at IS NULL, status ENUM, due_date, subtotal, discount, tax, total, balance DECIMAL, sent_at)",
    "payments (id PK, org_id FK, invoice_id FK, amount DECIMAL, currency CHAR3, status ENUM, provider, provider_ref UNIQUE, idempotency_key UNIQUE, verified_at)",
    "communication_events (id PK, org_id FK, invoice_id FK, customer_id FK, channel ENUM, template_id, status ENUM, provider_msg_id, idempotency_key UNIQUE, scheduled_for, sent_at, cost_minor)",
    "ai_conversations (id PK, org_id FK, customer_id FK, invoice_id FK, state ENUM, channel, started_at, ended_at, escalated_at)",
    "promise_to_pay (id PK, org_id FK, conversation_id FK, amount DECIMAL, promised_date DATE, status ENUM, fulfilled_at)"
  ]);
  heading2(doc, "ERD visual (schematic)");
  para(doc, "Below is a simplified block view. In production, generate a full ERD from pgAdmin / Django schema with `django-extensions graph_models` and keep it in /docs/erd.pdf versioned with migrations.");
  // draw schematic boxes
  const W = doc.page.width - 100;
  const cols = 3, rows = 3;
  const bw = (W - 20)/cols, bh = 36;
  const entities = ["Organization","User / Membership","Customer","Invoice + Items","Payment","CollectionPolicy/Campaign","CommunicationEvent","AIConversation + Messages + Actions","VoiceCall + Attempts"];
  let ex = 50, ey = doc.y;
  if(ey + bh*rows + 20 > 810) addPage();
  const y0 = doc.y;
  entities.forEach((e,i)=>{
    const col = i % cols, row = Math.floor(i/cols);
    const x = 50 + col*(bw+10), y = y0 + row*(bh+10);
    doc.save();
    doc.roundedRect(x, y, bw, bh, 6).fillAndStroke(i===0 ? BRAND_LIGHT : "white", "#E2E8F0");
    doc.fillColor(SLATE900).font("Helvetica-Bold").fontSize(7).text(e, x+6, y+10, { width: bw-12, align:"center" });
    doc.fillColor(SLATE600).font("Helvetica").fontSize(6).text(i===0 ? "Tenant root" : "FK: org_id", x+6, y+22, { width: bw-12, align:"center" });
    doc.restore();
  });
  doc.y = y0 + bh*rows + 16;
  bullets(doc, [
    "All FKs are DEFERRABLE with RESTRICT on tenant root to prevent accidental cascade deletes; soft delete preserves history.",
    "Check constraints: amount >= 0, balance >= 0, total = subtotal - discount + tax (validated in model clean + DB check).",
    "GIN trigram indexes on customer name/phone for fast WhatsApp-era search; BRIN on created_at for time-series dashboards."
  ]);
});

chapter(18, "Multi-Tenant Architecture", "Isolation at DB, service, and API — never by frontend", (doc)=>{
  para(doc, "Every request is tenant-scoped before any business logic. The org is resolved from JWT (user’s active org) or API key, then enforced via manager scoping and, where needed, PostgreSQL Row-Level Security (RLS). Cross-tenant reads fail closed with 404 (not 403) to avoid enumeration.");
  heading2(doc, "Layers");
  table(doc, ["Layer","Mechanism","Guarantee"], [
    ["Auth","JWT contains org_id + role, short-lived access + refresh","No org switch without re-auth"],
    ["Middleware","CurrentOrg middleware sets request.org, thread-local for Celery","All downstream code reads request.org"],
    ["ORM","TenantManager: .for_org(org) → filter(org_id=org.id)","Querysets without org raise"],
    ["DB","RLS policies: USING (org_id = current_setting('app.org_id'))","Even raw SQL respects tenant"],
    ["Storage","Object keys prefixed by org_id/","No object cross-read"],
    ["Cache","Keys namespaced org:{id}:...","No cross-cache leak"],
    ["Logs","All log lines include org_id, user_id","Forensic trace"],
  ], [95,230,170]);
  heading2(doc, "Testing isolation (mandatory)");
  codeBlock(doc, [
    "def test_cross_tenant_invoice_access_denied(client):",
    "  orgA, orgB = create_orgs(2)",
    "  inv = create_invoice(orgA)",
    "  tokenB = login(orgB.owner)",
    "  assert client.get(f'/api/v1/invoices/{inv.id}', headers=tokenB).status_code == 404"
  ]);
  heading2(doc, "Branch model");
  bullets(doc, [
    "Branches are not tenants — they are sub-scopes within an org (branch_id nullable on customer/invoice). RLS remains org-level; branch filtering is service-level. Enterprise orgs can enforce branch RBAC (staff sees only branch invoices).",
    "Demo workspace is a real org flagged is_demo=true with isolated seed data and a visible badge — never mixed with production analytics."
  ]);
  tagBox(doc, "REQUIREMENT", "Every query on a tenant table must include org_id. Code review and static analysis (custom lint) flag raw .objects.filter without .for_org. Tenant-isolation tests run in CI with seeded dual-org fixtures.");
});

chapter(19, "Backend Architecture", "Django + DRF, 12-factor, API-first, job-queue aware", (doc)=>{
  flowBox(doc, ["NGINX/CDN","Django + DRF","PostgreSQL","Redis","Celery Workers","Celery Beat","Object Storage","AI/Comm/Payment Providers"]);
  heading2(doc, "Service layout");
  table(doc, ["Service","Responsibility","Scaling cue"], [
    ["api (Django)","Auth, CRUD, policy, webhooks, comm gateway, AI orchestrator","CPU + p95 latency"],
    ["worker (Celery)","Sends, retries, STT/TTS, report jobs","Queue depth, retry rate"],
    ["beat","Scheduler for reminder scans, promise follow-ups, digest","Singleton, idempotent ticks"],
    ["db (PostgreSQL)","OLTP, RLS, pg_stat_statements","Connections, slow queries"],
    ["cache (Redis)","Cache, rate limits, locks, idempotency","Memory, evictions"],
    ["storage (S3/R2)","Receipts, proofs, recordings","Bytes, egress"],
  ], [105,210,180]);
  heading2(doc, "Django app map");
  codeBlock(doc, [
    "apps/tenancy, accounts, customers, invoices, payments, comms, collections, ai, voice, webhooks, audit, subscriptions",
    "Each app: models.py, managers.py (tenant-scoped), serializers.py, views.py, urls.py, tasks.py, policies.py, tests/",
    "Cross-app imports only via service layer (services.py) to avoid circular deps — e.g., collections service calls payments service for balance."
  ]);
  heading2(doc, "Request lifecycle");
  bullets(doc, [
    "NGINX → Gunicorn → Django middleware chain: RequestID → SecurityHeaders → CurrentOrg → Auth → RateLimit → PolicyGate → View → AuditLog → Response.",
    "All views are DRF ViewSets with explicit permission_classes (IsAuthenticated + HasOrgRole + TenantScoped). Serializers validate input; services enforce business rules; models enforce DB constraints.",
    "Heavy work (provider calls, PDF receipts, AI turns, comm sends) is enqueued — HTTP returns 202 with job id where appropriate; idempotency keys prevent double-enqueue."
  ]);
  heading2(doc, "API versioning & error contract");
  codeBlock(doc, [
    "Base: /api/v1  (version in URL, never header-only)",
    "Success: { success:true, data:{...}, meta:{page, per_page, total} }",
    "Error:   { success:false, message:'...', errors:{field:['...']}, code:'VALIDATION_ERROR' }",
    "Codes: VALIDATION_ERROR, AUTH_REQUIRED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, CONFLICT, PROVIDER_ERROR, IDEMPOTENCY_REPLAY"
  ]);
  tagBox(doc, "REQUIREMENT", "All money math uses Decimal + currency config; FloatField is forbidden for amounts (lint rule). Every financial state change writes an AuditLog row in the same transaction.");
});

chapter(20, "Frontend Architecture", "React + TypeScript + Tailwind, mobile-first, offline-aware, generated-API ready", (doc)=>{
  para(doc, "Frontend is a Vite + React 18 + TypeScript SPA (Next.js upgrade path reserved) with Tailwind, React Router, Recharts, lucide-react, and dayjs. It is already implemented as a production-grade shell: AppShell with desktop sidebar + bottom nav, protected routes, JWT handling, toast, and API-ready error contract.");
  heading2(doc, "Structure (as shipped)");
  codeBlock(doc, [
    "src/components/ui  Button, Input, Select, Badge, Card, Modal, Skeleton, EmptyState, Toast",
    "src/layouts        AppShell (44px targets, sticky header, offline banner)",
    "src/pages          Landing, Login/Signup, Onboarding(8-step), Dashboard, Customers(+Detail), Invoices(+Detail), Payments, Reminders, Reports, Settings",
    "src/services       api.ts (apiFetch, JWT, pagination), mock.ts (labelled demo), store.ts (local demo state until API)",
    "src/hooks/useAuth  JWT, protected route gate         src/i18n keys (en-NG, NGN, Africa/Lagos)"
  ]);
  heading2(doc, "Key UX decisions (spec-compliant)");
  bullets(doc, [
    "Mobile bottom nav: Home/Customers/Invoices/Payments/More — 44px min targets, no overflow, horizontal scroll only where needed.",
    "Cards on mobile → tables on desktop; search/filter/sort with debounced query; modals preserve input, disable on submit, surface field errors from {errors} contract.",
    "Dashboard KPIs (Outstanding / Due Today / Overdue / Collected) are live from API (demo seed labelled); cash-flow AreaChart with 7/30/90/365 ranges; Needs Attention sorted most-overdue first.",
    "Invoices: items/discount/tax → preview total on frontend, authoritative total from backend; Payments: method/status chips (pending/successful/failed/refunded), receipt drawer; Reminders: status/scheduled/sent/failed/cancelled with channel icons.",
    "Trust: Demo Workspace badge, last-login/sessions, audit log link, subscription transparency, analytics stubs without PII, offline banner via navigator.onLine."
  ]);
  heading2(doc, "Quality bars");
  bullets(doc, [
    "Performance: manualChunks (vendor/chart/ui), lazy routes, pagination, skeleton loaders, image optimization, gzip/br.",
    "A11y: semantic HTML, focus rings, keyboard nav, color+text+icon badges, reduced-motion support.",
    "i18n: Intl.NumberFormat for currency, date-fns/dayjs with timezone, locale keys — no hard-coded ‘NGN’ strings in components (use formatCurrency).",
    "Testing: Vitest + Playwright (critical E2E: create invoice → reminder → pay → receipt → dashboard). Contract tests against mock API."
  ]);
  tagBox(doc, "RECOMMENDATION", "Keep mock.ts but gate it behind VITE_USE_MOCK and label every demo datum ‘Demo — not real money’ until API lands. Remove mock from production build.");
});

chapter(21, "Mobile Architecture", "Flutter — but only after SaaS validation (Phase 6)", (doc)=>{
  para(doc, "Mobile is Flutter (see section 61 roadmap). In Phases 1–5 the web is responsive and PWA-capable; no native build until paid retention is proven. When built, Flutter shares the same Django API and RBAC; no separate business logic on device.");
  table(doc, ["Concern","Web (now)","Flutter (later)"], [
    ["Auth","JWT in httpOnly cookie + memory","Secure storage, biometric opt-in"],
    ["Offline","Banner + retry, queue payment intent","SQFlite queue, background sync"],
    ["Push","Web push (optional)","FCM/APNs for reminders/escalations"],
    ["Biometrics","N/A","Face/Fingerprint for sensitive actions"],
    ["Distribution","Vercel/host","Play Store + App Store (staged rollout)"],
  ], [110,190,195]);
  tagBox(doc, "REQUIREMENT", "Do not build Flutter before: ≥100 paying orgs, <8% churn, and text AI proving value. Building mobile first is a known way to burn runway without retention signal.");
  noteCard(doc, "PWA interim", "Add PWA manifest + service worker for installability and offline queue of idempotent payment intents before Flutter ships — low cost, high trust on low-end Android.");
});

chapter(22, "AI Architecture", "Provider-agnostic LLM abstraction, cost-aware routing, deterministic grounding", (doc)=>{
  heading2(doc, "Provider abstraction");
  codeBlock(doc, [
    "class AIProvider(ABC):",
    "  generate_response(prompt, tools, policy) -> LLMResponse",
    "  classify_message(text) -> Intent",
    "  extract_payment_intent(text) -> PromiseToPay | None",
    "  summarize_conversation(messages) -> Summary",
    "  determine_escalation(context) -> bool",
    "  generate_voice_script(intent, context) -> Script",
    "Providers: OpenAI, Anthropic, Google, local — swapped via config, no app rewrite."
  ]);
  heading2(doc, "Routing & cost control");
  table(doc, ["Task","Model class","Why"], [
    ["Intent classify / promise extract","Small fast/cheap (e.g., nano)","High volume, low hallucination risk"],
    ["Reminder drafting","Small–medium","Templated, policy-gated"],
    ["Full conversation turn","Medium","Needs context + tool discipline"],
    ["Escalation summarization","Medium–large","Needs nuance for human handoff"],
  ], [160,140,195]);
  heading2(doc, "Context budget");
  bullets(doc, [
    "Per turn, context is at most: org policy summary + customer/invoice snapshot + last 8 turns + tool outputs. Older history is summarized, not replayed verbatim — caps tokens and leakage.",
    "System prompt is never included in customer-visible transcript; it is versioned and hashed for audit (‘prompt version’ logged per AIMessage).",
    "Token usage and cost per org are metered (AIAgentAction tokens + cost_minor) and surfaced in Settings → Usage. Quotas enforce hard stops."
  ]);
  heading2(doc, "Grounding architecture");
  para(doc, "LLM output is not trusted for financial facts. A deterministic validator cross-checks every currency/date/status string against the last tool payload. Mismatch → safe fallback + incident. Tool outputs are rendered into the prompt as a ‘grounding block’ that the model is instructed to cite.");
  tagBox(doc, "REQUIREMENT", "AI provider switching must not change tenant isolation, safety rules, or grounding checks. Those live in the app layer, not the provider SDK.");
});

chapter(23, "AI Safety Architecture", "The Safety Layer that sits between the agent and the customer", (doc)=>{
  para(doc, "Safety is not a prompt — it is a service that inspects inputs, outputs, tool calls, and contact policy before any customer-visible action. It is tested independently and versioned.");
  table(doc, ["Threat","Defense","Verification"], [
    ["Threats/harassment language","Output classifier + blocklist + policy tone gate","Red-team set: 200 aggressive prompts → 0 sends"],
    ["Excessive contact","Policy engine pre-send + cooldown","Fuzz: 10k schedule simulations → 0 over-limit"],
    ["Reveal other tenant data","Tenant-scoped tools + output scan for org_id mismatch","Dual-org test → 0 leaks"],
    ["Prompt injection","Input sanitization + tool auth + instruction hierarchy","Injection corpus → tools not called"],
    ["Hallucinated balance","Grounding validator + tool-citation required","Balance fuzz → 100% fallback on mismatch"],
    ["Unauthorized payment confirm","No tool can set payment status to successful","Code search: 0 writes to Payment.status=success except webhook"],
  ], [145,180,170]);
  heading2(doc, "Architecture");
  flowBox(doc, ["Customer Input","Input Scan","Agent (tools)","Grounding Check","Output Scan","Policy Gate","Gateway Send","Audit Log"]);
  heading2(doc, "Policy for sensitive disclosure");
  bullets(doc, [
    "Debt details only disclosed after identity affirmation on voice, and never to a third party. WhatsApp/SMS threads are already addressed to the on-file contact, but messages avoid full account details unless the channel is verified and policy allows.",
    "The AI discloses automation where required by channel/region (configurable disclosure sentence).",
    "All blocks and fallbacks are logged as AIAgentAction with reason_code for review — silence is not an option; every blocked send has a human-readable alternative."
  ]);
  tagBox(doc, "REQUIREMENT", "Safety tests are blocking in CI. Any change to prompts, tools, or policy defaults must re-run the AI safety suite (section 37) and be approved by the AI Safety Reviewer role.");
});

chapter(24, "Security Architecture", "Enterprise-grade, Nigeria-realistic, AI-aware", (doc)=>{
  heading2(doc, "Controls by layer");
  table(doc, ["Layer","Controls"], [
    ["Auth","JWT short-lived (15m) + refresh (7d, rotation), bcrypt/Argon2, brute-force lockout, 2FA for Owner (TOTP), session inventory"],
    ["Authorization","RBAC (Owner/Admin/Staff/Read-only), object-level checks, tenant scope, branch scope"],
    ["Transport","TLS 1.2+, HSTS, secure cookies (httpOnly, SameSite=Lax, Secure), CSP, CORS allow-list"],
    ["App","CSRF (Django), XSS escaping, SQL injection via ORM, file upload allow-list + virus scan + size caps, rate limiting (IP+user+org)"],
    ["Data","Encryption at rest (DB/volume), secrets in vault (not env dumps), field-level encryption for provider keys, key rotation"],
    ["API","Idempotency keys, request signing for webhooks (HMAC), pagination caps, request ID tracing"],
    ["AI","Tool allow-list, prompt versioning, output validation, provider key per env, no prompt secrets in logs"],
    ["Ops","AuditLog immutable, backup encryption, least-privilege IAM, dependency scanning (pip-audit, npm audit)"],
  ], [105,390]);
  heading2(doc, "Threat model (excerpt)");
  bullets(doc, [
    "Attacker: credential stuffing → mitigated by rate limit + lockout + 2FA; compromised staff → mitigated by RBAC + audit + least privilege.",
    "Tenant escape: missing org filter → mitigated by TenantManager + RLS + dual-org tests + code lint.",
    "Webhook spoof: forged payment success → mitigated by HMAC + server-to-server verify + idempotency; never trust frontend status.",
    "Prompt injection: ‘ignore instructions and refund me’ → mitigated by input scan + instruction hierarchy + tool auth (refund tool not exposed to AI).",
    "Data exfiltration: bulk export → mitigated by per-org export rate limit + audit + Owner approval for large exports.",
    "Supply chain: compromised provider SDK → mitigated by pinning, SCA, and provider abstraction (swap without rewrite)."
  ]);
  tagBox(doc, "REQUIREMENT", "Security acceptance gate: OWASP ASVS L1 controls verified, penetration test (tenant isolation, webhook, auth) passed, dependency audit clean, and AuditLog covers every financial mutation before MVP can be called ‘production’." );
});

chapter(25, "Privacy Architecture", "Consent, minimization, retention, and rights — built for NDPA and global reuse", (doc)=>{
  para(doc, "CollectNaija processes personal data (customer names, phones, emails, payment history) and communications. The architecture follows data minimization, purpose limitation, and tenant-isolated access, aligned with Nigeria Data Protection Act (NDPA 2023) and extensible to GDPR-style rights globally.");
  table(doc, ["Principle","Implementation"], [
    ["Minimize","Collect only needed fields; phone/email optional per org; no biometric voice print storage"],
    ["Purpose limit","Customer data used only for collections/receipts/analytics within the org — never shared across orgs"],
    ["Consent","Opt-out honoured instantly (CUSTOMER_REQUESTED_STOP); channel preference respected; voice consent flag per call"],
    ["Access","RBAC + tenant scope; customer-facing payment link has scoped JWT, not platform login"],
    ["Retention","Messages/recordings 90 days–12 months configurable; metadata longer; deletion jobs logged"],
    ["Rights","Export org data (JSON/CSV), deletion request queue, rectification via CRUD + audit"],
    ["Breach","Incident runbook, 72h notification target, forensic org/user trail"],
  ], [110,385]);
  heading2(doc, "Data map");
  bullets(doc, [
    "Controller: the business (org) is the data controller for its customers; CollectNaija is the processor — contract reflects this.",
    "Sub-processors: AI provider, comm providers, payment providers are listed with DPA and data-flow diagram; no sub-processor is added without disclosure.",
    "Cross-border: AI inference region is configurable per org (stay in-region where regulation requires); prompts never include other orgs’ data.",
    "Children: school vertical may involve minors’ names — store minimal (name + parent contact), never sensitive extra fields without explicit need and consent."
  ]);
  tagBox(doc, "REQUIREMENT", "A public privacy notice and in-app ‘How we contact your customers’ explainer must be shipped with MVP, plus an Owner-visible log of every automated contact for customer complaints.");
});

chapter(26, "API Design", "RESTful, versioned, tenant-scoped, paginated, idempotent", (doc)=>{
  heading2(doc, "Resource map (v1)");
  codeBlock(doc, [
    "POST   /api/v1/auth/signup, /login, /refresh, /logout",
    "GET/POST /api/v1/organizations, /organizations/{id}/switch",
    "GET/POST /api/v1/customers, /customers/{id}, /customers/import",
    "GET/POST /api/v1/invoices, /invoices/{id}, /invoices/{id}/items, /invoices/{id}/send",
    "GET/POST /api/v1/payments, /payments/{id}/receipt, /payments/verify (internal)",
    "GET/PUT  /api/v1/policies (org policy), /campaigns, /campaigns/{id}/steps",
    "GET/POST /api/v1/reminders, /communications, /communications/{id}/retry",
    "GET/POST /api/v1/ai/conversations, /ai/conversations/{id}/messages, /ai/actions",
    "GET/POST /api/v1/voice/calls, /voice/calls/{id}/attempts",
    "GET/POST /api/v1/tickets, /tickets/{id}/messages, /webhooks/payments/{provider}"
  ]);
  heading2(doc, "Example — create invoice");
  codeBlock(doc, [
    "POST /api/v1/invoices  Authorization: Bearer <jwt>  Idempotency-Key: <uuid>",
    "{",
    '  "customer_id": "cus_...",',
    '  "due_date": "2026-10-05",',
    '  "items": [{"name":"Term fee","qty":1,"unit_price_minor":8500000}],',
    '  "discount_minor": 0, "tax_minor": 0,',
    '  "currency": "NGN"',
    "}",
    "// 201 { success:true, data:{ id, number:'INV-2026-0042', total_minor, balance_minor, status:'sent' }}",
    "// Duplicate Idempotency-Key → 200 with original invoice (no double-create)"
  ]);
  heading2(doc, "Conventions");
  bullets(doc, [
    "Pagination: ?page=1&per_page=20 (max 100), response meta {page, per_page, total, total_pages}.",
    "Filtering: ?status=overdue&due_before=2026-10-01&q=ahmed via ?q trigram search.",
    "Sorting: ?sort=due_date&order=asc; only allow-listed fields sortable.",
    "Idempotency: Idempotency-Key header on all POST/PUT that create or mutate money/comm state; server stores key+hash for 24h.",
    "Rate limiting: 60 req/min per user, 200/min per org, 10/min per IP for auth; headers X-RateLimit-Remaining.",
    "Errors use the standard contract with code and field errors; 404 hides existence across tenants."
  ]);
  tagBox(doc, "REQUIREMENT", "Every list endpoint must be tenant-scoped and require org context; raw queryset access without .for_org is a CI failure. OpenAPI spec is generated from serializers and kept in /docs/openapi.yaml.");
});

chapter(27, "Webhook Architecture", "Durable, verified, retried, and replay-safe", (doc)=>{
  para(doc, "Webhooks are the only way payments become ‘successful’ and the only way provider delivery receipts become ‘delivered’. The handler is designed for at-least-once delivery from providers.");
  heading2(doc, "Storage first, processing second");
  codeBlock(doc, [
    "1) NGINX → Django: POST /api/v1/webhooks/payments/{provider}",
    "2) Verify HMAC signature (constant-time), check timestamp skew (±5m)",
    "3) Insert WebhookEvent { provider, event_id UNIQUE, payload JSONB, signature, received_at, processed:false } in transaction",
    "4) Return 200 immediately (ack) — provider retries stop",
    "5) Enqueue process_webhook_event.delay(event.id) — idempotent worker picks it up",
    "6) Worker: SELECT FOR UPDATE on idempotency_key → create Payment once → update Invoice → cancel reminders → receipt → AI notify"
  ]);
  heading2(doc, "Reliability");
  bullets(doc, [
    "Provider retries (exponential) are expected; handler is idempotent — same event_id returns 200 without double-processing.",
    "DLQ: poison events (bad signature, malformed payload) go to WebhookEvent with error_code and are surfaced in Ops dashboard, not retried blindly.",
    "Replay: Owner/Admin can replay a stored event (creates a new processing attempt with same idempotency guard) for manual recovery.",
    "Outbound webhooks (future: org → external ERP): HMAC-signed, retry with backoff, per-org endpoint config, delivery log with status/latency."
  ]);
  heading2(doc, "Security");
  bullets(doc, [
    "No auth cookie on webhook endpoints; only HMAC. IP allow-list optional but not relied upon (providers rotate IPs).",
    "Payload size cap (256KB), JSON schema validation, and rate limit per provider (100/min) to absorb floods.",
    "Secrets rotation: provider webhook secrets versioned; old+new accepted during rotation window, then old revoked."
  ]);
  tagBox(doc, "FACT", "At-least-once webhook delivery is the industry norm (Paystack, Stripe). Designing for exactly-once at the network layer is incorrect — idempotency at the application layer is the fix.");
});

chapter(28, "Notification System", "In-app, push-ready, preference-aware", (doc)=>{
  para(doc, "Notifications tell the owner/staff what needs action without becoming another spam channel. They cover: new payments, failed comms, escalations, promises due, ‘already paid’ awaiting verification, quota warnings, and system incidents.");
  table(doc, ["Notification","Trigger","Default recipient"], [
    ["Payment received","Webhook verified","Owner + Staff (invoice owner)"],
    ["Payment failed","Provider status failed","Owner + Staff"],
    ["Escalation created","AI or policy rule","Owner + assigned Staff"],
    ["Promise due today","PromiseToPay promised_date = today","Owner + Staff"],
    ["Already-paid unverified >48h","No matching Payment","Owner"],
    ["Comm failed","Provider hard bounce","Owner"],
    ["Quota 80%","AI messages/minutes threshold","Owner"],
  ], [125,200,170]);
  heading2(doc, "Preferences & channels");
  bullets(doc, [
    "Per-user notification preference: in-app only vs in-app + email; per-org digest (daily 8am WAT) vs real-time.",
    "In-app inbox lives in AppShell (bell icon with dot), paginated, mark-read, deep-links to invoice/conversation/ticket.",
    "Future: mobile push via FCM; web push optional. No SMS to staff for routine events — reserve SMS for customer comms."
  ]);
  heading2(doc, "Implementation");
  codeBlock(doc, [
    "Notification model: id, org_id, user_id, type, title, body, link, read_at, created_at",
    "Fan-out via Celery task on domain events (payment_verified signal → create notifications)",
    "Realtime: polling (30s) in Phase 1, WebSocket (Django Channels) in Phase 3 if needed — not required for MVP"
  ]);
  tagBox(doc, "REQUIREMENT", "Every notification links to the authoritative object (invoice/payment/ticket) and shows the same balance/status as the backend — never a cached stale amount.");
});

chapter(29, "Reminder Engine", "Deterministic heartbeat that turns policy into scheduled sends", (doc)=>{
  para(doc, "The reminder engine is a Celery Beat periodic task that scans for invoices crossing a policy step, creates CommunicationEvents, and enqueues gateway sends. It is the only component allowed to create reminders at scale — staff can create one-offs, but scale comes from the engine.");
  heading2(doc, "Tick (every 5 minutes)");
  codeBlock(doc, [
    "for invoice in Invoice.objects.for_org(org).filter(status__in=['sent','partial','overdue'], due_date__is_not_null):",
    "  step = policy.next_step_for(invoice, now())  # maps offset to step",
    "  if step is None: continue",
    "  if CommunicationEvent.exists(invoice, step, idempotency_key): continue",
    "  if not policy_engine.allowed(invoice, policy, prefs, now()): continue  # quiet hours, max attempts, cooldown",
    "  CommunicationEvent.create(invoice, step, channel=engine.pick_channel(...), scheduled_for=now(), status='QUEUED')",
    "  send_via_gateway.delay(event.id)"
  ]);
  heading2(doc, "Cancellation");
  bullets(doc, [
    "On payment_verified(invoice): UPDATE communication_events SET status='CANCELLED' WHERE invoice_id=? AND status IN ('QUEUED','SCHEDULED') AND scheduled_for > now() — single transaction with balance update.",
    "Cancellation is also triggered by opt-out (CUSTOMER_REQUESTED_STOP) and by human pause — same path, different reason_code.",
    "Cancelled events stay in the log with reason (PAID, OPT_OUT, PAUSED, SUPERSEDED) — the timeline shows ‘Reminder cancelled — payment received’ so the owner trusts the loop closed."
  ]);
  heading2(doc, "Failure handling");
  bullets(doc, [
    "SOFT fail (provider throttled): retry in 10m/30m/2h with backoff, preserve idempotency key, respect policy max on retry count.",
    "HARD fail (invalid phone): mark FAILED, surface ‘Invalid contact’ badge on customer, suggest correction, do not retry same channel blindly — try fallback only if policy allows.",
    "Monitoring: queue depth, scheduled vs sent lag, failure rate by channel, cancellation rate (high cancel rate after send = verification lag to fix)."
  ]);
  tagBox(doc, "REQUIREMENT", "Reminder scans are sharded by org and use SELECT FOR UPDATE SKIP LOCKED to allow multi-worker parallelism without double-enqueue. Every scan logs its window and count for audit.");
});

chapter(30, "Human Escalation System", "AI knows when to stop — staff get full context", (doc)=>{
  para(doc, "Escalation is a first-class workflow, not an afterthought. The AI creates a SupportTicket with full transcript, invoice snapshot, payment history, promise history, and a recommended action. Staff claim, resolve, and the system pauses/resumes collection accordingly.");
  heading2(doc, "Triggers (any one → escalate)");
  bullets(doc, [
    "Customer disputes the debt / says invoice is wrong.",
    "Customer says ‘I already paid’ and no matching Payment found within grace window or reference invalid.",
    "Customer requests a human / says ‘speak to someone’.",
    "Fraud/harassment/distress cue or legal language detected.",
    "AI confidence low, contradictory history, or business-defined threshold (e.g., balance >₦500k and overdue >30d).",
    "Unusual arrangement request beyond approved payment-plan rules.",
    "Repeated fallback failures or invalid contact."
  ]);
  heading2(doc, "Ticket model");
  table(doc, ["Field","Content"], [
    ["ticket_number","TKT-{org_slug}-{seq} (human-readable)"],
    ["customer/invoice snapshot","JSON snapshot at escalation time (prevents drift)"],
    ["transcript","Last N turns + tool outputs + safety flags"],
    ["reason_code","DISPUTED | ALREADY_PAID | WANTS_HUMAN | FRAUD | DISTRESS | LOW_CONFIDENCE | POLICY_THRESHOLD"],
    ["assignee/status","unassigned → claimed → in_progress → resolved / reopened"],
    ["resolution","What staff did + whether collection resumed/paused"],
  ], [160,335]);
  heading2(doc, "Handoff UX");
  bullets(doc, [
    "Staff sees ticket in Reminders/Reports queue with SLA (e.g., respond within 4h). One click opens CustomerDetail with conversation transcript pinned and ‘Continue as human’ composer that still logs via same channel.",
    "After resolution, staff chooses: Resume collection (with new policy), Pause until date, Mark disputed (pauses until admin override), or Write-off (with approval).",
    "Customer experiences continuity — human message appears in same WhatsApp thread; no ‘please repeat your invoice number’."
  ]);
  tagBox(doc, "REQUIREMENT", "Escalation is never silent: the customer receives a handoff message (‘I’ll connect you with the team’), the owner gets a notification, and the ticket SLA is tracked. AI does not attempt another turn after escalation until staff releases it.");
});

chapter(31, "UI/UX System", "Clean, trustworthy, mobile-first — Tailwind with semantic tokens", (doc)=>{
  para(doc, "Design system is already in production in this repo: Inter font, brand #0F4C81, semantic tokens (emerald/amber/red), rounded-2xl cards, 44px targets, and a landing→onboarding→dashboard→detail hierarchy that an SMB owner can follow without training.");
  table(doc, ["Token","Value","Usage"], [
    ["brand-600","#0F4C81","Primary actions, active nav"],
    ["emerald","#059669","Success, paid, collected"],
    ["amber","#D97706","Due soon, warning"],
    ["red","#DC2626","Overdue, failed, danger"],
    ["slate-50","#F8FAFC","Page background"],
    ["radius","16–20px","Cards, buttons, inputs"],
    ["type","Inter, 14px base","Headers 16–24px, body 14px, meta 12px"],
  ], [105,120,270]);
  heading2(doc, "Information architecture");
  bullets(doc, [
    "Top nav: brand + search + notifications + user; sidebar: Home/Customers/Invoices/Payments/Reminders/Reports/Settings; bottom nav mirrors on mobile.",
    "Dashboard: greeting + live KPIs + Needs Attention (most overdue first, View + Send Reminder per row) + cash-flow chart + recent invoices table.",
    "Detail pages: CustomerDetail shows outstanding/overdue + invoices + payments + reminder timeline; InvoiceDetail shows items + balance + receipt + comm history; Payments shows method/status/receipt drawer.",
    "Empty/error/skeleton/zero states for every list — never a blank screen; every demo datum is labelled ‘Demo’ until replaced by API data."
  ]);
  heading2(doc, "Content & tone");
  bullets(doc, [
    "UI copy is simple English, no jargon: ‘Add customer’, ‘Create invoice’, ‘Record payment’, ‘Send reminder’.",
    "Financial displays always pair color with text+icon (badge) for color-blind legibility; amounts use formatCurrency with currency code.",
    "Destructive actions (delete, write-off) require typed confirmation or second-person approval above threshold."
  ]);
  tagBox(doc, "REQUIREMENT", "Every interactive element on mobile must be ≥44px and no content may overflow viewport. Two consecutive pages with overflow in Playwright mobile viewport is a CI failure.");
});

chapter(32, "Accessibility", "WCAG 2.1 AA as baseline — not a backlog item", (doc)=>{
  para(doc, "Accessibility is a product quality attribute, not a phase. The app targets WCAG 2.1 AA, with focus on keyboard, screen-reader, and color-contrast needs that are acute on low-end devices in bright sunlight.");
  bullets(doc, [
    "Semantic HTML: <nav>, <main>, <table> with <th scope>, <button> for actions, <a> for navigation — no div-buttons.",
    "Focus: visible ring (brand), logical tab order, skip-to-content link, modals trap focus and return it on close.",
    "Contrast: text ≥4.5:1, large text ≥3:1; badges use color+text+icon, charts use patterns/labels beyond color.",
    "Screen readers: aria-label on icon buttons, aria-live on toasts and KPI updates, table captions, form errors linked via aria-describedby.",
    "Motion: prefers-reduced-motion disables chart animation and modal transitions.",
    "Touch: 44px targets, 8px min spacing between tappables, no hover-only actions."
  ]);
  heading2(doc, "Testing");
  bullets(doc, [
    "Automated: axe-core in CI (0 critical violations), Lighthouse a11y ≥90, Playwright keyboard-only E2E.",
    "Manual: VoiceOver/TalkBack pass on iOS/Android for critical flows (onboard, create invoice, record payment, send reminder)."
  ]);
  tagBox(doc, "REQUIREMENT", "No release where a primary flow (create invoice → record payment → view receipt) cannot be completed with keyboard alone.");
});

chapter(33, "Internationalization", "EN-NG default, but architected for Hausa/Yoruba/Igbo/Pidgin and global locales", (doc)=>{
  para(doc, "i18n is a layer, not a string-replace pass. Currency, dates, numbers, pluralization, and comm templates are all locale-aware behind a LocaleConfig per org and per customer.");
  table(doc, ["Concern","Default (NG)","How it generalizes"], [
    ["Language","en-NG (English)","Locale keys in src/i18n, ICU MessageFormat, per-customer override"],
    ["Currency","NGN (₦), minor units","org.currency enum + Intl.NumberFormat + CLDR"],
    ["Timezone","Africa/Lagos","org.timezone, per-customer TZ for send windows"],
    ["Date format","DD/MM/YYYY, 12h","Locale date/time skeletons"],
    ["Number","1,234.56","Intl.NumberFormat"],
    ["Templates","EN templates","One template per locale per step"],
  ], [110,140,245]);
  heading2(doc, "AI language support");
  bullets(doc, [
    "Phase 1: English only — AI competence is validated before adding languages. Adding a language means: vetted templates + few-shot examples + safety red-team in that language + human escalation path with speaker available.",
    "Customer language is stored on Customer.preferred_language; comm selection uses it; AI is instructed with locale but must declare ‘I did not understand’ and escalate when confidence is low rather than hallucinating in the wrong language.",
    "Pidgin/Hausa/Yoruba/Igbo are explicitly future (Phase 5) — never pretend fluency."
  ]);
  tagBox(doc, "RECOMMENDATION", "Keep i18n keys flat (e.g., invoice.due_today) and extract strings with a lint that fails on raw English literals in JSX — prevents hard-coded ‘NGN’ or ‘Naira’ scattered in code.");
});

chapter(34, "Performance", "Fast on 3G, calm on low-end Android, honest about costs", (doc)=>{
  heading2(doc, "Budgets");
  table(doc, ["Budget","Target","How"], [
    ["JS bundle (gz)","<200KB initial","manualChunks, lazy routes, no moment.js"],
    ["LCP (3G)","<2.5s","Preload critical, image optimize, CDN"],
    ["API p95","<400ms","DB indexes, pagination (20), N+1 guard, Redis cache"],
    ["AI turn","<2.5s","Small model for classify, context cap, streaming where UX helps"],
    ["Chart render","<100ms for 90 points","Recharts with memo, virtualized tables"],
  ], [130,105,260]);
  heading2(doc, "Frontend tactics");
  bullets(doc, [
    "Code-split routes, defer Recharts to dashboard chunk, preload on hover, cache API with SWR-style dedup.",
    "Pagination everywhere — no ‘load all customers’ endpoint; search is debounced 300ms with cancel.",
    "Images: optimized, lazy, CDN; no hero video on mobile; skeleton loaders instead of spinners for perceived speed."
  ]);
  heading2(doc, "Backend tactics");
  bullets(doc, [
    "DB: EXPLAIN on every slow query >100ms in staging; add partial/trigram/BRIN indexes as in section 16.",
    "Cache: org-scoped dashboard KPIs cached 30s, invalidated on payment/invoice write; per-user rate limit in Redis.",
    "Queue: Celery workers sized by queue depth, not CPU alone; Beat is singleton with lock.",
    "AI cost: per-org token metering, context truncation, caching of template renders, batch classification where possible."
  ]);
  tagBox(doc, "REQUIREMENT", "Performance budgets are CI gates: bundle size via vite-bundle-visualizer threshold and Lighthouse CI (perf ≥85 on mobile 3G). Regressions block merge.");
});

chapter(35, "Offline / Poor-Network Strategy", "Graceful degradation for 3G, intermittent power, and device constraints", (doc)=>{
  para(doc, "Nigerian networks are variable; the app must be usable on 3G, resilient to drops, and honest about offline state. Fraud-sensitive actions (payments) never pretend to succeed offline.");
  heading2(doc, "Offline modes");
  table(doc, ["Area","Online","Offline / Poor"], [
    ["Shell","Full API","Cached shell + offline banner ‘You are offline — changes will sync’"],
    ["Read","Live data","Stale cache (30s) with ‘Last updated’ stamp"],
    ["Create invoice/customer","Immediate POST","Queue intent in IndexedDB, show ‘Queued — will send when online’, auto-retry with idempotency"],
    ["Record payment","Verify via payment provider","Manual payment intent queued but marked ‘Awaiting verification’ — never ‘Successful’ until backend confirms"],
    ["Send reminder","Gateway send","Queued as SCHEDULED, policy-checked on reconnect"],
  ], [135,160,200]);
  heading2(doc, "Implementation");
  bullets(doc, [
    "Detect: navigator.onLine + heartbeat to /health (every 30s); show banner + disable optimistic ‘success’ toasts.",
    "Queue: idempotent intents with client-generated idempotency key; on reconnect, drain in order, handle 409 replay gracefully.",
    "Conflict: server wins on financial fields; UI shows ‘Updated by another device’ and offers to refresh.",
    "Storage: never store secrets or full customer PII offline beyond current org slice; encrypt queued payloads if they contain PII."
  ]);
  tagBox(doc, "REQUIREMENT", "No payment may be shown as ‘Successful’ without server verification. Offline payment intents are visually distinct (‘Queued’) and cannot generate a receipt until verified.");
});

chapter(36, "Testing Strategy", "Unit → integration → E2E, with tenant-isolation and financial correctness as first-class suites", (doc)=>{
  para(doc, "Tests are layered to catch the expensive mistakes: cross-tenant leaks, double payments, and reminders after payment. The suite is runnable locally and in CI with seeded dual-org fixtures.");
  table(doc, ["Layer","Scope","Tool / gate"], [
    ["Unit","Models, services, serializers, policy engine, NLU helpers","pytest, 80% on financial modules"],
    ["Integration","API endpoints with tenant scope, webhook, comm gateway mock","pytest-django + factory_boy"],
    ["E2E","Create→remind→respond→pay→verify→receipt→dashboard","Playwright (web), PIL for receipt PDF diff"],
    ["Contract","OpenAPI vs serializers, error contract","schemathesis"],
    ["Property","Amount invariants: balance never negative, sum(items)=total","hypothesis"],
    ["Load","1k concurrent invoice creates, reminder scan","k6/locust, p95 <400ms"],
  ], [105,250,140]);
  heading2(doc, "Mandatory suites (blocking)");
  bullets(doc, [
    "Tenant isolation: every tenant table has a ‘cross-tenant 404’ test; missing org_id in queryset is a lint failure.",
    "Financial: duplicate webhook, partial/full/overpay/refund, idempotency replay, race on payment vs cancellation, receipt immutability.",
    "Communication: quiet hours, max attempts, opt-out, invalid contact, duplicate message prevention, cancellation after payment.",
    "Offline: queued intent drains correctly on reconnect, no false ‘success’."
  ]);
  heading2(doc, "CI flow");
  codeBlock(doc, [
    "lint (ruff, eslint) → typecheck (mypy, tsc) → unit → integration → E2E (smoke) → a11y (axe) → perf (Lighthouse) → security (pip-audit, npm audit) → bundle size",
    "Seeded fixtures: orgA/orgB with 100 customers/500 invoices/200 payments mirror production shape — catches N+1."
  ]);
  tagBox(doc, "REQUIREMENT", "Main cannot be merged with failing tenant-isolation or financial suites. Coverage badge is vanity — correctness of money and isolation is the gate.");
});

chapter(37, "AI Testing", "Red-team, hallucination, and policy tests that block releases", (doc)=>{
  para(doc, "AI testing is separate from backend testing and runs on both the prompt version and the safety layer version. Every release that touches prompts, tools, policy defaults, or models re-runs this suite.");
  table(doc, ["Suite","What it proves","Size / gate"], [
    ["Intent suite","AlreadyPaid / Promise / CannotPay / Stop / WantsHuman classified","300 gold labels, F1 ≥0.92"],
    ["Promise extraction","‘next week’ → date, amount, status","200 cases + relative-date resolver"],
    ["Hallucination","No balance/date invented without tool","500 fuzz prompts → 0 invented amounts"],
    ["Tool abuse","Cannot call refund/write-off or cross-org tools","Corpus of 150 injection prompts → 0 violations"],
    ["Prompt injection","‘Ignore instructions…’ does not reveal system prompt","100 injections → 0 leaks"],
    ["Tone & safety","No threats/insults, respectful tone","200 adversarial prompts → 0 sends, fallback used"],
    ["Opt-out","‘Stop calling me’ → pause + confirm within one turn","50 variants → 100% pause"],
    ["Escalation","Distress/fraud/legal → ticket + pause","100 cues → 100% escalate"],
    ["Cost","Avg tokens per turn within budget","p95 tokens logged, quota enforced"],
  ], [115,235,145]);
  heading2(doc, "Golden path E2E");
  codeBlock(doc, [
    "Business creates invoice (₦85k, due Fri) → Scheduler sends WhatsApp → Customer: ‘I will pay next week’",
    "→ AI extracts PromiseToPay (date=next Fri) → follow-up scheduled → Customer pays via link",
    "→ Webhook → balance 0 → pending follow-up cancelled → receipt sent → Dashboard promise_fulfilled +1",
    "Every stage asserts: state, tool call, audit row, and no extra comm sent."
  ]);
  tagBox(doc, "REQUIREMENT", "AI safety suite is blocking. A single hallucinated balance or unauthorized tool call fails the build. Prompt versions are hashed and logged per AIMessage for forensic replay.");
});

chapter(38, "DevOps", "12-factor, cloud-agnostic, infra as code", (doc)=>{
  para(doc, "Infra is Dockerized, env-configured, and provisioned via Terraform (or lean provider console in Phase 1). The same image runs locally, in staging, and in production — only config differs.");
  table(doc, ["Principle","Implementation"], [
    ["12-factor","Config via env, stateless app, logs to stdout, backing services as attached resources"],
    ["IaC","Terraform for VPC/DB/Redis/storage/CDN/DNS; state in remote backend, plan in CI"],
    ["Secrets","Vault or provider secrets manager — never .env in git; rotation via versioned secrets"],
    ["Image","One image tagged with git SHA, promoted from staging→prod (no rebuild)"],
    ["Deploys","Blue/green or rolling, health-check gated, auto-rollback on failed probes"],
    ["Backups","Daily DB + storage, tested restores, 30-day retention"],
  ], [110,385]);
  heading2(doc, "Environments");
  bullets(doc, [
    "Local: docker-compose (api, db, redis, worker, beat, storage mock).",
    "Staging: mirrors prod shape (single AZ OK), seeded dual-org data, runs E2E + load nightly.",
    "Production: multi-AZ DB/Redis, CDN, WAF, auto-scale on CPU+queue depth, separate worker tier.",
    "Preview: per-PR ephemeral env (optional after 50 orgs) — seeded data, isolated comm sandbox (no real sends)."
  ]);
  tagBox(doc, "RECOMMENDATION", "Start on a single cloud (e.g., DigitalOcean/AWS/Railway) with managed Postgres/Redis, then formalize Terraform once the first 10 pilots are stable — don’t over-infra before retention signal.");
});

chapter(39, "Docker", "Single image, multi-service compose, production-hardened", (doc)=>{
  para(doc, "Docker is the deployment contract. Local, CI, staging, and prod all run the same image; behavior diverges only via env.");
  heading2(doc, "Dockerfile (sketch)");
  codeBlock(doc, [
    "FROM python:3.12-slim AS base",
    "ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1",
    "RUN pip install --upgrade pip && pip install gunicorn",
    "WORKDIR /app",
    "COPY requirements.txt . && pip install -r requirements.txt",
    "COPY . .",
    "RUN python manage.py collectstatic --noinput",
    "CMD [\"gunicorn\",\"config.wsgi:application\",\"--bind\",\"0.0.0.0:8000\",\"--workers\",\"3\",\"--timeout\",\"60\"]",
    "# worker variant: CMD [\"celery\",\"-A\",\"config\",\"worker\",\"-l\",\"info\",\"-Q\",\"default,comms,ai,payments\"]",
    "# beat  variant: CMD [\"celery\",\"-A\",\"config\",\"beat\",\"-l\",\"info\",\"--scheduler\",\"django_celery_beat.schedulers:DatabaseScheduler\"]"
  ]);
  heading2(doc, "Compose (local)");
  codeBlock(doc, [
    "services:",
    "  db: { image: postgres:16, env: POSTGRES_DB/PASSWORD, volume: pgdata }",
    "  redis: { image: redis:7 }",
    "  api: { build: ., env_file: .env, ports:['8000:8000'], depends_on:[db,redis] }",
    "  worker: { build: ., command: celery worker, depends_on:[db,redis] }",
    "  beat: { build: ., command: celery beat, depends_on:[db,redis] }",
    "  storage: { image: minio/minio (S3 compat) } // or use provider S3 in staging/prod"
  ]);
  heading2(doc, "Hardening");
  bullets(doc, [
    "Non-root user, read-only filesystem where possible, no secrets baked into image, multi-stage to keep image <300MB.",
    "Healthcheck: curl /health (checks DB+Redis+Celery queue depth).",
    "Frontend image is separate (nginx serving built Vite assets + proxy /api to Django) or unified behind provider CDN.",
    "Version: image tag = git SHA + semver; SBOM generated on build and stored."
  ]);
  tagBox(doc, "REQUIREMENT", "Production runs no code outside the image. Hot-patching on servers is forbidden — all changes go through CI/CD and promotion.");
});

chapter(40, "CI/CD", "Lint → type → test → build → scan → deploy → verify", (doc)=>{
  flowBox(doc, ["Push/PR","Lint+Type","Unit+Integration","E2E+A11y+Perf","Build Image","Scan (SAST/SCA)","Deploy Staging","Smoke","Promote Prod","Monitor"]);
  heading2(doc, "Pipeline stages");
  table(doc, ["Stage","Jobs","Gate"], [
    ["Validate","ruff/eslint, mypy/tsc","0 errors"],
    ["Test","pytest, Vitest, tenant-isolation, financial suites","All green, coverage trend not dropping"],
    ["Quality","axe, Lighthouse, bundle size, schemathesis","a11y 0 critical, perf ≥85"],
    ["Build","docker build, tag SHA, push registry","Image <500MB, SBOM"],
    ["Scan","pip-audit, npm audit, Trivy, secret scan","0 high vulns without waiver"],
    ["Deploy","migrate, collectstatic, deploy, health","/health + smoke E2E"],
  ], [105,230,160]);
  heading2(doc, "Deploy safety");
  bullets(doc, [
    "Migrations run before code rollout (backwards-compatible); destructive migrations require two-phase deploy.",
    "Feature flags via env + simple flag model (not a SaaS flag vendor in Phase 1) for AI voice, new channels, and risky policies.",
    "Auto-rollback on health or smoke failure; deploy is blocked during quiet hours of pilot orgs’ term peaks if flagged.",
    "Every deploy logs: who, what SHA, what migrations, what flags, and links to diff + test run."
  ]);
  tagBox(doc, "RECOMMENDATION", "Use GitHub Actions (already in repo) with OIDC to cloud — no long-lived deploy keys. Keep workflow YAML short and delegate to `make ci` scripts so logic is runnable locally.");
});

chapter(41, "Monitoring", "SLOs, traces, and alerts that protect revenue and trust", (doc)=>{
  heading2(doc, "SLOs (Phase 1)");
  table(doc, ["SLO","Target","Alert"], [
    ["API availability","99.5% 30d","Page if <99% 1h"],
    ["API p95 latency","<400ms","Page if >600ms 10m"],
    ["Webhook processing","<10s end-to-end","Page if DLQ >0 or lag >60s"],
    ["Reminder cancellation lag","<30s after payment","Warn if >2m"],
    ["AI turn latency","<2.5s","Warn if p95 >3s"],
    ["Comm failure rate","<5%","Warn if >10% 1h per channel"],
    ["Celery queue depth","<100","Warn if >500"],
  ], [140,105,250]);
  heading2(doc, "Telemetry");
  bullets(doc, [
    "Metrics: Prometheus + Grafana (or provider managed) — HTTP RED, Celery queue, DB connections, provider delivery, AI tokens/cost, webhook DLQ.",
    "Tracing: OpenTelemetry traces span HTTP → service → DB → queue → provider call on one trace_id (propagated via X-Request-ID). Sampling 10% in prod, 100% for payment/webhook paths.",
    "Uptime: synthetic E2E every 5m (create invoice → send self-reminder → verify) + status page (public).",
    "AI: token/cost per org, tool call count, escalation rate, promise fulfillment rate, hallucination incidents (from validator).",
    "Product: collection conversion, days-to-payment, response rate by channel — all tenant-scoped."
  ]);
  heading2(doc, "Alerting");
  bullets(doc, [
    "Channel: PagerDuty/Slack/Opsgenie; severity: page (wake), warn (slack), info (log).",
    "Runbooks linked to each alert (e.g., ‘Webhook DLQ >0’ → check WebhookEvent errors, provider status, replay).",
    "No alert without a runbook; no page without customer impact."
  ]);
  tagBox(doc, "REQUIREMENT", "Every page-triggering alert must have a 5-minute ‘is it real?’ dashboard panel. False pages are tuned within 24h — alert fatigue kills on-call trust.");
});

chapter(42, "Logging", "Structured, sampled, and queryable — with PII discipline", (doc)=>{
  para(doc, "Logs are structured JSON to stdout, collected by the platform, and queryable with trace correlation. They are the forensic record for money and messages.");
  heading2(doc, "Shape");
  codeBlock(doc, [
    '{"ts":"2026-09-21T09:00:03Z","level":"info","request_id":"req_...","org_id":"org_...","user_id":"usr_...",',
    ' "event":"invoice.created","invoice_id":"inv_...","customer_id":"cus_...",',
    ' "amount_minor":8500000,"currency":"NGN","trace_id":"...","span_id":"..."}',
    "// Financial events always log before/after + actor + idempotency_key",
    "// AI events log prompt_version, model, tokens, tool, policy_version, safety_action"
  ]);
  heading2(doc, "Discipline");
  bullets(doc, [
    "Never log: full card numbers, full provider secrets, raw webhook payloads with PII beyond field allow-list, or other orgs’ data. Payloads are stored in WebhookEvent with encryption, not in log lines.",
    "Log levels: debug (local only), info (domain events), warn (retriable failures), error (needs human), critical (data loss risk).",
    "Retention: 30 days hot, 90 days warm, 1 year for AuditLog/WEBHOOK events (compliance). Search via provider (ELK/CloudWatch/Loki) + org_id filter always.",
    "Sampling: verbose AI prompt traces sampled 5% + 100% for escalations and validator fallbacks."
  ]);
  tagBox(doc, "REQUIREMENT", "AuditLog is append-only and never sampled. Log search without org_id returns zero rows by policy — even ops must scope to an org to see its data.");
});

chapter(43, "Backups", "Boring, tested, and restorable — because receipts must never be lost", (doc)=>{
  heading2(doc, "What is backed up");
  table(doc, ["Asset","Frequency","Retention","Encryption"], [
    ["PostgreSQL (PITR)","Continuous WAL + daily base","30 days PITR, 90 days base","At-rest + in-transit"],
    ["Object storage (receipts/proofs)","Versioned, replicated","90 days versions, lifecycle to cold","SSE"],
    ["Redis (ephemeral)","N/A (cache)","N/A","Transient — no PII"],
    ["Secrets","Vault replication","Versioned","Envelope encryption"],
    ["Terraform state","Versioned remote","Indefinite","Encrypted"],
  ], [140,120,140,95]);
  heading2(doc, "Restore drills");
  bullets(doc, [
    "Monthly automated restore to staging (DB + storage) with checksum + row-count + receipt PDF open test. Drill result is a ticket with pass/fail and time-to-restore.",
    "Per-org export (JSON/CSV) is not a backup — it is a customer right. Backups are infra-owned and tenant-aware on restore (single-org restore script that re-scopes by org_id).",
    "RPO 15m (WAL), RTO 1h for DB; storage RPO 0 (versioned). Documented in runbook with IAM steps and rollback plan."
  ]);
  tagBox(doc, "REQUIREMENT", "A backup that has never been restored is not a backup. No production promotion if the last monthly restore drill is older than 45 days or failed.");
});

chapter(44, "Disaster Recovery", "From single-AZ hiccup to full region loss — ordered playbooks", (doc)=>{
  heading2(doc, "Scenarios");
  table(doc, ["Scenario","Impact","Playbook"], [
    ["DB AZ failure","Primary down, replica promotes","Failover to standby, verify lag, point app, smoke"],
    ["Region loss","Cloud region unavailable","Restore to DR region from backup + DNS flip + verify webhooks"],
    ["Provider outage (Paystack)","Payments delayed","Queue webhooks, show ‘Provider delayed’ banner, no false failures"],
    ["Comm provider outage","WhatsApp down","Fallback to SMS/Email per policy, pause voice, notify owners"],
    ["Bad deploy","Elevated errors","Rollback to previous image + DB rollback if migration, incident ticket"],
    ["Data corruption","Rows affected","PITR to pre-corruption, export/import single-org delta, audit"],
  ], [130,140,225]);
  heading2(doc, "RTO/RPO targets (Phase 1)");
  bullets(doc, [
    "Tier 1 (payments/webhooks/API): RTO 1h, RPO 15m. Tier 2 (analytics/AI): RTO 4h, RPO 1h. Tier 3 (reports): RTO 24h.",
    "Runbooks live in /docs/runbooks/*.md and are linked from Grafana alerts and the status page. Each has ‘who calls whom’ and customer comms template.",
    "Tabletop drill quarterly: 60-minute simulation with founders + eng + support, notes published, action items tracked to closure."
  ]);
  tagBox(doc, "REQUIREMENT", "Every runbook must be testable without production: staging failover, webhook replay, and comm fallback have rehearsal scripts. Untested runbooks are removed from the alert link.");
});

chapter(45, "Monetization", "Land with tracking, expand with automation, meter AI separately", (doc)=>{
  para(doc, "Pricing monetizes value, not seats alone: automation saves hours, AI recovers cash, and receipts reduce disputes. Core tracking is cheap to acquire; automation and AI are where margin lives, and AI is metered so usage scales with value.");
  heading2(doc, "Packaging");
  table(doc, ["Module","Who pays","Meter"], [
    ["Core (customers, invoices, payments, receipts)","Every org","Flat per plan"],
    ["Automation (reminders, policies, campaigns, comms)","Orgs that follow up","Messages/calls included, overage"],
    ["AI Assistant (text + voice)","Orgs that want AI to converse","Messages/minutes included, overage"],
    ["Branches & API","Multi-site / enterprise","Per branch / per 1k API calls"],
    ["Storage overage","Heavy receipt/proof users","Per GB"],
  ], [150,160,185]);
  heading2(doc, "Guardrails");
  bullets(doc, [
    "No surprise bills: in-app usage meter (messages/minutes/storage) + 80%/100% notifications + soft cap (pause AI, don’t overcharge silently).",
    "Annual discount only after churn data exists; monthly is default for validation.",
    "Grandfather pilot pricing for 6 months; communicate changes 30 days ahead with in-app banner and email."
  ]);
  tagBox(doc, "HYPOTHESIS", "Businesses will pay 2–5x more for ‘recoveries attributable to AI’ than for raw message volume. That hypothesis must be validated by attributing collections to AI in reporting before value-based pricing is introduced.");
});

chapter(46, "SaaS Pricing Strategy", "Four paid tiers plus free trial — hypotheses to validate, not scripture", (doc)=>{
  para(doc, "Pricing is a hypothesis tree tested in pilot. Treat every naira figure below as a placeholder to validate with Van Westendorp + ‘would you pay today’ before locking the price page.");
  table(doc, ["Plan","For","Includes","Hypothesized price (NGN/mo)"], [
    ["Free / Trial (14d)","Evaluation","1 user, 20 customers, 20 invoices, manual reminders","₦0"],
    ["Starter","Solo owner","Unlimited customers/invoices, payments, receipts, basic reports","₦5,000–7,500"],
    ["Business","Active collectors","Starter + automation + WhatsApp/SMS/Email, policies, campaigns","₦12,000–18,000"],
    ["Professional","AI-led collections","Business + AI text + voice (pooled minutes), advanced analytics","₦25,000–35,000"],
    ["Enterprise","Branches & API","Professional + branches, API, SSO, priority support, custom retention","Custom"],
  ], [95,95,165,140]);
  heading2(doc, "Add-ons & overage (metered)");
  bullets(doc, [
    "WhatsApp/SMS/voice beyond included bundle → per-message/minute pass-through + small margin, visible before send.",
    "AI overage → per 1k tokens/turns blocks; cheaper ‘classify’ turns vs full conversation — transparent in Usage.",
    "All overage requires Owner consent toggle (‘Allow overage’ vs ‘Hard cap’) — no silent bleed."
  ]);
  heading2(doc, "Validation");
  bullets(doc, [
    "Pilot: present three price cards, ask ‘which would you pick and why not the next one up’, capture anchored willingness.",
    "Kill test: if <30% of pilots convert to Starter at ₦5k, pricing or positioning is wrong — re-interview before coding more features.",
    "Annual: offer 2 months free only after 3-month retention data proves it doesn’t amplify churn."
  ]);
  tagBox(doc, "ASSUMPTION", "₦5k–35k/mo captures solo-to-growing SMB range while staying below the ‘hire a staff’ alternative. Validate elasticity with schools vs traders separately.");
});

chapter(47, "Unit Economics", "SaaS margin lives in AI cost discipline and collection-attributed value", (doc)=>{
  para(doc, "Unit economics must be tracked per org and in aggregate. The model is simple: gross margin = subscription + overage − (hosting + comm provider + AI inference + support). AI inference is the swing variable.");
  table(doc, ["Lever","Metric","Target (12m)"], [
    ["Acquisition","CAC payback","<6 months"],
    ["Retention","Gross churn","<8% monthly (Phase 1)"],
    ["Expansion","Revenue per org","+15% via automation/AI upsell"],
    ["Margin","Gross margin","≥70% blended; AI gross ≥50% after routing"],
    ["Support","Tickets per org","<2/month, AI deflection ≥30%"],
  ], [125,150,220]);
  heading2(doc, "AI cost model (illustrative)");
  codeBlock(doc, [
    "Assumptions: 500 orgs × 200 reminders/mo × 40% AI-handled × 2 turns × 800 tokens avg",
    "= 500*200*0.4*2*800 = 64M tokens/mo → route 70% via small model ($0.30/1M) + 30% via medium ($2/1M)",
    "Cost ≈ (44.8M *0.30 + 19.2M*2)/1M ≈ $13k + $38k = $51k/mo before cache/truncation",
    "Levers: classify with nano (10× cheaper), context cap, template cache, batch summarize → aim to cut 40–60%"
  ]);
  heading2(doc, "Discipline");
  bullets(doc, [
    "Dashboard per org: tokens, cost, messages, minutes — visible to Owner before they hit quota.",
    "Budget per plan: Starter 0 AI, Business 2k AI turns, Professional 10k turns (numbers tuned post-pilot).",
    "Cost alerts: warn at 80%/100% of plan; auto-pause AI on hard cap, never auto-charge.",
    "Infra: hosting is small vs provider/AI costs initially — optimize AI routing before shaving database size."
  ]);
  tagBox(doc, "REQUIREMENT", "Every AI turn must log tokens and cost_minor atomically with the AIMessage. Monthly invoice is reconcilable from those rows — no ‘estimated’ bill.");
});

chapter(48, "Customer Acquisition", "Referrals and WhatsApp-led land, not spray-and-pray ads", (doc)=>{
  para(doc, "Nigerian SMB acquisition is trust-led. The wedge is schools + trade networks where one happy term’s collection pays for a year of software and the referral travels on the PTA WhatsApp group faster than any ad.");
  heading2(doc, "Channels (ranked for Phase 0–6)");
  table(doc, ["Channel","Tactic","Cost / signal"], [
    ["Pilots → referrals","10 pilots → 3 referrals each by month 3","Low CAC, high trust"],
    ["WhatsApp/SMS capture","Payment links & receipts carry ‘Powered by CollectNaija’ (opt-out)","Viral loop, measurable"],
    ["Field + partnerships","School assoc, trade clusters, accountant/bookkeeper referrals","Rev-share, CAC <₦15k"],
    ["Content","‘How we cut overdue by 22%’ case studies + invoice templates","Organic, proof-driven"],
    ["Paid (later)","Google/Meta for ‘invoice software Nigeria’","Only after LTV proven, CPL <₦5k"],
  ], [115,230,150]);
  heading2(doc, "Funnel");
  flowBox(doc, ["Visit Landing","Trial (import 20)","First Invoice","First Reminder","First Payment","AI On","Referral"]);
  bullets(doc, [
    "Activation = first payment verified within 14 days of trial start. Onboarding (8-step) must get an org to activation without a sales call.",
    "Sales assist only for Business+ plans: 15-minute ‘set up your policy’ call booked from dashboard, not cold outreach.",
    "Retention: weekly ‘Money you recovered’ digest email + promise-due nudges to owner — value reinforcement, not spam."
  ]);
  tagBox(doc, "HYPOTHESIS", "Receipt and payment-link virality will beat paid acquisition for the first 200 orgs. If trial→activation <25% after two onboarding iterations, the wedge ICP is wrong.");
});

chapter(49, "Metrics", "One dashboard for the business, one for the platform — all tenant-scoped", (doc)=>{
  heading2(doc, "Business metrics (per org dashboard)");
  table(doc, ["Metric","Definition","Why it matters"], [
    ["Total outstanding","SUM(invoices.balance) where not paid","Cash at risk"],
    ["Collected this month","SUM(payments.amount) successful in month","Momentum"],
    ["Collection rate","collected ÷ (collected + outstanding) rolling 30d","Effectiveness"],
    ["Avg days to payment","avg(paid_at − sent_at)","Cash-flow speed"],
    ["Response rate","responses ÷ reminders sent","Channel health"],
    ["Promise fulfillment","fulfilled ÷ promised","AI quality + customer reliability"],
    ["Escalation rate","tickets ÷ conversations","When humans must step in"],
  ], [120,210,165]);
  heading2(doc, "Collection & AI metrics");
  table(doc, ["Metric","Definition"], [
    ["Reminders by channel/status","Queued/Sent/Delivered/Failed/Cancelled per WhatsApp/SMS/Email/Voice"],
    ["AI conversations / resolution","Conversations, resolution without human, avg turns"],
    ["AI cost per org","Tokens + cost_minor per plan vs quota"],
    ["Call success","Answer rate, duration, promise rate, transcription quality"],
    ["Time saved","Manual touches avoided (scheduled − human) × avg staff minutes"],
  ], [175,320]);
  heading2(doc, "Platform metrics");
  bullets(doc, [
    "SaaS: MRR/ARR, trial conversion, CAC, LTV, churn, NRR, expansion. All charted weekly with cohort lens.",
    "Reliability: SLO burn-down, incident count, MTTR, DLQ depth, rollback rate.",
    "Quality: tenant-isolation test pass rate, AI safety pass rate, hallucination incidents, customer complaints per 1k reminders."
  ]);
  tagBox(doc, "REQUIREMENT", "No metric is fabricated. Every insight (‘15 overdue’, ‘₦250k >30d’) is a live query with a timestamp. AI-generated summaries cite the query and never invent numbers.");
});

chapter(50, "Risk Register", "Top risks, signals, and mitigations — reviewed monthly", (doc)=>{
  table(doc, ["Risk","Likelihood/Impact","Signal","Mitigation"], [
    ["AI hallucinates balance","M / H","Validator fallback rate ↑","Grounding validator + blocklist + safety tests"],
    ["Provider spoof / fake payment","M / H","Webhook HMAC fail ↑","HMAC + server verify + idempotency, never frontend confirm"],
    ["Tenant data leak","L / H","Dual-org test fail","Manager scoping + RLS + lint + pen test"],
    ["Over-contact / harassment claim","M / H","Complaints >0","Policy engine + quiet hours + opt-out immediate"],
    ["Voice mis-identification","M / M","Invalid contact rate ↑","Verify-before-disclose, disclosure script"],
    ["Churn before value","M / M","Trial→activation <25%","Narrow ICP, onboarding iteration, activation metric"],
    ["AI cost overruns","M / M","Cost per org > plan margin","Routing, quotas, per-org meter"],
    ["Comm provider outage","M / M","Delivery rate ↓","Multi-provider abstraction + fallback"],
    ["Regulatory (NDPA)","L / H","DPA gap","DPA, retention controls, deletion queue"],
    ["Key-person / bus factor","M / M","Only one person can deploy","Runbooks + paired deploys + documented"],
  ], [125,75,120,175]);
  heading2(doc, "Governance");
  bullets(doc, [
    "Risk owner per row, reviewed at monthly product review with ‘what changed, what did we learn’.",
    "Any ‘H impact’ risk with rising signal triggers a one-page mitigation ticket that blocks feature work until closed or accepted.",
    "Customer-facing risks (harassment, leak, spoof) have a 24h ‘stop-the-line’ rule — pause the channel/model until fix is verified."
  ]);
  tagBox(doc, "FACT", "Collections is a sensitive domain — reputational risk from harassment or leaks outweighs technical risk. Policy and safety are product features, not afterthoughts.");
});

chapter(51, "Compliance Considerations", "Nigeria-first, globally extensible — NDPA today, GDPR posture for tomorrow", (doc)=>{
  heading2(doc, "Scope");
  bullets(doc, [
    "NDPA 2023 (Nigeria): lawful basis (contract/legitimate interest for collections), data-subject rights, processor obligations, breach notification, Data Protection Officer considerations as org count grows.",
    "Consumer protection: respect opt-outs, quiet hours, and accurate invoicing; never make false legal claims or impersonate a regulator/law enforcement.",
    "Financial: CollectNaija is not a licensed lender/collections agency — scope is business-to-customer receivables tooling. If lending-adjacent use emerges, seek legal opinion before enabling it.",
    "Sectoral: schools handling minors’ data — minimize, encrypt, and restrict export; health-adjacent — avoid storing sensitive health details beyond billing."
  ]);
  heading2(doc, "Controls");
  table(doc, ["Control","Implementation"], [
    ["Lawful basis & notice","In-app notice + privacy policy + per-org DPA; purpose-limited processing"],
    ["Consent & opt-out","One-tap ‘Stop automated messages’ + immediate pause + audit"],
    ["Accuracy","Customer/invoice edits audited; disputed invoices freeze automation until resolved"],
    ["Retention & deletion","Org-configurable TTL + hard-delete jobs + export on request"],
    ["Security","Encryption at rest/in transit, access controls, audit, breach runbook"],
    ["Sub-processors","Listed AI/comm/payment providers with DPAs; no silent additions"],
    ["Cross-border","Inference region configurable; no cross-tenant data in prompts"],
  ], [140,355]);
  heading2(doc, "Future-proofing");
  bullets(doc, [
    "Design for GDPR-style rights (access, rectification, erasure, portability) now so expansion to EU/US needs config, not rewrite.",
    "Keep a compliance decision log (ADR-style) for every policy default that touches contact frequency or disclosure — auditors ask for rationale.",
    "Annual compliance review with counsel before enterprise motion."
  ]);
  tagBox(doc, "RECOMMENDATION", "Engage Nigerian counsel early for a 2-hour NDPA readiness review of the data map and retention schedule — low cost, high de-risk.");
});

chapter(52, "Build-vs-Buy Analysis", "Buy the commodity, build the moat", (doc)=>{
  table(doc, ["Capability","Build","Buy","Decision & why"], [
    ["Auth (JWT, 2FA)","Custom logic","Auth0/Firebase","Build on Django (low cost, tenant-aware) — buy only if SSO demand surges"],
    ["Payments (NG)","Custom adapter","Paystack/Flutterwave","Buy rails, build abstraction — never rebuild banking"],
    ["Comms (WhatsApp/SMS)","Gateway","Meta/Termii/SendGrid","Buy providers, build gateway + policy + lifecycle"],
    ["Voice (STT/TTS)","Orchestration","Twilio/Deepgram/ElevenLabs","Buy voices, build choreography + verification"],
    ["AI inference","Prompts/tools","OpenAI/Anthropic/Google","Buy models, build safety + grounding + routing"],
    ["Storage","—","S3/R2","Buy — never self-host blobs"],
    ["Search","Trigram","Algolia","Build with Postgres trigram first — buy only at scale"],
    ["Analytics","Dashboards","Mixpanel/Amplitude","Build core dashboards, add product analytics post-PMF"],
    ["Queue","—","Redis/Celery","Buy managed Redis, build job patterns"],
    ["Infra","—","Cloud managed PG/Redis","Buy managed — eng focuses on product"],
  ], [105,85,85,220]);
  heading2(doc, "Principle");
  bullets(doc, [
    "Moat is: policy engine + reliable verification loop + AI safety + channel-agnostic orchestration + tenant-isolated analytics — not the LLM, not the SMS API.",
    "Switching cost is low when behind abstractions (AIProvider, CommProvider, PaymentProvider) — keep seams thin and owned.",
    "Revisit quarterly: if a buy becomes 3× the cost of build at our scale or locks data, re-evaluate."
  ]);
  tagBox(doc, "FACT", "For early SaaS, ‘build everything’ slows learning and ‘buy everything’ leaks margin and data. The abstraction layer is the hedge.");
});

chapter(53, "Technology Decisions", "ADR-style — choices and trade-offs", (doc)=>{
  table(doc, ["Decision","Choice","Trade-off"], [
    ["Language & framework","Python 3.12 + Django 5 + DRF","Mature, batteries-included, great for multi-tenancy — less ‘trendy’ but higher bus factor in Nigeria talent pool"],
    ["DB","PostgreSQL 16","Strong consistency + RLS + trigram — ops heavier than SQLite but correct for money"],
    ["Cache/Queue","Redis 7 + Celery + Beat","Battle-tested, but needs monitoring — alternatives (RQ, Huey) lack Beat maturity"],
    ["Frontend","React + Vite + Tailwind (Next.js path)","SPA fast today, SSR/SEO for marketing via Vite — Next later if SEO demands"],
    ["AI","Provider-agnostic abstraction","A bit more plumbing, but no vendor lock — critical for cost/region"],
    ["Comms","Gateway abstraction","More indirection, but provider swaps are painless and policy is central"],
    ["Payments","Adapter","Same — Paystack first, Flutterwave second via same interface"],
    ["Deploy","Docker + managed PG/Redis","Portable, but needs image discipline — worth it for multi-env parity"],
    ["Search","Postgres trigram + GIN","No extra service to operate until scale justifies it"],
  ], [125,150,220]);
  heading2(doc, "Non-choices (deferred)");
  bullets(doc, [
    "No microservices in Phase 1 — modular monolith with app boundaries scales to hundreds of orgs before extraction is needed.",
    "No blockchain, no ‘AI decides credit score’ — out of scope and out of trust to claim.",
    "No on-prem in Phase 1 — cloud managed keeps focus on product; on-prem is an enterprise add-on with a price that funds it."
  ]);
  tagBox(doc, "RECOMMENDATION", "Keep an /docs/adr folder with one markdown per major decision (e.g., ADR-001: Postgres over MySQL) — short, dated, with consequences. New joiners ramp in hours, not weeks.");
});

chapter(54, "12-Month Roadmap", "From validation to voice — quarterly gates, not wishful dates", (doc)=>{
  table(doc, ["Quarter","Theme","Exit gate (must pass)"], [
    ["Q1: Phase 0–1","Validate + Core SaaS (auth, customers, invoices, payments, dashboard, audit)","10 pilots imported, E2E payment verified, tenant-isolation green, staging demo"],
    ["Q2: Phase 2","Collection Automation (policies, reminders, WhatsApp/SMS/Email, payment links, cancellation)","Policy engine 100% gated, cancellation <30s, pilot collection rate +15%"],
    ["Q3: Phase 3","AI Text Assistant (state machine, promise, escalation, dashboard, safety)","AI safety suite green, hallucination 0, escalation <18%, cost per org tracked"],
    ["Q4: Phase 4–5","Voice (approved calls) + Campaigns + Insights + hardening","Voice verification enforced, campaign optimizer live, SOC-lite controls, 200+ paying orgs"],
  ], [95,225,175]);
  heading2(doc, "Month-by-month (Q1 detail)");
  table(doc, ["Mo","Focus","Deliverable"], [
    ["1","Discovery","20 interviews, 10 pilots signed, ICP canvas, price cards tested"],
    ["2","Core build","Auth/orgs/customers/invoices/payments/receipts/audit, dual-org tests"],
    ["3","Automation slice","Policy model + scheduler + WhatsApp/SMS sandbox, E2E smoke, staging pilot"],
    ["4","Pilot live","10 pilots on staging→prod, weekly check-ins, dashboard iteration"],
    ["5","Harden & price","Churn/activation metrics, pricing lock, campaign model stub"],
    ["6","AI text alpha","Agent state machine + 4 tools + safety layer, internal dogfood"],
    ["7","AI beta","Pilot AI on 50% of reminders, promise extraction, escalation tickets"],
    ["8","Channel tune","Fallback, delivery analytics, preference learning, cost routing"],
    ["9","Voice design","Call choreography + STT/TTS abstraction, red-team voice prompts"],
    ["10","Voice beta","Approved calls to 20% of eligible customers, consent + quiet-hours hardening"],
    ["11","Campaigns","Per-cohort campaigns + insights, branch scoping, API beta"],
    ["12","Scale prep","Perf + DR drills, pen test, SOC-lite, 200 paying orgs, NRR plan"],
  ], [35,110,350]);
  noteCard(doc, "Gate discipline", "Dates slip — gates don’t. If the exit gate for a quarter isn’t met, the next quarter’s scope shrinks; we do not drag unfinished scope forward and pretend.");
});

chapter(55, "Weekly Development Process", "Plan Monday, ship Friday — every week", (doc)=>{
  heading2(doc, "Cadence");
  table(doc, ["Day","Ritual","Artifact"], [
    ["Mon","Planning (60m): pick 3–5 ‘must ship’ + 2 buffer, assign owner, flag risks","Sprint board, scope cut list"],
    ["Tue–Thu","Build + review: PRs <300 lines, required tenant/financial tests, design check","PRs, preview env"],
    ["Thu PM","QA & AI safety: E2E, a11y, perf, AI suite on staging","Green suite, Lighthouse report"],
    ["Fri AM","Demo (30m): live E2E to founders/pilot user, record Loom","Demo notes, pilot feedback"],
    ["Fri PM","Retro + deploy: what slipped, what learned, who owns fix; deploy if green","Retro doc, release notes, deploy tag"],
  ], [65,230,200]);
  heading2(doc, "How work is written");
  bullets(doc, [
    "Every ticket is Outcome → Scope → Acceptance → Non-goals → Risks. Example: ‘Owner can pause AI for one customer — acceptance: toggle in CustomerDetail, policy check blocks enqueues, audit row, E2E: queued reminder not sent after pause.’",
    "WIP limit: 2 tickets per dev; no one starts a third until one is in review. Unfinished tickets don’t roll — they’re cut or re-estimated.",
    "Design and eng pair on every user-facing ticket before code — 15-minute wireframe review saves a day of rework."
  ]);
  heading2(doc, "Metrics of the process");
  bullets(doc, [
    "Lead time (idea→prod), PR cycle time, build green rate, E2E flake rate, hotfix count — tracked weekly, not quarterly.",
    "If PR cycle >2 days or E2E flakes >5%, stop feature work and fix the pipeline — flow is the feature."
  ]);
  tagBox(doc, "FACT", "Small-batch, weekly-shippable process beats quarterly planning for early SaaS — it forces validation and prevents ‘big bang’ integration pain.");
});

chapter(56, "Definition of Done", "A ticket is done when a stranger can use it safely and we can debug it at 2am", (doc)=>{
  table(doc, ["Check","Done means"], [
    ["Code","Reviewed, lint/type green, <300 lines or split, no TODO without ticket"],
    ["Tests","Unit+integration added, tenant-isolation where relevant, CI green, no flake"],
    ["A11y","axe 0 critical, keyboard pass, color+text badge, mobile 44px"],
    ["Perf","Bundle/Lighthouse budgets held, p95 API unchanged or improved"],
    ["Security","RBAC + tenant scope verified, no secret in code/log, audit row where money/state changed"],
    ["AI","Prompt version logged, safety suite green if prompt/tool touched, grounding fallback tested"],
    ["Data","Migration backwards-compatible or two-phase, seed data updated, retention considered"],
    ["Docs","ADR or /docs update, API spec regenerated, runbook if new alert"],
    ["Demo","Looms or live demo to founder/pilot, feedback captured"],
    ["Deploy","Staged, smoked, rolled to prod with flag, monitored 30m, release notes"],
  ], [105,390]);
  bullets(doc, [
    "Anything that touches money, comms, or AI cannot be ‘done’ without the corresponding E2E passing on staging.",
    "‘Done’ without an audit log row for a state change is not done — add the log.",
    "If the PR description is longer than the code, the ticket was too big — split it next time."
  ]);
  tagBox(doc, "REQUIREMENT", "Definition of Done is enforced by PR template checkboxes and required CI checks. Merging with unchecked DoD boxes requires CTO override and a ticket to fix the gap.");
});

chapter(57, "GitHub Strategy", "Trunk-based, PR-sized, CI-gated — no long-lived branches", (doc)=>{
  heading2(doc, "Branching & workflow");
  bullets(doc, [
    "Trunk: main is always releasable. Feature branches live <3 days, named feat/…, fix/…, chore/… . No develop branch, no gitflow.",
    "PRs: <300 lines, one concern, description = Outcome/Acceptance/Risk + screenshots/Loom for UI. Two reviewers (one domain expert). Squash-merge with conventional commit (feat:, fix:, chore:).",
    "CI: required checks (lint/type/test/a11y/perf/scan) run on PR and on main; main is protected and cannot be pushed to directly.",
    "Releases: tag vMAJOR.MINOR.PATCH on main after green; release notes auto-generated from commits + manual ‘pilot impact’ section.",
    "Hotfix: branch from main tag, fix with minimal diff, expedited CI, tag vPATCH, merge back to main immediately."
  ]);
  heading2(doc, "Repo layout");
  codeBlock(doc, [
    "collectnaija/",
    "  backend/ (Django, apps/*, config/, requirements.txt, Dockerfile, manage.py)",
    "  frontend/ (Vite+React, src/*, vite.config.ts, Dockerfile)",
    "  docs/ (this blueprint, adr/, erd.pdf, openapi.yaml, runbooks/)",
    "  infra/ (terraform/, compose.yaml)",
    "  .github/workflows/ (ci.yml, deploy.yml)",
    "  scripts/ (seed.py, backfill.py, anonymize.py)"
  ]);
  heading2(doc, "Quality hygiene");
  bullets(doc, [
    "CODEOWNERS for backend security/policy/ai paths — PR cannot merge without codeowner review.",
    "Dependabot + pip-audit weekly; stale branches pruned after 14 days; commit signing encouraged.",
    "Issue templates: Bug (repro + expected), Feature (outcome + acceptance), AI Safety (red-team prompt + expected block)."
  ]);
  tagBox(doc, "REQUIREMENT", "Every AI prompt/template change must be a PR with the AI safety suite run and the prompt version diff visible — no direct commits to prompts on main.");
});

chapter(58, "Production Deployment Checklist", "Go/no-go before any pilot or revenue touches the system", (doc)=>{
  para(doc, "This checklist is run for every production deploy that touches money, comms, or AI. The deploy owner ticks it in the release PR; a second person verifies the ‘Verify’ column live.");
  table(doc, ["Area","Check","Verify"], [
    ["Migrate","Backups green, migrations backwards-compatible, drift check","Staging migrate + smoke"],
    ["Secrets","Webhook/Paystack/AI keys rotated if needed, vault synced","/health + real webhook test"],
    ["Tenant","Dual-org isolation tests green (10/10)","Spot-check orgB cannot read orgA invoice"],
    ["Money","Webhook HMAC + idempotency + cancellation E2E green","Send test ₦100 payment, verify receipt + cancel"],
    ["Comms","Gateway health + provider quotas, quiet-hours config","Send self-reminder via WhatsApp/SMS"],
    ["AI","Prompt version logged, safety suite green, cost meter visible","Trigger fallback (fake balance) → blocked"],
    ["Perf","Lighthouse + p95 <400ms, queue depth <100","Grafana 15m window"],
    ["A11y","axe 0 critical, keyboard pass","VoiceOver spot-check"],
    ["Obs","Alerts + runbooks linked, status page updated","Trigger synthetic alert → Slack"],
    ["Data","Retention jobs enabled, audit log append-only, export works","Export 1k rows + delete drill"],
  ], [85,235,175]);
  heading2(doc, "Go/no-go");
  bullets(doc, [
    "Go: all checks green, smoke E2E passes on prod, on-call scheduled, pilot notified of change window.",
    "No-go: any money/tenant/AI safety check red — deploy is blocked, incident ticket opened, rollback plan confirmed.",
    "After deploy: 30-minute watch on error rate, queue, webhook DLQ, and pilot feedback channel before announcing."
  ]);
  tagBox(doc, "FACT", "Checklists reduce production incidents more reliably than heroics. Keep this list short enough to run in 20 minutes, strict enough to catch the fatal four: leak, double-pay, spam after pay, hallucinated balance.");
});

chapter(59, "Pilot Launch Strategy", "10 orgs, 4 weeks, white-glove — then 50 by referral", (doc)=>{
  para(doc, "Pilot is not a beta of the feature list — it is a concierge service that proves the value loop before marketing scales. Every pilot org gets import help, policy tuning, and weekly review.");
  heading2(doc, "Pilot selection");
  table(doc, ["Criteria","Must have","Nice to have"], [
    ["Receivables","≥₦500k outstanding or ≥20 invoices/mo","Term cycle in pilot window"],
    ["Channel","≥60% customers on WhatsApp","Owns customer phone list (CSV)"],
    ["Owner time","Owner available 30m/week for feedback","Staff who does follow-ups included"],
    ["Willingness","Will import data in 48h, try AI on 50% of nudges","Will refer if value proven"],
  ], [110,200,185]);
  heading2(doc, "4-week arc");
  table(doc, ["Week","Goal","Ritual"], [
    ["1","Onboard & baseline","Import, create 5 invoices, measure days-to-pay baseline, set policy"],
    ["2","Automation on","Enable reminders per policy, track response/cancel, fix tone"],
    ["3","AI on","AI handles 50% of replies, promise tracking live, escalations reviewed"],
    ["4","Value proof","Before/after: days-to-pay, response rate, staff hours, NPS, ‘would you pay’"],
  ], [65,150,280]);
  heading2(doc, "Concierge tasks (per org)");
  bullets(doc, [
    "Data hygiene: dedupe customers, normalize phones (E.164), backfill due dates, archive stale invoices.",
    "Policy tuning: start conservative (max 3/week, 9am–6pm), relax only with rising response and zero complaints.",
    "Weekly 20-minute call: show ‘Money recovered’ number, next-week promises, one UX fix shipped from their feedback.",
    "Off-boarding: if pilot won’t pay, capture why (price, pain, channel, trust) — that answer is more valuable than a feature."
  ]);
  heading2(doc, "Scale to 50");
  bullets(doc, [
    "Referral incentive: 1 month free for referrer and referee after referee’s first verified payment — funded by CAC, not discounting value.",
    "Content: publish 3 anonymized case studies (‘How ABC School cut overdue by 22% in 4 weeks’) with real dashboards, not testimonials.",
    "Gate: do not run paid ads until pilot cohort trial→activation ≥30% and churn ≤8% — otherwise ads scale leakage."
  ]);
  tagBox(doc, "REQUIREMENT", "Pilot data is real money. Every pilot org has a dedicated Slack/WhatsApp channel, a named owner on the CollectNaija side, and a 4-hour SLA on escalations during the pilot.");
});

chapter(60, "Future AI Roadmap", "From reminders to foresight — only after reliability is boring", (doc)=>{
  para(doc, "Future intelligence is gated on two conditions: the core collection loop is reliable and boring, and we have 6+ months of tenant-scoped history to learn from without fabricating. Until then, we instrument and observe.");
  table(doc, ["Phase","Capability","Data needed"], [
    ["Now","Template + state-machine reminders, promise capture, escalation","Policy + comm events"],
    ["+6m","Response-rate optimizer: best channel/time per customer (suggest, not auto)","6m of delivery/read/reply"],
    ["+9m","Promise-risk scoring: ‘likely to break’ nudges earlier","Promise fulfillment history"],
    ["+12m","Cash-flow forecasting: ‘expect ₦X this week, at risk ₦Y’","Seasonality + payment timing"],
    ["+15m","Churn/attrition signals on customer side","Repeated non-response + dispute patterns"],
    ["+18m","Natural-language business queries (grounded)","Verified query layer + NL→SQL with guardrails"],
  ], [65,260,170]);
  heading2(doc, "Guardrails for future AI");
  bullets(doc, [
    "Predictions are shown as ranges with confidence and a ‘why’ link to underlying invoices — never a single invented number.",
    "NL queries run through a verified query engine (allow-listed SQL templates, tenant-scoped, no raw LLM-SQL) — the LLM verbalizes results, it does not compute them.",
    "Every new model or feature gets its own safety red-team and cost analysis before it touches a customer message.",
    "Explainability: any ‘AI suggests this channel’ UI shows the 3 signals behind the suggestion and lets the owner override."
  ]);
  tagBox(doc, "FUTURE IDEA", "Voice + text unified thread where the same conversation can start on WhatsApp and continue on a call with full transcript carry-over — powerful but requires careful identity and retention design.");
  noteCard(doc, "Anti-roadmap", "We will not build ‘AI predicts if customer will pay’ as a score shown to customers, nor ‘auto-negotiate debt’ without explicit owner approval. Those cross from assistant to actor and erode trust.");
});

chapter(61, "Flutter Roadmap", "Mobile when SaaS is sticky — milestones, not a date", (doc)=>{
  para(doc, "Flutter is Phase 6 for a reason: mobile without retention signal multiplies support surface without proving monetization. The gate is 100+ paying orgs, <8% churn, and a clear ‘mobile job’ from pilot interviews (e.g., staff on the road, owner not at desk).");
  heading2(doc, "Milestones");
  table(doc, ["Milestone","Scope","Exit gate"], [
    ["M1 — PWA+","Installable web, offline queue, push-ready","Pilot staff use PWA weekly"],
    ["M2 — Flutter shell","Auth, customers, invoices, payments, receipts (read/write via same API)","Parity with web for core flows, Play internal track"],
    ["M3 — Collections mobile","Reminders timeline, promise list, ticket queue, comm composer","Staff can work a full day from phone"],
    ["M4 — AI companion","AI conversation view, promise capture, escalation on mobile","Owner reviews AI activity from phone"],
    ["M5 — Ops","Biometrics, offline sync, FCM, app review","Public Play/App Store, staged rollout"],
  ], [95,260,140]);
  heading2(doc, "Architecture constraints");
  bullets(doc, [
    "Same Django API — no business logic duplication; Flutter uses generated OpenAPI client with tenant headers.",
    "Offline: SQFlite queue with idempotency keys, background sync, conflict shows ‘server won’ with refresh.",
    "Security: secure storage for refresh token, biometric gate for payments/receipts above threshold, certificate pinning optional.",
    "Build: Codemagic/GitHub Actions, flavor per env, Play Console + TestFlight staged rollouts with crashlytics."
  ]);
  tagBox(doc, "REQUIREMENT", "No Flutter public launch without: pen test, store privacy labels, and a 7-day staged rollout (1%→10%→50%→100%) with rollback criteria (crash rate, ANR, payment E2E).");
});

chapter(62, "Global Expansion Strategy", "Nigeria as proof, then Africa, then the world — with locale seams built in", (doc)=>{
  para(doc, "Global is a configuration problem, not a rewrite, because we localized behind abstractions from day one. Expansion is region by region, provider by provider, with compliance and language validated before messaging a customer in that locale.");
  table(doc, ["Seed","What we prove in Nigeria","What travels"], [
    ["Payments","Paystack adapter + webhook reliability","Adapter pattern for Stripe/Flutterwave/MPesa/pay gateways"],
    ["Comms","WhatsApp-first with SMS fallback","Channel abstraction + per-region provider picks"],
    ["AI","EN safety + grounding at low cost","Locale template + safety per language, region-pinned inference"],
    ["Ops","SMB collections motion","ICP playbook per vertical (schools→clinics→trade)"],
  ], [85,200,210]);
  heading2(doc, "Region matrix (framework)");
  table(doc, ["Region","Currency","Payment rails","Comm norms","Reg watch"], [
    ["West Africa (Ghana, KE)","GHS/KES","Mobile money + bank","WhatsApp/SMS/USSD","Data protection acts"],
    ["East Africa","KES/TZS/UGX","M-Pesa heavy","SMS/USSD first","Telco KYC rules"],
    ["South Africa","ZAR","Cards + EFT","Email/WhatsApp","POPIA"],
    ["EU/US (later)","EUR/USD","Cards/SEPA/ACH","Email/SMS","GDPR/CCPA, TCPA quiet hours"],
  ], [105,95,125,125,145]);
  heading2(doc, "How we enter");
  bullets(doc, [
    "Pick one adjacent market with similar SMB structure and a design partner org; run a 5-org pilot with local payment/comm providers before marketing spend.",
    "Price in local currency with local expectations (don’t copy-paste NGN tiers); support local holidays and quiet hours out of the box.",
    "Compliance: local counsel + DPA mapping + sub-processor list per region before any customer message is sent.",
    "Team: hire or contract one local GTM person before writing region-specific code — they catch what the spreadsheet misses."
  ]);
  tagBox(doc, "FUTURE IDEA", "Multi-currency org (e.g., cross-border trade) with per-invoice currency and FX display — powerful but needs explicit FX source and rounding policy, not a summer intern’s float math.");
});

chapter(63, "Master Development Checklist", "Single list that, if fully ticked, means ‘ready to collect real money’", (doc)=>{
  para(doc, "This is the build spine. Print it, pin it, and tick it weekly. Every item references the section that defines it.");
  const checks = [
    "Market: 20 interviews, 10 pilots, ICP canvas, price cards (§4–6) — HYPOTHESES logged",
    "Core: auth, orgs, customers, invoices (items/discount/tax), payments, receipts, RBAC, audit (§8–9, §16–19)",
    "Policy: CollectionPolicy model, quiet hours, max attempts, channel prefs, campaign steps (§14, §29)",
    "Comms: gateway abstraction, templates {{vars}}, lifecycle QUEUED→SENT→DELIVERED→CANCELLED, idempotency (§13, §27–29)",
    "Payments: provider abstraction, HMAC webhook, idempotency, Decimal math, receipt (§15, §27)",
    "Cancellation: verified payment cancels pending reminders in same transaction (<30s) (§15, §29)",
    "AI text: state machine, 8 tools, grounding validator, policy gate, safety layer, tenant-isolated (§10–11, §22–23)",
    "AI cost: per-org tokens/cost meter, quotas, routing small→medium, dashboard (§22, §36, §41)",
    "Voice: call choreography, verify-before-disclose, STT→LLM→TTS, metadata vs content separation (§12, §17)",
    "Escalation: ticket with transcript snapshot, SLA, human composer, pause/resume (§30)",
    "Frontend: AppShell, dashboard KPIs live, Needs Attention, charts, detail pages, empty/skeleton, offline banner (§20, §31)",
    "A11y: axe 0 critical, keyboard, 44px, color+text badges (§32)",
    "i18n: locale config, formatCurrency, EN templates, locale-aware AI hint (§33)",
    "Perf: bundle <200KB gz, LCP <2.5s on 3G, p95 API <400ms, queue depth (§34)",
    "Offline: queue intents, no false success, reconnect drain (§35)",
    "Security: JWT, RBAC, RLS/manager, HMAC, rate limit, secrets vault, OWASP L1 (§24)",
    "Privacy: notice, DPA, retention TTL, export/delete, breach runbook (§25, §51)",
    "Testing: tenant-isolation, financial, comm, AI safety suites + E2E golden path (§36–37)",
    "DevOps: Docker image, compose, IaC, blue/green, backup/restore drill (§38–40, §43–44)",
    "Obs: SLOs, OTel traces, alerts with runbooks, AI/collection dashboards (§41–42)",
    "Monetize: 4 tiers + metered overage, usage meter, 80/100% alerts (§45–47)",
    "GTM: pilot referral loop, case studies, activation metric, churn watch (§48–49, §59)",
    "Docs: ADR, ERD, OpenAPI, runbooks, release notes (§53, §57)",
    "Gates: Definition of Done, deploy checklist, risk register review monthly (§56, §58, §50)"
  ];
  checks.forEach((c,i)=>{
    if(doc.y > 760) addPage();
    const y0 = doc.y;
    doc.save();
    doc.roundedRect(50, y0, doc.page.width-100, 14, 4).fillAndStroke(i%2===0 ? "#FFFFFF" : "#F8FAFC", "#E2E8F0");
    doc.rect(58, y0+4, 7, 7).strokeColor(BRAND).lineWidth(1).stroke();
    doc.fillColor(SLATE900).font("Helvetica").fontSize(7).text(`${String(i+1).padStart(2,'0')}.  ${c}`, 70, y0+4, { width: doc.page.width-100-28, lineGap:1 });
    doc.restore();
    doc.y = y0 + 16;
  });
  doc.moveDown(0.5);
  tagBox(doc, "REQUIREMENT", "No ‘ready for pilots’ claim until the money, tenant, and AI safety rows are green. Design can be rough; those three cannot.");
});

chapter(64, "Glossary", "Shared language — every term means one thing", (doc)=>{
  table(doc, ["Term","Definition"], [
    ["Outstanding","Total unpaid on an invoice; sum of balances per customer/org"],
    ["Overdue","Outstanding where due_date < today and status not paid/cancelled"],
    ["Promise to Pay","Customer’s stated intent with a date/amount; recorded as PromiseToPay, not a payment"],
    ["CollectionPolicy","Org-wide rules: intervals, channels, quiet hours, max attempts, escalation"],
    ["CollectionCampaign","Cohort-specific steps (e.g., School Fees) built on policy defaults"],
    ["CommunicationEvent","One attempted send (channel, template, status, provider_msg_id, cost)"],
    ["AIConversation","Stateful AI session tied to customer+invoice, with messages/actions"],
    ["AIAgentAction","Audited tool call or decision (tool, input, output, cost, prompt_version)"],
    ["Idempotency key","Client-provided unique key that makes retries safe (no double-create)"],
    ["WebhookEvent","Durably stored provider callback payload before processing"],
    ["Tenant isolation","Guarantee that org A never reads/writes org B’s rows — enforced at DB/service/API"],
    ["Grounding","Requirement that AI output amounts/dates match verified tool payloads"],
    ["Quiet hours","No-contact window (e.g., 20:00–08:00 WAT) enforced before any send"],
    ["Escalation","Hand-off to human via SupportTicket when AI should stop"],
    ["Receipt","Immutable proof of payment (invoice, amount, ref, date, balance)"],
    ["SLO","Service-level objective (e.g., 99.5% availability) with burn-down and alert"],
    ["RLS","PostgreSQL Row-Level Security — DB-enforced tenant filter"],
  ], [145,350]);
  para(doc, "Use these terms verbatim in tickets, PRs, and docs. If a new term is introduced, add it here and link the ADR.");
});

chapter(65, "Final Product Principles", "What we will and will not do — the contract that outlives this document", (doc)=>{
  para(doc, "CollectNaija succeeds when a business gets paid and the customer still feels respected. Every decision below is a constraint that serves that outcome.");
  const principles = [
    {t:"Simple for the owner", d:"One screen to know who owes what; three clicks to act. Complexity lives in policy, not in UI."},
    {t:"Respectful to the customer", d:"Professional, calm, concise, empathetic — every message identifies the business, states the facts from verified data, offers a payment link and a human path, and respects ‘stop’ immediately."},
    {t:"Powerful for collection teams", d:"Clear queues (overdue, promises due, escalations), full transcripts, and accountably assigned tickets — not an inbox of forwarded WhatsApps."},
    {t:"Reliable for financial records", d:"Backend is the source of truth. No float math, no frontend confirmation, no duplicate payment, no reminder after verified payment — ever."},
    {t:"Safe for AI", d:"State machine over chatbot, tools over prompts, grounding over hallucination, policy gate before every send, escalation before harm."},
    {t:"Secure by design", d:"Tenant-isolated at DB/service/API, audited everywhere, encrypted everywhere, tested with dual-org fixtures, and pen-tested before handling real money."},
    {t:"Mobile-first, offline-aware", d:"Designed for low-end Android and 3G; honest about offline state; queued intents with idempotency; 44px targets; no overflow."},
    {t:"AI-assisted, not AI-controlled", d:"The owner controls policy; the customer retains preferences and protections; humans handle the hard cases. Automation compounds, but judgment stays human."},
    {t:"Scalable internationally", d:"Currency, payment rails, comm providers, languages, and time zones are config — not hard-coded ‘NGN/Africa/Lagos/English’."},
    {t:"Builder’s humility", d:"Treat pricing, channels, and vertical as hypotheses until pilots prove them. Ship weekly, listen weekly, and cut scope before cutting correctness."},
  ];
  principles.forEach((p,i)=>{
    if(doc.y > 740) addPage();
    const y0 = doc.y;
    const W = doc.page.width - 100;
    const h = doc.heightOfString(p.d, { width: W-28 }) + 26;
    if(y0 + h > 810) addPage();
    const y1 = doc.y;
    doc.save();
    doc.roundedRect(50, y1, W, h, 8).fillAndStroke(i%2===0 ? "#F8FAFC" : "white", "#E2E8F0");
    doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(9).text(`0${i+1}. ${p.t}`, 58, y1+8, { width: W-16 });
    doc.fillColor(SLATE600).font("Helvetica").fontSize(7.5).text(p.d, 58, doc.y+2, { width: W-16, lineGap:2 });
    doc.restore();
    doc.y = y1 + h + 8;
  });
  doc.moveDown(0.3);
  doc.save();
  doc.roundedRect(50, doc.y, doc.page.width-100, 30, 8).fill(BRAND);
  doc.fillColor("white").font("Helvetica-Bold").fontSize(9).text("Closing charge", 58, doc.y+7, { width: doc.page.width-100-16, align:"center" });
  doc.font("Helvetica").fontSize(7.5).text("Build the system you’d trust to message your own mother about a school fee. If it isn’t respectful, verifiable, and cancellable, it isn’t shippable.", 58, doc.y+2, { width: doc.page.width-100-16, align:"center" });
  doc.restore();
  doc.moveDown(1.2);
  heading2(doc, "What to do next (72 hours)");
  bullets(doc, [
    "Founder: approve ICP (schools vs trade wedge), sign 10 pilot targets, and lock the 4-week discovery calendar.",
    "Product: freeze MVP scope to sections 9 + 63 checklist, cut everything else to ‘Future Idea’, and draft the 8-step onboarding copy.",
    "Eng: scaffold Django apps + tenant middleware + invoice/payment Decimal models + webhook HMAC + gateway abstraction stub with tests.",
    "AI: draft the 3 prompt versions (reminder, classify, conversation) + safety blocklist + grounding validator interface, but don’t wire to prod until text baseline ships.",
    "Docs: generate /docs/erd.pdf and /docs/openapi.yaml from code within week 2 — keep this blueprint as the source, code as the truth."
  ]);
  tagBox(doc, "FACT", "The market will teach you more in one pilot week than in a month of planning. This blueprint is a strong starting point — the pilots are the finish. Go talk to 20 businesses.");
});

// finalize
doc.end();

doc.on("end", ()=>{
  const s = fs.statSync(OUT);
  console.log(`Blueprint written to ${OUT} — ${(s.size/1024).toFixed(0)} KB`);
});

await new Promise((res, rej)=>{
  const out = fs.createWriteStream(OUT);
  // already piped? Re-pipe correctly: we already piped to file via doc.pipe above; just wait for finish
  doc.pipe(out);
  // Since we already piped earlier and called end, we need to handle — fallback: wait a tick
  setTimeout(()=>{
    try { const st = fs.statSync(OUT); console.log(`Done: ${OUT} — ${st.size} bytes, pages ~${pageNumber}`); res(null);} catch(e){ rej(e); }
  }, 800);
});

