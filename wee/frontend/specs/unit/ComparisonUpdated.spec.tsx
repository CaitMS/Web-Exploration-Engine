import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import Comparison from '../../src/app/(pages)/comparison/page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserContext } from '../../src/app/context/UserContext';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// if this isn't included a resize observer problem is thrown
jest.mock('react-apexcharts', () => () => null);

global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve({}), // Mock the json() method to return a Promise
    headers: { 'Content-Type': 'application/json' }, // Example headers
    ok: true, // Example ok status
    status: 200, // Example status code
});

jest.mock('../../src/app/context/ScrapingContext', () => ({
    useScrapingContext: () => ({
        urls: ['https://www.example.com', 'https://www.example2.com', 'https://www.example3.com'],
        setUrls: jest.fn(),
        results: [
            {
                url: 'https://www.example.com',
                robots: { isUrlScrapable: true },
                metadata: {
                    title: 'Example Title',
                    description: 'Example Description',
                    keywords: 'example, keywords',
                    ogTitle: 'Example OG Title',
                    ogDescription: 'Example OG Description',
                    ogImage: 'https://www.example.com/ogimage.png',
                },
                domainStatus: 'parked',
                logo: 'https://www.example.com/logo.png',
                images: ['https://www.example.com/image1.png', 'https://www.example.com/image2.png'],
                industryClassification: {
                    metadataClass: { label: 'E-commerce', score: 95 },
                    domainClass: { label: 'Retail', score: 90 },
                    zeroShotDomainClassify: [
                        {
                            "label": "Finance and Banking",
                            "score": 0.6868
                        },
                        {
                            "label": "Marine and Shipping",
                            "score": 0.1616
                        },
                        {
                            "label": "Logistics and Supply Chain Management",
                            "score": 0.1515
                        }
                    ],
                    zeroShotMetaDataClassify: [                    
                        {
                            "label": "Tech",
                            "score": 0.6969
                        },
                        {
                            "label": "Restuarant",
                            "score": 0.1919
                        },
                        {
                            "label": "Marine Resources",
                            "score": 0.1818
                        }                    
                    ]
                },
                seoAnalysis: {
                    imageAnalysis: {
                        errorUrls: [],
                        missingAltTextCount: 11,
                        nonOptimizedCount: 3,
                        reasonsMap: {
                            format: ['https://www.exampleOne.com/coast.png', 'https://www.exampleTwo.com/lion.svg', 'https://www.exampleThree.com/ocean.jpg'],
                            other: [],
                            size: [],
                        },
                        recommendations: '11 images are missing alt text. 3 images are not optimized.',
                        totalImages: 27,
                    },
                    uniqueContentAnalysis: {
                        recommendations: '',
                        textLength: 743,
                        uniqueWordsPercentage: 41.72,
                        repeatedWords: [
                            {
                                word: 'repeatedWordsOne',
                                count: 19,
                            }
                        ]
                    },
                    lighthouseAnalysis: {
                        scores: {
                            accessibility: 85,
                            bestPractices: 93,
                            performance: 24,
                        },
                        diagnostics: undefined,
                    },
                    siteSpeedAnalysis: {
                        loadTime: 2.88,
                        recommendations: '',
                    },
                    mobileFriendlinessAnalysis: {
                        isResponsive: false,
                        recommendations: '',
                    },
                }
            },
            {
                url: 'https://www.example2.com',
                robots: { isUrlScrapable: true },
                metadata: {
                    title: 'Example Title2',
                    description: 'Example Description2',
                    keywords: 'example, keywords2',
                    ogTitle: 'Example OG Title2',
                    ogDescription: 'Example OG Description2',
                    ogImage: 'https://www.example.com/ogimage2.png',
                },
                domainStatus: 'live',
                logo: 'https://www.example.com/logo2.png',
                images: ['https://www.example.com/image21.png', 'https://www.example.com/image22.png'],
                industryClassification: {
                    metadataClass: { label: 'Regional Banks', score: 62 },
                    domainClass: { label: 'Application Software', score: 78 },
                    zeroShotDomainClassify: [
                        {
                            "label": "Hospitality",
                            "score": 0.7070
                        },
                        {
                            "label": "Telecommunications",
                            "score": 0.8338
                        },
                        {
                            "label": "Arts and Culture",
                            "score": 0.2772
                        }
                    ],
                    zeroShotMetaDataClassify: [                    
                        {
                            "label": "Retail and Consumer Goods",
                            "score": 0.9696
                        },
                        {
                            "label": "Entertainment and Media",
                            "score": 0.8118
                        },
                        {
                            "label": "Fitness and Wellness",
                            "score": 0.1001
                        }                    
                    ]
                },
                seoAnalysis: {
                    imageAnalysis: {
                        errorUrls: [],
                        missingAltTextCount: 14,
                        nonOptimizedCount: 13,
                        reasonsMap: {
                            format: ['https://www.exampleOne.com/coast.png', 'https://www.exampleTwo.com/lion.svg', 'https://www.exampleThree.com/ocean.jpg'],
                            other: [],
                            size: [],
                        },
                        recommendations: '14 images are missing alt text. 13 images are not optimized.',
                        totalImages: 27,
                    },
                    uniqueContentAnalysis: {
                        recommendations: '',
                        textLength: 813,
                        uniqueWordsPercentage: 71.42,
                        repeatedWords: [
                            {
                                word: 'repeatedWordsOne',
                                count: 19,
                            }
                        ]
                    },
                    lighthouseAnalysis: {
                        scores: {
                            accessibility: 84,
                            bestPractices: 78,
                            performance: 60,
                        },
                        diagnostics: undefined,
                    },
                    siteSpeedAnalysis: {
                        loadTime: 6.60,
                        recommendations: '',
                    },
                    mobileFriendlinessAnalysis: {
                        isResponsive: true,
                        recommendations: '',
                    },
                }
            }
        ],
        processedUrls: ['https://www.example.com', 'https://www.example2.com'],
        setProcessedUrls: jest.fn(),
        processingUrls: [],
        setProcessingUrls: jest.fn(), 
        setResults: jest.fn(),
        setSummaryReport: jest.fn(),
    }),
}));

