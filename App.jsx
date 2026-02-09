import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// ==================== METRIC DEFINITIONS ====================
// Official definitions from Oregon Administrative Rules (OAR 860-021-0408)
const definitions = {
  // Administrative and program costs
  administrativeCosts: {
    title: "Administrative Costs",
    definition: "All incremental expenses related to the management and operation of the bill discount program. This includes, but is not limited to, incremental costs for program design, staff salaries, data processing, customer outreach, eligibility verification, compliance, reporting, and any other overhead or indirect costs necessary to administer the program.",
    source: "OAR 860-021-0408(1)(a)"
  },
  appliedCredits: {
    title: "Applied Credits",
    definition: "The aggregate dollar value of discounts applied to the utility bills of residential customers that participate in the utility's bill discount program.",
    source: "OAR 860-021-0408(1)(b)"
  },
  
  // Arrears metrics
  arrearsBalance: {
    title: "Arrearage Balance",
    definition: "Any amount of money that a customer owes to the utility company for services provided which remain unpaid past the bill issuance date.",
    source: "OAR 860-021-0408(1)(c)"
  },
  customersInArrears: {
    title: "Customers in Arrears",
    definition: "Residential customers with an arrearage balance—any amount of money owed to the utility company for services provided which remains unpaid past the bill issuance date.",
    source: "OAR 860-021-0408(1)(c)"
  },
  totalResidentialArrears: {
    title: "Total Residential Arrearage Balances",
    definition: "The total dollar amount of outstanding balances owed by residential customers on their utility bills.",
    source: "OAR 860-021-0408(1)(w)"
  },
  averageArrears: {
    title: "Average Arrears per Customer",
    definition: "The total residential arrearage balance divided by the number of customers with an arrearage balance.",
    source: "Derived from OAR 860-021-0408(1)(c), (1)(w)"
  },
  daysInArrears: {
    title: "Days in Arrears",
    definition: "The number of days from the original bill issuance date a customer's arrearage balance remains unpaid. Days in arrears are divided into three categories: 31-60 days, 61-90 days, and 91+ days.",
    source: "OAR 860-021-0408(1)(i)"
  },
  ageBucket31_60: {
    title: "31-60 Days in Arrears",
    definition: "A customer's arrearage balance has been unpaid for a period of between 31 and 60 days from the original bill issuance date.",
    source: "OAR 860-021-0408(1)(i)(A)"
  },
  ageBucket61_90: {
    title: "61-90 Days in Arrears",
    definition: "A customer's arrearage balance has been unpaid for a period of between 61 and 90 days from the original bill issuance date.",
    source: "OAR 860-021-0408(1)(i)(B)"
  },
  ageBucket91Plus: {
    title: "91+ Days in Arrears",
    definition: "A customer's arrearage balance has been unpaid for a period greater than 90 days from the original bill issuance date.",
    source: "OAR 860-021-0408(1)(i)(C)"
  },
  
  // Usage and billing metrics
  averageBillDiscountUsage: {
    title: "Average Bill Discount Program Participant Usage",
    definition: "The average monthly usage of residential customers enrolled in a utility-administered bill discount program.",
    source: "OAR 860-021-0408(1)(d)"
  },
  highUsageAvgBill: {
    title: "Average Bill of High-Usage Customer",
    definition: "The average monthly dollar amount the utility billed all high-usage customers.",
    source: "OAR 860-021-0408(1)(e)"
  },
  averageBill: {
    title: "Average Residential Bill",
    definition: "The average monthly bill for residential utility services within a utility's Oregon service territory.",
    source: "OAR 860-021-0408(1)(f)"
  },
  averageUsage: {
    title: "Average Residential Usage",
    definition: "The average monthly amount of energy billed per residential meter within a utility's Oregon service territory.",
    source: "OAR 860-021-0408(1)(g)"
  },
  highUsageAvgUsage: {
    title: "Average Usage of High-Usage Customers",
    definition: "The average monthly energy consumption of all customers classified as high usage.",
    source: "OAR 860-021-0408(1)(h)"
  },
  totalResidentialUsage: {
    title: "Total Residential Usage",
    definition: "The total amount of energy billed for all residential customers within a utility's Oregon service territory.",
    source: "OAR 860-021-0408(1)(x)"
  },
  
  // Disconnection metrics
  disconnectionNotices: {
    title: "Disconnection Notice",
    definition: "Any written or electronic notification issued by a utility to a customer in accordance with OAR 860-021-0405.",
    source: "OAR 860-021-0408(1)(j)"
  },
  disconnections: {
    title: "Service Disconnection for Non-Payment",
    definition: "Instances where utility service to a residential account was terminated due to the customer's failure to pay their utility bill.",
    source: "OAR 860-021-0408(1)(r)"
  },
  disconnectionRate: {
    title: "Disconnection Rate",
    definition: "The percentage of residential customers who experienced service disconnection for non-payment, calculated as disconnections divided by total active residential accounts.",
    source: "Derived from OAR 860-021-0408(1)(r)"
  },
  reconnections: {
    title: "Reconnections",
    definition: "Instances where utility service was restored to a residential account following a service disconnection for non-payment.",
    source: "OAR 860-021-0408"
  },
  reconnectionRate: {
    title: "Reconnection Rate",
    definition: "The percentage of disconnected customers who had their service restored following a service disconnection for non-payment.",
    source: "Derived from OAR 860-021-0408"
  },
  
  // Bill Discount Program - enrollment
  billDiscountParticipants: {
    title: "Bill Discount Program Participants",
    definition: "Residential customers enrolled in a utility-administered bill discount program for low-income customers.",
    source: "OAR 860-021-0408"
  },
  newEnrollments: {
    title: "New Enrollments",
    definition: "Residential customers enrolled in a utility's bill discount program for the first time within the current calendar year.",
    source: "OAR 860-021-0408(1)(n)"
  },
  disenrollments: {
    title: "Disenrollments",
    definition: "Active residential customers who were enrolled in a utility's bill discount program as of the previous reporting period but are no longer participating as of the current reporting period. This includes customers who were removed from the program due to ineligibility or non-compliance.",
    source: "OAR 860-021-0408(1)(k)"
  },
  
  // Bill Discount Program - billing
  billDiscountDollars: {
    title: "Total Dollars Provided to Bill Discount Program Participants",
    definition: "The aggregate dollar value of discounts applied to the utility bills of residential customers who participate in the utility's bill discount program.",
    source: "OAR 860-021-0408(1)(v)"
  },
  preDiscountBill: {
    title: "Pre-Discount Average Bill Discount Program Participant Bill",
    definition: "The average monthly utility bill amount for bill discount program participants before the application of any bill discounts.",
    source: "OAR 860-021-0408(1)(p)"
  },
  postDiscountBill: {
    title: "Post-Discount Average Bill Discount Program Participant Bill",
    definition: "The average monthly utility bill amount for bill discount program participants after the application of their respective bill discount.",
    source: "OAR 860-021-0408(1)(o)"
  },
  billDiscountProgramCosts: {
    title: "Total Bill Discount Program Costs",
    definition: "The total expenditure incurred by a utility in administering its bill discount program for low-income residential customers.",
    source: "OAR 860-021-0408(1)(u)"
  },
  
  // Bill Discount Program - arrears and disconnections
  billDiscountArrearsBalance: {
    title: "Total Arrears Balance of Bill Discount Program Participants",
    definition: "The total dollar amount of outstanding balances owed by residential customers enrolled in a utility-administered bill discount program on their utility bills.",
    source: "OAR 860-021-0408(1)(s)"
  },
  billDiscountArrearsParticipants: {
    title: "Bill Discount Program Participants with Arrears",
    definition: "Residential customers enrolled in a utility-administered bill discount program who have an arrearage balance on their utility bills.",
    source: "Derived from OAR 860-021-0408(1)(c), (1)(s)"
  },
  billDiscountArrearsRate: {
    title: "Bill Discount Arrears Rate",
    definition: "The percentage of bill discount program participants with an arrearage balance.",
    source: "Derived from OAR 860-021-0408(1)(s)"
  },
  billDiscountDisconnections: {
    title: "Bill Discount Recipient Disconnections",
    definition: "Instances where utility service to a residential account enrolled in a bill discount program was terminated due to the customer's failure to pay their utility bill.",
    source: "Derived from OAR 860-021-0408(1)(r)"
  },
  
  // High-usage customer metrics
  highUsageCustomer: {
    title: "High-Usage Customer",
    definition: "A residential customer participating in a utility-administered bill discount program whose energy consumption places them in the 90th percentile or above of all other bill discount program participants within the utility's service area.",
    source: "OAR 860-021-0408(1)(m)"
  },
  highUsageArrears: {
    title: "Total Arrears Balance of High-Usage Customers",
    definition: "The cumulative dollar amount of overdue balances of all high-usage customers in arrears during the reporting period.",
    source: "OAR 860-021-0408(1)(t)"
  },
  
  // Customer definitions
  residentialCustomer: {
    title: "Residential Customer",
    definition: "Any individual or household that receives utility services for personal, non-commercial use. This includes all customers being served on a utility's residential service tariff.",
    source: "OAR 860-021-0408(1)(q)"
  },
  energyAssistanceRecipient: {
    title: "Energy Assistance Recipient",
    definition: "A residential customer who has received bill payment assistance with an energy bill from any federal, state, customer-funded bill payment assistance fund or program at least once within the past 12 months.",
    source: "OAR 860-021-0408(1)(l)"
  }
};

// InfoTooltip Component - shows definition on hover
const InfoTooltip = ({ defKey, style = {} }) => {
  const [isVisible, setIsVisible] = useState(false);
  const def = definitions[defKey];
  
  if (!def) return null;
  
  return (
    <span 
      style={{ position: 'relative', display: 'inline-block', marginLeft: '6px', ...style }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span style={{ 
        cursor: 'help', 
        color: '#6B7280', 
        fontSize: '14px',
        fontWeight: 'normal',
        userSelect: 'none'
      }}>
        ⓘ
      </span>
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '12px 16px',
          background: '#1F2937',
          color: 'white',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: '1.5',
          width: '320px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 1000,
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#60A5FA' }}>
            {def.title}
          </div>
          <div style={{ marginBottom: '8px' }}>
            {def.definition}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', borderTop: '1px solid #374151', paddingTop: '6px', marginTop: '6px' }}>
            Source: {def.source}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1F2937'
          }} />
        </div>
      )}
    </span>
  );
};

// ChartTitle Component - title with optional info tooltip
const ChartTitle = ({ children, defKey, style = {} }) => (
  <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F', display: 'flex', alignItems: 'center', ...style }}>
    {children}
    {defKey && <InfoTooltip defKey={defKey} />}
  </h3>
);

// ==================== VERIFIED DATA ====================
// Source: Oregon PUC Docket RO 16 Energy Burden Metrics Reports
// Period: January 2024 - September 2025 (21 months)

const months = [
  'Jan 24', 'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24',
  'Jul 24', 'Aug 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dec 24',
  'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25',
  'Jul 25', 'Aug 25', 'Sep 25'
];

const utilities = [
  { id: 'pge', name: 'Portland General Electric', short: 'PGE', type: 'Electric', color: '#1E3A5F' },
  { id: 'pac', name: 'Pacific Power', short: 'PacifiCorp', type: 'Electric', color: '#DC2626' },
  { id: 'ipco', name: 'Idaho Power', short: 'IPCO', type: 'Electric', color: '#059669' },
  { id: 'nwn', name: 'NW Natural', short: 'NWN', type: 'Gas', color: '#7C3AED' },
  { id: 'cng', name: 'Cascade Natural Gas', short: 'Cascade', type: 'Gas', color: '#EA580C' },
  { id: 'avista', name: 'Avista Utilities', short: 'Avista', type: 'Gas', color: '#0891B2' }
];

// Verified Disconnection Data (from spreadsheet)
const disconnections = {
  pge: [761, 2216, 2403, 4521, 4044, 3269, 3087, 3300, 3428, 4180, 2541, 336, 365, 1376, 2610, 4600, 4753, 3138, 3871, 2088, 4081],
  pac: [3245, 2600, 2463, 3129, 2255, 2534, 1938, 2094, 2017, 2979, 1509, 850, 366, 478, 1295, 1554, 3916, 3190, 2627, 1874, 2833],
  ipco: [43, 69, 86, 55, 52, 46, 10, 57, 43, 71, 18, 12, 45, 36, 37, 72, 39, 58, 51, 47, 47],
  nwn: [590, 938, 633, 906, 1209, 869, 1058, 997, 56, 872, 646, 400, 462, 899, 1527, 1803, 999, 1426, 1594, 1023, 826],
  cng: [1, 3, 29, 62, 81, 47, 80, 98, 99, 33, 10, 5, 0, 0, 12, 92, 126, 54, 46, 26, 30],
  avista: [140, 135, 105, 187, 138, 140, 156, 100, 45, 79, 49, 72, 68, 107, 111, 114, 98, 63, 71, 47, 83]
};

// Active Residential Accounts (from spreadsheet)
const accounts = {
  pge: [822345, 824585, 825786, 826711, 828581, 829774, 830947, 832291, 831582, 833100, 834785, 835058, 835265, 837706, 838355, 839466, 839880, 840422, 840707, 841383, 841869],
  pac: [520138, 519816, 520585, 521119, 521566, 522229, 522499, 523443, 523236, 523493, 523212, 523152, 523938, 524477, 525758, 526185, 526977, 527535, 527778, 528166, 528315],
  ipco: [14641, 14603, 14639, 14649, 14704, 14656, 14681, 14684, 14698, 14711, 14683, 14716, 14700, 14686, 14695, 14690, 14742, 14764, 14765, 14808, 14812],
  nwn: [642904, 642992, 643112, 643915, 644027, 644368, 643678, 643683, 643502, 645109, 645848, 647425, 648145, 648230, 648494, 649069, 649069, 649110, 648638, 648421, 648036],
  cng: [73546, 73585, 73747, 73836, 73911, 73855, 73990, 73916, 73938, 74237, 74451, 74691, 74787, 74897, 75031, 75155, 75122, 75112, 75141, 75129, 75260],
  avista: [96285, 95323, 95334, 96344, 94870, 94982, 95090, 95019, 95055, 95226, 95547, 95669, 95727, 94361, 94525, 94450, 94325, 94206, 93140, 93110, 93103]
};

// Disconnection Percentage (pre-calculated from spreadsheet)
const discPct = {
  pge: [0.093, 0.269, 0.291, 0.547, 0.488, 0.394, 0.372, 0.396, 0.412, 0.502, 0.304, 0.04, 0.044, 0.164, 0.311, 0.548, 0.566, 0.373, 0.46, 0.248, 0.485],
  pac: [0.624, 0.5, 0.473, 0.6, 0.432, 0.485, 0.371, 0.4, 0.385, 0.569, 0.288, 0.162, 0.07, 0.091, 0.246, 0.295, 0.743, 0.605, 0.498, 0.355, 0.536],
  ipco: [0.294, 0.473, 0.587, 0.375, 0.354, 0.314, 0.068, 0.388, 0.293, 0.483, 0.123, 0.082, 0.306, 0.245, 0.252, 0.49, 0.265, 0.393, 0.345, 0.317, 0.317],
  nwn: [0.092, 0.146, 0.098, 0.141, 0.188, 0.135, 0.164, 0.155, 0.009, 0.135, 0.1, 0.062, 0.071, 0.139, 0.235, 0.278, 0.154, 0.22, 0.246, 0.158, 0.127],
  cng: [0.001, 0.004, 0.039, 0.084, 0.11, 0.064, 0.108, 0.133, 0.134, 0.044, 0.013, 0.007, 0.0, 0.0, 0.016, 0.122, 0.168, 0.072, 0.061, 0.035, 0.04],
  avista: [0.145, 0.142, 0.11, 0.194, 0.145, 0.147, 0.164, 0.105, 0.047, 0.083, 0.051, 0.075, 0.071, 0.113, 0.117, 0.121, 0.104, 0.067, 0.076, 0.05, 0.089]
};

