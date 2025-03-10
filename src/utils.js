/**
 * Utility functions for the REA system
 */

const natural = require('natural');
const { JaroWinklerDistance } = natural;

/**
 * Highlights changes between two text strings with plain text markers
 * @param {string} original - The original text
 * @param {string} modified - The modified text
 * @returns {string} Text with highlights showing changes using [ADDED:] and [REMOVED:] markers
 */
function diffText(original, modified) {
  if (!original || !modified) {
    return modified || '';
  }
  
  // Simple diffing by sentence
  const originalSentences = original.split(/(?<=[.!?])\s+/);
  const modifiedSentences = modified.split(/(?<=[.!?])\s+/);
  
  // Find added sentences
  const addedSentences = modifiedSentences.filter(s => !originalSentences.includes(s));
  
  // Find removed sentences
  const removedSentences = originalSentences.filter(s => !modifiedSentences.includes(s));
  
  // Highlight the changes in the modified text
  let highlightedText = modified;
  
  // Highlight added sentences
  for (const sentence of addedSentences) {
    highlightedText = highlightedText.replace(sentence, `[ADDED: ${sentence}]`);
  }
  
  // Note removed sentences at the end
  if (removedSentences.length > 0) {
    highlightedText += `\n\n[REMOVED: ${removedSentences.join(' ')}]`;
  }
  
  return highlightedText;
}

/**
 * Highlights changes between two text strings with ANSI color codes for CLI output
 * @param {string} original - The original text
 * @param {string} modified - The modified text
 * @returns {string} Text with highlights showing changes using ANSI color codes
 */
function highlightChangesCLI(original, modified) {
  if (!original || !modified) {
    return modified || '';
  }
  
  // Simple diffing by sentence
  const originalSentences = original.split(/(?<=[.!?])\s+/);
  const modifiedSentences = modified.split(/(?<=[.!?])\s+/);
  
  // Find added sentences
  const addedSentences = modifiedSentences.filter(s => !originalSentences.includes(s));
  
  // Find removed sentences
  const removedSentences = originalSentences.filter(s => !modifiedSentences.includes(s));
  
  // Highlight the changes in the modified text
  let highlightedText = modified;
  
  // Highlight added sentences with green color
  for (const sentence of addedSentences) {
    highlightedText = highlightedText.replace(sentence, `\x1b[32m[ADDED: ${sentence}]\x1b[0m`);
  }
  
  // Note removed sentences at the end with red color
  if (removedSentences.length > 0) {
    highlightedText += `\n\n\x1b[31m[REMOVED: ${removedSentences.join(' ')}]\x1b[0m`;
  }
  
  return highlightedText;
}

// For backward compatibility
const highlightChanges = diffText;

