export function getEmails(pageContent: string) {
  const emails = pageContent.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  )
  const uniqueEmails = [...new Set(emails)]
  return uniqueEmails
}
