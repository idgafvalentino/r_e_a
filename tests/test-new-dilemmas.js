/**
 * Test Script for New Dilemmas
 * 
 * This script verifies that the new dilemmas (Transplant, Crying Baby, and Sheriff)
 * are loaded correctly into the precedent database and can be used in the REA system.
 */

const { precedentDatabase } = require('./precedents');
const { calculateSimilarity } = require('./similarity');
const { adaptReasoningPaths } = require('./adaptation');
const { highlightChanges } = require('./utils');

// Helper function to find a precedent by ID
function findPrecedentById(id) {
  return precedentDatabase.find(p => p.precedent_id === id);
}

// Helper function to verify a dilemma
function verifyDilemma(precedentId, expectedTitle) {
  console.log(`\n=== Testing ${expectedTitle} ===`);
  
  // Find the dilemma in the database
  const dilemma = findPrecedentById(precedentId);
  
  if (!dilemma) {
    console.error(`❌ Error: ${expectedTitle} (${precedentId}) not found in precedent database!`);
    return false;
  }
  
  console.log(`✅ Found ${dilemma.title} in precedent database`);
  
  // Verify essential components
  const hasValidSituation = dilemma.situation && dilemma.situation.parameters;
  const hasValidContextualFactors = Array.isArray(dilemma.contextual_factors) && dilemma.contextual_factors.length > 0;
  const hasValidReasoningPaths = Array.isArray(dilemma.reasoning_paths) && dilemma.reasoning_paths.length > 0;
  
  console.log(`- Situation parameters: ${hasValidSituation ? '✅ Valid' : '❌ Invalid or missing'}`);
  console.log(`- Contextual factors: ${hasValidContextualFactors ? '✅ Valid' : '❌ Invalid or missing'}`);
  console.log(`- Reasoning paths: ${hasValidReasoningPaths ? '✅ Valid' : '❌ Invalid or missing'}`);
  
  if (hasValidReasoningPaths) {
    // Show available ethical frameworks
    const frameworks = dilemma.reasoning_paths.map(path => path.framework);
    console.log(`- Ethical frameworks: ${frameworks.join(', ')}`);
  }
  
  // Overall verdict
  const isValid = hasValidSituation && hasValidContextualFactors && hasValidReasoningPaths;
  console.log(`Overall: ${isValid ? '✅ Valid dilemma' : '❌ Invalid dilemma'}`);
  
  return isValid;
}

// Test adaptation with a simple case
function testAdaptation(sourcePrecedentId, targetPrecedentId) {
  const sourcePrecedent = findPrecedentById(sourcePrecedentId);
  const targetPrecedent = findPrecedentById(targetPrecedentId);
  
  if (!sourcePrecedent || !targetPrecedent) {
    console.error(`❌ Error: Could not find precedents for adaptation test`);
    return false;
  }
  
  console.log(`\n=== Testing Adaptation from ${sourcePrecedent.title} to ${targetPrecedent.title} ===`);
  
  try {
    // Calculate similarity
    const similarityScore = calculateSimilarity(sourcePrecedent, targetPrecedent);
    console.log(`Similarity score: ${similarityScore.toFixed(2)}`);
    
    // Adapt reasoning paths
    const adaptedPaths = adaptReasoningPaths(sourcePrecedent, targetPrecedent);
    console.log(`Adapted ${adaptedPaths.length} reasoning paths`);
    
    // Compare original and adapted paths
    adaptedPaths.forEach(adaptedPath => {
      const originalPath = sourcePrecedent.reasoning_paths.find(
        p => p.framework === adaptedPath.framework
      );
      
      if (originalPath) {
        console.log(`\n${adaptedPath.framework}:`);
        
        // Check if conclusion changed
        if (originalPath.conclusion !== adaptedPath.conclusion) {
          console.log(`- Conclusion changed: ${originalPath.conclusion} → ${adaptedPath.conclusion}`);
        }
        
        // Check if argument changed
        if (originalPath.argument !== adaptedPath.argument) {
          console.log(`- Argument adapted: ${originalPath.argument !== adaptedPath.argument ? 'Yes' : 'No'}`);
          const changes = highlightChanges(originalPath.argument, adaptedPath.argument);
          console.log(`- Changes: ${changes.includes('[ADDED:') || changes.includes('[REPLACED:') ? 'Detected' : 'None detected'}`);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Error during adaptation test: ${error.message}`);
    return false;
  }
}

// Count precedents
console.log(`Total precedents in database: ${precedentDatabase.length}`);

// Test new dilemmas
const transplantValid = verifyDilemma('transplant_dilemma_classic', 'Transplant Dilemma');
const cryingBabyValid = verifyDilemma('crying_baby_dilemma_classic', 'Crying Baby Dilemma');
const sheriffValid = verifyDilemma('sheriff_dilemma_classic', 'Sheriff Dilemma');

// Test adaptation between a classic dilemma and a new one
if (transplantValid && cryingBabyValid) {
  testAdaptation('trolley_problem_classic', 'transplant_dilemma_classic');
  testAdaptation('crying_baby_dilemma_classic', 'sheriff_dilemma_classic');
}

// Print overall results
console.log("\n=== Overall Results ===");
console.log(`Transplant Dilemma: ${transplantValid ? '✅ Valid' : '❌ Invalid'}`);
console.log(`Crying Baby Dilemma: ${cryingBabyValid ? '✅ Valid' : '❌ Invalid'}`);
console.log(`Sheriff Dilemma: ${sheriffValid ? '✅ Valid' : '❌ Invalid'}`);

// Exit with success code if all dilemmas are valid
if (transplantValid && cryingBabyValid && sheriffValid) {
  console.log("\n✅ All new dilemmas loaded successfully!");
  process.exit(0);
} else {
  console.error("\n❌ Some dilemmas failed to load correctly!");
  process.exit(1);
} 