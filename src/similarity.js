/**
 * Similarity calculation module for ethical dilemmas
 * This module provides functions to calculate similarity between dilemmas,
 * find relevant precedents, and compare values of different types.
 */

const natural = require('natural');
const { JaroWinklerDistance } = natural;
const { 
    actionRelevanceScore, 
    calculateCosineSimilarity,
    extractDilemmaText 
} = require('./utils');

// Initialize a cache for similarity calculations to improve performance
// This is especially useful for string similarity which can be expensive
const similarityCache = {
    stringCache: {},
    hits: 0,
    misses: 0,
    
    clearCache() {
        this.stringCache = {};
        this.hits = 0;
        this.misses = 0;
    },
    
    getCacheStats() {
        return {
            hits: this.hits,
            misses: this.misses,
            ratio: this.hits / (this.hits + this.misses || 1)
        };
    }
};

// Helper function to get a cache key for strings
function getStringCacheKey(str1, str2) {
    // Sort strings to ensure consistent key regardless of argument order
    const sortedStrings = [str1, str2].sort();
    return `${sortedStrings[0]}::${sortedStrings[1]}`;
}

/**
 * Calculate similarity between two values, which could be strings, numbers, arrays, or objects
 * @param {*} value1 First value to compare
 * @param {*} value2 Second value to compare
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(value1, value2) {
    // Handle null/undefined values
    if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
        return 0;
    }
    
    // If types don't match, similarity is low but not zero
    // This allows for some flexibility in comparing different data structures
    if (typeof value1 !== typeof value2) {
        return 0.1;
    }
    
    // Handle different types
    if (typeof value1 === 'number' && typeof value2 === 'number') {
        return calculateNumericSimilarity(value1, value2);
    }

    if (typeof value1 === 'string' && typeof value2 === 'string') {
        return calculateStringSimilarity(value1, value2);
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
        return calculateArraySimilarity(value1, value2);
    }

    if (typeof value1 === 'object' && typeof value2 === 'object') {
        return calculateObjectSimilarity(value1, value2);
    }
    
    // Boolean comparisons
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
        return value1 === value2 ? 1.0 : 0.0;
    }
    
    // Default case - if we can't compare, assume low similarity
    return 0.1;
}

/**
 * Calculate similarity between two numeric values
 * @param {number} num1 First number
 * @param {number} num2 Second number
 * @returns {number} Similarity score between 0 and 1
 */
function calculateNumericSimilarity(num1, num2) {
    // Check if either value isn't actually a number
    if (isNaN(num1) || isNaN(num2)) {
        return 0;
    }
    
    // For numeric values, we determine similarity based on relative difference
    const max = Math.max(Math.abs(num1), Math.abs(num2));
    
    // Avoid division by zero
    if (max === 0) {
        return num1 === num2 ? 1 : 0;
    }
    
    const diff = Math.abs(num1 - num2);
    const relativeDiff = diff / max;
    
    // Convert to similarity score (0 to 1)
    // When the relative difference is 0, similarity is 1
    // When the relative difference is large, similarity approaches 0
    let similarity = 1 - Math.min(relativeDiff, 1);
    
    // Similarity degrades more quickly as the difference increases
    similarity = Math.pow(similarity, 1.5);
    
    return similarity;
}

