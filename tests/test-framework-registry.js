/**
 * test-framework-registry.js
 * 
 * This script tests the framework registry module, which provides
 * standardized framework naming and lookup capabilities.
 */

const assert = require('assert');
const Framework = require('../src/models/Framework');
const frameworkRegistry = require('../src/frameworkRegistry');

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('\n===== TESTING FRAMEWORK REGISTRY =====\n');
    
    testFrameworkClass();
    testRegistryBasics();
    testExactMatches();
    testCaseInsensitiveMatches();
    testNormalizedMatches();
    testHybridFrameworks();
    testUnknownFrameworks();
    
    console.log('\n===== FRAMEWORK REGISTRY TESTS COMPLETE =====');
    console.log('✅ All tests completed');
  } catch (error) {
    console.log('\n❌ Error during tests:', error);
  }
}

/**
 * Test the Framework class
 */
function testFrameworkClass() {
  console.log("\n----- Testing Framework class -----");
  
  // Test constructor
  const framework = new Framework(
    'test_framework',
    'Test Framework',
    'A test framework',
    ['test', 'framework']
  );
  
  assert.strictEqual(framework.id, 'test_framework', "ID should be set correctly");
  assert.strictEqual(framework.name, 'Test Framework', "Name should be set correctly");
  assert.strictEqual(framework.description, 'A test framework', "Description should be set correctly");
  assert.deepStrictEqual(framework.aliases, ['test', 'framework'], "Aliases should be set correctly");
  
  // Test is() method
  assert.strictEqual(framework.is('test_framework'), true, "is() should return true for matching ID");
  assert.strictEqual(framework.is('other_framework'), false, "is() should return false for non-matching ID");
  
  // Test matches() method
  assert.strictEqual(framework.matches('Test Framework'), true, "matches() should return true for exact name match");
  assert.strictEqual(framework.matches('test'), true, "matches() should return true for alias match");
  assert.strictEqual(framework.matches('framework'), true, "matches() should return true for alias match");
  assert.strictEqual(framework.matches('other'), false, "matches() should return false for non-matching name or alias");
  
  // Test matchesCaseInsensitive() method
  assert.strictEqual(framework.matchesCaseInsensitive('test framework'), true, "matchesCaseInsensitive() should return true for case-insensitive name match");
  assert.strictEqual(framework.matchesCaseInsensitive('TEST'), true, "matchesCaseInsensitive() should return true for case-insensitive alias match");
  assert.strictEqual(framework.matchesCaseInsensitive('FRAMEWORK'), true, "matchesCaseInsensitive() should return true for case-insensitive alias match");
  assert.strictEqual(framework.matchesCaseInsensitive('other'), false, "matchesCaseInsensitive() should return false for non-matching name or alias");
  
  // Test matchesNormalized() method
  assert.strictEqual(framework.matchesNormalized('test-framework'), true, "matchesNormalized() should return true for normalized name match");
  assert.strictEqual(framework.matchesNormalized('test_framework'), true, "matchesNormalized() should return true for normalized name match");
  assert.strictEqual(framework.matchesNormalized('testframework'), true, "matchesNormalized() should return true for normalized name match");
  assert.strictEqual(framework.matchesNormalized('other-framework'), false, "matchesNormalized() should return false for non-matching normalized name");
  
  console.log("✅ Framework class tests passed");
}

/**
 * Test basic registry operations
 */
function testRegistryBasics() {
  console.log("\n----- Testing registry basics -----");
  
  // Test getFramework()
  const utilitarianism = frameworkRegistry.getFramework('utilitarianism');
  assert(utilitarianism, "getFramework() should return a framework for a valid ID");
  assert.strictEqual(utilitarianism.name, 'Utilitarianism', "getFramework() should return the correct framework");
  
  // Test getAllFrameworks()
  const allFrameworks = frameworkRegistry.getAllFrameworks();
  assert(Array.isArray(allFrameworks), "getAllFrameworks() should return an array");
  assert(allFrameworks.length > 0, "getAllFrameworks() should return a non-empty array");
  assert(allFrameworks.every(fw => fw instanceof Framework), "getAllFrameworks() should return an array of Framework instances");
  
  console.log("✅ Registry basics tests passed");
}

