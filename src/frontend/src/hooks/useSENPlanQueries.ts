import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SENPlan } from "../backend";
import { useActor } from "./useActor";

export function useGetSENPlan(studentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<SENPlan | null>({
    queryKey: ["senPlan", studentId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSENPlan(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useUpdateSENPlan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { studentId: string; senPlan: SENPlan }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSENPlan(params.studentId, params.senPlan);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({
        queryKey: ["senPlan", variables.studentId],
      });
      toast.success("Support plan saved");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save support plan: ${error.message}`);
    },
  });
}