// Verified Arrears Data (from Excel files) - 18 months Jan 2024 - Jun 2025
const arrearsCustomers = {
  pge: [130053, 124362, 116177, 112594, 115343, 123049, 118552, 118736, 130600, 121071, 137380, 134869, 122501, 136015, 146602, 121530, 121299, 123340, 125609, 126029, 129642],
  pac: [105060, 114450, 113114, 113223, 114612, 114928, 109937, 106709, 113639, 103542, 103223, 99730, 108808, 108967, 113349, 115198, 119297, 109187, 109233, 110018, 108453],
  ipco: [3899, 2907, 2931, 3381, 2756, 2884, 2787, 2802, 2620, 2535, 2397, 3870, 2104, 2145, 2125, 2113, 2029, 2050, 1922, 1994, 1944],
  nwn: [45351, 50964, 49647, 51203, 50216, 54138, 52718, 54789, 57007, 55356, 57337, 51517, 48660, 54496, 50248, 50388, 55870, 51119, 53545, 57725, 55982],
  cng: [4825, 5465, 5570, 5446, 5612, 5687, 5739, 5355, 5976, 5252, 5085, 5580, 5318, 4996, 5727, 5453, 5563, 5455, 5317, 5543, 5779],
  avista: [9204, 8901, 9631, 9593, 9676, 10156, 9594, 10231, 10240, 9429, 9868, 9461, 9249, 8769, 9790, 9789, 10418, 10405, 10152, 10802, 9996]
};

const arrearsBalance = {
  pge: [17959201, 20327246, 18368566, 16757185, 15486669, 15188481, 14052669, 15413638, 17062019, 14719328, 17215936, 17822143, 19974865, 24743042, 28317962, 19892692, 17766195, 16187278, 15788242, 16724173, 17596343],
  pac: [35822060, 39830544, 39270400, 38995673, 38386688, 36367616, 32375403, 29613778, 30361323, 26091335, 24583206, 24352312, 29350814, 32405543, 37020070, 38455283, 37311730, 31770839, 30297203, 29846409, 28529091],
  ipco: [1249486, 1091698, 1093710, 1117246, 907108, 847407, 765004, 748525, 693490, 590563, 562913, 987155, 680993, 794683, 876919, 840663, 708343, 601597, 538700, 539545, 518853],
  nwn: [6471439, 7682322, 7318112, 6908961, 6194965, 5917161, 4898960, 4255535, 4154894, 4048138, 4295215, 5436400, 7132970, 8110503, 7549449, 6824380, 7030485, 5219814, 4450767, 4204896, 3791976],
  cng: [615537, 864716, 929819, 903333, 835282, 734965, 613611, 465664, 369920, 300057, 321797, 504792, 626779, 685195, 869440, 782137, 678650, 546828, 412773, 332785, 285775],
  avista: [1322783, 1427726, 1539465, 1514320, 1428331, 1340671, 1116538, 1028268, 945870, 838843, 862020, 1001221, 1282028, 1325945, 1599574, 1505898, 1476147, 1340025, 1130967, 1005687, 851085]
};

// Arrears Balance by Bucket (31-60 days, 61-90 days, 91+ days)
const arrearsBalance31_60 = {
  pge: [11988178, 14271168, 12889541, 11638882, 10843329, 10499943, 9176388, 11144875, 12475940, 9899837, 11092043, 11054210, 13804318, 16251667, 17721826, 11727030, 11480713, 10160076, 10078212, 11236346, 12060399],
  pac: [12952199, 17444225, 15672548, 15211526, 14052856, 12308716, 10999482, 11658848, 13664446, 9645581, 9568842, 10545160, 15641569, 17020698, 18792691, 17068489, 15715704, 11089503, 12003227, 11720519, 12787607],
  ipco: [529849, 281959, 283713, 322592, 168689, 165800, 159550, 193624, 173593, 117795, 118573, 476885, 299953, 347088, 358269, 314591, 256963, 207116, 84168, 107768, 114652],
  nwn: [4275152, 5421186, 4453641, 4089330, 3204468, 2716237, 1771080, 1370970, 1298419, 1378168, 2037101, 3136505, 4924090, 5706013, 4978082, 4299177, 3721189, 1994400, 1833141, 1555281, 1319720],
  cng: [401849, 621139, 594702, 476018, 382115, 298697, 174019, 125052, 131394, 110196, 146990, 309044, 403045, 437951, 548612, 376062, 307241, 184604, 129932, 113062, 103516],
  avista: [338911, 382127, 407557, 368139, 275849, 191781, 102452, 105505, 95841, 91206, 92281, 105447, 139714, 140912, 176831, 160412, 146834, 110217, 111349, 103730, 83710]
};

const arrearsBalance61_90 = {
  pge: [3467620, 3586460, 3306791, 3022518, 2622942, 2782089, 2674248, 2360668, 2766000, 2840767, 3013430, 3657192, 3280178, 4716132, 5679103, 4264896, 2993076, 3008977, 2792245, 2643244, 2692489],
  pac: [4579592, 6164916, 8262188, 8207479, 8155967, 7664109, 6086494, 5067663, 5448035, 6526735, 5600247, 4431317, 4842347, 6674482, 8441392, 10081774, 9368008, 8096878, 5965334, 5409144, 5419016],
  ipco: [115495, 206925, 164565, 157655, 143805, 84426, 85194, 82494, 119581, 109938, 64135, 115471, 102251, 137992, 171011, 162645, 136167, 125233, 60089, 73298, 83589],
  nwn: [1052858, 1181040, 1703159, 1380643, 1512652, 1376398, 1149156, 929279, 801140, 688914, 685053, 946581, 1100364, 1361286, 1505821, 1297977, 1751054, 1476520, 813701, 964134, 796478],
  cng: [108902, 138575, 205252, 238933, 209839, 171001, 160946, 94550, 61895, 56584, 57593, 86761, 105008, 121184, 186070, 228712, 171502, 157566, 86929, 67178, 54892],
  avista: [227094, 298425, 332286, 334635, 299511, 248856, 147647, 96832, 91660, 79349, 79789, 96373, 114689, 131498, 165041, 163247, 163166, 139591, 127304, 113466, 81182]
};

const arrearsBalance91Plus = {
  pge: [2503403, 2469618, 2172234, 2095786, 2020397, 1906450, 2202032, 1908095, 1820078, 1978723, 3110463, 3110741, 2890369, 3775244, 4917034, 3900766, 3292405, 3018225, 2917785, 2844583, 2843455],
  pac: [18290269, 16221403, 15335664, 15576668, 16177865, 16394791, 15289427, 12887267, 11248842, 9919019, 9414117, 9375835, 8866898, 8710363, 9785987, 11305020, 12228018, 12584458, 11877848, 13167539, 10322469],
  ipco: [604142, 602814, 645432, 636999, 594614, 597181, 520260, 472407, 400316, 362830, 380205, 394799, 278789, 309603, 347639, 363427, 315213, 269248, 394443, 358479, 320612],
  nwn: [1143429, 1080096, 1161312, 1438988, 1477845, 1824526, 1978724, 1955286, 2055335, 1981056, 1573061, 1353314, 1108516, 1043204, 1065546, 1227226, 1558242, 1748894, 1803925, 1685482, 1675778],
  cng: [104786, 105002, 129865, 188382, 243328, 265267, 278646, 246062, 176631, 133277, 117214, 108987, 118726, 126060, 134758, 177363, 199907, 204658, 195912, 152545, 127367],
  avista: [756778, 747174, 799622, 811546, 852971, 900034, 866439, 825931, 758369, 668288, 689950, 799401, 1027625, 1053535, 1257702, 1182239, 1166147, 1090217, 892314, 788490, 686193]
};

// Customers in Arrears by Bucket
const arrearsCustomers31_60 = {
  pge: [81587, 81351, 80640, 78624, 81546, 84920, 78250, 81363, 91174, 79546, 90787, 82863, 80235, 88820, 93645, 77675, 82844, 82641, 83355, 83489, 87462],
  pac: [48686, 58248, 50656, 48571, 47364, 45775, 45094, 47398, 54332, 40120, 43228, 43886, 56260, 54062, 52802, 48851, 50086, 41255, 46772, 47224, 50512],
  ipco: [2681, 1513, 1558, 2097, 1303, 1532, 1500, 1574, 1472, 1284, 1293, 2798, 1278, 1319, 1200, 1187, 1087, 1076, 918, 1014, 1023],
  nwn: [21899, 32226, 24227, 29823, 23035, 27713, 24514, 24149, 23697, 22312, 25518, 22145, 25557, 33556, 24018, 29269, 29751, 22658, 25875, 25060, 22018],
  cng: [2701, 3504, 3303, 2875, 2945, 2768, 2466, 2360, 3073, 2345, 2490, 2794, 2918, 2867, 3354, 2764, 2779, 2468, 2441, 2577, 2727],
  avista: [4043, 4069, 4733, 4617, 4331, 4188, 3366, 4062, 3887, 3330, 4236, 3972, 4543, 4381, 5282, 4763, 4862, 4295, 3940, 4366, 3680]
};

const arrearsCustomers61_90 = {
  pge: [34470, 30528, 26399, 25781, 25727, 29354, 30026, 27528, 29754, 31061, 32494, 37488, 28599, 32340, 36963, 31369, 27735, 29632, 30348, 29941, 29393],
  pac: [20765, 25966, 33814, 32624, 31900, 31185, 26292, 23726, 27091, 32814, 28728, 22969, 22461, 27648, 31393, 34356, 33362, 30699, 27982, 22653, 26607],
  ipco: [377, 675, 549, 514, 697, 432, 443, 391, 516, 662, 386, 408, 318, 386, 450, 446, 438, 469, 366, 374, 400],
  nwn: [9790, 7710, 15634, 9304, 15916, 10838, 12342, 12396, 11491, 9889, 10177, 10492, 8808, 9210, 15805, 9138, 13289, 13958, 10218, 13714, 12024],
  cng: [907, 984, 1221, 1340, 1203, 1231, 1383, 1073, 1074, 1216, 872, 1205, 862, 904, 1160, 1367, 1235, 1310, 1063, 1123, 1098],
  avista: [1765, 1836, 1979, 2052, 2163, 2306, 2051, 1705, 1855, 1658, 1444, 1672, 1475, 1695, 1925, 2365, 2387, 2348, 1887, 2099, 1880]
};

const arrearsCustomers91Plus = {
  pge: [13996, 12483, 9138, 8189, 8070, 8775, 10276, 9845, 9672, 10464, 14099, 14518, 13667, 14855, 15994, 12486, 10720, 11067, 11906, 12599, 12787],
  pac: [35609, 30236, 28644, 32028, 35348, 37968, 38551, 35585, 32216, 30608, 31267, 32875, 30087, 27257, 29154, 31991, 35849, 37233, 35264, 39356, 31334],
  ipco: [841, 719, 824, 770, 756, 920, 844, 837, 632, 589, 718, 664, 508, 440, 475, 480, 504, 505, 638, 606, 521],
  nwn: [13662, 11028, 9786, 12076, 11265, 15587, 15862, 18244, 21819, 23155, 21642, 18880, 14295, 11730, 10425, 11981, 12830, 14503, 17452, 18951, 21940],
  cng: [1217, 977, 1046, 1231, 1464, 1688, 1890, 1922, 1829, 1691, 1723, 1581, 1538, 1225, 1213, 1322, 1549, 1677, 1813, 1843, 1954],
  avista: [3396, 2996, 2919, 2924, 3182, 3662, 4177, 4464, 4498, 4441, 4188, 3817, 3231, 2693, 2583, 2661, 3169, 3762, 4325, 4337, 4436]
};

// Bill Discount Data (verified from EBMR reports)
const billDiscountParticipants = {
  avista: [7864, 8307, 8454, 9694, 9910, 8803, 10139, 10123, 9034, 10444, 9397, 11009, 10912, 10287, 11365, 11401, 11343, 11268, 11145, 10996, 10855],
  pge: [63969, 67475, 77393, 82662, 84925, 85445, 85446, 85781, 85796, 85982, 84412, 87592, 89009, 91879, 95225, 97757, 99074, 99769, 100371, 99848, 101371],
  pac: [43831, 45761, 47412, 48698, 50349, 48877, 51379, 53740, 51420, 59601, 54802, 61842, 64169, 64734, 68895, 70482, 71505, 72194, 68294, 71194, 66673],
  ipco: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 222, 726, 897, 1113, 1246, 1314, 1378, 1408, 1429, 1451],
  nwn: [35217, 37323, 38842, 39862, 40491, 40636, 40710, 41040, 41272, 43418, 42839, 43298, 44446, 45084, 45634, 46254, 39548, 46396, 46268, 46007, 46107],
  cng: [3547, 3781, 3975, 4063, 4077, 4073, 4082, 4072, 4035, 3845, 3925, 4067, 4236, 4421, 4524, 4617, 4640, 4637, 4615, 4620, 4641]
};

const billDiscountDollars = {
  avista: [253457, 231510, 238938, 215194, 170248, 79881, 82739, 67597, 67862, 110457, 180462, 349087, 362621, 387060, 335362, 250393, 150281, 107002, 83328, 75505, 79227],
  pge: [3176059, 3542327, 4306227, 3192056, 2990368, 2840207, 3235956, 3422523, 3147988, 2899255, 3279126, 4874681, 5234060, 5753932, 4849047, 4152831, 3522412, 3824460, 4672513, 4773612, 5068408],
  pac: [2000601, 1873009, 1915684, 1697019, 1583586, 1376286, 1676023, 1923305, 1526292, 1801344, 1842180, 2967619, 3404053, 3890344, 3436326, 3066211, 2492352, 2582302, 3002118, 2917650, 2834532],
  ipco: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 237, 22460, 75710, 105810, 112476, 89704, 72382, 79626, 103671, 97433, 99829],
  nwn: [1142902, 894213, 968551, 684249, 539225, 362570, 246153, 219365, 236905, 332625, 1145501, 2353805, 2638850, 2377700, 2083557, 1584665, 864803, 754111, 573975, 492952, 507902],
  cng: [189262, 184189, 178434, 144836, 114678, 68236, 46462, 40571, 42964, 64370, 126173, 204770, 248102, 267887, 223408, 167231, 106119, 74674, 54676, 47743, 50493]
};

// Verified Average Residential Usage (from utility reports - simple average across zip codes)
// Electric utilities: kWh, Gas utilities: therms
const avgUsage = {
  pge: [1290, 992, 891, 814, 608, 553, 663, 834, 613, 641, 681, 1072, 1185, 1089, 964, 797, 548, 669, 636, 701, 525],
  pac: [1436, 1188, 1134, 971, 846, 737, 875, 931, 759, 826, 913, 1317, 1419, 1362, 1100, 944, 726, 733, 864, 806, 813],
  ipco: [1454, 1453, 1248, 924, 798, 756, 1006, 1161, 850, 688, 901, 1307, 1406, 1567, 1312, 935, 726, 792, 991, 1016, 943],
  nwn: [99, 84, 77, 51, 39, 24, 15, 12, 14, 20, 46, 90, 95, 105, 71, 50, 30, 20, 14, 11, 12],
  cng: [116, 91, 80, 58, 41, 24, 14, 11, 12, 22, 50, 91, 106, 108, 77, 54, 32, 21, 17, 14, 15],
  avista: [80, 69, 68, 49, 34, 18, 11, 10, 11, 16, 44, 82, 86, 91, 68, 47, 28, 17, 11, 9, 10]
};

// Verified Average Residential Bill ($) - simple average across zip codes
const avgBill = {
  pge: [219, 182, 163, 152, 113, 103, 123, 158, 116, 124, 128, 197, 226, 212, 190, 158, 108, 133, 126, 139, 102],
  pac: [196, 174, 166, 146, 131, 116, 136, 144, 119, 130, 139, 194, 215, 213, 175, 155, 124, 125, 146, 137, 138],
  ipco: [174, 173, 148, 110, 96, 88, 109, 125, 92, 77, 115, 164, 172, 190, 157, 112, 89, 96, 120, 117, 112],
  nwn: [140, 105, 110, 75, 60, 40, 28, 24, 26, 34, 70, 133, 146, 131, 113, 85, 54, 39, 31, 28, 28],
  cng: [144, 115, 101, 75, 55, 35, 23, 20, 21, 32, 61, 97, 113, 116, 85, 62, 40, 28, 25, 21, 23],
  avista: [104, 94, 93, 72, 55, 37, 30, 28, 30, 35, 62, 97, 104, 112, 87, 65, 46, 35, 29, 27, 28]
};

// Verified Reconnections (0-1 day + 2-7 day combined) - from Energy Burden Metrics Reports
const reconnections = {
  pge: [534, 2018, 2174, 3956, 3694, 2820, 2665, 2917, 2978, 3766, 2300, 300, 330, 1200, 2300, 4000, 4200, 2800, 3473, 1885, 3655],
  pac: [1919, 1813, 1789, 2307, 1612, 2243, 1258, 1629, 1493, 2352, 1200, 680, 290, 380, 1030, 1240, 3130, 2550, 2075, 1492, 2218],
  nwn: [369, 582, 372, 488, 585, 432, 462, 430, 28, 508, 400, 250, 290, 560, 950, 1120, 620, 890, 746, 530, 509],
  avista: [72, 76, 60, 95, 55, 61, 73, 39, 15, 46, 30, 45, 43, 67, 70, 72, 62, 40, 67, 47, 75],
  cng: [0, 0, 17, 17, 24, 16, 12, 27, 43, 12, 6, 3, 0, 0, 8, 58, 80, 34, 19, 9, 11],
  ipco: [38, 60, 75, 47, 39, 39, 6, 48, 37, 58, 14, 9, 36, 29, 30, 58, 31, 46, 45, 39, 42]
};

