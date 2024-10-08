import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import Comparison from '../../src/app/(pages)/comparison/page';
import '@testing-library/jest-dom';
import {useScrapingContext} from '../../src/app/context/ScrapingContext';
import { useRouter } from 'next/navigation';
import { LightHouseAnalysis, LightHouseRecommendations, LightHouseScore, MetaDescriptionAnalysis, MobileFriendlinessAnalysis, SiteSpeedAnalysis, UniqueContentAnalysis, ImageAnalysis, RepeatedWords, ReasonsMap, SEOError } from '../../src/app/models/ScraperModels';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('frontend/src/app/context/ScrapingContext', () => ({
    useScrapingContext: jest.fn(),
}));

function isLightHouse(data: LightHouseAnalysis | SEOError): data is LightHouseAnalysis {
    return 'scores' in data || 'diagnostics' in data;
}

function isSiteSpeedAnalysis(data: SiteSpeedAnalysis | SEOError): data is SiteSpeedAnalysis {
    return 'loadTime' in data || 'recommendations' in data;
}

function isMobileFriendlinessAnalysis(data: MobileFriendlinessAnalysis | SEOError): data is MobileFriendlinessAnalysis {
    return 'isResponsive' in data || 'recommendations' in data;
}

function isImageAnalysis(data: ImageAnalysis | SEOError): data is ImageAnalysis {
    return 'errorUrls' in data || 'missingAltTextCount' in data || 'nonOptimizedCount' in data || 'reasonsMap' in data || 'recommendations' in data || 'totalImages' in data ;
}

function isUniqueContentAnalysis(data: UniqueContentAnalysis | SEOError): data is UniqueContentAnalysis {
    return 'recommendations' in data || 'textLength' in data || 'uniqueWordsPercentage' in data || 'repeatedWords' in data;
}

