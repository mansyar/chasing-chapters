/**
 * Highlights search terms in text
 */
export function highlightSearchTerms(
  text: string,
  query: string,
  highlightClass: string = 'bg-yellow-200 font-semibold'
): string {
  if (!query.trim() || !text) {
    return text
  }

  // Split query into individual terms and filter out empty strings
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0)

  if (searchTerms.length === 0) {
    return text
  }

  // Create a regex pattern that matches any of the search terms
  // Use word boundaries for better matching
  const pattern = searchTerms
    .map(term => escapeRegExp(term))
    .join('|')
  
  const regex = new RegExp(`\\b(${pattern})`, 'gi')

  return text.replace(regex, `<mark class="${highlightClass}">$1</mark>`)
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extracts relevant text snippets around search terms
 */
export function extractSnippets(
  text: string,
  query: string,
  snippetLength: number = 150,
  maxSnippets: number = 2
): string[] {
  if (!query.trim() || !text) {
    return [text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '')]
  }

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0)

  if (searchTerms.length === 0) {
    return [text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '')]
  }

  const snippets: string[] = []
  const lowerText = text.toLowerCase()
  
  // Find positions of search terms
  const positions: number[] = []
  
  searchTerms.forEach(term => {
    let index = 0
    while ((index = lowerText.indexOf(term, index)) !== -1) {
      positions.push(index)
      index += term.length
    }
  })

  if (positions.length === 0) {
    return [text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '')]
  }

  // Sort positions and remove duplicates
  const uniquePositions = [...new Set(positions)].sort((a, b) => a - b)
  
  // Group nearby positions and create snippets
  let currentGroup: number[] = []
  const groups: number[][] = []
  
  uniquePositions.forEach(pos => {
    if (currentGroup.length === 0 || pos - currentGroup[currentGroup.length - 1] <= snippetLength / 2) {
      currentGroup.push(pos)
    } else {
      groups.push(currentGroup)
      currentGroup = [pos]
    }
  })
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  // Create snippets from groups
  groups.slice(0, maxSnippets).forEach(group => {
    const startPos = Math.max(0, group[0] - snippetLength / 4)
    const endPos = Math.min(text.length, group[group.length - 1] + snippetLength / 2)
    
    let snippet = text.substring(startPos, endPos)
    
    // Add ellipsis if needed
    if (startPos > 0) snippet = '...' + snippet
    if (endPos < text.length) snippet = snippet + '...'
    
    snippets.push(snippet)
  })

  return snippets.length > 0 ? snippets : [
    text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '')
  ]
}

/**
 * Utility function for generating highlighted text HTML
 */
export function getHighlightedTextHTML(
  text: string,
  query: string,
  className: string = ''
): string {
  const highlightedText = highlightSearchTerms(text, query)
  return `<span class="${className}">${highlightedText}</span>`
}

/**
 * Calculate search relevance score (more comprehensive version)
 */
export function calculateRelevanceScore(
  fields: Record<string, string | undefined>,
  query: string,
  weights: Record<string, number> = {}
): number {
  if (!query.trim()) return 0

  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
  let totalScore = 0

  const defaultWeights = {
    title: 10,
    author: 8,
    excerpt: 5,
    genre: 5,
    content: 2,
    ...weights
  }

  Object.entries(fields).forEach(([fieldName, fieldValue]) => {
    if (!fieldValue) return

    const weight = defaultWeights[fieldName as keyof typeof defaultWeights] || 1
    const lowerValue = fieldValue.toLowerCase()
    
    searchTerms.forEach(term => {
      // Exact phrase match bonus
      if (lowerValue.includes(query.toLowerCase())) {
        totalScore += weight * 2
      }
      
      // Individual term matches
      if (lowerValue.includes(term)) {
        // Word boundary match bonus
        const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i')
        if (wordBoundaryRegex.test(lowerValue)) {
          totalScore += weight * 1.5
        } else {
          totalScore += weight
        }
        
        // Bonus for matches at the beginning
        if (lowerValue.startsWith(term)) {
          totalScore += weight * 0.5
        }
      }
    })
  })

  return totalScore
}