/**
 * Creates a deep copy of an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Deep copy of the object
 */
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Formats a date in a consistent way
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate a unique ID for elements
 * @returns {string} Unique ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function getContextualFactor(situation, factorName) {
    if (!situation.contextual_factors) return null;
  
    for (const factor of situation.contextual_factors) {
      if (factor.factor === factorName) {
        return factor.value;
      }
    }
    return null;
  }
  
  function getParameter(situation, paramName) {
    if (!situation.situation || !situation.situation.parameters) return null;
    return situation.situation.parameters[paramName];
  }
  
  function weakenStrength(strength) {
    console.log("weakenStrength called with:", strength);
    if (strength === 'strong') return 'moderate';
    if (strength === 'moderate') return 'weak';
    return 'weak';
  }
  
  function strengthenStrength(strength) {
    if (strength === 'weak') return 'moderate';
    if (strength === 'moderate') return 'strong';
    return 'strong';
  }
  
  function getCertaintyFactor(factors) {
    for (const factor of factors) {
      if (factor.factor === 'certainty_of_outcome') {
        return factor.value;
      }
    }
    return 'medium'; // Default
  }
  
  function getFactorValue(factors, factorName) {
    for (const factor of factors) {
      if (factor.factor === factorName) {
        return factor.value;
      }
    }
    return null;
  }
  
  // Test function for highlightChanges
  function testHighlightChanges() {
    console.log("\n=== TESTING HIGHLIGHT CHANGES ===");
    
    // Test case 1: Simple addition
    let original1 = "This is a test.";
    let adapted1 = "This is a simple test.";
    console.log("Test Case 1 - Simple addition:", highlightChanges(original1, adapted1));
    
    // Test case 2: Simple removal
    let original2 = "This is a comprehensive test case.";
    let adapted2 = "This is a test case.";
    console.log("Test Case 2 - Simple removal:", highlightChanges(original2, adapted2));
    
    // Test case 3: Both addition and removal
    let original3 = "The quick brown fox jumps over the lazy dog.";
    let adapted3 = "The fast brown fox leaps over the sleepy dog.";
    console.log("Test Case 3 - Both addition and removal:", highlightChanges(original3, adapted3));
    
    // Test case 4: Whitespace differences
    let original4 = "This   has   extra   spaces.";
    let adapted4 = "This has extra spaces.";
    console.log("Test Case 4 - Whitespace differences:", highlightChanges(original4, adapted4));
    
    // Test case 5: No differences
    let original5 = "Identical text.";
    let adapted5 = "Identical text.";
    console.log("Test Case 5 - No differences:", highlightChanges(original5, adapted5));
    
    // Test case 6: Text appended (common in our system)
    let original6 = "The virtuous agent must make a decision based on character.";
    let adapted6 = "The virtuous agent must make a decision based on character. In this context, the virtue of prudence (practical wisdom) becomes even more important, as the virtuous agent must acknowledge the limits of their knowledge.";
    console.log("Test Case 6 - Appended text:", highlightChanges(original6, adapted6));
    
    // Test case 7: Text prepended
    let original7 = "The decision should maximize overall utility.";
    let adapted7 = "In medical triage scenarios, the decision should maximize overall utility.";
    console.log("Test Case 7 - Prepended text:", highlightChanges(original7, adapted7));
    
    // Test case 8: Specific pattern replacement from medical triage context rule
    let original8 = "The criteria-based selection could potentially maximize overall utility while respecting autonomy.";
    let adapted8 = "The in a medical context, probability-of-recovery and severity-based criteria maximize overall utility while respecting autonomy.";
    console.log("Test Case 8 - Pattern replacement (medical):", highlightChanges(original8, adapted8));
    
    // Test case 9: Specific pattern replacement from professional duties
    let original9 = "Forcibly removing people from the boat treats them merely as means to saving others, which violates the categorical imperative.";
    let adapted9 = "A medical professional has specialized duties that include making difficult allocation decisions when resources are scarce, which must be balanced with the categorical imperative.";
    console.log("Test Case 9 - Pattern replacement (duties):", highlightChanges(original9, adapted9));
    
    // Test case 10: Complex replacement with partial overlap
    let original10 = "Under utilitarianism, we should maximize happiness for the greatest number.";
    let adapted10 = "Under preference utilitarianism, we should maximize preference satisfaction for the greatest number.";
    console.log("Test Case 10 - Complex with overlap:", highlightChanges(original10, adapted10));
    
    // Test case 11: Very long text replacement (using simplified approach)
    let original11 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    let adapted11 = "Lorem ipsum dolor sit amet, adipiscing elit modified. Sed do eiusmod new text tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo different consequat.";
    console.log("Test Case 11 - Long text:", highlightChanges(original11, adapted11));
    
    console.log("=== END TESTING HIGHLIGHT CHANGES ===\n");
  }
  
  function extractPriorities(argument) {
    try {
      let obj = JSON.parse(argument);
      return obj.priorities || [];
    } catch (e) {
      const match = argument.match(/priorities:\s*([^\n]+)/i);
      if (match) {
        return match[1].split(',').map(s => s.trim());
      }
    }
    return [];
  }
  
  function extractKeyArguments(argument) {
    try {
      let obj = JSON.parse(argument);
      return obj.keyArguments || [];
    } catch (e) {
      const match = argument.match(/keyArguments:\s*([^\n]+)/i);
      if (match) {
        return match[1].split(',').map(s => s.trim());
      }
    }
    return [];
  }
  
  /**
   * Calculates semantic similarity between two strings using JaroWinkler distance and TF-IDF
   * @param {string} str1 - First string to compare
   * @param {string} str2 - Second string to compare
   * @returns {number} Similarity score between 0 and 1
   */
  function calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) {
      return 0;
    }
    
    // Normalize strings for comparison
    const normalize = (str) => {
      return str.toLowerCase().trim();
    };
    
    const normalized1 = normalize(str1);
    const normalized2 = normalize(str2);
    
    // Use Jaro-Winkler Distance for short strings
    // This algorithm is good for comparing short strings like names
    const jaroWinklerScore = JaroWinklerDistance(normalized1, normalized2);
    
    // Calculate word overlap (Jaccard similarity coefficient)
    const words1 = normalized1.split(/\W+/).filter(w => w.length > 1);
    const words2 = normalized2.split(/\W+/).filter(w => w.length > 1);
    
    // Find common words
    const commonWords = words1.filter(w => words2.includes(w));
    
    // Calculate Jaccard similarity
    const uniqueWords = new Set([...words1, ...words2]);
    const jaccardScore = uniqueWords.size === 0 ? 0 : commonWords.length / uniqueWords.size;
    
    // Combine scores, giving more weight to Jaro-Winkler for short strings
    // and more weight to Jaccard for longer strings
    const avgLength = (normalized1.length + normalized2.length) / 2;
    const jaroWeight = Math.max(0.2, Math.min(0.8, 10 / avgLength));
    
    return (jaroWinklerScore * jaroWeight) + (jaccardScore * (1 - jaroWeight));
  }
  
  /**
   * Calculates the relevance score of an action to a dilemma using cosine similarity
   * @param {Object|string} dilemma - The dilemma object or dilemma text
   * @param {Object|string} action - The action being evaluated (object or string)
   * @param {Object|string} precedent - The precedent object or text to compare against
   * @returns {number} Relevance score between 0 and 1
   */
  async function actionRelevanceScore(dilemma, action, precedent) {
    // Validate inputs and provide detailed error logging
    if (!dilemma) {
        console.warn("Missing dilemma in actionRelevanceScore");
        return 0.5; // Default score
    }
    if (!action) {
        console.warn("Missing action in actionRelevanceScore");
        return 0.5; // Default score
    }
    if (!precedent) {
        console.warn("Missing precedent in actionRelevanceScore");
        return 0.5; // Default score
    }

    // Handle empty dilemma object (for test compatibility)
    if (typeof dilemma === 'object' && Object.keys(dilemma).length === 0) {
        console.warn("Empty dilemma object in actionRelevanceScore");
        return 0.5; // Default score for empty object
    }

    console.log(`ActionRelevanceScore called with:
    - dilemma type: ${typeof dilemma}
    - action type: ${typeof action}
    - precedent type: ${typeof precedent}`);

    // Extract dilemma text
    let dilemmaText;
    if (typeof dilemma === 'string') {
        dilemmaText = dilemma;
    } else {
        dilemmaText = extractDilemmaText(dilemma);
    }

    // Extract action text
    let actionText;
    if (typeof action === 'string') {
        actionText = action;
    } else if (action.description) {
        actionText = action.description;
    } else if (action.action) {
        actionText = prepareActionText(action.action);
    } else if (action.name) {
        actionText = prepareActionText(action.name);
    } else {
        actionText = JSON.stringify(action);
    }

    // Extract precedent text
    let precedentText;
    if (typeof precedent === 'string') {
        precedentText = precedent;
    } else if (precedent.description) {
        precedentText = precedent.description;
    } else {
        // Try to extract text from the precedent
        precedentText = extractDilemmaText(precedent);
    }

    // Use empty string fallbacks
    dilemmaText = dilemmaText || "";
    actionText = actionText || "";
    precedentText = precedentText || "";

    // If we couldn't get meaningful text, return default score
    if (!dilemmaText.trim() || !actionText.trim() || !precedentText.trim()) {
        return 0.5; // Default score for missing text
    }

    // Debugging output
    console.log(`ActionRelevanceScore processing:
    - dilemmaText: ${dilemmaText.substring(0, 50)}${dilemmaText.length > 50 ? '...' : ''}
    - actionText: ${actionText}
    - precedentText: ${precedentText.substring(0, 50)}${precedentText.length > 50 ? '...' : ''}`);

    // Apply domain-specific boosting for relevant terms
    const baseScore = calculateCosineSimilarity(actionText, precedentText);
    const boostedScore = applyContextualBoosting(baseScore, actionText, dilemma);

    console.log(`ActionRelevanceScore result:
    - baseScore: ${baseScore.toFixed(4)}
    - boostedScore: ${boostedScore.toFixed(4)}`);

    return boostedScore;
  }
  
  /**
   * Extracts relevant text from a dilemma for similarity comparison
   * @param {Object} dilemma - The dilemma object
   * @returns {string} Concatenated text from dilemma
   */
  function extractDilemmaText(dilemma) {
    // Handle empty or invalid dilemma objects
    if (!dilemma || Object.keys(dilemma).length === 0) {
      return "general ethical considerations"; // Default text for empty dilemmas
    }
    
    const textElements = [];
    
    // Extract title
    if (dilemma.title) {
      textElements.push(dilemma.title);
    }
    
    // Extract description
    if (dilemma.description) {
      textElements.push(dilemma.description);
    }
    
    // Extract contexts as keywords
    if (dilemma.contexts && Array.isArray(dilemma.contexts)) {
      textElements.push(dilemma.contexts.join(' '));
    }
    
    // Extract key terms
    if (dilemma.key_terms && Array.isArray(dilemma.key_terms)) {
      textElements.push(dilemma.key_terms.join(' '));
    }
    
    // Extract possible actions if available
    if (dilemma.possible_actions && Array.isArray(dilemma.possible_actions)) {
      textElements.push(dilemma.possible_actions.join(' '));
    }
    
    // If no elements were extracted, return the default text
    if (textElements.length === 0) {
      return "general ethical considerations";
    }
    
    // Join all elements with spaces
    return textElements.join(' ');
  }
  
