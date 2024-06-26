import { Injectable } from '@nestjs/common';

// Services
import { RobotsService } from './robots/robots.service';
import { ScrapeMetadataService } from './scrape-metadata/scrape-metadata.service';
import { ScrapeStatusService } from './scrape-status/scrape-status.service';
import { IndustryClassificationService } from './industry-classification/industry-classification.service';
import { ScrapeLogoService } from './scrape-logo/scrape-logo.service';
import { ScrapeImagesService } from './scrape-images/scrape-images.service';
// Models
import { ErrorResponse, RobotsResponse, Metadata, IndustryClassification } from './models/ServiceModels';

@Injectable()
export class ScraperService {
  constructor(
    private readonly robotsService: RobotsService,
    private readonly metadataService: ScrapeMetadataService,
    private readonly scrapeStatusService: ScrapeStatusService,
    private readonly industryClassificationService: IndustryClassificationService,
    private readonly scrapeLogoService: ScrapeLogoService,
    private readonly scrapeImagesService: ScrapeImagesService,
  ) {}

  async scrape(url: string) {
    const start = performance.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = {
      url: '',
      domainStatus: '' ,
      robots: null as RobotsResponse | ErrorResponse | null,
      metadata: null as Metadata | ErrorResponse | null,
      industryClassification: null as IndustryClassification | null,
      logo: '',
      images: [],
      slogan: '',
      time: 0,
    };

    // validate url

    data.url = url;

    // scrape robots.txt file & url validation
    // scrape web status - live, parked, under construction
    const robotsPromise = this.robotsService.readRobotsFile(data.url);
    const statusPromise = this.scrapeStatusService.scrapeStatus(data.url);

    const [robotsResponse, status] = await Promise.all([robotsPromise, statusPromise]);
    data.domainStatus = status;

    // blocking - check for error response
    // some kind of retry mechanism here?
    if ("errorStatus" in robotsResponse) {
      data.robots = robotsResponse as ErrorResponse;
      return data;
    }

    data.robots = robotsResponse as RobotsResponse;

    // scrape metadata & html - can we do this in parallel?
    // metadata checks if url is allowed to be scraped
    const metadataResponse = await this.metadataService.scrapeMetadata(data.url, data.robots);
    if ("errorStatus" in metadataResponse) {
      data.metadata = {
        title: null,
        description: null,
        keywords: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
      } as Metadata;
    } else {
      data.metadata = metadataResponse as Metadata;
    }

    // classify industry based on metadata and domain name
    const industryClassificationPromise = this.industryClassificationService.classifyIndustry(data.url, data.metadata);
    

    // scrape logo
    const logoPromise = this.scrapeLogoService.scrapeLogo(data.url, data.metadata, data.robots);

    // scrape images - doesn't use metadata -- need to check if scraping images is allowed
    const imagesPromise = this.scrapeImagesService.scrapeImages(data.url, data.robots);

    const [industryClassification, logo, images] = await Promise.all([industryClassificationPromise, logoPromise, imagesPromise]);    
    data.industryClassification = industryClassification;
    data.logo = logo;
    data.images = images;

    // scrape slogan

    // scrape images

    // do we want to perform analysis in the scraper service? - probably not

    const end = performance.now();
    const time = (end-start)/1000;
    data.time=parseFloat(time.toFixed(2));

    return data;
  }

  scrapeUrls(urls: string[]) { 
    // scrape multiple urls in parallel
    // return data
  };

  async readRobotsFile(url: string) {
    return this.robotsService.readRobotsFile(url);
  }

  async scrapeMetadata(url: string) {
    const robotsResponse = await this.robotsService.readRobotsFile(url);
    if ("errorStatus" in robotsResponse) {
      return robotsResponse;
    }

    return this.metadataService.scrapeMetadata(robotsResponse.baseUrl, robotsResponse as RobotsResponse);
  }

  async scrapeStatus(url: string) {
    return this.scrapeStatusService.scrapeStatus(url);
  }

  async classifyIndustry(url: string) {
    const metadataResponse = await this.scrapeMetadata(url);
    if ("errorStatus" in metadataResponse) {
      return metadataResponse;
    }
    return this.industryClassificationService.classifyIndustry(url, metadataResponse);
  }

  async scrapeLogo(url: string) {
    const robotsResponse = await this.robotsService.readRobotsFile(url);
    if ("errorStatus" in robotsResponse) {
      return robotsResponse;
    }
    const metadataResponse = await this.metadataService.scrapeMetadata(robotsResponse.baseUrl, robotsResponse as RobotsResponse);
    if ("errorStatus" in metadataResponse) {
      return metadataResponse;
    }
    return this.scrapeLogoService.scrapeLogo(url, metadataResponse, robotsResponse);
  }

  async scrapeImages(url: string) {
    const robotsResponse = await this.robotsService.readRobotsFile(url);
    if ("errorStatus" in robotsResponse) {
      return robotsResponse;
    }
    const metadataResponse = await this.metadataService.scrapeMetadata(robotsResponse.baseUrl, robotsResponse as RobotsResponse);
    if ("errorStatus" in metadataResponse) {
      return metadataResponse;
    }
    return this.scrapeImagesService.scrapeImages(url, robotsResponse);
  }
}
