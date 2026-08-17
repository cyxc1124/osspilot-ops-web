import { apiRequest } from './client';

export type AboutChannel = 'release' | 'develop' | 'main' | 'sha' | 'local' | 'unknown';
export type AboutCompareStatus = 'checking' | 'current' | 'update' | 'unknown';

export interface AboutComponent {
  id: string;
  name: string;
  repo: string;
  repo_url: string;
  running_version: string;
  git_tag: string | null;
  git_branch: string | null;
  git_commit: string | null;
  channel: AboutChannel | string;
  latest_release: string | null;
  latest_release_url: string | null;
  latest_commit: string | null;
  latest_commit_url: string | null;
  update_available: boolean | null;
  update_url: string | null;
  compare_status: AboutCompareStatus | string;
}

export interface AboutResponse {
  app_name: string;
  build_time: string | null;
  github_owner: string;
  components: AboutComponent[];
}

export function getAbout(token: string): Promise<AboutResponse> {
  return apiRequest<AboutResponse>('/api/about', { token });
}