/**
 * Calculate similarity between two strings
 * @param {string} str1 First string
 * @param {string} str2 Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateStringSimilarity(str1, str2) {
    // Check for empty strings
    if (!str1 || !str2) {
        return 0;
    }
    
    // Check for identical strings
    if (str1 === str2) {
        return 1;
    }
    
    // Look up in cache first
    const cacheKey = getStringCacheKey(str1, str2);
    if (similarityCache.stringCache[cacheKey] !== undefined) {
        similarityCache.hits++;
        return similarityCache.stringCache[cacheKey];
    }
    
    similarityCache.misses++;
    
    // Normalize strings to improve matching
    const normalize = (str) => {
        return str.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric with spaces
            .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
            .trim();
    };
    
    const normalizedStr1 = normalize(str1);
    const normalizedStr2 = normalize(str2);
    
    // For very short strings, use Jaro-Winkler distance which is good for names
    if (normalizedStr1.length < 10 || normalizedStr2.length < 10) {
        const score = JaroWinklerDistance(normalizedStr1, normalizedStr2);
        similarityCache.stringCache[cacheKey] = score;
        return score;
    }
    
    // For longer strings, use a combination of Levenshtein distance and semantic similarity
    const levenshteinScore = 1 - calculateLevenshteinDistance(normalizedStr1, normalizedStr2);
    
    // Calculate word overlap for semantic similarity approximation
    const words1 = normalizedStr1.split(/\s+/).filter(w => w.length > 1);
    const words2 = normalizedStr2.split(/\s+/).filter(w => w.length > 1);
    
    const semanticScore = calculateSemanticSimilarityApproximation(words1, words2);
    
    // Combine scores with higher weight to semantic similarity for longer texts
    const combinedScore = 0.3 * levenshteinScore + 0.7 * semanticScore;
    
    // Cache and return result
    similarityCache.stringCache[cacheKey] = combinedScore;
    return combinedScore;
}

/**
 * Calculate Levenshtein distance between two strings, normalized to a 0-1 range
 * @param {string} str1 First string
 * @param {string} str2 Second string
 * @returns {number} Normalized Levenshtein distance (0-1)
 */
function calculateLevenshteinDistance(str1, str2) {
    if (str1 === str2) return 0;
    
    const m = str1.length;
    const n = str2.length;
    
    // Handle empty strings
    if (m === 0) return n;
    if (n === 0) return m;
    
    // For very long strings, use an approximation to avoid performance issues
    if (m > 1000 || n > 1000) {
        // Simple approximation based on length difference and sampling
        const lengthDiff = Math.abs(m - n);
        const maxLength = Math.max(m, n);
        const lengthRatio = lengthDiff / maxLength;
        
        // Sample characters (every 10th character)
        let matchingChars = 0;
        const sampleSize = Math.min(m, n, 100); // Limit sample size
        for (let i = 0; i < sampleSize; i += 10) {
            if (str1[i] === str2[i]) matchingChars++;
        }
        
        const sampleMatches = matchingChars / (sampleSize / 10);
        return 0.7 * lengthRatio + 0.3 * (1 - sampleMatches);
    }
    
    // Full Levenshtein calculation for reasonable length strings
    let dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,     // deletion
                dp[i][j - 1] + 1,     // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    // Normalize the result to a 0-1 range
    return dp[m][n] / Math.max(m, n);
}

/**
 * Calculate semantic similarity approximation based on word overlap and position
 * @param {string[]} words1 Words from first string
 * @param {string[]} words2 Words from second string
 * @returns {number} Semantic similarity score between 0 and 1
 */
function calculateSemanticSimilarityApproximation(words1, words2) {
    if (!words1.length || !words2.length) {
        return 0;
    }
    
    // Simple terms for both strings
    const terms1 = new Set(words1);
    const terms2 = new Set(words2);
    
    // Find common words (exact matches only)
    let commonWords = 0;
    for (const word of terms1) {
        if (terms2.has(word)) {
            commonWords++;
        }
    }
    
    // Jaccard similarity (intersection / union)
    const union = terms1.size + terms2.size - commonWords;
    const jaccardScore = commonWords / union;
    
    // Containment score (what percentage of the smaller set is contained in the larger)
    const smallerSetSize = Math.min(terms1.size, terms2.size);
    const containmentScore = commonWords / smallerSetSize;
    
    // Word sequence similarity (approximate n-gram similarity)
    let sequenceSimilarity = 0;
    if (words1.length > 1 && words2.length > 1) {
        const bigrams1 = [];
        const bigrams2 = [];
        
        for (let i = 0; i < words1.length - 1; i++) {
            bigrams1.push(`${words1[i]}_${words1[i + 1]}`);
        }
        
        for (let i = 0; i < words2.length - 1; i++) {
            bigrams2.push(`${words2[i]}_${words2[i + 1]}`);
        }
        
        let commonBigrams = 0;
        for (const bigram of bigrams1) {
            if (bigrams2.includes(bigram)) {
                commonBigrams++;
            }
        }
        
        const bigramUnion = bigrams1.length + bigrams2.length - commonBigrams;
        sequenceSimilarity = commonBigrams / (bigramUnion || 1);
    }
    
    // Combined semantic score
    const semanticScore = 0.5 * jaccardScore + 0.3 * containmentScore + 0.2 * sequenceSimilarity;
    
    return semanticScore;
}

