/**
 * Framework Utilities - Functions for framework-related operations
 */

const { extractDilemmaText } = require('./utils');

/**
 * Calculates importance score for a framework in the context of a dilemma
 * @param {Object} framework - The framework object
 * @param {Object} dilemma - The dilemma object
 * @param {Array} precedents - Array of precedents for frequency calculation
 * @returns {number} Importance score between 0 and 1
 */
function calculateFrameworkImportance(framework, dilemma, precedents = []) {
    let importance = 0.5; // Default

    if (!framework) {
        console.warn("calculateFrameworkImportance: framework is null/undefined");
        return importance; // Return default
    }

    // 1. Hybrid Framework Boost
    if (framework.isHybrid) {
        importance += 0.1; // Hybrid frameworks often better reflect nuanced situations
    }

    // 2. Precedent Usage Frequency
    if (precedents && Array.isArray(precedents)) {
        const usageCount = precedents.reduce((count, precedent) => {
            if (precedent && precedent.reasoning_paths && Array.isArray(precedent.reasoning_paths)) {
                return count + precedent.reasoning_paths.filter(path => 
                    path.framework === framework.name).length;
            }
            return count;
        }, 0);
        importance += Math.min(0.2, usageCount * 0.02); // Cap at 0.2 boost
    }

    // 3. Domain Relevance
    const domainRelevance = calculateDomainRelevance(framework, dilemma);
    importance += domainRelevance * 0.2;

    // Log detailed calculation for debugging
    console.log(`Framework importance calculation for ${framework.name}:`);
    console.log(`- Base importance: 0.5`);
    console.log(`- Hybrid boost: ${framework.isHybrid ? '+0.1' : '+0'}`);
    console.log(`- Domain relevance: ${domainRelevance.toFixed(2)} => +${(domainRelevance * 0.2).toFixed(2)}`);
    console.log(`- Final importance: ${Math.min(1.0, importance).toFixed(2)}`);

    return Math.min(1.0, importance); // Cap at 1.0
}

/**
 * Calculates how relevant a framework is to a specific dilemma domain
 * @param {Object} framework - The framework object
 * @param {Object} dilemma - The dilemma object
 * @returns {number} Relevance score between 0 and 1
 */
function calculateDomainRelevance(framework, dilemma) {
    if (!framework || !dilemma) return 0;
    
    // Extract domain keywords from dilemma
    const dilemmaText = extractDilemmaText(dilemma).toLowerCase();
    
    // Check for framework name in dilemma text
    if (framework.name && dilemmaText.includes(framework.name.toLowerCase())) {
        return 0.5; // Direct mention is a strong signal
    }
    
    // Check for framework aliases
    if (framework.aliases && Array.isArray(framework.aliases)) {
        for (const alias of framework.aliases) {
            if (dilemmaText.includes(alias.toLowerCase())) {
                return 0.4; // Alias mention is also a good signal
            }
        }
    }
    
    // Check for framework-specific keywords
    const frameworkKeywords = getFrameworkKeywords(framework);
    let matchCount = 0;
    
    for (const keyword of frameworkKeywords) {
        if (dilemmaText.includes(keyword.toLowerCase())) {
            matchCount++;
        }
    }
    
    return Math.min(0.8, matchCount * 0.1); // Cap at 0.8
}

/**
 * Gets keywords associated with a specific framework
 * @param {Object} framework - The framework object
 * @returns {Array} Array of keywords
 */
function getFrameworkKeywords(framework) {
    if (!framework || !framework.name) return [];
    
    const frameworkKeywordMap = {
        'utilitarianism': ['utility', 'happiness', 'well-being', 'welfare', 'benefit', 'harm', 'consequence', 'outcome'],
        'deontology': ['duty', 'obligation', 'right', 'wrong', 'principle', 'rule', 'categorical'],
        'virtue_ethics': ['character', 'virtue', 'vice', 'excellence', 'flourishing', 'habit'],
        'care_ethics': ['care', 'relationship', 'connection', 'vulnerability', 'need', 'attention'],
        'rights_based': ['rights', 'dignity', 'autonomy', 'freedom', 'liberty', 'consent', 'privacy', 'justice'],
        'default': ['ethical', 'moral', 'value', 'principle']
    };
    
    // Find the best match for the framework name
    const frameworkLower = framework.name.toLowerCase();
    for (const [key, keywords] of Object.entries(frameworkKeywordMap)) {
        if (frameworkLower.includes(key)) {
            return keywords;
        }
    }
    
    return frameworkKeywordMap.default;
}

module.exports = {
    calculateFrameworkImportance,
    calculateDomainRelevance,
    getFrameworkKeywords
}; 