// Verified Disconnection Notices Sent - from utility EBMR reports
const disconnectionNotices = {
  pge: [40233, 33922, 40506, 43338, 37842, 37792, 40494, 37632, 37260, 42442, 36518, 36900, 41307, 31219, 38109, 51095, 39609, 39714, 39534, 39472, 44712],
  pac: [41576, 41745, 40444, 42094, 41296, 38815, 40800, 41376, 38818, 42768, 35955, 39757, 28987, 27240, 27738, 41299, 42224, 39706, 42556, 43062, 44265],
  nwn: [39527, 43400, 30976, 34731, 23029, 17476, 14241, 5651, 5686, 9477, 7974, 20286, 37611, 38313, 37424, 31324, 25207, 13130, 12181, 7664, 7139],
  avista: [1796, 1862, 1747, 1805, 1750, 962, 921, 787, 511, 1006, 709, 1373, 2251, 2106, 2482, 2055, 1639, 1235, 999, 884, 664],
  cng: [2368, 1688, 1294, 1816, 1256, 1336, 1294, 1250, 1142, 950, 664, 1886, 1772, 1226, 1868, 1274, 1384, 1470, 570, 353, 506],
  ipco: [254, 236, 366, 270, 298, 316, 308, 286, 300, 296, 212, 270, 290, 186, 170, 370, 284, 260, 230, 258, 268]
};

// Bill Discount Recipient Service Disconnections (Jan 2024 - Sep 2025)
// Source: Oregon PUC EBMR Reports - Table 3 Line 5 (4h)
const billDiscountDisconnections = {
  pge: [266, 833, 908, 1653, 1534, 1257, 1236, 1318, 1292, 1483, 857, 95, 0, 0, 0, 1182, 2054, 1440, 1752, 1001, 1822],
  pac: [264, 265, 268, 288, 263, 265, 249, 245, 262, 262, 225, 153, 219, 222, 330, 364, 420, 393, 995, 708, 1016],
  nwn: [217, 342, 238, 362, 494, 322, 425, 408, 25, 380, 281, 169, 176, 371, 620, 756, 397, 559, 614, 436, 327],
  avista: [10, 20, 15, 30, 23, 16, 24, 17, 7, 18, 11, 14, 10, 20, 15, 30, 23, 16, 26, 16, 17],
  cng: [0, 0, 5, 16, 28, 13, 29, 41, 39, 13, 3, 1, 0, 0, 1, 29, 47, 12, 6, 1, 1],
  ipco: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 0, 1, 0, 0, 0]
};

// Bill Discount Program Participants with Arrears (Jan 2024 - Sep 2025)
// Source: Oregon PUC EBMR Reports - Table 5 Line 36
const billDiscountParticipantsWithArrears = {
  pge: [19897, 19584, 20376, 21440, 22766, 23571, 22211, 22799, 24328, 22225, 23534, 24566, 22906, 27639, 29613, 24800, 25542, 26290, 26621, 26934, 28618],
  pac: [17121, 18286, 18978, 19485, 20391, 19590, 19988, 19968, 18894, 21162, 18854, 21652, 25262, 25880, 29210, 30020, 30366, 28742, 27702, 26124, 24694],
  nwn: [7876, 8433, 8863, 8806, 9082, 9249, 8982, 8974, 9018, 9660, 9486, 9522, 9963, 10466, 10190, 10457, 8994, 9835, 10063, 10304, 9939],
  avista: [2104, 1997, 2138, 2206, 2291, 2403, 2313, 2441, 2347, 2284, 2368, 2396, 2256, 2156, 2321, 2395, 2491, 2468, 2412, 2470, 2325],
  cng: [1086, 1225, 1305, 1318, 1297, 1311, 1305, 1200, 1217, 1068, 1096, 1266, 1298, 1315, 1459, 1461, 1513, 1501, 1482, 1544, 1538],
  ipco: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 40, 155, 160, 200, 196, 185, 145, 167, 213, 176]
};

// Total Arrears Balance of Bill Discount Program Participants ($) (Jan 2024 - Sep 2025)
// Source: Oregon PUC EBMR Reports - Table 5 Line 40
const billDiscountArrearsBalance = {
  pge: [4603436, 5113248, 5002562, 4859883, 4735633, 4608240, 4180147, 4527181, 4865456, 4319081, 4577098, 5147138, 6355177, 8805133, 10798381, 7159478, 6149375, 5609489, 5544757, 5651480, 5996987],
  pac: [6174184, 6864329, 6888561, 6865046, 6925754, 6234795, 6260166, 4453337, 7508310, 5954119, 4043122, 6488703, 12864886, 7186437, 9777375, 13380562, 12124426, 10160273, 9006348, 8101107, 7226526],
  nwn: [1159594, 1423639, 1422473, 1371444, 1264057, 1156163, 972232, 805965, 779150, 812085, 812827, 946566, 1269451, 1522773, 1453346, 1361748, 1083522, 984641, 835117, 728684, 625098],
  avista: [322756, 320597, 346872, 351114, 343196, 335300, 292457, 274757, 244555, 226529, 233702, 267591, 306702, 313524, 352735, 349356, 339311, 313713, 272479, 264402, 217868],
  cng: [135555, 176387, 211047, 205024, 196359, 183739, 164354, 122385, 80843, 61168, 62427, 90290, 122234, 142358, 180184, 174885, 153100, 138101, 103949, 79858, 67393],
  ipco: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 126, 21443, 89914, 114469, 148681, 113954, 82772, 53740, 67647, 67994, 52578]
};