// Abbreviation mapping for action text expansion
const abbreviations = {
  "impl": "implement",
  "tech": "technology",
  "sys": "system",
  "auth": "authorization",
  "dev": "develop",
  "app": "application",
  "sec": "security",
  "admin": "administration",
  "mgmt": "management",
  "env": "environment",
  "eval": "evaluate",
  "info": "information",
  "med": "medical",
  "org": "organization",
  "proc": "process",
  "prog": "program",
  "req": "requirement",
  "res": "resource",
  "srv": "service",
  "util": "utility"
};

/**
 * Prepares action text for comparison
 * @param {Object|string} action - Action object or action name
 * @param {Object} options - Processing options
 * @returns {string} Processed action text
 */
function prepareActionText(action, options = {}) {
  // Handle missing inputs
  if (!action) {
    console.warn("prepareActionText: Action is null or undefined");
    return '';
  }
  
  let actionText = '';
  
  // Handle string actions
  if (typeof action === 'string') {
    actionText = action;
  }
  // Handle action objects
  else if (typeof action === 'object') {
    // Try different properties that might contain the action name
    if (action.name) {
      actionText = action.name;
    } else if (action.action) {
      actionText = action.action;
    } else if (action.conclusion) {
      actionText = action.conclusion;
    }
    
    // Get description if available
    if (action.description) {
      actionText += " " + action.description;
    }
    
    // Add predicted consequences if available (for dilemma possible_actions)
    if (action.predicted_consequences) {
      actionText += " " + action.predicted_consequences;
    }
    
    // Add argument if available (for reasoning paths)
    if (action.argument) {
      actionText += " " + action.argument;
    }
  }
  else {
    // Return empty string for invalid input
    console.warn("prepareActionText: Invalid action type:", typeof action);
    return '';
  }
  
  // Process action text (replace underscores with spaces)
  actionText = actionText.replace(/_/g, ' ').trim();
  
  // Expand abbreviations if option is enabled
  if (options.expandAction || options.expandAbbreviations) {
    const words = actionText.split(' ');
    const expandedWords = words.map(word => {
      const lowerWord = word.toLowerCase();
      if (abbreviations.hasOwnProperty(lowerWord)) {
        return abbreviations[lowerWord]; // Return expanded word
      }
      return word; // Return original word if not an abbreviation
    });
    actionText = expandedWords.join(' ');
  }
  
  return actionText;
}
  
  /**
   * Calculates cosine similarity between two text strings
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Cosine similarity score between 0 and 1
   */
  function calculateCosineSimilarity(text1, text2) {
    // Tokenize and normalize texts
    const tokens1 = tokenizeAndNormalize(text1);
    const tokens2 = tokenizeAndNormalize(text2);
    
    // Create term frequency vectors
    const vector1 = createTermFrequencyVector(tokens1);
    const vector2 = createTermFrequencyVector(tokens2);
    
    // Get all unique terms from both vectors
    const allTerms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
    
    // Calculate dot product and magnitudes
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (const term of allTerms) {
      // Get term frequencies (default to 0 if term not in vector)
      const freq1 = vector1[term] || 0;
      const freq2 = vector2[term] || 0;
      
      // Update dot product and magnitudes
      dotProduct += freq1 * freq2;
      magnitude1 += freq1 * freq1;
      magnitude2 += freq2 * freq2;
    }
    
    // Calculate cosine similarity
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0; // Avoid division by zero
    }
    
    // Calculate similarity and round to 8 decimal places to handle floating-point precision
    const similarity = dotProduct / (magnitude1 * magnitude2);
    
    // Check if similarity is very close to 1
    if (Math.abs(similarity - 1) < 0.0000001) {
      return 1; // Return exactly 1 for identical texts
    }
    
    // Round to 8 decimal places for other values
    return parseFloat(similarity.toFixed(8));
  }
  
  /**
   * Tokenizes and normalizes text for similarity comparison
   * @param {string} text - Text to process
   * @returns {Array} Array of normalized tokens
   */
  function tokenizeAndNormalize(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Convert to lowercase
    const lowerText = text.toLowerCase();
    
    // Split into tokens (words)
    // This regex matches word boundaries and removes punctuation
    const tokens = lowerText.split(/\W+/).filter(token => token.length > 0);
    
    // Define stopwords to remove
    const stopwords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
      'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'to',
      'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
      'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'doing', 'this', 'that', 'these', 'those', 'am', 'of'
    ]);
    
    // Filter out stopwords
    const filteredTokens = tokens.filter(token => !stopwords.has(token));
    
    return filteredTokens;
  }
  
  /**
   * Creates a term frequency vector from tokens
   * @param {Array} tokens - Array of tokens
   * @returns {Object} Term frequency object
   */
  function createTermFrequencyVector(tokens) {
    const vector = {};
    
    // Count term frequencies
    for (const token of tokens) {
      if (vector[token]) {
        vector[token]++;
      } else {
        vector[token] = 1;
      }
    }
    
    return vector;
  }
  
  /**
   * Applies contextual boosting to a similarity score based on dilemma-specific factors
   * @param {number} baseScore - The base similarity score to boost
   * @param {string} action - The action text
   * @param {Object} dilemma - The dilemma object
   * @param {Object} options - Additional options
   * @returns {number} The boosted similarity score
   */
  function applyContextualBoosting(baseScore, action, dilemma, options = {}) {
    if (!dilemma || typeof dilemma !== 'object') {
        return baseScore; // No boosting possible without dilemma context
    }
    
    let boostedScore = baseScore;
    const actionLower = action.toLowerCase();
    
    // 1. Boost if action matches specific keywords in the dilemma description
    if (dilemma.description) {
        const descriptionLower = dilemma.description.toLowerCase();
        // Check for keyword matches in both action and description
        const keywords = extractKeywords(descriptionLower);
        const matchCount = keywords.reduce((count, keyword) => {
            return actionLower.includes(keyword) ? count + 1 : count;
        }, 0);
        
        if (matchCount > 0) {
            const descriptionBoost = Math.min(0.15, matchCount * 0.05);
            console.log(`Applied domain-specific boost of ${descriptionBoost.toFixed(2)} for ${matchCount} keyword matches`);
            boostedScore += descriptionBoost;
        }
    }
    
    // 2. Domain-specific boosts
    if (dilemma.contexts && Array.isArray(dilemma.contexts)) {
        // Detect specific domains
        const domains = {
            medical: ['healthcare', 'medical', 'hospital', 'patient', 'treatment', 'doctor', 'nurse', 'surgery'],
            surveillance: ['privacy', 'surveillance', 'security', 'camera', 'monitor', 'tracking', 'facial', 'recognition'],
            environmental: ['environment', 'pollution', 'emission', 'climate', 'sustainable', 'green', 'waste', 'recycling'],
            business: ['business', 'profit', 'market', 'company', 'corporate', 'investor', 'shareholder', 'economic']
        };
        
        // Check which domain this dilemma falls into
        for (const [domain, keywords] of Object.entries(domains)) {
            const matchCount = dilemma.contexts.filter(context => 
                keywords.some(keyword => context.toLowerCase().includes(keyword))
            ).length;
            
            if (matchCount > 0) {
                console.log(`Detected dilemma domain: ${domain} (${matchCount} keyword matches)`);
                
                // Apply domain-specific boosts
                if (domain === 'medical' && actionLower.includes('medical') || 
                    actionLower.includes('treatment') || 
                    actionLower.includes('patient') || 
                    actionLower.includes('allocate')) {
                    boostedScore += 0.1;
                }
                
                if (domain === 'surveillance' && (
                    actionLower.includes('privacy') || 
                    actionLower.includes('surveillance') || 
                    actionLower.includes('camera') || 
                    actionLower.includes('security')
                )) {
                    boostedScore += 0.1;
                }
                
                if (domain === 'environmental' && (
                    actionLower.includes('environment') || 
                    actionLower.includes('pollution') || 
                    actionLower.includes('sustainable') || 
                    actionLower.includes('green')
                )) {
                    boostedScore += 0.1;
                }
                
                if (domain === 'business' && (
                    actionLower.includes('business') || 
                    actionLower.includes('profit') || 
                    actionLower.includes('company') || 
                    actionLower.includes('economic')
                )) {
                    boostedScore += 0.1;
                }
            }
        }
    }
    
    // 3. Parameter-specific boosts
    if (dilemma.parameters) {
        const params = dilemma.parameters;
        
        // Boost for resource scarcity in allocation actions
        if (params.resource_scarcity && params.resource_scarcity > 0.5 && 
            (actionLower.includes('allocate') || actionLower.includes('triage'))) {
            boostedScore += params.resource_scarcity * 0.1;
        }
        
        // Boost for privacy impact in privacy-related actions
        if (params.privacy_impact && params.privacy_impact > 0.5 && 
            (actionLower.includes('privacy') || actionLower.includes('data'))) {
            boostedScore += params.privacy_impact * 0.1;
        }
    }
    
    // Cap at 1.0 for a valid similarity score
    return Math.min(1.0, boostedScore);
  }
  
  // Helper to extract keywords from text
  function extractKeywords(text) {
    // Simple keyword extraction by:
    // 1. Tokenizing
    // 2. Removing stopwords
    // 3. Keeping only words longer than 3 characters
    const tokens = tokenizeAndNormalize(text);
    return tokens.filter(token => token.length > 3);
  }
  
