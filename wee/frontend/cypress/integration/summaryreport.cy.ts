describe('summaryreport', () => {
  it('should be on right page', () => {
    cy.visit('/summaryreport');
    cy.contains(/Summary Report/i).should('exist');

       //Page Section : General Statistics
       cy.get('[data-testid="visual-scraped-stats"]').should('exist');
       cy.get('[data-testid="visual-scraped-stats"]').should('be.visible');
       cy.get('[data-testid="visual-scraped-stats"]').screenshot('visual-scraped-stats');
 
       cy.get('[data-testid="visual-crawlable-stats"]').should('exist');
       cy.get('[data-testid="visual-crawlable-stats"]').should('be.visible');
       cy.get('[data-testid="visual-crawlable-stats"]').screenshot('visual-crawlable-stats');
 
       cy.get('[data-testid="visual-avg-scrape-stats"]').should('exist');
       cy.get('[data-testid="visual-avg-scrape-stats"]').should('be.visible');
       cy.get('[data-testid="visual-avg-scrape-stats"]').screenshot('visual-avg-scrape-stats');
 
       cy.get('[data-testid="visual-industry-classification"]').should('exist');
       cy.get('[data-testid="visual-industry-classification"]').should('be.visible');
       cy.get('[data-testid="visual-industry-classification"]').screenshot('visual-industry-classification');
 
       cy.get('[data-testid="visual-domain-match"]').should('exist');
       cy.get('[data-testid="visual-domain-match"]').should('be.visible');
       cy.get('[data-testid="visual-domain-match"]').screenshot('visual-domain-match');
 

  });

  it('general layout should be consistent', () => {
    cy.testLayout('/summaryreport');
  });
  
  it('summary report for multiple urls - github, insecure', () => {
    cy.visit('/');
    cy.get('[data-testid="scraping-textarea-home"]').type('https://github.com,https://www.hbo.com/insecure');
    cy.get('[data-testid="btn-start-scraping"]').click();
      
    cy.fixture('/pub-sub/github-done')
      .as('mock_scraper_github')
      .then((mock_scraper_github) => {
        cy.intercept(
          'GET',
          'http://localhost:3002/api/scraper?url=https%3A%2F%2Fgithub.com',
          mock_scraper_github
        ).as('mock_scraper_github_done');
      });
      
    cy.fixture('/pub-sub/github-done')
      .as('mock_scraper_github')
      .then((mock_scraper_github) => {
        cy.intercept(
          'GET',
          'http://localhost:3002/api/scraper?url=https%3A%2F%2Fwww.hbo.com%2Finsecure',
          mock_scraper_github
        ).as('mock_scraper_insecure_done');
      });

    // Mock response to Pub Sub Polling
    cy.fixture('/pub-sub/insecure-status')
      .as('mock_scraper_insecure_status')
      .then((mock_scraper_insecure_status) => {
        cy.intercept(
          'GET',
          'http://localhost:3002/api/scraper/status/scrape/https%3A%2F%2Fwww.hbo.com%2Finsecure',
          mock_scraper_insecure_status
        ).as('mock_scraper_insecure_status');
      });
      
    cy.fixture('/pub-sub/github-status')
      .as('mock_scraper_github_status')
      .then((mock_scraper_github_status) => {
        cy.intercept(
          'GET',
          'http://localhost:3002/api/scraper/status/scrape/https%3A%2F%2Fgithub.com',
          mock_scraper_github_status
        ).as('mock_scraper_github_status');
      });

    cy.fixture('/pub-sub/insecure-waiting')
      .as('mock_scraper_insecure_waiting')
      .then((mock_scraper_insecure_waiting) => {
        cy.intercept(
          'GET',
          'http://localhost:3002/api/scraper/status?type=scrape&url=https%3A%2F%2Fwww.hbo.com%2Finsecure',
          mock_scraper_insecure_waiting
        ).as('mock_scraper_insecure_waiting');
      });
      
    cy.fixture('/pub-sub/github-waiting')
      .as('mock_scraper_github_waiting')
      .then((mock_scraper_github_waiting) => {
        cy.intercept(
          'GET',
          'http://localhost:3002/api/scraper/status?type=scrape&url=https%3A%2F%2Fgithub.com',
          mock_scraper_github_waiting
        ).as('mock_scraper_github_waiting');
      });
      
    cy.wait('@mock_scraper_github_done');
    cy.wait('@mock_scraper_insecure_done');

    //Wait 5 Seconds
    //THen check if the text insecure and github exist on the page

    // Assert that the URL is the scraperesults URL
    cy.url().should('include', 'scraperesults');

    //mocking now done - go to home page
    /* cy.get('[data-testid="btn-report-summary"]').should('exist')
    cy.get('[data-testid="btn-report-summary"]').click();
    cy.url().should('include', 'summary'); */


  });

  
});
