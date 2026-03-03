import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';

const useSignalRStore = create((set, get) => ({
    connection: null,
    isConnected: false,

    connect: async () => {
        if (get().connection) return; // Already connecting or connected

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/hubs/pos")
            .withAutomaticReconnect()
            .build();

        connection.onreconnecting(error => {
            console.log("SignalR Reconnecting...", error);
            set({ isConnected: false });
        });

        connection.onreconnected(connectionId => {
            console.log("SignalR Reconnected!", connectionId);
            set({ isConnected: true });
        });

        connection.onclose(error => {
            console.log("SignalR Closed", error);
            set({ isConnected: false });
        });

        try {
            await connection.start();
            console.log("SignalR Connected!");
            set({ connection, isConnected: true });
        } catch (e) {
            console.error("SignalR Connection Error: ", e);
            setTimeout(() => get().connect(), 5000); // Retry
        }
    },

    disconnect: async () => {
        const { connection } = get();
        if (connection) {
            await connection.stop();
            set({ connection: null, isConnected: false });
        }
    }
}));

export default useSignalRStore;
