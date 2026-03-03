import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { offlineSyncService } from '../services/api';

const DEVICE_ID = localStorage.getItem('POS_DEVICE_ID') || crypto.randomUUID();
localStorage.setItem('POS_DEVICE_ID', DEVICE_ID);

export const useSyncStore = create(
    persist(
        (set, get) => ({
            deviceId: DEVICE_ID,
            isOnline: navigator.onLine,
            lastSyncTimestamp: null,
            syncQueue: [], // Array of mutations waiting to go to server
            seqCounter: 0,

            setOnlineStatus: (status) => set({ isOnline: status }),

            // Called by any frontend mutation (e.g. creating a customer)
            enqueueMutation: (operation, entityType, entityId, payload) => {
                const state = get();
                const log = {
                    deviceId: state.deviceId,
                    deviceName: `Terminal-${state.deviceId.substring(0, 4)}`,
                    clientSeq: state.seqCounter + 1,
                    operation,
                    entityType,
                    entityId: String(entityId),
                    payload: JSON.stringify(payload),
                    clientTimestamp: new Date().toISOString()
                };
                set({
                    syncQueue: [...state.syncQueue, log],
                    seqCounter: state.seqCounter + 1
                });

                // If online, immediately try to sync
                if (get().isOnline) {
                    get().pushSync();
                }
            },

            pushSync: async () => {
                const { syncQueue, isOnline } = get();
                if (!isOnline || syncQueue.length === 0) return;

                try {
                    // Push all pending
                    const res = await offlineSyncService.push(syncQueue);
                    const ackd = res.data.acknowledged || [];
                    // Remove ack'd sequences from queue
                    set({
                        syncQueue: get().syncQueue.filter(l => !ackd.includes(l.clientSeq)),
                        lastSyncTimestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.error("Sync push failed", err);
                }
            },

            clearQueue: () => set({ syncQueue: [], seqCounter: 0 })
        }),
        {
            name: 'pos-sync-storage',
            partialize: (state) => ({
                syncQueue: state.syncQueue,
                seqCounter: state.seqCounter,
                lastSyncTimestamp: state.lastSyncTimestamp
            }),
        }
    )
);

// Global event listener for network status
window.addEventListener('online', () => {
    useSyncStore.getState().setOnlineStatus(true);
    useSyncStore.getState().pushSync();
});
window.addEventListener('offline', () => {
    useSyncStore.getState().setOnlineStatus(false);
});
