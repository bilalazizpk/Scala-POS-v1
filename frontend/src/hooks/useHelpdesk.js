import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpdeskService } from '../services/api';

export const useTickets = (params) => useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => (await helpdeskService.getAll(params)).data,
    staleTime: 5000,
});

export const useCreateTicket = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => helpdeskService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    });
};

export const useUpdateTicketStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => helpdeskService.updateStatus(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    });
};

export const useAddTicketComment = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => helpdeskService.addComment(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    });
};

export const useDeleteTicket = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => helpdeskService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
    });
};
