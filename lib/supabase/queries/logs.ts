import "server-only";

import { requireSupabaseServerClient } from "../server";
import type { NewPipelineLog, PipelineLog } from "../types";

export async function writeLog(input: NewPipelineLog): Promise<PipelineLog> {
  if (!input.stage.trim() || !input.message.trim()) throw new Error("Log stage and message are required");
  const { data, error } = await requireSupabaseServerClient()
    .from("logs").insert(input).select("*").single();
  if (error || !data) throw new Error(`Log insert failed (${error?.code ?? "no row"})`);
  return data as PipelineLog;
}

export async function getRecentLogs(limit = 50): Promise<PipelineLog[]> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
    throw new Error("Log limit must be between 1 and 200");
  }
  const { data, error } = await requireSupabaseServerClient()
    .from("logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Log read failed (${error.code})`);
  return (data ?? []) as PipelineLog[];
}
