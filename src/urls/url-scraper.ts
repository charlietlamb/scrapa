import puppeteer, { Browser, Page } from 'puppeteer'
import fs from 'fs/promises'

interface ScraperOptions {
  searchTerm: string
  maxPages?: number
  outputFile?: string
  searchEngine?: 'google' | 'bing'
  save?: boolean
}

export class UrlScraper {
  private browser: Browser | null = null
  private searchEngines = {
    google: {
      url: 'https://www.google.com/search',
      resultSelector: 'div.g a[href^="http"]',
      nextPageSelector: '#pnnext',
    },
    bing: {
      url: 'https://www.bing.com/search',
      resultSelector: '#b_results .b_algo h2 a[href^="http"]',
      nextPageSelector: 'a.sb_pagN',
    },
  }

  constructor(private options: ScraperOptions) {
    this.options = {
      maxPages: 10,
      outputFile: `urls-${Date.now()}.txt`,
      searchEngine: 'google',
      save: true,
      ...options,
    }
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: 'shell',
    })
  }

  private async extractUrls(page: Page): Promise<string[]> {
    const engine = this.searchEngines[this.options.searchEngine!]

    return page.evaluate((selector) => {
      const links = document.querySelectorAll(selector)
      return Array.from(links)
        .map((link) => link.getAttribute('href'))
        .filter(Boolean) as string[]
    }, engine.resultSelector)
  }

  private getSearchUrl(page: number): string {
    const engine = this.searchEngines[this.options.searchEngine!]
    const searchParams = new URLSearchParams({
      q: this.options.searchTerm,
      start: ((page - 1) * 10).toString(),
    })

    return `${engine.url}?${searchParams.toString()}`
  }

  async scrapeUrls(): Promise<string[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.')
    }

    const allUrls: Set<string> = new Set()
    const page = await this.browser.newPage()

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (
        ['image', 'stylesheet', 'font', 'media'].includes(
          request.resourceType()
        )
      ) {
        request.abort()
      } else {
        request.continue()
      }
    })

    try {
      for (
        let currentPage = 1;
        currentPage <= this.options.maxPages!;
        currentPage++
      ) {
        console.log(`Scraping page ${currentPage}...`)

        // Navigate to search page
        await page.goto(this.getSearchUrl(currentPage), {
          waitUntil: 'networkidle0',
          timeout: 30000,
        })

        // Extract URLs from current page
        const urls = await this.extractUrls(page)
        urls.forEach((url) => allUrls.add(url))

        // Save progress after each page
        if (this.options.save) {
          await this.saveUrls(Array.from(allUrls))
        }

        // Check for next page
        const engine = this.searchEngines[this.options.searchEngine!]
        const hasNextPage = await page.$(engine.nextPageSelector)
        if (!hasNextPage) {
          console.log('No more pages available')
          break
        }

        // Add a delay to avoid detection
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 2000 + 1000)
        )
      }

      return Array.from(allUrls)
    } finally {
      await page.close()
    }
  }

  private async saveUrls(urls: string[]): Promise<void> {
    await fs.writeFile(this.options.outputFile!, urls.join('\n'), 'utf-8')
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }
}
