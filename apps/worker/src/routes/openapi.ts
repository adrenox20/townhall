import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { ok } from '../utils/response';
export const openApiRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
openApiRoutes.get('/openapi.json', (c) => ok(c, { openapi: '3.1.0', info: { title: 'University Grievance Portal API', version: '1.0.0' } }));
openApiRoutes.get('/docs', (c) => c.html('<!doctype html><title>API Docs</title><main><h1>University Grievance Portal API</h1><p>OpenAPI is available at /api/v1/openapi.json and in the repository openapi.yaml.</p></main>'));
