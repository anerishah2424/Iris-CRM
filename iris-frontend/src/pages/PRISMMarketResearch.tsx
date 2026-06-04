
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/config/api';
import * as XLSX from 'xlsx';
import {
    ArrowLeft,
    Loader2,
    Sparkles,
    Target,
    Zap,
    Download,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    TrendingUp
} from 'lucide-react';

const PRISMMarketResearch: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [report, setReport] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rawExpanded, setRawExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const loadingSteps = [
        "Initializing Market Research Agent...",
        "Analyzing Industry Trends...",
        "Evaluating Competitive Saturation...",
        "Calculating Revenue Expansion Potential...",
        "Synthesizing Strategic Recommendations...",
        "Finalizing Prioritization Report..."
    ];

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % loadingSteps.length);
            }, 1500);
            return () => clearInterval(interval);
        }
    }, [loading]);

    useEffect(() => {
        const fetchAnalysis = async () => {
            const tasks = location.state?.tasks;
            if (!tasks || tasks.length === 0) {
                setError("No tasks provided for analysis. Please go back and prioritize tasks first.");
                setLoading(false);
                return;
            }
            try {
                const scope = location.state?.scope || 'global';
                const response = await api.post('/market-research', {
                    tasks,
                    scope: scope
                });
                setReport(response.data.report_markdown);
                setRawResponse(response.data.report_markdown);
            } catch (err: any) {
                console.error("Market Research Error:", err);
                setError(err.response?.data?.error || "Failed to generate market research report.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [location.state]);

    const downloadReport = () => {
        if (!report) return;

        try {
            const lines = report.split('\n').filter(line => line.trim() !== '');
            const tableLines = lines.filter(line => line.trim().startsWith('|'));

            if (tableLines.length < 3) {
                const blob = new Blob([report], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Prism_Market_Research_Report.md';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            const getCells = (line: string) => {
                const parts = line.split('|');
                const cleaned = parts.slice(1, -1);
                return cleaned.map(c => c.trim());
            };

            const headers = getCells(tableLines[0]);
            const rows = tableLines.slice(2).map(getCells).filter(r => r.length === headers.length);
            const worksheetData = [headers, ...rows];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(wb, ws, "Market Research");
            XLSX.writeFile(wb, "Prism_Market_Research_Report.xlsx");
        } catch (err) {
            console.error("Export Error:", err);
        }
    };

    const parseCellContent = (text: string) => {
        const markdownLinkRegex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
        markdownLinkRegex.lastIndex = 0;
        if (markdownLinkRegex.test(text)) {
            markdownLinkRegex.lastIndex = 0;
            const parts: any[] = [];
            let lastIndex = 0;
            let match;
            while ((match = markdownLinkRegex.exec(text)) !== null) {
                if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
                const anchorText = match[1].trim() === 'LINK' ? 'Source' : match[1];
                parts.push(
                    <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer"
                        className="text-matrix-blue hover:underline font-bold px-1 bg-matrix-paleBlue/20 rounded mx-0.5">
                        {anchorText}
                    </a>
                );
                lastIndex = markdownLinkRegex.lastIndex;
            }
            if (lastIndex < text.length) parts.push(text.substring(lastIndex));
            return parts;
        }
        return text;
    };

    const renderMarkdownTable = (markdown: string | null) => {
        if (!markdown) return null;
        const lines = markdown.split('\n').filter(line => line.trim() !== '');
        const tableLines = lines.filter(line => line.trim().startsWith('|'));

        if (tableLines.length < 3) return <div className="whitespace-pre-wrap font-mono text-sm p-4">{markdown}</div>;

        const getCells = (line: string) => {
            const parts = line.split('|');
            const cleaned = parts.slice(1, -1);
            return cleaned.map(c => c.trim());
        };

        const headers = getCells(tableLines[0]);
        const rows = tableLines.slice(2).map(getCells).filter(r => r.some(cell => cell !== ''));

        return (
            <div className="flex flex-col gap-6">
                <div className="overflow-x-auto relative">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="z-30 sticky top-0">
                            <tr className="bg-matrix-paleBlue/10 border-b-2 border-border">
                                {headers.map((h, i) => (
                                    <th key={i} className="px-4 py-4 font-bold text-matrix-navy uppercase tracking-widest whitespace-nowrap">
                                        {h.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                            {rows.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-matrix-paleBlue/5 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    {row.map((cell, i) => (
                                        <td key={i} className="px-4 py-4 align-top text-body">
                                            {parseCellContent(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/prism/prioritization', { state: { restoredState: location.state?.appState } })}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-muted"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-matrix-navy">AI Market Intelligence</h1>
                        <p className="text-sm text-body mt-1">Deep validation of features against global market signals.</p>
                    </div>
                </div>
                {report && (
                    <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-matrix-navy text-white rounded-lg hover:bg-black transition-colors text-sm font-semibold shadow-sm"
                    >
                        <Download size={16} />
                        Export Report
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="relative mb-8">
                        <div className="absolute -inset-4 bg-matrix-blue/10 rounded-full blur-2xl animate-pulse" />
                        <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-border">
                            <Loader2 className="w-12 h-12 text-matrix-blue animate-spin" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-matrix-navy mb-2 uppercase tracking-tight italic">
                        Processing Market Signals...
                    </h3>
                    <p className="text-muted max-w-sm mx-auto text-sm font-medium">
                        {loadingSteps[loadingStep]}
                    </p>
                    <div className="mt-8 flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className={`h-1.5 rounded-full transition-all duration-700 ${s === loadingStep ? 'w-10 bg-matrix-blue shadow-lg shadow-matrix-blue/20' : 'w-2 bg-slate-200'}`} />
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 border border-red-100">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-matrix-navy mb-2">Analysis Interrupted</h3>
                    <p className="text-muted max-w-md mx-auto mb-8 text-sm">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 bg-matrix-blue text-white font-bold rounded-xl hover:bg-matrix-navy transition-all shadow-lg">Retry Analysis</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-matrix-paleBlue/10 flex items-center gap-3">
                            <Sparkles size={16} className="text-matrix-blue" />
                            <h3 className="text-xs font-bold text-matrix-navy uppercase tracking-widest leading-none">Intelligence Report</h3>
                            <span className="ml-auto text-[10px] font-bold text-muted uppercase tracking-wider">{location.state?.scope === 'india' ? 'Pan-India Market' : 'Global Market'}</span>
                        </div>
                        {renderMarkdownTable(report)}
                    </div>

                    {rawResponse && (
                        <div className="bg-matrix-navy rounded-2xl border border-matrix-navy overflow-hidden">
                            <button
                                onClick={() => setRawExpanded(!rawExpanded)}
                                className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-matrix-navy/80 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Raw Intelligence Stream</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(rawResponse || '');
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="text-[10px] font-bold text-blue-300 hover:text-white uppercase flex items-center gap-1.5"
                                    >
                                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    {rawExpanded ? <ChevronUp size={16} className="text-blue-300" /> : <ChevronDown size={16} className="text-blue-300" />}
                                </div>
                            </button>
                            {rawExpanded && (
                                <div className="border-t border-white/10 p-6">
                                    <pre className="text-[11px] text-blue-100 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                                        {rawResponse}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PRISMMarketResearch;
