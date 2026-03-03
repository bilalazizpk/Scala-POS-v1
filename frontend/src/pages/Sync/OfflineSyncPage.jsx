import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineSyncService } from '../../services/api';
import { useSyncStore } from '../../store/useSyncStore';
import { Wifi, WifiOff, CloudOff, CloudCog, RefreshCcw, Activity, Server, Trash2, ShieldAlert } from 'lucide-react';

const OfflineSyncPage = () => {
    const { isOnline, syncQueue, lastSyncTimestamp, deviceId, pushSync, clearQueue } = useSyncStore();
    const [syncing, setSyncing] = useState(false);

    // Fetch server logs for admin view
    const { data: serverLogs = [], isLoading, refetch } = useQuery({
        queryKey: ['sync-admin-logs'],
        queryFn: async () => (await offlineSyncService.getAdminLogs(50)).data,
        refetchInterval: 10000 // Poll every 10s
    });

    const handleManualSync = async () => {
        setSyncing(true);
        await pushSync();
        await refetch();
        setSyncing(false);
    };

    const statusColor = isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200';
    const StatusIcon = isOnline ? Wifi : WifiOff;

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CloudCog className="w-6 h-6 text-indigo-600" /> Offline Sync
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Managing Local-First Mutations</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleManualSync} disabled={!isOnline || syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                        <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sync Now
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Device Status */}
                <div className="bg-white border rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800">Connection</h3>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Local Device ID</p>
                        <p className="text-sm font-mono text-gray-800 truncate" title={deviceId}>{deviceId}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Server Sync</p>
                        <p className="text-sm font-medium text-gray-800">
                            {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Never'}
                        </p>
                    </div>
                </div>

                {/* Local Queue */}
                <div className="bg-white border rounded-2xl p-5 md:col-span-2 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <CloudOff className="w-5 h-5 text-gray-400" /> Local Mutation Queue
                        </h3>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">
                            {syncQueue.length} Pending
                        </span>
                    </div>

                    {syncQueue.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Activity className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">All changes have been synced to the server.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 overflow-y-auto max-h-[150px] pr-2">
                            {syncQueue.map((mut, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50 text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${mut.operation === 'create' ? 'bg-green-100 text-green-700' :
                                                mut.operation === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>{mut.operation}</span>
                                        <span className="font-bold">{mut.entityType}</span>
                                        <span className="text-gray-500">#{mut.entityId}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(mut.clientTimestamp).toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {syncQueue.length > 0 && (
                        <div className="mt-4 pt-3 border-t flex justify-end">
                            <button onClick={() => { if (window.confirm('Clear local queue? Changes will be lost.')) clearQueue() }}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Force clear queue
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Server Admin Logs */}
            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2 bg-gray-50">
                    <Server className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-gray-800">Server Sync Log</h3>
                </div>
                {isLoading ? (
                    <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
                ) : serverLogs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-sm">No sync logs on the server yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white border-b text-xs text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Device Name</th>
                                    <th className="px-4 py-3">Operation</th>
                                    <th className="px-4 py-3">Entity</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-600">
                                {serverLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs">{new Date(log.serverTimestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs font-mono">{log.deviceName} <span className="text-gray-400">({log.deviceId.substring(0, 6)})</span></td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium uppercase">{log.operation}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{log.entityType} <span className="text-gray-400 font-normal">#{log.entityId}</span></td>
                                        <td className="px-4 py-3">
                                            {log.status === 'applied' ? (
                                                <span className="text-green-600 font-medium text-xs">Applied</span>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600 font-medium text-xs cursor-help" title={log.conflictNote}>
                                                    <ShieldAlert className="w-3.5 h-3.5" /> Conflict
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfflineSyncPage;
