/**
 * Adaptation Rules - Index Module
 * 
 * This module exports all adaptation rule functions from the various rule files.
 * UPDATED: Now imports object-based adaptation rules from backend/src/adaptationRules.js
 * instead of the string-based functions in local files.
 */

// Import object-based adaptation rule functions from backend/src/adaptationRules.js
const {
  adaptNumberOfPeopleRule,
  adaptSpecialObligationsRule,
  adaptPropertyValueRule,
  adaptLifeVsPropertyRule,
  adaptCertaintyRule,
  adaptInformationAvailabilityRule,
  applyAdaptationRules
} = require('../../../backend/src/adaptationRules');

// We still need these for other functionality not covered by the object-based rules
const situationRules = require('./situation');
const frameworkRules = require('./framework');
const dilemmaRules = require('./dilemma');
const coreRules = require('./core');

/**
 * Apply all adaptation rules to a reasoning path
 * @param {Object} path - The reasoning path to adapt
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} context - Additional context information
 * @returns {Object} Fully adapted reasoning path
 */
function applyAllRules(path, dilemma, context) {
    if (!path || !dilemma) {
        return path;
    }
    
    let adaptedPath = { ...path };
    
    // Use object-based adaptation rules instead of string-based ones
    if (context && context.originalDilemma) {
        // Apply the object-based adaptation rules that compare the dilemma to an original
        adaptedPath = adaptNumberOfPeopleRule(adaptedPath, dilemma, context.originalDilemma);
        adaptedPath = adaptSpecialObligationsRule(adaptedPath, dilemma, context.originalDilemma);
        adaptedPath = adaptPropertyValueRule(adaptedPath, dilemma, context.originalDilemma);
        adaptedPath = adaptLifeVsPropertyRule(adaptedPath, dilemma, context.originalDilemma);
        
        // Apply additional specialized rules if they exist
        if (typeof adaptCertaintyRule === 'function') {
            adaptedPath = adaptCertaintyRule(adaptedPath, dilemma, context.originalDilemma);
        }
        if (typeof adaptInformationAvailabilityRule === 'function') {
            adaptedPath = adaptInformationAvailabilityRule(adaptedPath, dilemma, context.originalDilemma);
        }
    } else {
        // For backwards compatibility, still use the string-based rules
        // when an original dilemma isn't provided
        
        // Apply core rules first
        adaptedPath = coreRules.applyBasicAdaptations(adaptedPath, dilemma, context);
    }
    
    // Apply situation-based rules
    adaptedPath = situationRules.adaptToEmergency(adaptedPath, dilemma, context);
    adaptedPath = situationRules.adaptToResourceConstraints(adaptedPath, dilemma, context);
    adaptedPath = situationRules.adaptToUncertainty(adaptedPath, dilemma, context);
    
    // Apply framework-based rules
    adaptedPath = frameworkRules.adaptUtilitarianReasoning(adaptedPath, dilemma, context);
    adaptedPath = frameworkRules.adaptDeontologicalReasoning(adaptedPath, dilemma, context);
    adaptedPath = frameworkRules.adaptVirtueEthicsReasoning(adaptedPath, dilemma, context);
    
    // Apply dilemma-specific rules
    adaptedPath = dilemmaRules.adaptForStakeholderCount(adaptedPath, dilemma, context);
    adaptedPath = dilemmaRules.adaptForDilemmaSeverity(adaptedPath, dilemma, context);
    adaptedPath = dilemmaRules.adaptForTemporalAspects(adaptedPath, dilemma, context);
    
    return adaptedPath;
}

/**
 * Apply only specific categories of rules
 * @param {Object} path - The reasoning path to adapt
 * @param {Object} dilemma - The ethical dilemma
 * @param {Object} context - Additional context information
 * @param {Array<string>} categories - Categories of rules to apply ('core', 'situation', 'framework', 'dilemma')
 * @returns {Object} Adapted reasoning path
 */
function applyRuleCategories(path, dilemma, context, categories) {
    if (!path || !dilemma || !categories || !Array.isArray(categories)) {
        return path;
    }
    
    let adaptedPath = { ...path };
    
    // Apply core rules if requested
    if (categories.includes('core')) {
        if (context && context.originalDilemma) {
            // Apply the object-based adaptation rules
            adaptedPath = adaptNumberOfPeopleRule(adaptedPath, dilemma, context.originalDilemma);
            adaptedPath = adaptSpecialObligationsRule(adaptedPath, dilemma, context.originalDilemma);
            adaptedPath = adaptPropertyValueRule(adaptedPath, dilemma, context.originalDilemma);
            adaptedPath = adaptLifeVsPropertyRule(adaptedPath, dilemma, context.originalDilemma);
            
            // Apply additional specialized rules if they exist
            if (typeof adaptCertaintyRule === 'function') {
                adaptedPath = adaptCertaintyRule(adaptedPath, dilemma, context.originalDilemma);
            }
            if (typeof adaptInformationAvailabilityRule === 'function') {
                adaptedPath = adaptInformationAvailabilityRule(adaptedPath, dilemma, context.originalDilemma);
            }
        } else {
            adaptedPath = coreRules.applyBasicAdaptations(adaptedPath, dilemma, context);
        }
    }
    
    // Apply situation-based rules if requested
    if (categories.includes('situation')) {
        adaptedPath = situationRules.adaptToEmergency(adaptedPath, dilemma, context);
        adaptedPath = situationRules.adaptToResourceConstraints(adaptedPath, dilemma, context);
        adaptedPath = situationRules.adaptToUncertainty(adaptedPath, dilemma, context);
    }
    
    // Apply framework-based rules if requested
    if (categories.includes('framework')) {
        adaptedPath = frameworkRules.adaptUtilitarianReasoning(adaptedPath, dilemma, context);
        adaptedPath = frameworkRules.adaptDeontologicalReasoning(adaptedPath, dilemma, context);
        adaptedPath = frameworkRules.adaptVirtueEthicsReasoning(adaptedPath, dilemma, context);
    }
    
    // Apply dilemma-specific rules if requested
    if (categories.includes('dilemma')) {
        adaptedPath = dilemmaRules.adaptForStakeholderCount(adaptedPath, dilemma, context);
        adaptedPath = dilemmaRules.adaptForDilemmaSeverity(adaptedPath, dilemma, context);
        adaptedPath = dilemmaRules.adaptForTemporalAspects(adaptedPath, dilemma, context);
    }
    
    return adaptedPath;
}

// Export all rule functions
module.exports = {
    // Main adaptation functions
    applyAllRules,
    applyRuleCategories,
    
    // Object-based core adaptation rules
    adaptNumberOfPeopleRule,
    adaptSpecialObligationsRule,
    adaptPropertyValueRule,
    adaptLifeVsPropertyRule,
    adaptCertaintyRule,
    adaptInformationAvailabilityRule,
    
    // We still export the other rule modules for backwards compatibility
    // Core rules
    ...coreRules,
    
    // Situation rules
    ...situationRules,
    
    // Framework rules
    ...frameworkRules,
    
    // Dilemma rules
    ...dilemmaRules
}; 