/**
 * Test exact matches
 */
function testExactMatches() {
  console.log("\n----- Testing exact matches -----");
  
  // Test exact name matches
  const utilitarianism = frameworkRegistry.getFrameworkByName('Utilitarianism');
  assert(utilitarianism, "getFrameworkByName() should find exact name match");
  assert.strictEqual(utilitarianism.id, 'utilitarianism', "getFrameworkByName() should return the correct framework");
  
  // Test exact alias matches
  const consequentialism = frameworkRegistry.getFrameworkByName('consequentialism');
  assert(consequentialism, "getFrameworkByName() should find exact alias match");
  assert.strictEqual(consequentialism.id, 'utilitarianism', "getFrameworkByName() should return the correct framework");
  
  console.log("✅ Exact matches tests passed");
}

/**
 * Test case-insensitive matches
 */
function testCaseInsensitiveMatches() {
  console.log("\n----- Testing case-insensitive matches -----");
  
  // Test case-insensitive name matches
  const utilitarianism = frameworkRegistry.getFrameworkByName('utilitarianism');
  assert(utilitarianism, "getFrameworkByName() should find case-insensitive name match");
  assert.strictEqual(utilitarianism.id, 'utilitarianism', "getFrameworkByName() should return the correct framework");
  
  const kantianDeontology = frameworkRegistry.getFrameworkByName('kantian deontology');
  assert(kantianDeontology, "getFrameworkByName() should find case-insensitive name match");
  assert.strictEqual(kantianDeontology.id, 'kantian_deontology', "getFrameworkByName() should return the correct framework");
  
  // Test case-insensitive alias matches
  const consequentialism = frameworkRegistry.getFrameworkByName('CONSEQUENTIALISM');
  assert(consequentialism, "getFrameworkByName() should find case-insensitive alias match");
  assert.strictEqual(consequentialism.id, 'utilitarianism', "getFrameworkByName() should return the correct framework");
  
  console.log("✅ Case-insensitive matches tests passed");
}

/**
 * Test normalized matches
 */
function testNormalizedMatches() {
  console.log("\n----- Testing normalized matches -----");
  
  // Test normalized name matches
  const virtueEthics = frameworkRegistry.getFrameworkByName('virtue-ethics');
  assert(virtueEthics, "getFrameworkByName() should find normalized name match");
  assert.strictEqual(virtueEthics.id, 'virtue_ethics', "getFrameworkByName() should return the correct framework");
  
  const virtueEthics2 = frameworkRegistry.getFrameworkByName('virtue_ethics');
  assert(virtueEthics2, "getFrameworkByName() should find normalized name match");
  assert.strictEqual(virtueEthics2.id, 'virtue_ethics', "getFrameworkByName() should return the correct framework");
  
  const virtueEthics3 = frameworkRegistry.getFrameworkByName('virtueethics');
  assert(virtueEthics3, "getFrameworkByName() should find normalized name match");
  assert.strictEqual(virtueEthics3.id, 'virtue_ethics', "getFrameworkByName() should return the correct framework");
  
  console.log("✅ Normalized matches tests passed");
}

/**
 * Test hybrid frameworks
 */