/**
 * Calculate similarity between two arrays
 * @param {Array} arr1 First array
 * @param {Array} arr2 Second array
 * @returns {number} Similarity score between 0 and 1
 */
function calculateArraySimilarity(arr1, arr2) {
    if (!arr1.length || !arr2.length) {
        return 0;
    }
    
    // Calculate matches between arrays
    let totalSimilarity = 0;
    const minLength = Math.min(arr1.length, arr2.length);
    const maxLength = Math.max(arr1.length, arr2.length);
    
    // Match elements at each position
    for (let i = 0; i < minLength; i++) {
        totalSimilarity += calculateSimilarity(arr1[i], arr2[i]);
    }
    
    // Account for difference in array lengths
    return (totalSimilarity / minLength) * (minLength / maxLength);
}

/**
 * Calculate similarity between two objects
 * @param {Object} obj1 First object
 * @param {Object} obj2 Second object
 * @returns {number} Similarity score between 0 and 1
 */
function calculateObjectSimilarity(obj1, obj2) {
    // Handle edge cases
    if (!obj1 || !obj2) {
        return 0;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length === 0 && keys2.length === 0) {
        return 1; // Two empty objects are identical
    }
    
    if (keys1.length === 0 || keys2.length === 0) {
        return 0; // One empty, one not - low similarity
    }
    
    // Find common keys and calculate similarity for matching properties
    let totalSimilarity = 0;
    let commonKeys = 0;
    
    for (const key of keys1) {
        if (key in obj2) {
            totalSimilarity += calculateSimilarity(obj1[key], obj2[key]);
            commonKeys++;
        }
    }
    
    // Handle case of no common keys
    if (commonKeys === 0) {
        return 0.1; // Some minimal similarity
    }
    
    // Average similarity across common keys, weighted by coverage
    const uniqueKeys = new Set([...keys1, ...keys2]);
    const keyCoverage = commonKeys / uniqueKeys.size;
    
    return (totalSimilarity / commonKeys) * keyCoverage;
}

/**
 * Calculate similarity between two dilemmas
 * @param {Object} dilemma1 First dilemma
 * @param {Object} dilemma2 Second dilemma
 * @returns {number} Similarity score between 0 and 1
 */
