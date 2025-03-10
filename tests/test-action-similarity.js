/**
 * Test script for enhanced similarity calculation using actionRelevanceScore
 * 
 * This test verifies that the enhanced similarity calculation in findRelevantPrecedents
 * correctly uses actionRelevanceScore to improve precedent matching.
 */

const similarity = require('../src/similarity');
const utils = require('../src/utils');

// Sample dilemma for testing
const testDilemma = {
  title: "Medical Resource Allocation",
  description: "A hospital with limited resources must decide how to allocate life-saving treatments during a crisis. Some argue for prioritizing those most likely to survive, while others advocate for equal access regardless of prognosis.",
  situation: {
    type: "ResourceAllocationDilemma",
    context: ["medical emergency", "limited resources"],
    key_factors: ["limited medical resources", "multiple patients", "life-or-death decision"]
  }
};

// Sample precedents with different actions/conclusions
const testPrecedents = [
  {
    precedent_id: "precedent_1",
    title: "Medical Triage Precedent",
    description: "A hospital must allocate limited medical resources during a mass casualty event.",
    frameworks: ["Utilitarianism", "Professional Ethics"],
    situation: {
      type: "ResourceAllocationDilemma",
      context: ["medical emergency", "limited resources"],
      key_factors: ["limited medical resources", "multiple patients", "life-or-death decision"]
    },
    reasoning_paths: [
      {
        framework: "Utilitarianism",
        conclusion: "prioritize_greatest_good",
        strength: "strong",
        argument: "Medical resources should be allocated to maximize the number of lives saved. This may mean prioritizing patients with a higher chance of survival."
      }
    ]
  },
  {
    precedent_id: "precedent_2",
    title: "Surveillance Ethics Precedent",
    description: "A city is considering implementing facial recognition surveillance in public spaces to reduce crime.",
    frameworks: ["Rights-Based Ethics", "Social Contract Theory"],
    situation: {
      type: "PrivacySecurityDilemma",
      context: ["urban setting", "crime prevention"],
      key_factors: ["privacy concerns", "security benefits", "public spaces"]
    },
    reasoning_paths: [
      {
        framework: "Rights-Based Ethics",
        conclusion: "reject_surveillance",
        strength: "strong",
        argument: "Implementing facial recognition surveillance violates citizens' right to privacy and autonomy in public spaces."
      }
    ]
  },
  {
    precedent_id: "precedent_3",
    title: "Ventilator Allocation Precedent",
    description: "During a respiratory pandemic, hospitals must decide how to allocate limited ventilators among patients.",
    frameworks: ["Utilitarianism", "Justice/Fairness"],
    situation: {
      type: "ResourceAllocationDilemma",
      context: ["pandemic", "limited resources"],
      key_factors: ["limited medical resources", "multiple patients", "life-or-death decision"]
    },
    reasoning_paths: [
      {
        framework: "Utilitarianism",
        conclusion: "allocate_ventilators_by_survival_chance",
        strength: "strong",
        argument: "Ventilators should be allocated to patients with the highest chance of survival to maximize the number of lives saved."
      }
    ]
  }
];

