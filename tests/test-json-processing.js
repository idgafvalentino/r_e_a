const fs = require('fs');
const path = require('path');

// Import the necessary modules from our system
const { precedentDatabase } = require('./precedents');
const { calculateSimilarity } = require('./similarity');

// Function to simulate the JSON processing part of promptForDilemma
function processJsonDilemma(jsonInput) {
  console.log("Processing JSON input:", jsonInput.substring(0, 100) + (jsonInput.length > 100 ? "..." : ""));
  
  try {
    const dilemma = JSON.parse(jsonInput);
    
    // Validate required structure
    if (!dilemma || typeof dilemma !== 'object') {
      console.log("Invalid dilemma format. JSON must represent an object.");
      return null;
    }
    
    // Add/validate the required fields
    dilemma.precedent_id = dilemma.precedent_id || "user_input_" + Date.now(); // Unique ID
    dilemma.title = dilemma.title || "User-Provided Dilemma";
    
    // Ensure parameters exist
    if (!dilemma.parameters) {
      dilemma.parameters = {};
      console.log("Warning: No parameters provided. Using empty parameters object.");
    }
    
    // Ensure contextual_factors exist
    if (!dilemma.contextual_factors) {
      dilemma.contextual_factors = {};
      console.log("Warning: No contextual factors provided. Using empty factors object.");
    }
    
    // If no description, create a basic one from the title
    if (!dilemma.description) {
      dilemma.description = `Ethical dilemma: ${dilemma.title}`;
      console.log("Warning: No description provided. Using title as description.");
    }
    
    // If no reasoning_paths, create an empty array
    if (!Array.isArray(dilemma.reasoning_paths)) {
      dilemma.reasoning_paths = [];
      console.log("Warning: No reasoning paths provided. Using empty array.");
    }
    
    console.log("--- DEBUG: Processed dilemma ---");
    console.log("Dilemma structure:", JSON.stringify(dilemma, null, 2));
    
    return dilemma;
  } catch (error) {
    console.error("Invalid JSON:", error.message);
    return null;
  }
}

// Test function to check similarity with precedents
function testSimilarityChecks(dilemma) {
  if (!dilemma) {
    console.log("No dilemma to analyze.");
    return;
  }
  
  console.log(`\nCalculating similarity for dilemma: ${dilemma.title}`);
  
  // Check similarity with each precedent manually
  console.log("\nSimilarity scores with existing precedents:");
  
  for (const precedent of precedentDatabase) {
    try {
      const similarityScore = calculateSimilarity(dilemma, precedent);
      console.log(`- ${precedent.title}: ${similarityScore.toFixed(2)}`);
      
      // Print the key parameters for comparison
      console.log("  Dilemma parameters:", JSON.stringify(dilemma.parameters));
      console.log("  Precedent parameters:", JSON.stringify(precedent.parameters));
      
      // Print the key contextual factors for comparison
      console.log("  Dilemma factors:", JSON.stringify(dilemma.contextual_factors));
      console.log("  Precedent factors:", JSON.stringify(precedent.contextual_factors));
    } catch (error) {
      console.error(`Error calculating similarity with ${precedent.title}:`, error.message);
    }
  }
}

// Run tests with the files we created earlier
function runTests() {
  console.log("=== TESTING JSON INPUT HANDLING ===\n");
  
  // Test 1: Complete test dilemma
  console.log("Test 1: Complete test dilemma");
  const testFilePath = path.join(__dirname, 'test-dilemma.json');
  const testJson = fs.readFileSync(testFilePath, 'utf8');
  const testDilemma = processJsonDilemma(testJson);
  if (testDilemma) {
    testSimilarityChecks(testDilemma);
    console.log("Test 1 result: Successfully processed JSON");
  } else {
    console.log("Test 1 result: Failed to process JSON");
  }
  
  // Test 2: Minimal dilemma
  console.log("\n\nTest 2: Minimal test dilemma");
  const minimalFilePath = path.join(__dirname, 'minimal-dilemma.json');
  const minimalJson = fs.readFileSync(minimalFilePath, 'utf8');
  const minimalDilemma = processJsonDilemma(minimalJson);
  if (minimalDilemma) {
    testSimilarityChecks(minimalDilemma);
    console.log("Test 2 result: Successfully processed minimal JSON");
  } else {
    console.log("Test 2 result: Failed to process minimal JSON");
  }
  
  // Test 3: Invalid JSON
  console.log("\n\nTest 3: Invalid JSON");
  const invalidFilePath = path.join(__dirname, 'invalid-dilemma.json');
  const invalidJson = fs.readFileSync(invalidFilePath, 'utf8');
  const invalidDilemma = processJsonDilemma(invalidJson);
  console.log("Test 3 result:", invalidDilemma === null ? "Successfully handled error" : "Failed to catch error");
}

// Run the tests
runTests(); 