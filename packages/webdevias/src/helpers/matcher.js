const specialCharsRegex = /[.*+?^${}()|[\]\\]/g
const whitespacesRegex = /\s+/
function escapeRegexCharacters (str) {
  return str.replace(specialCharsRegex, '\\$&')
}

export const match = (text, query) => {
  return (
    query
      .trim()
      .split(whitespacesRegex)
      .filter((word) => {
        return word.length > 0
      })
      .reduce((result, word) => {
        const wordLen = word.length
        const regex = new RegExp(escapeRegexCharacters(word), 'i')
        let index = text.match(regex)
        if (index) {
          index = index.index
        } else {
          index = -1
        }
        if (index > -1) {
          result.push([index, index + wordLen])
          text =
            text.slice(0, index) +
            new Array(wordLen + 1).join(' ') +
            text.slice(index + wordLen)
        }
        
        return result
      }, [])
      .sort((match1, match2) => {
        return match1[0] - match2[0]
      })
  )
  
}
