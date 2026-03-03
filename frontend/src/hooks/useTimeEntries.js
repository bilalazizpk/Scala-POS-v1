import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'
});

export const useTimeEntries = (filters = {}) => {
    return useQuery({
        queryKey: ['timeEntries', filters],
        queryFn: async () => {
            const { data } = await api.get('/time-entries', { params: filters });
            return data;
        }
    });
};

export const useClockIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/time-entries/clock-in', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
        }
    });
};

export const useClockOut = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/time-entries/clock-out', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
        }
    });
};
