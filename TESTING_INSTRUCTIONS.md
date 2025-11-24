# TrustLens AI - Testing Instructions

## ✅ System Status

### Backend Fixes Applied:
1. **Comprehensive Logging** - Background task now prints detailed progress
2. **Unique Mock Results** - Each application gets different risk score based on:
   - Application ID
   - Document content
   - Loan type
3. **Better Error Handling** - Full traceback on failures
4. **Database Reset** - Fresh database created

### What Was Fixed:
- ❌ **Old Issue**: All applications showed same mock score (720)
- ✅ **New Behavior**: Unique scores between 550-850 per application
- ❌ **Old Issue**: Background task failed silently
- ✅ **New Behavior**: Detailed logging shows exactly what happens
- ❌ **Old Issue**: No differentiation between documents
- ✅ **New Behavior**: Hash-based scoring considers document content

---

## 🧪 Testing Steps

### Step 1: Verify Backend is Running
1. Open PowerShell and check: `http://localhost:8000/`
2. Should see: `{"status":"ok","service":"TrustLens AI API"}`

### Step 2: Upload First Application
1. Go to: `http://localhost:3000`
2. Click **"+ New Application"**
3. Fill in:
   - **Name**: Ali bin Ahmad
   - **IC Number**: 988888-09-0987
   - **Loan Type**: Micro-Business Loan
   - **Amount**: RM 50,000
   - **Bank Statement**: Upload `BBAV-Bank-Statement-TemplateLab.com_.pdf`
   - **Essay**: Upload `Personal Loan Essay.pdf`
4. Click **Submit**
5. **Expected Result**: 
   - Status changes: "Processing..." → "Analyzing..." → Shows risk score
   - Dashboard shows risk score (NOT "—")
   - Status shows "Approved", "Review Required", or "Rejected"

### Step 3: Upload Second Application (DIFFERENT)
1. Click **"+ New Application"** again
2. Fill in:
   - **Name**: Abu
   - **IC Number**: 939596-06-4960
   - **Loan Type**: Car Loan (DIFFERENT!)
   - **Amount**: RM 60,000 (DIFFERENT!)
   - **Bank Statement**: Upload `Commonweath-Bank-Statement-TemplateLab.com_.pdf` (DIFFERENT!)
   - **Essay**: Upload `Car Loan Essay.pdf` (DIFFERENT!)
3. Click **Submit**
4. **Expected Result**:
   - **DIFFERENT risk score** than first application
   - **DIFFERENT decision** based on risk score
   - Both applications visible in dashboard with DIFFERENT scores

### Step 4: Check Backend Logs
1. Look at the PowerShell window running backend
2. You should see detailed output like:
```
============================================================
Starting analysis for APP-20251124180208
Loan Type: Micro-Business Loan
Bank Statement: uploads\APP-20251124180208\BBAV-Bank-Statement-TemplateLab.com_.pdf
Essay: uploads\APP-20251124180208\Personal Loan Essay.pdf
============================================================

✓ Status updated to ANALYZING
Extracting bank statement from: uploads\APP-20251124180208\BBAV-Bank-Statement-TemplateLab.com_.pdf
✓ Bank statement extracted: 1234 characters
Extracting essay from: uploads\APP-20251124180208\Personal Loan Essay.pdf
✓ Essay extracted: 567 characters

Total raw text length: 1801 characters
ℹ No Gemini API key - using mock analysis

Analysis Result:
  Risk Score: 735
  Risk Level: Low
  Decision: Approved

✅ Application APP-20251124180208 analysis COMPLETED
   Stored in database with score: 735
============================================================
```

### Step 5: Verify Dashboard Display
1. Dashboard should show:
   - **Applicant ID**: APP-20251124XXXXXX
   - **Name**: Ali bin Ahmad / Abu
   - **Loan Type**: Micro-Business Loan / Car Loan
   - **Amount**: RM 50,000 / RM 60,000
   - **Risk Score**: Large number (NOT "—")
   - **Status**: Approved/Review Required/Rejected (NOT "Failed")
   - **Review Status**: 🤖 AI Analysis badge

