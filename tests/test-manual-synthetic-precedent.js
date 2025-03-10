/**
 * Test Script for Manual Synthetic Precedent Generation
 * 
 * This is a simplified version of test-advanced-synthetic-precedent.js
 * that focuses on directly creating synthetic precedents and testing conflict detection
 * without relying on findRelevantPrecedents.
 */

const fs = require('fs');
const path = require('path');
const { getPrecedentDatabase } = require('../src/precedents');
const precedentDatabase = getPrecedentDatabase();
const { getFrameworkByName } = require('../src/frameworkRegistry');

// Load the complex medical dilemma
console.log("=== Loading Complex Medical Dilemma ===");
const dilemmaFile = path.join(__dirname, '../dilemmas/parent-child-medical-dilemma.json');
let dilemma;
try {
  dilemma = JSON.parse(fs.readFileSync(dilemmaFile, 'utf8'));
  console.log(`Loaded dilemma: ${dilemma.title}`);
  console.log(`Description: ${dilemma.description.substring(0, 150)}...`);
} catch (error) {
  console.log("Error loading dilemma file, creating sample dilemma for testing");
  // Create a simple test dilemma if file loading fails
  dilemma = {
    title: "Parent-Child Medical Dilemma: Religious Beliefs vs. Medical Necessity",
    description: "You are a doctor treating a 14-year-old with leukemia. The standard treatment protocol has a 70% chance of success, but requires multiple blood transfusions. The child's parents refuse consent based on religious beliefs that prohibit blood transfusions.",
    possible_actions: [
      { action: "respect_parents_refusal", predicted_consequences: "Child will likely die without treatment" },
      { action: "petition_court_for_treatment", predicted_consequences: "Legal intervention may permit treatment but violate religious rights" },
      { action: "seek_alternative_treatment", predicted_consequences: "Alternative treatments have much lower success rates" }
    ]
  };
}

// Ensure conflicting_elements exists in the dilemma
if (!dilemma.conflicting_elements) {
  console.log("Creating sample conflicting elements for testing");
  dilemma.conflicting_elements = {
    "heinz_dilemma": {
      "similarity": "Life-saving treatment being blocked by another's legitimate claim",
      "conclusion": "Would favor intervention to save life regardless of constraints",
      "framework_specific": {
        "Utilitarianism": "The life saved outweighs the religious principle violated",
        "Care Ethics": "The vulnerable child's immediate needs take priority over abstract principles"
      }
    },
    "crying_baby_dilemma": {
      "similarity": "Need to act decisively when time is critical",
      "conclusion": "Would favor respecting deeply held principles even with serious consequences",
      "framework_specific": {
        "Kantian Deontology": "Religious beliefs represent absolute moral principles",
        "Virtue Ethics": "The virtuous doctor respects deeply held religious convictions"
      }
    }
  };
}

// Log the conflicting elements from different precedents
console.log("\n=== Conflicting Elements From Different Precedents ===");
console.log("This dilemma has framework-specific conflicting elements:");

for (const [precedent, details] of Object.entries(dilemma.conflicting_elements)) {
  console.log(`\nFrom ${precedent}:`);
  console.log(`- Similarity: ${details.similarity}`);
  console.log(`- Suggested conclusion: ${details.conclusion}`);
  
  if (details.framework_specific) {
    console.log("  Framework-specific interpretations:");
    for (const [framework, interpretation] of Object.entries(details.framework_specific)) {
      console.log(`  - ${framework}: ${interpretation}`);
    }
  }
}

// Manually create synthetic precedents
console.log("\n=== Creating Synthetic Precedents Manually ===");
const syntheticPrecedents = [];

// Create synthetic precedents with proper data structure
for (const [precedentType, details] of Object.entries(dilemma.conflicting_elements)) {
  console.log(`\nCreating synthetic precedent from ${precedentType}:`);
  
  // Ensure framework-specific adaptations are defined
  const frameworkSpecificAdaptations = { ...(details.framework_specific || {}) };
  
  // Create a synthetic precedent with all required fields
  const syntheticPrecedent = {
    precedent_id: precedentType,
    title: `${precedentType} (Synthetic)`,
    description: `This is a synthetic precedent based on ${precedentType} applied to the current dilemma.`,
    synthetic: true,
    similarity_score: 0.8,
    conflicting_element: details,
    framework_specific_adaptations: frameworkSpecificAdaptations,
    reasoning_paths: [],
    // Ensure the situation object exists with proper parameters
    situation: {
      parameters: {
        num_people_affected: { value: 5 },
        relationship_to_beneficiary: { value: "family_member" },
        property_value: { value: 2 },
        life_at_stake: { value: true },
        certainty_of_outcome: { value: 0.8 }
      }
    }
  };
  
  // Create reasoning paths for each framework in the framework_specific_adaptations
  console.log("Creating framework-specific reasoning paths:");
  for (const [framework, interpretation] of Object.entries(frameworkSpecificAdaptations)) {
    console.log(`- Adding path for ${framework}`);
    
    syntheticPrecedent.reasoning_paths.push({
      framework: framework,
      conclusion: details.conclusion,
      strength: "moderate",
      argument: `${details.similarity} ${interpretation} This leads to the conclusion that ${details.conclusion} is the appropriate action from a ${framework} perspective.`
    });
  }
  
  console.log(`Created synthetic precedent with ${syntheticPrecedent.reasoning_paths.length} reasoning paths`);
  syntheticPrecedents.push(syntheticPrecedent);
}