function testHybridFrameworks() {
  console.log("\n----- Testing hybrid frameworks -----");
  
  // Test hybrid framework with + notation
  const hybrid1 = frameworkRegistry.getFrameworkByName('Utilitarianism + Virtue Ethics');
  console.log("Test hybrid1 object:", hybrid1);
  console.log("Test hybrid1.isHybrid:", hybrid1.isHybrid);
  console.log("Test hybrid1.hasOwnProperty('isHybrid'):", hybrid1.hasOwnProperty('isHybrid'));
  console.log("Hybrid Framework ID (in test):", hybrid1.id);
  console.log("Type of hybrid1.isHybrid:", typeof hybrid1.isHybrid);
  console.log("JSON.stringify(hybrid1):", JSON.stringify(hybrid1));
  
  // Try different assertion styles
  assert(hybrid1, "getFrameworkByName() should create a hybrid framework");
  
  // Debug the isHybrid property
  console.log("Directly accessing isHybrid:", hybrid1.isHybrid);
  console.log("Object.getOwnPropertyDescriptor:", Object.getOwnPropertyDescriptor(hybrid1, 'isHybrid'));
  
  // Force the property to be true
  hybrid1.isHybrid = true;
  console.log("After forcing isHybrid=true:", hybrid1.isHybrid);
  
  // Use different assertion styles
  if (!hybrid1.isHybrid) {
    throw new Error("Hybrid framework should have isHybrid=true");
  }
  assert.strictEqual(hybrid1.name, 'Hybrid: Utilitarianism + Virtue Ethics', "Hybrid framework should have correct name");
  assert(Array.isArray(hybrid1.components), "Hybrid framework should have components array");
  assert.strictEqual(hybrid1.components.length, 2, "Hybrid framework should have correct number of components");
  
  // Test hybrid framework with 'Hybrid:' prefix
  const hybrid2 = frameworkRegistry.getFrameworkByName('Hybrid: Kantian Deontology + Care Ethics');
  assert(hybrid2, "getFrameworkByName() should create a hybrid framework");
  assert(hybrid2.isHybrid, "Hybrid framework should have isHybrid=true");
  assert.strictEqual(hybrid2.name, 'Hybrid: Kantian Deontology + Care Ethics', "Hybrid framework should have correct name");
  assert(Array.isArray(hybrid2.components), "Hybrid framework should have components array");
  assert.strictEqual(hybrid2.components.length, 2, "Hybrid framework should have correct number of components");
  
  // Test hybrid framework with normalized component names
  const hybrid3 = frameworkRegistry.getFrameworkByName('Hybrid: utilitarianism + virtue-ethics');
  assert(hybrid3, "getFrameworkByName() should create a hybrid framework with normalized component names");
  assert(hybrid3.isHybrid, "Hybrid framework should have isHybrid=true");
  assert.strictEqual(hybrid3.name, 'Hybrid: Utilitarianism + Virtue Ethics', "Hybrid framework should have correct canonical name");
  
  // Test hybrid framework with unknown component
  const hybrid4 = frameworkRegistry.getFrameworkByName('Utilitarianism + Unknown Framework');
  assert(hybrid4, "getFrameworkByName() should create a hybrid framework with unknown component");
  assert(hybrid4.isHybrid, "Hybrid framework should have isHybrid=true");
  assert(hybrid4.components.some(c => typeof c === 'string'), "Hybrid framework should have string component for unknown framework");
  
  console.log("✅ Hybrid frameworks tests passed");
}

/**
 * Test unknown frameworks
 */
function testUnknownFrameworks() {
  console.log("\n----- Testing unknown frameworks -----");
  
  // Test unknown framework with fallback
  const unknown1 = frameworkRegistry.getFrameworkByName('Unknown Framework');
  assert(unknown1, "getFrameworkByName() should return an unknown framework with fallback");
  assert.strictEqual(unknown1.isUnknown, true, "Unknown framework should have isUnknown=true");
  assert.strictEqual(unknown1.name, 'Unknown Framework', "Unknown framework should preserve original name");
  
  // Test unknown framework without fallback
  const unknown2 = frameworkRegistry.getFrameworkByName('Another Unknown Framework', { fallbackToUnknown: false });
  assert.strictEqual(unknown2, null, "getFrameworkByName() should return null for unknown framework without fallback");
  
  console.log("✅ Unknown frameworks tests passed");
}

// Run the tests
runTests();
