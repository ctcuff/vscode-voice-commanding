/**
 * Takes a sentence or string containing a number as a string (like "9" or "nine")
 * and extracts the first occurrence of that number.
 */
export const parseNumberFromPhrase = (text: string): number => {
  // Simple single string numbers like "one" through "nine" can be quickly parsed
  const parsedNumber = wordToNumber(text)

  if (!Number.isNaN(parsedNumber)) {
    return parsedNumber
  }

  const match = text.match(/\d+/)

  if (match && match[0]) {
    return parseInt(match[0], 10)
  }

  return Number.NaN
}

// The speech to text SDK usually returns words as numbers
// if they're in the range 0 - 9
export const wordToNumber = (word: string): number => {
  word = word.toLocaleLowerCase()

  switch (word) {
    case 'zero':
      return 0
    case 'one':
      return 1
    case 'two':
      return 2
    case 'three':
      return 3
    case 'four':
      return 4
    case 'five':
      return 5
    case 'six':
      return 6
    case 'seven':
      return 7
    case 'eight':
      return 8
    case 'nine':
      return 9
  }

  return Number.NaN
}
