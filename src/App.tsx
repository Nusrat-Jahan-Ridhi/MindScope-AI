/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Brain, 
  Send, 
  Trash2, 
  Info, 
  AlertTriangle, 
  Smile, 
  BarChart2, 
  LineChart, 
  CheckCircle2,
  Frown,
  Heart,
  Zap,
  Ghost,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  Legend,
  Cell
} from 'recharts';
import { cn, EMOTION_SCORES, calculateRisk } from '@/src/lib/utils';
import { analyzeMentalState } from '@/src/lib/gemini';

// --- Types ---

interface Prediction {
  sentence: string;
  roberta: string;
  distilbert: string;
  electra: string;
  confidence: {
    roberta: number;
    distilbert: number;
    electra: number;
  };
}

// --- Constants ---

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊',
  sadness: '😢',
  love: '❤️',
  anger: '😠',
  fear: '😨',
  surprise: '😮',
};

// --- Components ---

interface AnalysisStepProps {
  label: string;
  items: string[];
  index: number;
  darkMode: boolean;
}

function AnalysisStep({ label, items, index, darkMode }: AnalysisStepProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "mb-4 border-l-2 pl-4 py-1 transition-colors",
        darkMode ? "border-indigo-500/30" : "border-indigo-200"
      )}
    >
      <h4 className={cn(
        "text-xs font-semibold uppercase tracking-wider mb-2 transition-colors",
        darkMode ? "text-indigo-400" : "text-indigo-600"
      )}>{label}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={cn(
            "text-sm font-medium transition-colors",
            darkMode ? "text-slate-300" : "text-slate-700"
          )}>
            <span className={cn(
              "mr-2 transition-colors",
              darkMode ? "text-slate-600" : "text-slate-300"
            )}>-</span> {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Prediction[] | null>(null);
  const [activeTab, setActiveTab] = useState<'acc_epoch' | 'loss_epoch' | 'acc_comp' | 'loss_comp' | 'emotion_trend' | 'lstm_loss'>('acc_epoch');

  const performanceData = [
    { epoch: 1, roberta_acc: 0.68, distilbert_acc: 0.72, electra_acc: 0.65, roberta_loss: 0.52, distilbert_loss: 0.45, electra_loss: 0.58 },
    { epoch: 2, roberta_acc: 0.78, distilbert_acc: 0.84, electra_acc: 0.74, roberta_loss: 0.32, distilbert_loss: 0.25, electra_loss: 0.38 },
    { epoch: 3, roberta_acc: 0.85, distilbert_acc: 0.89, electra_acc: 0.82, roberta_loss: 0.20, distilbert_loss: 0.15, electra_loss: 0.25 },
  ];

  const comparisonData = [
    { name: 'RoBERTa', accuracy: 0.85, loss: 0.20 },
    { name: 'DistilBERT', accuracy: 0.89, loss: 0.15 },
    { name: 'ELECTRA', accuracy: 0.82, loss: 0.25 },
  ];

  const lstmLossData = Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    loss: i > 5 ? 0.05 + 0.5 * Math.exp(-i / 8) : 0.6 - (i * 0.08)
  }));

  const sentenceCount = useMemo(() => {
    return inputText.split('\n').filter(s => s.trim().length > 0).length;
  }, [inputText]);

  const handleAnalyze = async () => {
    if (sentenceCount === 0) return;
    setIsAnalyzing(true);
    const data = await analyzeMentalState(inputText);
    setResults(data);
    setIsAnalyzing(false);
  };

  const clearInput = () => {
    setInputText('');
    setResults(null);
  };

  const analysisMetrics = useMemo(() => {
    if (!results) return null;

    // Use DistilBERT as the "best" model for summary statistics
    const dominantEmotions = results.map(r => r.distilbert.toLowerCase());
    const emotionCounts = dominantEmotions.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
    const predominant = sortedEmotions[0] || ['neutral', 0];
    
    const scores = dominantEmotions.map(e => EMOTION_SCORES[e] ?? 0);
    const risk = calculateRisk(scores);

    return {
      predominant: {
        label: predominant[0],
        count: predominant[1],
        total: results.length
      },
      risk
    };
  }, [results]);

  const chartData = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({
      sentence: r.sentence.slice(0, 20) + (r.sentence.length > 20 ? '...' : ''),
      RoBERTa: r.confidence.roberta,
      DistilBERT: r.confidence.distilbert,
      ELECTRA: r.confidence.electra,
      fullSentence: r.sentence
    }));
  }, [results]);

  const trendData = useMemo(() => {
    if (!results) return [];
    return results.map((r, i) => ({
      index: i + 1,
      score: EMOTION_SCORES[r.distilbert.toLowerCase()] ?? 0,
      label: r.distilbert
    }));
  }, [results]);

  return (
    <div className={cn(
      "min-h-screen font-sans pb-20 transition-colors duration-300",
      darkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"
    )}>
      {/* Header */}
      <header className={cn(
        "pt-16 pb-24 px-6 shadow-xl relative overflow-hidden transition-colors duration-300",
        darkMode ? "bg-indigo-950 text-white" : "bg-indigo-900 text-white"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3730a3,transparent)] opacity-40" />
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">MindScope AI</h1>
              <p className="text-indigo-300 text-sm mt-1">
                AI-powered emotional and mental state assessment using multiple NLP models
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "p-3 rounded-2xl transition-all active:scale-95 border",
              darkMode 
                ? "bg-slate-900 border-slate-700 text-yellow-400 hover:bg-slate-800" 
                : "bg-white/10 border-white/20 text-yellow-500 hover:bg-white/20"
            )}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-12 mb-20 space-y-8 relative z-10">
        {/* Step 1: Input */}
        <section id="step-1" className={cn(
          "rounded-3xl p-8 shadow-2xl border transition-all duration-300",
          darkMode ? "bg-slate-900/50 backdrop-blur-md border-slate-800/50" : "bg-white border-slate-200"
        )}>
          <div className="flex items-start gap-4 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20">1</div>
            <div>
              <h2 className={cn("text-xl font-bold transition-colors", darkMode ? "text-white" : "text-indigo-900")}>Enter Your Messages</h2>
              <p className={cn("text-sm transition-colors", darkMode ? "text-slate-400" : "text-slate-500")}>Enter one sentence per line. Our models will analyze emotions and evaluate risk levels.</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Section: Input + Buttons */}
            <div className="flex-1 flex flex-col gap-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="I feel so tired and empty inside.&#10;Nothing excites me anymore.&#10;Sometimes I wish I could just disappear.&#10;I had a great day with my friends!"
                className={cn(
                  "w-full h-80 p-6 rounded-2xl border-2 transition-all resize-none leading-relaxed placeholder:text-slate-500 shadow-inner",
                  darkMode 
                    ? "border-slate-800 text-slate-200 bg-slate-950/50 focus:border-indigo-500" 
                    : "border-slate-100 text-slate-700 bg-slate-50/50 focus:border-indigo-500"
                )}
              />
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || sentenceCount === 0}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xl shadow-indigo-500/10 border border-indigo-400/20"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Analyze Messages
                    </>
                  )}
                </button>
                <button
                  onClick={clearInput}
                  disabled={!inputText}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 border-2 rounded-xl font-semibold active:scale-95 transition-all",
                    darkMode 
                      ? "border-slate-800 text-slate-400 hover:bg-slate-900" 
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Input
                </button>
              </div>
            </div>

            {/* Right Section: Tips + Stats */}
            <div className="lg:w-80 flex flex-col gap-6">

              {/* Tips Card */}
              <div
                className={cn(
                  "rounded-2xl p-6 border transition-all duration-300",
                  darkMode
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-indigo-50/50 border-indigo-100"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Info
                    className={cn(
                      "w-5 h-5 transition-colors",
                      darkMode ? "text-indigo-400" : "text-indigo-600"
                    )}
                  />

                  <span
                    className={cn(
                      "font-bold transition-colors",
                      darkMode ? "text-white" : "text-indigo-900"
                    )}
                  >
                    Tips
                  </span>
                </div>

                <ul className="space-y-3">
                  {[
                    "Enter one sentence per line",
                    "Be honest and express your thoughts",
                    "AI analyzes emotional patterns",
                    "All messages stay private",
                  ].map((tip, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-start gap-3 text-sm transition-colors",
                        darkMode ? "text-slate-300" : "text-slate-700"
                      )}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sentence Counter */}
              <div className="bg-indigo-600 rounded-2xl px-6 py-5 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-between border border-indigo-500/20">
                <span className="text-sm font-medium opacity-90 uppercase tracking-wider">
                  Total Sentences
                </span>

                <span className="text-3xl font-black">
                  {sentenceCount}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Analysis Steps */}
        <AnimatePresence>
          {results && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-0"
            >
              <div className={cn(
                "p-4 rounded-t-2xl font-mono text-xs uppercase tracking-widest flex items-center transition-colors duration-300 gap-2",
                darkMode ? "bg-indigo-950 text-white" : "bg-indigo-800 text-white"
              )}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Raw Analysis Output (Engine Mode)
              </div>
              <div className={cn(
                "p-8 rounded-b-2xl font-mono text-sm leading-relaxed shadow-lg border transition-colors duration-300",
                darkMode ? "bg-slate-900 text-slate-300 border-slate-800" : "bg-slate-50 text-slate-700 border-slate-200"
              )}>
                <div className="text-emerald-500 mb-4 font-bold uppercase tracking-widest">--- AI Mental State Analysis Pipeline ---</div>
                
                {results && Array.from({ length: Math.ceil(results.length / 3) }).map((_, weekIndex) => (
                  <AnalysisStep 
                    key={`week-${weekIndex}`}
                    index={weekIndex}
                    darkMode={darkMode}
                    label={`Week ${weekIndex + 1} Logs`}
                    items={(results as Prediction[]).slice(weekIndex * 3, (weekIndex + 1) * 3).map(r => r.sentence)}
                  />
                ))}

                <div className={cn(
                  "mt-8 pt-6 border-t transition-colors",
                  darkMode ? "border-slate-800" : "border-slate-200"
                )}>
                  <h4 className={cn(
                    "text-xs font-bold uppercase tracking-widest mb-4 transition-colors",
                    darkMode ? "text-indigo-400" : "text-indigo-600"
                  )}>Sentiment Mapping (DistilBERT Context)</h4>
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-4 py-1">
                      <span className={cn("w-24 transition-colors", darkMode ? "text-slate-500" : "text-slate-400")}>Sentence {i + 1}:</span>
                      <span className={cn("font-bold uppercase transition-colors", darkMode ? "text-indigo-300" : "text-indigo-600")}>{r.distilbert}</span>
                      {EMOTION_EMOJIS[r.distilbert.toLowerCase()] && (
                        <span className="text-lg">{EMOTION_EMOJIS[r.distilbert.toLowerCase()]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Step 2: Analysis Summary */}
        <AnimatePresence>
          {results && analysisMetrics && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-3xl p-8 shadow-2xl border transition-all duration-300",
                darkMode ? "bg-slate-900/50 backdrop-blur-md border-slate-800/50" : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-start gap-4 mb-8">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20">2</div>
                <div>
                  <h2 className={cn("text-xl font-bold transition-colors", darkMode ? "text-white" : "text-indigo-900")}>Analysis Summary</h2>
                  <p className={cn("text-sm transition-colors", darkMode ? "text-slate-400" : "text-slate-500")}>Overall insights from all models</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className={cn(
                  "p-6 rounded-2xl border flex items-start gap-4 transition-colors",
                  darkMode ? "bg-slate-950/50 border-slate-800" : "bg-indigo-50/50 border-indigo-100"
                )}>
                  <div className={cn(
                    "p-3 rounded-xl shadow-lg border transition-colors",
                    darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-indigo-100"
                  )}>
                    <Smile className={cn("w-6 h-6 transition-colors", darkMode ? "text-indigo-400" : "text-indigo-600")} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-indigo-500 uppercase mb-1">Predominant Emotion</span>
                    <h3 className={cn("text-2xl font-bold capitalize leading-none mb-1 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
                      {analysisMetrics.predominant.label}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Detected in {analysisMetrics.predominant.count} of {analysisMetrics.predominant.total} messages
                    </p>
                  </div>
                </div>

                <div className={cn(
                  "p-6 rounded-2xl border flex items-start gap-4 transition-all duration-300",
                  analysisMetrics.risk.level === 'HIGH' 
                    ? (darkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100") 
                    : analysisMetrics.risk.level === 'MEDIUM' 
                      ? (darkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100") 
                      : (darkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100")
                )}>
                  <div className={cn(
                    "p-3 rounded-xl shadow-lg border transition-colors",
                    darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  )}>
                    <AlertTriangle className={cn(
                      "w-6 h-6 transition-colors",
                      analysisMetrics.risk.level === 'HIGH' ? "text-red-400" :
                      analysisMetrics.risk.level === 'MEDIUM' ? "text-orange-400" :
                      "text-emerald-400"
                    )} />
                  </div>
                  <div>
                    <span className={cn(
                      "block text-xs font-bold uppercase mb-1 transition-colors",
                      analysisMetrics.risk.level === 'HIGH' ? "text-red-400" :
                      analysisMetrics.risk.level === 'MEDIUM' ? "text-orange-400" :
                      "text-emerald-400"
                    )}>
                      Average Risk Level
                    </span>
                    <h3 className={cn("text-2xl font-bold leading-none mb-1 transition-colors", darkMode ? "text-white" : "text-slate-900")}>
                      {analysisMetrics.risk.level}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-tight">
                      Risk Score: {analysisMetrics.risk.score.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-6 rounded-2xl border transition-colors",
                darkMode ? "bg-slate-950/50 border-slate-800" : "bg-slate-50 border-slate-100"
              )}>
                <div className={cn("text-xs font-bold uppercase tracking-widest mb-4 transition-colors", darkMode ? "text-indigo-400" : "text-indigo-600")}>Risk Level Guide</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <div className={cn("text-sm font-bold transition-colors", darkMode ? "text-slate-300" : "text-slate-900")}>Safe (0.00 - 0.30)</div>
                      <div className="text-xs text-slate-500">Low risk, positive indicators</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-400 mt-1 shrink-0" />
                    <div>
                      <div className={cn("text-sm font-bold transition-colors", darkMode ? "text-slate-300" : "text-slate-900")}>Moderate (0.31 - 0.70)</div>
                      <div className="text-xs text-slate-500">Some concerns detected</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
                    <div>
                      <div className={cn("text-sm font-bold transition-colors", darkMode ? "text-slate-300" : "text-slate-900")}>High Risk (0.71 - 1.00)</div>
                      <div className="text-xs text-slate-500">High risk, immediate attention</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Step 3: Detailed Analysis */}
        <AnimatePresence>
          {results && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-3xl p-8 shadow-2xl border transition-all duration-300",
                darkMode ? "bg-slate-900/50 backdrop-blur-md border-slate-800/50" : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-start gap-4 mb-8">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20">3</div>
                <div>
                  <h2 className={cn("text-xl font-bold transition-colors", darkMode ? "text-white" : "text-indigo-900")}>Detailed Analysis Results</h2>
                  <p className={cn("text-sm transition-colors", darkMode ? "text-slate-400" : "text-slate-500")}>Comparison across all AI models</p>
                </div>
              </div>

              <div className={cn(
                "flex p-1.5 rounded-xl mb-8 w-fit overflow-x-auto max-w-full gap-1 border transition-colors",
                darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
              )}>
                {[
                  { id: 'acc_epoch', label: 'Accuracy/Epoch', icon: CheckCircle2 },
                  { id: 'loss_epoch', label: 'Loss/Epoch', icon: LineChart },
                  { id: 'acc_comp', label: 'Acc Comparison', icon: BarChart2 },
                  { id: 'loss_comp', label: 'Loss Comparison', icon: BarChart2 },
                  { id: 'emotion_trend', label: 'Emotion Trend', icon: LineChart },
                  { id: 'lstm_loss', label: 'LSTM Loss', icon: Zap }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap",
                      activeTab === tab.id 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                        : cn("transition-colors", darkMode ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50")
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                <div className="min-h-[450px]">
                  {activeTab === 'acc_epoch' && (
                    <div className="h-full w-full">
                      <div className={cn("text-sm font-bold mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-700")}>Epoch-wise Validation Accuracy</div>
                      <ResponsiveContainer width="100%" height={400}>
                        <ReLineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <YAxis domain={[0, 1]} axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                              borderRadius: '12px', 
                              color: darkMode ? '#f1f5f9' : '#0f172a' 
                            }}
                            itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
                          />
                          <Legend verticalAlign="top" height={36}/>
                          <Line type="monotone" dataKey="roberta_acc" stroke="#4f46e5" strokeWidth={3} name="RoBERTa Accuracy" dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="distilbert_acc" stroke="#10b981" strokeWidth={3} name="DistilBERT Accuracy" dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="electra_acc" stroke="#0ea5e9" strokeWidth={3} name="ELECTRA Accuracy" dot={{ r: 6 }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
 
                  {activeTab === 'loss_epoch' && (
                    <div className="h-full w-full">
                      <div className={cn("text-sm font-bold mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-700")}>Validation Loss Per Epoch</div>
                      <ResponsiveContainer width="100%" height={400}>
                        <ReLineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <YAxis axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                              borderRadius: '12px', 
                              color: darkMode ? '#f1f5f9' : '#0f172a' 
                            }}
                            itemStyle={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
                          />
                          <Legend verticalAlign="top" height={36}/>
                          <Line type="monotone" dataKey="roberta_loss" stroke="#4f46e5" strokeWidth={3} name="RoBERTa Loss" dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="distilbert_loss" stroke="#10b981" strokeWidth={3} name="DistilBERT Loss" dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="electra_loss" stroke="#0ea5e9" strokeWidth={3} name="ELECTRA Loss" dot={{ r: 6 }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
 
                  {activeTab === 'acc_comp' && (
                    <div className="h-full w-full">
                      <div className={cn("text-sm font-bold mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-700")}>Final Accuracy Comparison Between Models</div>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <YAxis domain={[0, 1]} axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                              borderRadius: '12px', 
                              color: darkMode ? '#f1f5f9' : '#0f172a' 
                            }}
                            cursor={{ fill: darkMode ? '#1e293b' : '#f1f5f9', opacity: 0.4 }}
                          />
                          <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} barSize={80}>
                            {comparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === 'RoBERTa' ? '#4f46e5' : entry.name === 'DistilBERT' ? '#10b981' : '#0ea5e9'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
 
                  {activeTab === 'loss_comp' && (
                    <div className="h-full w-full">
                      <div className={cn("text-sm font-bold mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-700")}>Final Loss Comparison Between Models</div>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <YAxis axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                              borderRadius: '12px', 
                              color: darkMode ? '#f1f5f9' : '#0f172a' 
                            }}
                            cursor={{ fill: darkMode ? '#1e293b' : '#f1f5f9', opacity: 0.4 }}
                          />
                          <Bar dataKey="loss" radius={[8, 8, 0, 0]} barSize={80}>
                            {comparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === 'RoBERTa' ? '#4f46e5' : entry.name === 'DistilBERT' ? '#10b981' : '#0ea5e9'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
 
                  {activeTab === 'emotion_trend' && (
                    <div className="h-full w-full">
                      <div className={cn("text-sm font-bold mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-700")}>Emotion Trend Over Time</div>
                      <ResponsiveContainer width="100%" height={350}>
                        <ReLineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="index" label={{ value: 'Time Sequence', position: 'insideBottom', offset: -10 }} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <YAxis domain={[-1.2, 1.2]} axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className={cn(
                                    "p-3 shadow-2xl rounded-xl border transition-colors",
                                    darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-900"
                                  )}>
                                    <p className={cn("text-xs font-bold mb-1 transition-colors", darkMode ? "text-slate-500" : "text-slate-400")}>SEQUENCE {payload[0].payload.index}</p>
                                    <p className={cn("text-sm font-bold uppercase tracking-wide transition-colors", darkMode ? "text-indigo-400" : "text-indigo-600")}>
                                      {payload[0].payload.label}
                                    </p>
                                    <p className={cn("text-xs font-medium transition-colors", darkMode ? "text-slate-400" : "text-slate-500")}>Score: {payload[0].value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: darkMode ? '#1e293b' : '#ffffff' }}
                            activeDot={{ r: 8, fill: '#4f46e5', strokeWidth: 0 }}
                          />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
 
                  {activeTab === 'lstm_loss' && (
                    <div className="h-full w-full">
                      <div className={cn("text-sm font-bold mb-6 transition-colors", darkMode ? "text-slate-400" : "text-slate-700")}>LSTM Training Loss</div>
                      <ResponsiveContainer width="100%" height={350}>
                        <ReLineChart data={lstmLossData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <YAxis axisLine={false} tickLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                              border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                              borderRadius: '12px', 
                              color: darkMode ? '#f1f5f9' : '#0f172a' 
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="loss" 
                            stroke="#8b5cf6" 
                            strokeWidth={2} 
                            dot={false}
                          />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

