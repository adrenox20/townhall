import type { Context } from 'hono';
import type { Env, Variables } from '../env';
import { locationBoost, normalizeText, overlap, tokens } from '../utils/text';

type SimilarInput = { title: string; description: string; categoryId?: string; departmentId?: string; tags?: string[] };

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;
type Candidate = {
  id: string;
  title?: string;
  description?: string;
  category_id?: string;
  department_id?: string;
  created_at?: string;
  [key: string]: unknown;
};
type ScoredCandidate = Candidate & { score: number; recommendation: string };

export async function findSimilarIssues(c: AppContext, input: SimilarInput) {
  const query = normalizeText(`${input.title} ${input.description}`).split(' ').slice(0, 8).join(' OR ') || input.title;
  const rows = await c.env.DB.prepare(
    `SELECT i.*, c.name category, d.name department
     FROM issues i
     LEFT JOIN categories c ON c.id = i.category_id
     LEFT JOIN departments d ON d.id = i.department_id
     WHERE i.is_deleted = 0 AND i.is_archived = 0
     ORDER BY i.created_at DESC LIMIT 50`
  ).all<Candidate>();
  const titleTokens = tokens(input.title);
  const descriptionTokens = tokens(input.description);
  const weighted: ScoredCandidate[] = rows.results.map((issue) => {
    const titleScore = overlap(titleTokens, tokens(issue.title || '')) * 0.35;
    const descriptionScore = overlap(descriptionTokens, tokens(issue.description || '')) * 0.2;
    const categoryScore = input.categoryId && input.categoryId === issue.category_id ? 0.15 : 0;
    const departmentScore = input.departmentId && input.departmentId === issue.department_id ? 0.15 : 0;
    const tagScore = 0;
    const recent = Date.now() - Date.parse(issue.created_at || '') < 1000 * 60 * 60 * 24 * 14 ? 0.025 : 0;
    const location = locationBoost(`${input.title} ${input.description}`) && locationBoost(`${issue.title} ${issue.description}`) ? 0.025 : 0;
    const score = titleScore + descriptionScore + categoryScore + departmentScore + tagScore + recent + location;
    return { ...issue, score, recommendation: score >= 0.78 ? 'likely_duplicate' : score >= 0.55 ? 'related' : 'none' };
  }).filter((issue) => issue.score >= Number(c.env.DUPLICATE_RELATED_THRESHOLD || 0.55));
  return weighted.sort((a, b) => b.score - a.score);
}
