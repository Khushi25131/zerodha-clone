import { useCallback, useEffect, useState } from "react";
import { api, apiError } from "./api";
export default function useCollection(path) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api.get(path, { signal: controller.signal, params: { limit: 100, offset } })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error("Invalid API response");
        if (!controller.signal.aborted) setRows(data);
      }).catch((err) => { if (!controller.signal.aborted) setError(apiError(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, offset, version]);
  useEffect(() => {
    window.addEventListener("order-saved", retry);
    return () => window.removeEventListener("order-saved", retry);
  }, [retry]);
  return { rows, loading, error, retry, offset, previous: () => setOffset((n) => Math.max(0, n - 100)), next: () => setOffset((n) => n + 100) };
}
