# Visual Changes Reference

## Before vs After Comparison

### 1. Hardcoded Badges (OLD)
```
❌ BEFORE:
┌─────────────────────────────────────────────┐
│ 📊 Requested: RM 55,000                     │
│ 📅 Tenure: 24 Months        [HARDCODED!]   │
│ 🏢 Business: F&B (Retail)   [HARDCODED!]   │
└─────────────────────────────────────────────┘
```

### 2. Dynamic Badges (NEW)
```
✅ AFTER:
┌─────────────────────────────────────────────┐
│ 📊 Requested: RM {from Application Form}    │
│ 📅 Tenure: {from "PERIOD" field}           │
│ 🏢 {from "LOAN TYPE" checkbox}             │
└─────────────────────────────────────────────┘

Example for Car Loan:
│ 📊 Requested: RM 55,000                     │
│ 📅 Tenure: 7 years (84 months)             │
│ 🏢 Car Loan                                 │
```

---

## New Financial Metrics Section

### Visual Layout
```
╔═══════════════════════════════════════════════════════════════╗
║  📈 Financial Metrics Analysis                                ║
║  Comprehensive financial ratios calculated from documents     ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌────────────────────────┐  ┌────────────────────────┐     ║
║  │ Debt Service Ratio     │  │ Net Disposable Income  │     ║
║  │ [Low Risk Badge]       │  │ [Sufficient Badge]     │     ║
║  │                        │  │                        │     ║
║  │     30.5%              │  │    RM 2,573            │     ║
║  │                        │  │                        │     ║
║  │ 📊 Formula: ...        │  │ 📊 Formula: ...        │     ║
║  │ ┌──────────────────┐   │  │ ┌──────────────────┐   │     ║
║  │ │ Existing: RM 430 │   │  │ │ Income: RM 3,703 │   │     ║
║  │ │ New Loan: RM 700 │   │  │ │ - Debt: RM 1,130 │   │     ║
║  │ │ Total: RM 1,130  │   │  │ │ - Living: RM 700 │   │     ║
║  │ │ Income: RM 3,703 │   │  │ │ = RM 2,573       │   │     ║
║  │ └──────────────────┘   │  │ └──────────────────┘   │     ║
║  │ 💡 "PTPTN: RM 180..." │  │ 💰 Real Buffer: RM...  │     ║
║  └────────────────────────┘  └────────────────────────┘     ║
║                                                               ║
║  ┌────────────────────────┐  ┌────────────────────────┐     ║
║  │ Per Capita Income      │  │ Savings Rate           │     ║
║  │ [Struggling Badge]     │  │ [High Saver Badge]     │     ║
║  │                        │  │                        │     ║
║  │     RM 529             │  │      73%               │     ║
║  │                        │  │                        │     ║
║  │ (calculation...)       │  │ (calculation...)       │     ║
║  │ ⚠️ Risk Flag!         │  │                        │     ║
║  └────────────────────────┘  └────────────────────────┘     ║
║                                                               ║
║  ┌────────────────────────┐  ┌────────────────────────┐     ║
║  │ Cost of Living Ratio   │  │ LTV (if applicable)    │     ║
║  │ [Frugal Badge]         │  │ [Standard Badge]       │     ║
║  │                        │  │                        │     ║
║  │     18.9%              │  │      90%               │     ║
║  └────────────────────────┘  └────────────────────────┘     ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │ 📚 Understanding Financial Metrics                  │     ║
║  ├─────────────────────────────────────────────────────┤     ║
║  │ DSR: Measures repayment pressure. Warning at 60%.  │     ║
║  │ NDI: Cash after debts. Emergency buffer capacity.  │     ║
║  │ Per Capita: Income/family. Reveals hidden stress.  │     ║
║  │ Savings Rate: Closing vs income. Financial habits. │     ║
║  │ Cost of Living: Expenses %. Spending patterns.     │     ║
║  │ LTV: For Car/Housing. Malaysia max 90% standard.   │     ║
║  └─────────────────────────────────────────────────────┘     ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Color Coding System

### Assessment Badges
```
┌─────────────────────┐
│  GREEN BADGES       │  ← Low Risk / Good
│  (Emerald 100/800)  │
└─────────────────────┘

