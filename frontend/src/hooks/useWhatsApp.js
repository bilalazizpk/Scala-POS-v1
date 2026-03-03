import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService } from '../services/api';

export const useWhatsAppConversations = () => {
    return useQuery({
        queryKey: ['wa-conversations'],
        queryFn: async () => (await whatsappService.getConversations()).data
    });
};

export const useWhatsAppHistory = (phone) => {
    return useQuery({
        queryKey: ['wa-history', phone],
        queryFn: async () => (await whatsappService.getChatHistory(phone)).data,
        enabled: !!phone
    });
};

export const useSendWhatsApp = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => whatsappService.sendMessage(payload),
        onSuccess: (_, variables) => {
            // Invalidate the specific chat we just sent to, plus the global list
            qc.invalidateQueries({ queryKey: ['wa-history', variables.phone] });
            qc.invalidateQueries({ queryKey: ['wa-conversations'] });
        }
    });
};
