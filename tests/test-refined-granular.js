// test-refined-granular.js - Test file for refined granular argument construction

const fs = require('fs');
const path = require('path');
const { precedentDatabase } = require('./precedents');
const { calculateSimilarity, findRelevantPrecedents } = require('./similarity');
const { 
  extractAndCombineReasoningElements,
  getRelevantSubArguments
} = require('./granular-extraction');

// Load the test dilemma file
console.log("=== Testing Refined Granular Argument Construction ===");
const dilemmaFile = path.join(__dirname, 'granular-extraction-dilemma.json');
const dilemma = JSON.parse(fs.readFileSync(dilemmaFile, 'utf8'));
console.log(`Loaded dilemma: ${dilemma.title}`);

// Find relevant precedents
console.log("\n=== Finding Relevant Precedents ===");
const relevantPrecedents = findRelevantPrecedents(dilemma, precedentDatabase, 0.2);
console.log(`Found ${relevantPrecedents.length} relevant precedents`);

// Test refined granular extraction
console.log("\n=== Testing Refined Granular Extraction ===");
const result = extractAndCombineReasoningElements(dilemma, relevantPrecedents);

// Display results
console.log("\n=== Extraction Results ===");
console.log(`Extracted ${result.extractedElements.length} reasoning elements`);
console.log(`Grouped into ${Object.keys(result.elementsByFramework).length} frameworks`);
console.log(`Identified ${result.conflicts.length} conflicts`);
console.log(`Generated ${result.hybridFrameworks.length} hybrid frameworks`);
console.log(`Created ${result.syntheticPaths.length} synthetic reasoning paths`);

// Display one complete argument from each framework for better evaluation
console.log("\n=== Complete Synthetic Reasoning Paths with Improved Coherence ===");

// Display one argument for each action to show how the dynamic selection works
const frameworkToShow = 'Rights-Balanced Utilitarianism';
const actions = [
  'full_implementation',
  'limited_implementation',
  'reject_implementation',
  'delayed_decision'
];

// Find paths for the selected framework
const pathsByAction = {};
result.syntheticPaths.forEach(path => {
  if (path.framework === frameworkToShow) {
    pathsByAction[path.conclusion] = path;
  }
});

// Show one path for each action to demonstrate dynamic selection
actions.forEach(action => {
  const path = pathsByAction[action];
  if (path) {
    console.log(`\n--- ${frameworkToShow} reasoning for ${path.conclusion} ---`);
    console.log(`Strength: ${path.strength}`);
    console.log(`Argument:\n${path.argument}`);
    console.log("-----------------------------------------------------");
  }
});

// Demonstrate the dynamic element selection for sub-arguments
console.log("\n=== Demonstration of Dynamic Sub-Argument Selection ===");

// Get the granular reasoning elements from the dilemma
const granularElements = [];
if (dilemma.granular_reasoning_elements) {
  for (const [elementName, elementData] of Object.entries(dilemma.granular_reasoning_elements)) {
    // Create a mock element structure that matches what would be in extractedElements
    const mockElement = {
      id: `dilemma_${elementName}_core`,
      element_type: 'core_argument',
      content: elementData.element,
      frameworks: elementData.frameworks || [],
      sub_arguments: elementData.sub_arguments || [],
      weight: 1.0
    };
    
    granularElements.push(mockElement);
  }
}

// Test with different actions and see how different sub-arguments are selected
actions.forEach(action => {
  console.log(`\n--- Sub-Arguments Selected for "${action.replace('_', ' ')}" ---`);
  
  // Create a test action object
  const testAction = { action };
  
  // Get relevant sub-arguments
  const relevantSubArgs = getRelevantSubArguments(granularElements, testAction, dilemma.contextual_factors, 3);
  
  // Display the selected sub-arguments with their scores
  if (relevantSubArgs.length === 0) {
    console.log("No relevant sub-arguments found.");
  } else {
    relevantSubArgs.forEach((subArg, index) => {
      console.log(`${index + 1}. Score: ${subArg.score.toFixed(2)} | ${subArg.content}`);
      console.log(`   Source: ${subArg.source}`);
    });
  }
});

console.log("\n=== Test Complete ==="); 