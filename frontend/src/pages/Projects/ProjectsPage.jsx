import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useCreateProject, useUpdateProjectStatus, useDeleteProject, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../../hooks';
import { useSignalRStore } from '../../store';
import { FolderKanban, Plus, X, Trash2, User, Clock, ChevronRight } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const TASK_COLS = [
    { id: 'todo', label: 'To Do', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    { id: 'in-progress', label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    { id: 'review', label: 'Review', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    { id: 'done', label: 'Done', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
];

const PROJECT_STATUS = ['active', 'on-hold', 'completed', 'cancelled'];
const PRIORITY_COLOR = { low: 'text-green-500', medium: 'text-yellow-500', high: 'text-orange-500', critical: 'text-red-500' };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtMoney = (n) => n ? `$${Number(n).toLocaleString()}` : '$0';

const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#14b8a6'];

// ── Create Project Modal ──────────────────────────────────────────────────────
const CreateProjectModal = ({ onClose, onCreate }) => {
    const [form, setForm] = useState({ name: '', description: '', clientName: '', priority: 'medium', budget: '', color: PALETTE[0], dueDate: '' });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.name) return;
        setSaving(true);
        await onCreate({ ...form, budget: parseFloat(form.budget) || 0, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">New Project</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Project Name *</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Website Redesign"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Client</label>
                            <input value={form.clientName} onChange={e => set('clientName', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Priority</label>
                            <select value={form.priority} onChange={e => set('priority', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Budget</label>
                            <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Due Date</label>
                            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-2">Color</label>
                        <div className="flex gap-2">
                            {PALETTE.map(c => (
                                <button key={c} onClick={() => set('color', c)}
                                    style={{ backgroundColor: c }}
                                    className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={save} disabled={saving || !form.name}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Add Task Modal ────────────────────────────────────────────────────────────
const AddTaskModal = ({ project, onClose, onAdd }) => {
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedToName: '', estimatedHours: '', dueDate: '' });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.title) return;
        setSaving(true);
        await onAdd({ projectId: project.id, ...form, estimatedHours: parseInt(form.estimatedHours) || null, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-5 border-b flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400">{project.name}</p>
                        <h2 className="text-xl font-bold">New Task</h2>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Task Title *</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
                            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Assignee</label>
                            <input value={form.assignedToName} onChange={e => set('assignedToName', e.target.value)}
                                placeholder="Name" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Est. Hours</label>
                            <input type="number" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={save} disabled={saving || !form.title}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                        {saving ? 'Adding...' : 'Add Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Kanban Board for a Project ────────────────────────────────────────────────
const ProjectKanban = ({ project, onUpdateTaskStatus, onDeleteTask, onAddTask }) => {
    const [showAddTask, setShowAddTask] = useState(false);

    return (
        <div className="space-y-3">
            {showAddTask && (
                <AddTaskModal project={project} onClose={() => setShowAddTask(false)} onAdd={onAddTask} />
            )}
            <div className="flex justify-end">
                <button onClick={() => setShowAddTask(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                    <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {TASK_COLS.map(col => {
                    const colTasks = (project.tasks || []).filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className="flex-shrink-0 w-60 space-y-2">
                            <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${col.bg} ${col.border}`}>
                                <span className={`text-xs font-semibold ${col.text}`}>{col.label}</span>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white ${col.text}`}>{colTasks.length}</span>
                            </div>
                            <div className="space-y-2 min-h-[60px]">
                                {colTasks.map(task => (
                                    <div key={task.id} className="bg-white border rounded-xl p-3 shadow-sm space-y-2 group">
                                        <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
                                        {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            {task.assignedToName && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{task.assignedToName}</span>}
                                            {task.estimatedHours && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{task.estimatedHours}h</span>}
                                        </div>
                                        <div className="flex gap-1 flex-wrap">
                                            {TASK_COLS.filter(c => c.id !== task.status).map(c => (
                                                <button key={c.id} onClick={() => onUpdateTaskStatus({ projectId: project.id, taskId: task.id, status: c.id })}
                                                    className={`px-2 py-0.5 rounded text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
                                                    → {c.label}
                                                </button>
                                            ))}
                                            <button onClick={() => { if (window.confirm('Delete task?')) onDeleteTask({ projectId: project.id, taskId: task.id }); }}
                                                className="ml-auto text-gray-200 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                                {colTasks.length === 0 && (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center text-xs text-gray-400">Empty</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const queryClient = useQueryClient();
    const connection = useSignalRStore(s => s.connection);

    const { data: projects = [], isLoading } = useProjects();
    const createProject = useCreateProject();
    const updateProjectStatus = useUpdateProjectStatus();
    const deleteProject = useDeleteProject();
    const createTask = useCreateTask();
    const updateTaskStatus = useUpdateTaskStatus();
    const deleteTask = useDeleteTask();

    useEffect(() => {
        if (!connection) return;
        const refresh = () => queryClient.invalidateQueries({ queryKey: ['projects'] });
        connection.on('ProjectUpdated', refresh);
        connection.on('ProjectDeleted', refresh);
        connection.on('TaskUpdated', refresh);
        return () => {
            connection.off('ProjectUpdated', refresh);
            connection.off('ProjectDeleted', refresh);
            connection.off('TaskUpdated', refresh);
        };
    }, [connection, queryClient]);

    const filtered = statusFilter === 'all' ? projects : projects.filter(p => p.status === statusFilter);

    return (
        <div className="p-6 space-y-5">
            {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={(d) => createProject.mutateAsync(d)} />}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderKanban className="w-6 h-6 text-indigo-600" /> Projects
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{projects.length} projects · live via SignalR</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {/* Status filter */}
            <div className="flex gap-2 flex-wrap">
                {['all', ...PROJECT_STATUS].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Project list */}
            {isLoading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No projects found</p>
                    <button onClick={() => setShowCreate(true)} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Create Project</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(p => {
                        const totalTasks = p.tasks?.length || 0;
                        const doneTasks = p.tasks?.filter(t => t.status === 'done').length || 0;
                        const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                        const isOpen = expandedId === p.id;

                        return (
                            <div key={p.id} className="bg-white border rounded-2xl overflow-hidden">
                                {/* Project header row */}
                                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(isOpen ? null : p.id)}>
                                    {/* Color swatch */}
                                    <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                                            <span className={`text-xs font-semibold ${PRIORITY_COLOR[p.priority] || ''}`}>{p.priority}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{p.clientName || 'Internal'} · Due {fmtDate(p.dueDate)} · Budget {fmtMoney(p.budget)}</p>
                                        {/* Progress bar */}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color || '#6366f1' }} />
                                            </div>
                                            <span className="text-xs text-gray-400">{doneTasks}/{totalTasks} tasks · {pct}%</span>
                                        </div>
                                    </div>
                                    {/* Status badges */}
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                                                p.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                    p.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                                        {/* Status actions */}
                                        <select onClick={e => e.stopPropagation()} onChange={e => updateProjectStatus.mutate({ id: p.id, status: e.target.value })}
                                            value=""
                                            className="text-xs border rounded-lg px-1 py-1 text-gray-500 cursor-pointer">
                                            <option value="" disabled>Move to…</option>
                                            {PROJECT_STATUS.filter(s => s !== p.status).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete project?')) deleteProject.mutate(p.id); }}
                                            className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                                        {isOpen ? <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded Kanban */}
                                {isOpen && (
                                    <div className="border-t p-4 bg-gray-50">
                                        <ProjectKanban
                                            project={p}
                                            onUpdateTaskStatus={(d) => updateTaskStatus.mutate(d)}
                                            onDeleteTask={(d) => deleteTask.mutate(d)}
                                            onAddTask={(d) => createTask.mutateAsync(d)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProjectsPage;
