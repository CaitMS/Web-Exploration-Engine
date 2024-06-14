import { Injectable } from '@nestjs/common';

// Services
import { RobotsService } from './robots/robots.service';
import { ScrapeMetadataService } from './scrape-metadata/scrape-metadata.service';
import { ScrapeStatusService } from './scrape-status/scrape-status.service';
// Models
import { ErrorResponse, RobotsResponse, Metadata } from './models/ServiceModels';

@Injectable()
export class ScraperService {
  constructor(
    private readonly robotsService: RobotsService,
    private readonly metadataService: ScrapeMetadataService,
    private readonly scrapeStatusService: ScrapeStatusService,
  ) {}

  async scrape(url: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data:any;

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
      data.robotsError = robotsResponse as ErrorResponse;
      return data;
    }

    data.robots = robotsResponse as RobotsResponse;

    // scrape metadata & html - can we do this in parallel?
    const metadataResponse = await this.metadataService.scrapeMetadata(data.url, data.robots);
    if ("errorStatus" in metadataResponse) {
      data.metadataError = {
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


    // classify industry based on metadata

    // classify industry based on domain name - for domain match

    // scrape logo

    // scrape slogan

    // scrape images

    // do we want to perform analysis in the scraper service? - probably not

    return data;
  }

  async readRobotsFile(url: string) {
    return this.robotsService.readRobotsFile(url);
  }

  async scrapeMetadata(url: string) {
    const robotsResponse = await this.robotsService.readRobotsFile(url);
    if ("errorStatus" in robotsResponse) {
      return robotsResponse;
    }

    return this.metadataService.scrapeMetadata(url, robotsResponse as RobotsResponse);
  }

  async scrapeStatus(url: string) {
    return this.scrapeStatusService.scrapeStatus(url);
  }

  // async scrapeMetadata(url: string) {
  //   const data = {
  //     url: '',
  //     robots: {} as RobotsResponse | ErrorResponse,
  //     metadata: {} as Metadata | ErrorResponse,
  //   };

  //   // Should we we validate the URL here?
  //   data.url = url;
  //   // Get allowed paths, baseUrl and isBaseUrlAllowed
  //   let response:any = await this.robotsService.getAllowedPaths(data.url);
  //   if ("status" in response) {
  //     data.robots = response as ErrorResponse;
  //   } else {  
  //     data.robots = response as RobotsResponse;
  //   }

  //   response = await this.metadataService.scrapeMetadata(url, data.robots);
  //   console.log(response);
  //   if ("status" in response) {
  //     data.metadata = response as ErrorResponse;
  //   } else {
  //     data.metadata = response as Metadata;
  //   }
    
  //   return data;
  // }
}
