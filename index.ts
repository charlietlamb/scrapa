import { scrapeContent } from './src/content/scrape-content'
import { scrapeUrls } from './src/urls/scrape-urls'
import fs from 'fs'

async function main() {
  const urls = await scrapeUrls('b2b business uk')
  if (!urls) {
    throw new Error('Failed to scrape URLs')
  }
  const emails = await scrapeContent(urls)
  fs.writeFileSync('emails.txt', emails.join('\n'))
}

main().catch(console.error)
