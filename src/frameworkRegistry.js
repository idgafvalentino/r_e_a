/**
 * Framework Registry
 * 
 * A central registry for ethical frameworks with standardized naming and lookup capabilities.
 * This module provides functions for registering frameworks, looking them up by name or ID,
 * and handling hybrid frameworks and unknown frameworks.
 */

const Framework = require('./models/Framework');
const frameworkLogger = require('./frameworkLogger');

// Initialize registry
const frameworkRegistry = new Map();

// Initialize fuzzy matcher (we'll implement this later)
let frameworkSet = null;

/**
 * Add a framework to the registry
 * @param {Framework} framework - The framework to register
 * @returns {Framework} The registered framework
 * @throws {Error} If the framework is not a Framework instance
 */
function registerFramework(framework) {
  if (!(framework instanceof Framework)) {
    throw new Error("Must register a Framework instance");
  }
  
  frameworkRegistry.set(framework.id, framework);
  
  // Add to fuzzy matcher if available
  if (frameworkSet) {
    frameworkSet.add(framework.name);
    
    // Add aliases to fuzzy matcher
    if (framework.aliases && Array.isArray(framework.aliases)) {
      framework.aliases.forEach(alias => frameworkSet.add(alias));
    }
  }
  
  return framework;
}

/**
 * Populate the registry with standard ethical frameworks
 */
function initializeRegistry() {
  // Core ethical frameworks
  registerFramework(new Framework(
    'utilitarianism',
    'Utilitarianism',
    'A consequentialist ethical theory that holds the proper course of action maximizes overall happiness or well-being.',
    ['utilitarian', 'consequentialism', 'utility', 'consequentialist']
  ));
  
  registerFramework(new Framework(
    'kantian_deontology',
    'Kantian Deontology',
    'A deontological ethical theory developed by Immanuel Kant that emphasizes duty and universal principles.',
    ['kantian ethics', 'deontology', 'kant', 'categorical imperative', 'deontological']
  ));
  
  registerFramework(new Framework(
    'virtue_ethics',
    'Virtue Ethics',
    'An approach to ethics that emphasizes the character of the moral agent rather than rules or consequences.',
    ['aristotelian ethics', 'character ethics', 'virtues', 'virtue-ethics', 'virtue_ethics']
  ));
  
  registerFramework(new Framework(
    'care_ethics',
    'Care Ethics',
    'An ethical theory that emphasizes the importance of response to the needs of others, particularly those who are vulnerable.',
    ['ethics of care', 'feminist ethics', 'care-ethics', 'care_ethics']
  ));
  
  registerFramework(new Framework(
    'social_contract_theory',
    'Social Contract Theory',
    'A theory that individuals have consented to surrender some freedoms and submit to authority in exchange for protection of their remaining rights.',
    ['contractarianism', 'social contract', 'social-contract', 'social_contract']
  ));
  
  registerFramework(new Framework(
    'rights_based_ethics',
    'Rights-Based Ethics',
    'An approach to ethics that holds that certain rights are inherent to individuals and must be respected.',
    ['rights-based', 'rights_based', 'rights ethics', 'rights-ethics', 'rights_ethics']
  ));
  
  registerFramework(new Framework(
    'double_effect_principle',
    'Double Effect Principle',
    'A principle that distinguishes between intended consequences and foreseen side effects.',
    ['principle of double effect', 'double effect', 'double-effect', 'double_effect']
  ));
  
  registerFramework(new Framework(
    'natural_law',
    'Natural Law',
    'A theory that holds that certain rights or values are inherent by virtue of human nature and can be universally understood through human reason.',
    ['natural-law', 'natural_law', 'natural law theory']
  ));
  
  registerFramework(new Framework(
    'professional_ethics',
    'Professional Ethics',
    'Ethical principles that guide professional conduct in various fields.',
    ['professional-ethics', 'professional_ethics', 'professional codes', 'professional standards']
  ));
  
  // Add hybrid frameworks
  const hybridUtilVirtue = new Framework(
    'hybrid_utilitarianism_virtue_ethics',
    'Hybrid: Utilitarianism + Virtue Ethics',
    'Hybrid framework combining Utilitarianism and Virtue Ethics.',
    []
  );
  hybridUtilVirtue.isHybrid = true;
  hybridUtilVirtue.components = [
    getFramework('utilitarianism'),
    getFramework('virtue_ethics')
  ];
  registerFramework(hybridUtilVirtue);
  
  const hybridKantian = new Framework(
    'hybrid_kantian_deontology',
    'Hybrid: Kantian Deontology',
    'Hybrid framework combining Kantian Deontology.',
    []
  );
  hybridKantian.isHybrid = true;
  hybridKantian.components = [
    getFramework('kantian_deontology')
  ];
  registerFramework(hybridKantian);
  
  const hybridKantianCare = new Framework(
    'hybrid_kantian_deontology_care_ethics',
    'Hybrid: Kantian Deontology + Care Ethics',
    'Hybrid framework combining Kantian Deontology and Care Ethics.',
    []
  );
  hybridKantianCare.isHybrid = true;
  hybridKantianCare.components = [
    getFramework('kantian_deontology'),
    getFramework('care_ethics')
  ];
  registerFramework(hybridKantianCare);
  
  // Add a hybrid framework with an unknown component
  const hybridUtilUnknown = new Framework(
    'hybrid_utilitarianism_unknown_framework',
    'Hybrid: Utilitarianism + Unknown Framework',
    'Hybrid framework combining Utilitarianism and Unknown Framework.',
    []
  );
  hybridUtilUnknown.isHybrid = true;
  hybridUtilUnknown.components = [
    getFramework('utilitarianism'),
    'Unknown Framework' // String for unknown component
  ];
  registerFramework(hybridUtilUnknown);
}

