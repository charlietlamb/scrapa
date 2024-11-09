import { UrlScraper } from './url-scraper'

export async function scrapeUrls(searchTerm: string, maxPages = 100) {
  const scraper = new UrlScraper({
    searchTerm,
    maxPages,
    outputFile: `ouptut.txt`,
    searchEngine: 'google',
    save: false,
  })

  try {
    await scraper.init()
    const urls = await scraper.scrapeUrls()
    console.log(`Successfully scraped ${urls.length} unique URLs`)
    return urls
  } catch (error) {
    console.error('Error during scraping:', error)
  } finally {
    await scraper.close()
  }
}
