const { precedentDatabase } = require('./precedents');
const { calculateSimilarity, findRelevantPrecedents } = require('./similarity');
const { adaptReasoningPaths } = require('./adaptation');

// This script tests the fixed similarity calculation and adaptation rules

console.log("=== TESTING FIXES FOR SIMILARITY CALCULATION AND ADAPTATION RULES ===\n");

// 1. Test similarity calculation with different structure formats
console.log("TEST 1: Similarity calculation with different structure formats\n");

// Simplified structure (flat parameters and object-based factors)
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

// Find relevant precedents for simplified structure
console.log("Finding relevant precedents for simplified structure dilemma...");
const simplifiedResults = findRelevantPrecedents(simplifiedDilemma, precedentDatabase);

console.log(`Found ${simplifiedResults.length} relevant precedents.`);
if (simplifiedResults.length > 0) {
  console.log(`Best match: ${simplifiedResults[0].precedent.title} with score: ${simplifiedResults[0].similarityScore.toFixed(2)}`);
}

// 2. Test adaptation rules with a Heinz dilemma variation
console.log("\nTEST 2: Adaptation rules with a Heinz dilemma variation\n");

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
  
  // Get the original reasoning paths
  const originalPaths = heinzResults[0].precedent.reasoning_paths;
  console.log(`Original precedent has ${originalPaths.length} reasoning paths.`);
  
  // Test adaptation
  console.log("\nTesting adaptation rules...");
  const adaptedPaths = adaptReasoningPaths(heinzResults[0].precedent, heinzVariation);
  console.log(`Adaptation complete. ${adaptedPaths.length} paths adapted.`);
  
  // Check if adaptations were successful by looking for changes in the arguments
  console.log("\nChecking for adaptations in the reasoning paths:");
  for (let i = 0; i < Math.min(originalPaths.length, adaptedPaths.length); i++) {
    const originalArg = originalPaths[i].argument;
    const adaptedArg = adaptedPaths[i].argument;
    
    if (originalArg !== adaptedArg) {
      console.log(`Path ${i+1} (${adaptedPaths[i].framework}): Adaptation detected!`);
      console.log("Original (first 100 chars):", originalArg.substring(0, 100) + "...");
      console.log("Adapted (first 100 chars):", adaptedArg.substring(0, 100) + "...");
    } else {
      console.log(`Path ${i+1} (${adaptedPaths[i].framework}): No adaptation detected.`);
    }
  }
}

console.log("\n=== TESTING COMPLETE ===");

// Run the test
// node test-fixes.js 