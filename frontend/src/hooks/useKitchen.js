import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../services/api';

export const useKitchenOrders = (station) => {
    return useQuery({
        queryKey: ['kitchenOrders', station],
        queryFn: async () => {
            const { data } = await kitchenService.getOrders(station);
            return data;
        },
        refetchInterval: 15000 // Fallback polling
    });
};

export const useUpdateItemStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, status }) => kitchenService.updateItemStatus(itemId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
        }
    });
};
