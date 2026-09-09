import { candidates as demoCandidates, experiences, matches, pipelineEvents, projects as demoProjects, tags } from "./demo-data";
import type { Candidate, Experience, Match, PipelineEvent, Project } from "./types";
import type { ParsedResume } from "./ai/schemas/resume";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isDemoMode = !url || !key;

async function fromSupabase<T>(path: string): Promise<T> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export type CandidateBundle = {
  candidate: Candidate;
  experiences: Experience[];
  tags: Array<{ id: string; tag: string; tag_type: string; confidence: number; evidence?: string | null; source?: string }>;
  matches: Array<Match & { project?: Project }>;
  pipeline: PipelineEvent[];
  latestImport?: { id: string; original_filename: string; storage_path: string; parser_version: string; raw_parsed_json?: ParsedResume | null; completed_at?: string | null };
};

export async function getCandidates(): Promise<Candidate[]> {
  if (isDemoMode) return demoCandidates;
  return fromSupabase<Candidate[]>("candidates?select=*&order=updated_at.desc");
}

export async function getCandidate(id: string): Promise<Candidate | undefined> {
  if (isDemoMode) return demoCandidates.find((item) => item.id === id);
  const rows = await fromSupabase<Candidate[]>(`candidates?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0];
}

export async function getCandidateBundle(id: string): Promise<CandidateBundle | undefined> {
  const candidate = await getCandidate(id);
  if (!candidate) return undefined;
  if (isDemoMode) return {
    candidate,
    experiences: experiences.filter((item) => item.candidate_id === id),
    tags: tags.filter((item) => item.candidate_id === id),
    matches: matches.filter((item) => item.candidate_id === id).map((match) => ({ ...match, project: demoProjects.find((project) => project.id === match.project_id) })),
    pipeline: pipelineEvents.filter((item) => item.candidate_id === id),
  };
  const [candidateExperiences, candidateTags, candidateMatches, pipeline, imports] = await Promise.all([
    fromSupabase<Experience[]>(`candidate_experiences?candidate_id=eq.${id}&select=*&order=start_date.desc`),
    fromSupabase<CandidateBundle["tags"]>(`candidate_tags?candidate_id=eq.${id}&select=*&order=confidence.desc`),
    fromSupabase<CandidateBundle["matches"]>(`candidate_project_matches?candidate_id=eq.${id}&select=*,project:search_projects(*)&order=total_score.desc`),
    fromSupabase<PipelineEvent[]>(`pipeline_events?candidate_id=eq.${id}&select=*&order=event_date.desc`),
    fromSupabase<CandidateBundle["latestImport"][]>(`resume_imports?candidate_id=eq.${id}&status=eq.completed&select=id,original_filename,storage_path,parser_version,raw_parsed_json,completed_at&order=completed_at.desc&limit=1`),
  ]);
  return { candidate, experiences: candidateExperiences, tags: candidateTags, matches: candidateMatches, pipeline, latestImport: imports[0] };
}

export async function getProjects(): Promise<Project[]> {
  if (isDemoMode) return demoProjects;
  return fromSupabase<Project[]>("search_projects?select=*&order=updated_at.desc");
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (isDemoMode) return demoProjects.find((item) => item.id === id);
  const rows = await fromSupabase<Project[]>(`search_projects?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0];
}

export async function getProjectMatches(id: string) {
  if (isDemoMode) return matches.filter((item) => item.project_id === id).map((match) => ({ ...match, candidate: demoCandidates.find((candidate) => candidate.id === match.candidate_id) }));
  return fromSupabase<Array<Match & { candidate?: Candidate }>>(`candidate_project_matches?project_id=eq.${id}&select=*,candidate:candidates(*)&order=total_score.desc`);
}
