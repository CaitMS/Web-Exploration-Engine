'use client';
import React, { useEffect, Suspense, useRef, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { SelectItem } from '@nextui-org/react';
import WEEInput from '../../components/Util/Input';
import WEESelect from '../../components/Util/Select';
import WEEPagination from '../../components/Util/Pagination';
import {
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
  Tooltip
} from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import WEETable from '../../components/Util/Table';
import { useScrapingContext } from '../../context/ScrapingContext';
import { ScraperResult, Result, ErrorResponse, UndefinedResponse } from '../../models/ScraperModels';
import Link from 'next/link';
import { generateSummary } from '../../services/SummaryService';
import { pollForResult } from '../../services/PubSubService';
import MockGithubResult from '../../../../cypress/fixtures/pub-sub/github-scraper-result.json'
import MockSteersResult from '../../../../cypress/fixtures/pub-sub/steers-scraper-result.json'
import MockWimpyResult from '../../../../cypress/fixtures/pub-sub/wimpy-scraper-result.json'
import MockInsecureResult from '../../../../cypress/fixtures/pub-sub/insecure-scraper-result.json'
import useBeforeUnload from '../../hooks/useBeforeUnload';
import MockCiscoResult from '../../../../cypress/fixtures/pub-sub/cisco-scraper-result.json'
import { isScrapedResult } from '../../../Utils/scrapingUtils';

function ResultsComponent() {
  const {
    urls,
    setUrls,
    errorResults,
    setErrorResults,
    undefinedResults,
    setUndefinedResults,
    results,
    setResults,
    setSummaryReport,
    processedUrls,
    setProcessedUrls,
    processingUrls,
    setProcessingUrls
  } = useScrapingContext();
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchValue, setSearchValue] = React.useState('');
  const hasSearchFilter = Boolean(searchValue);
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState('');
  const [selectedCrawlableFilter, setSelectedCrawlableFilter] = React.useState('');
  const router = useRouter();

  useBeforeUnload();

  const filteredResultItems = React.useMemo(() => {
    let filteredUrls = [...results];

    // Apply status filter
    if (selectedStatusFilter === 'Parked') {
      filteredUrls = filteredUrls.filter(
        (url) => url.domainStatus === 'parked'
      );
    } else if (selectedStatusFilter === 'Live') {
      filteredUrls = filteredUrls.filter((url) => url.domainStatus === 'live');
    }

    // Apply crawlable filter
    if (selectedCrawlableFilter === 'Yes') {
      filteredUrls = filteredUrls.filter(
        (url) => url.robots && 'isUrlScrapable' in url.robots && url.robots.isUrlScrapable
      );
    } else if (selectedCrawlableFilter === 'No') {
      filteredUrls = filteredUrls.filter(
        (url) => url.robots && 'errorCode' in url.robots && url.robots.errorCode
      );
    }

    // Apply search filter
    if (hasSearchFilter) {
      filteredUrls = filteredUrls.filter((url) =>
        url.url.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return filteredUrls;
  }, [results, searchValue, selectedStatusFilter, selectedCrawlableFilter]);

  const filteredErrorItems = React.useMemo(() => {
    let filteredUrls = [...errorResults];

    // Apply status filter
    if (selectedStatusFilter === 'Parked') {
      filteredUrls = filteredUrls.filter(
        (url) => !url.errorCode
      );
    } else if (selectedStatusFilter === 'Live') {
      filteredUrls = filteredUrls.filter(
        (url) => !url.errorCode
      );
    }

    // Apply crawlable filter
    if (selectedCrawlableFilter === 'Yes') {
      filteredUrls = filteredUrls.filter(
        (error) => !error.errorCode
      );
    } else if (selectedCrawlableFilter === 'No') {
      filteredUrls = filteredUrls.filter(
        (error) => error.errorCode
      );
    }

    // Apply search filter
    if (hasSearchFilter) {
      filteredUrls = filteredUrls.filter((url) =>
        url.url?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return filteredUrls;
  }, [errorResults, searchValue, selectedStatusFilter, selectedCrawlableFilter])

  const filteredUndefinedItems = React.useMemo(() => {
    let undefinedUrls = [...undefinedResults];

    // Apply status filter
    if (selectedStatusFilter === 'Live') {
      undefinedUrls = [];
    }

    // Apply crawlable filter
    if (selectedCrawlableFilter === 'Yes') {
      undefinedUrls = [];
    }

    // Apply search filter
    if (hasSearchFilter) {
      undefinedUrls = undefinedUrls.filter((url) =>
        url.url?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return undefinedUrls;
  }, [undefinedResults, searchValue, selectedStatusFilter, selectedCrawlableFilter])

  const filteredItems = React.useMemo(() => {
    // Combine filtered results and errors
    return [...filteredResultItems, ...filteredErrorItems, ...filteredUndefinedItems];
  }, [filteredResultItems, filteredErrorItems, filteredUndefinedItems]);

  const handleResultPage = (url: string) => {
    router.push(`/results?url=${encodeURIComponent(url)}`);
  };

  // Pagination
  const [page, setPage] = React.useState(1);
  const [resultsPerPage, setResultsPerPage] = React.useState(10);
  const pages = Math.ceil(filteredItems.length / resultsPerPage);

  const handleResultsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newResultsPerPage = parseInt(event.target.value, 10);
    setResultsPerPage(newResultsPerPage);
    setPage(1);
  };

  const items = React.useMemo(() => {
    const start = (page - 1) * resultsPerPage;
    const end = start + resultsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, resultsPerPage]);

  useEffect(() => {
    console.log('urls length: ', urls.length, urls);
    if (urls && urls.length > 0 && urls[0] !== '' && urls.length !== (results.length + errorResults.length + undefinedResults.length)) {
      urls.forEach((url) => {
        if (!processedUrls.includes(url) && !processingUrls.includes(url)) {
          // add to array of urls still being processed
          processingUrls.push(url);
          console.log('API call for:', url);
          try {
            getScrapingResults(url);
          } catch (error) {
            console.error('Error when scraping website:', error);
          }

          // remove from array of urls still being processed
          processingUrls.splice(processingUrls.indexOf(url), 1);
          // add to array of urls that have been processed
          processedUrls.push(url);
        }
      });
    } else {
      // allows to naviagte back to this page without rescraping the urls
      if (processedUrls.length > 1) {
        // Generate summary report
        console.log('Results:', results);
        console.log('ErrorResults:', errorResults);
        console.log('UndefinedResults:', undefinedResults);
        const summary = generateSummary(results);
        console.log('Summary:', summary);
        setSummaryReport(summary);
      }
      setIsLoading(false);
    }
  }, [urls.length]);

  useEffect(() => {
    if (urls.length === (results.length + errorResults.length + undefinedResults.length)) {
      setIsLoading(false);
      // allows to navigate back to this page without rescraping the urls
      setUrls([]);
    }
  }, [results, errorResults, undefinedResults]);

  // Function to initiate scraping and handle results
  const getScrapingResults = async (url: string) => {
    try {
      // CHANGE TO DEPLOYED VERSION
      const apiUrl = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3002/api';
      console.log('API URL:', apiUrl);
      const response = await fetch(
        `${apiUrl}/scraper?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) {
        throw new Error(`Error initiating scrape: ${response.statusText}`);
      }
      const initData = await response.json();
      console.log('Scrape initiation response:', initData);

      // Poll the API until the scraping is done
      try {
        let result = await pollForResult(url) as Result;

        if (url.includes('mock.test.') && (process.env.NEXT_PUBLIC_TESTING_ENVIRONMENT == 'true')) {
          console.log(process.env.Tes)
          if (url.includes('mock.test.wimpy'))
            result = MockWimpyResult;
          else if (url.includes('mock.test.github'))
            result = MockGithubResult;
          else if (url.includes('mock.test.steers'))
            result = MockSteersResult;
          else if (url.includes('mock.test.insecure'))
            result = MockInsecureResult;
          else if (url.includes('mock.test.cisco'))
            result = MockCiscoResult;
        }

        if (result && 'errorStatus' in result) {
          const errorResponse = { ...result, url };
          setErrorResults((prevErrorResults) => [...prevErrorResults, errorResponse] as ErrorResponse[])
        }
        else if (result) {
          // Assuming setResults is a function to update the state or handle results
          setResults((prevResults: ScraperResult[]) => [...prevResults, result] as ScraperResult[]);
        }
        else {
          const undefinedResponse = { url };
          setUndefinedResults((prevResults: UndefinedResponse[]) => [...prevResults, undefinedResponse] as UndefinedResponse[])
        }
        console.log('Scraping result:', result);

      } catch (error) {
        console.error('Error when scraping website:', error);
      }

    } catch (error) {
      console.error('Error when scraping website:', error);
    }
  };


  const onSearchChange = (value: string) => {
    if (value) {
      setSearchValue(value);
      setPage(1);
    } else {
      setSearchValue('');
    }
  };

  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const status = event.target.value;
    setSelectedStatusFilter(status);
  };

  const handleCrawlableFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const crawlable = event.target.value;
    setSelectedCrawlableFilter(crawlable);
  };

  const handleSummaryPage = () => {
    router.push(`/summaryreport`);
  };

  const handleComparisonPage = () => {
    router.push(`/comparison`);
  };

  const loadingMessages = [
    "Gathering the latest results...",
    "Performing SEO analysis...",
    "Crunching the numbers...",
    "Checking reputation status...",
    "Scraping the urls...",
  ];
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

  
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setCurrentMessage(randomMessage);
      }, 3000); // Change the message every 3 seconds

      return () => clearInterval(interval); // Clean up on unmount or when loading stops
    }
  }, [isLoading]);
  

  return (
    <div className="p-4 min-h-screen">
      <div className="flex justify-center">
        <WEEInput
          data-testid="search-urls"
          isClearable
          type="text"
          placeholder="Enter URL to search..."
          labelPlacement="outside"
          className="py-3  w-full md:w-4/5 md:px-5"
          startContent={
            <FiSearch className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
          }
          value={searchValue}
          onValueChange={onSearchChange}
        />
      </div>
      <div className="md:flex md:justify-between md:w-4/5 md:m-auto md:px-5">
        <WEESelect
          label="Filter by domain status"
          className="w-full pb-3 md:w-1/3"
          onChange={handleStatusFilterChange}
          data-testid="status-filter"
        >
          <SelectItem key={'Parked'} data-testid="status-filter-parked">Parked</SelectItem>
          <SelectItem key={'Live'} data-testid="status-filter-live">Live</SelectItem>
        </WEESelect>

        <WEESelect
          label="Filter by crawlability"
          className="w-full pb-3 md:w-1/3"
          onChange={handleCrawlableFilterChange}
          data-testid="crawlable-filter"
        >
          <SelectItem key={'Yes'} data-testid="crawlable-filter-yes">Crawlable</SelectItem>
          <SelectItem key={'No'} data-testid="crawlable-filter-no">Not Crawlable</SelectItem>
        </WEESelect>
      </div>

      <h1 className="my-4 font-poppins-bold text-2xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
        Results
      </h1>

      <div className="flex justify-between items-center mb-2">
        <span className="text-default-400 text-small">
          Total {filteredItems.length} results
        </span>
        <label className="flex items-center text-default-400 text-small">
          Results per page:
          <select
            value={resultsPerPage}
            className="bg-transparent outline-none text-default-400 text-small"
            onChange={handleResultsPerPageChange}
            aria-label="Number of results per page"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>

      <WEETable
        aria-label="Scrape result table"
        bottomContent={
          <>
            {isLoading ? (
              <div className="flex flex-col w-full justify-center items-center">
                <Spinner color="default" />
                <p className="mt-2 text-lg text-gray-500 dark:text-grey-50">{currentMessage}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-grey-50">Hold tight, processing can take up to 5 mins</p>
              </div>
            ) : null}

            {((results.length + errorResults.length) > 0) && (
              <div className="flex w-full justify-center">
                <WEEPagination
                  loop
                  showControls
                  color="stone"
                  page={page}
                  total={pages}
                  onChange={(page) => setPage(page)}
                  aria-label="Pagination"
                />
              </div>
            )}
          </>
        }
        classNames={{
          wrapper: 'min-h-[222px]',
        }}
      >
        <TableHeader>
          <TableColumn key="name" className="rounded-r-lg sm:rounded-none">
            URL
          </TableColumn>
          <TableColumn key="role" className="text-center hidden sm:table-cell">
            CRAWLABLE
          </TableColumn>
          <TableColumn
            key="status"
            className="text-center hidden sm:table-cell"
          >
            RESULT &amp; REPORT
          </TableColumn>
        </TableHeader>

        <TableBody emptyContent={isLoading ? "" : "No results to display. Begin scraping by going to the 'Start Scraping' page."}>
          {items.map((item, index) => (
            <TableRow key={index} data-testid="table-row">
              <TableCell >
                {isScrapedResult(item) ? (
                  item.url &&
                  <Link href={`/results?url=${encodeURIComponent(item.url)}`} >
                    {item.url}
                  </Link>
                ) : (
                  item.url ? item.url : 'Error'
                )}
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                {isScrapedResult(item) ? (
                  <Chip
                    radius="sm"
                    color={item.domainStatus === 'live' ? 'success' : 'warning'}
                    variant="flat"
                  >
                    {item.domainStatus === 'live' ? 'Yes' : 'No'}
                  </Chip>
                ) : (
                  <Chip
                    radius="sm"
                    color="danger"
                    variant="flat"
                  >
                    Error
                  </Chip>
                )}
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                {isScrapedResult(item) ? (
                  item.url &&
                  <Button
                    className="font-poppins-semibold bg-jungleGreen-700 text-dark-primaryTextColor dark:bg-jungleGreen-400 dark:text-primaryTextColor"
                    onClick={() => handleResultPage(item.url)}
                    data-testid={'btnView' + index}
                  >
                    View
                  </Button>
                ) : (
                  <></>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </WEETable>

      <div className='sm:flex sm:justify-between'>
        <div>
          <h1 className="my-4 mt-6 font-poppins-bold text-2xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
            Summary
          </h1>
          {isLoading ||  results.length <= 1 ?
            <Tooltip content="Only available if there are more than one result and all URLs have successfully loaded">
              <Button
                data-testid="btn-report-summary"
                className="text-md font-poppins-semibold bg-jungleGreen-700 text-dark-primaryTextColor dark:bg-jungleGreen-400 dark:text-primaryTextColor disabled:bg-jungleGreen-600 disabled:dark:bg-jungleGreen-300 disabled:cursor-not-allowed"
                onClick={handleSummaryPage}
                disabled={isLoading || results.length <= 1}
              >
                View overall summary report
              </Button>
            </Tooltip>
          :
            <Button
            data-testid="btn-report-summary"
            className="text-md font-poppins-semibold bg-jungleGreen-700 text-dark-primaryTextColor dark:bg-jungleGreen-400 dark:text-primaryTextColor disabled:bg-jungleGreen-600 disabled:dark:bg-jungleGreen-300 disabled:cursor-not-allowed"
            onClick={handleSummaryPage}
            disabled={isLoading || results.length <= 1}
          >
            View overall summary report
          </Button>
          }
        </div>

        <div>
          <h1 className="my-4 mt-6 font-poppins-bold text-2xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
            Comparison
          </h1>
          <Button
            data-testid="btn-comparison-summary"
            className="text-md font-poppins-semibold bg-jungleGreen-700 text-dark-primaryTextColor dark:bg-jungleGreen-400 dark:text-primaryTextColor disabled:bg-jungleGreen-600 disabled:dark:bg-jungleGreen-300 disabled:cursor-wait"
            onClick={handleComparisonPage}
          >
            View comparison report
          </Button>
        </div>
      </div>

    </div>
  );
}
export default function ScrapeResults() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsComponent />
    </Suspense>
  );
}
