# Data Methodology

This document describes the data sources, extraction procedures, and calculation methodologies used in the Oregon Energy Burden Metrics Dashboard.

## Regulatory Framework

The dashboard visualizes data collected under **OAR 860-021-0408**, which requires Oregon's regulated electric and gas utilities to file monthly Energy Burden Metrics Reports (EBMR) with the Public Utility Commission. These reports were established to monitor the effectiveness of bill discount programs and track customer affordability challenges.

## Data Sources

### Primary Sources

All data is extracted directly from utility filings in **OPUC Docket RO 16**. Source files include:

| Utility | File Format | Filing Cadence |
|---------|-------------|----------------|
| Portland General Electric | Excel (.xlsx) | Monthly |
| Pacific Power (PacifiCorp) | Excel (.xlsx), PDF | Monthly |
| NW Natural | Excel (.xlsx) | Monthly |
| Avista Utilities | Excel (.xlsx) | Monthly |
| Cascade Natural Gas | Excel (.xlsx), PDF | Monthly |
| Idaho Power | Excel (.xlsx), PDF | Monthly |

### Reporting Period

- **Start Date:** January 2024
- **End Date:** September 2025 (most recent verified data)
- **Total Months:** 21

### Data Lag

Utilities file EBMR data approximately 30-45 days after month-end. Dashboard updates occur after staff verification of newly filed reports.

## Metric Definitions

All metric definitions conform to **OAR 860-021-0408(1)**. Key terms:

### Arrears Metrics

| Metric | Definition | OAR Reference |
|--------|------------|---------------|
| Arrearage Balance | Any amount of money that a customer owes to the utility company for services provided which remain unpaid past the bill issuance date | (1)(c) |
| Days in Arrears | The number of days from the original bill issuance date a customer's arrearage balance remains unpaid | (1)(i) |
| 31-60 Days | Arrearage balance unpaid for 31-60 days from bill issuance | (1)(i)(A) |
| 61-90 Days | Arrearage balance unpaid for 61-90 days from bill issuance | (1)(i)(B) |
| 91+ Days | Arrearage balance unpaid for more than 90 days from bill issuance | (1)(i)(C) |

### Disconnection Metrics

| Metric | Definition | OAR Reference |
|--------|------------|---------------|
| Service Disconnection | Instances where utility service to a residential account was terminated due to the customer's failure to pay their utility bill | (1)(r) |
| Disconnection Notice | Any written or electronic notification issued by a utility to a customer in accordance with OAR 860-021-0405 | (1)(j) |

### Bill Discount Program Metrics

| Metric | Definition | OAR Reference |
|--------|------------|---------------|
| Total Dollars Provided | The aggregate dollar value of discounts applied to the utility bills of residential customers who participate in the utility's bill discount program | (1)(v) |
| Total Arrears Balance of Participants | The total dollar amount of outstanding balances owed by residential customers enrolled in a utility-administered bill discount program | (1)(s) |

### Usage and Billing Metrics

| Metric | Definition | OAR Reference |
|--------|------------|---------------|
| Average Residential Bill | The average monthly bill for residential utility services within a utility's Oregon service territory | (1)(f) |
| Average Residential Usage | The average monthly amount of energy billed per residential meter within a utility's Oregon service territory | (1)(g) |

## Calculation Methodologies

### Derived Metrics

Some dashboard metrics are derived from reported values:

**Disconnection Rate:**
```
Disconnection Rate (%) = (Monthly Disconnections / Active Residential Accounts) × 100
```

**Reconnection Rate:**
```
Reconnection Rate (%) = (Reconnections within 7 days / Disconnections) × 100
```

**Average Arrears per Customer:**
```
Average Arrears = Total Arrearage Balance / Customers with Arrearage Balance
```

**Bill Discount Arrears Rate:**
```
Arrears Rate (%) = (Participants with Arrears / Total Participants) × 100
```

### Trend Calculations

Trend indicators compare rolling 3-month averages:

- **Current Period:** Most recent 3 months (Jul–Sep 2025)
- **Prior Period:** Previous 3 months (Apr–Jun 2025)
- **Trending Up:** Current average > Prior average by more than 2%
- **Trending Down:** Current average < Prior average by more than 2%
- **Flat:** Change within ±2%

### Weighted Averages

The statewide average residential bill is calculated as a customer-weighted average:

```
Weighted Avg Bill = Σ(Utility Accounts × Utility Avg Bill) / Σ(Utility Accounts)
```

This ensures larger utilities (PGE, Pacific Power) have proportionally greater influence on the statewide figure.

## Data Quality Notes

### Verification Process

All data points are verified against source filings before inclusion. Verification includes:

1. Cross-referencing reported totals against line-item breakdowns
2. Checking for data entry anomalies (e.g., transposed digits, unit errors)
3. Confirming consistency with prior month trends
4. Validating formulas where utilities provide calculated values

### Known Issues

**Pacific Power October 2024:**  
Source file contained a data entry error in the total arrears field ($59.5M instead of $5.95M). Dashboard uses the correct value calculated from the sum of age bucket breakdowns.

**Idaho Power November–December 2024:**  
Bill discount program launched in late 2024. Initial enrollment figures (1 participant in Nov, 40 in Dec) are accurate despite appearing anomalous.

### Data Gaps

- **Idaho Power (Jan–Oct 2024):** Bill discount program not yet active; values are 0.
- **Geographic data:** ZIP-code level data available only for utilities that report at that granularity.

## Update Schedule

| Activity | Frequency | Typical Timing |
|----------|-----------|----------------|
| Utility EBMR filings | Monthly | 30-45 days after month-end |
| Dashboard data update | Monthly | Within 2 weeks of filing |
| Full data audit | Quarterly | Following Q1, Q2, Q3, Q4 filings |

## Contact

For questions about data methodology or to report potential errors:

**Bret Farrell**  
Oregon Public Utility Commission  
Bret.Farrell@puc.oregon.gov

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial release with Jan 2024–Sep 2025 data |

---

*Oregon Public Utility Commission | Consumer Services Section*