/**
 * Extracts contextual factors from a dilemma
 * @param {Object} dilemma - The dilemma object
 * @returns {Array} Array of contextual factors
 */
function extractContextualFactors(dilemma) {
  if (!dilemma) {
    console.warn("extractContextualFactors: Dilemma is null or undefined.");
    return [];
  }

  if (!dilemma.contextual_factors) {
    console.warn("extractContextualFactors: Dilemma has no contextual_factors property.");
    return [];
  }

  if (!Array.isArray(dilemma.contextual_factors)) {
    console.warn("extractContextualFactors: contextual_factors is not an array.");
    return [];
  }

  const factors = [];
  for (const factorObj of dilemma.contextual_factors) {
    if (factorObj && typeof factorObj === 'object' && factorObj.factor) {
      factors.push(factorObj.factor);
    } else {
      console.warn("extractContextualFactors: Invalid factor object:", factorObj);
    }
  }
  return factors;
}
  
function getParameterValue(parameters, paramName) {
  if (parameters && parameters[paramName] && typeof parameters[paramName] === 'object') {
    return parameters[paramName].value;
  }
  return undefined; // Or a suitable default, like 0, depending on the parameter
}

/**
 * Validates that the required parameters exist on the dilemma object.
 * @param {object} dilemma The dilemma object.
 * @param {string[]} requiredParams Array of required parameter names.
 * @returns {boolean} True if all required parameters are present, false otherwise.
 */