### Step 6: Test Risk Console (Detail View)
1. Click **"View →"** on any application
2. Verify:
   - Large risk score box at top (e.g., "735 /850")
   - Box color matches risk level (Green=Low, Amber=Medium, Red=High)
   - Financial DNA table populated
   - AI Risk Analysis section shows findings
   - Decision Audit History shows AI recommendation
   - Navigation controls: [< Prev] [1 of 2] [Next >]

### Step 7: Test Navigation
1. From Risk Console, click **"Next >"**
2. Should load second application
3. Click **"< Prev"**
4. Should return to first application
5. Try **Arrow Left/Right keys**

### Step 8: Test Maker-Checker Workflow
1. If AI recommended "Approved", click **"Reject"**
2. Override dialog should appear
3. Enter reason: "Insufficient documentation"
4. Submit
5. Verify:
   - Status changes to "Rejected"
   - Review Status changes to "Manual Override"
   - Decision History shows human decision with reason
   - Dashboard shows manual override badge

---

## 🔍 What to Look For

### ✅ Success Indicators:
- ✅ Two applications with DIFFERENT risk scores
- ✅ Scores between 550-850 (not same 720 for both)
- ✅ Status shows actual decision (Approved/Review Required/Rejected)
- ✅ Backend logs show successful extraction and analysis
- ✅ Dashboard displays large numbers clearly
- ✅ Risk console navigation works
- ✅ Manual override creates audit trail

### ❌ Failure Indicators:
- ❌ Dashboard shows "—" instead of risk score
- ❌ Status shows "Failed" or "Processing..." forever
- ❌ Both applications have same score (720)
- ❌ Backend logs show errors or exceptions
- ❌ No data in Decision Audit History

---

## 🐛 If Something Fails

### Problem: Dashboard still shows "—"
**Solution**: 
1. Check backend logs for errors
2. Verify database was recreated (check `trustlens.db` timestamp)
3. Hard refresh browser (Ctrl+F5)

### Problem: Status stuck on "Processing..."
**Solution**:
1. Check backend PowerShell window for errors
2. Look for file extraction failures
3. Verify PDF files are in `uploads` folder

### Problem: Backend won't start
**Solution**:
1. Kill all Python processes: `Stop-Process -Name python -Force`
2. Restart: `cd backend; .\venv\Scripts\Activate.ps1; python main.py`

### Problem: Both applications have identical scores
**Solution**:
1. This should NOT happen with new code
2. Check backend logs to confirm `generate_mock_result` is called with application_id and raw_text
3. If still identical, report exact score values

---

## 📊 Expected Results

### Application 1 (Ali - Micro-Business):
- **Risk Score**: ~650-800 (varies by document hash)
- **Risk Level**: Low or Medium
- **Decision**: Approved or Review Required
- **Review Status**: AI Analysis

### Application 2 (Abu - Car Loan):
- **Risk Score**: ~600-780 (DIFFERENT from App 1)
- **Risk Level**: Low or Medium (may differ from App 1)
- **Decision**: Could be different from App 1
- **Review Status**: AI Analysis

---

## 🎯 Next Steps After Testing

1. **If tests pass**: Configure Gemini API key for real AI analysis
   - Edit `backend/.env`
   - Set `GEMINI_API_KEY=your_actual_key`
   - Restart backend
   - Upload new applications to test real AI

2. **If tests fail**: Report exact error messages from:
   - Browser console (F12)
   - Backend PowerShell logs
   - Network tab in browser (check API responses)

3. **Production Readiness**:
   - Real Gemini API key
   - Production database (PostgreSQL recommended)
   - Environment variables for secrets
   - CORS configuration for production domain
   - Rate limiting and authentication
