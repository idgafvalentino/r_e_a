const fs = require('fs');
const path = require('path');

// Import the necessary modules from our system
const { precedentDatabase } = require('./precedents');
const { calculateSimilarity, findRelevantPrecedents } = require('./similarity');
const { adaptReasoningPaths } = require('./adaptation');
const { highlightChanges } = require('./utils');

console.log("=== COMPREHENSIVE TESTING OF REA SYSTEM ===\n");

// 1. Test the JSON input handling with different structures
console.log("TEST 1: JSON INPUT HANDLING\n");

// Test with simplified structure
const simplifiedDilemma = {
  title: "Medical Resource Allocation - Simplified Format",
  description: "A doctor must decide how to allocate scarce medical resources.",
  parameters: {
    num_total_people: 20,
    num_can_be_saved: 15,
    resource_type: "lifeboat_space",
    time_constraint: "urgent"
  },
  contextual_factors: {
    time_pressure: "extreme",
    resource_scarcity: "absolute",
    decision_maker_role: "participant_and_authority",
    relationship_between_stakeholders: "strangers_with_shared_fate",
    certainty_of_outcome: "high"
  }
};

// Test with detailed structure
const detailedDilemma = {
  title: "Medical Resource Allocation - Detailed Format",
  description: "A doctor must decide how to allocate scarce medical resources.",
  situation: {
    type: "ResourceAllocationDilemma",
    description: "During a pandemic, a hospital has limited ventilators for patients in need.",
    parameters: {
      num_total_people: 20,
      num_can_be_saved: 15,
      resource_type: "lifeboat_space",
      time_constraint: "urgent"
    }
  },
  contextual_factors: [
    {
      factor: "time_pressure", 
      value: "extreme",
      relevance: "high"
    },
    {
      factor: "resource_scarcity",
      value: "absolute",
      relevance: "high"
    },
    {
      factor: "decision_maker_role",
      value: "participant_and_authority",
      relevance: "high"
    },
    {
      factor: "relationship_between_stakeholders",
      value: "strangers_with_shared_fate",
      relevance: "medium"
    },
    {
      factor: "certainty_of_outcome",
      value: "high",
      relevance: "high"
    }
  ]
};

// Function to process JSON dilemma (similar to promptForDilemma)
function processJsonDilemma(dilemma) {
  console.log("Processing dilemma:", dilemma.title);
  
  // Add/validate the required fields
  dilemma.precedent_id = dilemma.precedent_id || "user_input_" + Date.now();
  
  // Handle different structures for parameters and contextual factors
  if (!dilemma.situation) {
    // If situation missing but parameters present, create situation
    if (dilemma.parameters) {
      console.log("Converting flat parameters structure to required format...");
      dilemma.situation = {
        type: "UserDefinedDilemma",
        description: dilemma.description,
        parameters: dilemma.parameters
      };
    } else {
      // Create empty situation and parameters if none exist
      dilemma.situation = {
        type: "UserDefinedDilemma",
        description: dilemma.description,
        parameters: {}
      };
      dilemma.parameters = {};
      console.log("Warning: No parameters provided. Using empty parameters object.");
    }
  } else if (!dilemma.situation.parameters) {
    // If situation exists but no parameters
    dilemma.situation.parameters = dilemma.parameters || {};
  }
  
  // Handle contextual factors
  if (!Array.isArray(dilemma.contextual_factors)) {
    // If contextual_factors is an object but not an array
    if (dilemma.contextual_factors && typeof dilemma.contextual_factors === 'object') {
      console.log("Converting flat contextual factors structure to required format...");
      // Convert object format to array format
      const factorsArray = [];
      for (const [factor, value] of Object.entries(dilemma.contextual_factors)) {
        factorsArray.push({
          factor: factor,
          value: value,
          relevance: "medium" // Default relevance when not specified
        });
      }
      dilemma.contextual_factors = factorsArray;
    } else {
      // Create empty array
      dilemma.contextual_factors = [];
      console.log("Warning: No contextual factors provided. Using empty factors array.");
    }
  }
  
  // If no reasoning_paths, create an empty array
  if (!Array.isArray(dilemma.reasoning_paths)) {
    dilemma.reasoning_paths = [];
  }
  
  return dilemma;
}

// Test processing a simplified dilemma
console.log("Testing simplified dilemma structure...");
const processedSimplified = processJsonDilemma(simplifiedDilemma);
console.log("Simplified dilemma processed successfully.\n");

// Test processing a detailed dilemma
console.log("Testing detailed dilemma structure...");
const processedDetailed = processJsonDilemma(detailedDilemma);
console.log("Detailed dilemma processed successfully.\n");

// 2. Test the similarity calculation with both structures
console.log("\nTEST 2: SIMILARITY CALCULATION\n");

// Find precedents for simplified structure
console.log("Finding precedents for simplified structure...");
const simplifiedResults = findRelevantPrecedents(processedSimplified, precedentDatabase);
console.log(`Found ${simplifiedResults.length} relevant precedents for simplified structure.`);
if (simplifiedResults.length > 0) {
  console.log(`Best match: ${simplifiedResults[0].precedent.title} with score: ${simplifiedResults[0].similarityScore.toFixed(2)}`);
}

// Find precedents for detailed structure
console.log("\nFinding precedents for detailed structure...");
const detailedResults = findRelevantPrecedents(processedDetailed, precedentDatabase);
console.log(`Found ${detailedResults.length} relevant precedents for detailed structure.`);
if (detailedResults.length > 0) {
  console.log(`Best match: ${detailedResults[0].precedent.title} with score: ${detailedResults[0].similarityScore.toFixed(2)}`);
}

