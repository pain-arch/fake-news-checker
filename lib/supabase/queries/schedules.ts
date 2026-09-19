import "server-only";

import { requireSupabaseServerClient } from "../server";
import type {
  OxylabsSchedule, OxylabsScheduleRun, ScheduleRunWrite, ScheduleWrite,
} from "../types";

const exactIntegerId = /^[0-9]+$/;

function requireExactId(id: string): void {
  if (!exactIntegerId.test(id)) throw new Error("Oxylabs ID must be an exact decimal string");
}

export async function getSchedules(): Promise<OxylabsSchedule[]> {
  const { data, error } = await requireSupabaseServerClient()
    .from("oxylabs_schedules").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Schedule read failed (${error.code})`);
  return (data ?? []) as OxylabsSchedule[];
}

export async function upsertSchedule(input: ScheduleWrite): Promise<OxylabsSchedule> {
  requireExactId(input.oxylabs_schedule_id);
  const { data, error } = await requireSupabaseServerClient()
    .from("oxylabs_schedules")
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: "source_id" })
    .select("*").single();
  if (error || !data) throw new Error(`Schedule save failed (${error?.code ?? "no row"})`);
  return data as OxylabsSchedule;
}

export async function getScheduleRuns(scheduleId: string, limit = 50): Promise<OxylabsScheduleRun[]> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
    throw new Error("Run limit must be between 1 and 200");
  }
  const { data, error } = await requireSupabaseServerClient()
    .from("oxylabs_schedule_runs").select("*")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Schedule run read failed (${error.code})`);
  return (data ?? []) as OxylabsScheduleRun[];
}

export async function upsertScheduleRun(input: ScheduleRunWrite): Promise<OxylabsScheduleRun> {
  requireExactId(input.oxylabs_job_id);
  const { data, error } = await requireSupabaseServerClient()
    .from("oxylabs_schedule_runs")
    .upsert(input, { onConflict: "schedule_id,oxylabs_job_id" })
    .select("*").single();
  if (error || !data) throw new Error(`Schedule run save failed (${error?.code ?? "no row"})`);
  return data as OxylabsScheduleRun;
}
