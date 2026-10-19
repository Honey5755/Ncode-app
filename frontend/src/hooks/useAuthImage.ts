import { useEffect, useState } from 'react';
import api from '../services/api';

/** Images behind JWT-protected endpoints can't use a plain <img src>, so fetch them as a blob
 *  through the axios instance and hand back an object URL (revoked on change/unmount). */
export default function useAuthImage(path: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);

  useEffect(() => {
    setSrc(null);
    if (!path) {
      setLoading(false);
      return;
    }
    let url: string | null = null;
    let alive = true;
    setLoading(true);
    api
      .get(path, { responseType: 'blob' })
      .then((r) => {
        if (alive) {
          url = URL.createObjectURL(r.data);
          setSrc(url);
        }
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);

  return { src, loading };
}
