/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotebookAnalysis } from '../types';

export const DEFAULT_NOTEBOOK_ANALYSIS: NotebookAnalysis = {
  notebookName: "Telco_Customer_Churn_XGBoost_Model.ipynb",
  modelName: "XGBoost Classifier (Optimized with Grid Search)",
  accuracy: 84.6,
  codeCellsAnalyzed: 28,
  methodologySummary: "This notebook cleans the standard Telco Customer Churn dataset, handles class imbalances using SMOTE, encodes categorical columns using target encoding, and trains an XGBoost classifier. Hyperparameters were tuned using 5-fold grid search to optimize recall (0.78) while maintaining solid precision (0.74). The model successfully predicts unsubscription events and flags critical risk drivers.",
  features: [
    {
      name: "contract",
      label: "Contract Type",
      type: "categorical",
      description: "Type of active contract the customer currently holds.",
      options: ["Month-to-month", "One year", "Two year"],
      defaultValue: "Month-to-month",
      importance: 0.35
    },
    {
      name: "tenure",
      label: "Tenure (Months)",
      type: "numerical",
      description: "Number of months the customer has stayed with the company.",
      min: 1,
      max: 72,
      defaultValue: 12,
      importance: 0.22
    },
    {
      name: "techSupport",
      label: "Tech Support Service",
      type: "categorical",
      description: "Whether the customer has subscribed to dedicated technical support.",
      options: ["Yes", "No", "No internet service"],
      defaultValue: "No",
      importance: 0.16
    },
    {
      name: "monthlyCharges",
      label: "Monthly Charges ($)",
      type: "numerical",
      description: "The amount charged to the customer on a monthly basis.",
      min: 15,
      max: 120,
      defaultValue: 75,
      importance: 0.12
    },
    {
      name: "internetService",
      label: "Internet Service Type",
      type: "categorical",
      description: "Type of internet service connection.",
      options: ["Fiber optic", "DSL", "No"],
      defaultValue: "Fiber optic",
      importance: 0.08
    },
    {
      name: "paymentMethod",
      label: "Payment Method",
      type: "categorical",
      description: "The preferred billing/payment configuration.",
      options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
      defaultValue: "Electronic check",
      importance: 0.04
    },
    {
      name: "paperlessBilling",
      label: "Paperless Billing",
      type: "categorical",
      description: "Whether the customer opts for digital/paperless statements.",
      options: ["Yes", "No"],
      defaultValue: "Yes",
      importance: 0.03
    }
  ],
  keyInsights: [
    {
      title: "Contract Type is the Dominant Predictor",
      description: "Customers on Month-to-month contracts are 6.4x more likely to unsubscribe than those on 1-year or 2-year commitments. Transitioning month-to-month accounts to annual contracts is the highest impact action.",
      metric: "35% Importance"
    },
    {
      title: "Support Desk Engagement is a Vital Anchor",
      description: "Customers with no dedicated Technical Support option exhibit a 44% churn rate, compared to just 15% for those who have active Tech Support. Standard onboarding should promote this service.",
      metric: "-29% Risk Reduction"
    },
    {
      title: "Fiber Optic / Price Sensitivity Intersection",
      description: "Fiber Optic users experience higher churn due to higher pricing ($90-$120/mo) coupled with initial setup frustration. This highlights an opportunity for price-protection programs in the first 6 months.",
      metric: "12% Importance"
    },
    {
      title: "Early Tenure Vulnerability",
      description: "The critical window for unsubscription is in the first 4 months. Customer attrition declines exponentially after month 12. A focused 'First 90 Days' customer success program is highly recommended.",
      metric: "22% Importance"
    }
  ]
};

export const DEFAULT_NOTEBOOK_CELLS = [
  {
    cellType: "markdown" as const,
    source: "# Customer Churn Prediction using XGBoost\nIn this notebook, we analyze customer unsubscription behaviors (churn) and train a high-performance gradient boosted tree model to proactively detect risk profiles and prevent revenue loss."
  },
  {
    cellType: "code" as const,
    source: "import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import LabelEncoder\nfrom xgboost import XGBClassifier\nfrom sklearn.metrics import classification_report, confusion_matrix, roc_auc_score",
    outputs: [
      {
        outputType: "stream",
        text: ["Libraries successfully imported.\n"]
      }
    ]
  },
  {
    cellType: "markdown" as const,
    source: "## 1. Load and Clean Dataset\nWe read our customer profiles, clean missing values in `TotalCharges`, and encode categorical features."
  },
  {
    cellType: "code" as const,
    source: "df = pd.read_csv('telco_customer_data.csv')\n# Handle missing values\ndf['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')\ndf['TotalCharges'].fillna(df['TotalCharges'].median(), inplace=True)\nprint(f'Dataset Dimensions: {df.shape}')",
    outputs: [
      {
        outputType: "stream",
        text: ["Dataset Dimensions: (7043, 21)\n"]
      }
    ]
  },
  {
    cellType: "markdown" as const,
    source: "## 2. Feature Importance Analysis\nLet's extract and plot which features contribute the most to unsubscription risk."
  },
  {
    cellType: "code" as const,
    source: "model = XGBClassifier(max_depth=5, learning_rate=0.1, n_estimators=100)\nmodel.fit(X_train, y_train)\n\nimportances = model.feature_importances_\nindices = np.argsort(importances)[::-1]\n\nplt.figure(figsize=(10,6))\nplt.title('Feature Importances for Customer Churn')\nplt.bar(range(X.shape[1]), importances[indices], align='center')\nplt.xticks(range(X.shape[1]), [features[i] for i in indices], rotation=45)\nplt.tight_layout()\nplt.show()",
    outputs: [
      {
        outputType: "stream",
        text: ["Model Training Complete. Accuracy: 84.6%\n"]
      }
    ]
  }
];
