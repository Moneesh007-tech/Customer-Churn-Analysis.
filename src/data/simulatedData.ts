/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChurnCohort {
  tenureRange: string;
  retained: number;
  churned: number;
}

export interface ContractComparison {
  contract: string;
  churnRate: number;
  totalCustomers: number;
}

export interface SupportImpact {
  service: string;
  churnRate: number;
}

export const CHURN_COHORT_DATA: ChurnCohort[] = [
  { tenureRange: "1-6 Months", retained: 450, churned: 320 },
  { tenureRange: "7-12 Months", retained: 620, churned: 180 },
  { tenureRange: "13-24 Months", retained: 890, churned: 110 },
  { tenureRange: "25-36 Months", retained: 1120, churned: 65 },
  { tenureRange: "37-48 Months", retained: 1350, churned: 40 },
  { tenureRange: "49-60 Months", retained: 1580, churned: 22 },
  { tenureRange: "61-72 Months", retained: 1940, churned: 15 }
];

export const CONTRACT_COMPARISON_DATA: ContractComparison[] = [
  { contract: "Month-to-month", churnRate: 42.7, totalCustomers: 3875 },
  { contract: "One Year", churnRate: 11.2, totalCustomers: 1473 },
  { contract: "Two Year", churnRate: 2.8, totalCustomers: 1695 }
];

export const SUPPORT_IMPACT_DATA: SupportImpact[] = [
  { service: "No Tech Support", churnRate: 41.6 },
  { service: "No Internet Service", churnRate: 7.4 },
  { service: "Has Tech Support", churnRate: 15.2 }
];

export const ALTERNATIVE_NOTEBOOKS = [
  {
    id: "saas_rf",
    name: "SaaS_Unsubscription_RandomForest_v2.ipynb",
    description: "SaaS churn analysis featuring feature importance from Random Forest on user activity logs.",
    modelName: "Random Forest Classifier",
    accuracy: 88.2,
    codeCellsAnalyzed: 19,
    methodologySummary: "Analyzes user interaction logs of a multi-tenant B2B SaaS platform. Computes RFM metrics (Recency, Frequency, Monetary), scales numerical features, and fits a Random Forest model with class-balancing parameters.",
    features: [
      {
        name: "active_days_ratio",
        label: "Active Days Ratio (%)",
        type: "numerical" as const,
        description: "Percentage of days the user logged in during the last 30 days.",
        min: 0,
        max: 100,
        defaultValue: 60,
        importance: 0.42
      },
      {
        name: "pricing_tier",
        label: "Pricing Tier",
        type: "categorical" as const,
        description: "Active subscription tier (Starter, Professional, Enterprise).",
        options: ["Starter", "Professional", "Enterprise"],
        defaultValue: "Professional",
        importance: 0.28
      },
      {
        name: "support_tickets",
        label: "Support Tickets Opened (Last Month)",
        type: "numerical" as const,
        description: "Total number of customer support requests created recently.",
        min: 0,
        max: 15,
        defaultValue: 2,
        importance: 0.18
      },
      {
        name: "team_members",
        label: "Connected Team Members",
        type: "numerical" as const,
        description: "Number of unique team member accounts created on the organization's seat.",
        min: 1,
        max: 50,
        defaultValue: 5,
        importance: 0.12
      }
    ],
    keyInsights: [
      {
        title: "Active Days Ratio is Critical",
        description: "Users logging in on less than 30% of days in a month have an 82% unsubscription likelihood. Early engagement alerts are highly predictive.",
        metric: "42% Importance"
      },
      {
        title: "Professional Tier Exhibits Best Retention",
        description: "Starter tier has the highest churn due to self-service dropoffs. Enterprise tier exhibits steady retention backed by account managers.",
        metric: "28% Importance"
      }
    ]
  },
  {
    id: "fintech_ann",
    name: "Fintech_CreditCard_Churn_ANN.ipynb",
    description: "Artificial Neural Network model mapping credit transactions to banking card attrition.",
    modelName: "Sequential Neural Network (Keras)",
    accuracy: 91.4,
    codeCellsAnalyzed: 34,
    methodologySummary: "Prepares transaction-level details of credit card accounts. Implements deep neural layers with dropout, batch normalization, and Adam optimizer to model complex nonlinear retention boundaries.",
    features: [
      {
        name: "credit_score",
        label: "Credit Score",
        type: "numerical" as const,
        description: "Credit rating of the primary cardholder.",
        min: 300,
        max: 850,
        defaultValue: 680,
        importance: 0.38
      },
      {
        name: "inactive_months",
        label: "Inactive Months (Last Year)",
        type: "numerical" as const,
        description: "Number of consecutive months without card transactions.",
        min: 0,
        max: 12,
        defaultValue: 1,
        importance: 0.31
      },
      {
        name: "balance",
        label: "Account Balance ($)",
        type: "numerical" as const,
        description: "Current cash/credit outstanding balance.",
        min: 0,
        max: 50000,
        defaultValue: 4500,
        importance: 0.21
      },
      {
        name: "card_type",
        label: "Credit Card Type",
        type: "categorical" as const,
        description: "Card level issued to customer.",
        options: ["Blue", "Silver", "Gold", "Platinum"],
        defaultValue: "Blue",
        importance: 0.10
      }
    ],
    keyInsights: [
      {
        title: "Inactivity Duration Triggers Churn",
        description: "Exceeding 3 consecutive inactive months raises the attrition probability past 80%. Automated SMS alerts must trigger at month 2.",
        metric: "31% Importance"
      },
      {
        title: "Low Balances Signal Idle Cards",
        description: "Cards with balances under $500 exhibit a strong tendency to close compared to highly utilized premium cards.",
        metric: "21% Importance"
      }
    ]
  }
];
