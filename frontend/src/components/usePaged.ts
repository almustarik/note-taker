import { useCallback, useEffect, useState } from 'react';
import { api, type Page } from '../api';

export function usePaged<T>(endpointUrl: string | null, pageSizeLimit = 10) {
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [paginatedResponseData, setPaginatedResponseData] = useState<Page<T> | null>(null);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string>('');

  const fetchDataForCurrentPage = useCallback(async () => {
    if (!endpointUrl) return;
    const queryStringSeparator = endpointUrl.includes('?') ? '&' : '?';
    try {
      const response = await api.get<Page<T>>(
        `${endpointUrl}${queryStringSeparator}page=${currentPageNumber}&limit=${pageSizeLimit}`,
      );
      setPaginatedResponseData(response);
      setFetchErrorMessage('');
    } catch (caughtError) {
      setFetchErrorMessage((caughtError as Error).message);
    }
  }, [endpointUrl, currentPageNumber, pageSizeLimit]);

  useEffect(() => {
    fetchDataForCurrentPage();
  }, [fetchDataForCurrentPage]);

  useEffect(() => {
    setCurrentPageNumber(1);
  }, [endpointUrl]);

  return {
    result: paginatedResponseData,
    error: fetchErrorMessage,
    page: currentPageNumber,
    setPage: setCurrentPageNumber,
    reload: fetchDataForCurrentPage,
  };
}
