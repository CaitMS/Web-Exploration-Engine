import { Injectable } from '@nestjs/common';
import { RobotsResponse, ErrorResponse } from '../models/ServiceModels';
import * as puppeteer from 'puppeteer';


@Injectable()
export class ScreenshotService {
  async captureScreenshot(url: string, robots: RobotsResponse, browser: puppeteer.Browser): Promise<{ screenshot: string } | ErrorResponse> {
    if (!robots.isUrlScrapable) {
      return {
        errorStatus: 403,
        errorCode: '403 Forbidden',
        errorMessage: 'Not allowed to scrape this URL',
      } as ErrorResponse;
    }

    // proxy authentication
    const username = process.env.PROXY_USERNAME;
    const password = process.env.PROXY_PASSWORD;

    if (!username || !password) {
      return {
        errorStatus: 500,
        errorCode: '500 Internal Server Error',
        errorMessage: 'Proxy username or password not set',
      } as ErrorResponse;
    }

    let page;

    try {
      page = await browser.newPage();

      // authenticate page with proxy
      await page.authenticate({
        username,
        password,
      });

      await page.goto(url, { waitUntil: 'networkidle2' });
      const screenshotBuffer = await page.screenshot({ fullPage: true });

      // Convert the screenshot to base64
      const screenshotBase64 = screenshotBuffer.toString('base64');
      console.log("Screenshot", url, typeof screenshotBase64); 

      return { screenshot: screenshotBase64 };

    } catch (error) {
      console.error('Failed to capture screenshot', error);
      return {
        screenshot: '',
      } 
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}
