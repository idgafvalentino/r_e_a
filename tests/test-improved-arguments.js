/**
 * Test file for improved argument construction
 * 
 * This test validates the enhanced argument construction process that builds
 * more nuanced reasoning paths based on granular elements.
 */

const fs = require('fs');
const path = require('path');
// Fix import paths to use ../src/ pattern
const { getPrecedentDatabase } = require('../src/precedents');
const { calculateSimilarity, findRelevantPrecedents } = require('../src/similarity');
const { 
  extractAndCombineReasoningElements,
  getRelevantSubArguments,
  selectRelevantElements
} = require('../src/granular-extraction');

// Load the test dilemma file
console.log("=== Testing Improved Argument Construction ===");
const dilemmaFile = path.join(__dirname, '..', 'dilemmas', 'granular-extraction-dilemma.json');
const dilemma = JSON.parse(fs.readFileSync(dilemmaFile, 'utf8'));
console.log(`Loaded dilemma: ${dilemma.title}`);

// Get precedent database
const precedentDatabase = getPrecedentDatabase();

// Find relevant precedents
console.log("\n=== Finding Relevant Precedents ===");
const relevantPrecedents = findRelevantPrecedents(dilemma, precedentDatabase, 0.2);
console.log(`Found ${relevantPrecedents.length} precedents with similarity >= 0.2`);

// Test improved argument construction
console.log("\n=== Testing Improved Argument Construction ===");
const result = extractAndCombineReasoningElements(dilemma, relevantPrecedents);

// Display results
console.log("\n=== Extraction Results ===");
console.log(`Extracted ${result.extractedElements.length} reasoning elements`);
console.log(`Grouped into ${Object.keys(result.elementsByFramework).length} frameworks`);
console.log(`Identified ${result.conflicts.length} conflicts`);
console.log(`Generated ${result.hybridFrameworks.length} hybrid frameworks`);
console.log(`Created ${result.syntheticPaths.length} synthetic reasoning paths`);

// Display one argument from each framework to demonstrate improved construction
console.log("\n=== Improved Argument Construction Examples ===");

// Display one argument for each framework with the same action (limited_implementation)
// This helps showcase the framework-specific differentiation
const targetAction = 'limited_implementation';
const displayedFrameworks = new Set(); // Track which frameworks we've already displayed

result.syntheticPaths.forEach(path => {
  if (path.conclusion === targetAction && !displayedFrameworks.has(path.framework)) {
    console.log(`\n--- ${path.framework} reasoning for ${path.conclusion} ---`);
    console.log(`Strength: ${path.strength}`);
    console.log(`Argument:\n${path.argument}`);
    console.log("-----------------------------------------------------");
    
    displayedFrameworks.add(path.framework);
  }
});

// Demonstrate element selection
console.log("\n=== Demonstration of Improved Element Selection ===");
// Select the first framework as an example
const exampleFramework = result.hybridFrameworks[0];

if (exampleFramework && exampleFramework.elements && exampleFramework.elements.length > 0) {
  console.log(`\nAll Elements for Framework "${exampleFramework.name}" (${exampleFramework.elements.length} total):`);
  
  // Display counts by element type
  const elementTypes = {};
  exampleFramework.elements.forEach(element => {
    const type = element.element_type || 'unknown';
    elementTypes[type] = (elementTypes[type] || 0) + 1;
  });
  
  Object.entries(elementTypes).forEach(([type, count]) => {
    console.log(`- ${type}: ${count} elements`);
  });
  
  // Select elements for different actions and compare
  const actions = dilemma.possible_actions || [];
  
  if (actions.length > 0) {
    actions.forEach(action => {
      console.log(`\n--- Elements Selected for "${action.action}" ---`);
      
      const selectedElements = selectRelevantElements(exampleFramework, action, dilemma.contextual_factors || []);
      
      // Count by type
      const selectedTypes = {};
      selectedElements.forEach(element => {
        const type = element.element_type || 'unknown';
        selectedTypes[type] = (selectedTypes[type] || 0) + 1;
      });
      
      Object.entries(selectedTypes).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} elements selected`);
      });
      
      // Display a few selected elements for this action
      console.log("\nTop selected elements:");
      selectedElements.slice(0, 3).forEach((element, index) => {
        const contentPreview = element.content ? 
          (element.content.length > 100 ? element.content.substring(0, 100) + '...' : element.content) : 
          'No content';
        
        console.log(`${index + 1}. [${element.element_type}] ${contentPreview}`);
      });
    });
  }
} else {
  console.log("No elements available to demonstrate selection");
}

console.log("\n=== Test Complete ==="); 