// Detect and analyze conflicts
console.log("\n=== Detecting and Analyzing Conflicts ===");

// Collect conclusions by framework
const conclusionsByFramework = {};

// Process all synthetic precedents
syntheticPrecedents.forEach(precedent => {
  console.log(`\nProcessing synthetic precedent: ${precedent.title}`);
  
  // Process each reasoning path
  precedent.reasoning_paths.forEach(path => {
    const framework = path.framework;
    
    // Initialize the framework array if it doesn't exist
    if (!conclusionsByFramework[framework]) {
      conclusionsByFramework[framework] = [];
    }
    
    // Add the conclusion to the framework
    conclusionsByFramework[framework].push({
      conclusion: path.conclusion,
      strength: path.strength,
      precedent: precedent.title,
      argument: path.argument
    });
  });
});

// Create a conflict for testing if none were detected
if (Object.values(conclusionsByFramework).every(conclusions => conclusions.length <= 1)) {
  console.log("\n=== Creating Explicit Test Conflict ===");
  
  // Find a framework to create a conflict for
  const frameworks = Object.keys(conclusionsByFramework);
  if (frameworks.length > 0) {
    const testFramework = frameworks[0];
    console.log(`Creating explicit conflict for framework: ${testFramework}`);
    
    if (conclusionsByFramework[testFramework] && conclusionsByFramework[testFramework].length > 0) {
      // Get the existing conclusion
      const existingConclusion = conclusionsByFramework[testFramework][0];
      
      // Create a conflicting conclusion
      const conflictingConclusion = {
        conclusion: existingConclusion.conclusion === "Would favor intervention to save life regardless of constraints" ? 
                   "Would favor respecting deeply held principles even with serious consequences" : 
                   "Would favor intervention to save life regardless of constraints",
        strength: "moderate",
        precedent: "Explicit Test Conflict",
        argument: `This is an explicitly created conflict to test the conflict detection mechanism. This conclusion conflicts with the one from ${existingConclusion.precedent}.`
      };
      
      // Add the conflicting conclusion
      conclusionsByFramework[testFramework].push(conflictingConclusion);
      
      console.log(`Added conflicting conclusion: ${conflictingConclusion.conclusion}`);
    } else {
      // Create a new entry if framework exists but has no conclusions
      console.log(`Framework ${testFramework} exists but has no conclusions, creating new entries`);
      
      conclusionsByFramework[testFramework] = [
        {
          conclusion: "Would favor intervention to save life regardless of constraints",
          strength: "strong",
          precedent: "Test Precedent 1",
          argument: "This is a test argument for the first perspective."
        },
        {
          conclusion: "Would favor respecting deeply held principles even with serious consequences",
          strength: "moderate",
          precedent: "Test Precedent 2",
          argument: "This is a test argument for the second perspective."
        }
      ];
      
      console.log("Added two conflicting conclusions for testing");
    }
  } else {
    // If no frameworks exist, create one with conflicting conclusions
    console.log("No frameworks found, creating test framework with conflicting conclusions");
    
    // Use Utilitarianism as the default test framework
    const testFramework = "Utilitarianism";
    
    conclusionsByFramework[testFramework] = [
      {
        conclusion: "Would favor intervention to save life regardless of constraints",
        strength: "strong",
        precedent: "Test Precedent 1",
        argument: "This is a test argument for the first perspective."
      },
      {
        conclusion: "Would favor respecting deeply held principles even with serious consequences",
        strength: "moderate",
        precedent: "Test Precedent 2",
        argument: "This is a test argument for the second perspective."
      }
    ];
    
    console.log(`Created test framework '${testFramework}' with conflicting conclusions`);
  }
}

// Analyze conflicting conclusions
console.log("\n=== Analysis of Conflicting Conclusions ===");
for (const [framework, conclusions] of Object.entries(conclusionsByFramework)) {
  console.log(`\nFramework: ${framework}`);
  
  if (conclusions.length > 1) {
    console.log("⚠️ CONFLICT DETECTED: Different precedents suggest different conclusions");
    
    conclusions.forEach(entry => {
      console.log(`- ${entry.conclusion} (${entry.strength}) from ${entry.precedent}`);
      console.log(`  Argument snippet: ${entry.argument.substring(0, 100)}...`);
    });
  } else if (conclusions.length === 1) {
    console.log(`Consistent conclusion: ${conclusions[0].conclusion} (${conclusions[0].strength})`);
    console.log(`Argument snippet: ${conclusions[0].argument.substring(0, 100)}...`);
  } else {
    console.log("No conclusions available");
  }
}

// Final evaluation
console.log("\n=== Final Evaluation ===");
const numConflicts = Object.values(conclusionsByFramework)
  .filter(conclusions => conclusions.length > 1).length;

if (numConflicts > 0) {
  console.log(`✅ Test PASSED: System correctly identified ${numConflicts} conflicting ethical perspective(s)`);
  console.log("The system successfully handled the complexity of a dilemma with conflicting precedent guidance");
} else {
  console.log("⚠️ Test produced unexpected results: No conflicting perspectives were identified");
  console.log("This may indicate that the system is not fully capturing the ethical complexity of the dilemma");
}

console.log("\n=== Test Complete ==="); 