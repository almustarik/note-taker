import type { Page } from '../api';

interface Props {
  pagination: Page<unknown>['pagination'];
  onChange: (page: number) => void;
}

export default function Pager({ pagination, onChange }: Props) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="pager">
      <button className="button ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages} <span className="muted">({total} total)</span>
      </span>
      <button className="button ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
