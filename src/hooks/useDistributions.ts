import { useCallback, useEffect, useRef, useState } from 'react';
import { RetailerAPI } from '@/lib/api';

interface BasePagination { page: number; pages: number; total: number; limit: number }
interface DistributionRow {
  id: number;
  shop?: { name?: string } | null;
  retailerProduct?: { product?: { name?: string } | null } | null;
  quantity?: number;
  totalAmount?: number;
  deliveryStatus?: string;
  paymentStatus?: string;
}

interface UseDistributionsParams {
  shopId?: number;
  initialPage?: number;
  limit?: number;
  filters?: { deliveryStatus?: string; paymentStatus?: string };
  auto?: boolean; // auto fetch on mount
}

export function useDistributions({ shopId, initialPage = 1, limit = 20, filters = {}, auto = true }: UseDistributionsParams) {
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<{ distributions: DistributionRow[]; pagination?: BasePagination | null }>({ distributions: [], pagination: null });

  const fetcher = useCallback(async (p = page, opts?: { overrideFilters?: Partial<UseDistributionsParams['filters']> }) => {
    try {
      setLoading(true);
      const params: any = { page: p, limit, ...filters, ...(opts?.overrideFilters || {}) };
      let res;
      if (shopId) res = await RetailerAPI.distributions.getByShop(shopId, params);
      else res = await RetailerAPI.distributions.getAll(params);
      setData(res as any);
      setPage(p);
      setError(null);
    } catch (e) {
      const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : undefined;
      setError(message || 'Failed to load distributions');
    } finally {
      setLoading(false);
    }
  }, [shopId, page, limit, filters]);

  const fetchRef = useRef(fetcher);
  useEffect(() => { fetchRef.current = fetcher; }, [fetcher]);
  useEffect(() => { if (auto) fetchRef.current(initialPage); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  return {
    loading,
    error,
    page,
    data,
    refetch: fetcher,
    setPage: (p: number) => fetcher(p),
    setFilters: (newFilters: UseDistributionsParams['filters']) => {
      (filters as any) = newFilters; // note: lightweight, could be improved with state if dynamic changes needed
      fetcher(1);
    }
  };
}