function validateParameters(dilemma, requiredParams) {
  if (!dilemma || !dilemma.situation || !dilemma.situation.parameters) {
    console.error("validateParameters failed: Missing dilemma, situation, or parameters.");
    return false;
  }
  
  for (const param of requiredParams) {
    if (!dilemma.situation.parameters[param] || typeof dilemma.situation.parameters[param].value === 'undefined') {
      console.error(`validateParameters failed: Missing parameter "${param}"`);
      return false;
    }
  }
  
  return true;
}

function getContextualFactorValue(contextualFactors, factorName) {
  if(Array.isArray(contextualFactors)){
    const factor = contextualFactors.find(cf => cf.factor === factorName);
    if (factor) {
      return factor.value;
    }
  }
  return undefined; // Or a suitable default, like false, depending on the factor
}

/**
 * Converts severity string to numeric score
 * @param {string} severity - Severity level ('low', 'medium', 'high', 'critical')
 * @returns {number} Numeric score between 0 and 1
 */
function convertSeverityToScore(severity) {
    const severityMap = {
        'low': 0.2,
        'medium': 0.5,
        'high': 0.8,
        'critical': 1.0
    };
    return severityMap[severity] || 0.5; // Default to medium
}

/**
 * Converts strength string to numeric score
 * @param {string} strength - Strength level ('weak', 'moderate', 'strong')
 * @returns {number} Numeric score between 0 and 1
 */
