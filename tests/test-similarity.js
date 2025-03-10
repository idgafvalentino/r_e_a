// Test script for the improved similarity calculation with focus on contextual factor matching
const similarity = require('../src/similarity');
const { 
  calculateSimilarity, 
  calculateStringSimilarity,
  findBestContextualFactorMatch,
  calculateFactorSimilarity
} = similarity;

console.log("\n=== Testing Enhanced String Similarity Calculation ===");

// Test cases for string similarity
const stringTests = [
  // Exact matches
  { str1: "time pressure", str2: "time pressure", expectation: "High (exact match)" },
  // Near matches
  { str1: "high crime rate", str2: "increased crime", expectation: "Medium" },
  { str1: "patient consent", str2: "patient gave consent", expectation: "Medium-High" },
  // Synonyms
  { str1: "public opinion", str2: "community sentiment", expectation: "Medium" },
  // Different lengths
  { str1: "medical ethics committee", str2: "ethics board", expectation: "Medium" },
  // Unrelated
  { str1: "time pressure", str2: "financial cost", expectation: "Low" },
  { str1: "yes", str2: "no", expectation: "Low" },
  { str1: "high", str2: "low", expectation: "Low" }
];

for (const test of stringTests) {
  const similarity = calculateStringSimilarity(test.str1, test.str2);
  console.log(`"${test.str1}" vs "${test.str2}": ${similarity.toFixed(3)} (Expected: ${test.expectation})`);
}

console.log("\n=== Testing Contextual Factor Matching ===");

// Test cases for contextual factor matching
const factorTests = [
  // Exact match
  {
    factor: { factor: "time_pressure", value: "high", relevance: "high" },
    factorList: [
      { factor: "time_pressure", value: "high", relevance: "high" }
    ],
    expectation: "Exact match (1.0)"
  },
  
  // Near match with high similarity
  {
    factor: { factor: "time_constraint", value: "urgent", relevance: "high" },
    factorList: [
      { factor: "time_pressure", value: "high", relevance: "high" },
      { factor: "actor_role", value: "professional", relevance: "medium" }
    ],
    expectation: "Good semantic match"
  },
  
  // Match with explanation
  {
    factor: { 
      factor: "resource_scarcity", 
      value: "high", 
      relevance: "high",
      explanation: "Limited medical supplies available for treatment"
    },
    factorList: [
      { 
        factor: "resource_availability", 
        value: "low", 
        relevance: "high",
        explanation: "Hospital has limited medical resources"
      },
      { factor: "time_pressure", value: "high", relevance: "medium" }
    ],
    expectation: "Good match with explanation similarity"
  },
  
  // Partial match with different values
  {
    factor: { factor: "certainty_of_outcome", value: "high", relevance: "high" },
    factorList: [
      { factor: "certainty_of_outcome", value: "low", relevance: "medium" }
    ],
    expectation: "Name match with different value"
  },
  
  // No reasonable match
  {
    factor: { factor: "cultural_context", value: "religious_considerations", relevance: "high" },
    factorList: [
      { factor: "time_pressure", value: "high", relevance: "high" },
      { factor: "legal_framework", value: "permissive", relevance: "medium" }
    ],
    expectation: "No good match found"
  }
];

// Test each factor matching scenario
for (const test of factorTests) {
  console.log(`\nScenario: ${test.expectation}`);
  console.log(`Factor: ${test.factor.factor} (${test.factor.value})`);
  
  const result = findBestContextualFactorMatch(test.factor, test.factorList);
  
  if (result.match) {
    console.log(`Match found: ${result.match.factor} (${result.match.value})`);
    console.log(`Similarity score: ${result.similarity.toFixed(3)}`);
  } else {
    console.log("No match found");
  }
}

// Test with real-world dilemma example
console.log("\n=== Testing Complete Similarity with Real Dilemmas ===");

// Define a medical dilemma
const testDilemma = {
  "situation": {
    "type": "MedicalTriage",
    "description": "A hospital has limited resources during a disaster situation",
    "parameters": {
      "num_total_people": 12,
      "num_can_be_saved": 8,
      "resource_type": "critical",
      "time_constraint": 24,
      "fatal_outcome": true
    }
  },
  "contextual_factors": [
    { "factor": "time_pressure", "value": "high", "relevance": "high" },
    { "factor": "resource_scarcity", "value": "extreme", "relevance": "high" },
    { "factor": "information_availability", "value": "limited", "relevance": "medium" },
    { "factor": "medical_consensus", "value": "limited", "relevance": "medium" }
  ]
};

// Define a slightly different variant of the same dilemma
const similarDilemma = {
  "situation": {
    "type": "MedicalEmergency",
    "description": "An emergency room must allocate limited resources",
    "parameters": {
      "num_total_people": 10,
      "num_can_be_saved": 7,
      "resource_type": "lifesaving",
      "time_constraint": 18,
      "life_at_stake": true
    }
  },
  "contextual_factors": [
    { "factor": "urgent_timeframe", "value": "very_high", "relevance": "high" },
    { "factor": "limited_resources", "value": "severe", "relevance": "high" },
    { "factor": "available_information", "value": "partial", "relevance": "medium" },
    { "factor": "medical_guidelines", "value": "available", "relevance": "low" }
  ]
};

// Calculate similarity between these dilemmas
console.log("\nCalculating similarity between two medical dilemmas:");
const similarityScore = calculateSimilarity(testDilemma, similarDilemma);
console.log(`Final similarity score: ${similarityScore.toFixed(3)}`);

// Test with real precedent database
console.log("\nTesting with full precedent database:");

// Wrap the test in an async IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    const precedentDatabase = require('../src/precedents').getPrecedentDatabase();
    
    // Add debugging logs
    console.log("Calling findRelevantPrecedents with:");
    console.log("  dilemma:", testDilemma.situation.type);
    console.log("  precedentDatabase: Array with", precedentDatabase.length, "elements");
    console.log("  framework: null (no framework filter)");
    console.log("  threshold: 0.15 (lowered threshold for testing)");
    console.log("  maxResults: 5 (default)");
    
    // Properly await the async function
    const relevantPrecedents = await similarity.findRelevantPrecedents(
      testDilemma,
      precedentDatabase,
      null,   // Use null for no framework filter
      0.15,   // Lowered threshold to 0.15
      5       // Default maxResults
    );
    
    // Add proper error handling
    if (relevantPrecedents) {
      console.log(`\nFound ${relevantPrecedents.length} relevant precedents above threshold 0.15`);
      
      // Check if it's an array before using forEach
      if (Array.isArray(relevantPrecedents)) {
        if (relevantPrecedents.length === 0) {
          console.log("No precedents matched the similarity threshold.");
        } else {
          relevantPrecedents.forEach((match, index) => {
            console.log(`${index + 1}. ${match.precedent.precedent_id || match.precedent.title}: ${match.similarity.toFixed(3)}`);
          });
        }
      } else {
        console.log("Warning: relevantPrecedents is not an array.");
        console.log("Type:", typeof relevantPrecedents);
        console.log("Value:", relevantPrecedents);
      }
    } else {
      console.log("No relevant precedents found or return value is undefined.");
    }
  } catch (error) {
    console.log("Could not load precedent database:", error.message);
  }
  
  console.log("\n=== Test Complete ===");
})(); 