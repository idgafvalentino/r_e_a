const fs = require('fs');
const path = require('path');

// Import the necessary modules from our system
const { precedentDatabase } = require('./precedents');
const { calculateSimilarity, findRelevantPrecedents } = require('./similarity');
const { adaptReasoningPaths } = require('./adaptation');
const { highlightChanges } = require('./utils');

console.log("=== TESTING HYBRID DILEMMA HANDLING ===\n");

// Load the hybrid dilemma from the JSON file
const hybridDilemmaPath = path.join(__dirname, 'hybrid-dilemma.json');
const hybridDilemmaJson = fs.readFileSync(hybridDilemmaPath, 'utf8');
const hybridDilemma = JSON.parse(hybridDilemmaJson);

console.log(`Testing with hybrid dilemma: ${hybridDilemma.title}`);
console.log(hybridDilemma.description);
console.log("\nFinding relevant precedents...");

// Find the most relevant precedents for the hybrid dilemma
const relevantPrecedents = findRelevantPrecedents(hybridDilemma, precedentDatabase, 0.3);

console.log(`\nFound ${relevantPrecedents.length} relevant precedents:`);
for (const result of relevantPrecedents) {
  console.log(`- ${result.precedent.title} (similarity: ${result.similarityScore.toFixed(2)})`);
}

// If we have at least one relevant precedent, test adaptation
if (relevantPrecedents.length > 0) {
  const bestMatch = relevantPrecedents[0];
  console.log(`\nAdapting reasoning paths from best match: ${bestMatch.precedent.title}`);
  
  // Apply adaptation rules
  const adaptedPaths = adaptReasoningPaths(bestMatch.precedent, hybridDilemma);
  console.log(`Adaptation complete. ${adaptedPaths.length} paths adapted.`);
  
  // Check if adaptations were successful by looking for changes in the arguments
  console.log("\nHighlighted changes in reasoning paths:");
  for (let i = 0; i < adaptedPaths.length; i++) {
    const originalPath = bestMatch.precedent.reasoning_paths[i];
    const adaptedPath = adaptedPaths[i];
    
    if (originalPath && adaptedPath) {
      console.log(`\nFramework: ${adaptedPath.framework}`);
      const highlighted = highlightChanges(originalPath.argument, adaptedPath.argument);
      console.log(highlighted);
    }
  }
}

console.log("\n=== HYBRID DILEMMA TESTING COMPLETE ==="); 