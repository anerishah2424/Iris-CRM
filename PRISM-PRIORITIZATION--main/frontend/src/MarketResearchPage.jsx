import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    ArrowLeft,
    Loader2,
    Sparkles,
    Target,
    Zap,
    Download,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Copy,
    Check,
    BarChart2,
    TrendingUp
} from 'lucide-react';

const MarketResearchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [report, setReport] = useState(null);
    const [rawResponse, setRawResponse] = useState(null);
    const [error, setError] = useState(null);
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
                const response = await axios.post('http://localhost:5000/api/market-research', {
                    tasks,
                    scope: scope
                });
                setReport(response.data.report_markdown);
                setRawResponse(response.data.report_markdown);
            } catch (err) {
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
                // Fallback to markdown if no table found
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

            const getCells = (line) => {
                const parts = line.split('|');
                const cleaned = parts.slice(1, -1);
                return cleaned.map(c => c.trim());
            };

            const headers = getCells(tableLines[0]);
            const rows = tableLines.slice(2).map(getCells).filter(r => r.length === headers.length);

            // Create worksheet data: array of arrays (headers + data rows)
            const worksheetData = [headers, ...rows];

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(worksheetData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Market Research");

            // Save file
            XLSX.writeFile(wb, "Prism_Market_Research_Report.xlsx");
        } catch (err) {
            console.error("Export Error:", err);
            // Fallback to markdown if Excel export fails
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Prism_Market_Research_Report.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const parseCellContent = (text) => {
        const markdownLinkRegex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
        markdownLinkRegex.lastIndex = 0;
        if (markdownLinkRegex.test(text)) {
            markdownLinkRegex.lastIndex = 0;
            const parts = [];
            let lastIndex = 0;
            let match;
            while ((match = markdownLinkRegex.exec(text)) !== null) {
                if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
                const anchorText = match[1].trim() === 'LINK' ? 'Source' : match[1];
                parts.push(
                    <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 font-bold transition-all px-1 bg-blue-50 rounded mx-0.5">
                        {anchorText}
                    </a>
                );
                lastIndex = markdownLinkRegex.lastIndex;
            }
            if (lastIndex < text.length) parts.push(text.substring(lastIndex));
            return parts;
        }
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        urlRegex.lastIndex = 0;
        if (urlRegex.test(text)) {
            urlRegex.lastIndex = 0;
            const parts = [];
            let lastIndex = 0;
            let match;
            while ((match = urlRegex.exec(text)) !== null) {
                if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
                parts.push(
                    <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 font-medium transition-all break-all">
                        {match[0]}
                    </a>
                );
                lastIndex = urlRegex.lastIndex;
            }
            if (lastIndex < text.length) parts.push(text.substring(lastIndex));
            return parts;
        }
        return text;
    };

    const renderMarkdownTable = (markdown) => {
        if (!markdown) return null;
        const lines = markdown.split('\n').filter(line => line.trim() !== '');
        const tableLines = lines.filter(line => line.trim().startsWith('|'));

        // Better summary extraction: Find content after SECTION 2
        let summaryContent = [];
        const section2Index = lines.findIndex(l => l.toUpperCase().includes('SECTION 2'));
        if (section2Index !== -1) {
            summaryContent = lines.slice(section2Index + 1)
                .filter(l => !l.trim().startsWith('|'))
                .filter(l => !l.toUpperCase().includes('FINAL_RECOMMENDATION'))
                .filter(l => l.trim().length > 20); // Only paragraphs
        } else {
            // Fallback: exclude titles and table parts
            summaryContent = lines.filter(line =>
                !line.trim().startsWith('|') &&
                !line.trim().startsWith('-') &&
                !line.trim().startsWith('#') &&
                !line.toUpperCase().includes('SECTION') &&
                line.trim().length > 30
            );
        }
        const summaryLines = summaryContent;

        if (tableLines.length < 3) return <div className="whitespace-pre-wrap font-mono text-sm p-4">{markdown}</div>;

        // Smarter header/row parsing: handle leading/trailing pipes
        const getCells = (line) => {
            const parts = line.split('|');
            // Remove first and last empty parts if they exist (markdown standard)
            const cleaned = parts.slice(1, -1);
            return cleaned.map(c => c.trim());
        };

        const headers = getCells(tableLines[0]);
        const rows = tableLines.slice(2)
            .map(getCells)
            .filter(r => r.some(cell => cell !== '')); // Skip truly empty lines

        // Per-column width logic based on header name
        const getColClass = (h, isHeader = false) => {
            const key = h.toLowerCase();
            if (key === 'rank') return `sticky left-0 ${isHeader ? 'z-40 bg-blue-50' : 'z-20'} w-12 text-center border-r border-blue-200/50`;
            if (key === 'feature/task') return `sticky left-12 ${isHeader ? 'z-40 bg-blue-50' : 'z-20'} min-w-[200px] max-w-[250px] border-r border-blue-200/50 font-bold`;
            if (key.includes('score')) return 'w-20 text-center font-mono font-bold';
            if (key.includes('sources')) return 'min-w-[160px] max-w-[220px]';
            if (key.includes('explored')) return 'min-w-[140px]';
            return 'w-24 text-center';
        };

        return (
            <div className="flex flex-col gap-6">
                <div className="overflow-x-auto relative">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="z-30">
                            <tr className="bg-blue-50 border-b-2 border-blue-100">
                                {headers.map((h, i) => (
                                    <th key={i} className={`px-3 py-3.5 font-black text-blue-500 uppercase tracking-widest leading-tight ${getColClass(h, true)}`}>
                                        {h.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100 bg-white">
                            {rows.map((row, idx) => {
                                const lastCell = row[row.length - 1] || '';
                                const isImmediate = lastCell.includes('Immediately');
                                const isQuarter = lastCell.includes('Quarter');
                                const isStrategic = lastCell.includes('Strategic');
                                const isDefer = lastCell.includes('Defer');

                                const rowTextColor = isImmediate ? 'text-rose-600' :
                                    isQuarter ? 'text-amber-600' :
                                        isStrategic ? 'text-emerald-700' :
                                            isDefer ? 'text-slate-400' :
                                                'text-blue-700';

                                const rowBgColor = idx % 2 === 0 ? 'bg-white' : 'bg-blue-50';

                                return (
                                    <tr key={idx} className={`hover:bg-blue-100/30 transition-colors ${rowBgColor} ${rowTextColor}`}>
                                        {row.map((cell, i) => {
                                            const hdr = headers[i] || '';
                                            const colClass = getColClass(hdr, false);
                                            const isRank = hdr.toLowerCase() === 'rank';
                                            const isLast = i === headers.length - 1;
                                            const isSources = hdr.toLowerCase() === 'sources';
                                            return (
                                                <td key={i} className={`px-3 py-4 align-top ${colClass} ${rowBgColor}`}>
                                                    {isRank ? (
                                                        <span className="w-6 h-6 bg-blue-900 rounded-lg text-white text-[10px] font-black flex items-center justify-center mx-auto shadow-sm">
                                                            {cell}
                                                        </span>
                                                    ) : isLast ? (
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider leading-none inline-block whitespace-nowrap border ${isImmediate ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            isQuarter ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                isStrategic ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                    isDefer ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                            }`}>
                                                            {cell}
                                                        </span>
                                                    ) : isSources ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            {cell.split(' ; ').filter(l => l.trim()).map((link, lidx) => (
                                                                <div key={lidx} className="flex gap-1.5 items-start">
                                                                    <span className="font-bold text-blue-400 min-w-[12px]">{lidx + 1}.</span>
                                                                    <div className="flex-1 truncate">
                                                                        {parseCellContent(link.trim())}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            {parseCellContent(cell)}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {summaryLines.length > 0 && (
                    <div className="p-8 bg-blue-50/50 border-t border-blue-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-100">
                                <Zap className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-black text-blue-900 uppercase tracking-tighter italic">Executive Intelligence Summary</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {summaryLines.slice(0, 2).map((line, lidx) => (
                                <div key={lidx} className="relative group">
                                    <div className="absolute -left-6 top-0 w-1.5 h-full bg-blue-200 rounded-full opacity-40 group-hover:bg-blue-400 group-hover:opacity-100 transition-all" />
                                    <p className="text-[15px] text-blue-800 font-medium leading-[1.8] italic xl:pr-12">
                                        {parseCellContent(line)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderInternalPrioritizationTable = (tasks) => {
        if (!tasks || tasks.length === 0) return null;
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-50 border-b-2 border-blue-100">
                            <th className="px-3 py-3 font-black text-blue-500 uppercase tracking-widest w-16 text-center">Rank</th>
                            <th className="px-4 py-3 font-black text-blue-500 uppercase tracking-widest">Internal Origin Signal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100 bg-white">
                        {tasks.map((task, idx) => (
                            <tr key={idx} className={`hover:bg-blue-100/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}>
                                <td className="px-3 py-3 text-center">
                                    <span className="w-6 h-6 bg-blue-900 rounded-lg text-white text-[10px] font-black flex items-center justify-center mx-auto shadow-sm">
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-blue-700 align-top">
                                    <p className="line-clamp-3 leading-relaxed font-medium" title={task.feedback_raw}>
                                        {task.feedback_raw}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-blue-50 font-sans text-blue-900 flex flex-col">

            {/* ── PREMIUM HEADER ── */}
            <header className="bg-white/80 backdrop-blur-md border-b border-blue-200/60 sticky top-0 z-50 shadow-[0_2px_20px_-12px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="px-8 max-w-[1600px] mx-auto">
                    <div className="flex items-center justify-between h-20">

                        {/* Left: Action + Brand */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/', { state: { restoredState: location.state?.appState } })}
                                className="group flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-200"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                <span className="tracking-tight">Dashboard</span>
                            </button>

                            <div className="w-px h-8 bg-blue-200/80" />

                            <div className="flex items-center gap-3 select-none">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                                    <div className="relative p-2 bg-blue-600 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] opacity-50" />
                                        <div className="relative w-5 h-5 flex items-center justify-center">
                                            {/* Geometric Prism Logo */}
                                            <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-none stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2L2 22h20L12 2z" className="opacity-40" />
                                                <path d="M12 2L7 22h10L12 2z" />
                                                <path d="M12 2v20" className="opacity-60" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black tracking-tighter text-blue-900 leading-none flex items-center gap-1">
                                        PRISM
                                        <span className="text-blue-600">.</span>
                                        <span className="text-xs font-bold text-blue-500/80 tracking-widest uppercase ml-0.5">Core</span>
                                    </span>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">Intelligence Layer</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Status + Controls */}
                        <div className="flex items-center gap-5">
                            {!loading && !error && (
                                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200/50">
                                    <div className="flex -space-x-1.5">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center"><Target className="w-2.5 h-2.5 text-blue-600" /></div>
                                        <div className="w-5 h-5 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center"><TrendingUp className="w-2.5 h-2.5 text-sky-600" /></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Live Market Validation</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                {report && (
                                    <button
                                        onClick={downloadReport}
                                        className="relative group overflow-hidden flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-900 rounded-xl transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(0,0,0,0.4)]"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-sky-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                                        <span>Export Report</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MAIN ── */}
            <main className="flex-1 w-full p-6">

                {/* ── LOADING STATE ── */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="relative mb-10">
                            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                            <div className="relative">
                                <div className="p-5 bg-white rounded-3xl shadow-2xl border border-blue-100/50">
                                    <Loader2 className="w-14 h-14 text-blue-600 animate-spin" />
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-blue-900 mb-3 tracking-tighter uppercase italic">
                            Initializing Intelligence <span className="text-blue-600">Core</span>
                        </h3>
                        <p className="text-blue-500 max-w-sm mx-auto font-medium leading-relaxed">
                            {loadingSteps[loadingStep]}
                        </p>

                        <div className="mt-8 flex items-center gap-3">
                            {[0, 1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className={`h-1.5 rounded-full transition-all duration-700 ${s === loadingStep ? 'w-10 bg-blue-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'w-2.5 bg-blue-200'}`} />
                            ))}
                        </div>

                        <div className="mt-8 px-4 py-2 bg-blue-100 rounded-full border border-blue-200">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Signal Processing Active</span>
                        </div>
                    </div>

                    /* ERROR */
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
                        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-rose-100 shadow-inner">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <h3 className="text-2xl font-black text-blue-900 mb-3 tracking-tight">Intelligence Feed Interrupted</h3>
                        <p className="text-blue-500 max-w-md mx-auto mb-10 font-medium">
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="group flex items-center gap-3 px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-2xl shadow-blue-200 hover:-translate-y-1"
                        >
                            <span className="tracking-tight text-sm">Reconnect System</span>
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                    /* REPORT */
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

                        {/* LEFT: INTERNAL PRIORITIZATION */}
                        <div className="bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-blue-200/60 overflow-hidden">
                            <div className="px-5 py-4 border-b border-blue-100 bg-blue-50 flex items-center gap-3">
                                <Target className="w-4 h-4 text-blue-600" />
                                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Internal Order</h3>
                            </div>
                            {renderInternalPrioritizationTable(location.state?.tasks)}
                        </div>

                        {/* RIGHT: AI MARKET REPORT */}
                        <div className="xl:col-span-3 bg-white rounded-2xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-blue-200/60 overflow-hidden">
                            <div className="px-5 py-4 border-b border-blue-100 bg-blue-50/30 flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest leading-none">AI Market Intelligence Report</h3>
                                <span className="ml-auto text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Ranked by Market Score ↓</span>
                            </div>
                            {renderMarkdownTable(report)}
                        </div>

                        {/* Raw AI Output (Bottom Span) */}
                        {rawResponse && (
                            <div className="xl:col-span-2 mt-4">
                                <div className="bg-blue-900 rounded-2xl border border-blue-700 overflow-hidden">
                                    <div
                                        onClick={() => setRawExpanded(prev => !prev)}
                                        className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-blue-800 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-xs font-bold text-blue-200 font-mono text-[11px]">Raw Gemini Output</span>
                                            <span className="text-[10px] text-blue-500 font-mono">(click to {rawExpanded ? 'collapse' : 'expand'})</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(rawResponse);
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                }}
                                                className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-white transition-colors px-2 py-0.5 rounded-md hover:bg-blue-700"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                            {rawExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
                                        </div>
                                    </div>
                                    {rawExpanded && (
                                        <div className="border-t border-blue-700">
                                            <pre className="p-4 text-[10px] text-green-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                                                {rawResponse}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </main>
        </div>
    );
};

export default MarketResearchPage;