// 3. Test the adaptation rules with variations
console.log("\nTEST 3: ADAPTATION RULES\n");

// Create a Heinz dilemma variation
const heinzVariation = {
  precedent_id: "heinz_dilemma_disability",
  title: "Heinz Dilemma - Disability Variation",
  description: "A person with a disability must decide whether to steal an expensive assistive device to maintain their independence when other options are exhausted.",
  situation: {
    type: "ConflictingDutiesDilemma",
    description: "A person with a severe disability needs an expensive assistive device to maintain their independence and quality of life. The manufacturer refuses to provide financial assistance, and all other funding sources have been exhausted. The person must decide whether to steal the device.",
    parameters: {
      life_at_stake: false,
      quality_of_life_at_stake: true,
      alternatives_exhausted: true,
      property_value: "high",
      relationship_to_beneficiary: "self",
      harm_to_others: "financial_only"
    }
  },
  contextual_factors: [
    {
      factor: "life_or_death_situation",
      value: "no",
      relevance: "high"
    },
    {
      factor: "alternatives_available",
      value: "exhausted",
      relevance: "high"
    },
    {
      factor: "relationship_to_beneficiary",
      value: "self",
      relevance: "high"
    },
    {
      factor: "harm_type_to_others",
      value: "financial_only",
      relevance: "medium"
    }
  ]
};

// Find the closest precedent to the Heinz variation
console.log("Finding the closest precedent to the Heinz variation...");
const heinzResults = findRelevantPrecedents(heinzVariation, precedentDatabase);

if (heinzResults.length > 0) {
  console.log(`Best match: ${heinzResults[0].precedent.title} with score: ${heinzResults[0].similarityScore.toFixed(2)}`);
  
  // Test adaptation
  console.log("\nTesting adaptation rules...");
  const adaptedPaths = adaptReasoningPaths(heinzResults[0].precedent, heinzVariation);
  console.log(`Adaptation complete. ${adaptedPaths.length} paths adapted.\n`);
  
  // Test highlightChanges function with the adapted paths
  console.log("Testing highlightChanges function with adapted paths:");
  const originalPath = heinzResults[0].precedent.reasoning_paths[0];
  const adaptedPath = adaptedPaths[0];
  
  if (originalPath && adaptedPath) {
    const originalArg = originalPath.argument;
    const adaptedArg = adaptedPath.argument;
    
    console.log(`\nFramework: ${originalPath.framework}`);
    if (originalArg !== adaptedArg) {
      console.log("Changes detected!");
      const highlighted = highlightChanges(originalArg, adaptedArg);
      console.log("\nHighlighted changes:");
      console.log(highlighted);
    } else {
      console.log("No changes detected.");
    }
  }
}

// 4. Test the trolley problem variation
console.log("\nTEST 4: TROLLEY PROBLEM ADAPTATION\n");

// Create a trolley problem variation
const trolleyVariation = {
  precedent_id: "trolley_problem_crowded_track",
  title: "Trolley Problem - Crowded Track Variation",
  description: "A runaway trolley is headed for twenty people who will be killed unless the trolley is diverted to a side track where it would kill ten people instead.",
  situation: {
    type: "TrolleyDilemma",
    description: "A runaway trolley is barreling down the railway tracks. Ahead, on the tracks, there are twenty people tied up and unable to move. The trolley is headed straight for them. You are standing some distance off in the train yard, next to a lever. If you pull this lever, the trolley will switch to a different set of tracks. However, you notice that there are ten people on the side track.",
    parameters: {
      num_people_main_track: 20,
      num_people_side_track: 10,
      actor_intervention_type: "indirect",
      actor_position: "bystander"
    }
  },
  contextual_factors: [
    {
      factor: "certainty_of_outcome",
      value: "high",
      relevance: "high"
    },
    {
      factor: "actor_role",
      value: "bystander",
      relevance: "high"
    },
    {
      factor: "availability_of_alternatives",
      value: "none",
      relevance: "high"
    },
    {
      factor: "information_availability",
      value: "complete",
      relevance: "medium"
    }
  ]
};

// Find the closest precedent to the trolley variation
console.log("Finding the closest precedent to the trolley variation...");
const trolleyResults = findRelevantPrecedents(trolleyVariation, precedentDatabase);

if (trolleyResults.length > 0) {
  console.log(`Best match: ${trolleyResults[0].precedent.title} with score: ${trolleyResults[0].similarityScore.toFixed(2)}`);
  
  // Test adaptation
  console.log("\nTesting adaptation rules...");
  const adaptedPaths = adaptReasoningPaths(trolleyResults[0].precedent, trolleyVariation);
  console.log(`Adaptation complete. ${adaptedPaths.length} paths adapted.\n`);
  
  // Test highlightChanges function with the adapted paths
  console.log("Testing highlightChanges function with adapted paths:");
  const originalPath = trolleyResults[0].precedent.reasoning_paths[0];
  const adaptedPath = adaptedPaths[0];
  
  if (originalPath && adaptedPath) {
    const originalArg = originalPath.argument;
    const adaptedArg = adaptedPath.argument;
    
    console.log(`\nFramework: ${originalPath.framework}`);
    if (originalArg !== adaptedArg) {
      console.log("Changes detected!");
      const highlighted = highlightChanges(originalArg, adaptedArg);
      console.log("\nHighlighted changes:");
      console.log(highlighted);
    } else {
      console.log("No changes detected.");
    }
  }
}

console.log("\n=== COMPREHENSIVE TESTING COMPLETE ==="); 