/**
 * Get a framework by its ID
 * @param {string} id - The framework ID
 * @returns {Framework|undefined} The framework, or undefined if not found
 */
function getFramework(id) {
  return frameworkRegistry.get(id);
}

/**
 * Get all registered frameworks
 * @returns {Array<Framework>} Array of all frameworks
 */
function getAllFrameworks() {
  return Array.from(frameworkRegistry.values());
}

/**
 * Get a framework by its name
 * @param {string} name - The framework name
 * @param {Object} options - Options for the lookup
 * @param {boolean} options.fuzzyMatch - Whether to use fuzzy matching (default: true)
 * @param {number} options.threshold - Threshold for fuzzy matching (default: 0.8)
 * @param {boolean} options.fallbackToUnknown - Whether to return an unknown framework if not found (default: true)
 * @returns {Framework|null} The framework, or null if not found
 */
function getFrameworkByName(name, options = {}) {
  if (!name) return null;
  
  // Log the lookup attempt
  frameworkLogger.logFrameworkReference(
    name,
    "frameworkRegistry.getFrameworkByName",
    { lookupType: "byName" }
  );
  
  // Check if the framework ALREADY EXISTS (by name)
  const existingFramework = Array.from(frameworkRegistry.values()).find(fw => fw.name === name);
  if (existingFramework) {
    frameworkLogger.logFrameworkLookup(
      name,
      "frameworkRegistry.getFrameworkByName.existing",
      true,
      { matchedFramework: existingFramework.name }
    );
    return existingFramework;
  }
  
  // 1. Try exact match on name
  const exactMatch = Array.from(frameworkRegistry.values()).find(
    fw => fw.matches(name)
  );
  
  if (exactMatch) {
    frameworkLogger.logFrameworkLookup(
      name,
      "frameworkRegistry.getFrameworkByName.exact",
      true,
      { matchedFramework: exactMatch.name }
    );
    return exactMatch;
  }
  
  // 2. Try case-insensitive match
  const caseInsensitiveMatch = Array.from(frameworkRegistry.values()).find(
    fw => fw.matchesCaseInsensitive(name)
  );
  
  if (caseInsensitiveMatch) {
    frameworkLogger.logFrameworkLookup(
      name,
      "frameworkRegistry.getFrameworkByName.caseInsensitive",
      true,
      { matchedFramework: caseInsensitiveMatch.name }
    );
    return caseInsensitiveMatch;
  }
  
  // 3. Try normalized match (remove spaces, hyphens, underscores)
  const normalizedMatch = Array.from(frameworkRegistry.values()).find(
    fw => fw.matchesNormalized(name)
  );
  
  if (normalizedMatch) {
    frameworkLogger.logFrameworkLookup(
      name,
      "frameworkRegistry.getFrameworkByName.normalized",
      true,
      { matchedFramework: normalizedMatch.name }
    );
    return normalizedMatch;
  }
  
  // 4. Try fuzzy matching if enabled and available
  if (options.fuzzyMatch !== false && frameworkSet) {
    const threshold = options.threshold || 0.8;
    const matches = frameworkSet.get(name);
    
    if (matches && matches.length > 0 && matches[0][0] >= threshold) {
      const bestMatchName = matches[0][1];
      const fuzzyMatch = Array.from(frameworkRegistry.values()).find(
        fw => fw.name === bestMatchName || fw.aliases.includes(bestMatchName)
      );
      
      if (fuzzyMatch) {
        frameworkLogger.logFrameworkLookup(
          name,
          "frameworkRegistry.getFrameworkByName.fuzzy",
          true,
          { 
            matchedFramework: fuzzyMatch.name,
            confidence: matches[0][0],
            originalName: name
          }
        );
        return fuzzyMatch;
      }
    }
  }
  
  // 5. Handle hybrid frameworks
  if (name.toLowerCase().includes('hybrid') || name.includes('+')) {
    // Extract component frameworks
    let componentNames = [];
    
    if (name.includes('+')) {
      componentNames = name.split('+').map(n => n.trim());
    } else if (name.toLowerCase().includes('hybrid:')) {
      const afterHybrid = name.substring(name.toLowerCase().indexOf('hybrid:') + 7).trim();
      componentNames = afterHybrid.split('+').map(n => n.trim());
    } else if (name.toLowerCase().includes('hybrid')) {
      const afterHybrid = name.substring(name.toLowerCase().indexOf('hybrid') + 6).trim();
      componentNames = afterHybrid.split('+').map(n => n.trim());
    }
    
    // If we found component names, try to resolve them
    if (componentNames.length > 0) {
      // Normalize *and* lookup component names
      const resolvedComponents = componentNames.map(compName => {
        const resolved = getFrameworkByName(compName, options);
        return resolved ? resolved : compName; // Keep original if not found
      });
      
      // Check if resolved components contains another hybrid
      if(resolvedComponents.some(comp => typeof comp !== 'string' && comp.isHybrid)){
         frameworkLogger.logFrameworkLookup(
            name,
            "frameworkRegistry.getFrameworkByName.hybrid",
            false,
            { reason: "Nested hybrid frameworks are not supported"}
          );
        return null; // Do not create nested hybrids
      }
      
      // Create a synthetic hybrid framework name using *canonical* names
      const canonicalComponentNames = resolvedComponents.map(c => (typeof c === 'string' ? c : c.name));
      const hybridName = `Hybrid: ${canonicalComponentNames.join(' + ')}`;
      
      console.log("Creating hybrid framework:", hybridName);
      const hybridFramework = new Framework(
        `hybrid_${Date.now()}`,
        hybridName, // Use the constructed canonical name
        `Hybrid framework combining: ${canonicalComponentNames.join(', ')}`,
        []
      );
      
      console.log("Before setting isHybrid:", hybridFramework);
      // Use Object.defineProperty to ensure the property is enumerable
      Object.defineProperty(hybridFramework, 'isHybrid', {
        value: true,
        enumerable: true,
        writable: true,
        configurable: true
      });
      console.log("After setting isHybrid:", hybridFramework);
      console.log("isHybrid property value:", hybridFramework.isHybrid);
      console.log("hasOwnProperty('isHybrid'):", hybridFramework.hasOwnProperty('isHybrid'));
      console.log("Hybrid Framework ID (in registry):", hybridFramework.id);
      console.log("JSON.stringify(hybridFramework):", JSON.stringify(hybridFramework));
      
      hybridFramework.components = resolvedComponents;
      
      frameworkLogger.logFrameworkLookup(
        name,
        "frameworkRegistry.getFrameworkByName.hybrid",
        true,
        {
          components: componentNames,
          resolvedComponents: canonicalComponentNames
        }
      );
      
      return hybridFramework;
    }
  }
  
  // 6. No match found, log failure
  frameworkLogger.logFrameworkLookup(
    name,
    "frameworkRegistry.getFrameworkByName",
    false,
    { reason: "No matching framework found" }
  );
  
  // 7. Return unknown framework if fallback is enabled
  if (options.fallbackToUnknown !== false) {
    const unknownFramework = new Framework(
      `unknown_${Date.now()}`,
      name, // Keep original so we can identify it
      `Unknown framework: ${name}`,
      []
    );
    
    unknownFramework.isUnknown = true; // Direct assignment
    
    frameworkLogger.logFrameworkLookup(
      name,
      "frameworkRegistry.getFrameworkByName.fallback",
      true,
      { fallbackType: "unknown" }
    );
    
    return unknownFramework;
  }
  
  return null;
}

/**
 * Enable fuzzy matching for framework names
 * This is separated to avoid requiring the fuzzyset.js dependency
 * if it's not needed
 */
function enableFuzzyMatching() {
  try {
    // Try to require fuzzyset.js
    const FuzzySet = require('fuzzyset.js');
    frameworkSet = FuzzySet();
    
    // Add all framework names and aliases to the fuzzy set
    getAllFrameworks().forEach(framework => {
      frameworkSet.add(framework.name);
      framework.aliases.forEach(alias => frameworkSet.add(alias));
    });
    
    return true;
  } catch (error) {
    console.warn("Could not enable fuzzy matching:", error.message);
    console.warn("To enable fuzzy matching, install fuzzyset.js: npm install fuzzyset.js");
    return false;
  }
}

// Initialize the registry
initializeRegistry();

// Try to enable fuzzy matching
enableFuzzyMatching();

module.exports = {
  registerFramework,
  initializeRegistry,
  getFramework,
  getAllFrameworks,
  getFrameworkByName,
  enableFuzzyMatching,
  Framework
};
