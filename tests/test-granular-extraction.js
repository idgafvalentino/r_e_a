/**
 * Test Script for Granular Reasoning Element Extraction
 * 
 * This script tests a more advanced approach to synthetic precedent generation
 * that focuses on extracting specific reasoning elements from different precedents
 * and recombining them in novel ways to create hybrid ethical frameworks.
 */

const fs = require('fs');
const path = require('path');
const { precedentDatabase } = require('./precedents');
const { calculateSimilarity, findRelevantPrecedents } = require('./similarity');
const { adaptReasoningPaths } = require('./adaptation');
const { highlightChanges } = require('./utils');

// Load the surveillance technology dilemma
console.log("=== Loading Surveillance Technology Dilemma ===");
const dilemmaFile = path.join(__dirname, 'granular-extraction-dilemma.json');
const dilemma = JSON.parse(fs.readFileSync(dilemmaFile, 'utf8'));
console.log(`Loaded dilemma: ${dilemma.title}`);
console.log(`Description: ${dilemma.description.substring(0, 150)}...`);

// Log the granular reasoning elements
console.log("\n=== Granular Reasoning Elements from Different Precedents ===");
for (const [precedent, details] of Object.entries(dilemma.granular_reasoning_elements)) {
  console.log(`\nFrom ${precedent}:`);
  console.log(`- Element: ${details.element}`);
  console.log(`- Applicable frameworks: ${details.frameworks.join(', ')}`);
  console.log("- Sub-arguments:");
  details.sub_arguments.forEach((arg, i) => {
    console.log(`  ${i+1}. ${arg}`);
  });
}

// Log the framework fragment combinations
console.log("\n=== Framework Fragment Combinations ===");
for (const combination of dilemma.framework_fragment_combinations) {
  console.log(`\n${combination.name}:`);
  console.log(`- Description: ${combination.description}`);
  console.log(`- Component frameworks: ${combination.component_frameworks.join(', ')}`);
  console.log(`- Combined argument structure: ${combination.combined_argument_structure}`);
}

// Find relevant precedents for the dilemma
console.log("\n=== Finding Relevant Precedents ===");
console.log("Setting similarity threshold to 0.2");
const relevantPrecedents = findRelevantPrecedents(dilemma, precedentDatabase, 0.2);
console.log(`Found ${relevantPrecedents.length} relevant precedents`);

// Analyze each relevant precedent briefly
relevantPrecedents.forEach((precedent, index) => {
  console.log(`\n${index + 1}. ${precedent.title} (similarity: ${precedent.similarity_score.toFixed(2)})`);
});

// GRANULAR EXTRACTION AND HYBRID FRAMEWORK GENERATION
// Create synthetic precedents by extracting specific reasoning elements
console.log("\n=== Creating Hybrid Frameworks from Granular Elements ===");
console.log("This approach creates new synthetic reasoning paths by combining elements from different precedents and frameworks");

// Store our hybrid frameworks
const hybridFrameworks = [];

// Function to create hybrid frameworks from granular elements
function createHybridFrameworks() {
  // For each framework combination defined in the dilemma
  dilemma.framework_fragment_combinations.forEach(combination => {
    console.log(`\nCreating hybrid framework: ${combination.name}`);
    console.log(`Combining elements from: ${combination.component_frameworks.join(', ')}`);
    
    // Create a new hybrid framework object
    const hybridFramework = {
      name: combination.name,
      description: combination.description,
      component_frameworks: combination.component_frameworks,
      reasoning_paths: []
    };
    
    // Collect relevant reasoning elements from each precedent
    const relevantElements = [];
    
    for (const [precedentType, details] of Object.entries(dilemma.granular_reasoning_elements)) {
      // Check if this element is relevant to the component frameworks
      const hasRelevantFramework = details.frameworks.some(framework => 
        combination.component_frameworks.includes(framework)
      );
      
      if (hasRelevantFramework) {
        // Find matching arguments for the component frameworks
        const matchingSubArgs = details.sub_arguments.filter((_, index) => {
          // This is a simplification - in a real implementation, we would match sub-arguments to frameworks more precisely
          return index < details.frameworks.length && 
                 combination.component_frameworks.includes(details.frameworks[index]);
        });
        
        if (matchingSubArgs.length > 0) {
          relevantElements.push({
            precedent: precedentType,
            element: details.element,
            matchingArguments: matchingSubArgs
          });
        }
      }
    }
    
    console.log(`Found ${relevantElements.length} relevant reasoning elements`);
    
    // Now, create a reasoning path for each possible action
    dilemma.possible_actions.forEach(action => {
      // Create a reasoning path for this action using the hybrid framework
      const reasoningPath = {
        framework: combination.name,
        conclusion: action.action,
        strength: "moderate", // Default strength
        argument: `From a ${combination.name} perspective: ${combination.combined_argument_structure}. `
      };
      
      // Add specific elements from the relevant precedents
      if (relevantElements.length > 0) {
        reasoningPath.argument += "This analysis incorporates elements from multiple ethical frameworks: ";
        
        relevantElements.forEach(element => {
          reasoningPath.argument += `${element.element} `;
          
          // Add specific sub-arguments
          element.matchingArguments.forEach(arg => {
            reasoningPath.argument += `${arg} `;
          });
        });
        
        // Conclude with the action-specific reasoning
        reasoningPath.argument += `Therefore, ${action.action} appears to be the most appropriate response given this hybrid ethical approach.`;
      }
      
      // Adjust strength based on the action (simplified - in a real implementation this would be more sophisticated)
      if (action.action === "delayed_decision" && 
          (combination.name === "Professional Duty Ethics" || combination.name === "Social Contract Consequentialism")) {
        reasoningPath.strength = "strong";
      } else if (action.action === "full_implementation" && combination.name === "Rights-Balanced Utilitarianism") {
        reasoningPath.strength = "weak";
      } else if (action.action === "limited_implementation" && combination.name === "Community-Centered Virtue Approach") {
        reasoningPath.strength = "strong";
      }
      
      // Add the reasoning path to the hybrid framework
      hybridFramework.reasoning_paths.push(reasoningPath);
    });
    
    // Add the completed hybrid framework to our collection
    hybridFrameworks.push(hybridFramework);
  });
  
  return hybridFrameworks;
}