describe('Comparison Component', () => {
    const mockPush = jest.fn();
    const mockResults = [
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
                zeroShotDomainClassification: [
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
                zeroShotDomainClassification: [
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
            }
        }
    ];

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });  
        (useScrapingContext as jest.Mock).mockReturnValue({ results: mockResults }); 
    });

    it('isLightHouse should identify LightHouseAnalysis correctly', () => {
        const lightHouseData: LightHouseAnalysis = {
            scores: {
                accessibility: 80,
                bestPractices: 85,
                performance: 90
            },
            diagnostics: {
                recommendations: [
                { title: 'Accessibility', description: 'Improve accessibility', score: 75 }
                ]
            }
        };

        const seoErrorData: SEOError = {
            error: 'An error occurred'
        }; 

        expect(isLightHouse(lightHouseData)).toBe(true);
        expect(isLightHouse(seoErrorData)).toBe(false);
    });

    it('isSiteSpeedAnalysis should identify SiteSpeedAnalysis correctly', () => {
        const siteSpeedData: SiteSpeedAnalysis = {
            loadTime: 2.5,
            recommendations: 'Optimize images'
        };

        const seoErrorData: SEOError = {
            error: 'An error occurred'
        }; 

        expect(isSiteSpeedAnalysis(siteSpeedData)).toBe(true);
        expect(isSiteSpeedAnalysis(seoErrorData)).toBe(false);
    });
    
    it('isMobileFriendlinessAnalysis should identify MobileFriendlinessAnalysis correctly', () => {
        const mobileFriendlinessData: MobileFriendlinessAnalysis = {
            isResponsive: true,
            recommendations: 'Use larger fonts'
        };

        const seoErrorData: SEOError = {
            error: 'An error occurred'
        }; 

        expect(isMobileFriendlinessAnalysis(mobileFriendlinessData)).toBe(true);
        expect(isMobileFriendlinessAnalysis(seoErrorData)).toBe(false);
    });

    it('isUniqueContentAnalysis should identify UniqueContentAnalysis correctly', () => {
        const uniqueContentData: UniqueContentAnalysis = {
            recommendations: 'Increase unique content',
            textLength: 1200,
            uniqueWordsPercentage: 60,
            repeatedWords: [{ word: 'example', count: 5 }]
        };

        const seoErrorData: SEOError = {
            error: 'An error occurred'
        }; 

        expect(isUniqueContentAnalysis(uniqueContentData)).toBe(true);
        expect(isUniqueContentAnalysis(seoErrorData)).toBe(false);
    });
    
    it('isImageAnalysis should identify ImageAnalysis correctly', () => {
        const imageAnalysisData: ImageAnalysis = {
            errorUrls: ['http://example.com/image1.jpg'],
            missingAltTextCount: 3,
            nonOptimizedCount: 2,
            reasonsMap: { 
                format: ['JPEG', 'PNG'], 
                other: ['No EXIF data'], 
                size: ['Too large']
            },
            recommendations: 'Add alt text and optimize images',
            totalImages: 10
        };

        const seoErrorData: SEOError = {
            error: 'An error occurred'
        }; 

        expect(isImageAnalysis(imageAnalysisData)).toBe(true);
        expect(isImageAnalysis(seoErrorData)).toBe(false);
    });

    it('should display all the basic main headings when page is first rendered', async () => {
        await act(async () => {
            render(<Comparison/>);
        })

        await waitFor(() => {
            expect(screen.queryByText('Website Comparison')).toBeDefined();
        });
    });

    it('should navigate back to scrape results when Back button is clicked', async () => {
        await act(async () => {
            render(<Comparison />);
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
        });

        const backButton = screen.getByRole('button', { name: /Back/i });
        fireEvent.click(backButton);

        expect(mockPush).toHaveBeenCalledWith('/scraperesults');
    });
    
    it('should compare items based on urls selected in dropdowns', async () => {
        await act(async () => {
            render(<Comparison />);
        });

        const selectOne = screen.getByTestId('website1-select');
        const selectTwo = screen.getByTestId('website2-select');
    
        fireEvent.change(selectOne, { target: { value: 'https://www.example.com' } });
        fireEvent.change(selectTwo, { target: { value: 'https://www.example2.com' } });
    
        await waitFor(() => {
            // website status
            expect(screen.queryByText('Parked')).toBeDefined();
            expect(screen.queryByText('Live')).toBeDefined();

            // industry classification
            expect(screen.queryByText('Finance and Banking')).toBeDefined();
            expect(screen.queryByText('68.68%')).toBeDefined();

            expect(screen.queryByText('Hospitality')).toBeDefined();
            expect(screen.queryByText('70.70%')).toBeDefined();

            // domain match
            expect(screen.queryByText('Tech')).toBeDefined();
            expect(screen.queryByText('69.69%')).toBeDefined();

            expect(screen.queryByText('Retail and Consumer Goods')).toBeDefined();
            expect(screen.queryByText('96.96%')).toBeDefined();

            // lighthouse 
            expect(screen.queryByText('24%')).toBeDefined();
            expect(screen.queryByText('85%')).toBeDefined();
            expect(screen.queryByText('93%')).toBeDefined();

            expect(screen.queryByText('60%')).toBeDefined();
            expect(screen.queryByText('84%')).toBeDefined();
            expect(screen.queryByText('78%')).toBeDefined();

            // mobile friendliness
            expect(screen.queryByText('No')).toBeDefined();
            expect(screen.queryByText('Yes')).toBeDefined();

            // Site Speed
            expect(screen.queryByText('2.88')).toBeDefined();
            expect(screen.queryByText('6.60')).toBeDefined();
        });
    });

    it('should update websiteOne state when a new option is selected', async () => {
        await act(async () => {
            render(<Comparison />);
        });

        const selectOne = screen.getByTestId('website1-select');
        fireEvent.change(selectOne, { target: { value: '0' } });

        await waitFor(() => {
            expect(screen.queryByText('Parked')).toBeDefined();
            expect(screen.queryByText('Finance and Banking')).toBeDefined();
            expect(screen.queryByText('68.68%')).toBeDefined();
            expect(screen.queryByText('Tech')).toBeDefined();
            expect(screen.queryByText('69.69%')).toBeDefined();
            expect(screen.queryByText('41.72%')).toBeDefined();
            expect(screen.queryByText('11')).toBeDefined();
            expect(screen.queryByText('3')).toBeDefined();
        });

        const websiteOneState = mockResults[0];
        expect(websiteOneState).toEqual({
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
                zeroShotDomainClassification: [
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
            }

        });
    });

    it('should update websiteTwo state when a new option is selected', async () => {
        await act(async () => {
            render(<Comparison />);
        });

        const selectTwo = screen.getByTestId('website2-select');
        fireEvent.change(selectTwo, { target: { value: '1' } });

        await waitFor(() => {
            expect(screen.queryByText('Live')).toBeDefined();
            expect(screen.queryByText('Hospitality')).toBeDefined();
            expect(screen.queryByText('70.70%')).toBeDefined();
            expect(screen.queryByText('Retail and Consumer Goods')).toBeDefined();
            expect(screen.queryByText('96.96%')).toBeDefined();
            expect(screen.queryByText('71.42%')).toBeDefined();
            expect(screen.queryByText('14')).toBeDefined();
            expect(screen.queryByText('13')).toBeDefined();
        });

        const websiteTwoState = mockResults[1];
        expect(websiteTwoState).toEqual({
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
                zeroShotDomainClassification: [
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
            }
        });
    });
})