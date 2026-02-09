# Oregon Energy Burden Metrics Dashboard

An interactive data visualization tool for monitoring energy affordability metrics across Oregon's regulated utilities, developed to support the Oregon Public Utility Commission's oversight of utility bill discount programs and customer arrears under Docket RO 16.

![Dashboard Preview](docs/dashboard-preview.png)

## Overview

This dashboard consolidates and visualizes data from the Energy Burden Metrics Reports (EBMR) filed by Oregon's six largest regulated utilities pursuant to OAR 860-021-0408. It provides Commission staff, stakeholders, and the public with accessible insights into:

- Customer arrears trends and aging analysis
- Service disconnection patterns
- Bill discount program participation and effectiveness
- Utility-by-utility comparisons

## Data Sources

All data is extracted from official utility filings in OPUC Docket RO 16:

| Utility | Type | Filing Frequency |
|---------|------|------------------|
| Portland General Electric (PGE) | Electric | Monthly |
| Pacific Power (PacifiCorp) | Electric | Monthly |
| Idaho Power | Electric | Monthly |
| NW Natural | Gas | Monthly |
| Cascade Natural Gas | Gas | Monthly |
| Avista Utilities | Gas | Monthly |

**Reporting Period:** January 2024 – September 2025 (21 months)

## Features

- **Multi-tab navigation** across Overview, Arrears, Disconnections, Bill Discount Program, Comparison, Geographic, and Export views
- **Interactive filtering** by utility and time period
- **Trend analysis** with 3-month rolling comparisons
- **Data export** to CSV for further analysis
- **Responsive design** for desktop and tablet viewing
- **Glossary** with official OAR definitions for all metrics

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/oregon-energy-burden-dashboard.git
cd oregon-energy-burden-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Deploying to GitHub Pages

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

Ensure GitHub Pages is enabled in your repository settings, pointing to the `gh-pages` branch.

## Project Structure

```
oregon-energy-burden-dashboard/
├── src/
│   ├── App.jsx          # Main dashboard component
│   └── main.jsx         # React entry point
├── docs/
│   └── methodology.md   # Data methodology documentation
├── public/              # Static assets
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Build configuration
└── README.md
```

## Methodology

See [docs/methodology.md](docs/methodology.md) for detailed documentation on:

- Data extraction procedures
- Calculation methodologies
- Known data limitations
- Update schedule

## Regulatory Context

This dashboard supports the Commission's ongoing oversight of energy affordability programs established under:

- **OAR 860-021-0408** – Energy Burden Metrics Reporting
- **OAR 860-021-0405** – Disconnection Notice Requirements
- **Docket RO 16** – Energy Burden Reduction Programs

## Technology Stack

- **React 18** – UI framework
- **Recharts** – Data visualization
- **Vite** – Build tooling
- **SheetJS (xlsx)** – CSV/Excel export

## Contributing

This dashboard is maintained by OPUC staff. For questions, corrections, or enhancement requests, please contact:

**Bret Farrell**  
Oregon Public Utility Commission  
Bret.Farrell@puc.oregon.gov

## License

This project is released under the MIT License. Data sourced from public utility filings is in the public domain.

---

*Oregon Public Utility Commission | Consumer Services Section*
