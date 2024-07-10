import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class SeoAnalysisService {
  async seoAnalysis(url: string) {
    const htmlContent = await this.fetchHtmlContent(url);

    const [
      titleTagsAnalysis,
      metaDescriptionAnalysis,
      headingAnalysis,
      imageAnalysis,
    ] = await Promise.all([
      this.analyzeMetaDescription(htmlContent, url),
      this.analyzeTitleTag(htmlContent),
      this.analyzeHeadings(htmlContent),
      this.analyzeImageOptimization(htmlContent, url),
    ]);

    return {
      titleTagsAnalysis,
      metaDescriptionAnalysis,
      headingAnalysis,
      imageAnalysis,
    };
  }

  async analyzeMetaDescription(htmlContent: string, url: string) {
    const $ = cheerio.load(htmlContent);
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const length = metaDescription.length;
    const isOptimized = length >= 120 && length <= 160;

    const urlWords = this.extractWordsFromUrl(url);
    const isUrlWordsInDescription = this.areUrlWordsInDescription(urlWords, metaDescription);

    let recommendations = '';
    if (!isOptimized) {
      recommendations += 'Meta description length should be between 120 and 160 characters. ';
    }
    if (!isUrlWordsInDescription) {
      recommendations += `Consider including words from the URL in the meta description: ${urlWords.join(' ')}. `;
    }

    return {
      metaDescription,
      length,
      isOptimized,
      isUrlWordsInDescription,
      recommendations: recommendations.trim(),
    };
  }

  extractWordsFromUrl(url: string): string[] {
    const mainUrlPart = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
    return mainUrlPart.split(/[^a-zA-Z0-9]+/).filter(word => word.length > 0);
  }

  areUrlWordsInDescription(urlWords: string[], description: string): boolean {
    const lowerDescription = description.toLowerCase();
    return urlWords.every(word => lowerDescription.includes(word.toLowerCase()));
  }

  async fetchHtmlContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching HTML from ${url}: ${error.message}`);
    }
  }

  async analyzeTitleTag(htmlContent: string) {
    const $ = cheerio.load(htmlContent);
    const titleTag = $('title').text();
    const length = titleTag.length;
    const isOptimized = length >= 50 && length <= 60;
    const recommendations = isOptimized ? '' : 'Title tag length should be between 50 and 60 characters.';

    return {
      titleTag,
      length,
      isOptimized,
      recommendations,
    };
  }

  async analyzeHeadings(htmlContent: string) {
    const $ = cheerio.load(htmlContent);
    const headings = $('h1, h2, h3, h4, h5, h6').toArray().map(el => $(el).text().trim());
    const count = headings.length;
    const recommendations = count > 0 ? '' : 'No headings (H1-H6) found. Add headings to improve structure.';

    return {
      headings,
      count,
      recommendations,
    };
  }

  async analyzeImageOptimization(htmlContent: string, baseUrl: string) {
    const $ = cheerio.load(htmlContent);
    const images = $('img').toArray();

    let missingAltTextCount = 0;
    let nonOptimizedCount = 0;
    const totalImages = images.length;
    const reasonsMap = {
      format: 0,
      size: 0,
    };
    const errorUrls: string[] = [];

    for (const [index, img] of images.entries()) {
      const altText = $(img).attr('alt') || '';
      let src = $(img).attr('src') || '';

      if (!altText) {
        missingAltTextCount++;
      }

      // Check if src is a relative path
      if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
        try {
          // Construct absolute URL dynamically using base URL
          const imageUrl = new URL(src, baseUrl).toString();

          const { optimized, reasons } = await this.isImageOptimized(imageUrl);
          if (!optimized) {
            nonOptimizedCount++;
            reasons.forEach(reason => {
              if (reason.includes('format')) reasonsMap.format++;
              if (reason.includes('size')) reasonsMap.size++;
            });
            errorUrls.push(`Error optimizing image: ${src}. ${reasons.join(', ')}`);
          }
        } catch (error) {
          console.error(`Error checking optimization for image ${src}: ${error.message}`);
          nonOptimizedCount++;
          errorUrls.push(`Error checking optimization for image: ${src}. Error: ${error.message}`);
        }
      }
    }

    let recommendations = '';
    if (missingAltTextCount > 0) {
      recommendations += `Some images are missing alt text. `;
    }
    if (nonOptimizedCount > 0) {
      recommendations += `Some images are not optimized. `;
    }

    return {
      totalImages,
      missingAltTextCount,
      nonOptimizedCount,
      reasonsMap,
      recommendations: recommendations.trim(),
      errorUrls,
    };
  }

  async isImageOptimized(imageUrl: string): Promise<{ optimized: boolean; reasons: string[] }> {
    try {
      // Check if the URL ends with a supported image format
      if (!/\.(png|jpe?g|webp|svg)$/i.test(imageUrl)) {
        return {
          optimized: true,
          reasons: [],
        };
      }

      // Attempt to fetch image info with GET request
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer', // Ensure we receive binary data
      });

      const contentType = response.headers['content-type'];
      const contentLength = Number(response.headers['content-length']);

      const reasons: string[] = [];

      // Check if image is in a web-friendly format
      if (!contentType || !contentType.startsWith('image/')) {
        reasons.push('format');
      }

      // Check if image size exceeds 200 KB
      if (contentLength && contentLength > 200 * 1024) {
        reasons.push('size');
      }

      const optimized = reasons.length === 0;

      return {
        optimized,
        reasons,
      };
    } catch (error) {
      console.error(`Error checking optimization for image ${imageUrl}: ${error.message}`);
      return {
        optimized: false,
        reasons: [],
      };
    }
  }
}
