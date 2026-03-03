import React, { useState, useRef } from 'react';
import { useDocuments, useUploadDocument, useArchiveDocument, useDeleteDocument } from '../../hooks';
import { documentService } from '../../services/api';
import { FileText, Upload, Download, Archive, Trash2, X, Search, Filter, File, FileImage, FileSpreadsheet, FileCode } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = ['contract', 'invoice', 'policy', 'receipt', 'other'];

const MIME_ICON = (ct = '') => {
    if (ct.startsWith('image/')) return <FileImage className="w-8 h-8 text-pink-400" />;
    if (ct.includes('spreadsheet') || ct.includes('excel') || ct.includes('csv')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    if (ct.includes('code') || ct.includes('json') || ct.includes('xml')) return <FileCode className="w-8 h-8 text-blue-400" />;
    if (ct.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-400" />;
};

const CAT_COLOR = {
    contract: 'bg-indigo-100 text-indigo-700',
    invoice: 'bg-green-100 text-green-700',
    policy: 'bg-yellow-100 text-yellow-700',
    receipt: 'bg-blue-100 text-blue-700',
    other: 'bg-gray-100 text-gray-600',
};

const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Upload Modal ──────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onUpload }) => {
    const fileRef = useRef();
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState('other');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [uploaderName, setUploaderName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', category);
        fd.append('description', description);
        fd.append('tags', tags);
        fd.append('uploadedByName', uploaderName);
        await onUpload(fd);
        setUploading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Upload Document</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-5 space-y-4">
                    {/* Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}>
                        <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        {file ? (
                            <p className="text-sm font-semibold text-indigo-700">{file.name} ({fmtSize(file.size)})</p>
                        ) : (
                            <p className="text-sm text-gray-500">Drag & drop or <span className="text-indigo-600 font-medium">browse</span></p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Uploaded By</label>
                            <input value={uploaderName} onChange={e => setUploaderName(e.target.value)}
                                placeholder="Your name" className="w-full border rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                        <input value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Tags (comma-separated)</label>
                        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. 2024, q1, supplier"
                            className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>
                <div className="p-5 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-medium">Cancel</button>
                    <button onClick={upload} disabled={uploading || !file}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Document Card ─────────────────────────────────────────────────────────────
const DocCard = ({ doc, onDownload, onArchive, onDelete }) => (
    <div className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition ${doc.status === 'archived' ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between">
            {MIME_ICON(doc.contentType)}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CAT_COLOR[doc.category] || CAT_COLOR.other}`}>{doc.category}</span>
        </div>
        <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{doc.fileName}</p>
            {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.description}</p>}
            {doc.tags && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {doc.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>
                    ))}
                </div>
            )}
        </div>
        <div className="text-xs text-gray-400 flex justify-between">
            <span>{fmtSize(doc.fileSize)}</span>
            <span>{fmtDate(doc.createdAt)}</span>
        </div>
        <div className="flex gap-1 border-t pt-2">
            <button onClick={() => onDownload(doc)}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                <Download className="w-3.5 h-3.5" /> Download
            </button>
            {doc.status !== 'archived' && (
                <button onClick={() => onArchive(doc.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition">
                    <Archive className="w-3.5 h-3.5" /> Archive
                </button>
            )}
            <button onClick={() => { if (window.confirm('Delete document?')) onDelete(doc.id); }}
                className="p-1 text-gray-300 hover:text-red-500 rounded-lg transition">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const DocumentsPage = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');

    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    if (searchTerm) params.search = searchTerm;

    const { data: documents = [], isLoading } = useDocuments(params);
    const uploadDoc = useUploadDocument();
    const archiveDoc = useArchiveDocument();
    const deleteDoc = useDeleteDocument();

    const handleDownload = async (doc) => {
        const res = await documentService.download(doc.id);
        const url = URL.createObjectURL(new Blob([res.data], { type: doc.contentType }));
        const a = Object.assign(document.createElement('a'), { href: url, download: doc.fileName });
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalSize = documents.reduce((s, d) => s + (d.fileSize || 0), 0);

    return (
        <div className="p-6 space-y-5">
            {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={(fd) => uploadDoc.mutateAsync(fd)} />}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" /> Documents
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{documents.length} files · {fmtSize(totalSize)} total</p>
                </div>
                <button onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    <Upload className="w-4 h-4" /> Upload
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name, tag…"
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                {/* Category */}
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm text-gray-600">
                    <option value="">All categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                {/* Status */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
                    {[['active', 'Active'], ['archived', 'Archived'], ['', 'All']].map(([v, l]) => (
                        <button key={v} onClick={() => setStatusFilter(v)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition ${statusFilter === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{l}</button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-3">No documents found</p>
                    <button onClick={() => setShowUpload(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                        Upload First Document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {documents.map(doc => (
                        <DocCard key={doc.id} doc={doc}
                            onDownload={handleDownload}
                            onArchive={(id) => archiveDoc.mutate(id)}
                            onDelete={(id) => deleteDoc.mutate(id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
