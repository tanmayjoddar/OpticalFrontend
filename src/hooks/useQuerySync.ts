import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

export interface QuerySyncConfig<T extends Record<string, any>> {
  state: T;
  setState: (updater: (prev: T) => T) => void;
  keys: Array<keyof T>;
  replace?: boolean;
  onExternalChange?: (next: Partial<T>) => void; // called when URL (pop) changes and differs from state
}

// Generic two-way URL <-> state synchronizer for shallow stringifiable values
export function useQuerySync<T extends Record<string, any>>({ state, setState, keys, replace = true, onExternalChange }: QuerySyncConfig<T>) {
  const location = useLocation();
  const navigate = useNavigate();
  const lastPushedRef = useRef<string>('');
  const keysRef = useRef(keys);
  keysRef.current = keys;

  // Apply URL -> state on pop / initial
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next: any = {};
    keysRef.current.forEach(k => {
      const v = params.get(String(k));
      if (v != null && v !== '') next[k] = v;
    });
    const serializedNext = JSON.stringify(next);
    const currentRelevant: any = {};
    keysRef.current.forEach(k => { if (state[k] != null && state[k] !== '') currentRelevant[k] = state[k]; });
    if (location.search !== lastPushedRef.current && serializedNext !== JSON.stringify(currentRelevant)) {
      setState(prev => ({ ...prev, ...next }));
      onExternalChange?.(next);
    }
    if (!location.search && Object.keys(currentRelevant).length) {
      setState(prev => ({ ...prev, ...(keysRef.current.reduce((acc, k) => { acc[k] = undefined; return acc; }, {} as any)) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Push state -> URL
  useEffect(() => {
    const params = new URLSearchParams();
    keysRef.current.forEach(k => {
      const v = state[k];
      if (v != null && v !== '') params.set(String(k), String(v));
    });
    const next = params.toString();
    const newSearch = next ? `?${next}` : '';
    const desired = location.pathname + newSearch;
    const current = location.pathname + location.search;
    if (desired !== current) {
      lastPushedRef.current = newSearch;
      navigate(desired, { replace });
    } else if (!next) {
      lastPushedRef.current = '';
    }
  }, [state, navigate, location.pathname, location.search, replace]);
}
