import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import type { Options } from '../types';

/** Dropdown data for portal forms, fetched once per page; call `reload()` after saving a master. */
export default function useOptions() {
  const [options, setOptions] = useState<Options | null>(null);
  const reload = useCallback(() => {
    api.get<Options>('/admin/options/').then((r) => setOptions(r.data)).catch(() => undefined);
  }, []);
  useEffect(reload, [reload]);
  return { options, reload };
}
