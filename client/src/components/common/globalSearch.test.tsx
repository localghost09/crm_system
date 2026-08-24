import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GlobalSearch from './GlobalSearch';

const LEAD = { _id: 'l1', name: 'Acme Corporation', company: 'Acme Corp', email: 'a@acme.com' };
const CUSTOMER = { _id: 'c1', name: 'Alpha Industries', company: 'Alpha', email: 'x@alpha.com' };
const OPP = { _id: 'o1', title: 'Acme Platform Rollout', stage: 'Won' };
const TASK = { _id: 't1', title: 'Call Acme', status: 'Pending' };
const USER = { _id: 'u1', name: 'Alice Admin', email: 'admin@crm.com', role: 'admin' };

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../../services/api', () => ({
  default: apiMock,
}));

function mockResults(overrides: Partial<Record<string, any[]>> = {}) {
  apiMock.get.mockImplementation(async (path: string) => {
    const p = path.split('?')[0];
    const data =
      p === '/leads' ? [LEAD] :
      p === '/customers' ? [CUSTOMER] :
      p === '/opportunities' ? [OPP] :
      p === '/tasks' ? [TASK] :
      p === '/users' ? [USER] :
      [];
    return { data: { data: overrides[p] !== undefined ? overrides[p] : data } };
  });
}

function renderSearch() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const typeChar = async (value: string) => {
  const input = screen.getByRole('combobox', { name: /global search/i });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('GlobalSearch', () => {
  it('does not crash when typing a single character and shows grouped results (regression: isPending of undefined)', async () => {
    mockResults();
    renderSearch();

    // The crash happened exactly here: 1 char typed, debounce fires,
    // queries enabled but data still undefined while computing isPending.
    await typeChar('a');

    await waitFor(() => expect(screen.getByText('Acme Corporation')).toBeTruthy(), { timeout: 3000 });
    expect(screen.getByText('Alpha Industries')).toBeTruthy();
    expect(screen.getByText('Acme Platform Rollout')).toBeTruthy();
    expect(screen.getByText('Call Acme')).toBeTruthy();
    expect(screen.getByText('Alice Admin')).toBeTruthy();
    // Group headers
    expect(screen.getByText('Leads')).toBeTruthy();
    expect(screen.getByText('Team')).toBeTruthy();
    // 5 API calls fired (one per collection)
    expect(apiMock.get).toHaveBeenCalledTimes(5);
  });

  it('shows a no-results message when nothing matches', async () => {
    apiMock.get.mockResolvedValue({ data: { data: [] } });
    renderSearch();
    await typeChar('zzzz');
    await waitFor(() => expect(screen.getByText(/No results for/)).toBeTruthy(), { timeout: 3000 });
    expect(screen.getByText('Try a name, company or deal title')).toBeTruthy();
  });

  it('shows an error message with retry when the API fails', async () => {
    apiMock.get.mockRejectedValue(new Error('network down'));
    renderSearch();
    await typeChar('acme');
    await waitFor(() => expect(screen.getByText("Couldn't load search results")).toBeTruthy(), { timeout: 3000 });
    expect(screen.getByText(/Check your connection, then try again/)).toBeTruthy();
    expect(screen.getByText('Retry search')).toBeTruthy();
  });
});
