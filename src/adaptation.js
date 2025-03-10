/**
 * Adaptation methods for the REA system
 * This module provides functions for adapting reasoning paths from precedent dilemmas
 * to new dilemmas based on similarity and contextual factors.
 */

const { getContextualFactor, getParameter, weakenStrength, getCertaintyFactor, getFactorValue, deepCopy } = require('./utils');
const adaptationRules = require('./adaptationRules');
const fs = require('fs');

/**
 * Adapts reasoning paths from a precedent to a new dilemma
 * @param {Object} precedent The precedent dilemma or object containing precedent info
 * @param {Object} dilemma The new dilemma to adapt reasoning for
 * @param {Object|boolean} originalDilemmaOrSkipFlag The original dilemma or a flag to skip argument adaptation
 * @returns {Array} Array of adapted reasoning paths
 */
function adaptReasoningPaths(precedent, dilemma, originalDilemmaOrSkipFlag = false) {
  // Determine if the third parameter is a dilemma object or a boolean flag
  let skipArgumentAdaptation = false;
  let originalDilemma = null;
  
  if (originalDilemmaOrSkipFlag && typeof originalDilemmaOrSkipFlag === 'object') {
    // Third parameter is the original dilemma
    originalDilemma = originalDilemmaOrSkipFlag;
  } else if (typeof originalDilemmaOrSkipFlag === 'boolean') {
    // Third parameter is the skip flag
    skipArgumentAdaptation = originalDilemmaOrSkipFlag;
  }
  
  // Guard against null/undefined inputs
  if (!precedent || !dilemma) {
    console.warn("adaptReasoningPaths called with null/undefined precedent or dilemma");
    return precedent && precedent.reasoning_paths ? [...precedent.reasoning_paths] : [];
  }
  
  // Extract reasoning paths based on different object structures
  let reasoningPaths = [];
  if (precedent.reasoning_paths) {
    reasoningPaths = precedent.reasoning_paths;
  } else if (precedent.precedent && precedent.precedent.reasoning_paths) {
    reasoningPaths = precedent.precedent.reasoning_paths;
  }
  
  if (!reasoningPaths || reasoningPaths.length === 0) {
    console.warn(`No reasoning paths found in precedent "${precedent.title || precedent.name || 'Unknown'}"`);
    return [];
  }
  
  // Check for unknown precedent ID
  const precedentId = precedent.precedent_id || (precedent.precedent && precedent.precedent.precedent_id);
  if (!precedentId || precedentId === 'not_a_real_precedent_type' || precedentId === 'unknown') {
    console.warn(`Unknown precedent ID: ${precedentId}. Skipping adaptation rules.`);
    return [...reasoningPaths]; // Return a copy of the original paths without adaptation
  }
  
  // If no original dilemma is provided, use the precedent as the original dilemma
  if (!originalDilemma) {
    originalDilemma = precedent;
  }
  
  // Adapt each reasoning path
  const adaptedPaths = reasoningPaths.map((path, i) => {
    // Create a deep copy of the path to modify
    let adaptedPath = deepCopy(path);
    
    // Conditionally modify the argument to reflect the new dilemma
    if (!skipArgumentAdaptation) {
      adaptedPath.argument = adaptArgumentForNewDilemma(
        path.argument,
        precedent,
        dilemma
      );
    }
    
    // Apply adaptation rules to the reasoning path
    try {
      // Apply each rule with a fresh copy of the current adapted path
      
      // Apply number of people rule
      if (adaptationRules.adaptNumberOfPeopleRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptNumberOfPeopleRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result; // Only use result if not null/undefined
        } catch (error) {
          console.error(`Error applying adaptNumberOfPeopleRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply certainty rule
      if (adaptationRules.adaptCertaintyRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptCertaintyRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptCertaintyRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply information availability rule
      if (adaptationRules.adaptInformationAvailabilityRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptInformationAvailabilityRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptInformationAvailabilityRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply medical triage context rule
      if (adaptationRules.adaptMedicalTriageContextRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptMedicalTriageContextRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptMedicalTriageContextRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply time pressure rule
      if (adaptationRules.adaptTimePressureRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptTimePressureRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptTimePressureRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply resource divisibility rule
      if (adaptationRules.adaptResourceDivisibilityRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptResourceDivisibilityRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptResourceDivisibilityRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply exhausted alternatives rule
      if (adaptationRules.adaptExhaustedAlternativesRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptExhaustedAlternativesRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptExhaustedAlternativesRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply special obligations rule
      if (adaptationRules.adaptSpecialObligationsRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptSpecialObligationsRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptSpecialObligationsRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply property value rule
      if (adaptationRules.adaptPropertyValueRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptPropertyValueRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptPropertyValueRule: ${error.message}`, error.stack);
        }
      }
      
      // Apply life vs property rule
      if (adaptationRules.adaptLifeVsPropertyRule) {
        const rulePath = deepCopy(adaptedPath); // Deep copy the path before applying the rule
        try {
          const result = adaptationRules.adaptLifeVsPropertyRule(rulePath, dilemma, originalDilemma);
          if (result) adaptedPath = result;
        } catch (error) {
          console.error(`Error applying adaptLifeVsPropertyRule: ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      console.warn(`Error applying adaptation rules: ${error.message}`);
    }
    
    return adaptedPath;
  });
  
  return adaptedPaths;
}

/**
 * Adapts an argument from a precedent to a new dilemma by replacing key terms and concepts
 * @param {string} originalArgument The original argument from the precedent
 * @param {Object} precedent The precedent dilemma
 * @param {Object} dilemma The new dilemma to adapt to
 * @returns {string} The adapted argument
 */
function adaptArgumentForNewDilemma(originalArgument, precedent, dilemma) {
  if (!originalArgument || typeof originalArgument !== 'string') {
    return 'No argument available for adaptation';
  }
  
  if (!precedent || !dilemma) {
    return originalArgument;
  }
  
  let adaptedArgument = originalArgument;
  
  // Replace direct references to the precedent title/name with the new dilemma's title/name
  const precedentTitle = precedent.title || precedent.name || 'the precedent dilemma';
  const dilemmaTitle = dilemma.title || dilemma.name || 'the current dilemma';
  
  // Use a simpler approach that won't create circular replacements
  
  // 1. First, just replace the dilemma title/name references
  const titleRegex = new RegExp(`\\b${escapeRegExp(precedentTitle)}\\b`, 'gi');
  adaptedArgument = adaptedArgument.replace(titleRegex, dilemmaTitle);
  
  // 2. Replace generic references
  adaptedArgument = adaptedArgument
    .replace(/\bthis dilemma\b/gi, dilemmaTitle)
    .replace(/\bthe dilemma\b/gi, dilemmaTitle);
  
  // 3. Make simple, targeted replacements for common terms
  // Instead of using complex extraction, use a simple mapping approach
  const replacements = getSimpleReplacements(precedent, dilemma);
  
  // Apply each replacement only once, with word boundaries
  for (const [oldTerm, newTerm] of Object.entries(replacements)) {
    if (oldTerm && newTerm && oldTerm !== newTerm) {
      const termRegex = new RegExp(`\\b${escapeRegExp(oldTerm)}\\b`, 'gi');
      adaptedArgument = adaptedArgument.replace(termRegex, newTerm);
    }
  }
  
  // Add an adaptation note at the end
  adaptedArgument += `\n\n[ADAPTED: This reasoning has been adapted from the "${precedentTitle}" precedent to the "${dilemmaTitle}" dilemma.]`;
  
  return adaptedArgument;
}

/**
 * Helper function to escape special characters in regular expressions
 * @param {string} string String to escape
 * @returns {string} Escaped string safe for regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a simple mapping of terms to replace from precedent to dilemma
 * @param {Object} precedent The precedent dilemma
 * @param {Object} dilemma The new dilemma
 * @returns {Object} A mapping of terms to replace
 */
function getSimpleReplacements(precedent, dilemma) {
  const replacements = {};
  
  // Type replacement
  if (precedent.situation?.type && dilemma.situation?.type) {
    replacements[precedent.situation.type] = dilemma.situation.type;
  }
  
  // Simple mapping for common medical ethics terms
  if (precedent.precedent_id === 'transplant_dilemma' && 
      (dilemma.precedent_id === 'medical_triage' || dilemma.situation?.type === 'ResourceAllocationDilemma')) {
    replacements['traveler'] = 'patient';
    replacements['one person'] = 'some patients';
    replacements['five patients'] = 'many patients';
    replacements['organ transplants'] = 'medical resources';
    replacements['transplant'] = 'treatment';
    replacements['harvesting organs'] = 'withholding treatment';
  }
  
  // Simple mapping for trolley problem to medical scenarios
  if (precedent.precedent_id === 'trolley_problem' && 
      (dilemma.precedent_id === 'medical_triage' || dilemma.situation?.type === 'ResourceAllocationDilemma')) {
    replacements['trolley'] = 'resources';
    replacements['track'] = 'treatment path';
    replacements['lever'] = 'decision';
    replacements['pull the lever'] = 'allocate resources';
    replacements['five people'] = 'many patients';
    replacements['one person'] = 'some patients';
  }
  
  return replacements;
}

/**
 * Extracts key terms from a dilemma for use in adaptation
 * @param {Object} dilemma The dilemma to extract terms from
 * @returns {Object} An object containing categorized key terms
 */
function extractKeyTerms(dilemma) {
  const terms = {
    actors: [],
    actions: [],
    resources: [],
    stakeholders: [],
    context: ''
  };
  
  if (!dilemma) return terms;
  
  // Extract from situation
  if (dilemma.situation) {
    // Extract context
    terms.context = dilemma.situation.context || '';
    
    // Extract from description
    if (dilemma.situation.description) {
      const description = dilemma.situation.description.toLowerCase();
      
      // Look for common actor terms
      const actorTerms = ['doctor', 'patient', 'person', 'people', 'individual', 'authority', 'traveler'];
      actorTerms.forEach(term => {
        if (description.includes(term)) {
          terms.actors.push(term);
        }
      });
      
      // Look for common action terms
      const actionTerms = ['pull', 'push', 'save', 'kill', 'harm', 'help', 'treat', 'prioritize'];
      actionTerms.forEach(term => {
        if (description.includes(term)) {
          terms.actions.push(term);
        }
      });
      
      // Look for common resource terms
      const resourceTerms = ['trolley', 'lever', 'organ', 'drug', 'medicine', 'ventilator', 'resource'];
      resourceTerms.forEach(term => {
        if (description.includes(term)) {
          terms.resources.push(term);
        }
      });
      
      // Look for common stakeholder terms
      const stakeholderTerms = ['patient', 'victim', 'family', 'community', 'society'];
      stakeholderTerms.forEach(term => {
        if (description.includes(term)) {
          terms.stakeholders.push(term);
        }
      });
    }
    
    // Extract from parameters
    if (dilemma.situation.parameters) {
      const params = dilemma.situation.parameters;
      
      // Extract numeric parameters
      if (params.num_people_main_track) {
        terms.stakeholders.push(`${params.num_people_main_track} people on main track`);
      }
      
      if (params.num_people_side_track) {
        terms.stakeholders.push(`${params.num_people_side_track} person on side track`);
      }
      
      if (params.num_total_people) {
        terms.stakeholders.push(`${params.num_total_people} total people`);
      }
      
      if (params.num_can_be_saved) {
        terms.stakeholders.push(`${params.num_can_be_saved} can be saved`);
      }
      
      // Extract resource type
      if (params.resource_type) {
        terms.resources.push(params.resource_type);
      }
    }
  }
  
  // Extract from contextual factors
  if (dilemma.contextual_factors && Array.isArray(dilemma.contextual_factors)) {
    dilemma.contextual_factors.forEach(factor => {
      const factorName = factor.factor || factor.name || '';
      const factorValue = factor.value || '';
      
      if (factorName.includes('actor') || factorName.includes('role')) {
        terms.actors.push(factorValue);
      } else if (factorName.includes('resource')) {
        terms.resources.push(factorValue);
      } else if (factorName.includes('stakeholder') || factorName.includes('relationship')) {
        terms.stakeholders.push(factorValue);
      }
    });
  }
  
  // Clean up and deduplicate
  for (const category in terms) {
    if (Array.isArray(terms[category])) {
      terms[category] = [...new Set(terms[category])]; // Remove duplicates
    }
  }
  
  return terms;
}

/**
 * Represents an adaptation rule.
 * @typedef {Object} AdaptationRule
 * @property {string} type - The type of adaptation rule (e.g., "parameter_adjustment", "factor_relevancy").
 * @property {string} description - A brief description of the rule.
 * @property {function} apply - A function that applies the rule to a framework.
 */

// Note: adaptationRules is now imported from './adaptationRules' at the top of the file

/**
 * Applies adaptation rules to a framework based on the dilemma and action.
 * @param {Object} framework - The ethical framework to adapt.
 * @param {Object} dilemma - The ethical dilemma.
 * @param {string} action - The action being considered.
 * @returns {Object} The adapted framework.
 */
async function applyAdaptationRules(framework, dilemma, action) {
    if (!framework) {
        console.error("No framework provided for adaptation.");
        return null;
    }

    // Using JSON parse/stringify instead of deepClone
    let adaptedFramework = JSON.parse(JSON.stringify(framework)); // Deep clone

    // Apply each adaptation rule in sequence
    for (const ruleKey in adaptationRules) {
        if (adaptationRules.hasOwnProperty(ruleKey)) {
            const rule = adaptationRules[ruleKey];
            try {
                adaptedFramework = rule.apply(adaptedFramework, dilemma, action);
            } catch (error) {
                console.error(`Error applying adaptation rule ${ruleKey}:`, error);
                // Continue with other rules even if one fails
            }
        }
    }

    return adaptedFramework;
}

module.exports = {
    adaptReasoningPaths,
    adaptArgumentForNewDilemma,
    applyAdaptationRules
};
