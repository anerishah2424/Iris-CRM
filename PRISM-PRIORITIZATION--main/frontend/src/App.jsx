
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Square,
  CheckSquare,
  Trash2,
  ListChecks,
  Sparkles,
  Plus,
  X,
  Zap
} from 'lucide-react';

const App = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [minSize, setMinSize] = useState(3);
  const [epsilon, setEpsilon] = useState(0.35);  // Match backend default for better merging
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [manualInputs, setManualInputs] = useState({});
  const [prioritizedTasks, setPrioritizedTasks] = useState(null);
  const [prioritizing, setPrioritizing] = useState(false);
  const [researchScope, setResearchScope] = useState('global'); // 'global' or 'india'

  const [displayLimit, setDisplayLimit] = useState(50);
  const navigate = useNavigate();
  const location = useLocation();

  // Restore state from navigation if available
  useEffect(() => {
    if (location.state?.restoredState) {
      const { result, selectedItems, manualInputs, prioritizedTasks, minSize, epsilon } = location.state.restoredState;
      if (result) setResult(result);
      if (selectedItems) setSelectedItems(selectedItems);
      if (manualInputs) setManualInputs(manualInputs);
      if (prioritizedTasks) setPrioritizedTasks(prioritizedTasks);
      if (minSize) setMinSize(minSize);
      if (epsilon) setEpsilon(epsilon);
    }
  }, [location.state]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => {
      // Filter out duplicates by name+size
      const existing = new Set(prev.map(f => `${f.name}_${f.size}`));
      const unique = newFiles.filter(f => !existing.has(`${f.name}_${f.size}`));
      return [...prev, ...unique];
    });
    // Reset the input so the same file can be re-selected if removed
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedRows([]);
    setPrioritizedTasks(null);
    setManualInputs({});
    // Reset limit on new analysis
    setDisplayLimit(50);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('min_size', minSize);
    formData.append('epsilon', epsilon);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.session_id) {
      window.open(`http://localhost:5000/api/download/${result.session_id}`, '_blank');
    }
  };

  const toggleRow = (idx) => {
    setExpandedRows(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const toggleSelectItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.feedback_raw === item.feedback_raw && i.task === item.task);
      if (exists) {
        // Remove item
        const newItems = prev.filter(i => !(i.feedback_raw === item.feedback_raw && i.task === item.task));
        // Update manual inputs to reflect new indices
        const newInputs = {};
        newItems.forEach((_, idx) => {
          newInputs[`task_${idx}`] = manualInputs[`task_${prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task))}`] || { revenue: 0.5, effort: 0.5 };
        });
        setManualInputs(newInputs);
        return newItems;
      } else {
        // Add item
        const newItems = [...prev, item];
        // Initialize manual inputs for the new item
        const taskKey = `task_${newItems.length - 1}`;
        setManualInputs(prevInputs => ({
          ...prevInputs,
          [taskKey]: { revenue: 0.5, effort: 0.5 }
        }));
        return newItems;
      }
    });
  };

  const isItemSelected = (item) => {
    return selectedItems.some(i => i.feedback_raw === item.feedback_raw && i.task === item.task);
  };

  const selectAllFromCluster = (clusterData) => {
    const newItems = clusterData.sub_queries.map(sub => ({
      ...sub,
      task: clusterData.task,
      cluster_id: clusterData.cluster_id
    }));

    const allSelected = newItems.every(item => isItemSelected(item));

    if (allSelected) {
      // Deselect all
      setSelectedItems(prev => {
        const filtered = prev.filter(selectedItem =>
          !newItems.some(newItem =>
            newItem.feedback_raw === selectedItem.feedback_raw &&
            newItem.task === selectedItem.task
          )
        );
        // Re-index manual inputs
        const newInputs = {};
        filtered.forEach((_, idx) => {
          const oldIdx = prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task));
          newInputs[`task_${idx}`] = manualInputs[`task_${oldIdx}`] || { revenue: 0.5, effort: 0.5 };
        });
        setManualInputs(newInputs);
        return filtered;
      });
    } else {
      // Select all
      setSelectedItems(prev => {
        const filtered = prev.filter(selectedItem =>
          !newItems.some(newItem =>
            newItem.feedback_raw === selectedItem.feedback_raw &&
            newItem.task === selectedItem.task
          )
        );
        const combined = [...filtered, ...newItems];
        // Initialize manual inputs for all items
        const newInputs = {};
        combined.forEach((_, idx) => {
          const oldIdx = prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task));
          newInputs[`task_${idx}`] = manualInputs[`task_${oldIdx}`] || { revenue: 0.5, effort: 0.5 };
        });
        setManualInputs(newInputs);
        return combined;
      });
    }
  };

  const removeFromTodo = (item) => {
    setSelectedItems(prev => {
      const newItems = prev.filter(i => !(i.feedback_raw === item.feedback_raw && i.task === item.task));
      // Re-index manual inputs
      const newInputs = {};
      newItems.forEach((_, idx) => {
        const oldIdx = prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task));
        newInputs[`task_${idx}`] = manualInputs[`task_${oldIdx}`] || { revenue: 0.5, effort: 0.5 };
      });
      setManualInputs(newInputs);
      return newItems;
    });
  };

  const clearAllTodos = () => {
    setSelectedItems([]);
    setManualInputs({});
    setPrioritizedTasks(null);
  };

  const handleApplyAlgorithm = async () => {
    setPrioritizing(true);
    setPrioritizedTasks(null);

    console.log('DEBUG: Selected items:', selectedItems);
    console.log('DEBUG: Manual inputs:', manualInputs);
    console.log('DEBUG: Number of selected items:', selectedItems.length);

    try {
      const response = await axios.post('http://localhost:5000/api/prioritize', {
        selected_items: selectedItems,
        manual_inputs: manualInputs,
        session_id: result?.session_id
      });

      console.log('DEBUG: Response data:', response.data);
      console.log('DEBUG: Number of prioritized tasks:', response.data.prioritized_tasks.length);

      setPrioritizedTasks(response.data.prioritized_tasks);
    } catch (err) {
      console.error('DEBUG: Error:', err);
      if (err.response?.status === 404) {
        setError('Session expired (server restarted or timed out). Please re-upload your files and analyze again.');
      } else {
        setError(err.response?.data?.error || 'Failed to prioritize tasks');
      }
    } finally {
      setPrioritizing(false);
    }
  };

  const updateManualInput = (taskIndex, field, value) => {
    setManualInputs(prev => ({
      ...prev,
      [`task_${taskIndex}`]: {
        ...prev[`task_${taskIndex}`],
        [field]: parseFloat(value)
      }
    }));
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ── PREMIUM HEADER ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200/60 sticky top-0 z-50 shadow-[0_2px_20px_-12px_rgba(0,0,0,0.1)] transition-all duration-300">
        <div className="px-8 flex items-center justify-between h-20">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3 select-none">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative p-2 bg-blue-600 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] opacity-50" />
                <div className="relative w-5 h-5 flex items-center justify-center">
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

          {/* Right Section: Status & Actions */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200/50">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse outline outline-4 outline-blue-500/20" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Enterprise Ready v1.2</span>
            </div>

            {result?.session_id && (
              <button
                onClick={handleDownload}
                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-900 rounded-xl transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(0,0,0,0.4)]"
              >
                <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                <span>Export Data</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-8 py-10 max-w-[1400px] mx-auto">
        {/* Upload Section */}
        {!result && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-blue-100 p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-black text-blue-900 tracking-tight">Intelligence Feed</h2>
              </div>

              {/* File Upload */}
              <div className="relative border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl p-12 hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                <input
                  type="file"
                  multiple
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="file-upload-main"
                />
                <div className="text-center relative z-0">
                  <div className="inline-flex p-4 bg-white rounded-2xl mb-5 shadow-sm border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-800 mb-1">Click or drag Excel files</h3>
                  <p className="text-xs text-blue-400 font-medium tracking-wide uppercase">Support for .xlsx datasets</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  {/* File list */}
                  <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <ListChecks className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-bold text-blue-800 uppercase tracking-tight">{files.length} file(s) staged</p>
                      </div>
                      <button
                        onClick={() => setFiles([])}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-blue-200/60 group hover:border-blue-300 hover:shadow-sm transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-sm font-medium text-blue-700 truncate">{file.name}</span>
                            <span className="text-[10px] font-bold text-blue-400 shrink-0 uppercase tracking-tight">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1.5 text-blue-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add More Files Button */}
                  <label
                    htmlFor="file-upload-additional"
                    className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    Add More Signals
                    <input
                      type="file"
                      multiple
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload-additional"
                    />
                  </label>
                </div>
              )}

              {/* Settings */}
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-xs font-black text-blue-500 uppercase tracking-widest">Cluster Sensitivity</label>
                    <span className="px-3 py-1 text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">{minSize}</span>
                  </div>
                  <input
                    type="range" min="2" max="20"
                    value={minSize}
                    onChange={(e) => setMinSize(e.target.value)}
                    className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-xs font-black text-blue-500 uppercase tracking-widest">Extraction Strictness</label>
                    <span className="px-3 py-1 text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">{epsilon}</span>
                  </div>
                  <input
                    type="range" min="0" max="0.5" step="0.05"
                    value={epsilon}
                    onChange={(e) => setEpsilon(e.target.value)}
                    className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900">Analysis Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading || files.length === 0}
                className="w-full mt-10 py-4 bg-blue-600 hover:bg-blue-900 disabled:bg-blue-200 disabled:text-blue-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Neural Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="tracking-tight">Run Intelligence Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-blue-100 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors" />
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Total Feed Signals</p>
                <h4 className="text-5xl font-black text-blue-900 tracking-tighter">{result.summary.total_rows}</h4>
              </div>
              <div className="bg-white rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-blue-100 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors" />
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Topic Categories Identified</p>
                <h4 className="text-5xl font-black text-blue-600 tracking-tighter">{result.summary.clusters_detected}</h4>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
              {/* Topics Table */}
              <div className="bg-white rounded-[2rem] shadow-[0_15px_40px_-12px_rgba(0,0,0,0.08)] border border-blue-100 overflow-hidden flex flex-col" style={{ height: '75vh' }}>
                <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-blue-50/50 flex-shrink-0">
                  <div className="flex items-center gap-5">
                    <h3 className="text-lg font-black text-blue-900 tracking-tight uppercase italic">Topic Analysis</h3>
                    <div className="h-4 w-px bg-blue-200" />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Show:</span>
                      <select
                        value={displayLimit}
                        onChange={(e) => setDisplayLimit(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                        className="text-[11px] font-bold text-blue-600 bg-white border border-blue-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 transition-all cursor-pointer shadow-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="All">All</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResult(null);
                        setFiles([]);
                        setSelectedItems([]);
                        setManualInputs({});
                        setPrioritizedTasks(null);
                      }}
                      className="px-4 py-2 text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-lg transition-all border border-blue-200"
                    >
                      New Analysis
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-blue-900 hover:bg-blue-600 rounded-xl transition-all shadow-md uppercase tracking-widest"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  <table className="w-full relative">
                    <thead className="sticky top-0 z-10 shadow-sm">
                      <tr className="bg-blue-50/95 backdrop-blur-sm border-b border-blue-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Topic</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider w-24">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {(displayLimit === 'All' ? result.chart_data : result.chart_data.slice(0, displayLimit)).map((row, idx) => (
                        <React.Fragment key={`topic-${idx}`}>
                          <tr
                            onClick={() => toggleRow(idx)}
                            className="hover:bg-blue-100/40 cursor-pointer transition-all border-b border-blue-50 group"
                          >
                            <td className="px-6 py-5 text-sm font-bold text-blue-800 flex items-center gap-3">
                              {expandedRows.includes(idx) ? (
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-blue-300" />
                              )}
                              <span className="tracking-tight">{row.task}</span>
                            </td>
                            <td className="px-6 py-5 text-sm font-black text-blue-600 text-right font-mono">
                              {row.count}
                            </td>
                          </tr>

                          {expandedRows.includes(idx) && (
                            <tr>
                              <td colSpan="2" className="px-0 py-0">
                                <div className="bg-blue-50/50 px-12 py-6 space-y-3 border-y border-blue-100">
                                  <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Signal Pattern Matrix</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectAllFromCluster(row);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-100"
                                    >
                                      {row.sub_queries.every(sub => isItemSelected({ ...sub, task: row.task })) ? (
                                        <>
                                          <CheckSquare className="w-3.5 h-3.5" />
                                          Deselect All
                                        </>
                                      ) : (
                                        <>
                                          <Square className="w-3.5 h-3.5" />
                                          Select All
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {row.sub_queries.map((sub, sidx) => {
                                      const itemWithTask = { ...sub, task: row.task, cluster_id: row.cluster_id };
                                      const selected = isItemSelected(itemWithTask);

                                      return (
                                        <div
                                          key={sidx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelectItem(itemWithTask);
                                          }}
                                          className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${selected
                                            ? 'bg-blue-100/50 border-blue-300 shadow-sm'
                                            : 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                        >
                                          <div className="flex items-start gap-3 flex-1">
                                            {selected ? (
                                              <CheckSquare className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                            ) : (
                                              <Square className="w-4 h-4 text-blue-200 mt-0.5 shrink-0" />
                                            )}
                                            <span className="text-sm text-blue-700 font-medium leading-relaxed">
                                              "{sub.feedback_raw}"
                                            </span>
                                          </div>
                                          <span className="text-[10px] font-black bg-white border border-blue-100 text-blue-600 px-2.5 py-1 rounded-lg ml-3 shadow-sm">
                                            {sub.count}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* To-Do List Panel */}
              <div className="bg-white rounded-[2rem] shadow-[0_15_40px_-12px_rgba(0,0,0,0.08)] border border-blue-100 overflow-hidden flex flex-col" style={{ height: '75vh' }}>
                <div className="p-6 border-b border-blue-100 bg-blue-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-blue-900 flex items-center gap-2.5 uppercase tracking-widest italic leading-none">
                      <ListChecks className="w-4 h-4 text-blue-600" />
                      Priority Ledger
                    </h3>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={clearAllTodos}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-all"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-20 px-4">
                      <div className="inline-flex p-5 bg-blue-50 rounded-3xl mb-5 shadow-inner border border-blue-100">
                        <ListChecks className="w-10 h-10 text-blue-300" />
                      </div>
                      <p className="text-sm font-bold text-blue-700 mb-1">Queue is Empty</p>
                      <p className="text-[11px] text-blue-400 font-medium leading-relaxed uppercase tracking-tighter">Extract signals from the topic analysis to build your intelligence roadmap</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedItems.map((item, idx) => {
                        const taskKey = `task_${idx}`;
                        return (
                          <div
                            key={`${item.task}-${idx}`}
                            className="p-5 bg-white border border-blue-100 rounded-2xl shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] hover:border-blue-100 transition-all hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-blue-600 mb-2 uppercase tracking-[0.2em] leading-none">
                                  {item.task}
                                </p>
                                <p className="text-sm text-blue-700 font-medium leading-relaxed mb-3">"{item.feedback_raw}"</p>
                                <span className="text-[10px] font-bold text-blue-400 border border-blue-100 px-2 py-1 rounded-lg uppercase tracking-tight bg-blue-50/50">
                                  {item.count} Signal Matches
                                </span>
                              </div>
                              <button
                                onClick={() => removeFromTodo(item)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Revenue Slider */}
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-blue-700">
                                  💰 Revenue Impact
                                </label>
                                <span className="px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded-full">
                                  {manualInputs[taskKey]?.revenue?.toFixed(2) || '0.50'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={manualInputs[taskKey]?.revenue || 0.5}
                                onChange={(e) => updateManualInput(idx, 'revenue', e.target.value)}
                                className="w-full accent-green-600"
                              />
                              <div className="flex justify-between text-xs text-blue-500 mt-0.5">
                                <span>Low</span>
                                <span>High</span>
                              </div>
                            </div>

                            {/* Effort Slider */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-blue-700">
                                  ⚡ Implementation Effort
                                </label>
                                <span className="px-2 py-0.5 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">
                                  {manualInputs[taskKey]?.effort?.toFixed(2) || '0.50'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={manualInputs[taskKey]?.effort || 0.5}
                                onChange={(e) => updateManualInput(idx, 'effort', e.target.value)}
                                className="w-full accent-orange-600"
                              />
                              <div className="flex justify-between text-xs text-blue-500 mt-0.5">
                                <span>Easy</span>
                                <span>Hard</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedItems.length > 0 && (
                  <div className="p-6 border-t border-blue-100 bg-blue-50/50 flex-shrink-0">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between p-5 bg-white border border-blue-100 rounded-2xl shadow-sm">
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Active Signals</span>
                        <span className="text-3xl font-black text-blue-900 tracking-tighter">
                          {selectedItems.length}
                        </span>
                      </div>

                      <button
                        onClick={handleApplyAlgorithm}
                        disabled={prioritizing}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-blue-400 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-[0_15px_30px_-10px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        {prioritizing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Synchronizing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-current" />
                            Initialize Priorities
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prioritized Results Section */}
            {prioritizedTasks && prioritizedTasks.length > 0 && (
              <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-blue-100 overflow-hidden mt-10">
                <div className="p-8 border-b border-blue-100 bg-blue-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Strategic Intelligence Matrix</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Tasks ranked by priority score (higher is more important)
                      </p>
                    </div>


                    <div className="flex items-center gap-4">
                      {/* Research Scope Toggle */}
                      <div className="flex bg-blue-100 p-1 rounded-xl border border-blue-200">
                        <button
                          onClick={() => setResearchScope('india')}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${researchScope === 'india'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-blue-500 hover:text-blue-700'
                            }`}
                        >
                          Pan India
                        </button>
                        <button
                          onClick={() => setResearchScope('global')}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${researchScope === 'global'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-blue-500 hover:text-blue-700'
                            }`}
                        >
                          Global
                        </button>
                      </div>

                      <button
                        onClick={() => navigate('/market-research', {
                          state: {
                            tasks: prioritizedTasks,
                            scope: researchScope,
                            // Pass current state to be restored later
                            appState: {
                              result,
                              selectedItems,
                              manualInputs,
                              prioritizedTasks,
                              minSize,
                              epsilon,
                              researchScope
                            }
                          }
                        })}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md shadow-blue-500/20"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        Run Market Research Simulation
                      </button>
                      <button
                        onClick={() => setPrioritizedTasks(null)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 px-4 py-2 hover:bg-blue-100 rounded-lg transition-all"
                      >
                        Clear Results
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-50 border-b border-blue-200/60">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-blue-400 uppercase tracking-widest">Rank</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-blue-400 uppercase tracking-widest">Signal Cluster</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-blue-400 uppercase tracking-widest">Feed Fragment</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-blue-400 uppercase tracking-widest border-l border-blue-100 bg-blue-100/30">Composite Score</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Demand</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Impact</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Urgency</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Confidence</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Revenue</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Effort</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {prioritizedTasks.map((task, idx) => (
                        <tr key={idx} className="hover:bg-blue-100/40 transition-all border-b border-blue-50">
                          <td className="px-6 py-5">
                            <span className="w-7 h-7 bg-blue-900 rounded-lg text-white text-[11px] font-black flex items-center justify-center shadow-lg">
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-900">
                            {task.task}
                          </td>
                          <td className="px-4 py-3 text-xs text-blue-600 max-w-xs truncate">
                            "{task.feedback_raw}"
                          </td>
                          <td className="px-6 py-5 text-center border-l border-blue-100 bg-blue-50/10">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-100 font-mono tracking-tighter">
                              {task.priority_score.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-blue-700">
                            {task.Demand.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-blue-700">
                            {task.Impact.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-blue-700">
                            {task.Urgency.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-blue-700">
                            {task.Confidence.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-blue-700">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              {task.Revenue.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-blue-700">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                              {task.Effort.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;


