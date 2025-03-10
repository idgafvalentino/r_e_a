/**
 * REA System: Reasoning by Ethical Analogy
 * Core Module
 * 
 * This module exports the core functionality of the REA system.
 * The CLI interface has been moved to cli.js.
 */

// --- Import necessary modules ---
const { deepClone, calculateStringSimilarity } = require('./utils');
const { applyAdaptationRules } = require('./adaptationRules');
const { generateReasoningPaths, handleNoMatchCase, identifyKeyDifferences } = require('./reasoningPath'); //reasoningPath exports
const { calculateSimilarity, findRelevantPrecedents } = require('./similarity');
const { detectConflicts, calculateConflictSeverity, detectAllConflicts } = require('./conflictDetection');
const { resolveConflicts, selectResolutionStrategy, generateReconciledArgument } = require('./conflictResolution');
const precedents = require('./precedents');

/**
 * Analyzes an ethical dilemma by finding relevant precedents, generating reasoning paths,
 * identifying conflicts, and producing reconciled paths.
 * 
 * @param {Object} dilemma - The ethical dilemma to analyze
 * @param {Array} [precedentDatabase=precedents] - Optional custom precedent database (defaults to built-in precedents)
 * @returns {Object} The analysis results containing reasoning paths, conflicts, and reconciled paths
 */
async function analyzeDilemma(dilemma, precedentDatabase = precedents) {
    // Find relevant precedents
    const relevantPrecedents = findRelevantPrecedents(dilemma, precedentDatabase);
    
    // Generate reasoning paths
    const reasoningPaths = await generateReasoningPaths(dilemma, precedentDatabase);
    
    // If we have relevant precedents, identify key differences with the best match
    let keyDifferences = [];
    let bestMatch = null;
    
    if (relevantPrecedents && relevantPrecedents.length > 0) {
        bestMatch = relevantPrecedents[0];
        keyDifferences = identifyKeyDifferences(dilemma, bestMatch.precedent);
    }
    
    // Detect conflicts between reasoning paths
    const conflicts = detectConflicts(reasoningPaths);
    
    // Resolve conflicts if any exist
    let resolvedPaths = [];
    if (conflicts.length > 0) {
        resolvedPaths = resolveConflicts(conflicts, reasoningPaths, dilemma);
    }
    
    return {
        dilemma,
        bestMatch,
        reasoningPaths,
        conflicts,
        resolvedPaths,
        keyDifferences,
        syntheticAnalysis: !bestMatch
    };
}

/**
 * Loads a dilemma from a file path
 * 
 * @param {string} filePath - Path to the dilemma JSON file
 * @returns {Object|null} The loaded dilemma or null if loading failed
 */
function loadDilemma(filePath) {
    try {
        const fs = require('fs');
        const dilemmaJson = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(dilemmaJson);
    } catch (error) {
        console.error(`Error loading dilemma: ${error.message}`);
        return null;
    }
}

/**
 * Gets the precedent database, either from the default location or a specified path
 * 
 * @param {string} [filePath] - Optional path to a custom precedent database
 * @returns {Array|null} The precedent database or null if loading failed
 */
function getPrecedentDatabase(filePath) {
    if (!filePath) {
        return precedents;
    }
    
    try {
        const fs = require('fs');
        const precedentsJson = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(precedentsJson);
    } catch (error) {
        console.error(`Error loading precedent database: ${error.message}`);
        return null;
    }
}

// --- Export the public API ---
module.exports = {
    analyzeDilemma,
    loadDilemma,
    getPrecedentDatabase,
    findRelevantPrecedents,
    generateReasoningPaths,
    detectConflicts,
    detectAllConflicts,
    resolveConflicts,
    calculateSimilarity,
    identifyKeyDifferences,
    applyAdaptationRules
}; 