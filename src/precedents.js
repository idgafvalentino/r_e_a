/**
 * Precedent database management for the REA system
 * This module provides functions for loading, saving, and managing precedent dilemmas
 */

const fs = require('fs');
const path = require('path');
const similarity = require('./similarity');

/**
 * Returns the precedent database
 * @returns {Array} Array of precedent dilemmas
 */
function getPrecedentDatabase() {
  try {
    const databasePath = path.join(__dirname, '..', 'data', 'precedent-database.json');
    console.log(`Loading precedents from: ${databasePath}`);
    
    const data = fs.readFileSync(databasePath, 'utf8');
    const rawPrecedents = JSON.parse(data);
    
    // Normalize precedent objects to ensure they all have 'id' field
    const precedents = rawPrecedents.map(p => {
      // If a precedent has precedent_id but no id, map it
      if (p.precedent_id && !p.id) {
        return { ...p, id: p.precedent_id };
      }
      return p;
    });
    
    console.log(`Loaded ${precedents.length} precedents from database`);
    console.log("Precedent IDs:", precedents.map(p => p.id || p.precedent_id || "MISSING_ID"));
    
    // Check for missing IDs
    const missingIds = precedents.filter(p => !p.id && !p.precedent_id).length;
    if (missingIds > 0) {
      console.warn(`WARNING: ${missingIds} precedents have missing IDs`);
    }
    
    // Log the first precedent structure as a sample
    if (precedents.length > 0) {
      console.log("Sample precedent structure:", JSON.stringify(precedents[0], (key, val) => {
        if (key === 'reasoning_paths') return '[reasoning_paths array]';
        return val;
      }, 2));
    }
    
    return precedents;
  } catch (error) {
    console.error(`Error loading precedent database: ${error.message}`);
    return [];
  }
}

/**
 * Adds a new precedent to the database
 * @param {Object} precedent The precedent dilemma to add
 * @returns {boolean} Success status
 */
function addPrecedentToDatabase(precedent) {
  try {
    const precedentDatabase = getPrecedentDatabase();
    precedentDatabase.push(precedent);
    
    // Save the updated database
    const dbPath = path.join(__dirname, '..', 'data', 'precedent-database.json');
    fs.writeFileSync(dbPath, JSON.stringify(precedentDatabase, null, 2));
    return true;
  } catch (error) {
    console.error('Error adding precedent to database:', error);
    return false;
  }
}

/**
 * Find relevant precedents from the database based on similarity threshold
 * @param {Object} currentDilemma The current dilemma to find precedents for
 * @param {Array} precedentDatabase Array of precedent dilemmas to search through
 * @param {number} threshold Minimum similarity threshold (0-1)
 * @returns {Array} Array of relevant precedents with similarity scores
 */
function findRelevantPrecedents(currentDilemma, precedentDatabase, threshold = 0.3) {
  if (!currentDilemma || !precedentDatabase || !Array.isArray(precedentDatabase)) {
    console.warn('Invalid inputs to findRelevantPrecedents');
    return [];
  }
  
  // First make sure all precedents have reasoning_paths property
  const validatedPrecedents = precedentDatabase.map(precedent => {
    // Create a copy to avoid modifying the original
    const validatedPrecedent = { ...precedent };
    
    // Ensure reasoning_paths exists
    if (!validatedPrecedent.reasoning_paths) {
      validatedPrecedent.reasoning_paths = [];
    }
    
    return validatedPrecedent;
  });
  
  const relevantPrecedents = validatedPrecedents
    .map(precedent => {
      // Calculate similarity between current dilemma and this precedent
      const similarityValue = similarity.calculateSimilarity(currentDilemma, precedent);
      return {
        ...precedent,  // Include the precedent properties directly
        similarity: similarityValue  // Use 'similarity' instead of 'similarityScore'
      };
    })
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
  
  return relevantPrecedents;
}

module.exports = {
  getPrecedentDatabase,
  addPrecedentToDatabase,
  findRelevantPrecedents
};
