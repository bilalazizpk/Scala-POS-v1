import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/api';

export const useDocuments = (params) => useQuery({
    queryKey: ['documents', params],
    queryFn: async () => (await documentService.getAll(params)).data,
});

export const useUploadDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData) => documentService.upload(formData),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
    });
};

export const useArchiveDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => documentService.archive(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
    });
};

export const useDeleteDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => documentService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
    });
};
