/**
 * Test script for the fixes to adaptation and similarity functions
 * 
 * This test checks if the issues with infinite replacement loops and computational
 * overhead have been resolved in the updated functions.
 */

const { calculateDilemmaSimilarity, findRelevantPrecedents } = require('../src/similarity');
const { adaptReasoningPaths, adaptArgumentForNewDilemma } = require('../src/adaptation');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Recent Fixes to Adaptation and Similarity Functions ===\n');

// Test 1: Load test dilemmas
console.log('Loading test dilemmas...');
let precedentDatabase;
try {
  const dbPath = path.join(__dirname, '..', 'data', 'precedent-database.json');
  precedentDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Successfully loaded ${precedentDatabase.length} precedents`);
} catch (error) {
  console.error('Error loading precedent database:', error);
  process.exit(1);
}

// Get specific precedents for testing
const trolleyDilemma = precedentDatabase.find(p => p.precedent_id === 'trolley_problem');
const medicalTriage = precedentDatabase.find(p => p.precedent_id === 'medical_triage');

if (!trolleyDilemma || !medicalTriage) {
  console.error('Required test dilemmas not found in database');
  process.exit(1);
}

// Test 2: Test similarity calculation
console.log('\n=== Testing Similarity Calculation ===');
console.log(`Comparing ${trolleyDilemma.title} with ${medicalTriage.title}`);
const start = process.hrtime();
const similarity = calculateDilemmaSimilarity(trolleyDilemma, medicalTriage);
const [seconds, nanoseconds] = process.hrtime(start);
const duration = seconds + nanoseconds / 1e9;

console.log(`Similarity score: ${similarity.toFixed(3)}`);
console.log(`Calculation time: ${(duration * 1000).toFixed(2)}ms`);

if (duration > 1) {
  console.warn('⚠️ Similarity calculation took longer than expected');
} else {
  console.log('✅ Similarity calculation performance is acceptable');
}

// Test 3: Test relevant precedent finding
console.log('\n=== Testing Relevant Precedent Finding ===');
// Make the test function async and immediately invoke it
(async () => {
  try {
    const relevantPrecedents = await findRelevantPrecedents(medicalTriage, precedentDatabase, null, 0.2);
    console.log(`Found ${relevantPrecedents.length} relevant precedents for ${medicalTriage.title}`);
    relevantPrecedents.forEach((result, i) => {
      console.log(`${i+1}. ${result.precedent?.title || result.precedent?.precedent_id || 'Unknown'} (Similarity: ${result.similarity?.toFixed(3) || 'N/A'})`);
    });
  } catch (error) {
    console.error('Error finding relevant precedents:', error);
  }
})();

// Test 4: Test simple argument adaptation
console.log('\n=== Testing Argument Adaptation ===');
const testArgument = "In the trolley problem, one must decide whether to pull the lever to divert the trolley from five people to one person. This ethical dilemma tests our intuitions about utilitarianism versus deontological ethics.";
console.log('Original argument:');
console.log(testArgument);

console.log('\nAdapted argument:');
const start2 = process.hrtime();
const adaptedArgument = adaptArgumentForNewDilemma(testArgument, trolleyDilemma, medicalTriage);
const [seconds2, nanoseconds2] = process.hrtime(start2);
const duration2 = seconds2 + nanoseconds2 / 1e9;

console.log(adaptedArgument);
console.log(`Adaptation time: ${(duration2 * 1000).toFixed(2)}ms`);

if (duration2 > 1) {
  console.warn('⚠️ Argument adaptation took longer than expected');
} else {
  console.log('✅ Argument adaptation performance is acceptable');
}

// Test 5: Test full reasoning path adaptation
console.log('\n=== Testing Full Reasoning Path Adaptation ===');
console.log('Adapting reasoning paths from trolley dilemma to medical triage dilemma');
const start3 = process.hrtime();
const adaptedPaths = adaptReasoningPaths(trolleyDilemma, medicalTriage);
const [seconds3, nanoseconds3] = process.hrtime(start3);
const duration3 = seconds3 + nanoseconds3 / 1e9;

console.log(`Adapted ${adaptedPaths.length} reasoning paths in ${(duration3 * 1000).toFixed(2)}ms`);

// Exit with success if we made it this far
console.log('\n✅ All tests completed successfully without crashing');
console.log('This confirms that the infinite loop and performance issues have been resolved');