describe('Comparison testing TWO', () => {
    const mockPush = jest.fn();
    const mockResponse = {
        json: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush }); 
    });

    it('correct options in two respective dropdowns have rendered', async () => {
        render(<Comparison />);
    
        const selectOneTrigger = screen.getByTestId('website1-select');
        const selectTwoTrigger = screen.getByTestId('website2-select');
    
        expect(selectOneTrigger).toBeInTheDocument();
        expect(selectTwoTrigger).toBeInTheDocument();
    
        fireEvent.click(selectOneTrigger);
        fireEvent.click(selectTwoTrigger);
    
        await waitFor(() => {
            const optionsOne = screen.getAllByTestId(/website1-option-/);
            const optionsTwo = screen.getAllByTestId(/website2-option-/);
    
            expect(optionsOne).toHaveLength(2); 
            expect(optionsTwo).toHaveLength(2); 
    
            expect(optionsOne.map(option => option.textContent.trim())).toEqual([
                'https://www.example.com',
                'https://www.example2.com'
            ]);
    
            expect(optionsTwo.map(option => option.textContent.trim())).toEqual([
                'https://www.example.com',
                'https://www.example2.com'
            ]);
        });
    });

    it('simulate a user selecting the first option from the website ONE dropdown', async () => {
        render(<Comparison />);
    
        const selectOneTrigger = screen.getByTestId('website1-select');
    
        expect(selectOneTrigger).toBeInTheDocument();
    
        fireEvent.click(selectOneTrigger);
    
        await waitFor(() => {
            expect(screen.getByTestId('website1-option-0')).toBeInTheDocument();
            expect(screen.getByTestId('website1-option-1')).toBeInTheDocument();
        });

        const firstOption = screen.getByTestId('website1-option-0');
        fireEvent.click(firstOption);
    
        expect(screen.getByTestId('website1-status').textContent.trim()).toBe('Parked');
        expect(screen.getByTestId('website1-meta-score').textContent.trim()).toBe('69.69%');
        expect(screen.getByTestId('website1-meta-label').textContent.trim()).toBe('Tech');
        expect(screen.getByTestId('website1-domain-score').textContent.trim()).toBe('68.68%');
        expect(screen.getByTestId('website1-domain-label').textContent.trim()).toBe('Finance and Banking');
        expect(screen.getByTestId('website1-uniquewords').textContent.trim()).toBe('41.72%');
        expect(screen.getByTestId('website1-missingAltText').textContent.trim()).toBe('11');
        expect(screen.getByTestId('website1-nonOptimized').textContent.trim()).toBe('3');
        expect(screen.getByTestId('website1-lighthouse-performance').textContent.trim()).toBe('24%Performance');
        expect(screen.getByTestId('website1-lighthouse-accessibility').textContent.trim()).toBe('85%Accessibility');
        expect(screen.getByTestId('website1-lighthouse-bestpractices').textContent.trim()).toBe('93%Best Practices');
        expect(screen.getByTestId('website1-mobilefriendly').textContent.trim()).toBe('No');
        expect(screen.getByTestId('website1-sitespeed').textContent.trim()).toBe('2.88');
    });

    it('simulate a user selecting the first option from the website TWO dropdown', async () => {
        render(<Comparison />);
    
        const selectTwoTrigger = screen.getByTestId('website2-select');
    
        expect(selectTwoTrigger).toBeInTheDocument();
    
        fireEvent.click(selectTwoTrigger);
    
        await waitFor(() => {
            expect(screen.getByTestId('website2-option-0')).toBeInTheDocument();
            expect(screen.getByTestId('website2-option-1')).toBeInTheDocument();
        });

        const firstOption = screen.getByTestId('website2-option-1');
        fireEvent.click(firstOption);
    
        expect(screen.getByTestId('website2-status').textContent.trim()).toBe('Live');
        expect(screen.getByTestId('website2-meta-score').textContent.trim()).toBe('96.96%');
        expect(screen.getByTestId('website2-meta-label').textContent.trim()).toBe('Retail and Consumer Goods');
        expect(screen.getByTestId('website2-domain-score').textContent.trim()).toBe('70.70%');
        expect(screen.getByTestId('website2-domain-label').textContent.trim()).toBe('Hospitality');
        expect(screen.getByTestId('website2-uniquewords').textContent.trim()).toBe('71.42%');
        expect(screen.getByTestId('website2-missingAltText').textContent.trim()).toBe('14');
        expect(screen.getByTestId('website2-nonOptimized').textContent.trim()).toBe('13');
        expect(screen.getByTestId('website2-lighthouse-performance').textContent.trim()).toBe('60%Performance');
        expect(screen.getByTestId('website2-lighthouse-accessibility').textContent.trim()).toBe('84%Accessibility');
        expect(screen.getByTestId('website2-lighthouse-bestpractices').textContent.trim()).toBe('78%Best Practices');
        expect(screen.getByTestId('website2-mobilefriendly').textContent.trim()).toBe('Yes');
        expect(screen.getByTestId('website2-sitespeed').textContent.trim()).toBe('6.60');
    });
    
});