function calculateDilemmaSimilarity(dilemma1, dilemma2) {
    // Check for valid inputs
    if (!dilemma1 || !dilemma2) {
        return 0;
    }
    
    // Calculate similarity scores for different aspects of the dilemmas
    let scores = [];
    let weights = [];
    
    // Title similarity (if available)
    if (dilemma1.title && dilemma2.title) {
        scores.push(calculateStringSimilarity(dilemma1.title, dilemma2.title));
        weights.push(0.1);
    }
    
    // Description similarity (highest weight)
    if (dilemma1.description && dilemma2.description) {
        scores.push(calculateStringSimilarity(dilemma1.description, dilemma2.description));
        weights.push(0.4);
    }
    
    // Situation similarity (if available)
    if (dilemma1.situation && dilemma2.situation) {
        if (typeof dilemma1.situation === 'string' && typeof dilemma2.situation === 'string') {
            scores.push(calculateStringSimilarity(dilemma1.situation, dilemma2.situation));
            weights.push(0.2);
        } else if (typeof dilemma1.situation === 'object' && typeof dilemma2.situation === 'object') {
            // Handle situation objects
            if (dilemma1.situation.parameters && dilemma2.situation.parameters) {
                scores.push(calculateObjectSimilarity(dilemma1.situation.parameters, dilemma2.situation.parameters));
                weights.push(0.2);
            }
        }
    }
    
    // Contextual factors similarity (if available)
    if (dilemma1.contextual_factors && dilemma2.contextual_factors) {
        if (Array.isArray(dilemma1.contextual_factors) && Array.isArray(dilemma2.contextual_factors)) {
            // Calculate similarity between contextual factors
            // This is more complex as factors have names, values, and relevance
            
            const factors1 = dilemma1.contextual_factors.map(f => ({
                factor: f.factor || f.name,
                value: f.value
            }));
            
            const factors2 = dilemma2.contextual_factors.map(f => ({
                factor: f.factor || f.name,
                value: f.value
            }));
            
            // Match factors by name and compare values
            let factorSimilaritySum = 0;
            let factorCount = 0;
            
            for (const f1 of factors1) {
                const matchingFactor = factors2.find(f2 => 
                    f2.factor && f1.factor && 
                    f2.factor.toLowerCase() === f1.factor.toLowerCase()
                );
                
                if (matchingFactor) {
                    factorSimilaritySum += calculateSimilarity(f1.value, matchingFactor.value);
                    factorCount++;
                }
            }
            
            // Consider factor coverage too
            const uniqueFactorCount = new Set([
                ...factors1.map(f => f.factor?.toLowerCase()),
                ...factors2.map(f => f.factor?.toLowerCase())
            ].filter(Boolean)).size;
            
            const factorCoverage = factorCount / (uniqueFactorCount || 1);
            
            if (factorCount > 0) {
                const factorSimilarity = (factorSimilaritySum / factorCount) * factorCoverage;
                scores.push(factorSimilarity);
                weights.push(0.2);
            }
        }
    }
    
    // Actions/options similarity
    const actions1 = dilemma1.possible_actions || dilemma1.actions || [];
    const actions2 = dilemma2.possible_actions || dilemma2.actions || [];
    
    if (actions1.length > 0 && actions2.length > 0) {
        let actionSimilaritySum = 0;
        
        for (const action1 of actions1) {
            const action1Name = typeof action1 === 'string' ? action1 : (action1.name || action1.action || action1.id);
            
            let bestMatch = 0;
            for (const action2 of actions2) {
                const action2Name = typeof action2 === 'string' ? action2 : (action2.name || action2.action || action2.id);
                const similarity = calculateStringSimilarity(String(action1Name), String(action2Name));
                bestMatch = Math.max(bestMatch, similarity);
            }
            
            actionSimilaritySum += bestMatch;
        }
        
        const actionSimilarity = actionSimilaritySum / actions1.length;
        scores.push(actionSimilarity);
        weights.push(0.1);
    }
    
    // If no scores could be calculated, return low similarity
    if (scores.length === 0) {
        return 0.1;
    }
    
    // Calculate weighted average
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    
    return weightedSum / totalWeight;
}

/**
 * Find precedents relevant to a given dilemma
 * @param {Object} dilemma - The dilemma to find precedents for
 * @param {Array} precedentDatabase - Database of precedents to search
 * @param {number} threshold - Minimum similarity score (0-1) for relevance
 * @param {Object} options - Optional configuration parameters
 * @param {number} options.maxResults - Maximum number of precedents to return (default: 5)
 * @param {number} options.descriptionWeight - Weight for description similarity (default: 0.4)
 * @param {number} options.titleWeight - Weight for title similarity (default: 0.2)
 * @param {number} options.actionWeight - Weight for action similarity (default: 0.4)
 * @param {boolean} options.useMaxActionScore - Use max action score or average (default: false)
 * @returns {Array} Array of relevant precedents with similarity scores
 */
