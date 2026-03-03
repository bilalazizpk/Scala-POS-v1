import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/api';

export const useProjects = () => useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await projectService.getAll()).data,
});

export const useCreateProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => projectService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useUpdateProjectStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => projectService.updateStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useDeleteProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => projectService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useCreateTask = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, ...data }) => projectService.createTask(projectId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useUpdateTaskStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, status }) => projectService.updateTaskStatus(projectId, taskId, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useDeleteTask = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId }) => projectService.deleteTask(projectId, taskId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};
