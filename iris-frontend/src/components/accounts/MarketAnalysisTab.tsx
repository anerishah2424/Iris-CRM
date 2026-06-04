import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCcw, AlertTriangle, Newspaper, TrendingUp, ShieldAlert, MessageSquare, Loader2 } from 'lucide-react';
import { useRunMarketAnalysis } from '@/hooks/useAgent';
import { useAccount } from '@/hooks/useAccounts';
import { formatDateTime } from '@/lib/utils';

export function MarketAnalysisTab({ accountId }: { accountId: number; accountName: string }) {
  const { data: account } = useAccount(accountId);
  const runMarketAnalysis = useRunMarketAnalysis();
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!account) return;
    
    const payload = {
      company_name: account.account_name,
      industry: account.industry,
      company_size: 'Mid-sized', // Default or derived
      location: { 
        state: account.state, 
        city: account.city 
      },
      budget_range: '50000-100000' // Default or derived
    };

    const data = await runMarketAnalysis.mutateAsync(payload);
    setResult(data);
  };

  const isRunning = runMarketAnalysis.isPending;

  if (!result && !isRunning) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-matrix-paleBlue flex items-center justify-center mb-6">
          <Sparkles size={40} className="text-matrix-blue" />
        </div>
        <h3 className="text-xl font-bold text-matrix-navy mb-2">AI Market Intelligence</h3>
        <p className="text-muted text-sm max-w-sm mb-8">
          Surface real-time market news, expansion signals, and talking points for <strong>{account?.account_name}</strong> using agentic AI.
        </p>
        <button onClick={handleRun} disabled={isRunning} className="btn-primary px-8 py-3 rounded-xl shadow-xl shadow-matrix-blue/20">
          <Sparkles size={16} /> Run Market Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-matrix-navy to-matrix-blue text-white shadow-2xl shadow-matrix-blue/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-blue-300" />
            <h2 className="text-xl font-bold tracking-tight">Market Intelligence Report</h2>
          </div>
          <p className="text-blue-100/80 text-sm">
            AI-driven insights and real-time market signals for <span className="font-semibold text-white">{account?.account_name}</span>
          </p>
        </div>
        <button 
          onClick={handleRun} 
          disabled={isRunning} 
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
        >
          {isRunning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          {isRunning ? 'Analyzing...' : 'Refresh Intelligence'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isRunning ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="card py-12 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-matrix-blue/20 border-t-matrix-blue animate-spin" />
                <Sparkles size={16} className="absolute inset-0 m-auto text-matrix-blue" />
              </div>
              <p className="text-sm font-medium text-matrix-navy">Agent is scanning market signals…</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Recent News */}
            <AnalysisCard 
              title="Recent News" 
              icon={<Newspaper size={18} className="text-matrix-blue" />}
              data={result?.recent_news}
              emptyText="No recent news found."
            />

            {/* Expansion Signals */}
            <AnalysisCard 
              title="Expansion Signals" 
              icon={<TrendingUp size={18} className="text-health-green" />}
              data={result?.expansion_signals}
              emptyText="No expansion signals detected."
            />

            {/* Risk Factors */}
            <AnalysisCard 
              title="Risk Factors" 
              icon={<ShieldAlert size={18} className="text-health-red" />}
              data={result?.risk_factors}
              emptyText="No significant risk factors detected."
              itemClass="text-health-red bg-red-50/50 border-red-100"
            />

            {/* Talking Points */}
            <AnalysisCard 
              title="Sales Talking Points" 
              icon={<MessageSquare size={18} className="text-amber-500" />}
              data={result?.talking_points}
              emptyText="No talking points generated."
              itemClass="border-amber-100 bg-amber-50/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NewsItem {
  title: string;
  snippet: string;
  relevance: string;
}

function AnalysisCard({ title, icon, data, emptyText, itemClass = "" }: any) {
  return (
    <div className="card flex flex-col h-full border-none shadow-xl shadow-matrix-navy/5 bg-white/80 backdrop-blur-sm overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-matrix-paleBlue text-matrix-blue group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <h3 className="font-bold text-matrix-navy text-lg">{title}</h3>
        </div>
        <div className="text-[10px] font-bold text-matrix-blue/40 uppercase tracking-widest bg-matrix-paleBlue/30 px-2 py-1 rounded-md">
          Matrix AI
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {data && data.length > 0 ? (
          data.map((item: string | NewsItem, i: number) => {
            const isNews = typeof item === 'object' && 'title' in item;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  itemClass ? itemClass : 'border-border/50 bg-white shadow-sm hover:shadow-md hover:border-matrix-blue/30'
                }`}
              >
                {isNews ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-matrix-navy text-[15px] leading-tight group-hover:text-matrix-blue transition-colors">
                      {(item as NewsItem).title}
                    </h4>
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-matrix-blue/20 rounded-full" />
                      <p className="text-muted text-[13px] leading-relaxed italic pl-3">
                        "{(item as NewsItem).snippet}"
                      </p>
                    </div>
                    <div className="pt-3 mt-1 border-t border-border/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles size={12} className="text-matrix-blue" />
                        <span className="text-[11px] font-bold text-matrix-blue uppercase tracking-widest">Strategic Insight</span>
                      </div>
                      <p className="text-body text-[13px] leading-relaxed font-medium">
                        {(item as NewsItem).relevance}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                    <p className="text-[13px] leading-relaxed font-medium">{item as string}</p>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted italic text-[14px] bg-matrix-paleBlue/20 rounded-2xl border border-dashed border-border">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