// ==================== GEOGRAPHIC VIEW DATA (Q2 2025) ====================
// ZIP-level data for geographic visualization
const geoZipData = {
  pge: [
    {zip:"97003",lat:45.527,lng:-122.887,apr:{active:11334,arrears:1862,disc:69},may:{active:11323,arrears:1821,disc:84},jun:{active:11325,arrears:1941,disc:68}},
    {zip:"97005",lat:45.492,lng:-122.791,apr:{active:12929,arrears:2349,disc:110},may:{active:12918,arrears:2642,disc:116},jun:{active:12921,arrears:2626,disc:69}},
    {zip:"97006",lat:45.532,lng:-122.849,apr:{active:19823,arrears:3084,disc:96},may:{active:20014,arrears:2912,disc:145},jun:{active:20011,arrears:2963,disc:76}},
    {zip:"97007",lat:45.47,lng:-122.846,apr:{active:19861,arrears:1923,disc:62},may:{active:19886,arrears:1955,disc:56},jun:{active:19906,arrears:1993,disc:50}},
    {zip:"97008",lat:45.457,lng:-122.789,apr:{active:11967,arrears:1850,disc:73},may:{active:11968,arrears:1813,disc:86},jun:{active:11966,arrears:1860,disc:50}},
    {zip:"97015",lat:45.403,lng:-122.549,apr:{active:9307,arrears:1538,disc:61},may:{active:9307,arrears:1563,disc:82},jun:{active:9302,arrears:1611,disc:43}},
    {zip:"97030",lat:45.506,lng:-122.437,apr:{active:15700,arrears:3428,disc:168},may:{active:15696,arrears:3363,disc:166},jun:{active:15701,arrears:3522,disc:123}},
    {zip:"97045",lat:45.358,lng:-122.579,apr:{active:22990,arrears:2950,disc:108},may:{active:22985,arrears:3071,disc:113},jun:{active:22992,arrears:2679,disc:88}},
    {zip:"97080",lat:45.496,lng:-122.427,apr:{active:17047,arrears:2484,disc:79},may:{active:17074,arrears:2579,disc:107},jun:{active:17099,arrears:2585,disc:75}},
    {zip:"97086",lat:45.448,lng:-122.52,apr:{active:13969,arrears:2142,disc:90},may:{active:13965,arrears:2054,disc:87},jun:{active:13998,arrears:2133,disc:70}},
    {zip:"97123",lat:45.462,lng:-122.975,apr:{active:19636,arrears:2101,disc:110},may:{active:19682,arrears:1922,disc:115},jun:{active:19704,arrears:2082,disc:68}},
    {zip:"97124",lat:45.535,lng:-122.957,apr:{active:21879,arrears:2520,disc:114},may:{active:21876,arrears:2492,disc:119},jun:{active:21879,arrears:2592,disc:70}},
    {zip:"97202",lat:45.483,lng:-122.641,apr:{active:20912,arrears:3038,disc:74},may:{active:20914,arrears:2891,disc:93},jun:{active:20916,arrears:2955,disc:58}},
    {zip:"97206",lat:45.474,lng:-122.6,apr:{active:22587,arrears:3284,disc:79},may:{active:22577,arrears:3280,disc:99},jun:{active:22584,arrears:3422,disc:59}},
    {zip:"97209",lat:45.535,lng:-122.685,apr:{active:16511,arrears:3774,disc:117},may:{active:16514,arrears:3758,disc:89},jun:{active:16501,arrears:3869,disc:54}},
    {zip:"97222",lat:45.442,lng:-122.62,apr:{active:16093,arrears:2890,disc:107},may:{active:16102,arrears:2831,disc:100},jun:{active:16117,arrears:2381,disc:57}},
    {zip:"97223",lat:45.441,lng:-122.782,apr:{active:21762,arrears:3201,disc:108},may:{active:21753,arrears:3203,disc:123},jun:{active:21743,arrears:3322,disc:97}},
    {zip:"97229",lat:45.558,lng:-122.819,apr:{active:28913,arrears:2634,disc:102},may:{active:28932,arrears:2627,disc:85},jun:{active:28952,arrears:2311,disc:60}},
    {zip:"97230",lat:45.56,lng:-122.5,apr:{active:15846,arrears:2821,disc:165},may:{active:15862,arrears:2613,disc:136},jun:{active:15844,arrears:2785,disc:78}},
    {zip:"97233",lat:45.517,lng:-122.5,apr:{active:15703,arrears:4343,disc:229},may:{active:15697,arrears:4228,disc:233},jun:{active:15684,arrears:4428,disc:164}},
    {zip:"97236",lat:45.482,lng:-122.51,apr:{active:14294,arrears:3208,disc:183},may:{active:14272,arrears:3061,disc:148},jun:{active:14289,arrears:3192,disc:116}},
    {zip:"97266",lat:45.482,lng:-122.557,apr:{active:13597,arrears:2858,disc:96},may:{active:13602,arrears:2919,disc:102},jun:{active:13607,arrears:3045,disc:99}},
    {zip:"97301",lat:44.932,lng:-122.999,apr:{active:20152,arrears:4868,disc:227},may:{active:20175,arrears:4753,disc:242},jun:{active:20315,arrears:4846,disc:158}},
    {zip:"97302",lat:44.908,lng:-123.034,apr:{active:17894,arrears:2264,disc:114},may:{active:17888,arrears:2142,disc:109},jun:{active:17891,arrears:2225,disc:52}},
    {zip:"97305",lat:44.978,lng:-122.948,apr:{active:16305,arrears:3903,disc:163},may:{active:16301,arrears:3685,disc:200},jun:{active:16308,arrears:3893,disc:119}}
  ],
  nwn: [
    {zip:"97003",lat:45.527,lng:-122.887,apr:{active:7027,arrears:665,disc:29},may:{active:7032,arrears:709,disc:0},jun:{active:7039,arrears:689,disc:32}},
    {zip:"97006",lat:45.532,lng:-122.849,apr:{active:9418,arrears:703,disc:26},may:{active:9385,arrears:722,disc:12},jun:{active:9424,arrears:713,disc:21}},
    {zip:"97007",lat:45.47,lng:-122.846,apr:{active:14541,arrears:698,disc:25},may:{active:14539,arrears:767,disc:15},jun:{active:14554,arrears:758,disc:40}},
    {zip:"97045",lat:45.358,lng:-122.579,apr:{active:11607,arrears:1074,disc:21},may:{active:11585,arrears:1092,disc:8},jun:{active:11593,arrears:1041,disc:41}},
    {zip:"97080",lat:45.496,lng:-122.427,apr:{active:11607,arrears:1161,disc:43},may:{active:4411,arrears:1225,disc:0},jun:{active:11647,arrears:854,disc:33}},
    {zip:"97086",lat:45.448,lng:-122.52,apr:{active:9643,arrears:859,disc:19},may:{active:9566,arrears:841,disc:18},jun:{active:9640,arrears:803,disc:16}},
    {zip:"97123",lat:45.462,lng:-122.975,apr:{active:12736,arrears:623,disc:31},may:{active:12742,arrears:1360,disc:49},jun:{active:12763,arrears:932,disc:21}},
    {zip:"97124",lat:45.535,lng:-122.957,apr:{active:10799,arrears:428,disc:41},may:{active:10802,arrears:658,disc:27},jun:{active:10812,arrears:645,disc:20}},
    {zip:"97202",lat:45.483,lng:-122.641,apr:{active:11785,arrears:893,disc:31},may:{active:5220,arrears:989,disc:0},jun:{active:11774,arrears:730,disc:9}},
    {zip:"97206",lat:45.474,lng:-122.6,apr:{active:14103,arrears:1339,disc:41},may:{active:2655,arrears:1459,disc:0},jun:{active:14042,arrears:941,disc:6}},
    {zip:"97211",lat:45.576,lng:-122.638,apr:{active:10561,arrears:760,disc:49},may:{active:10560,arrears:971,disc:28},jun:{active:10544,arrears:850,disc:17}},
    {zip:"97217",lat:45.591,lng:-122.693,apr:{active:10683,arrears:962,disc:33},may:{active:10674,arrears:1129,disc:31},jun:{active:10665,arrears:1020,disc:39}},
    {zip:"97222",lat:45.442,lng:-122.62,apr:{active:8165,arrears:856,disc:28},may:{active:7762,arrears:871,disc:5},jun:{active:8133,arrears:838,disc:5}},
    {zip:"97223",lat:45.441,lng:-122.782,apr:{active:13106,arrears:820,disc:22},may:{active:13085,arrears:849,disc:5},jun:{active:13124,arrears:809,disc:34}},
    {zip:"97229",lat:45.558,lng:-122.819,apr:{active:21977,arrears:1250,disc:44},may:{active:21986,arrears:1292,disc:26},jun:{active:22031,arrears:1286,disc:31}},
    {zip:"97230",lat:45.56,lng:-122.5,apr:{active:9478,arrears:1103,disc:30},may:{active:8478,arrears:1152,disc:2},jun:{active:9467,arrears:992,disc:25}},
    {zip:"97301",lat:44.932,lng:-122.999,apr:{active:8990,arrears:997,disc:61},may:{active:8975,arrears:1102,disc:57},jun:{active:8983,arrears:1275,disc:24}},
    {zip:"97302",lat:44.908,lng:-123.034,apr:{active:10458,arrears:680,disc:33},may:{active:10426,arrears:733,disc:2},jun:{active:10451,arrears:702,disc:28}},
    {zip:"97305",lat:44.978,lng:-122.948,apr:{active:7063,arrears:665,disc:38},may:{active:7038,arrears:695,disc:24},jun:{active:7046,arrears:674,disc:46}}
  ],
  avista: [
    {zip:"97470",lat:43.22,lng:-123.35,apr:{active:3328,arrears:527,disc:4},may:{active:3323,arrears:550,disc:3},jun:{active:3320,arrears:570,disc:2}},
    {zip:"97471",lat:43.28,lng:-123.38,apr:{active:5195,arrears:430,disc:6},may:{active:5190,arrears:579,disc:5},jun:{active:5180,arrears:565,disc:3}},
    {zip:"97502",lat:42.3,lng:-122.92,apr:{active:9199,arrears:1116,disc:11},may:{active:9162,arrears:1401,disc:10},jun:{active:9144,arrears:1357,disc:6}},
    {zip:"97503",lat:42.38,lng:-122.83,apr:{active:6404,arrears:697,disc:8},may:{active:6406,arrears:717,disc:7},jun:{active:6401,arrears:689,disc:4}},
    {zip:"97520",lat:42.2,lng:-122.7,apr:{active:13106,arrears:997,disc:16},may:{active:13097,arrears:1122,disc:14},jun:{active:13115,arrears:1141,disc:9}},
    {zip:"97524",lat:42.45,lng:-122.85,apr:{active:7039,arrears:442,disc:8},may:{active:7050,arrears:468,disc:7},jun:{active:7057,arrears:486,disc:5}},
    {zip:"97527",lat:42.42,lng:-123.33,apr:{active:6332,arrears:771,disc:8},may:{active:6328,arrears:804,disc:7},jun:{active:6313,arrears:796,disc:4}},
    {zip:"97530",lat:42.12,lng:-122.9,apr:{active:5544,arrears:537,disc:7},may:{active:5535,arrears:539,disc:6},jun:{active:5515,arrears:534,disc:4}},
    {zip:"97601",lat:42.22,lng:-121.75,apr:{active:6433,arrears:803,disc:8},may:{active:6407,arrears:783,disc:7},jun:{active:6362,arrears:857,disc:4}},
    {zip:"97603",lat:42.18,lng:-121.72,apr:{active:8852,arrears:990,disc:11},may:{active:8816,arrears:1016,disc:9},jun:{active:8801,arrears:986,disc:6}},
    {zip:"97850",lat:45.33,lng:-118.08,apr:{active:4853,arrears:314,disc:6},may:{active:4857,arrears:317,disc:5},jun:{active:4851,arrears:334,disc:3}}
  ],
  cng: [
    {zip:"97701",lat:44.06,lng:-121.31,apr:{active:10842,arrears:576,disc:2},may:{active:10821,arrears:621,disc:14},jun:{active:10857,arrears:625,disc:1}},
    {zip:"97702",lat:43.99,lng:-121.35,apr:{active:14441,arrears:801,disc:8},may:{active:14446,arrears:844,disc:18},jun:{active:14458,arrears:798,disc:3}},
    {zip:"97703",lat:44.12,lng:-121.29,apr:{active:10056,arrears:459,disc:5},may:{active:10056,arrears:446,disc:3},jun:{active:10048,arrears:442,disc:2}},
    {zip:"97707",lat:43.88,lng:-121.5,apr:{active:3976,arrears:82,disc:1},may:{active:3983,arrears:101,disc:0},jun:{active:3987,arrears:110,disc:1}},
    {zip:"97741",lat:44.59,lng:-121.13,apr:{active:1598,arrears:171,disc:3},may:{active:1599,arrears:176,disc:6},jun:{active:1592,arrears:158,disc:0}},
    {zip:"97754",lat:44.27,lng:-120.9,apr:{active:2989,arrears:356,disc:2},may:{active:3004,arrears:367,disc:3},jun:{active:2996,arrears:352,disc:7}},
    {zip:"97756",lat:44.27,lng:-121.17,apr:{active:9870,arrears:524,disc:5},may:{active:9879,arrears:540,disc:11},jun:{active:9896,arrears:535,disc:2}},
    {zip:"97801",lat:45.67,lng:-118.78,apr:{active:4896,arrears:524,disc:17},may:{active:4883,arrears:521,disc:23},jun:{active:4859,arrears:536,disc:9}},
    {zip:"97814",lat:44.78,lng:-117.83,apr:{active:3511,arrears:341,disc:5},may:{active:3509,arrears:354,disc:6},jun:{active:3494,arrears:314,disc:6}},
    {zip:"97838",lat:45.83,lng:-119.17,apr:{active:4271,arrears:477,disc:8},may:{active:4262,arrears:506,disc:12},jun:{active:4261,arrears:522,disc:4}},
    {zip:"97914",lat:44.05,lng:-116.97,apr:{active:2778,arrears:334,disc:16},may:{active:2763,arrears:324,disc:11},jun:{active:2746,arrears:317,disc:11}}
  ],
  pac: [
    {zip:"97756",lat:44.27,lng:-121.17,apr:{active:14291,arrears:2764,disc:31},may:{active:14300,arrears:2794,disc:82},jun:{active:14313,arrears:2690,disc:57}},
    {zip:"97471",lat:43.28,lng:-123.38,apr:{active:10913,arrears:1963,disc:24},may:{active:10899,arrears:2645,disc:45},jun:{active:10900,arrears:1960,disc:74}},
    {zip:"97211",lat:45.576,lng:-122.638,apr:{active:15281,arrears:2477,disc:34},may:{active:15342,arrears:2547,disc:80},jun:{active:15348,arrears:2348,disc:48}},
    {zip:"97351",lat:44.87,lng:-123.02,apr:{active:4098,arrears:1008,disc:17},may:{active:4113,arrears:1122,disc:37},jun:{active:4102,arrears:1037,disc:22}},
    {zip:"97701",lat:44.06,lng:-121.31,apr:{active:14440,arrears:2592,disc:21},may:{active:14497,arrears:2508,disc:61},jun:{active:14518,arrears:2446,disc:26}},
    {zip:"97520",lat:42.2,lng:-122.7,apr:{active:2030,arrears:350,disc:2},may:{active:2032,arrears:346,disc:8},jun:{active:2040,arrears:330,disc:4}},
    {zip:"97527",lat:42.42,lng:-123.33,apr:{active:16394,arrears:3526,disc:48},may:{active:16375,arrears:3445,disc:134},jun:{active:16399,arrears:3175,disc:68}},
    {zip:"97530",lat:42.12,lng:-122.9,apr:{active:4056,arrears:706,disc:4},may:{active:4044,arrears:684,disc:31},jun:{active:4043,arrears:675,disc:10}},
    {zip:"97525",lat:42.43,lng:-123.0,apr:{active:2542,arrears:631,disc:9},may:{active:2549,arrears:597,disc:17},jun:{active:2543,arrears:578,disc:14}},
    {zip:"97212",lat:45.546,lng:-122.643,apr:{active:11954,arrears:1682,disc:17},may:{active:11978,arrears:1704,disc:56},jun:{active:11991,arrears:1619,disc:32}},
    {zip:"97504",lat:42.35,lng:-122.85,apr:{active:21326,arrears:3898,disc:70},may:{active:21335,arrears:5239,disc:108},jun:{active:21359,arrears:3808,disc:213}},
    {zip:"97470",lat:43.22,lng:-123.35,apr:{active:9661,arrears:2539,disc:30},may:{active:9652,arrears:2453,disc:124},jun:{active:9641,arrears:2369,disc:43}},
    {zip:"97138",lat:46.0,lng:-123.92,apr:{active:7030,arrears:1254,disc:28},may:{active:7025,arrears:1252,disc:42},jun:{active:7032,arrears:1254,disc:23}},
    {zip:"97601",lat:42.22,lng:-121.75,apr:{active:11714,arrears:2576,disc:67},may:{active:11703,arrears:2785,disc:69},jun:{active:11720,arrears:2538,disc:151}},
    {zip:"97540",lat:42.12,lng:-122.82,apr:{active:3785,arrears:683,disc:8},may:{active:3818,arrears:672,disc:39},jun:{active:3800,arrears:659,disc:7}},
    {zip:"97031",lat:45.68,lng:-121.52,apr:{active:6684,arrears:904,disc:12},may:{active:6687,arrears:927,disc:18},jun:{active:6675,arrears:854,disc:20}},
    {zip:"97217",lat:45.591,lng:-122.693,apr:{active:5907,arrears:1068,disc:15},may:{active:5921,arrears:1107,disc:35},jun:{active:5965,arrears:1002,disc:41}},
    {zip:"97338",lat:44.97,lng:-123.35,apr:{active:9557,arrears:1986,disc:11},may:{active:9574,arrears:1991,disc:40},jun:{active:9537,arrears:1827,disc:30}},
    {zip:"97367",lat:44.88,lng:-124.02,apr:{active:7553,arrears:1296,disc:19},may:{active:7578,arrears:1291,disc:45},jun:{active:7566,arrears:1243,disc:23}},
    {zip:"97524",lat:42.45,lng:-122.85,apr:{active:6983,arrears:1664,disc:31},may:{active:6999,arrears:1584,disc:82},jun:{active:7016,arrears:1504,disc:23}},
    {zip:"97501",lat:42.33,lng:-122.87,apr:{active:19469,arrears:4844,disc:90},may:{active:19520,arrears:4640,disc:178},jun:{active:19540,arrears:4340,disc:201}},
    {zip:"97703",lat:44.12,lng:-121.29,apr:{active:14183,arrears:1178,disc:11},may:{active:14206,arrears:1486,disc:24},jun:{active:14247,arrears:1186,disc:18}},
    {zip:"97321",lat:44.65,lng:-123.07,apr:{active:12830,arrears:2183,disc:24},may:{active:12834,arrears:2274,disc:57},jun:{active:12879,arrears:1930,disc:75}},
    {zip:"97333",lat:44.55,lng:-123.25,apr:{active:9981,arrears:1636,disc:23},may:{active:10042,arrears:1731,disc:61},jun:{active:10139,arrears:1630,disc:35}},
    {zip:"97702",lat:43.99,lng:-121.35,apr:{active:20298,arrears:2867,disc:26},may:{active:20390,arrears:2853,disc:89},jun:{active:20424,arrears:2693,disc:70}},
    {zip:"97330",lat:44.58,lng:-123.27,apr:{active:14260,arrears:1892,disc:23},may:{active:14290,arrears:2008,disc:35},jun:{active:14531,arrears:1811,disc:56}},
    {zip:"97754",lat:44.27,lng:-120.9,apr:{active:7879,arrears:1724,disc:30},may:{active:7879,arrears:1793,disc:51},jun:{active:7878,arrears:1679,disc:55}},
    {zip:"97526",lat:42.45,lng:-123.32,apr:{active:16814,arrears:3630,disc:40},may:{active:16806,arrears:3852,disc:62},jun:{active:16870,arrears:3286,disc:158}},
    {zip:"97801",lat:45.67,lng:-118.78,apr:{active:8943,arrears:2282,disc:30},may:{active:8962,arrears:2184,disc:93},jun:{active:8956,arrears:2094,disc:48}},
    {zip:"97503",lat:42.38,lng:-122.83,apr:{active:4668,arrears:1469,disc:15},may:{active:4689,arrears:1404,disc:68},jun:{active:4686,arrears:1299,disc:29}},
    {zip:"97322",lat:44.63,lng:-123.1,apr:{active:14414,arrears:3771,disc:35},may:{active:14445,arrears:3675,disc:129},jun:{active:14433,arrears:3389,disc:58}},
    {zip:"97502",lat:42.3,lng:-122.92,apr:{active:12616,arrears:2597,disc:31},may:{active:12609,arrears:2456,disc:81},jun:{active:12626,arrears:2326,disc:99}},
    {zip:"97603",lat:42.18,lng:-121.72,apr:{active:14095,arrears:3479,disc:67},may:{active:14100,arrears:3426,disc:122},jun:{active:14087,arrears:3297,disc:110}},
    {zip:"97103",lat:46.18,lng:-123.83,apr:{active:8590,arrears:1417,disc:11},may:{active:8609,arrears:1611,disc:33},jun:{active:8619,arrears:1461,disc:41}},
    {zip:"97213",lat:45.538,lng:-122.6,apr:{active:11324,arrears:1462,disc:13},may:{active:11400,arrears:1759,disc:42},jun:{active:11384,arrears:1542,disc:25}}
  ],
  ipco: [
    {zip:"97834",lat:44.98,lng:-117.17,apr:{active:661,arrears:34,disc:0},may:{active:660,arrears:48,disc:0},jun:{active:661,arrears:36,disc:0}},
    {zip:"97870",lat:44.77,lng:-117.18,apr:{active:434,arrears:23,disc:0},may:{active:436,arrears:32,disc:0},jun:{active:437,arrears:31,disc:1}},
    {zip:"97901",lat:43.88,lng:-117.03,apr:{active:377,arrears:36,disc:0},may:{active:379,arrears:36,disc:1},jun:{active:377,arrears:40,disc:1}},
    {zip:"97907",lat:44.15,lng:-117.42,apr:{active:378,arrears:43,disc:1},may:{active:382,arrears:51,disc:0},jun:{active:383,arrears:42,disc:2}},
    {zip:"97910",lat:43.12,lng:-117.02,apr:{active:368,arrears:30,disc:1},may:{active:382,arrears:34,disc:1},jun:{active:382,arrears:27,disc:0}},
    {zip:"97913",lat:44.02,lng:-116.97,apr:{active:2274,arrears:388,disc:10},may:{active:2294,arrears:366,disc:6},jun:{active:2289,arrears:356,disc:7}},
    {zip:"97914",lat:44.05,lng:-116.97,apr:{active:7106,arrears:1223,disc:41},may:{active:7117,arrears:1171,disc:22},jun:{active:7132,arrears:1110,disc:35}},
    {zip:"97918",lat:43.97,lng:-117.25,apr:{active:1993,arrears:270,disc:18},may:{active:1996,arrears:238,disc:9},jun:{active:2003,arrears:241,disc:10}}
  ]
};

const geoRegions = {
  statewide: { name: '🗺️ Entire State', latMin: 41.95, latMax: 46.30, lngMin: -124.60, lngMax: -116.45 },
  portland: { name: 'Portland Metro', latMin: 45.30, latMax: 45.75, lngMin: -123.15, lngMax: -122.25 },
  salem: { name: 'Salem/Albany', latMin: 44.10, latMax: 45.30, lngMin: -123.85, lngMax: -122.35 },
  southern: { name: 'Southern Oregon', latMin: 41.95, latMax: 43.70, lngMin: -124.20, lngMax: -120.80 },
  central: { name: 'Central Oregon', latMin: 43.40, latMax: 45.00, lngMin: -122.10, lngMax: -119.70 },
  coast: { name: 'Oregon Coast', latMin: 44.10, latMax: 46.30, lngMin: -124.25, lngMax: -123.30 },
  eastern: { name: 'Eastern Oregon', latMin: 41.95, latMax: 46.05, lngMin: -120.10, lngMax: -116.85 }
};

const geoCities = {
  statewide: [{name:'Portland',lat:45.52,lng:-122.68},{name:'Salem',lat:44.94,lng:-123.03},{name:'Eugene',lat:44.05,lng:-123.09},{name:'Bend',lat:44.06,lng:-121.31},{name:'Medford',lat:42.33,lng:-122.87},{name:'Pendleton',lat:45.67,lng:-118.78},{name:'Ontario',lat:44.03,lng:-116.96},{name:'Klamath Falls',lat:42.22,lng:-121.77},{name:'Astoria',lat:46.18,lng:-123.83}],
  portland: [{name:'Portland',lat:45.52,lng:-122.68},{name:'Gresham',lat:45.50,lng:-122.43},{name:'Hillsboro',lat:45.52,lng:-122.99},{name:'Beaverton',lat:45.49,lng:-122.80}],
  salem: [{name:'Salem',lat:44.94,lng:-123.03},{name:'Albany',lat:44.63,lng:-123.10},{name:'Corvallis',lat:44.56,lng:-123.26},{name:'Dallas',lat:44.92,lng:-123.32}],
  southern: [{name:'Medford',lat:42.33,lng:-122.87},{name:'Ashland',lat:42.19,lng:-122.71},{name:'Grants Pass',lat:42.44,lng:-123.33},{name:'Klamath Falls',lat:42.22,lng:-121.77},{name:'Roseburg',lat:43.22,lng:-123.34}],
  central: [{name:'Bend',lat:44.06,lng:-121.31},{name:'Redmond',lat:44.27,lng:-121.17},{name:'Prineville',lat:44.30,lng:-120.83},{name:'Madras',lat:44.63,lng:-121.13}],
  coast: [{name:'Astoria',lat:46.18,lng:-123.83},{name:'Seaside',lat:45.99,lng:-123.92},{name:'Tillamook',lat:45.46,lng:-123.84},{name:'Lincoln City',lat:44.96,lng:-124.02},{name:'Newport',lat:44.63,lng:-124.05}],
  eastern: [{name:'Pendleton',lat:45.67,lng:-118.78},{name:'Hermiston',lat:45.84,lng:-119.29},{name:'La Grande',lat:45.32,lng:-118.09},{name:'Baker City',lat:44.77,lng:-117.83},{name:'Ontario',lat:44.03,lng:-116.96},{name:'Vale',lat:43.98,lng:-117.24},{name:'Nyssa',lat:44.02,lng:-116.97}]
};

const geoMetricConfig = {
  arrears_rate: { label: 'Arrears Rate (%)', format: v => v.toFixed(1) + '%' },
  disc_rate: { label: 'Disconnection Rate (%)', format: v => v.toFixed(2) + '%' },
  arrears_count: { label: 'Accounts in Arrears', format: v => v.toLocaleString() },
  disconnections: { label: 'Disconnections', format: v => v.toLocaleString() }
};

