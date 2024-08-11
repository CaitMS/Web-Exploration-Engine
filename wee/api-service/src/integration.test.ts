import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ScraperModule } from './scraper/scraper.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PubSubService } from './pub-sub/pub_sub.service';

jest.mock('ioredis', () => {
  class MockRedis {}
  return { default: jest.fn().mockImplementation(() => new MockRedis()) };
});

jest.mock('cache-manager-redis-yet', () => ({
  redisStore: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    keys: jest.fn(),
  })),
}));

// Mock implementation of PubSubService
const mockPubSubService = {
  publish: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  publishMessage: jest.fn().mockResolvedValue(undefined),
};

describe('ScraperController', () => {
  let app: INestApplication;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ScraperModule, ConfigModule.forRoot()],
    })
    .overrideProvider(ConfigService)
    .useValue({
      get: jest.fn((key: string) => {
        switch (key) {
          case 'redis.host':
            return 'localhost';
          case 'redis.port':
            return 6379;
          case 'redis.password':
            return 'testPassword';
          default:
            return null;
        }
      }),
    })
    .overrideProvider(PubSubService)
    .useValue(mockPubSubService)
    .compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    await app.init();
  }, 60000); 

  afterAll(async () => {
    await app.close();
  }, 60000);

  describe('/GET scraper', () => {
    it('should publsih a scrape task successfully', async () => {
      const url = 'https://example.com';
      
      // Make a request to the scraper endpoint
      const response = await request(app.getHttpServer())
        .get('/scraper?url=' + (url))
        .expect(HttpStatus.OK)

      // Check that the response is defined
      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/^\/status\?type=scrape(&.*)?$/); 
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/read-robots', () => {
    it('should publish a read-robots task successuly', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/read-robots?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/read-robots\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/read-robots')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/read-robots?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/scrape-metadata', () => {
    it('should scrape metadata successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-metadata?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/scrape-metadata\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-metadata')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-metadata?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/scrape-status', () => {
    it('should return status successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-status?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/scrape-status\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-status')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-status?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/classify-industry', () => {
    it('should classify industry successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/classify-industry?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/classify-industry\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/classify-industry')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/classify-industry?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/scrape-images', () => {
    it('should scrape images successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-images?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/scrape-images\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-images')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-images?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/scrape-logo', () => {
    it('should scrape logo successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-logo?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/scrape-logo\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-logo')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-logo?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/screenshot', () => {
    it('should get screenshot successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/screenshot?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/screenshot\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/screenshot')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/screenshot?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/scrape-contact-info', () => {
    it('should scrape contact info successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-contact-info?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/scrape-contact-info\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-contact-info')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-contact-info?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/scrape-addresses', () => {
    it('should scrape addresses successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-addresses?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/scrape-addresses\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-addresses')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/scrape-addresses?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  describe('/GET scraper/seo-analysis', () => {
    it('should perform SEO analysis successfully', async () => {
      const url = 'https://example.com';
      const response = await request(app.getHttpServer())
        .get('/scraper/seo-analysis?url=' + encodeURIComponent(url))
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();

      // Check that the response contains the expected properties
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('pollingUrl');
      expect(response.body.pollingUrl).toMatch(/status\/seo-analysis\//);
    });

    it('should return an error if no URL is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/seo-analysis')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('URL is required');
    });

    it('should return an error if the URL is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/scraper/seo-analysis?url=invalid-url')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toEqual('Invalid URL format');
    });
  });

  // describe('/GET read-robots', () => {
  //   it('should read robots.txt successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/read-robots?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .expect('Content-Type', /json/)
  //       .timeout(60000);

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });

  // describe('/GET scrape-metadata', () => {
  //   it('should scrape metadata successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/scrape-metadata?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .expect('Content-Type', /json/)
  //       .timeout(60000);

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });



  // describe('/GET classify-industry', () => {
  //   it('should classify industry successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/classify-industry?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .expect('Content-Type', /json/)
  //       .timeout(60000);

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });

  // describe('/GET scrape-images', () => {
  //   it('should scrape images successfully', async () => {
  //     const url = 'https://example.com';
  //     try {
  //       const response = await request(app.getHttpServer())
  //         .get('/scraper/scrape-images?url=' + encodeURIComponent(url))
  //         .expect(HttpStatus.OK)
  //         .expect('Content-Type', /json/)
  //         .timeout(60000);
  
  //       expect(response.body).toBeDefined();
  //     } catch (error) {
  //       console.error('Error in scrape-images test:', error.message);
  //       throw error;
  //     }
  //   }, 60000);
  // });

  // describe('/GET scrape-status', () => {
  //   it('should return status successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/scrape-status?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .timeout(60000)
  //       .catch(err => {
  //         if (err.response) {
  //           console.error('Error Response:', err.response.text);
  //         }
  //         throw err;
  //       });

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });

  // describe('/GET scrape-logo', () => {
  //   it('should scrape logo successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/scrape-logo?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .timeout(60000)
  //       .catch(err => {
  //         if (err.response) {
  //           console.error('Error Response:', err.response.text);
  //         }
  //         throw err;
  //       });

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });


  // describe('/GET screenshot', () => {
  //   it('should get screenshot successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/screenshot?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .expect('Content-Type', /json/)
  //       .timeout(60000);

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });

  // describe('/GET scrape-contact-info', () => {
  //   it('should scrape contact info successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/scrape-contact-info?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .expect('Content-Type', /json/)
  //       .timeout(60000);

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });

  // describe('/GET scrape-addresses', () => {
  //   it('should scrape addresses successfully', async () => {
  //     const url = 'https://example.com';
  //     const response = await request(app.getHttpServer())
  //       .get('/scraper/scrape-addresses?url=' + encodeURIComponent(url))
  //       .expect(HttpStatus.OK)
  //       .expect('Content-Type', /json/)
  //       .timeout(60000);

  //     expect(response.body).toBeDefined();
  //   }, 60000);
  // });
});