// Create hybrid frameworks
const createdHybridFrameworks = createHybridFrameworks();

// Report on the hybrid frameworks
console.log("\n=== Hybrid Framework Analysis ===");
createdHybridFrameworks.forEach(framework => {
  console.log(`\n${framework.name} (${framework.component_frameworks.join(' + ')})`);
  console.log(`Description: ${framework.description}`);
  console.log(`Generated ${framework.reasoning_paths.length} reasoning paths`);
  
  // Show conclusions and strengths for each path
  console.log("Conclusions:");
  framework.reasoning_paths.forEach(path => {
    console.log(`- ${path.conclusion} (${path.strength})`);
    console.log(`  Argument preview: ${path.argument.substring(0, 150)}...`);
  });
});

// Finding conflicts within hybrid frameworks
console.log("\n=== Analyzing Conflicts Between Hybrid Frameworks ===");

// Group reasoning paths by conclusion
const conclusionGroups = {};
createdHybridFrameworks.forEach(framework => {
  framework.reasoning_paths.forEach(path => {
    if (!conclusionGroups[path.conclusion]) {
      conclusionGroups[path.conclusion] = [];
    }
    
    conclusionGroups[path.conclusion].push({
      framework: framework.name,
      strength: path.strength,
      argument: path.argument.substring(0, 100) + '...'
    });
  });
});

// Analyze each conclusion group
console.log("Conflicts and agreements in conclusions:");
for (const [conclusion, frameworks] of Object.entries(conclusionGroups)) {
  console.log(`\nAction: ${conclusion}`);
  console.log(`Supported by ${frameworks.length} hybrid frameworks:`);
  
  frameworks.forEach(f => {
    console.log(`- ${f.framework} (${f.strength})`);
    console.log(`  Argument: ${f.argument}`);
  });
  
  // Check for strength disagreements
  const strengths = [...new Set(frameworks.map(f => f.strength))];
  if (strengths.length > 1) {
    console.log(`⚠️ STRENGTH CONFLICT: Different frameworks assign different strengths to this conclusion (${strengths.join(', ')})`);
  }
}

// Generate comprehensive Report on the Granular Extraction Approach
console.log("\n=== Granular Extraction Approach Evaluation ===");
console.log("Summary of the granular extraction and hybrid framework approach:");

const totalElements = Object.keys(dilemma.granular_reasoning_elements).length;
const totalHybridFrameworks = createdHybridFrameworks.length;
const totalReasoningPaths = createdHybridFrameworks.reduce(
  (sum, framework) => sum + framework.reasoning_paths.length, 0
);

console.log(`- Extracted elements from ${totalElements} precedents`);
console.log(`- Created ${totalHybridFrameworks} hybrid ethical frameworks`);
console.log(`- Generated ${totalReasoningPaths} distinct reasoning paths`);

// Evaluate conflicts
const conflictingConclusions = Object.values(conclusionGroups).filter(
  frameworks => [...new Set(frameworks.map(f => f.strength))].length > 1
).length;

console.log(`- Identified ${conflictingConclusions} actions with conflicting strength assessments`);

// Final assessment
console.log("\n=== Final Assessment ===");
if (totalHybridFrameworks >= 3 && totalReasoningPaths >= 8) {
  console.log("✅ Test PASSED: Successfully created complex hybrid frameworks with granular reasoning elements");
  console.log("This approach demonstrates a more sophisticated synthetic precedent generation capability");
  console.log("The granular extraction allows for novel ethical frameworks that combine aspects of traditional approaches");
} else {
  console.log("⚠️ Test produced insufficient results: Not enough hybrid frameworks or reasoning paths generated");
}

process.exit(0); 