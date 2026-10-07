import type { Page } from '../api';

interface PagerComponentProps {
  pagination: Page<unknown>['pagination'];
  onChange: (targetPageNumber: number) => void;
}

export default function Pager({ pagination, onChange }: PagerComponentProps) {
  const { page: currentPageNumber, totalPages: totalAvailablePages, total: totalRecordsCount } = pagination;

  if (totalAvailablePages <= 1) {
    return null;
  }

  const hasPreviousPage = currentPageNumber > 1;
  const hasNextPage = currentPageNumber < totalAvailablePages;

  return (
    <div className="pager">
      <button
        className="button ghost"
        disabled={!hasPreviousPage}
        onClick={() => onChange(currentPageNumber - 1)}
      >
        Previous
      </button>
      <span>
        Page {currentPageNumber} of {totalAvailablePages}{' '}
        <span className="muted">({totalRecordsCount} total)</span>
      </span>
      <button
        className="button ghost"
        disabled={!hasNextPage}
        onClick={() => onChange(currentPageNumber + 1)}
      >
        Next
      </button>
    </div>
  );
}
