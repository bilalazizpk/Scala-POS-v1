import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch all staff
export const useStaff = () => {
    return useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const response = await api.get('/staff');
            return response.data;
        },
    });
};

// Create staff member
export const useCreateStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (staffData) => {
            const response = await api.post('/staff', staffData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

// Update staff member
export const useUpdateStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...staffData }) => {
            const response = await api.put(`/staff/${id}`, { id, ...staffData });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

// Delete (soft) staff member
export const useDeleteStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/staff/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

// Fetch all categories
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });
};
