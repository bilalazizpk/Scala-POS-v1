import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/api';

export const useAppointments = (date) => {
    return useQuery({
        queryKey: ['appointments', date],
        queryFn: async () => {
            const response = await appointmentService.getAll(date);
            return response.data;
        },
        staleTime: 5000,
    });
};

export const useCreateAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => appointmentService.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    });
};

export const useUpdateAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => appointmentService.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    });
};

export const useUpdateAppointmentStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => appointmentService.updateStatus(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    });
};

export const useDeleteAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => appointmentService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    });
};
