import React from "react";
export function CollectionState({ collection }) {
  if (collection.loading) return <p role="status">Loading…</p>;
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
