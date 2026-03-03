import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/api';

export const useAIDraftResponse = () => {
    return useMutation({
        mutationFn: (payload) => aiService.draftHelpdeskResponse(payload),
    });
};

export const useAIAnalyticsInsights = () => {
    return useMutation({
        mutationFn: (payload) => aiService.askAnalytics(payload),
    });
};
