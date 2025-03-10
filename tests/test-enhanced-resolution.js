/**
 * test-enhanced-resolution.js
 * 
 * Tests the enhanced conflict resolution strategies (balance, stakeholder, compromise, pluralistic)
 * using the surveillance technology dilemma scenario.
 * 
 * This test demonstrates how each resolution strategy handles conflicts between
 * different ethical frameworks when analyzing the surveillance dilemma.
 */

const { detectConflicts } = require('../src/conflictDetection');
const { generateReasoningPaths } = require('../src/reasoningPath');
const { resolveConflicts } = require('../src/conflictResolution');
const { deepCopy } = require('../src/utils');
const fs = require('fs');
const path = require('path');

// Add error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:');
    console.error(err);
});

/**
 * Loads a dilemma from a JSON file
 * @param {string} filePath - Path to the dilemma JSON file
 * @returns {Object} The dilemma object
 */
async function loadDilemma(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading dilemma from ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Simple testing each resolution strategy directly
 * @param {string} strategyName - The strategy to test
 */
function testStrategy(strategyName) {
    try {
        console.log(`\n=== Testing ${strategyName} Strategy ===`);
        
        // Import the actual strategy
        const { resolutionStrategies } = require('../src/conflictResolution');
        const strategy = resolutionStrategies[strategyName];
        
        console.log(`Strategy type: ${strategy.type}`);
        console.log(`Strategy description: ${strategy.description}`);
        
        // Create a mock conflict and frameworks
        const mockConflict = {
            type: 'PRIORITY',
            description: 'Different priorities: welfare vs community',
            framework1_name: 'Utilitarian Framework',
            framework2_name: 'Community-Centered Framework',
            action: 'test_action',
            details: {
                priority1: 'welfare',
                priority2: 'community',
                severity: 'medium'
            },
            frameworks: ['Utilitarian Framework', 'Community-Centered Framework'],
            resolutionStrategies: [strategyName]
        };
        
        const mockFramework1 = {
            framework: 'Utilitarian Framework',
            frameworkName: 'Utilitarian Framework',
            action: 'test_action',
            priority: 'welfare',
            strength: 'strong',
            argument: 'This is a utilitarian argument that focuses on maximizing welfare.'
        };
        
        const mockFramework2 = {
            framework: 'Community-Centered Framework',
            frameworkName: 'Community-Centered Framework',
            action: 'test_action',
            priority: 'community',
            strength: 'strong',
            argument: 'This is a community-centered argument that focuses on community values.'
        };
        
        const mockDilemma = {
            title: 'Test Dilemma',
            description: 'A test dilemma to verify resolution strategies.',
            stakeholders: [
                { name: 'Citizens', impact: 'high' },
                { name: 'Government', impact: 'medium' }
            ]
        };
        
        // Try to resolve the mock conflict
        console.log('Attempting to resolve mock conflict...');
        // Create arrays for reasoningPaths and conflicts as expected by the strategy
        const mockReasoningPaths = [mockFramework1, mockFramework2];
        const mockConflicts = [mockConflict];
        
        // Use the correct parameter order: reasoningPaths, conflicts, dilemma
        let result;
        try {
            result = strategy.resolve(mockReasoningPaths, mockConflicts, mockDilemma);
        } catch (error) {
            console.error(`Error calling strategy.resolve: ${error.message}`);
            return null;
        }
        
        if (result) {
            console.log('Resolution successful!');
            
            // Check if result has the expected structure
            if (result.resolutions && result.resolutions.length > 0) {
                // New structure returns an object with a resolutions array
                const resolution = result.resolutions[0];
                console.log(`Result framework: ${resolution.framework}`);
                console.log(`Resolution description: ${resolution.resolutionDescription}`);
                console.log('Argument preview:');
                console.log(resolution.argument ? resolution.argument.substring(0, 150) + '...' : 'No argument provided');
            } else {
                // Old structure or direct resolution object
                console.log(`Result framework: ${result.framework || 'undefined'}`);
                console.log(`Resolution description: ${result.resolutionDescription || 'undefined'}`);
                console.log('Argument preview:');
                console.log(result.argument ? result.argument.substring(0, 150) + '...' : 'No argument provided');
            }
        } else {
            console.log('Resolution failed - returned null or undefined');
        }
        
        return result;
    } catch (error) {
        console.error(`Error testing ${strategyName} strategy:`, error);
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

async function main() {
    console.log("=== Running Enhanced Resolution Strategy Tests ===");
    
    try {
        // First test each strategy independently with mock data
        console.log("\n=== BASIC STRATEGY TESTS ===");
        testStrategy('balance');
        testStrategy('stakeholder');
        testStrategy('compromise');
        testStrategy('pluralistic');
        
        // Now test with an actual dilemma
        console.log("\n=== TESTING WITH SURVEILLANCE DILEMMA ===");
        
        // Load the surveillance dilemma
        const dilemmaFilePath = path.join(__dirname, '..', 'dilemmas', 'surveillance_dilemma.json');
        console.log(`Loading dilemma from: ${dilemmaFilePath}`);
        const dilemma = await loadDilemma(dilemmaFilePath);
    
        if (!dilemma) {
            console.error("Failed to load dilemma. Exiting.");
            return;
        }
    
        console.log(`Dilemma loaded: ${dilemma.name || dilemma.title || "Unnamed dilemma"}`);
        
        // Generate reasoning paths
        console.log("\nGenerating reasoning paths...");
        const result = await generateReasoningPaths(dilemma);
        const reasoningPaths = result.reasoningPaths || [];
        console.log(`Generated ${reasoningPaths.length} reasoning paths`);
        
        // Display frameworks present
        const frameworks = [...new Set(reasoningPaths.map(p => p.framework))];
        console.log(`Frameworks present: ${frameworks.join(', ')}`);
        
        // Detect conflicts
        console.log("\nDetecting conflicts...");
        const conflicts = detectConflicts(reasoningPaths);
        console.log(`Detected ${conflicts.length} conflicts`);
        
        if (conflicts.length > 0) {
            // Display sample conflict
            const sampleConflict = conflicts[0];
            console.log(`\nSample conflict:`);
            console.log(`Type: ${sampleConflict.type}`);
            console.log(`Between: ${sampleConflict.framework1_name} and ${sampleConflict.framework2_name}`);
            console.log(`Action: ${sampleConflict.action}`);
            console.log(`Description: ${sampleConflict.description}`);
            
            // Find the actual framework objects for this conflict
            const framework1 = reasoningPaths.find(p => 
                p.framework === sampleConflict.framework1_name && 
                p.action === sampleConflict.action
            );
            
            const framework2 = reasoningPaths.find(p => 
                p.framework === sampleConflict.framework2_name && 
                p.action === sampleConflict.action
            );
            
            if (framework1 && framework2) {
                console.log("\nFound matching framework objects for conflict");
                
                // Try each resolution strategy with real conflict
                const { resolutionStrategies } = require('../src/conflictResolution');
                
                console.log("\n=== TESTING WITH REAL CONFLICT ===");
                
                // Test each strategy
                for (const strategyName of ['balance', 'stakeholder', 'compromise', 'pluralistic']) {
                    console.log(`\nTesting ${strategyName} strategy...`);
                    try {
                        const strategy = resolutionStrategies[strategyName];
                        // Create arrays for reasoningPaths and conflicts as expected by the strategy
                        const pathsForResolution = [framework1, framework2];
                        const conflictsForResolution = [sampleConflict];
                        
                        // Use the correct parameter order: reasoningPaths, conflicts, dilemma
                        const resolvedPath = strategy.resolve(pathsForResolution, conflictsForResolution, dilemma);
                        
                        if (resolvedPath) {
                            console.log(`${strategyName} strategy produced a resolution`);
                            // Check if result has the expected structure
                            if (resolvedPath.resolutions && resolvedPath.resolutions.length > 0) {
                                // New structure returns an object with a resolutions array
                                const resolution = resolvedPath.resolutions[0];
                                console.log(`Resolution framework: ${resolution.framework}`);
                                console.log(`Original frameworks: ${resolution.originalFrameworks}`);
                                console.log(`Action: ${resolution.action}`);
                                console.log(`Argument preview:`);
                                console.log(resolution.argument.substring(0, 150) + '...');
                            } else {
                                // Old structure or direct resolution object
                                console.log(`Resolution framework: ${resolvedPath.framework}`);
                                console.log(`Original frameworks: ${resolvedPath.originalFrameworks}`);
                                console.log(`Action: ${resolvedPath.action}`);
                                console.log(`Argument preview:`);
                                console.log(resolvedPath.argument.substring(0, 150) + '...');
                            }
                            
                            // Save to file for inspection
                            const outputPath = path.join(__dirname, `${strategyName}-result.json`);
                            fs.writeFileSync(outputPath, JSON.stringify(resolvedPath, null, 2), 'utf8');
                            console.log(`Saved full result to ${outputPath}`);
                        } else {
                            console.log(`${strategyName} strategy failed to produce a resolution`);
                        }
                    } catch (error) {
                        console.error(`Error applying ${strategyName} strategy:`, error);
                    }
                }
            } else {
                console.log("Could not find matching framework objects for conflict");
                console.log(`Framework1 (${sampleConflict.framework1_name}): ${framework1 ? 'Found' : 'Not found'}`);
                console.log(`Framework2 (${sampleConflict.framework2_name}): ${framework2 ? 'Found' : 'Not found'}`);
                
                // List all frameworks and actions for debugging
                console.log("\nAll framework/action combinations:");
                reasoningPaths.forEach(p => {
                    console.log(`- ${p.framework} / ${p.action}`);
                });
            }
        } else {
            console.log("No conflicts detected, cannot test resolution strategies");
        }
    } catch (error) {
        console.error("Main test function error:", error);
    }
    
    console.log("\n=== Test Complete ===");
}

main();
