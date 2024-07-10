'use client';
import React, { useEffect } from "react";
import WEETable from '../../components/Util/Table';
import WEESelect from "../../components/Util/Select";
import { Image, Button, Chip, TableHeader, TableColumn, TableBody, TableRow, TableCell, SelectItem } from '@nextui-org/react';
import { useScrapingContext } from '../../context/ScrapingContext';
import { useRouter } from 'next/navigation';
import Scraping from "../../models/ScrapingModel";

export default function ComparisonReport() {
    const { results } = useScrapingContext();
    const router = useRouter();
    const [websiteOne, setWebsiteOne] = React.useState<Scraping>();
    const [websiteTwo, setWebsiteTwo] = React.useState<Scraping>();

    useEffect(() => {

    }, []);

    const backToScrapeResults = () => {
        router.push(`/scraperesults`);
    };

    const handleWebsiteOne = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const website1: number = parseInt(event.target.value, 10);
        setWebsiteOne(results[website1]);
    }

    const handleWebsiteTwo = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const website2: number = parseInt(event.target.value, 10);
        setWebsiteTwo(results[website2]);
    }

    return (
        <div className="min-h-screen p-4"> 
            <Button
                className="text-md font-poppins-semibold bg-jungleGreen-700 text-dark-primaryTextColor dark:bg-jungleGreen-400 dark:text-primaryTextColor"
                onClick={backToScrapeResults}
            >
                Back
            </Button>
            <div className="mb-8 text-center">
                <h1 className="mt-4 font-poppins-bold text-2xl text-jungleGreen-800 dark:text-dark-primaryTextColor">
                    Website Comparison
                </h1>
            </div>

            <div>
                <WEESelect
                    label="Website 1"
                    className="w-1/2 pr-3 pb-3"
                    onChange={handleWebsiteOne}
                >
                    {results.map((item, index) => (
                        <SelectItem key={index}>{item.url}</SelectItem>
                    ))}
                </WEESelect>

                <WEESelect
                    label="Website 2"
                    className="w-1/2 pl-3 pb-3"
                    onChange={handleWebsiteTwo}
                >
                    {results.map((item, index) => (
                        <SelectItem key={index}>{item.url}</SelectItem>
                    ))}
                </WEESelect>
            </div>

            <WEETable isStriped aria-label="Example static collection table">
                <TableHeader>
                    <TableColumn>WEBSITE 1</TableColumn>
                    <TableColumn>WEBSITE 2</TableColumn>
                </TableHeader>
                <TableBody>                  
                    <TableRow key="1">
                        <TableCell>{websiteOne ? websiteOne.url : 'Url'}</TableCell>
                        <TableCell>{websiteTwo ? websiteTwo.url : 'Url'}</TableCell>
                    </TableRow>
                    <TableRow key="2">
                        <TableCell>
                            {websiteOne 
                            ? 
                            <>
                                <Chip
                                    radius="sm"
                                    color={websiteOne && websiteOne.domainStatus === 'live' ? 'success' : 'warning'}
                                    variant="flat"
                                >
                                    {websiteOne && websiteOne.domainStatus === 'live' ? 'Live' : 'Parked'}
                                </Chip>
                            </>
                            : 'Domain Status'}
                        </TableCell>
                        <TableCell>
                            {websiteTwo 
                            ? 
                            <>
                                <Chip
                                    radius="sm"
                                    color={websiteTwo && websiteTwo.domainStatus === 'live' ? 'success' : 'warning'}
                                    variant="flat"
                                >
                                    {websiteTwo && websiteTwo.domainStatus === 'live' ? 'Live' : 'Parked'}
                                </Chip>
                            </>
                            : 'Domain Status'}
                        </TableCell>
                    </TableRow>
                    <TableRow key="3">
                        <TableCell>
                            {/* <div className="flex justify-center"> */}
                                {/* <div className="flex justify-center"> */}
                                    <Image
                                        alt="Logo"
                                        src={websiteOne?.logo}
                                        className="centered-image max-h-48 shadow-md shadow-zinc-150 dark:shadow-zinc-900"
                                    />
                                {/* </div> */}
                            {/* </div> */}
                    
                        </TableCell>
                        <TableCell>
                            <Image
                                alt="Logo"
                                src={websiteTwo?.logo}
                                className="centered-image max-h-48 shadow-md shadow-zinc-150 dark:shadow-zinc-900"
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow key="4">
                        <TableCell>abc</TableCell>
                        <TableCell>abc</TableCell>
                    </TableRow>
                </TableBody>
            </WEETable>
        </div>
    );
}