async function findRelevantPrecedents(
  dilemma, 
  precedentDatabase, 
  threshold = 0.3,
  options = {}
) {
  // Set default options
  const {
    maxResults = 5,
    descriptionWeight = 0.4,
    titleWeight = 0.2,
    actionWeight = 0.4,
    useMaxActionScore = false
  } = options;

  // Validate inputs
  if (!dilemma || !precedentDatabase || !Array.isArray(precedentDatabase)) {
    return [];
  }

  // Basic validation of dilemma structure
  if (!dilemma.description || !dilemma.title) {
    return [];
  }

  // Filter precedents to only include those with reasoning paths
  const filteredPrecedents = precedentDatabase.filter(
    p => p.reasoning_paths && Array.isArray(p.reasoning_paths) && p.reasoning_paths.length > 0
  );

  // Create an array to store relevance scores for each precedent
  const relevantPrecedents = [];

  // Iterate through each precedent in the database
  for (const precedent of filteredPrecedents) {
    // Skip precedents without a title
    if (!precedent.title) continue;

    // Calculate similarity score for each precedent based on the dilemma's description
    const descriptionSimilarity = calculateSimilarity(dilemma.description, precedent.description);

    // Calculate action relevance for each possible action against the precedent
    let maxActionRelevance = 0;
    let totalActionRelevance = 0;
    let actionCount = 0;
    
    if (dilemma.possible_actions && dilemma.possible_actions.length > 0) {
      for (const action of dilemma.possible_actions) {
        const actionId = action.id || action.action;
        if (!actionId) continue;
        
        try {
          const actionResult = await actionRelevanceScore(dilemma.description, actionId, precedent.description);
          
          // Handle both object result and direct score result
          const score = typeof actionResult === 'object' ? 
            (actionResult.boostedScore || actionResult.baseScore || 0.5) : 
            (actionResult || 0.5);
            
          maxActionRelevance = Math.max(maxActionRelevance, score);
          totalActionRelevance += score;
          actionCount++;
        } catch (error) {
          maxActionRelevance = Math.max(maxActionRelevance, 0.5); // Default on error
          totalActionRelevance += 0.5;
          actionCount++;
        }
      }
    }
    
    // Use either max or average action relevance
    const actionRelevance = useMaxActionScore ? 
      maxActionRelevance : 
      (actionCount > 0 ? totalActionRelevance / actionCount : 0.5);

    // Calculate title similarity
    const titleSimilarity = calculateSimilarity(dilemma.title, precedent.title);
    
    // Calculate total similarity score with the weighted formula
    const totalSimilarityScore = (
      descriptionWeight * descriptionSimilarity + 
      titleWeight * titleSimilarity +
      actionWeight * actionRelevance
    );

    // Only include precedents with similarity above the threshold
    if (totalSimilarityScore >= threshold) {
      // Add the full precedent object with similarity scores
      const precedentWithScore = {
        ...precedent,  // Include all properties from the original precedent
        totalSimilarityScore,
        descriptionSimilarity,
        titleSimilarity,
        actionRelevance
      };
      relevantPrecedents.push(precedentWithScore);
    }
  }

  // Sort precedents by similarity score (highest first)
  relevantPrecedents.sort((a, b) => b.totalSimilarityScore - a.totalSimilarityScore);

  // Return top N results
  return relevantPrecedents.slice(0, maxResults);
}

/**
 * Find the best match for a contextual factor from a list of factors
 * @param {Object} factor - The factor to match
 * @param {Array} contextualFactors - Array of contextual factors to search
 * @returns {Object|null} The best matching factor or null if no match
 */
function findBestContextualFactorMatch(factor, contextualFactors) {
  if (!factor || !factor.factor || !contextualFactors || !Array.isArray(contextualFactors)) {
    return null;
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const cf of contextualFactors) {
    if (!cf.factor) continue;
    
    // Try exact match first
    if (cf.factor.toLowerCase() === factor.factor.toLowerCase()) {
      return cf; // Perfect match
    }
    
    // Otherwise calculate string similarity
    const score = calculateStringSimilarity(cf.factor, factor.factor);
    if (score > bestScore && score > 0.7) { // Only consider strong matches
      bestScore = score;
      bestMatch = cf;
    }
  }
  
  return bestMatch;
}

// Export functions
module.exports = {
    calculateSimilarity,
    calculateStringSimilarity,
    calculateNumericSimilarity,
    calculateArraySimilarity,
    calculateObjectSimilarity,
    calculateDilemmaSimilarity,
    findRelevantPrecedents,
    findBestContextualFactorMatch,
    
    // Expose cache management functions
    similarityCache,
    
    // Expose new functions for testing
    calculateLevenshteinDistance,
    calculateSemanticSimilarityApproximation
};
