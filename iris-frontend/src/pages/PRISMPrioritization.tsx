
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/config/api';
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

const PRISMPrioritization: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [minSize, setMinSize] = useState(3);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [manualInputs, setManualInputs] = useState<any>({});
  const [prioritizedTasks, setPrioritizedTasks] = useState<any[] | null>(null);
  const [prioritizing, setPrioritizing] = useState(false);
  const [researchScope, setResearchScope] = useState('global'); 

  const [displayLimit, setDisplayLimit] = useState<number | 'All'>(50);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.restoredState) {
      const { result, selectedItems, manualInputs, prioritizedTasks, minSize } = location.state.restoredState;
      if (result) setResult(result);
      if (selectedItems) setSelectedItems(selectedItems);
      if (manualInputs) setManualInputs(manualInputs);
      if (prioritizedTasks) setPrioritizedTasks(prioritizedTasks);
      if (minSize) setMinSize(minSize);
    }
  }, [location.state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}_${f.size}`));
      const unique = newFiles.filter(f => !existing.has(`${f.name}_${f.size}`));
      return [...prev, ...unique];
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
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
    setDisplayLimit(50);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('min_size', minSize.toString());

    try {
      const response = await api.post('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.session_id) {
      const token = localStorage.getItem('accessToken');
      window.open(`http://localhost:5000/api/download/${result.session_id}?token=${token}`, '_blank');
    }
  };

  const toggleRow = (idx: number) => {
    setExpandedRows(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleSelectItem = (item: any) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.feedback_raw === item.feedback_raw && i.task === item.task);
      if (exists) {
        const newItems = prev.filter(i => !(i.feedback_raw === item.feedback_raw && i.task === item.task));
        const newInputs: any = {};
        newItems.forEach((_, idx) => {
          newInputs[`task_${idx}`] = manualInputs[`task_${prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task) as any)}`] || { revenue: 0.5, effort: 0.5 };
        });
        setManualInputs(newInputs);
        return newItems;
      } else {
        const newItems = [...prev, item];
        const taskKey = `task_${newItems.length - 1}`;
        setManualInputs((prevInputs: any) => ({
          ...prevInputs,
          [taskKey]: { revenue: 0.5, effort: 0.5 }
        }));
        return newItems;
      }
    });
  };

  const isItemSelected = (item: any) => {
    return selectedItems.some(i => i.feedback_raw === item.feedback_raw && i.task === item.task);
  };

  const selectAllFromCluster = (clusterData: any) => {
    const newItems = clusterData.sub_queries.map((sub: any) => ({
      ...sub,
      task: clusterData.task,
      cluster_id: clusterData.cluster_id
    }));

    const allSelected = newItems.every((item: any) => isItemSelected(item));

    if (allSelected) {
      setSelectedItems(prev => {
        const filtered = prev.filter(selectedItem =>
          !newItems.some((newItem: any) =>
            newItem.feedback_raw === selectedItem.feedback_raw &&
            newItem.task === selectedItem.task
          )
        );
        const newInputs: any = {};
        filtered.forEach((_, idx) => {
          const oldIdx = prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task) as any);
          newInputs[`task_${idx}`] = manualInputs[`task_${oldIdx}`] || { revenue: 0.5, effort: 0.5 };
        });
        setManualInputs(newInputs);
        return filtered;
      });
    } else {
      setSelectedItems(prev => {
        const filtered = prev.filter(selectedItem =>
          !newItems.some((newItem: any) =>
            newItem.feedback_raw === selectedItem.feedback_raw &&
            newItem.task === selectedItem.task
          )
        );
        const combined = [...filtered, ...newItems];
        const newInputs: any = {};
        combined.forEach((_, idx) => {
          const oldIdx = prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task) as any);
          newInputs[`task_${idx}`] = manualInputs[`task_${oldIdx}`] || { revenue: 0.5, effort: 0.5 };
        });
        setManualInputs(newInputs);
        return combined;
      });
    }
  };

  const removeFromTodo = (item: any) => {
    setSelectedItems(prev => {
      const newItems = prev.filter(i => !(i.feedback_raw === item.feedback_raw && i.task === item.task));
      const newInputs: any = {};
      newItems.forEach((_, idx) => {
        const oldIdx = prev.indexOf(prev.find(p => p.feedback_raw === _.feedback_raw && p.task === _.task) as any);
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

    try {
      const response = await api.post('/prioritize', {
        selected_items: selectedItems,
        manual_inputs: manualInputs,
        session_id: result?.session_id
      });
      setPrioritizedTasks(response.data.prioritized_tasks);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Session expired. Please re-upload your files and analyze again.');
      } else {
        setError(err.response?.data?.error || 'Failed to prioritize tasks');
      }
    } finally {
      setPrioritizing(false);
    }
  };

  const updateManualInput = (taskIndex: number, field: string, value: string) => {
    setManualInputs((prev: any) => ({
      ...prev,
      [`task_${taskIndex}`]: {
        ...prev[`task_${taskIndex}`],
        [field]: parseFloat(value)
      }
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-matrix-navy">Feature Prioritization</h1>
          <p className="text-sm text-body mt-1">Upload customer feedback and rank features by strategic impact.</p>
        </div>
        {result?.session_id && (
            <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-matrix-blue text-white rounded-lg hover:bg-matrix-navy transition-colors text-sm font-semibold shadow-sm"
            >
            <Download size={16} />
            Export Data
            </button>
        )}
      </div>

      {!result ? (
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
            <div className="relative border-2 border-dashed border-matrix-paleBlue bg-matrix-paleBlue/20 rounded-2xl p-12 hover:border-matrix-blue hover:bg-matrix-paleBlue/30 transition-all group">
              <input
                type="file"
                multiple
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-center relative z-0">
                <div className="inline-flex p-4 bg-white rounded-2xl mb-5 shadow-sm border border-border group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-matrix-blue" />
                </div>
                <h3 className="text-lg font-bold text-matrix-navy mb-1">Click or drag Excel files</h3>
                <p className="text-xs text-muted font-medium tracking-wide uppercase">Support for .xlsx datasets</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">{files.length} file(s) staged</p>
                  <button onClick={() => setFiles([])} className="text-xs font-semibold text-red-500 hover:underline">Clear All</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-matrix-paleBlue/10 px-4 py-2 rounded-lg border border-border">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={14} className="text-matrix-blue shrink-0" />
                        <span className="text-sm text-matrix-navy truncate">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="text-muted hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-muted uppercase">Cluster Sensitivity</label>
                  <span className="text-xs font-bold text-matrix-blue">{minSize}</span>
                </div>
                <input
                  type="range" min="2" max="20"
                  value={minSize}
                  onChange={(e) => setMinSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-matrix-paleBlue rounded-lg appearance-none cursor-pointer accent-matrix-blue"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || files.length === 0}
              className="w-full mt-8 py-3.5 bg-matrix-blue hover:bg-matrix-navy disabled:bg-slate-200 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><Sparkles size={18} /> Run Intelligence Analysis</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* Topics Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-border bg-matrix-paleBlue/10 flex items-center justify-between">
                <h3 className="text-sm font-bold text-matrix-navy uppercase tracking-wider">Topic Analysis</h3>
                <div className="flex items-center gap-4">
                    <select
                        value={displayLimit}
                        onChange={(e) => setDisplayLimit(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                        className="text-xs border rounded px-2 py-1 outline-none"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value="All">All</option>
                    </select>
                    <button onClick={() => { setResult(null); setFiles([]); }} className="text-xs text-matrix-blue hover:underline">New Analysis</button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-matrix-paleBlue/5 shadow-sm">
                  <tr className="text-left">
                    <th className="px-6 py-3 text-xs font-bold text-muted uppercase tracking-wider">Topic</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-muted uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(displayLimit === 'All' ? result.chart_data : result.chart_data.slice(0, displayLimit)).map((row: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <tr onClick={() => toggleRow(idx)} className="hover:bg-matrix-paleBlue/5 cursor-pointer transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3 text-sm font-medium text-matrix-navy">
                          {expandedRows.includes(idx) ? <ChevronDown size={16} className="text-matrix-blue" /> : <ChevronRight size={16} className="text-muted" />}
                          {row.task}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-matrix-blue">{row.count}</td>
                      </tr>
                      {expandedRows.includes(idx) && (
                        <tr>
                          <td colSpan={2} className="bg-slate-50/50 p-4">
                            <div className="flex justify-end mb-3">
                                <button
                                    onClick={() => selectAllFromCluster(row)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-matrix-blue hover:underline"
                                >
                                    {row.sub_queries.every((sub: any) => isItemSelected({ ...sub, task: row.task })) ? 'Deselect Cluster' : 'Select Cluster'}
                                </button>
                            </div>
                            <div className="space-y-2 pl-6">
                              {row.sub_queries.map((sub: any, sidx: number) => {
                                const item = { ...sub, task: row.task, cluster_id: row.cluster_id };
                                const selected = isItemSelected(item);
                                return (
                                  <div
                                    key={sidx}
                                    onClick={() => toggleSelectItem(item)}
                                    className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'bg-white border-matrix-blue shadow-sm' : 'bg-white/50 border-border hover:border-matrix-blue'}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {selected ? <CheckSquare size={14} className="text-matrix-blue mt-0.5" /> : <Square size={14} className="text-muted mt-0.5" />}
                                      <span className="text-xs text-body leading-relaxed">"{sub.feedback_raw}"</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted ml-2">{sub.count}</span>
                                  </div>
                                );
                              })}
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

          {/* Sidebar Queue */}
          <div className="bg-white rounded-2xl shadow-sm border border-border flex flex-col h-[600px]">
            <div className="p-4 border-b border-border bg-matrix-paleBlue/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-matrix-navy uppercase tracking-wider flex items-center gap-2">
                <ListChecks size={14} /> Priority Ledger
              </h3>
              {selectedItems.length > 0 && <button onClick={clearAllTodos} className="text-[10px] font-bold text-red-500 uppercase">Clear</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedItems.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <ListChecks className="w-10 h-10 text-muted mx-auto mb-3 opacity-20" />
                  <p className="text-xs text-muted">No items in queue. Select topics from the analysis to build your roadmap.</p>
                </div>
              ) : (
                selectedItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-border rounded-xl space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-matrix-blue uppercase truncate">{item.task}</p>
                        <p className="text-xs text-body line-clamp-2 mt-1">"{item.feedback_raw}"</p>
                      </div>
                      <button onClick={() => removeFromTodo(item)} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                            <span>Revenue</span>
                            <span className="text-matrix-navy">{manualInputs[`task_${idx}`]?.revenue?.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={manualInputs[`task_${idx}`]?.revenue || 0.5} onChange={(e) => updateManualInput(idx, 'revenue', e.target.value)} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-matrix-blue" />
                        <div className="flex justify-between text-[10px] font-bold text-muted uppercase mt-2">
                            <span>Effort</span>
                            <span className="text-matrix-navy">{manualInputs[`task_${idx}`]?.effort?.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.05" value={manualInputs[`task_${idx}`]?.effort || 0.5} onChange={(e) => updateManualInput(idx, 'effort', e.target.value)} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-matrix-blue" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="p-4 bg-matrix-paleBlue/10 border-t border-border">
                <button
                  onClick={handleApplyAlgorithm}
                  disabled={prioritizing}
                  className="w-full py-3 bg-matrix-blue hover:bg-matrix-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {prioritizing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                  Run Prioritization
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prioritization Result Modal or Bottom Section */}
      {prioritizedTasks && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-matrix-blue/20 overflow-hidden">
          <div className="p-6 border-b border-border bg-matrix-navy text-white flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold">Strategic Intelligence Matrix</h3>
                <p className="text-xs text-blue-200 mt-1">Recommended execution order based on market dynamics and constraints.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex bg-white/10 p-1 rounded-lg">
                    <button onClick={() => setResearchScope('india')} className={`px-3 py-1 text-[10px] font-bold rounded ${researchScope === 'india' ? 'bg-white text-matrix-navy' : 'text-white hover:bg-white/5'}`}>India</button>
                    <button onClick={() => setResearchScope('global')} className={`px-3 py-1 text-[10px] font-bold rounded ${researchScope === 'global' ? 'bg-white text-matrix-navy' : 'text-white hover:bg-white/5'}`}>Global</button>
                </div>
                <button
                    onClick={() => navigate('/prism/market-research', { state: { tasks: prioritizedTasks, scope: researchScope, appState: { result, selectedItems, manualInputs, prioritizedTasks, minSize } } })}
                    className="px-4 py-2 bg-matrix-blue hover:bg-blue-400 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                >
                    <Sparkles size={14} />
                    AI Market Research
                </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-border">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase">Rank</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase">Feature</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Signals</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Priority</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Demand</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Impact</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Confidence</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Effort</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Urgency</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase text-center">Revenue</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted uppercase">Strategic Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prioritizedTasks.map((task, idx) => {
                  const score = task.priority_score;
                  let recommendation = "Defer";
                  let color = "text-slate-400";
                  if (score >= 0.8) { recommendation = "Immediate Priority"; color = "text-red-600"; }
                  else if (score >= 0.6) { recommendation = "Quarterly Focus"; color = "text-amber-600"; }
                  else if (score >= 0.4) { recommendation = "Strategic Roadmap"; color = "text-matrix-blue"; }

                  return (
                    <tr key={idx} className="hover:bg-matrix-paleBlue/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="w-6 h-6 bg-matrix-navy rounded-lg text-white text-[10px] font-bold flex items-center justify-center shadow-sm">{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-matrix-navy uppercase">{task.task}</p>
                        <p className="text-xs text-body mt-0.5 line-clamp-1">"{task.feedback_raw}"</p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-matrix-blue">{task.count}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono font-bold">{(score * 100).toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono">{task.Demand != null ? (task.Demand * 100).toFixed(0) + '%' : '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono">{task.Impact != null ? (task.Impact * 100).toFixed(0) + '%' : '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono">{task.Confidence != null ? (task.Confidence * 100).toFixed(0) + '%' : '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          task.Effort === 'Low' ? 'bg-green-100 text-green-700' :
                          task.Effort === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{task.Effort ?? '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono">{task.Urgency != null ? (task.Urgency * 100).toFixed(0) + '%' : '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-mono">{task.Revenue != null ? (task.Revenue * 100).toFixed(0) + '%' : '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{recommendation}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRISMPrioritization;
