import { Injectable } from '@nestjs/common';
import { RobotsResponse } from '../models/ServiceModels';
import * as puppeteer from 'puppeteer';


@Injectable()
export class ScrapeImagesService {
   /**
     * Scrapes images from the given URL.
     * @param url - The URL to scrape images from.
     * @returns {Promise<string[]>} - Returns a promise that resolves to an array of image URLs.
     */
   async scrapeImages(url: string, robots: RobotsResponse, browser: puppeteer.Browser): Promise<string[]> {
    // Possible improvement: scrape current URL first, if no images found, scrape root URL
    // Check if the URL is allowed to be scraped
    if (!robots.isUrlScrapable) {
        console.error('Crawling not allowed for this URL, cannot scrape images');
        return [];
    }

    // proxy authentication
    const username = process.env.PROXY_USERNAME;
    const password = process.env.PROXY_PASSWORD;

    if (!username || !password) {
        console.error('Proxy username or password not set');
        return [];
    }

    let page;
    
    try {
        page = await browser.newPage();
        
        // authenticate page with proxy
        await page.authenticate({
            username,
            password,
        });

        await page.goto(url);
        const imageUrls = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).map((img: HTMLImageElement) => img.src);
        });
        return imageUrls.slice(0, 50);
    } catch (error) {
      console.error(`Failed to scrape images: ${error.message}`);
        return [];
    } finally {
        if (page) {
            await page.close();
        }
    }
}
}