function convertStrengthToScore(strength) {
    const strengthMap = {
        'weak': 0.3,
        'moderate': 0.6,
        'strong': 0.9
    };
    return strengthMap[strength] || 0.6; // Default to moderate
}

/**
 * Creates granular elements for a reasoning path
 * @param {string} framework - The ethical framework
 * @param {string} action - The action being analyzed
 * @param {string} principle - The principle(s) being applied
 * @param {string} justification - The justification for the conclusion
 * @param {string} objection - Potential objection to the reasoning
 * @param {string} response - Response to the objection
 * @param {string} conclusion - The conclusion reached
 * @param {string} strength - The strength of the conclusion ('weak', 'moderate', 'strong')
 * @param {Object} options - Additional options
 * @returns {Array} Array of granular elements
 */
function createGranularElements(framework, action, principle, justification, objection, response, conclusion, strength, options = {}) {
    // Generate unique IDs for elements
    const elements = [];
    const baseId = generateId();
    const dilemma = options.dilemma || null;

    // Calculate or assign action relevance
    let actionRelevance = options.actionRelevance;
    // If no pre-calculated relevance is provided, default to high relevance (0.8)
    // In a real implementation, this could be calculated from actionRelevanceScore
    if (typeof actionRelevance !== 'number') {
        if (dilemma) {
            // Attempt to calculate relevance asynchronously
            // For now, we set a default score that will be updated later
            actionRelevance = 0.8;
            
            // This will be handled asynchronously elsewhere if dilemma is provided
            console.log(`Action relevance will be calculated asynchronously for action: ${action}`);
        } else {
            // If no dilemma provided, use a default high value
            actionRelevance = 0.8;
        }
    }

    // Create elements for each component
    if (principle) {
        const principleElement = {
            id: `${baseId}-principle`,
            type: 'principle',
            framework: framework,
            action: action,
            content: principle,
            strength: strength || 'moderate',
            relevance: actionRelevance, // Include relevance score
            conflicting_principles: []
        };
        elements.push(principleElement);
    }

    if (justification) {
        const justificationElement = {
            id: `${baseId}-justification`,
            type: 'justification',
            framework: framework,
            action: action,
            content: justification,
            strength: strength || 'moderate',
            relevance: actionRelevance, // Include relevance score
            supporting_principles: principle ? [principle] : []
        };
        elements.push(justificationElement);
    }

    if (objection) {
        const objectionElement = {
            id: `${baseId}-objection`,
            type: 'objection',
            framework: framework,
            action: action,
            content: objection,
            strength: 'moderate', // Objections usually start as moderate
            relevance: actionRelevance, // Include relevance score
            target_components: justification ? ['justification'] : []
        };
        elements.push(objectionElement);
    }

    if (response) {
        const responseElement = {
            id: `${baseId}-response`,
            type: 'response',
            framework: framework,
            action: action,
            content: response,
            strength: strength || 'moderate',
            relevance: actionRelevance, // Include relevance score
            target_objection: objection ? `${baseId}-objection` : null
        };
        elements.push(responseElement);
    }

    // Add conclusion element
    if (conclusion) {
        const conclusionElement = {
            id: `${baseId}-conclusion`,
            type: 'conclusion',
            framework: framework,
            action: action,
            content: `The ${determineFrameworkType(framework)} conclusion is to ${conclusion}`,
            conclusion: conclusion,
            strength: strength || 'moderate',
            relevance: actionRelevance, // Include relevance score
            supporting_elements: []
        };
        
        // Add references to supporting elements
        if (principle) conclusionElement.supporting_elements.push(`${baseId}-principle`);
        if (justification) conclusionElement.supporting_elements.push(`${baseId}-justification`);
        if (response) conclusionElement.supporting_elements.push(`${baseId}-response`);
        
        elements.push(conclusionElement);
    }

    // Initialize action relevance calculation if dilemma is provided
    // This will be handled asynchronously but we set it up here
    if (dilemma && typeof options.actionRelevance !== 'number') {
        // Set flag for later async calculation
        elements.forEach(element => {
            element.needsRelevanceCalculation = true;
        });
    }

    return elements;
}

// Helper function to determine framework type
function determineFrameworkType(framework) {
    if (!framework) return 'unknown';
    if (framework.includes('+')) return 'hybrid';
    if (framework.toLowerCase().includes('hybrid')) return 'hybrid';
    return 'pure';
}

// Export all utility functions
module.exports = {
    highlightChanges,
    diffText,
    highlightChangesCLI,
    deepCopy,
    formatDate,
    generateId,
    getContextualFactor,
    getParameter,
    weakenStrength,
    strengthenStrength,
    getCertaintyFactor,
    getFactorValue,
    testHighlightChanges,
    extractPriorities,
    extractKeyArguments,
    calculateStringSimilarity,
    actionRelevanceScore,
    extractDilemmaText,
    prepareActionText,
    calculateCosineSimilarity: calculateCosineSimilarity,
    tokenizeAndNormalize,
    createTermFrequencyVector,
    applyContextualBoosting,
    extractContextualFactors,
    getParameterValue,
    validateParameters,
    getContextualFactorValue,
    convertSeverityToScore,
    convertStrengthToScore,
    createGranularElements,
    determineFrameworkType
};
