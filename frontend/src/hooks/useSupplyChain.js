import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplyChainService } from '../services/api';

export const useSuppliers = () => useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await supplyChainService.getSuppliers()).data,
});

export const useCreateSupplier = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => supplyChainService.createSupplier(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
    });
};

export const useDeleteSupplier = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => supplyChainService.deleteSupplier(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
    });
};

export const usePurchaseOrders = (params) => useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: async () => (await supplyChainService.getPOs(params)).data,
});

export const useCreatePO = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => supplyChainService.createPO(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
    });
};

export const useUpdatePOStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => supplyChainService.updatePOStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
    });
};
