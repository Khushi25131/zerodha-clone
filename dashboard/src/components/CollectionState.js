import React from "react";
export function CollectionState({ collection }) {
  if (collection.loading) return <div role="status" aria-live="polite" className="collection-loading"><span className="loading-dot" aria-hidden="true" /> Loading account data…</div>;
  if (collection.error) return <div role="alert">{collection.error} <button onClick={collection.retry}>Retry</button></div>;
  return null;
}
export function Pagination({ collection }) {
  return <nav aria-label="Results pages">
    <button disabled={collection.loading || collection.offset === 0} onClick={collection.previous}>Previous</button>
    <span> Page {collection.offset / 100 + 1} </span>
    <button disabled={collection.loading || !!collection.error || collection.rows.length < 100 || collection.offset >= 1000000} onClick={collection.next}>Next</button>
  </nav>;
}
