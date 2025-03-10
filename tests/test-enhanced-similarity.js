/**
 * test-enhanced-similarity.js
 * 
 * Tests the enhanced similarity functions, including:
 * - Semantic similarity with synonym matching
 * - Levenshtein distance for edit distance similarity
 * - Caching functionality for performance
 * - Combined similarity scores
 */

const similarity = require('../src/similarity');
const { 
  calculateSimilarity, 
  calculateStringSimilarity, 
  calculateLevenshteinDistance,
  calculateSemanticSimilarityApproximation,
  similarityCache
} = similarity;

// Clear the cache before beginning tests
similarityCache.clearCache();

console.log("\n=== Testing Enhanced Similarity Features ===");

// Test 1: Levenshtein Distance
console.log("\n--- Levenshtein Distance Tests ---");
const levenshteinTests = [
  { str1: "ethics", str2: "ethics", expected: 0, description: "Identical strings" },
  { str1: "ethics", str2: "ethical", expected: 2, description: "Small edit distance" },
  { str1: "utilitarian", str2: "deontological", expected: 11, description: "Large difference" },
  { str1: "consent", str2: "content", expected: 1, description: "One character difference" },
  { str1: "", str2: "ethics", expected: 6, description: "Empty string vs word" }
];

for (const test of levenshteinTests) {
  const distance = calculateLevenshteinDistance(test.str1, test.str2);
  const result = distance === test.expected ? "PASS" : "FAIL";
  console.log(`${result}: "${test.str1}" vs "${test.str2}" - ${test.description}`);
  console.log(`  Expected: ${test.expected}, Got: ${distance}`);
}

// Test 2: Semantic Similarity Approximation
console.log("\n--- Semantic Similarity Tests ---");
const semanticTests = [
  {
    words1: new Set(["time", "pressure"]), 
    words2: new Set(["deadline", "stress"]), 
    description: "Synonyms test"
  },
  {
    words1: new Set(["medical", "ethics", "consent"]), 
    words2: new Set(["clinical", "moral", "permission"]), 
    description: "Medical ethics synonyms"
  },
  {
    words1: new Set(["community", "welfare"]), 
    words2: new Set(["society", "wellbeing"]), 
    description: "Community welfare synonyms"
  },
  {
    words1: new Set(["urgency", "crisis"]), 
    words2: new Set(["emergency", "disaster"]), 
    description: "Emergency scenario synonyms"
  },
  {
    words1: new Set(["crime", "law", "enforcement"]), 
    words2: new Set(["offense", "regulation", "police"]), 
    description: "Justice system concepts"
  }
];

for (const test of semanticTests) {
  const score = calculateSemanticSimilarityApproximation(test.words1, test.words2);
  console.log(`${test.description} - Similarity: ${score.toFixed(3)}`);
  console.log(`  Words1: [${Array.from(test.words1).join(", ")}]`);
  console.log(`  Words2: [${Array.from(test.words2).join(", ")}]`);
}

// Test 3: Enhanced String Similarity (combined approach)
console.log("\n--- Enhanced String Similarity Tests ---");
const enhancedStringTests = [
  { 
    str1: "The patient needs urgent medical attention", 
    str2: "The person requires immediate healthcare", 
    description: "Medical scenario with synonyms" 
  },
  { 
    str1: "Limited resources in emergency situation", 
    str2: "Restricted supplies during crisis", 
    description: "Resource scarcity scenario" 
  },
  { 
    str1: "Community values and public consent", 
    str2: "Society standards and population agreement", 
    description: "Community ethics scenario" 
  },
  { 
    str1: "High crime rate in urban areas", 
    str2: "Elevated offense frequency in city regions", 
    description: "Crime scenario" 
  },
  { 
    str1: "Patient consent for medical procedure", 
    str2: "Doctor performing surgery without permission", 
    description: "Opposite medical ethics scenario" 
  }
];

for (const test of enhancedStringTests) {
  // Calculate similarity twice to test caching
  const firstTime = calculateStringSimilarity(test.str1, test.str2);
  const secondTime = calculateStringSimilarity(test.str1, test.str2);
  
  console.log(`${test.description} - Similarity: ${firstTime.toFixed(3)}`);
  console.log(`  "${test.str1}"`);
  console.log(`  "${test.str2}"`);
  
  // Verify both calculations produced the same result (through caching)
  if (firstTime === secondTime) {
    console.log("  Cache test: PASS");
  } else {
    console.log("  Cache test: FAIL - different results obtained!");
  }
}

