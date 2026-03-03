import { useQuery } from '@tanstack/react-query';
import { accountingService } from '../services/api';

export const useChartOfAccounts = () => {
    return useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await accountingService.getAccounts();
            return response.data;
        },
        staleTime: 60000,
    });
};

export const useGeneralLedger = () => {
    return useQuery({
        queryKey: ['ledger'],
        queryFn: async () => {
            const response = await accountingService.getLedger();
            return response.data;
        },
        staleTime: 5000, // Frequent updates since it's the live ledger
    });
};

export const useProfitAndLoss = () => {
    return useQuery({
        queryKey: ['pnl'],
        queryFn: async () => {
            const response = await accountingService.getPnl();
            return response.data;
        },
        staleTime: 30000,
    });
};
