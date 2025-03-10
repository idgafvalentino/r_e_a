/**
 * test-identify-name-issues.js
 * 
 * This script tests the identifyNameIssues function in the frameworkDiagnostics module.
 * It verifies that the function correctly identifies case inconsistencies, format inconsistencies,
 * and similar names in framework references.
 */

const assert = require('assert');
const frameworkDiagnostics = require('../src/frameworkDiagnostics');

/**
 * Run all tests
 */
async function runTests() {
    try {
        console.log('\n===== TESTING IDENTIFY NAME ISSUES FUNCTION =====\n');
        
        testEmptyInput();
        testNullInput();
        testSingleName();
        testIdenticalNames();
        testCaseInconsistencies();
        testFormatInconsistencies();
        testCombinedInconsistencies();
        testSimilarNames();
        testSpecialCharacters();
        testWhitespaceHandling();
        
        console.log('\n===== IDENTIFY NAME ISSUES TESTS COMPLETE =====');
        console.log('✅ All tests completed');
    } catch (error) {
        console.log('\n❌ Error during tests:', error);
    }
}

/**
 * Test with empty input
 */
function testEmptyInput() {
    console.log("\n----- Testing with empty input -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([]);
    
    assert.strictEqual(result.caseInconsistencies.length, 0, "Empty input should have no case inconsistencies");
    assert.strictEqual(result.formatInconsistencies.length, 0, "Empty input should have no format inconsistencies");
    assert.strictEqual(result.similarNames.length, 0, "Empty input should have no similar names");
    assert.strictEqual(result.identified, false, "Empty input should not identify any issues");
    
    console.log("✅ Empty input test passed");
}

/**
 * Test with null input
 */
function testNullInput() {
    console.log("\n----- Testing with null input -----");
    
    const result1 = frameworkDiagnostics.identifyNameIssues(null);
    const result2 = frameworkDiagnostics.identifyNameIssues(undefined);
    const result3 = frameworkDiagnostics.identifyNameIssues("not an array");
    
    assert.strictEqual(result1.identified, false, "Null input should not identify any issues");
    assert.strictEqual(result2.identified, false, "Undefined input should not identify any issues");
    assert.strictEqual(result3.identified, false, "Non-array input should not identify any issues");
    
    console.log("✅ Null input test passed");
}

/**
 * Test with a single name
 */
function testSingleName() {
    console.log("\n----- Testing with a single name -----");
    
    const result = frameworkDiagnostics.identifyNameIssues(["Utilitarianism"]);
    
    assert.strictEqual(result.caseInconsistencies.length, 0, "Single name should have no case inconsistencies");
    assert.strictEqual(result.formatInconsistencies.length, 0, "Single name should have no format inconsistencies");
    assert.strictEqual(result.similarNames.length, 0, "Single name should have no similar names");
    assert.strictEqual(result.identified, false, "Single name should not identify any issues");
    
    console.log("✅ Single name test passed");
}

/**
 * Test with identical names
 */
function testIdenticalNames() {
    console.log("\n----- Testing with identical names -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Utilitarianism", 
        "Utilitarianism", 
        "Utilitarianism"
    ]);
    
    assert.strictEqual(result.caseInconsistencies.length, 0, "Identical names should have no case inconsistencies");
    assert.strictEqual(result.formatInconsistencies.length, 0, "Identical names should have no format inconsistencies");
    assert.strictEqual(result.similarNames.length, 0, "Identical names should have no similar names");
    assert.strictEqual(result.identified, false, "Identical names should not identify any issues");
    
    console.log("✅ Identical names test passed");
}

/**
 * Test case inconsistencies
 */
function testCaseInconsistencies() {
    console.log("\n----- Testing case inconsistencies -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Utilitarianism", 
        "utilitarianism", 
        "UTILITARIANISM",
        "Kantian Ethics",
        "kantian ethics"
    ]);
    
    assert.strictEqual(result.caseInconsistencies.length, 2, "Should detect two sets of case inconsistencies");
    assert.strictEqual(result.formatInconsistencies.length, 0, "Should not detect format inconsistencies");
    assert.strictEqual(result.identified, true, "Should identify issues");
    
    // Check the first case inconsistency
    const utilitarian = result.caseInconsistencies.find(i => i.base === "utilitarianism");
    assert(utilitarian, "Should find utilitarianism case inconsistency");
    assert.strictEqual(utilitarian.variants.length, 3, "Should have 3 variants of utilitarianism");
    
    // Check the second case inconsistency
    const kantian = result.caseInconsistencies.find(i => i.base === "kantian ethics");
    assert(kantian, "Should find kantian ethics case inconsistency");
    assert.strictEqual(kantian.variants.length, 2, "Should have 2 variants of kantian ethics");
    
    console.log("✅ Case inconsistencies test passed");
}