const geoMonthLabels = { apr: 'April 2025', may: 'May 2025', jun: 'June 2025' };
const geoUtilityColors = { 'pge': '#16a34a', 'nwn': '#2563eb', 'avista': '#ea580c', 'cng': '#9333ea', 'pac': '#dc2626', 'ipco': '#0891b2' };
const geoUtilityNames = { 'pge': 'PGE', 'nwn': 'NW Natural', 'avista': 'Avista', 'cng': 'Cascade', 'pac': 'Pacific Power', 'ipco': 'Idaho Power' };

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (val) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val?.toFixed(0) || 0}`;
};

const formatNumber = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val?.toLocaleString() || '0';
};

const getTrend = (data, periods = 3) => {
  if (!data || data.length < periods + 1) return { direction: 'flat', change: 0 };
  const recent = data.slice(-periods).reduce((a, b) => a + b, 0) / periods;
  const prior = data.slice(-(periods * 2), -periods).reduce((a, b) => a + b, 0) / periods;
  const change = ((recent - prior) / prior) * 100;
  return {
    direction: change > 2 ? 'up' : change < -2 ? 'down' : 'flat',
    change: change.toFixed(1)
  };
};

// ==================== MAIN COMPONENT ====================
export default function OregonEnergyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUtility, setSelectedUtility] = useState('all');
  
  // Geographic tab state
  const [geoMonth, setGeoMonth] = useState('jun');
  const [geoMetric, setGeoMetric] = useState('arrears_rate');
  const [geoUtility, setGeoUtility] = useState('all');
  const [geoHover, setGeoHover] = useState(null);
  const [geoSelected, setGeoSelected] = useState(null);
  const [geoRegion, setGeoRegion] = useState('statewide');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'arrears', label: 'Arrears' },
    { id: 'disconnections', label: 'Disconnections' },
    { id: 'billDiscount', label: 'Bill Discounts' },
    { id: 'comparison', label: 'Utility Comparison' },
    { id: 'geographic', label: 'Geographic View' },
    { id: 'export', label: 'Export Data' }
  ];

  // Calculate totals and trends
  const currentMonth = 20; // Sep 2025 (index)
  
  const totals = useMemo(() => {
    const sumArray = (obj, idx) => utilities.reduce((sum, u) => sum + (obj[u.id]?.[idx] || 0), 0);
    
    // Calculate weighted average bill (weighted by accounts)
    const totalAccounts = utilities.reduce((sum, u) => sum + (accounts[u.id]?.[currentMonth] || 0), 0);
    const weightedBillSum = utilities.reduce((sum, u) => {
      const acct = accounts[u.id]?.[currentMonth] || 0;
      const bill = avgBill[u.id]?.[currentMonth] || 0;
      return sum + (acct * bill);
    }, 0);
    const avgBillWeighted = totalAccounts > 0 ? Math.round(weightedBillSum / totalAccounts) : 0;
    
    // Calculate average usage separately for electric and gas
    const electricUtils = ['pge', 'pac', 'ipco'];
    const gasUtils = ['nwn', 'cng', 'avista'];
    
    const electricAccounts = electricUtils.reduce((sum, u) => sum + (accounts[u]?.[currentMonth] || 0), 0);
    const electricUsageSum = electricUtils.reduce((sum, u) => {
      const acct = accounts[u]?.[currentMonth] || 0;
      const usage = avgUsage[u]?.[currentMonth] || 0;
      return sum + (acct * usage);
    }, 0);
    const avgElectricUsage = electricAccounts > 0 ? Math.round(electricUsageSum / electricAccounts) : 0;
    
    const gasAccounts = gasUtils.reduce((sum, u) => sum + (accounts[u]?.[currentMonth] || 0), 0);
    const gasUsageSum = gasUtils.reduce((sum, u) => {
      const acct = accounts[u]?.[currentMonth] || 0;
      const usage = avgUsage[u]?.[currentMonth] || 0;
      return sum + (acct * usage);
    }, 0);
    const avgGasUsage = gasAccounts > 0 ? Math.round(gasUsageSum / gasAccounts) : 0;
    
    return {
      customers: sumArray(arrearsCustomers, currentMonth),
      balance: sumArray(arrearsBalance, currentMonth),
      disconnections: sumArray(disconnections, currentMonth),
      bdParticipants: sumArray(billDiscountParticipants, currentMonth),
      bdDollars: sumArray(billDiscountDollars, currentMonth),
      avgBill: avgBillWeighted,
      avgElectricUsage,
      avgGasUsage,
      totalAccounts
    };
  }, []);

  const trends = useMemo(() => {
    // Calculate weighted average bill trend
    const getWeightedAvgBillByMonth = (monthIdx) => {
      const totalAccounts = utilities.reduce((sum, u) => sum + (accounts[u.id]?.[monthIdx] || 0), 0);
      const weightedSum = utilities.reduce((sum, u) => {
        const acct = accounts[u.id]?.[monthIdx] || 0;
        const bill = avgBill[u.id]?.[monthIdx] || 0;
        return sum + (acct * bill);
      }, 0);
      return totalAccounts > 0 ? weightedSum / totalAccounts : 0;
    };
    
    const avgBillTrend = months.map((_, i) => getWeightedAvgBillByMonth(i));
    
    return {
      customers: getTrend(months.map((_, i) => utilities.reduce((s, u) => s + arrearsCustomers[u.id][i], 0))),
      balance: getTrend(months.map((_, i) => utilities.reduce((s, u) => s + arrearsBalance[u.id][i], 0))),
      disconnections: getTrend(months.map((_, i) => utilities.reduce((s, u) => s + disconnections[u.id][i], 0))),
      bdParticipants: getTrend(months.map((_, i) => utilities.reduce((s, u) => s + billDiscountParticipants[u.id][i], 0))),
      avgBill: getTrend(avgBillTrend)
    };
  }, []);

  // Prepare chart data based on selected utility
  const getChartData = (dataObj) => {
    return months.map((month, i) => {
      const row = { month };
      if (selectedUtility === 'all') {
        row.value = utilities.reduce((sum, u) => sum + (dataObj[u.id]?.[i] || 0), 0);
      } else {
        row.value = dataObj[selectedUtility]?.[i] || 0;
      }
      return row;
    });
  };

  const TrendIndicator = ({ trend }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      background: trend.direction === 'up' ? '#FEE2E2' : trend.direction === 'down' ? '#D1FAE5' : '#F3F4F6',
      color: trend.direction === 'up' ? '#991B1B' : trend.direction === 'down' ? '#065F46' : '#6B7280'
    }}>
      {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.change)}%
    </span>
  );

  const MetricCard = ({ title, value, trend, subtitle, color = '#1E3A5F' }) => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</div>
        {trend && <TrendIndicator trend={trend} />}
      </div>
      {subtitle && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );

  const UtilityFilter = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <button
        onClick={() => setSelectedUtility('all')}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          border: 'none',
          background: selectedUtility === 'all' ? '#1E3A5F' : '#E5E7EB',
          color: selectedUtility === 'all' ? 'white' : '#374151',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        All Utilities
      </button>
      {utilities.map(u => (
        <button
          key={u.id}
          onClick={() => setSelectedUtility(u.id)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: 'none',
            background: selectedUtility === u.id ? u.color : '#E5E7EB',
            color: selectedUtility === u.id ? 'white' : '#374151',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {u.short}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%)', color: 'white', padding: '24px 32px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Oregon Energy Burden Dashboard</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
          PUC Docket RO 16 • January 2024 – September 2025 • 6 Regulated Utilities
        </p>
      </div>

      {/* Navigation */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#1E3A5F' : '#6B7280',
                borderBottom: activeTab === tab.id ? '3px solid #1E3A5F' : '3px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics - Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <MetricCard 
                title="Customers in Arrears" 
                value={formatNumber(totals.customers)} 
                trend={trends.customers}
                subtitle="Sep 2025"
                color="#DC2626"
              />
              <MetricCard 
                title="Total Arrears Balance" 
                value={formatCurrency(totals.balance)} 
                trend={trends.balance}
                subtitle="All utilities combined"
                color="#7C3AED"
              />
              <MetricCard 
                title="Monthly Disconnections" 
                value={formatNumber(totals.disconnections)} 
                trend={trends.disconnections}
                subtitle="Sep 2025"
                color="#EA580C"
              />
              <MetricCard 
                title="Bill Discount Participants" 
                value={formatNumber(totals.bdParticipants)} 
                trend={trends.bdParticipants}
                subtitle="Active enrollees"
                color="#059669"
              />
            </div>

            {/* Key Metrics - Row 2: Bill & Usage */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <MetricCard 
                title="Avg. Residential Bill" 
                value={`$${totals.avgBill}`} 
                trend={trends.avgBill}
                subtitle="Weighted avg. all utilities"
                color="#0284C7"
              />
              <MetricCard 
                title="Avg. Electric Usage" 
                value={`${totals.avgElectricUsage} kWh`}
                subtitle="PGE, Pacific, Idaho Power"
                color="#1E3A5F"
              />
              <MetricCard 
                title="Avg. Gas Usage" 
                value={`${totals.avgGasUsage} therms`}
                subtitle="NWN, Cascade, Avista"
                color="#7C3AED"
              />
              <MetricCard 
                title="Total Accounts" 
                value={formatNumber(totals.totalAccounts)} 
                subtitle="Residential customers served"
                color="#374151"
              />
            </div>

            {/* Trend methodology note */}
            <div style={{ 
              background: '#F8FAFC', 
              borderRadius: '8px', 
              padding: '10px 16px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>ℹ️</span>
              <span style={{ color: '#64748B', fontSize: '13px' }}>
                Percent change figures compare the average of the most recent 3 months to the prior 3 months.
              </span>
            </div>

            {/* Utility Filter */}
            <UtilityFilter />

            {/* Overview Charts - Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Total Customers in Arrears Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="customersInArrears" style={{ color: '#DC2626' }}>Total Customers in Arrears</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={getChartData(arrearsCustomers)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Area type="monotone" dataKey="value" stroke="#DC2626" fill="#FEE2E2" name="Customers" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Total Arrears Balance Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="arrearsBalance" style={{ color: '#7C3AED' }}>Total Arrears Balance</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={getChartData(arrearsBalance)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="value" stroke="#7C3AED" fill="#EDE9FE" name="Balance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overview Charts - Row 1b: Arrears by Bucket */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Customers in Arrears Trend - By Bucket */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="daysInArrears">Customers in Arrears by Age Bucket</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={months.map((month, i) => {
                    if (selectedUtility === 'all') {
                      return {
                        month,
                        '31-60 Days': utilities.reduce((sum, u) => sum + (arrearsCustomers31_60[u.id]?.[i] || 0), 0),
                        '61-90 Days': utilities.reduce((sum, u) => sum + (arrearsCustomers61_90[u.id]?.[i] || 0), 0),
                        '91+ Days': utilities.reduce((sum, u) => sum + (arrearsCustomers91Plus[u.id]?.[i] || 0), 0)
                      };
                    }
                    return {
                      month,
                      '31-60 Days': arrearsCustomers31_60[selectedUtility]?.[i] || 0,
                      '61-90 Days': arrearsCustomers61_90[selectedUtility]?.[i] || 0,
                      '91+ Days': arrearsCustomers91Plus[selectedUtility]?.[i] || 0
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="31-60 Days" stackId="1" stroke="#FBBF24" fill="#FEF3C7" name="31-60 Days" />
                    <Area type="monotone" dataKey="61-90 Days" stackId="1" stroke="#F97316" fill="#FFEDD5" name="61-90 Days" />
                    <Area type="monotone" dataKey="91+ Days" stackId="1" stroke="#DC2626" fill="#FEE2E2" name="91+ Days" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Arrears Balance Trend - By Bucket */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="daysInArrears">Arrears Balance by Age Bucket</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={months.map((month, i) => {
                    if (selectedUtility === 'all') {
                      return {
                        month,
                        '31-60 Days': utilities.reduce((sum, u) => sum + (arrearsBalance31_60[u.id]?.[i] || 0), 0),
                        '61-90 Days': utilities.reduce((sum, u) => sum + (arrearsBalance61_90[u.id]?.[i] || 0), 0),
                        '91+ Days': utilities.reduce((sum, u) => sum + (arrearsBalance91Plus[u.id]?.[i] || 0), 0)
                      };
                    }
                    return {
                      month,
                      '31-60 Days': arrearsBalance31_60[selectedUtility]?.[i] || 0,
                      '61-90 Days': arrearsBalance61_90[selectedUtility]?.[i] || 0,
                      '91+ Days': arrearsBalance91Plus[selectedUtility]?.[i] || 0
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="31-60 Days" stackId="1" stroke="#FBBF24" fill="#FEF3C7" name="31-60 Days" />
                    <Area type="monotone" dataKey="61-90 Days" stackId="1" stroke="#F97316" fill="#FFEDD5" name="61-90 Days" />
                    <Area type="monotone" dataKey="91+ Days" stackId="1" stroke="#7C3AED" fill="#EDE9FE" name="91+ Days" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overview Charts - Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Average Bill Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="averageBill" style={{ color: '#0284C7' }}>Average Monthly Residential Bill Trend</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={months.map((month, i) => {
                    if (selectedUtility === 'all') {
                      // Weighted average
                      const totalAccounts = utilities.reduce((sum, u) => sum + (accounts[u.id]?.[i] || 0), 0);
                      const weightedSum = utilities.reduce((sum, u) => {
                        const acct = accounts[u.id]?.[i] || 0;
                        const bill = avgBill[u.id]?.[i] || 0;
                        return sum + (acct * bill);
                      }, 0);
                      return { month, value: totalAccounts > 0 ? Math.round(weightedSum / totalAccounts) : 0 };
                    }
                    return { month, value: avgBill[selectedUtility]?.[i] || 0 };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `$${v}`} />
                    <Line type="monotone" dataKey="value" stroke="#0284C7" strokeWidth={2} dot={false} name="Avg Bill" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Average Usage Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="averageUsage">Average Monthly Residential Usage Trend</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={months.map((month, i) => {
                    if (selectedUtility === 'all') {
                      // Show electric utilities average
                      const electricUtils = ['pge', 'pac', 'ipco'];
                      const totalAccounts = electricUtils.reduce((sum, u) => sum + (accounts[u]?.[i] || 0), 0);
                      const weightedSum = electricUtils.reduce((sum, u) => {
                        const acct = accounts[u]?.[i] || 0;
                        const usage = avgUsage[u]?.[i] || 0;
                        return sum + (acct * usage);
                      }, 0);
                      return { month, value: totalAccounts > 0 ? Math.round(weightedSum / totalAccounts) : 0 };
                    }
                    return { month, value: avgUsage[selectedUtility]?.[i] || 0 };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => selectedUtility === 'all' || ['pge', 'pac', 'ipco'].includes(selectedUtility) ? `${v} kWh` : `${v} therms`} />
                    <Line type="monotone" dataKey="value" stroke="#1E3A5F" strokeWidth={2} dot={false} name="Avg Usage" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', textAlign: 'center' }}>
                  {selectedUtility === 'all' ? 'Electric utilities (kWh) shown • Select a gas utility for therms' : 
                   ['pge', 'pac', 'ipco'].includes(selectedUtility) ? 'kWh' : 'Therms'}
                </div>
              </div>
            </div>

            {/* Overview Charts - Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Disconnections Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="disconnections" style={{ color: '#EA580C' }}>Disconnections Trend</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getChartData(disconnections)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Bar dataKey="value" fill="#EA580C" name="Disconnections" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bill Discount Participants */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="billDiscountParticipants" style={{ color: '#059669' }}>Bill Discount Participants</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={getChartData(billDiscountParticipants)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Area type="monotone" dataKey="value" stroke="#059669" fill="#D1FAE5" name="Participants" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ==================== ARREARS TAB ==================== */}
        {activeTab === 'arrears' && (
          <>
            <UtilityFilter />

            {/* Arrears Trend Indicator */}
            {(() => {
              const recentMonths = 3;
              const getAvg = (arr, start, count) => arr.slice(start, start + count).reduce((a, b) => a + b, 0) / count;
              
              const customerData = selectedUtility === 'all'
                ? months.map((_, i) => utilities.reduce((sum, u) => sum + arrearsCustomers[u.id][i], 0))
                : arrearsCustomers[selectedUtility] || [];
              const balanceData = selectedUtility === 'all'
                ? months.map((_, i) => utilities.reduce((sum, u) => sum + arrearsBalance[u.id][i], 0))
                : arrearsBalance[selectedUtility] || [];
              
              const recentCust = getAvg(customerData, customerData.length - recentMonths, recentMonths);
              const priorCust = getAvg(customerData, customerData.length - recentMonths * 2, recentMonths);
              const custChange = ((recentCust - priorCust) / priorCust) * 100;
              
              const recentBal = getAvg(balanceData, balanceData.length - recentMonths, recentMonths);
              const priorBal = getAvg(balanceData, balanceData.length - recentMonths * 2, recentMonths);
              const balChange = ((recentBal - priorBal) / priorBal) * 100;
              
              const getTrendIcon = (change) => {
                if (change > 2) return { icon: '↑', color: '#DC2626', text: 'Trending Up' };
                if (change < -2) return { icon: '↓', color: '#059669', text: 'Trending Down' };
                return { icon: '→', color: '#6B7280', text: 'Flat' };
              };
              
              const custTrend = getTrendIcon(custChange);
              const balTrend = getTrendIcon(balChange);
              
              return (
                <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'white' }}>Arrears Trend Analysis (3-Month Comparison)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px', color: custTrend.color }}>{custTrend.icon}</span>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Customers in Arrears</div>
                          <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>{custTrend.text}</div>
                          <div style={{ color: custTrend.color, fontSize: '14px' }}>{custChange >= 0 ? '+' : ''}{custChange.toFixed(1)}% vs prior 3 months</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px', color: balTrend.color }}>{balTrend.icon}</span>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Total Arrears Balance</div>
                          <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>{balTrend.text}</div>
                          <div style={{ color: balTrend.color, fontSize: '14px' }}>{balChange >= 0 ? '+' : ''}{balChange.toFixed(1)}% vs prior 3 months</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Total Arrears Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Total Customers in Arrears */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="customersInArrears">Total Customers in Arrears</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={months.map((month, i) => ({
                    month,
                    value: selectedUtility === 'all' 
                      ? utilities.reduce((sum, u) => sum + arrearsCustomers[u.id][i], 0)
                      : arrearsCustomers[selectedUtility]?.[i] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#93C5FD" strokeWidth={2} name="Customers" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Total Arrears Balance */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="arrearsBalance">Total Arrears Balance</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={months.map((month, i) => ({
                    month,
                    value: selectedUtility === 'all' 
                      ? utilities.reduce((sum, u) => sum + arrearsBalance[u.id][i], 0)
                      : arrearsBalance[selectedUtility]?.[i] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="value" stroke="#DC2626" fill="#FCA5A5" strokeWidth={2} name="Balance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Balance by Utility */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Arrears Balance by Utility (Sep 2025)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({ name: u.short, balance: arrearsBalance[u.id][currentMonth], color: u.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Balance per Customer */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="averageArrears">Average Arrears per Customer (Sep 2025)</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({ 
                    name: u.short, 
                    avg: Math.round(arrearsBalance[u.id][currentMonth] / arrearsCustomers[u.id][currentMonth]),
                    color: u.color 
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v) => `$${v}`} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* All Utilities Balance Trend */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Arrears Balance Trend - All Utilities</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={months.map((month, i) => {
                  const row = { month };
                  utilities.forEach(u => { row[u.short] = arrearsBalance[u.id][i]; });
                  return row;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  {utilities.map(u => (
                    <Line key={u.id} type="monotone" dataKey={u.short} stroke={u.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Arrears by Age Bucket - Current Month */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Arrears Balance by Age Bucket (Sep 2025)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({
                    name: u.short,
                    '31-60 Days': arrearsBalance31_60[u.id][currentMonth],
                    '61-90 Days': arrearsBalance61_90[u.id][currentMonth],
                    '91+ Days': arrearsBalance91Plus[u.id][currentMonth]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="31-60 Days" stackId="a" fill="#FBBF24" />
                    <Bar dataKey="61-90 Days" stackId="a" fill="#F97316" />
                    <Bar dataKey="91+ Days" stackId="a" fill="#DC2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Customers by Age Bucket (Sep 2025)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({
                    name: u.short,
                    '31-60 Days': arrearsCustomers31_60[u.id][currentMonth],
                    '61-90 Days': arrearsCustomers61_90[u.id][currentMonth],
                    '91+ Days': arrearsCustomers91Plus[u.id][currentMonth]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="31-60 Days" stackId="a" fill="#FBBF24" />
                    <Bar dataKey="61-90 Days" stackId="a" fill="#F97316" />
                    <Bar dataKey="91+ Days" stackId="a" fill="#DC2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ==================== DISCONNECTIONS TAB ==================== */}
        {activeTab === 'disconnections' && (
          <>
            <UtilityFilter />

            {/* Disconnections Trend Indicator */}
            {(() => {
              const recentMonths = 3;
              const getAvg = (arr, start, count) => arr.slice(start, start + count).reduce((a, b) => a + b, 0) / count;
              
              const discData = selectedUtility === 'all'
                ? months.map((_, i) => utilities.reduce((sum, u) => sum + disconnections[u.id][i], 0))
                : disconnections[selectedUtility] || [];
              
              const rateData = selectedUtility === 'all'
                ? months.map((_, i) => {
                    const totalDisc = utilities.reduce((sum, u) => sum + disconnections[u.id][i], 0);
                    const totalAcct = utilities.reduce((sum, u) => sum + accounts[u.id][i], 0);
                    return totalAcct > 0 ? (totalDisc / totalAcct) * 100 : 0;
                  })
                : discPct[selectedUtility] || [];
              
              const recentDisc = getAvg(discData, discData.length - recentMonths, recentMonths);
              const priorDisc = getAvg(discData, discData.length - recentMonths * 2, recentMonths);
              const discChange = ((recentDisc - priorDisc) / priorDisc) * 100;
              
              const recentRate = getAvg(rateData, rateData.length - recentMonths, recentMonths);
              const priorRate = getAvg(rateData, rateData.length - recentMonths * 2, recentMonths);
              const rateChange = ((recentRate - priorRate) / priorRate) * 100;
              
              const getTrendIcon = (change) => {
                if (change > 2) return { icon: '↑', color: '#F59E0B', text: 'Trending Up' };
                if (change < -2) return { icon: '↓', color: '#059669', text: 'Trending Down' };
                return { icon: '→', color: '#6B7280', text: 'Flat' };
              };
              
              const discTrend = getTrendIcon(discChange);
              const rateTrend = getTrendIcon(rateChange);
              
              return (
                <div style={{ background: 'linear-gradient(135deg, #334155 0%, #475569 100%)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: 'white' }}>Disconnections Trend Analysis (3-Month Comparison)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px', color: discTrend.color === '#F59E0B' ? '#FCD34D' : discTrend.color === '#059669' ? '#6EE7B7' : '#D1D5DB' }}>{discTrend.icon}</span>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Total Disconnections</div>
                          <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>{discTrend.text}</div>
                          <div style={{ color: discTrend.color === '#F59E0B' ? '#FCD34D' : discTrend.color === '#059669' ? '#6EE7B7' : '#D1D5DB', fontSize: '14px' }}>{discChange >= 0 ? '+' : ''}{discChange.toFixed(1)}% vs prior 3 months</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '32px', color: rateTrend.color === '#F59E0B' ? '#FCD34D' : rateTrend.color === '#059669' ? '#6EE7B7' : '#D1D5DB' }}>{rateTrend.icon}</span>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Disconnection Rate</div>
                          <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>{rateTrend.text}</div>
                          <div style={{ color: rateTrend.color === '#F59E0B' ? '#FCD34D' : rateTrend.color === '#059669' ? '#6EE7B7' : '#D1D5DB', fontSize: '14px' }}>{rateChange >= 0 ? '+' : ''}{rateChange.toFixed(1)}% vs prior 3 months</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Total Disconnections Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Total Disconnections Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="disconnections">Total Disconnections Trend</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={months.map((month, i) => ({
                    month,
                    value: selectedUtility === 'all' 
                      ? utilities.reduce((sum, u) => sum + disconnections[u.id][i], 0)
                      : disconnections[selectedUtility]?.[i] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#64748B" radius={[4, 4, 0, 0]} name="Disconnections" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Total Disconnection Rate Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="disconnectionRate">Disconnection Rate Trend (%)</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={months.map((month, i) => {
                    let rate;
                    if (selectedUtility === 'all') {
                      const totalDisc = utilities.reduce((sum, u) => sum + disconnections[u.id][i], 0);
                      const totalAcct = utilities.reduce((sum, u) => sum + accounts[u.id][i], 0);
                      rate = totalAcct > 0 ? (totalDisc / totalAcct) * 100 : 0;
                    } else {
                      rate = discPct[selectedUtility]?.[i] || 0;
                    }
                    return { month, value: parseFloat(rate.toFixed(3)) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Area type="monotone" dataKey="value" stroke="#64748B" fill="#CBD5E1" strokeWidth={2} name="Rate %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Current Month Disconnections */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>September 2025 Disconnections by Utility</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({ name: u.short, disc: disconnections[u.id][currentMonth], color: u.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="disc" radius={[0, 4, 4, 0]} name="Disconnections">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Disconnection Rate by Utility */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Disconnection Rate by Utility (% of Customers)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({ name: u.short, rate: discPct[u.id][currentMonth], color: u.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Rate %">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Disconnection Trend by Utility */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Disconnection Trend by Utility</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={months.map((month, i) => {
                  const row = { month };
                  utilities.forEach(u => { row[u.short] = disconnections[u.id][i]; });
                  return row;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {utilities.map(u => (
                    <Line key={u.id} type="monotone" dataKey={u.short} stroke={u.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Disconnection Notices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Disconnection Notices Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="disconnectionNotices" style={{ color: '#EA580C' }}>Disconnection Notices Sent</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={months.map((month, i) => ({
                    month,
                    value: selectedUtility === 'all' 
                      ? utilities.reduce((sum, u) => sum + disconnectionNotices[u.id][i], 0)
                      : disconnectionNotices[selectedUtility]?.[i] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Area type="monotone" dataKey="value" stroke="#EA580C" fill="#FED7AA" strokeWidth={2} name="Notices" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Reconnection Rate */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="reconnectionRate" style={{ color: '#059669' }}>Reconnection Rate (% of Disconnections)</ChartTitle>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={months.map((month, i) => {
                    let rate;
                    if (selectedUtility === 'all') {
                      const totalRecon = utilities.reduce((sum, u) => sum + reconnections[u.id][i], 0);
                      const totalDisc = utilities.reduce((sum, u) => sum + disconnections[u.id][i], 0);
                      rate = totalDisc > 0 ? (totalRecon / totalDisc) * 100 : 0;
                    } else {
                      const recon = reconnections[selectedUtility]?.[i] || 0;
                      const disc = disconnections[selectedUtility]?.[i] || 0;
                      rate = disc > 0 ? (recon / disc) * 100 : 0;
                    }
                    return { month, value: parseFloat(rate.toFixed(1)) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} name="Reconnection Rate" />
                  </LineChart>
                </ResponsiveContainer>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6B7280', fontStyle: 'italic' }}>
                  Reconnection rate = (Reconnections within 7 days / Disconnections) × 100
                </p>
              </div>
            </div>
          </>
        )}

        {/* ==================== BILL DISCOUNTS TAB ==================== */}
        {activeTab === 'billDiscount' && (
          <>
            <UtilityFilter />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Participants by Utility */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="billDiscountParticipants">Bill Discount Participants</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({ name: u.short, part: billDiscountParticipants[u.id][currentMonth], color: u.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v) => formatNumber(v)} />
                    <Bar dataKey="part" radius={[0, 4, 4, 0]} name="Participants">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Dollars Disbursed */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="billDiscountDollars" style={{ color: '#059669' }}>Monthly Discount Dollars</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilities.map(u => ({ name: u.short, dollars: billDiscountDollars[u.id][currentMonth], color: u.color }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="dollars" radius={[0, 4, 4, 0]} name="Dollars">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Participants Trend */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <ChartTitle defKey="billDiscountParticipants">Bill Discount Participants Trend</ChartTitle>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getChartData(billDiscountParticipants)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatNumber(v)} />
                  <Area type="monotone" dataKey="value" stroke="#059669" fill="#D1FAE5" name="Participants" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Dollars Trend */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <ChartTitle defKey="billDiscountDollars" style={{ color: '#059669' }}>Monthly Bill Discount Dollars Trend</ChartTitle>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getChartData(billDiscountDollars)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="value" stroke="#059669" fill="#D1FAE5" name="Dollars" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Program Recipient Disconnections Section */}
            <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #FCD34D' }}>
              <p style={{ margin: 0, color: '#92400E', fontSize: '14px' }}>
                <strong>Bill Discount Recipient Disconnections</strong> — Service disconnections among customers enrolled in bill discount programs (Jan 2024 - Sep 2025).
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Bill Discount Recipient Disconnections by Utility - Total */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="billDiscountDisconnections" style={{ color: '#DC2626' }}>Bill Discount Recipient Disconnections by Utility</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={utilities.map(u => ({ 
                      name: u.short, 
                      total: billDiscountDisconnections[u.id].reduce((a, b) => a + b, 0),
                      color: u.color 
                    })).sort((a, b) => b.total - a.total)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [formatNumber(v), 'Disconnections']} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Total Disconnections">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
                  Total: {formatNumber(utilities.reduce((sum, u) => sum + billDiscountDisconnections[u.id].reduce((a, b) => a + b, 0), 0))} disconnections (Jan 2024 - Sep 2025)
                </p>
              </div>

              {/* Monthly Trend - Bill Discount Recipient Disconnections */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#DC2626' }}>
                  Bill Discount Recipient Disconnections - Monthly Trend
                  {selectedUtility !== 'all' && (
                    <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#6B7280' }}>
                      {' '}({utilities.find(u => u.id === selectedUtility)?.name})
                    </span>
                  )}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getChartData(billDiscountDisconnections)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [formatNumber(v), 'Disconnections']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedUtility !== 'all' ? utilities.find(u => u.id === selectedUtility)?.color : '#DC2626'} 
                      fill={selectedUtility !== 'all' ? `${utilities.find(u => u.id === selectedUtility)?.color}20` : '#FEE2E2'} 
                      name="Bill Discount Disconnections" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Normalized Metrics Section */}
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
              <p style={{ margin: 0, color: '#1E40AF', fontSize: '14px' }}>
                <strong>Normalized Comparison Metrics</strong> — These rates allow fair comparison across utilities of different sizes.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Disconnection Rate for Bill Discount Participants */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1E3A5F' }}>Disconnection Rate for Bill Discount Participants</h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6B7280' }}>Bill Discount Disconnections ÷ Bill Discount Participants (Sep 2025)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={utilities.map(u => {
                      const discCount = billDiscountDisconnections[u.id][currentMonth] || 0;
                      const partCount = billDiscountParticipants[u.id][currentMonth] || 1;
                      return { 
                        name: u.short, 
                        rate: ((discCount / partCount) * 100),
                        color: u.color 
                      };
                    }).sort((a, b) => b.rate - a.rate)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, 'Disconnection Rate']} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Disconnection Rate">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Share of Total Disconnections */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1E3A5F' }}>Share of Total Disconnections (Bill Discount Customers)</h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6B7280' }}>Bill Discount Disconnections ÷ Total Residential Disconnections (Sep 2025)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={utilities.map(u => {
                      const bdDisc = billDiscountDisconnections[u.id][currentMonth] || 0;
                      const totalDisc = disconnections[u.id][currentMonth] || 1;
                      return { 
                        name: u.short, 
                        share: ((bdDisc / totalDisc) * 100),
                        color: u.color 
                      };
                    }).sort((a, b) => b.share - a.share)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Share of Disconnections']} />
                    <Bar dataKey="share" radius={[0, 4, 4, 0]} name="Share of Total">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Charts for Normalized Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Disconnection Rate Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1E3A5F' }}>
                  Disconnection Rate Trend
                  {selectedUtility !== 'all' && (
                    <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#6B7280' }}>
                      {' '}({utilities.find(u => u.id === selectedUtility)?.name})
                    </span>
                  )}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6B7280' }}>Bill Discount Disconnections ÷ Bill Discount Participants</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={months.map((m, i) => {
                    if (selectedUtility === 'all') {
                      const totalDisc = utilities.reduce((sum, u) => sum + (billDiscountDisconnections[u.id][i] || 0), 0);
                      const totalPart = utilities.reduce((sum, u) => sum + (billDiscountParticipants[u.id][i] || 0), 0);
                      return { month: m, rate: totalPart > 0 ? (totalDisc / totalPart) * 100 : 0 };
                    } else {
                      const disc = billDiscountDisconnections[selectedUtility]?.[i] || 0;
                      const part = billDiscountParticipants[selectedUtility]?.[i] || 1;
                      return { month: m, rate: (disc / part) * 100 };
                    }
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={(v) => `${v.toFixed(1)}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v.toFixed(2)}%`, 'Disconnection Rate']} />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke={selectedUtility !== 'all' ? utilities.find(u => u.id === selectedUtility)?.color : '#1E3A5F'} 
                      strokeWidth={2}
                      dot={false}
                      name="Disconnection Rate" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Share of Disconnections Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1E3A5F' }}>
                  Share of Total Disconnections Trend
                  {selectedUtility !== 'all' && (
                    <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#6B7280' }}>
                      {' '}({utilities.find(u => u.id === selectedUtility)?.name})
                    </span>
                  )}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6B7280' }}>Bill Discount Disconnections ÷ Total Residential Disconnections</p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={months.map((m, i) => {
                    if (selectedUtility === 'all') {
                      const totalBdDisc = utilities.reduce((sum, u) => sum + (billDiscountDisconnections[u.id][i] || 0), 0);
                      const totalDisc = utilities.reduce((sum, u) => sum + (disconnections[u.id][i] || 0), 0);
                      return { month: m, share: totalDisc > 0 ? (totalBdDisc / totalDisc) * 100 : 0 };
                    } else {
                      const bdDisc = billDiscountDisconnections[selectedUtility]?.[i] || 0;
                      const totalDisc = disconnections[selectedUtility]?.[i] || 1;
                      return { month: m, share: (bdDisc / totalDisc) * 100 };
                    }
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Share of Disconnections']} />
                    <Line 
                      type="monotone" 
                      dataKey="share" 
                      stroke={selectedUtility !== 'all' ? utilities.find(u => u.id === selectedUtility)?.color : '#7C3AED'} 
                      strokeWidth={2}
                      dot={false}
                      name="Share of Disconnections" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bill Discount Participant Arrears Section */}
            <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', marginBottom: '24px', marginTop: '32px', border: '1px solid #FCD34D' }}>
              <p style={{ margin: 0, color: '#92400E', fontSize: '14px' }}>
                <strong>Bill Discount Participant Arrears</strong> — Number of bill discount participants with arrears balances and total arrears amounts (Jan 2024 - Sep 2025). Note: PGE data only available for Jul-Sep 2025.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Bill Discount Participants with Arrears by Utility */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="billDiscountArrearsParticipants" style={{ color: '#DC2626' }}>Bill Discount Participants with Arrears (Sep 2025)</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={utilities.map(u => ({ 
                      name: u.short, 
                      count: billDiscountParticipantsWithArrears[u.id][currentMonth] || 0,
                      color: u.color 
                    })).sort((a, b) => b.count - a.count)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [formatNumber(v), 'Participants with Arrears']} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Participants">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Total Arrears Balance by Utility */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <ChartTitle defKey="billDiscountArrearsBalance" style={{ color: '#DC2626' }}>Arrears Balance of Bill Discount Participants (Sep 2025)</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={utilities.map(u => ({ 
                      name: u.short, 
                      balance: billDiscountArrearsBalance[u.id][currentMonth] || 0,
                      color: u.color 
                    })).sort((a, b) => b.balance - a.balance)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Arrears Balance']} />
                    <Bar dataKey="balance" radius={[0, 4, 4, 0]} name="Arrears Balance">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Charts for Arrears */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Participants with Arrears Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>
                  Bill Discount Participants with Arrears - Monthly Trend
                  {selectedUtility !== 'all' && (
                    <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#6B7280' }}>
                      {' '}({utilities.find(u => u.id === selectedUtility)?.name})
                    </span>
                  )}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={getChartData(billDiscountParticipantsWithArrears)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [formatNumber(v), 'Participants with Arrears']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedUtility !== 'all' ? utilities.find(u => u.id === selectedUtility)?.color : '#7C3AED'} 
                      fill={selectedUtility !== 'all' ? `${utilities.find(u => u.id === selectedUtility)?.color}20` : '#EDE9FE'} 
                      name="Participants with Arrears" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Arrears Balance Trend */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>
                  Arrears Balance of Bill Discount Participants - Monthly Trend
                  {selectedUtility !== 'all' && (
                    <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#6B7280' }}>
                      {' '}({utilities.find(u => u.id === selectedUtility)?.name})
                    </span>
                  )}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={getChartData(billDiscountArrearsBalance)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Arrears Balance']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={selectedUtility !== 'all' ? utilities.find(u => u.id === selectedUtility)?.color : '#059669'} 
                      fill={selectedUtility !== 'all' ? `${utilities.find(u => u.id === selectedUtility)?.color}20` : '#D1FAE5'} 
                      name="Arrears Balance" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Normalized Arrears Metrics */}
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
              <p style={{ margin: 0, color: '#1E40AF', fontSize: '14px' }}>
                <strong>Normalized Arrears Metrics</strong> — Average arrears per participant and arrears rate allow fair comparison across utilities.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Arrears Rate (% of participants with arrears) */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1E3A5F' }}>Bill Discount Arrears Rate</h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6B7280' }}>Participants with Arrears ÷ Total Bill Discount Participants (Sep 2025)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={utilities.map(u => {
                      const withArrears = billDiscountParticipantsWithArrears[u.id][currentMonth] || 0;
                      const totalPart = billDiscountParticipants[u.id][currentMonth] || 1;
                      return { 
                        name: u.short, 
                        rate: withArrears > 0 ? ((withArrears / totalPart) * 100) : 0,
                        color: u.color 
                      };
                    }).filter(d => d.rate > 0).sort((a, b) => b.rate - a.rate)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Arrears Rate']} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Arrears Rate">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Arrears per Participant */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1E3A5F' }}>Average Arrears per Participant</h3>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6B7280' }}>Total Arrears Balance ÷ Participants with Arrears (Sep 2025)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={utilities.map(u => {
                      const balance = billDiscountArrearsBalance[u.id][currentMonth] || 0;
                      const withArrears = billDiscountParticipantsWithArrears[u.id][currentMonth] || 1;
                      return { 
                        name: u.short, 
                        avg: balance > 0 ? (balance / withArrears) : 0,
                        color: u.color 
                      };
                    }).filter(d => d.avg > 0).sort((a, b) => b.avg - a.avg)} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Average Arrears']} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]} name="Avg Arrears">
                      {utilities.map((u, i) => <Cell key={i} fill={u.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ==================== UTILITY COMPARISON TAB ==================== */}
        {activeTab === 'comparison' && (
          <>
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
              <p style={{ margin: 0, color: '#1E40AF', fontSize: '14px' }}>
                <strong>Normalized Comparison</strong> — Rates and percentages allow fair comparison across utilities of different sizes. Electric usage in kWh, gas usage in therms.
              </p>
            </div>

            {/* Comparison Table */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>September 2025 Comparison</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Utility</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #E5E7EB' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Accounts</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Arrears Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Avg Arrears</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Disc. Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Avg Bill</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Avg Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilities.map(u => {
                      const acct = accounts[u.id][currentMonth];
                      const arrCust = arrearsCustomers[u.id][currentMonth];
                      const arrBal = arrearsBalance[u.id][currentMonth];
                      const disc = disconnections[u.id][currentMonth];
                      const bill = avgBill[u.id][currentMonth];
                      const usage = avgUsage[u.id][currentMonth];
                      const isElectric = ['pge', 'pac', 'ipco'].includes(u.id);
                      
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: u.color, marginRight: '8px' }}></span>
                            {u.name}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '10px', 
                              fontSize: '11px',
                              background: isElectric ? '#DBEAFE' : '#FEF3C7',
                              color: isElectric ? '#1E40AF' : '#92400E'
                            }}>
                              {isElectric ? 'Electric' : 'Gas'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{formatNumber(acct)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{((arrCust / acct) * 100).toFixed(1)}%</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>${Math.round(arrBal / arrCust)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{discPct[u.id][currentMonth].toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>${bill}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{usage} {isElectric ? 'kWh' : 'therms'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Average Bill Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0284C7' }}>Average Bill Trend - All Utilities</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={months.map((month, i) => {
                    const row = { month };
                    utilities.forEach(u => { row[u.short] = avgBill[u.id][i]; });
                    return row;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={3} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `$${v}`} />
                    <Legend />
                    {utilities.map(u => (
                      <Line key={u.id} type="monotone" dataKey={u.short} stroke={u.color} strokeWidth={1.5} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Average Usage Comparison - Electric */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Average Usage Trend - Electric (kWh)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={months.map((month, i) => {
                    const row = { month };
                    ['pge', 'pac', 'ipco'].forEach(uid => {
                      const u = utilities.find(x => x.id === uid);
                      row[u.short] = avgUsage[uid][i];
                    });
                    return row;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v} kWh`} />
                    <Legend />
                    {['pge', 'pac', 'ipco'].map(uid => {
                      const u = utilities.find(x => x.id === uid);
                      return <Line key={uid} type="monotone" dataKey={u.short} stroke={u.color} strokeWidth={1.5} dot={false} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Disconnection Rate and Arrears Rate Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#DC2626' }}>Disconnection Rate Trend (% of Customers)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={months.map((month, i) => {
                    const row = { month };
                    utilities.forEach(u => { row[u.short] = discPct[u.id][i]; });
                    return row;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={3} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend />
                    {utilities.map(u => (
                      <Line key={u.id} type="monotone" dataKey={u.short} stroke={u.color} strokeWidth={1.5} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Average Usage Comparison - Gas */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#7C3AED' }}>Average Usage Trend - Gas (Therms)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={months.map((month, i) => {
                    const row = { month };
                    ['nwn', 'cng', 'avista'].forEach(uid => {
                      const u = utilities.find(x => x.id === uid);
                      row[u.short] = avgUsage[uid][i];
                    });
                    return row;
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v} therms`} />
                    <Legend />
                    {['nwn', 'cng', 'avista'].map(uid => {
                      const u = utilities.find(x => x.id === uid);
                      return <Line key={uid} type="monotone" dataKey={u.short} stroke={u.color} strokeWidth={1.5} dot={false} />;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Arrears Balance by Age Bucket - Comparison */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Arrears Balance by Age Bucket - All Utilities (Sep 2025)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={utilities.map(u => ({
                  name: u.short,
                  '31-60 Days': arrearsBalance31_60[u.id][currentMonth],
                  '61-90 Days': arrearsBalance61_90[u.id][currentMonth],
                  '91+ Days': arrearsBalance91Plus[u.id][currentMonth],
                  color: u.color
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="31-60 Days" stackId="a" fill="#FBBF24" name="31-60 Days" />
                  <Bar dataKey="61-90 Days" stackId="a" fill="#F97316" name="61-90 Days" />
                  <Bar dataKey="91+ Days" stackId="a" fill="#DC2626" name="91+ Days" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ==================== GEOGRAPHIC VIEW TAB ==================== */}
        {activeTab === 'geographic' && (() => {
          const bounds = geoRegions[geoRegion];
          const mapWidth = 850, mapHeight = 520;
          const { latMin, latMax, lngMin, lngMax } = bounds;
          const xScale = (lng) => ((lng - lngMin) / (lngMax - lngMin)) * (mapWidth - 60) + 30;
          const yScale = (lat) => mapHeight - 30 - ((lat - latMin) / (latMax - latMin)) * (mapHeight - 60);
          
          const getGeoMetricValue = (data, month, metric) => {
            const d = data[month];
            if (!d || !d.active) return 0;
            switch(metric) {
              case 'arrears_rate': return d.active > 0 ? (d.arrears / d.active * 100) : 0;
              case 'disc_rate': return d.active > 0 ? (d.disc / d.active * 100) : 0;
              case 'arrears_count': return d.arrears;
              case 'disconnections': return d.disc;
              default: return 0;
            }
          };
          
          let allGeoData = [];
          const utilKeys = geoUtility === 'all' ? ['pge', 'nwn', 'avista', 'cng', 'pac', 'ipco'] : [geoUtility];
          utilKeys.forEach(uk => {
            if (geoZipData[uk]) {
              geoZipData[uk].forEach(d => {
                if (d[geoMonth]?.active > 20) {
                  allGeoData.push({ ...d, utility: uk, value: getGeoMetricValue(d, geoMonth, geoMetric) });
                }
              });
            }
          });
          allGeoData.sort((a, b) => b.value - a.value);
          
          const filteredGeoData = allGeoData
            .filter(d => d.lat >= latMin && d.lat <= latMax && d.lng >= lngMin && d.lng <= lngMax)
            .map(d => ({ ...d, x: xScale(d.lng), y: yScale(d.lat) }));
          
          const geoValues = allGeoData.map(d => d.value).filter(v => v > 0);
          const geoMinVal = geoValues.length ? Math.min(...geoValues) : 0;
          const geoMaxVal = geoValues.length ? Math.max(...geoValues) : 1;
          
          const getGeoColor = (value, util) => {
            const t = geoMaxVal > geoMinVal ? (value - geoMinVal) / (geoMaxVal - geoMinVal) : 0;
            const l = 82 - t * 42;
            if (util === 'pge') return `hsl(142, 65%, ${l}%)`;
            if (util === 'nwn') return `hsl(217, 80%, ${l}%)`;
            if (util === 'avista') return `hsl(25, 85%, ${l}%)`;
            if (util === 'cng') return `hsl(271, 70%, ${l}%)`;
            if (util === 'ipco') return `hsl(188, 85%, ${l}%)`;
            return `hsl(0, 70%, ${l}%)`;
          };
          
          const cities = geoCities[geoRegion] || [];
          const activeZip = geoSelected || geoHover;
          const activeItems = activeZip ? filteredGeoData.filter(d => d.zip === activeZip) : [];
          const cfg = geoMetricConfig[geoMetric];
          const isStatewide = geoRegion === 'statewide';
          
          return (
            <>
              <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
                <p style={{ margin: 0, color: '#1E40AF', fontSize: '14px' }}>
                  <strong>Geographic View</strong> — Explore ZIP code-level utility data across Oregon. Q2 2025 data (April–June). Click a circle to pin details, hover to preview.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Map Area */}
                <div style={{ flex: 1, background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  {/* Controls */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={geoRegion} onChange={e => setGeoRegion(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                      {Object.entries(geoRegions).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                    </select>
                    <select value={geoUtility} onChange={e => setGeoUtility(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                      <option value="all">All Utilities</option>
                      {Object.entries(geoUtilityNames).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={geoMonth} onChange={e => setGeoMonth(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                      <option value="apr">April 2025</option>
                      <option value="may">May 2025</option>
                      <option value="jun">June 2025</option>
                    </select>
                    <select value={geoMetric} onChange={e => setGeoMetric(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                      {Object.entries(geoMetricConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  
                  {/* Map SVG */}
                  <div style={{ position: 'relative' }}>
                    <svg width="100%" height="520" viewBox={`0 0 ${mapWidth} ${mapHeight}`} style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #ecfdf5 100%)', display: 'block' }}>
                      {/* State outline */}
                      {isStatewide && (
                        <path d={`M${xScale(-124.55)},${yScale(46.26)} L${xScale(-123.36)},${yScale(46.26)} L${xScale(-122.78)},${yScale(45.87)} L${xScale(-122.24)},${yScale(45.55)} L${xScale(-121.20)},${yScale(45.70)} L${xScale(-119.99)},${yScale(45.93)} L${xScale(-117.03)},${yScale(46.00)} L${xScale(-116.92)},${yScale(44.09)} L${xScale(-117.03)},${yScale(42.00)} L${xScale(-120.00)},${yScale(42.00)} L${xScale(-124.21)},${yScale(42.00)} L${xScale(-124.55)},${yScale(42.84)} L${xScale(-124.06)},${yScale(44.66)} L${xScale(-124.06)},${yScale(46.00)} Z`} 
                          fill="#f0fdf4" stroke="#64748b" strokeWidth="2" />
                      )}
                      
                      {/* ZIP code circles */}
                      {filteredGeoData.map((d, idx) => {
                        const isActive = d.zip === activeZip;
                        const sameZip = filteredGeoData.filter(x => x.zip === d.zip);
                        const zipIdx = sameZip.indexOf(d);
                        const offset = sameZip.length > 1 ? (zipIdx - (sameZip.length-1)/2) * (isStatewide ? 6 : 12) : 0;
                        const radius = isStatewide ? 5 : 9;
                        
                        return (
                          <g key={`${d.zip}-${d.utility}-${idx}`} style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setGeoHover(d.zip)} onMouseLeave={() => setGeoHover(null)}
                            onClick={() => setGeoSelected(geoSelected === d.zip ? null : d.zip)}>
                            {isActive && <circle cx={d.x + offset} cy={d.y} r={radius + 5} fill="none" stroke={geoUtilityColors[d.utility]} strokeWidth="2" />}
                            <circle cx={d.x + offset} cy={d.y} r={radius} fill={getGeoColor(d.value, d.utility)} stroke="white" strokeWidth={isStatewide ? 1 : 1.5} />
                            {!isStatewide && <text x={d.x + offset} y={d.y + 3} fontSize="7" fill="#1e293b" textAnchor="middle" fontWeight="700">{d.zip.slice(-2)}</text>}
                          </g>
                        );
                      })}
                      
                      {/* City markers */}
                      {cities.map(c => (
                        <g key={c.name}>
                          <circle cx={xScale(c.lng)} cy={yScale(c.lat)} r={isStatewide ? 2 : 3} fill="#1e293b" />
                          <text x={xScale(c.lng)} y={yScale(c.lat) - (isStatewide ? 5 : 7)} fontSize={isStatewide ? 8 : 10} fill="#1e293b" textAnchor="middle" fontWeight="600">{c.name}</text>
                        </g>
                      ))}
                    </svg>
                    
                    {/* Legend */}
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'white', borderRadius: 6, padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', fontSize: 9 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{cfg.label}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                        {Object.entries(geoUtilityNames).map(([uk, uname]) => (
                          <div key={uk} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <div style={{ width: 24, height: 5, borderRadius: 2, background: `linear-gradient(to right, ${getGeoColor(geoMinVal, uk)}, ${getGeoColor(geoMaxVal, uk)})` }} />
                            <span style={{ color: '#64748b', fontSize: 7 }}>{uname.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, color: '#94a3b8', fontSize: 8 }}>
                        <span>{cfg.format(geoMinVal)}</span><span>{cfg.format(geoMaxVal)}</span>
                      </div>
                    </div>
                    
                    {/* Hover tooltip */}
                    {geoHover && !geoSelected && activeItems.length > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'white', borderRadius: 6, padding: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: 160 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>ZIP {geoHover}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>{geoMonthLabels[geoMonth]}</div>
                        {activeItems.map(d => (
                          <div key={d.utility} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid #f1f5f9', fontSize: 11 }}>
                            <span style={{ color: geoUtilityColors[d.utility], fontWeight: 600 }}>{geoUtilityNames[d.utility]}</span>
                            <span style={{ fontWeight: 600 }}>{cfg.format(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sidebar */}
                <div style={{ width: '280px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '568px' }}>
                  {activeItems.length > 0 ? (
                    <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#1E3A5F' }}>ZIP {activeZip}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{geoMonthLabels[geoMonth]}</div>
                        </div>
                        {geoSelected && <button onClick={() => setGeoSelected(null)} style={{ background: '#f1f5f9', border: 'none', width: 24, height: 24, borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>×</button>}
                      </div>
                      {activeItems.map(item => (
                        <div key={item.utility} style={{ marginTop: 10, background: '#f8fafc', borderRadius: 6, padding: 10, borderLeft: `3px solid ${geoUtilityColors[item.utility]}` }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: geoUtilityColors[item.utility], marginBottom: 4 }}>{geoUtilityNames[item.utility]}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                            <div><span style={{ color: '#64748b' }}>Active:</span> <strong>{item[geoMonth].active.toLocaleString()}</strong></div>
                            <div><span style={{ color: '#64748b' }}>Arrears:</span> <strong>{item[geoMonth].arrears.toLocaleString()}</strong></div>
                            <div><span style={{ color: '#64748b' }}>Rate:</span> <strong>{(item[geoMonth].arrears/item[geoMonth].active*100).toFixed(1)}%</strong></div>
                            <div><span style={{ color: '#64748b' }}>Disc:</span> <strong>{item[geoMonth].disc}</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 16, color: '#64748b' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Select a ZIP code</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Hover to preview, click to pin</div>
                    </div>
                  )}
                  
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                        Top by {cfg.label}
                      </div>
                    </div>
                    {(isStatewide ? allGeoData : filteredGeoData).slice(0, 50).map((d, i) => (
                      <div key={`${d.zip}-${d.utility}-${i}`} style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', cursor: 'pointer',
                        background: activeZip === d.zip ? '#f1f5f9' : 'transparent', borderLeft: activeZip === d.zip ? `3px solid ${geoUtilityColors[d.utility]}` : '3px solid transparent' }}
                        onMouseEnter={() => setGeoHover(d.zip)} onMouseLeave={() => setGeoHover(null)} onClick={() => setGeoSelected(geoSelected === d.zip ? null : d.zip)}>
                        <span style={{ width: 20, fontSize: 10, color: '#94a3b8' }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{d.zip}</span>
                        <span style={{ fontSize: 8, padding: '2px 4px', borderRadius: 3, marginRight: 6, background: `${geoUtilityColors[d.utility]}15`, color: geoUtilityColors[d.utility], fontWeight: 700 }}>
                          {d.utility === 'nwn' ? 'NWN' : d.utility === 'cng' ? 'CAS' : d.utility === 'avista' ? 'AVA' : d.utility === 'pac' ? 'PAC' : d.utility === 'ipco' ? 'IDA' : 'PGE'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{cfg.format(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* ==================== EXPORT DATA TAB ==================== */}
        {activeTab === 'export' && (
          <>
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
              <p style={{ margin: 0, color: '#1E40AF', fontSize: '14px' }}>
                <strong>Export Dashboard Data</strong> — Download all data from this dashboard as an Excel file with multiple sheets for easy analysis in spreadsheet software.
              </p>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '18px', color: '#1E3A5F' }}>Download Data</h3>
              
              <p style={{ color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' }}>
                The Excel file will include the following sheets:
              </p>
              
              <ul style={{ color: '#374151', marginBottom: '32px', lineHeight: '2' }}>
                <li><strong>Summary</strong> — Current month totals and key metrics</li>
                <li><strong>Arrears - Customers</strong> — Monthly customers in arrears by utility</li>
                <li><strong>Arrears - Balance</strong> — Monthly arrears balance by utility</li>
                <li><strong>Arrears - By Bucket</strong> — Arrears breakdown by age (31-60, 61-90, 91+ days)</li>
                <li><strong>Disconnections</strong> — Monthly disconnection counts and rates</li>
                <li><strong>Bill Discounts</strong> — Participants and dollars by utility</li>
                <li><strong>Avg Bill & Usage</strong> — Average residential bill and usage by utility</li>
                <li><strong>Active Accounts</strong> — Monthly active residential accounts</li>
              </ul>

              <button
                onClick={() => {
                  // Create workbook
                  const wb = XLSX.utils.book_new();
                  
                  // Sheet 1: Summary
                  const summaryData = [
                    ['Oregon Energy Burden Dashboard - Data Export'],
                    ['Source: Oregon PUC Docket RO 16 Energy Burden Metrics Reports'],
                    ['Period: January 2024 - September 2025'],
                    ['Export Date: ' + new Date().toLocaleDateString()],
                    [],
                    ['Current Month Summary (September 2025)'],
                    [],
                    ['Utility', 'Type', 'Active Accounts', 'Customers in Arrears', 'Arrears Balance', 'Disconnections', 'Avg Bill', 'Avg Usage'],
                    ...utilities.map(u => [
                      u.name,
                      u.type,
                      accounts[u.id][currentMonth],
                      arrearsCustomers[u.id][currentMonth],
                      arrearsBalance[u.id][currentMonth],
                      disconnections[u.id][currentMonth],
                      avgBill[u.id][currentMonth],
                      avgUsage[u.id][currentMonth]
                    ])
                  ];
                  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

                  // Sheet 2: Arrears - Customers
                  const arrearsCustomersData = [
                    ['Customers in Arrears by Utility'],
                    [],
                    ['Month', ...utilities.map(u => u.name)],
                    ...months.map((month, i) => [month, ...utilities.map(u => arrearsCustomers[u.id][i])])
                  ];
                  const wsArrearsCust = XLSX.utils.aoa_to_sheet(arrearsCustomersData);
                  XLSX.utils.book_append_sheet(wb, wsArrearsCust, 'Arrears - Customers');

                  // Sheet 3: Arrears - Balance
                  const arrearsBalanceData = [
                    ['Arrears Balance by Utility ($)'],
                    [],
                    ['Month', ...utilities.map(u => u.name)],
                    ...months.map((month, i) => [month, ...utilities.map(u => arrearsBalance[u.id][i])])
                  ];
                  const wsArrearsBal = XLSX.utils.aoa_to_sheet(arrearsBalanceData);
                  XLSX.utils.book_append_sheet(wb, wsArrearsBal, 'Arrears - Balance');

                  // Sheet 4: Arrears by Bucket
                  const arrearsBucketData = [
                    ['Arrears Balance by Age Bucket ($)'],
                    [],
                    ['Month', 'Utility', '31-60 Days', '61-90 Days', '91+ Days', 'Total'],
                    ...months.flatMap((month, i) => 
                      utilities.map(u => [
                        month,
                        u.name,
                        arrearsBalance31_60[u.id][i],
                        arrearsBalance61_90[u.id][i],
                        arrearsBalance91Plus[u.id][i],
                        arrearsBalance[u.id][i]
                      ])
                    )
                  ];
                  const wsArrearsBucket = XLSX.utils.aoa_to_sheet(arrearsBucketData);
                  XLSX.utils.book_append_sheet(wb, wsArrearsBucket, 'Arrears - By Bucket');

                  // Sheet 5: Disconnections
                  const disconnectionsData = [
                    ['Disconnections by Utility'],
                    [],
                    ['Month', ...utilities.map(u => u.name + ' (Count)'), ...utilities.map(u => u.name + ' (Rate %)')],
                    ...months.map((month, i) => [
                      month, 
                      ...utilities.map(u => disconnections[u.id][i]),
                      ...utilities.map(u => discPct[u.id][i])
                    ])
                  ];
                  const wsDisc = XLSX.utils.aoa_to_sheet(disconnectionsData);
                  XLSX.utils.book_append_sheet(wb, wsDisc, 'Disconnections');

                  // Sheet 6: Bill Discounts
                  const billDiscountData = [
                    ['Bill Discount Programs'],
                    [],
                    ['Month', ...utilities.map(u => u.name + ' (Participants)'), ...utilities.map(u => u.name + ' (Dollars)')],
                    ...months.map((month, i) => [
                      month,
                      ...utilities.map(u => billDiscountParticipants[u.id][i]),
                      ...utilities.map(u => billDiscountDollars[u.id][i])
                    ])
                  ];
                  const wsBillDisc = XLSX.utils.aoa_to_sheet(billDiscountData);
                  XLSX.utils.book_append_sheet(wb, wsBillDisc, 'Bill Discounts');

                  // Sheet 7: Avg Bill & Usage
                  const avgBillUsageData = [
                    ['Average Residential Bill ($) and Usage'],
                    ['Note: Electric utilities in kWh, Gas utilities in therms'],
                    [],
                    ['Month', ...utilities.map(u => u.name + ' (Avg Bill $)'), ...utilities.map(u => u.name + ' (Avg Usage)')],
                    ...months.map((month, i) => [
                      month,
                      ...utilities.map(u => avgBill[u.id][i]),
                      ...utilities.map(u => avgUsage[u.id][i])
                    ])
                  ];
                  const wsAvgBill = XLSX.utils.aoa_to_sheet(avgBillUsageData);
                  XLSX.utils.book_append_sheet(wb, wsAvgBill, 'Avg Bill & Usage');

                  // Sheet 8: Active Accounts
                  const accountsData = [
                    ['Active Residential Accounts by Utility'],
                    [],
                    ['Month', ...utilities.map(u => u.name)],
                    ...months.map((month, i) => [month, ...utilities.map(u => accounts[u.id][i])])
                  ];
                  const wsAccounts = XLSX.utils.aoa_to_sheet(accountsData);
                  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Active Accounts');

                  // Download
                  XLSX.writeFile(wb, 'Oregon_Energy_Burden_Dashboard_Data.xlsx');
                }}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Excel File
              </button>
            </div>

            {/* Data Preview */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Data Preview - September 2025</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Utility</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Accounts</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>In Arrears</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Arrears $</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>31-60 Days</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>61-90 Days</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>91+ Days</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Disconnects</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Avg Bill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilities.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: u.color, marginRight: '8px' }}></span>
                          {u.short}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatNumber(accounts[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatNumber(arrearsCustomers[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(arrearsBalance[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(arrearsBalance31_60[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(arrearsBalance61_90[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(arrearsBalance91Plus[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{formatNumber(disconnections[u.id][currentMonth])}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>${avgBill[u.id][currentMonth]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Methodology</h3>
              
              <div style={{ color: '#374151', fontSize: '14px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '16px' }}>
                  <strong>Data Source:</strong> All data is extracted from utility Energy Burden Metrics Reports (EBMR) filed with the Oregon Public Utility Commission under Docket RO 16, pursuant to OAR 860-021-0408.
                </p>

                <p style={{ marginBottom: '16px' }}>
                  <strong>Reporting Period:</strong> January 2024 through September 2025 (21 months). All data is verified from official EBMR submissions filed with the Oregon PUC.
                </p>

                <p style={{ marginBottom: '16px' }}>
                  <strong>Percent Change Calculations:</strong> All trend indicators compare the average of the most recent 3 months of verified data (Jul–Sep 2025) to the prior 3 months (Apr–Jun 2025). A change greater than +2% is shown as "Trending Up," less than -2% as "Trending Down," and between -2% and +2% as "Flat."
                </p>

                <p style={{ marginBottom: '16px' }}>
                  <strong>Weighted Average Residential Bill:</strong> The statewide average bill is calculated as a weighted average based on each utility's customer count. Formula: Σ(Utility Accounts × Utility Avg Bill) ÷ Σ(Utility Accounts). This ensures larger utilities have proportionally greater influence on the statewide figure.
                </p>

                <p style={{ marginBottom: '16px' }}>
                  <strong>Arrears Aging Buckets:</strong> Arrears balances are segmented into three groups: 31–60 days past due, 61–90 days past due, and 91+ days past due, as reported by each utility.
                </p>

                <p style={{ marginBottom: '16px' }}>
                  <strong>Disconnection Rate:</strong> Calculated as (Monthly Disconnections ÷ Active Residential Accounts) × 100 for each utility.
                </p>

                <p style={{ marginBottom: '16px' }}>
                  <strong>Reconnection Rate:</strong> Calculated as (Reconnections within 7 days ÷ Disconnections) × 100. Reconnections include both same-day/next-day and 2-7 day reconnections following disconnection for non-payment.
                </p>

                <p style={{ marginBottom: '0' }}>
                  <strong>Utilities Included:</strong> Portland General Electric (PGE), Pacific Power, NW Natural, Avista, Cascade Natural Gas, and Idaho Power. PGE, Pacific Power, and Idaho Power are electric utilities; NW Natural, Avista, and Cascade Natural Gas are gas utilities.
                </p>
              </div>
            </div>

            {/* Glossary of Terms */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1E3A5F' }}>Glossary of Terms</h3>
              <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
                Definitions are from Oregon Administrative Rules (OAR 860-021-0408). Hover over the ⓘ icons throughout the dashboard for quick definitions.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Only show definitions for metrics actually used in the dashboard */}
                {[
                  'arrearsBalance',
                  'customersInArrears', 
                  'averageArrears',
                  'daysInArrears',
                  'disconnections',
                  'disconnectionRate',
                  'disconnectionNotices',
                  'reconnectionRate',
                  'billDiscountParticipants',
                  'billDiscountDollars',
                  'billDiscountDisconnections',
                  'billDiscountArrearsParticipants',
                  'billDiscountArrearsBalance',
                  'billDiscountArrearsRate',
                  'averageBill',
                  'averageUsage',
                  'residentialCustomer'
                ].map(key => {
                  const def = definitions[key];
                  if (!def) return null;
                  return (
                    <div key={key} style={{ 
                      background: '#F8FAFC', 
                      borderRadius: '8px', 
                      padding: '12px 16px',
                      borderLeft: '3px solid #3B82F6'
                    }}>
                      <div style={{ fontWeight: '600', color: '#1E3A5F', marginBottom: '4px', fontSize: '14px' }}>
                        {def.title}
                      </div>
                      <div style={{ color: '#374151', fontSize: '13px', lineHeight: '1.5', marginBottom: '6px' }}>
                        {def.definition}
                      </div>
                      <div style={{ color: '#6B7280', fontSize: '11px', fontStyle: 'italic' }}>
                        Source: {def.source}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: '32px', padding: '16px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF' }}>
          <strong>Data Source:</strong> Oregon PUC Docket RO 16 – Energy Burden Metrics Reports (OAR 860-021-0408)<br/>
          Period: January 2024 – September 2025 | Last Updated: January 2026<br/>
          <span style={{ marginTop: '8px', display: 'inline-block' }}>OPUC Staff Contact: Bret Farrell, <a href="mailto:Bret.Farrell@puc.oregon.gov" style={{ color: '#6B7280', textDecoration: 'underline' }}>Bret.Farrell@puc.oregon.gov</a></span>
        </div>
      </div>
    </div>
  );
}
