import { SCRAPER_BASE_URL } from '../constants'
import { getEmails } from '../emails/get-emails'

export async function scrapeContent(urls: string[]) {
  const emails: string[] = []
  const emailPromises = urls.map(async (url) => {
    const response = await fetch(`${SCRAPER_BASE_URL}${url}`)
    const pageContent = await response.text()
    const pageEmails = getEmails(pageContent)
    return pageEmails
  })

  const allEmails = await Promise.all(emailPromises)
  allEmails.forEach((pageEmails) => {
    if (pageEmails.length > 0) {
      console.log(`Found ${pageEmails.length} emails`)
      emails.push(...pageEmails)
    }
  })
  return emails
}