/**
 * Test format inconsistencies
 */
function testFormatInconsistencies() {
    console.log("\n----- Testing format inconsistencies -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Virtue Ethics", 
        "Virtue-Ethics", 
        "Virtue_Ethics",
        "Rights Based Ethics",
        "Rights-Based-Ethics"
    ]);
    
    assert.strictEqual(result.caseInconsistencies.length, 0, "Should not detect case inconsistencies");
    assert.ok(result.formatInconsistencies.length > 0, "Should detect format inconsistencies");
    assert.strictEqual(result.identified, true, "Should identify issues");
    
    // Check that we found format inconsistencies for virtue ethics
    const virtueEthicsFound = result.formatInconsistencies.some(issue => 
        issue.original.toLowerCase().includes("virtue") && 
        issue.matches.some(match => match.toLowerCase().includes("virtue"))
    );
    assert(virtueEthicsFound, "Should find virtue ethics format inconsistency");
    
    // Check that we found format inconsistencies for rights based ethics
    const rightsEthicsFound = result.formatInconsistencies.some(issue => 
        issue.original.toLowerCase().includes("rights") && 
        issue.matches.some(match => match.toLowerCase().includes("rights"))
    );
    assert(rightsEthicsFound, "Should find rights based ethics format inconsistency");
    
    console.log("✅ Format inconsistencies test passed");
}

/**
 * Test combined case and format inconsistencies
 */
function testCombinedInconsistencies() {
    console.log("\n----- Testing combined inconsistencies -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Virtue Ethics", 
        "virtue-ethics", 
        "VIRTUE_ETHICS",
        "Care Ethics",
        "care-ethics"
    ]);
    
    assert.ok(result.caseInconsistencies.length > 0, "Should detect case inconsistencies");
    assert.ok(result.formatInconsistencies.length > 0, "Should detect format inconsistencies");
    assert.strictEqual(result.identified, true, "Should identify issues");
    
    console.log("✅ Combined inconsistencies test passed");
}

/**
 * Test similar names (potential typos)
 */
function testSimilarNames() {
    console.log("\n----- Testing similar names -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Kantian Ethics", 
        "Kantien Ethics", // Typo
        "Consequentialism",
        "Consequentualism" // Typo
    ]);
    
    assert.ok(result.similarNames.length > 0, "Should detect similar names");
    assert.strictEqual(result.identified, true, "Should identify issues");
    
    // Check that we found the Kantian Ethics typo
    const kantianFound = result.similarNames.some(issue => 
        (issue.name1.includes("Kantian") && issue.name2.includes("Kantien")) ||
        (issue.name1.includes("Kantien") && issue.name2.includes("Kantian"))
    );
    assert(kantianFound, "Should find Kantian Ethics typo");
    
    // Check that we found the Consequentialism typo
    const consequentialismFound = result.similarNames.some(issue => 
        (issue.name1.includes("Consequentialism") && issue.name2.includes("Consequentualism")) ||
        (issue.name1.includes("Consequentualism") && issue.name2.includes("Consequentialism"))
    );
    assert(consequentialismFound, "Should find Consequentialism typo");
    
    console.log("✅ Similar names test passed");
}

/**
 * Test special characters handling
 */
function testSpecialCharacters() {
    console.log("\n----- Testing special characters handling -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Rawls' Justice as Fairness", 
        "Rawls Justice as Fairness",
        "Mill's Utilitarianism",
        "Mills Utilitarianism"
    ]);
    
    // These should be detected as similar names
    assert.ok(result.similarNames.length > 0, "Should detect names with and without apostrophes as similar");
    assert.strictEqual(result.identified, true, "Should identify issues");
    
    console.log("✅ Special characters test passed");
}

/**
 * Test whitespace handling
 */
function testWhitespaceHandling() {
    console.log("\n----- Testing whitespace handling -----");
    
    const result = frameworkDiagnostics.identifyNameIssues([
        "Virtue Ethics", 
        "  Virtue Ethics  ", // Extra whitespace
        "Virtue  Ethics", // Double space
        "VirtueEthics" // No space
    ]);
    
    assert.ok(result.formatInconsistencies.length > 0, "Should detect whitespace inconsistencies");
    assert.strictEqual(result.identified, true, "Should identify issues");
    
    console.log("✅ Whitespace handling test passed");
}

// Run the tests
runTests();