// Test cases
async function runTests() {
  console.log("=== Testing Enhanced Similarity with actionRelevanceScore ===\n");

  // Test 1: Compare base similarity vs. enhanced similarity
  console.log("Test 1: Base similarity vs. Enhanced similarity");
  
  // First, calculate similarity without action relevance (using only base similarity)
  const baseResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    null,
    0.1, // Low threshold to include all precedents
    10,  // High max results to include all precedents
    { descriptionWeight: 1.0, actionWeight: 0.0 } // Only use base similarity
  );
  
  console.log("Base similarity results (description only):");
  baseResults.forEach((result, i) => {
    console.log(`[${i+1}] ${result.precedent?.title || result.precedent?.precedent_id || 'Unknown'}: ${result.similarity.toFixed(4)}`);
  });
  
  // Then, calculate similarity with action relevance
  const enhancedResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    null,
    0.1,
    10,
    { descriptionWeight: 0.4, actionWeight: 0.6 } // Default weights
  );
  
  console.log("\nEnhanced similarity results (with action relevance):");
  enhancedResults.forEach((result, i) => {
    console.log(`[${i+1}] ${result.precedent?.title || result.precedent?.precedent_id || 'Unknown'}: ${result.similarity.toFixed(4)} (base: ${result.baseSimilarity.toFixed(4)}, action: ${result.actionScore.toFixed(4)})`);
  });
  
  // Check if the medical precedents rank higher with enhanced similarity
  const medicalPrecedentIds = ["precedent_1", "precedent_3"];
  
  const baseTopId = baseResults[0]?.precedent?.precedent_id;
  const enhancedTopId = enhancedResults[0]?.precedent?.precedent_id;
  
  console.log(`\nTop precedent with base similarity: ${baseTopId || 'None'}`);
  console.log(`Top precedent with enhanced similarity: ${enhancedTopId || 'None'}`);
  
  const isMedicalTopWithBase = baseTopId && medicalPrecedentIds.includes(baseTopId);
  const isMedicalTopWithEnhanced = enhancedTopId && medicalPrecedentIds.includes(enhancedTopId);
  
  console.log(`Medical precedent is top with base similarity: ${isMedicalTopWithBase ? 'Yes' : 'No'}`);
  console.log(`Medical precedent is top with enhanced similarity: ${isMedicalTopWithEnhanced ? 'Yes' : 'No'}`);
  
  // Test 2: Different weight configurations
  console.log("\nTest 2: Different weight configurations");
  
  const weightConfigurations = [
    { descriptionWeight: 0.8, actionWeight: 0.2, name: "High description weight" },
    { descriptionWeight: 0.5, actionWeight: 0.5, name: "Equal weights" },
    { descriptionWeight: 0.2, actionWeight: 0.8, name: "High action weight" }
  ];
  
  for (const config of weightConfigurations) {
    console.log(`\nConfiguration: ${config.name}`);
    
    const results = await similarity.findRelevantPrecedents(
      testDilemma,
      testPrecedents,
      null,
      0.1,
      10,
      { descriptionWeight: config.descriptionWeight, actionWeight: config.actionWeight }
    );
    
    results.forEach((result, i) => {
      console.log(`[${i+1}] ${result.precedent?.title || result.precedent?.precedent_id || 'Unknown'}: ${result.similarity.toFixed(4)} (base: ${result.baseSimilarity.toFixed(4)}, action: ${result.actionScore.toFixed(4)})`);
    });
  }
  
  // Test 3: Framework filtering with enhanced similarity
  console.log("\nTest 3: Framework filtering with enhanced similarity");
  
  const utilitarianResults = await similarity.findRelevantPrecedents(
    testDilemma,
    testPrecedents,
    "Utilitarianism",
    0.1,
    10,
    { descriptionWeight: 0.4, actionWeight: 0.6 }
  );
  
  console.log("Utilitarian precedents with enhanced similarity:");
  utilitarianResults.forEach((result, i) => {
    console.log(`[${i+1}] ${result.precedent?.title || result.precedent?.precedent_id || 'Unknown'}: ${result.similarity.toFixed(4)} (base: ${result.baseSimilarity.toFixed(4)}, action: ${result.actionScore.toFixed(4)})`);
  });
  
  const expectedUtilitarianCount = testPrecedents.filter(p => 
    p.frameworks && p.frameworks.includes("Utilitarianism")
  ).length;
  
  console.log(`Expected utilitarian precedent count: ${expectedUtilitarianCount}`);
  console.log(`Actual utilitarian precedent count: ${utilitarianResults.length}`);
  console.log(`Result: ${utilitarianResults.length === expectedUtilitarianCount ? 'PASS' : 'FAIL'}`);
  
  console.log("\n=== Enhanced Similarity Tests Complete ===");
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
});