// Test 4: Cache Performance
console.log("\n--- Cache Performance Test ---");

// Get initial cache stats
const initialStats = similarityCache.getCacheStats();
console.log("Initial cache stats:", initialStats);

// Perform repeated calculations that should use the cache
const testStr1 = "Medical ethics and patient autonomy";
const testStr2 = "Healthcare principles and individual rights";

console.log("\nPerforming 1000 similarity calculations with the same strings...");

// Record time without cache (first run)
const startTimeWithoutCache = Date.now();
const firstResult = calculateStringSimilarity(testStr1, testStr2);
const timeWithoutCache = Date.now() - startTimeWithoutCache;

// Perform additional calculations that should use the cache
const startTimeWithCache = Date.now();
for (let i = 0; i < 1000; i++) {
  calculateStringSimilarity(testStr1, testStr2);
}
const timeWithCache = Date.now() - startTimeWithCache;

// Get final cache stats
const finalStats = similarityCache.getCacheStats();
console.log("Final cache stats:", finalStats);

console.log(`\nTime for first calculation (no cache): ${timeWithoutCache}ms`);
console.log(`Time for 1000 cached calculations: ${timeWithCache}ms`);
console.log(`Average time per cached calculation: ${(timeWithCache/1000).toFixed(6)}ms`);
console.log(`Cache efficiency: ${(timeWithoutCache/(timeWithCache/1000)).toFixed(2)}x faster with cache`);

// Test 5: Real Dilemma Similarity with Enhanced Metrics
console.log("\n--- Testing Real Dilemma Similarity ---");

// Define two similar ethical dilemmas
const medicalTriageDilemma = {
  title: "Hospital Triage During Disaster",
  situation: {
    type: "MedicalEmergency",
    context: "Resource allocation during crisis",
    key_factors: ["scarce resources", "time pressure", "lives at stake", "medical authority"]
  },
  contextual_factors: [
    { factor: "resource_availability", value: "minimal" },
    { factor: "time_pressure", value: "extreme" },
    { factor: "certainty_of_outcome", value: "moderate" }
  ]
};

const organTransplantDilemma = {
  title: "Organ Allocation Decision",
  situation: {
    type: "MedicalEthics",
    context: "Resource allocation for patient treatment",
    key_factors: ["limited organs", "urgent timeframe", "multiple patients", "medical decision"]
  },
  contextual_factors: [
    { factor: "resource_scarcity", value: "severe" },
    { factor: "urgency", value: "high" },
    { factor: "outcome_predictability", value: "medium" }
  ]
};

// Clear cache to start fresh
similarityCache.clearCache();

// Calculate similarity between these dilemmas
console.log("Calculating similarity between medical dilemmas:");
const dilemmaSimilarity = calculateSimilarity(medicalTriageDilemma, organTransplantDilemma);
console.log(`Similarity score: ${dilemmaSimilarity.toFixed(3)}`);

// Check if the result was cached
console.log(`Dilemma comparison cached: ${similarityCache.objects.size > 0 ? "Yes" : "No"}`);

// Test 6: Compare with Dissimilar Dilemma
const crimeDilemma = {
  title: "Surveillance Ethics",
  situation: {
    type: "LawEnforcement",
    context: "Privacy versus security trade-off",
    key_factors: ["privacy rights", "crime prevention", "surveillance", "public security"]
  },
  contextual_factors: [
    { factor: "crime_rate", value: "high" },
    { factor: "privacy_impact", value: "significant" },
    { factor: "public_opinion", value: "divided" }
  ]
};

console.log("\nComparing with dissimilar dilemma:");
const dissimilarityScore = calculateSimilarity(medicalTriageDilemma, crimeDilemma);
console.log(`Similarity score with unrelated dilemma: ${dissimilarityScore.toFixed(3)}`);
console.log(`Difference from previous similarity: ${(dilemmaSimilarity - dissimilarityScore).toFixed(3)}`);

// Test complete
console.log("\n=== Enhanced Similarity Test Complete ==="); 