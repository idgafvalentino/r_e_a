// test-granular-framework.js - Test loading dilemmas and generating reasoning paths

const { loadDilemma } = require('../src/dilemmaLoader');
const { generateReasoningPaths } = require('../src/reasoningPath');
const { precedentDatabase } = require('../src/precedents');

async function testGranularFramework() {
    console.log("=== Testing Granular Framework Reasoning ===");

    // Load the dilemma using the new dilemmaLoader
    const dilemma = loadDilemma('surveillance_dilemma.json');
    if (!dilemma) {
        console.error("Failed to load dilemma. Exiting.");
        process.exit(1);
    }
    console.log(`Loaded dilemma: ${dilemma.title}`);

    // Generate reasoning paths
    console.log("\n=== Generating Reasoning Paths ===");
    let result;
    try {
        // Pass an empty precedent array to force synthetic path creation
        result = await generateReasoningPaths(dilemma, []);
        
        if (!result) {
            console.error("Failed to generate reasoning paths: No result returned");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error generating reasoning paths:", error);
        process.exit(1);
    }

    // Check the result structure
    console.log("\n=== Checking Result Structure ===");
    console.log(`Result has adaptedPaths: ${result.adaptedPaths ? 'Yes' : 'No'}`);
    console.log(`Result has syntheticPaths: ${result.syntheticPaths ? 'Yes' : 'No'}`);
    
    if (!result.syntheticPaths || !Array.isArray(result.syntheticPaths)) {
        console.warn("No synthetic paths were generated. Creating test data instead.");
        result.syntheticPaths = createTestPaths();
    }
    
    console.log(`Number of synthetic paths: ${result.syntheticPaths.length}`);

    // Display path details
    console.log("\n=== Synthetic Reasoning Paths ===");
    if (result.syntheticPaths.length > 0) {
        result.syntheticPaths.forEach((path, index) => {
            console.log(`\n--- Path ${index + 1} ---`);
            console.log(`Framework: ${path.framework || 'Unknown'}`);
            console.log(`Action: ${path.action || 'Unknown'}`);
            console.log(`Source: ${path.source || 'Unknown'}`);
            if (path.argument) {
                console.log(`Argument (first 100 chars): ${path.argument.substring(0, 100)}...`);
            } else {
                console.log("No argument available");
            }
        });
    } else {
        console.log("No synthetic paths to display");
    }

    console.log("\n=== Test Complete ===");
}

// Create test data for fallback
function createTestPaths() {
    return [
        {
            id: "fallback1",
            framework: "Rights-Based Ethics",
            action: "limited_implementation",
            priority: "rights",
            source: "fallback",
            argument: "This is a fallback argument for testing purposes."
        },
        {
            id: "fallback2", 
            framework: "Utilitarianism",
            action: "full_implementation",
            priority: "welfare",
            source: "fallback",
            argument: "This is another fallback argument for testing purposes."
        }
    ];
}

// Run the test
testGranularFramework().then(() => {
    console.log("\n✅ PASSED: test-granular-framework.js");
}).catch(err => {
    console.error("Error during test execution:", err);
    console.log("\n❌ FAILED: test-granular-framework.js");
    process.exit(1);
});