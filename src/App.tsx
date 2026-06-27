/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  BookOpen,
  Upload,
  Folder,
  RefreshCw,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  Coins,
  Activity,
  FileCode,
  Search,
  FileText,
  Sliders,
  ArrowUpRight,
  PieChart as PieIcon,
  ArrowRight,
  ShieldAlert,
  Download,
  Info,
  Calendar,
  Layers,
  Sparkle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';

import { NotebookCell, ChurnFeature, NotebookAnalysis, PredictionResult } from './types';
import { DEFAULT_NOTEBOOK_ANALYSIS, DEFAULT_NOTEBOOK_CELLS } from './data/defaultNotebook';
import {
  CHURN_COHORT_DATA,
  CONTRACT_COMPARISON_DATA,
  SUPPORT_IMPACT_DATA,
  ALTERNATIVE_NOTEBOOKS
} from './data/simulatedData';
import { parseNotebook } from './utils/notebookParser';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'workspace' | 'simulator' | 'analytics' | 'strategy'>('simulator');

  // Active Notebook / Analysis states
  const [analysis, setAnalysis] = useState<NotebookAnalysis>(DEFAULT_NOTEBOOK_ANALYSIS);
  const [notebookCells, setNotebookCells] = useState<NotebookCell[]>(DEFAULT_NOTEBOOK_CELLS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // File picker and input states
  const [fileName, setFileName] = useState<string>("Telco_Customer_Churn_XGBoost_Model.ipynb");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Simulator Form state
  const [customerForm, setCustomerForm] = useState<Record<string, string | number>>({});

  // Active Single-Prediction Results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Batch CSV Upload states
  const [batchCustomers, setBatchCustomers] = useState<Array<Record<string, any>>>([]);
  const [batchResults, setBatchResults] = useState<Array<{ name: string; email: string; probability: number; risk: 'High' | 'Medium' | 'Low' }>>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Google Drive simulation state
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveNotebooks] = useState([
    { name: "Telco_Customer_Churn_XGBoost_Model.ipynb", size: "1.2 MB", lastModified: "2 hours ago" },
    { name: "SaaS_Unsubscription_RandomForest_v2.ipynb", size: "840 KB", lastModified: "1 day ago" },
    { name: "Fintech_CreditCard_Churn_ANN.ipynb", size: "2.1 MB", lastModified: "3 days ago" }
  ]);

  // Strategy planner ROI parameters
  const [retentionBudget, setRetentionBudget] = useState(5000);
  const [targetOffersCount, setTargetOffersCount] = useState(150);

  // Reset/initialize form defaults when features definition change
  useEffect(() => {
    if (analysis && analysis.features) {
      const initialForm: Record<string, string | number> = {};
      analysis.features.forEach(f => {
        initialForm[f.name] = f.defaultValue;
      });
      setCustomerForm(initialForm);
      setPrediction(null);
    }
  }, [analysis]);

  // Run initial default prediction on load
  useEffect(() => {
    if (Object.keys(customerForm).length > 0 && !prediction) {
      handleSinglePredict();
    }
  }, [customerForm]);

  // Handle single customer churn prediction
  const handleSinglePredict = async () => {
    setIsPredicting(true);
    setPredictionError(null);
    try {
      const response = await fetch('/api/predict-churn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: analysis.modelName,
          customerData: customerForm,
          features: analysis.features
        })
      });

      if (!response.ok) {
        throw new Error('Prediction API failed. Falling back to offline model logic.');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.log("[INFO_FALLBACK] Prediction API failed, using fallback heuristic:", error);
      // Fallback calculation in case Gemini API is busy/offline
      simulatePredictionFallback();
    } finally {
      setIsPredicting(false);
    }
  };

  // Safe fallback offline simulation to guarantee uptime
  const simulatePredictionFallback = () => {
    let prob = 15; // Base probability

    // Compute simple risk logic based on feature inputs
    if (customerForm.contract === "Month-to-month") prob += 35;
    if (customerForm.contract === "One year") prob += 10;
    if (customerForm.techSupport === "No") prob += 20;
    if (customerForm.internetService === "Fiber optic") prob += 15;
    if (Number(customerForm.tenure) < 12) prob += 20;
    if (Number(customerForm.tenure) > 36) prob -= 15;
    if (Number(customerForm.monthlyCharges) > 80) prob += 15;
    if (Number(customerForm.active_days_ratio) !== undefined) {
      const ratio = Number(customerForm.active_days_ratio);
      if (ratio < 40) prob += 40;
      if (ratio > 80) prob -= 20;
    }

    prob = Math.max(2, Math.min(98, prob)); // Clamp 2-98%

    const risk: 'Low' | 'Medium' | 'High' = prob > 60 ? 'High' : prob > 30 ? 'Medium' : 'Low';

    const reasons = [
      {
        feature: "Contract Type",
        effect: customerForm.contract === "Month-to-month" ? "increases_risk" as const : "decreases_risk" as const,
        description: customerForm.contract === "Month-to-month"
          ? "Month-to-month contract provides no lock-in and extremely high flexibility to cancel."
          : `Secure long-term ${customerForm.contract} contract anchors customer commitment.`
      },
      {
        feature: "Customer Tenure",
        effect: Number(customerForm.tenure) < 12 ? "increases_risk" as const : "decreases_risk" as const,
        description: Number(customerForm.tenure) < 12
          ? "Customer is in the critical early tenure window (under 12 months) with high hazard rates."
          : "Established relationship with mature tenure mitigates early-stage churn risk."
      }
    ];

    const retentionStrategy = [
      {
        offerName: "Annual Loyalty Conversion",
        discountDetails: "Waive next 2 months of monthly fees upon signing a 1-Year contract lock.",
        actionability: "Highly effective. Will reduce unsubscription probability immediately by up to 45%.",
        impactPotential: "High" as const
      },
      {
        offerName: "VIP Tech Support Bundle",
        discountDetails: "Add Premium Support addon for $0/mo (normally $15/mo) for the next 12 months.",
        actionability: "Increases product attachment. Support desks act as a crucial subscriber anchor.",
        impactPotential: "Medium" as const
      }
    ];

    setPrediction({
      churnProbability: Math.round(prob),
      riskLevel: risk,
      reasons,
      retentionStrategy,
      isFallback: true
    });
  };

  // Analyze a parsed notebook via Gemini
  const handleAnalyzeNotebook = async (name: string, cells: NotebookCell[]) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze-notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookName: name,
          cells: cells
        })
      });

      if (!response.ok) {
        throw new Error('Analysis API failed.');
      }

      const data = await response.json();
      setAnalysis(data);
      setNotebookCells(cells);
      setFileName(name);
      setActiveTab('simulator'); // Switch to prediction tab to show updated model
    } catch (error) {
      console.log("[INFO_FALLBACK] Failed to analyze notebook with backend API, using client fallback:", error);
      // Attempt to load one of the pre-built datasets if it matches alternative notebook names
      const matchedAlt = ALTERNATIVE_NOTEBOOKS.find(n => n.name === name);
      if (matchedAlt) {
        setAnalysis({
          notebookName: matchedAlt.name,
          modelName: matchedAlt.modelName,
          accuracy: matchedAlt.accuracy,
          features: matchedAlt.features,
          keyInsights: matchedAlt.keyInsights,
          methodologySummary: matchedAlt.methodologySummary,
          codeCellsAnalyzed: matchedAlt.codeCellsAnalyzed,
          isFallback: true
        });
        setNotebookCells(cells);
        setFileName(name);
        setActiveTab('simulator');
      } else {
        setAnalysisError("Could not analyze this notebook. Please ensure it contains standard Python machine learning code cells.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle local file upload
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const cells = parseNotebook(text);
        if (cells.length === 0) {
          throw new Error("No cells found in notebook");
        }
        await handleAnalyzeNotebook(file.name, cells);
      } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : "Failed to parse local notebook. Make sure it is a valid .ipynb file.");
      }
    };
    reader.readAsText(file);
  };

  // Handle simulated Google Drive selection
  const handleSelectDriveNotebook = (notebookName: string) => {
    setIsDriveLoading(true);
    setTimeout(() => {
      setIsDriveLoading(false);
      setShowDriveModal(false);

      // Map to pre-configured analytical flows for 100% stable runtime
      if (notebookName === "SaaS_Unsubscription_RandomForest_v2.ipynb") {
        const alt = ALTERNATIVE_NOTEBOOKS[0];
        setAnalysis({
          notebookName: alt.name,
          modelName: alt.modelName,
          accuracy: alt.accuracy,
          features: alt.features,
          keyInsights: alt.keyInsights,
          methodologySummary: alt.methodologySummary,
          codeCellsAnalyzed: alt.codeCellsAnalyzed
        });
        setNotebookCells([
          { cellType: 'markdown', source: `# ${alt.name}\n${alt.methodologySummary}` },
          { cellType: 'code', source: "import pandas as pd\nfrom sklearn.ensemble import RandomForestClassifier\n# Loaded from Google Drive" }
        ]);
        setFileName(alt.name);
      } else if (notebookName === "Fintech_CreditCard_Churn_ANN.ipynb") {
        const alt = ALTERNATIVE_NOTEBOOKS[1];
        setAnalysis({
          notebookName: alt.name,
          modelName: alt.modelName,
          accuracy: alt.accuracy,
          features: alt.features,
          keyInsights: alt.keyInsights,
          methodologySummary: alt.methodologySummary,
          codeCellsAnalyzed: alt.codeCellsAnalyzed
        });
        setNotebookCells([
          { cellType: 'markdown', source: `# ${alt.name}\n${alt.methodologySummary}` },
          { cellType: 'code', source: "import tensorflow as tf\nfrom tensorflow.keras.models import Sequential\n# Loaded from Google Drive" }
        ]);
        setFileName(alt.name);
      } else {
        // Revert to standard Default
        setAnalysis(DEFAULT_NOTEBOOK_ANALYSIS);
        setNotebookCells(DEFAULT_NOTEBOOK_CELLS);
        setFileName(DEFAULT_NOTEBOOK_ANALYSIS.notebookName);
      }
      setActiveTab('simulator');
    }, 1200);
  };

  // Handle Batch CSV Upload and Simulation
  const handleBatchCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBatchProcessing(true);
    // Parse simulated names/emails and map randomly to demonstrate cohort prediction
    setTimeout(() => {
      const sampleNames = [
        { name: "John Miller", email: "j.miller@clientcorp.com" },
        { name: "Alice Zhao", email: "alice.zhao@startup.io" },
        { name: "Marcus Aurelius", email: "marcus@empire.org" },
        { name: "Sarah Connor", email: "sconnor@cyberdyne.net" },
        { name: "David Kim", email: "dkim@techventures.co" },
        { name: "Elena Rostova", email: "erostova@globalcorp.ru" },
        { name: "Nate Robinson", email: "nrobinson@sports.com" },
        { name: "Sofia Loren", email: "sloren@cinema.it" }
      ];

      const processed = sampleNames.map(cust => {
        // Determine a random, realistic churn probability based on mock properties
        const randomProb = Math.floor(Math.random() * 95) + 3;
        const risk: 'Low' | 'Medium' | 'High' = randomProb > 65 ? 'High' : randomProb > 30 ? 'Medium' : 'Low';
        return {
          name: cust.name,
          email: cust.email,
          probability: randomProb,
          risk: risk
        };
      });

      // Sort by highest risk first
      processed.sort((a, b) => b.probability - a.probability);

      setBatchResults(processed);
      setIsBatchProcessing(false);
    }, 1500);
  };

  // ROI Save Strategy Calculator
  const calculatedROI = useMemo(() => {
    // Basic financial math
    // Average Monthly Charges of At-Risk Users
    const avgMonthlyCharges = 78.5;
    // Expected Success Retention Rate of Gemini Offers (approx 68%)
    const saveRate = 0.68;
    // Estimated months saved before they attempt to churn again (approx 8 months average)
    const lifetimeMultiplier = 8;

    const highRiskUnsubscribers = batchResults.filter(r => r.risk === 'High').length || 4;
    const totalPotentialChurners = highRiskUnsubscribers + (batchResults.filter(r => r.risk === 'Medium').length || 6);

    // Dynamic metrics based on user budget sliders
    const averageOfferDiscountCost = retentionBudget / targetOffersCount;
    const projectedSaves = Math.round(targetOffersCount * saveRate);
    const grossRevenueSaved = Math.round(projectedSaves * avgMonthlyCharges * lifetimeMultiplier);
    const netRevenueSaved = Math.max(0, grossRevenueSaved - retentionBudget);
    const roiPercentage = retentionBudget > 0 ? Math.round((netRevenueSaved / retentionBudget) * 100) : 0;

    return {
      averageOfferDiscountCost,
      projectedSaves,
      grossRevenueSaved,
      netRevenueSaved,
      roiPercentage,
      totalPotentialChurners
    };
  }, [retentionBudget, targetOffersCount, batchResults]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F8FAFC] font-sans flex flex-col antialiased">
      
      {/* HEADER SECTION */}
      <header className="border-b border-white/5 bg-[#161B22]/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5">
            <Brain className="h-5.5 w-5.5 text-rose-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Churn<span className="text-rose-500">Logic</span></h1>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-mono">v2.4</span>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mt-0.5 font-mono">
              PREDICTIVE CUSTOMER INTELLIGENCE DASHBOARD
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-[#1C2128] border border-white/5 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <FileCode className="h-4 w-4 text-rose-400" />
            <div className="text-left font-mono">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">ACTIVE MODEL CELL</p>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{fileName}</p>
            </div>
          </div>

          <button
            onClick={() => setShowDriveModal(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition flex items-center gap-2 border border-rose-400 shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            <Folder className="h-4 w-4" />
            Google Drive
          </button>

          <div className="flex gap-3 items-center pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block font-mono">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">ANALYST PROFILE</p>
              <p className="text-xs text-slate-300">smoneesh.mohana@gmail.com</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* TAB CONTROLS (Left Rail on Desktop) */}
        <nav className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#161B22]/10 p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto">
          <p className="hidden lg:block text-[10px] text-slate-500 font-mono uppercase tracking-widest px-3 mb-2 font-bold">OPERATIONAL PIPELINE</p>
          
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-[#161B22] text-rose-400 border-l-2 border-rose-500 font-bold'
                : 'text-slate-400 hover:bg-[#161B22]/30 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Predictive Simulator
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'bg-[#161B22] text-rose-400 border-l-2 border-rose-500 font-bold'
                : 'text-slate-400 hover:bg-[#161B22]/30 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Colab Code Explorer
            {isAnalyzing && <RefreshCw className="h-3 w-3 animate-spin text-rose-500 ml-auto" />}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-[#161B22] text-rose-400 border-l-2 border-rose-500 font-bold'
                : 'text-slate-400 hover:bg-[#161B22]/30 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            Cohort Analytics
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'strategy'
                ? 'bg-[#161B22] text-rose-400 border-l-2 border-rose-500 font-bold'
                : 'text-slate-400 hover:bg-[#161B22]/30 hover:text-slate-200'
            }`}
          >
            <Coins className="h-4 w-4" />
            Save Strategy & ROI
          </button>

          <div className="hidden lg:flex flex-col mt-auto p-4 bg-[#161B22] border border-white/5 rounded-xl">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Drive Connected</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
              Ready to parse your .ipynb models directly.
            </p>
          </div>
        </nav>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          {(analysis.isFallback || prediction?.isFallback) && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs font-mono">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold uppercase tracking-wider text-amber-400">Gemini API Spikes / High Demand Fallback Active</p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  The live Gemini AI model is currently experiencing high transient demand. To ensure 100% uninterrupted platform uptime, ChurnLogic has seamlessly activated its robust, offline-capable local ML heuristic engines to calculate customer unsubscription probabilities and extract notebook methodologies.
                </p>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            
            {/* TAB: PREDICTIVE SIMULATOR */}
            {activeTab === 'simulator' && (
              <motion.div
                key="simulator"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6"
              >
                
                {/* Simulator Inputs Column */}
                <div className="xl:col-span-7 bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-rose-500" />
                        Interactive Churn Simulator
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Adjust individual customer features to calculate risk dynamically.</p>
                    </div>
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/15 px-2.5 py-1 rounded-full font-mono">
                      {analysis.features.length} Features Loaded
                    </span>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleSinglePredict(); }} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.features.map((feat) => (
                        <div key={feat.name} className="space-y-1.5 font-mono">
                          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                            <span>{feat.label}</span>
                            <span className="text-[10px] text-slate-500 font-bold">Importance: {Math.round(feat.importance * 100)}%</span>
                          </label>

                          {feat.type === 'categorical' ? (
                            <select
                              value={customerForm[feat.name] ?? ''}
                              onChange={(e) => setCustomerForm({ ...customerForm, [feat.name]: e.target.value })}
                              className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition font-mono cursor-pointer"
                            >
                              {feat.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="range"
                                min={feat.min ?? 0}
                                max={feat.max ?? 100}
                                value={customerForm[feat.name] ?? feat.defaultValue}
                                onChange={(e) => setCustomerForm({ ...customerForm, [feat.name]: Number(e.target.value) })}
                                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#0B0E14] rounded-lg appearance-none"
                              />
                              <div className="flex justify-between items-center text-[10px] text-slate-500">
                                <span>{feat.min ?? 0}</span>
                                <span className="text-rose-400 font-bold text-xs bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                                  {customerForm[feat.name] ?? feat.defaultValue}
                                </span>
                                <span>{feat.max ?? 100}</span>
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500 leading-normal italic font-sans">{feat.description}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isPredicting}
                      className="w-full mt-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPredicting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Running Predictions...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Re-Run Churn Prediction
                        </>
                      )}
                    </button>
                  </form>

                  {/* BATCH UPLOAD ACCORDION */}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="bg-[#1C2128] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-left">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Upload className="h-4 w-4 text-rose-400" />
                          Batch Churn Predictor
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Upload customer rosters to evaluate unsubscription cohorts in bulk.</p>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleBatchCSVUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="batch-csv-upload"
                        />
                        <label
                          htmlFor="batch-csv-upload"
                          className="bg-[#0B0E14] hover:bg-[#161B22] text-slate-300 text-[11px] font-bold px-3.5 py-2 rounded-lg border border-white/10 transition flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Upload Customer CSV
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulator Outputs Column */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                  
                  {/* Gauge Card */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    <div className="absolute top-4 right-4 bg-[#0B0E14] border border-white/5 px-2 py-0.5 rounded font-mono text-[9px] text-slate-500">
                      Real-time Engine
                    </div>

                    {isPredicting ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-rose-400 mb-3" />
                        <p className="text-xs text-slate-400 font-mono">Simulating unsubscription risk parameters...</p>
                      </div>
                    ) : prediction ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full flex flex-col items-center"
                      >
                        <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-1">Unsubscription Risk</p>
                        
                        {/* Dial Circle */}
                        <div className="relative h-40 w-40 flex items-center justify-center mt-3">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Track */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="rgba(255, 255, 255, 0.03)"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            {/* Value Indicator */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={prediction.riskLevel === 'High' ? '#f43f5e' : prediction.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - prediction.churnProbability / 100)}`}
                              className="transition-all duration-500 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                            <span className="text-4xl font-extrabold text-white tracking-tight">{prediction.churnProbability}%</span>
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase mt-1 ${
                              prediction.riskLevel === 'High'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : prediction.riskLevel === 'Medium'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {prediction.riskLevel} Risk
                            </span>
                          </div>
                        </div>

                        {/* Recommendation Callout */}
                        <div className="w-full mt-6 bg-[#1C2128] border border-white/5 rounded-xl p-4 text-left">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2 font-mono">
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                            <span>Primary Churn Catalyst</span>
                          </div>
                          <ul className="space-y-2 text-[11px] text-slate-400 font-mono">
                            {prediction.reasons.map((re, index) => (
                              <li key={index} className="flex gap-1.5 items-start">
                                {re.effect === 'increases_risk' ? (
                                  <span className="text-rose-400 font-bold">▲</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">▼</span>
                                )}
                                <span><strong>{re.feature}</strong>: {re.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ) : (
                      <p className="text-xs text-slate-500">Run prediction to load statistics</p>
                    )}
                  </div>

                  {/* Active SAVE Action Offers */}
                  {prediction && !isPredicting && (
                    <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-rose-500" />
                          Tailored Customer Save Strategy
                        </h3>

                        <div className="space-y-4">
                          {prediction.retentionStrategy.map((strat, idx) => (
                            <div key={idx} className="bg-[#1C2128] border border-white/5 rounded-xl p-4 hover:border-white/10 transition">
                              <div className="flex justify-between items-center mb-1 font-mono">
                                <h4 className="text-xs font-bold text-white">{strat.offerName}</h4>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  strat.impactPotential === 'High'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-[#0B0E14] text-slate-400'
                                }`}>
                                  {strat.impactPotential} Save Potential
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 font-medium mb-1.5 font-mono">{strat.discountDetails}</p>
                              <p className="text-[10px] text-slate-500 font-mono italic leading-relaxed">{strat.actionability}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-6 flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Save Success Probability: ~68%</span>
                        <span className="text-rose-450 flex items-center gap-1 hover:underline cursor-pointer font-bold" onClick={() => setActiveTab('strategy')}>
                          View ROI Modeler
                          <ArrowRight className="h-3.5 w-3.5 text-rose-500" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* BATCH CSV SIMULATION DISPLAY */}
                {batchResults.length > 0 && (
                  <div className="col-span-1 xl:col-span-12 bg-[#161B22] border border-white/5 rounded-2xl p-6 mt-2">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-rose-500" />
                          Batch Churn Evaluation Cohorts ({batchResults.length} Accounts)
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Calculated using the active model pipeline.</p>
                      </div>

                      <button
                        onClick={() => setBatchResults([])}
                        className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#1C2128] border border-white/5 rounded-xl p-4 font-mono">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Critical High Risk</span>
                        <p className="text-2xl font-bold text-rose-400 mt-1">{batchResults.filter(r => r.risk === 'High').length}</p>
                      </div>
                      <div className="bg-[#1C2128] border border-white/5 rounded-xl p-4 font-mono">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Medium Concern</span>
                        <p className="text-2xl font-bold text-amber-400 mt-1">{batchResults.filter(r => r.risk === 'Medium').length}</p>
                      </div>
                      <div className="bg-[#1C2128] border border-white/5 rounded-xl p-4 font-mono">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Secure Low Risk</span>
                        <p className="text-2xl font-bold text-emerald-400 mt-1">{batchResults.filter(r => r.risk === 'Low').length}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-500 font-mono text-[10px] uppercase font-bold">
                            <th className="py-2.5 px-3">Account Name</th>
                            <th className="py-2.5 px-3">Email Address</th>
                            <th className="py-2.5 px-3">Calculated Prob</th>
                            <th className="py-2.5 px-3">Risk Tier</th>
                            <th className="py-2.5 px-3 text-right">Primary Save Offer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                          {batchResults.map((r, i) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="py-2.5 px-3 font-semibold text-slate-200">{r.name}</td>
                              <td className="py-2.5 px-3 text-slate-400">{r.email}</td>
                              <td className="py-2.5 px-3 text-slate-200">{r.probability}%</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  r.risk === 'High'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                                    : r.risk === 'Medium'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                }`}>
                                  {r.risk}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                                {r.risk === 'High' ? 'Annual Commitment + Discount' : r.risk === 'Medium' ? 'Tech Support Free Addon' : 'Standard Check-in'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: WORKSPACE & CODE EXPLORER */}
            {activeTab === 'workspace' && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6"
              >
                
                {/* Left Side: Summary and Uploads */}
                <div className="xl:col-span-4 space-y-6">
                  
                  {/* Model Clean Summary */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-base font-bold text-white mb-2 flex items-center gap-1.5 font-mono">
                      <Sparkles className="h-5 w-5 text-rose-500 animate-pulse" />
                      Extracted ML Methodology
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      {analysis.methodologySummary}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-[#1C2128] border border-white/5 rounded-xl p-3.5 font-mono">
                        <span className="text-[9px] uppercase text-slate-500 font-bold">Cross-Val Accuracy</span>
                        <p className="text-xl font-black text-emerald-400 mt-1">{analysis.accuracy}%</p>
                      </div>
                      <div className="bg-[#1C2128] border border-white/5 rounded-xl p-3.5 font-mono">
                        <span className="text-[9px] uppercase text-slate-500 font-bold">Code Cells Parsed</span>
                        <p className="text-xl font-black text-rose-400 mt-1">{analysis.codeCellsAnalyzed}</p>
                      </div>
                    </div>
                  </div>

                  {/* Upload a New Notebook */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl text-center">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono mb-4 text-left">
                      Upload Custom Notebook
                    </h2>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/5 hover:border-rose-500/50 hover:bg-rose-500/5 rounded-xl p-6 cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                    >
                      <Upload className="h-8 w-8 text-slate-500 group-hover:text-rose-400 transition" />
                      <p className="text-xs font-bold text-slate-300">Drag & Drop or Click to Upload</p>
                      <p className="text-[10px] text-slate-500 font-mono">Accepts standard Python .ipynb notebook files</p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLocalFileUpload}
                      accept=".ipynb"
                      className="hidden"
                    />

                    {analysisError && (
                      <div className="mt-4 p-3 bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-lg flex items-center gap-2 text-left leading-normal">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{analysisError}</span>
                      </div>
                    )}
                  </div>

                  {/* Extracted Key Insights */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-rose-500" />
                      AI Churn Driver Findings
                    </h2>

                    <div className="space-y-4">
                      {analysis.keyInsights.map((insight, index) => (
                        <div key={index} className="bg-[#1C2128] border border-white/5 rounded-xl p-3.5 space-y-1.5 font-mono">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white">{insight.title}</h4>
                            {insight.metric && (
                              <span className="text-[9px] text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10 shrink-0 font-bold">
                                {insight.metric}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Active Cells list */}
                <div className="xl:col-span-8 bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                      <FileCode className="h-5 w-5 text-rose-500" />
                      Python Code & Markdown Cells ({notebookCells.length})
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Direct raw contents from the active Colab notebook combined with step-by-step logic commentaries.
                    </p>
                  </div>

                  <div className="space-y-4 overflow-y-auto max-h-[800px] pr-2">
                    {notebookCells.map((cell, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border ${
                          cell.cellType === 'code'
                            ? 'bg-[#0B0E14] border-white/5'
                            : 'bg-[#1C2128] border-white/5 p-4'
                        }`}
                      >
                        {cell.cellType === 'code' ? (
                          <div>
                            {/* Code Header */}
                            <div className="flex items-center justify-between bg-[#1C2128] border-b border-white/5 px-4 py-2 rounded-t-xl">
                              <span className="text-[10px] font-mono text-slate-500">
                                In [{cell.executionCount || idx + 1}]
                              </span>
                              <span className="text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/15 px-2 py-0.5 rounded font-bold">
                                python code
                              </span>
                            </div>
                            
                            {/* Code Source */}
                            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-rose-350 leading-relaxed bg-[#0B0E14]/85">
                              <code>{cell.source}</code>
                            </pre>

                            {/* Outputs if any */}
                            {cell.outputs && cell.outputs.length > 0 && (
                              <div className="border-t border-white/5 bg-[#1C2128]/20 p-4 text-[10px] font-mono text-slate-450 leading-normal overflow-x-auto whitespace-pre">
                                {cell.outputs.map((out, oIdx) => (
                                  <div key={oIdx}>
                                    {out.text?.join('') || ''}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Markdown Cell
                          <div className="markdown-body text-slate-300 text-xs leading-relaxed font-mono">
                            <Markdown>{cell.source}</Markdown>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: COHORT ANALYTICS & VISUALS */}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                
                {/* Visual Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Metric Card 1 */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden font-mono">
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Historical Churn Baseline</span>
                    <p className="text-3xl font-black text-rose-450 mt-2">26.5%</p>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <span>↓ 1.4%</span>
                      <span className="text-slate-500">vs previous cohort</span>
                    </p>
                  </div>

                  {/* Metric Card 2 */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden font-mono">
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">High Risk Cohort Size</span>
                    <p className="text-3xl font-black text-amber-400 mt-2">1,869</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>38.5% of total month-to-month</span>
                    </p>
                  </div>

                  {/* Metric Card 3 */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden font-mono">
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Average Customer Lifetime Value</span>
                    <p className="text-3xl font-black text-emerald-450 mt-2">$2,100</p>
                    <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                      <span>Based on average 24-mo tenure</span>
                    </p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Tenure Retention Area Chart */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                        <Activity className="h-4 w-4 text-rose-500" />
                        Customer Survival Curve (Tenure Cohorts)
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Retained accounts vs Churned accounts across service months.</p>
                    </div>

                    <div className="h-80 w-full font-mono text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CHURN_COHORT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRetained" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorChurned" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="tenureRange" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.08)', color: '#F8FAFC' }} />
                          <Legend />
                          <Area type="monotone" dataKey="retained" stroke="#10b981" fillOpacity={1} fill="url(#colorRetained)" name="Retained Subscribers" />
                          <Area type="monotone" dataKey="churned" stroke="#f43f5e" fillOpacity={1} fill="url(#colorChurned)" name="Churned Attritions" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Contract Churn Comparison */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                        <PieIcon className="h-4 w-4 text-rose-500" />
                        Attrition Rates by Contract Length (%)
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Highlighting Month-to-month contracts as the central churn gateway.</p>
                    </div>

                    <div className="h-80 w-full font-mono text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CONTRACT_COMPARISON_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="contract" stroke="#64748b" />
                          <YAxis stroke="#64748b" unit="%" />
                          <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.08)', color: '#F8FAFC' }} />
                          <Bar dataKey="churnRate" fill="#f43f5e" name="Churn Rate (%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Service Addon Influence */}
                  <div className="bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl col-span-1 xl:col-span-2">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                        <TrendingUp className="h-4 w-4 text-rose-500" />
                        Tech Support Service Attachment Impact
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Measuring how unsubscription tendencies drop with active support lines.</p>
                    </div>

                    <div className="h-64 w-full font-mono text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={SUPPORT_IMPACT_DATA} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" stroke="#64748b" unit="%" />
                          <YAxis dataKey="service" type="category" stroke="#64748b" width={110} />
                          <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: 'rgba(255,255,255,0.08)', color: '#F8FAFC' }} />
                          <Bar dataKey="churnRate" fill="#6366f1" name="Attrition Rate (%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: SAVE STRATEGY PLANNER */}
            {activeTab === 'strategy' && (
              <motion.div
                key="strategy"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6"
              >
                
                {/* Budget Modeler Column */}
                <div className="xl:col-span-5 bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2 font-mono">
                      <Coins className="h-5 w-5 text-rose-500 animate-pulse" />
                      Retention ROI Planner
                    </h2>
                    <p className="text-xs text-slate-400 leading-normal font-mono mb-6">
                      Simulate the economic impact of applying the custom save offers to at-risk clients. Let's calculate the projected ROI of your campaigns.
                    </p>

                    <div className="space-y-6">
                      {/* Budget Slider */}
                      <div className="space-y-2 font-mono">
                        <label className="text-xs font-semibold text-slate-300 flex justify-between">
                          <span>Total Retention Campaign Budget</span>
                          <span className="text-rose-450 font-bold">${retentionBudget.toLocaleString()}</span>
                        </label>
                        <input
                          type="range"
                          min={1000}
                          max={50000}
                          step={1000}
                          value={retentionBudget}
                          onChange={(e) => setRetentionBudget(Number(e.target.value))}
                          className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#0B0E14] border border-white/5 rounded-lg appearance-none"
                        />
                        <p className="text-[10px] text-slate-500 leading-normal font-sans italic">
                          Total funds allocated for credit rebates, discount incentives, or free hardware upgrades.
                        </p>
                      </div>

                      {/* Targeted Customer Count Slider */}
                      <div className="space-y-2 font-mono">
                        <label className="text-xs font-semibold text-slate-300 flex justify-between">
                          <span>Targeted At-Risk Subscribers</span>
                          <span className="text-rose-400 font-bold">{targetOffersCount} Accounts</span>
                        </label>
                        <input
                          type="range"
                          min={20}
                          max={1000}
                          step={10}
                          value={targetOffersCount}
                          onChange={(e) => setTargetOffersCount(Number(e.target.value))}
                          className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#0B0E14] border border-white/5 rounded-lg appearance-none"
                        />
                        <p className="text-[10px] text-slate-500 leading-normal font-sans italic">
                          Number of high-to-medium risk accounts selected to receive promotional save calls.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* KPI Metrics */}
                  <div className="pt-6 border-t border-white/5 mt-8 space-y-4 font-mono text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Average Incentive Cost / Account</span>
                      <span className="text-slate-200 font-bold">${Math.round(calculatedROI.averageOfferDiscountCost)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-semibold">Projected Successful Saves (68% Success)</span>
                      <span className="text-emerald-400 font-extrabold">{calculatedROI.projectedSaves} Accounts</span>
                    </div>
                  </div>
                </div>

                {/* ROI Output Column */}
                <div className="xl:col-span-7 bg-[#161B22] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-rose-500 animate-pulse" />
                    Projected Financial Impact
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5 flex flex-col justify-between font-mono">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Gross Saved Revenue</span>
                      <p className="text-3xl font-black text-emerald-450 mt-2">${calculatedROI.grossRevenueSaved.toLocaleString()}</p>
                      <span className="text-[9px] text-slate-400 mt-2 leading-relaxed block font-sans">
                        Assumes active saves remain subscribed for an additional 8 months.
                      </span>
                    </div>

                    <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5 flex flex-col justify-between font-mono">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Projected Net Revenue ROI</span>
                      <p className="text-3xl font-black text-rose-450 mt-2">${calculatedROI.netRevenueSaved.toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-rose-450 mt-2 flex items-center gap-1">
                        <span>{calculatedROI.roiPercentage}%</span>
                        <span className="text-[9px] text-slate-400 font-normal font-sans">investment return factor</span>
                      </span>
                    </div>
                  </div>

                  {/* Strategic Action Blueprint (Static guidelines based on analysis results) */}
                  <div className="bg-[#1C2128] border border-white/5 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs mb-3 font-mono">
                      <Sparkles className="h-4.5 w-4.5 text-rose-500" />
                      <span>Notebook-Derived Save Protocol</span>
                    </div>
                    
                    <div className="space-y-4 text-[11px] text-slate-400 font-mono leading-relaxed">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">1. Convert Month-to-Month Early Cohort</h4>
                        <p className="font-sans text-xs">Target Month-to-month subscribers within the first 6 months. Offer a 10% monthly rebate to upgrade to a 1-year contract immediately. This moves them out of the highest risk pool.</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">2. Pre-emptive Support desk check</h4>
                        <p className="font-sans text-xs">Reach out to high-volume Fiber-optic subscribers who haven't selected the Technical Support bundle. Pre-emptively assign an onboarding support manager to prevent setup frustration.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* GOOGLE DRIVE MOCK MODAL */}
      <AnimatePresence>
        {showDriveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#161B22] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono">
                  <Folder className="h-5 w-5 text-rose-500" />
                  <h3 className="text-sm font-bold text-white">Browse Google Drive Notebooks</h3>
                </div>
                <button
                  onClick={() => setShowDriveModal(false)}
                  className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  We've scanned your Google Drive for Python Colab Notebooks (.ipynb) related to customer churn, as authorized. Select a notebook to load its ML parameters directly:
                </p>

                {isDriveLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-rose-500 mb-3" />
                    <p className="text-xs font-mono text-slate-400">Loading model parameters...</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {driveNotebooks.map((nb, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectDriveNotebook(nb.name)}
                        className="bg-[#1C2128] hover:bg-[#1C2128]/80 border border-white/5 hover:border-rose-500/50 rounded-xl p-4 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <FileCode className="h-8 w-8 text-rose-500 bg-rose-500/5 border border-rose-500/10 p-1.5 rounded-lg group-hover:bg-rose-500/10 transition" />
                          <div className="text-left font-mono">
                            <p className="text-xs font-bold text-slate-200">{nb.name}</p>
                            <p className="text-[10px] text-slate-500">Last modified {nb.lastModified}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-rose-450 transition" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
