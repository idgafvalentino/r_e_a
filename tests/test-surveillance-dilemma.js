/**
 * test-surveillance-dilemma.js
 * 
 * Tests the enhanced conflict resolution strategies with the surveillance technology dilemma.
 * This test demonstrates how each strategy resolves conflicts in a complex ethical scenario.
 */

const { detectConflicts } = require('../src/conflictDetection');
const { generateReasoningPaths } = require('../src/reasoningPath');
const { resolveConflicts } = require('../src/conflictResolution');
const { deepCopy } = require('../src/utils');
const fs = require('fs');
const path = require('path');

// Debug flag
const DEBUG = true;

// Add error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:');
    console.error(err);
});

/**
 * Logs debug messages if DEBUG is true
 */
function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

/**
 * Loads a dilemma from a JSON file
 * @param {string} filePath - Path to the dilemma JSON file
 * @returns {Object} The dilemma object
 */
async function loadDilemma(filePath) {
    debugLog(`Attempting to load dilemma from: ${filePath}`);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        debugLog(`Successfully read file, size: ${data.length} bytes`);
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading dilemma from ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Extracts and formats the key points of an argument for display
 * @param {string} argument - The full argument text
 * @returns {string} Formatted key points
 */
function formatArgumentPreview(argument) {
    if (!argument) return "No argument provided";
    
    // Split by paragraphs or sections
    const sections = argument.split(/\n\n+/);
    
    // If it's a structured argument with headings (from our enhanced implementations)
    const headings = argument.match(/^#+\s.*$/gm) || [];
    
    if (headings.length > 0) {
        return `${headings.join('\n')}\n\n(Full argument contains ${argument.length} characters)`;
    }
    
    // Otherwise return first paragraph and length info
    return `${sections[0]}\n\n(Full argument contains ${argument.length} characters and ${sections.length} sections)`;
}

/**
 * Tests a specific conflict resolution strategy with a given conflict
 * @param {string} strategyName - Name of the strategy to test
 * @param {Object} conflict - Conflict object
 * @param {Object} framework1 - First framework reasoning path
 * @param {Object} framework2 - Second framework reasoning path
 * @param {Object} dilemma - The ethical dilemma
 * @returns {Object} Resolution result
 */
function testResolutionStrategy(strategyName, conflict, framework1, framework2, dilemma) {
    console.log(`\n=== Testing ${strategyName} strategy ===`);
    debugLog(`Conflict: ${JSON.stringify(conflict, null, 2)}`);
    debugLog(`Framework1: ${JSON.stringify(framework1, null, 2)}`);
    debugLog(`Framework2: ${JSON.stringify(framework2, null, 2)}`);
    
    try {
        const { resolutionStrategies } = require('../src/conflictResolution');
        debugLog(`Found resolution strategies: ${Object.keys(resolutionStrategies).join(', ')}`);
        
        const strategy = resolutionStrategies[strategyName];
        
        if (!strategy) {
            console.error(`Strategy ${strategyName} not found!`);
            return null;
        }
        
        console.log(`Strategy type: ${strategy.type}`);
        console.log(`Strategy description: ${strategy.description}`);
        
        // Apply the strategy to resolve the conflict
        debugLog(`Calling resolve function for ${strategyName} strategy...`);
        const resolvedPath = strategy.resolve(conflict, framework1, framework2, dilemma);
        
        if (resolvedPath) {
            console.log(`\n${strategyName} strategy produced a resolution:`);
            console.log(`Resolution framework: ${resolvedPath.framework}`);
            console.log(`Original frameworks: ${resolvedPath.originalFrameworks}`);
            console.log(`Action: ${resolvedPath.action}`);
            console.log(`Argument preview:\n`);
            console.log(formatArgumentPreview(resolvedPath.argument));
            
            // Save to file for inspection
            const outputPath = path.join(__dirname, `surveillance-${strategyName}-result.json`);
            fs.writeFileSync(outputPath, JSON.stringify(resolvedPath, null, 2), 'utf8');
            console.log(`\nSaved full result to ${outputPath}`);
            
            return resolvedPath;
        } else {
            console.log(`${strategyName} strategy failed to produce a resolution`);
            return null;
        }
    } catch (error) {
        console.error(`Error testing ${strategyName} strategy:`, error);
        return null;
    }
}

/**
 * Main function to run the test
 */
async function main() {
    console.log("=== Testing Resolution Strategies with Surveillance Dilemma ===\n");
    
    try {
        // Load the surveillance dilemma
        const dilemmaFilePath = path.join(__dirname, '..', 'dilemmas', 'surveillance_dilemma.json');
        console.log(`Loading dilemma from: ${dilemmaFilePath}`);
        // Check if file exists
        debugLog(`File exists: ${fs.existsSync(dilemmaFilePath)}`);
        
        const dilemma = await loadDilemma(dilemmaFilePath);
        debugLog(`Dilemma loaded: ${dilemma ? 'yes' : 'no'}`);
    
        if (!dilemma) {
            console.error("Failed to load dilemma. Exiting.");
            return;
        }
    
        console.log(`Dilemma loaded: ${dilemma.name || dilemma.title || "Unnamed dilemma"}`);
        console.log(`Description: ${dilemma.description}\n`);
        
        // Generate reasoning paths
        console.log("Generating reasoning paths...");
        debugLog("Calling generateReasoningPaths...");
        const reasoningPaths = await generateReasoningPaths(dilemma);
        debugLog(`Reasoning paths generated: ${reasoningPaths ? reasoningPaths.length : 'null'}`);
        
        if (!reasoningPaths || reasoningPaths.length === 0) {
            console.error("No reasoning paths were generated. Exiting.");
            return;
        }
        
        console.log(`Generated ${reasoningPaths.length} reasoning paths`);
        
        // Display frameworks present
        const frameworks = [...new Set(reasoningPaths.map(p => p.framework))];
        console.log(`Frameworks present: ${frameworks.join(', ')}\n`);
        
        // Detect conflicts
        console.log("Detecting conflicts between reasoning paths...");
        debugLog("Calling detectConflicts...");
        const conflicts = detectConflicts(reasoningPaths);
        debugLog(`Conflicts detected: ${conflicts ? conflicts.length : 'null'}`);
        
        console.log(`Detected ${conflicts.length} conflicts`);
        
        // Check if we have conflicts to resolve
        if (conflicts.length === 0) {
            console.log("No conflicts detected. Cannot test resolution strategies.");
            return;
        }
        
        // Find conflicts between specific frameworks for action types and test each strategy
        console.log("\nSearching for interesting conflicts to test resolution strategies...");
        
        // First, let's find priority conflicts for the full_implementation action
        const priorityConflictsForFullImpl = conflicts.filter(c => 
            c.type === 'PRIORITY' && 
            c.action === 'full_implementation'
        );
        
        debugLog(`Found ${priorityConflictsForFullImpl.length} priority conflicts for full_implementation`);
        
        if (priorityConflictsForFullImpl.length === 0) {
            console.log("No priority conflicts found for full_implementation action.");
            // If no specific conflicts, just use the first conflict
            debugLog(`Using first conflict: ${JSON.stringify(conflicts[0], null, 2)}`);
            testWithConflict(conflicts[0], reasoningPaths, dilemma);
        } else {
            // Try to find a conflict between Rights-Balanced Utilitarianism and Community-Centered Virtue Approach
            const targetConflict = priorityConflictsForFullImpl.find(c => 
                (c.framework1_name === 'Rights-Balanced Utilitarianism' && c.framework2_name === 'Community-Centered Virtue Approach') ||
                (c.framework1_name === 'Community-Centered Virtue Approach' && c.framework2_name === 'Rights-Balanced Utilitarianism')
            );
            
            if (targetConflict) {
                console.log("\nFound ideal conflict for testing: Rights-Balanced Utilitarianism vs Community-Centered Virtue Approach");
                debugLog(`Target conflict: ${JSON.stringify(targetConflict, null, 2)}`);
                testWithConflict(targetConflict, reasoningPaths, dilemma);
            } else {
                // Just use the first priority conflict
                console.log("\nUsing first available priority conflict for full_implementation:");
                debugLog(`First priority conflict: ${JSON.stringify(priorityConflictsForFullImpl[0], null, 2)}`);
                testWithConflict(priorityConflictsForFullImpl[0], reasoningPaths, dilemma);
            }
        }
    } catch (error) {
        console.error("Error in main test function:", error);
    }
    
    console.log("\n=== Test Complete ===");
}

/**
 * Tests all resolution strategies with a specific conflict
 * @param {Object} conflict - The conflict to test with
 * @param {Array} reasoningPaths - All reasoning paths
 * @param {Object} dilemma - The dilemma
 */
function testWithConflict(conflict, reasoningPaths, dilemma) {
    console.log(`\nTesting with conflict:`);
    console.log(`Type: ${conflict.type}`);
    console.log(`Description: ${conflict.description}`);
    console.log(`Between: ${conflict.framework1_name} and ${conflict.framework2_name}`);
    console.log(`Action: ${conflict.action}`);
    
    // Find the framework objects
    debugLog(`Looking for framework objects in ${reasoningPaths.length} reasoning paths`);
    debugLog(`Looking for framework1: ${conflict.framework1_name}, action: ${conflict.action}`);
    debugLog(`Looking for framework2: ${conflict.framework2_name}, action: ${conflict.action}`);
    
    const framework1 = reasoningPaths.find(p => 
        p.framework === conflict.framework1_name && 
        p.action === conflict.action
    );
    
    const framework2 = reasoningPaths.find(p => 
        p.framework === conflict.framework2_name && 
        p.action === conflict.action
    );
    
    debugLog(`Framework1 found: ${!!framework1}`);
    debugLog(`Framework2 found: ${!!framework2}`);
    
    if (!framework1 || !framework2) {
        console.log("Could not find matching framework objects for this conflict");
        // List all available frameworks and actions
        console.log("Available framework/action combinations:");
        reasoningPaths.forEach(p => {
            console.log(`- ${p.framework} / ${p.action}`);
        });
        return;
    }
    
    console.log("Found matching framework objects. Testing resolution strategies...");
    
    // Test each resolution strategy
    const strategies = ['balance', 'stakeholder', 'compromise', 'pluralistic'];
    const results = {};
    
    for (const strategyName of strategies) {
        const result = testResolutionStrategy(strategyName, conflict, framework1, framework2, dilemma);
        results[strategyName] = result;
    }
    
    // Compare the results
    console.log("\n=== Resolution Strategy Comparison ===");
    console.log("Each strategy produced a different approach to resolving the same conflict:");
    
    for (const strategyName of strategies) {
        const result = results[strategyName];
        if (result) {
            console.log(`\n${strategyName.toUpperCase()} APPROACH: ${result.resolutionDescription}`);
        }
    }
}

// Run the test
console.log("Starting surveillance dilemma test...");
main().then(() => {
    console.log("Test completed successfully");
}).catch(err => {
    console.error("Test failed with error:", err);
});