┌─────────────────────┐
│  AMBER BADGES       │  ← Moderate Risk / Warning
│  (Amber 100/800)    │
└─────────────────────┘

┌─────────────────────┐
│  RED BADGES         │  ← High Risk / Critical
│  (Rose 100/800)     │
└─────────────────────┘
```

### Metric Values Colors
- **DSR**: Purple-700
- **NDI**: Emerald-700
- **Per Capita**: Blue-700
- **Savings**: Green-700
- **Cost of Living**: Indigo-700
- **LTV**: Orange-700

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS 4 DOCUMENTS                                 │
│    → Application Form, Bank Statement, Essay, Payslip       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND AI PROCESSES                                     │
│    → Extract text from all 4 PDFs                           │
│    → Parse Application Form fields                          │
│    → Calculate 6 financial metrics                          │
│    → Store in analysis_result JSON                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FRONTEND DISPLAYS                                        │
│    ✓ Dynamic badges from applicant_profile                  │
│    ✓ Financial Metrics section (if available)               │
│    ✓ Graceful degradation (old apps without metrics)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Example Real Data

### Applicant: Nurul Aisyah (Car Loan Example)

**Application Form Data:**
- Name: Nurul Aisyah binti Abdullah
- IC: 950123-14-5678
- Loan Type: ✓ Car Loan
- Amount: RM 55,000
- Period: 7 years (84 months)
- Annual Income: RM 44,436
- Family Members: 7

**Calculated Metrics:**
1. **DSR**: 30.5% → ✅ Low Risk (<40%)
2. **NDI**: RM 2,573 → ⚠️ Tight (RM 1000-2000)
3. **Per Capita**: RM 529 → ❌ Struggling (<RM1000) + 🚩 Risk Flag
4. **Savings**: 73% → ✅ High Saver (>50%)
5. **Cost of Living**: 18.9% → ✅ Frugal (<30%)
6. **LTV**: 90% → ✅ Standard (max 90%)

**AI Insight:**
"Although DSR is healthy at 30.5%, the per capita income of RM 529 for a family of 7 in Kuala Lumpur indicates hidden financial stress. However, the exceptionally high savings rate of 73% and frugal spending (18.9%) suggest strong financial discipline that may offset this risk."

---

## Testing Checklist

### ✅ Features to Verify

1. **Dynamic Badges**
   - [ ] "Requested" shows actual amount from application
   - [ ] "Tenure" shows period from Application Form
   - [ ] Third badge shows actual loan type (not "F&B (Retail)")

2. **Financial Metrics Section**
   - [ ] Purple gradient card appears below Score Drivers
   - [ ] All 6 metrics display (or 5 if not Car/Housing loan)
   - [ ] Values match calculation formulas
   - [ ] Evidence quotes appear (if available)
   - [ ] Explanations box at bottom

3. **Backwards Compatibility**
   - [ ] Old applications (no metrics) don't crash
   - [ ] Old applications show dynamic badges
   - [ ] Metrics section gracefully hidden if data missing

4. **Responsiveness**
   - [ ] Grid adapts to screen size
   - [ ] Cards readable on smaller screens
   - [ ] Text doesn't overflow

### 🔍 Where to Look

1. Go to: http://localhost:3000
2. Upload new application OR open existing one
3. Scroll to **before** "Score Drivers" section
4. Check the 3 badges (Requested, Tenure, Loan Type)
5. Scroll to **after** "Score Drivers" section
6. Look for purple "Financial Metrics Analysis" card

---

## Common Issues & Solutions

### Issue: Metrics section not showing
**Cause**: Old application or AI analysis failed  
**Solution**: Upload a NEW application with 4 documents

### Issue: Badges still showing "24 Months" or "F&B"
**Cause**: Browser cache  
**Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Frontend not updating
**Cause**: Hot reload didn't trigger  
**Solution**: Restart frontend server or save page.tsx again

### Issue: Backend error on analysis
**Cause**: AI prompt change  
**Solution**: Check backend logs for JSON parsing errors

---

**Created**: 2025-01-25  
**For**: TrustLens AI Financial Metrics Update
