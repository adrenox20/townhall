import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property 4: API client error propagation
 *
 * **Validates: Requirements 6.4**
 *
 * For any non-2xx HTTP response from the Worker API, the api() function
 * SHALL throw an Error containing the error message from the response body.
 */

// We need to mock fetch globally before importing the api module
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocking fetch
import { api } from '@/lib/api';

/** Arbitrary for non-2xx HTTP status codes (4xx and 5xx) */
const nonOkStatusArb = fc.oneof(
  fc.integer({ min: 400, max: 499 }),
  fc.integer({ min: 500, max: 599 }),
);

/** Arbitrary for error messages (non-empty strings) */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0,
);

/** Arbitrary for API paths */
const apiPathArb = fc.constantFrom(
  '/issues',
  '/issues/123',
  '/auth/me',
  '/admin/dashboard',
  '/notifications',
  '/portal/users',
  '/issues/abc/comments',
  '/issues/xyz/solutions',
  '/issues/def/timeline',
  '/admin/kanban',
);

describe('Property 4: API client error propagation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('for any non-2xx status with an error message in the body, api() throws an Error containing that message', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonOkStatusArb,
        errorMessageArb,
        apiPathArb,
        async (status, errorMessage, path) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status,
            json: async () => ({ error: { message: errorMessage } }),
          });

          await expect(api(path)).rejects.toThrow(errorMessage);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('for any non-2xx status with no error message in the body, api() throws "Request failed"', async () => {
    await fc.assert(
      fc.asyncProperty(nonOkStatusArb, apiPathArb, async (status, path) => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          json: async () => ({}),
        });

        await expect(api(path)).rejects.toThrow('Request failed');
      }),
      { numRuns: 100 },
    );
  });

  it('for any non-2xx status where JSON parsing fails, api() throws "Request failed"', async () => {
    await fc.assert(
      fc.asyncProperty(nonOkStatusArb, apiPathArb, async (status, path) => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        await expect(api(path)).rejects.toThrow('Request failed');
      }),
      { numRuns: 100 },
    );
  });

  it('the thrown error is an instance of Error for any non-2xx response', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonOkStatusArb,
        errorMessageArb,
        apiPathArb,
        async (status, errorMessage, path) => {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status,
            json: async () => ({ error: { message: errorMessage } }),
          });

          try {
            await api(path);
            expect.fail('api() should have thrown');
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
            expect((err as Error).message).toBe(errorMessage);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
