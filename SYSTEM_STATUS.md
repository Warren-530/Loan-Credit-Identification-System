# TrustLens AI – Current System Status (Evidence-Only Architecture)

Date: November 25, 2025  
Status: 🟢 Operational (Gemini unavailable – heuristic fallback active)

## Recent Changes
| Area | Change |
|------|--------|
| Backend | Removed legacy Financial DNA / compliance audit constructs |
| Backend | Added payslip ingestion + evidence-only heuristic scoring |
| Backend | Added retry endpoint `/api/application/{id}/retry` |
| Backend | Added lightweight reasoning subset endpoint `/api/application/{id}/reasoning` |
| Backend | Hardened enum/risk_level mapping + detached instance fix |
| Frontend | Simplified to PDF-only viewer (no multi-tab text panels) |
| Frontend | Added evidence-driven Score Drivers & Risk Factors sections |
| Frontend | Added conditional Retry Analysis button (Failed state) |

## Active Capabilities
- Independent per-application extraction (bank, essay, payslip)
- Deterministic evidence-only heuristic risk scoring (0–100)
- Decision mapped directly to status (Approved / Rejected / Review Required)
- ≥10 sentence-level essay insights per application (if essay text present)
- Key risk flags with inline evidence quotes
- Manual override / audit trail preserved
- PDF export (compliance style report) still functional
- Retry pipeline for failed analyses

## Removed / Deprecated
- Financial DNA radar & synthetic psychometric metrics (set to null)
- Legacy multi-tab text viewer & fabricated compliance blocks
- Hash-based 550–850 scoring model (replaced with additive factor model baseline 50)

## Processing Flow (Current)
```
Upload → Persist → Status=Processing
→ Background: Status=Analyzing → Extract PDFs (PyMuPDF) → Build raw_text
→ AI path (Gemini) if key present else heuristic fallback
→ generate_mock_result(bank_text, essay_text, payslip_text)
→ Risk score + risk_level + final_decision → Status mapped to decision
```

## Heuristic Scoring Factors (Examples)
| Category | Effect | Evidence Source |
|----------|--------|----------------|
| Income Verified | +15 | Keywords + deposit count |
| Income Activity | ±10 | Number of deposit events |
| Positive/Negative Cashflow | +10 / -15 | Net surplus (deposits - withdrawals) |
| Income Stability / Volatile Income | +10 / -8 | Std dev vs mean deposits |
| Gambling / Crypto | -25 / -10 | Keyword presence |
| Salary Evidence | +8 | Payslip line with basic salary |
| Repayment Intent | +5 | Essay repayment keywords |
| Capacity (Installment Coverage) | +7 / -12 | Surplus vs estimated installment |
| High Amount Manual Review | Flag | requested_amount > threshold |

## Decision Mapping
| Score Range | Risk Level | Default Decision |
|-------------|-----------|------------------|
| ≥ 80 | Low | Approved (may downgrade to Review if high amount) |
| 60–79 | Medium | Review Required |
| < 60 | High | Rejected |

## Key Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Submit new application |
| GET | `/api/application/{id}` | Full application details |
| GET | `/api/status/{id}` | Lightweight polling status |
| POST | `/api/application/{id}/verify` | Human decision / override |
| POST | `/api/application/{id}/retry` | Retry failed analysis |
| GET | `/api/application/{id}/reasoning` | Lightweight reasoning subset |
| GET | `/api/applications` | List recent applications |

## Failure & Recovery
When processing raises an exception:
1. Status set to `Failed`.
2. User can press Retry → status resets to `Processing` and background task re-runs using cached file paths.
3. Detached instance errors mitigated by early attribute caching (requested_amount, paths, loan_type).

## Frontend Display Model
- Left panel: Score Drivers, Risk Factors, Forensic Evidence, Essay Insights, Reasoning Stream, Decision History.
- Right panel: Single PDF viewer with toggle across Bank / Essay / Payslip.
- Retry button only visible if status = Failed.

## Lightweight Reasoning Endpoint
Returns truncated arrays: score_breakdown (≤15), key_risk_flags (≤25), ai_reasoning_log (≤20) for efficient polling or secondary UI.

## Environment Expectations
- `GEMINI_API_KEY` optional (absence triggers deterministic heuristic path).
- SQLite file: `trustlens.db` auto-created; safe to delete for reset (schema re-initializes).
- Upload directory: `uploads/` structured per application ID.

## Next Improvement Options
1. Add structured error codes in Failed analysis for UI display.
2. Introduce configurable scoring weights via environment / admin panel.
3. Stream incremental extraction logs over WebSocket for live progress.
4. Persist AI vs heuristic mode indicator in `analysis_result`.
5. Add automated unit tests for generate_mock_result edge cases.

## Current Validation Status
- Last reprocess produced High risk (score <60) → Rejected (correct mapping).
- No DetachedInstanceError after caching patch.
- Retry endpoint schedules background task without blocking.

System is aligned with authenticity requirements: all displayed insights & flags source strictly from uploaded document text (or controlled fallback sample strings when extraction fails).

---
This status document supersedes previous versions that referenced removed Financial DNA and radar visualizations.
