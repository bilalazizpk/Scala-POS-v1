import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWhatsAppConversations, useWhatsAppHistory, useSendWhatsApp } from '../../hooks';
import { MessageCircle, Send, Check, CheckCheck, Clock, User, Phone, ImageIcon, Search } from 'lucide-react';

const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso) => {
    const d = new Date(iso);
    if (d.toDateString() === new Date().toDateString()) return formatTime(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ── Status Icon ───────────────────────────────────────────────────────────────
const StatusIcon = ({ status, className = "" }) => {
    if (status === 'sent') return <Check className={`w-4 h-4 text-gray-400 ${className}`} />;
    if (status === 'delivered') return <CheckCheck className={`w-4 h-4 text-gray-400 ${className}`} />;
    if (status === 'read') return <CheckCheck className={`w-4 h-4 text-blue-500 ${className}`} />;
    if (status === 'failed') return <span className={`text-red-500 text-xs font-bold ${className}`}>!</span>;
    return <Clock className={`w-3.5 h-3.5 text-gray-300 ${className}`} />; // pending
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const WhatsAppPage = () => {
    const qc = useQueryClient();
    const { data: convos = [], isLoading: loadingConvos } = useWhatsAppConversations();
    const [selectedPhone, setSelectedPhone] = useState(null);
    const [msgText, setMsgText] = useState('');
    const chatEndRef = useRef(null);
    const [search, setSearch] = useState('');

    const activeConvo = convos.find(c => c.customerPhone === selectedPhone);
    const activeName = activeConvo?.customerName !== "Unknown" ? activeConvo?.customerName : selectedPhone;

    const { data: history = [], isLoading: loadingHistory } = useWhatsAppHistory(selectedPhone);
    const sendMsg = useSendWhatsApp();

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Handle incoming SignalR WhatsApp events (we assume App.jsx provides the global connection, 
    // but here we just listen on the window or custom event if we wired it that way. 
    // For simplicity, we'll auto-poll the history & convos every 5s instead of full SignalR wiring here,
    // though the backend *did* broadcast them, we use standard polling as a robust fallback for the UI).
    useEffect(() => {
        const i = setInterval(() => {
            qc.invalidateQueries({ queryKey: ['wa-conversations'] });
            if (selectedPhone) qc.invalidateQueries({ queryKey: ['wa-history', selectedPhone] });
        }, 3000);
        return () => clearInterval(i);
    }, [qc, selectedPhone]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!msgText.trim() || !selectedPhone) return;

        const payload = {
            phone: selectedPhone,
            name: activeName,
            message: msgText.trim()
        };

        setMsgText('');
        await sendMsg.mutateAsync(payload);
    };

    const filteredConvos = convos.filter(c =>
        c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        c.customerPhone.includes(search)
    );

    return (
        <div className="flex h-[calc(100vh-64px)] -m-6 bg-gray-50">
            {/* Sidebar (Conversations List) */}
            <div className="w-80 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <MessageCircle className="w-6 h-6 text-green-500 fill-green-500" /> WhatsApp
                    </h2>
                    <div className="mt-4 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search chats..." className="w-full pl-9 pr-3 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg text-sm transition" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConvos ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : filteredConvos.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500 mt-10">
                            No conversations found.
                        </div>
                    ) : (
                        filteredConvos.map(c => (
                            <div key={c.customerPhone} onClick={() => setSelectedPhone(c.customerPhone)}
                                className={`flex gap-3 p-4 cursor-pointer border-b hover:bg-gray-50 transition ${selectedPhone === c.customerPhone ? 'bg-green-50/50 relative' : ''}`}>
                                {selectedPhone === c.customerPhone && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}

                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">
                                            {c.customerName !== "Unknown" ? c.customerName : c.customerPhone}
                                        </h3>
                                        <span className="text-xs text-gray-400 shrink-0">{formatDate(c.timestamp)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                                        {c.direction === 'outbound' && <StatusIcon status={c.status} className="w-3.5 h-3.5" />}
                                        <span className="truncate">{c.body}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Pane */}
            <div className="flex-1 flex flex-col bg-[#efeae2] bg-wa-pattern">
                {selectedPhone ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 bg-gray-100 border-b px-6 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">{activeName}</h2>
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedPhone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingHistory ? (
                                <div className="flex justify-center p-4">
                                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent flex rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                history.map((msg, idx) => {
                                    const isOut = msg.direction === 'outbound';
                                    const showTail = idx === 0 || history[idx - 1].direction !== msg.direction;

                                    return (
                                        <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`relative max-w-[75%] px-3 py-2 text-sm shadow-sm rounded-lg ${isOut ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                                                }`}>
                                                {/* Tail pointer logic could go here; omitting for simplicity */}

                                                {msg.body.includes('📷') ? (
                                                    <div className="flex items-center gap-2 text-gray-600 italic">
                                                        <ImageIcon className="w-4 h-4" /> {msg.body}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-900 whitespace-pre-wrap">{msg.body}</p>
                                                )}

                                                <div className="flex items-center justify-end gap-1 mt-1 -mb-1">
                                                    <span className="text-[10px] text-gray-500 leading-none">{formatTime(msg.timestamp)}</span>
                                                    {isOut && <StatusIcon status={msg.status} className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-gray-100 p-4 shrink-0">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    type="text"
                                    value={msgText}
                                    onChange={e => setMsgText(e.target.value)}
                                    placeholder="Type a message"
                                    className="flex-1 bg-white border-transparent focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-xl px-4 py-3 text-sm shadow-sm transition"
                                    disabled={sendMsg.isPending}
                                />
                                <button
                                    type="submit"
                                    disabled={!msgText.trim() || sendMsg.isPending}
                                    className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition disabled:opacity-50 disabled:hover:bg-green-500 shrink-0 shadow-sm">
                                    <Send className="w-5 h-5 ml-1" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-light text-gray-600 mb-2">WhatsApp for POS</h2>
                        <p className="text-sm">Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppPage;
