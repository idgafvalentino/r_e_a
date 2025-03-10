// test-conflict-resolution.js - Test the conflict resolution between reasoning paths

const { detectConflicts, detectAllConflicts } = require('../src/conflictDetection');
const { generateReasoningPaths } = require('../src/reasoningPath');
const { loadDilemma } = require('../src/dilemmaLoader');
const { resolveConflicts } = require('../src/conflictResolution');
const { createGranularElements } = require('../src/utils');
const fs = require('fs');
const path = require('path');

async function main() {
    const dilemmaFilePath = path.join(__dirname, '..', 'dilemmas', 'surveillance_dilemma.json');
    const dilemma = await loadDilemma(dilemmaFilePath);

    if (!dilemma) {
        console.error("Failed to load dilemma. Exiting.");
        return;
    }

    console.log("\n=== Creating Reasoning Paths Directly ===\n");
    
    // Create reasoning paths directly instead of using generateReasoningPaths
    const reasoningPaths = [
        {
            id: "path_util_1",
            framework: "Utilitarianism",
            conclusion: 'deploy_surveillance',
            strength: 'strong',
            action: 'deploy_surveillance',
            priority: 'welfare',
            argument: "The overall happiness and welfare of the community is the ultimate goal. Surveillance systems can prevent crime and increase security, leading to greater overall well-being."
        },
        {
            id: "path_rights_1",
            framework: "Rights-Based Ethics",
            conclusion: 'reject_surveillance',
            strength: 'strong',
            action: 'reject_surveillance',
            priority: 'rights',
            argument: "Individuals have the fundamental right to privacy that must not be violated. Surveillance systems infringe on this basic right and can lead to erosion of civil liberties."
        }
    ];
    
    console.log(`Created ${reasoningPaths.length} reasoning paths directly`);

    console.log("\n=== Detecting Conflicts Between Paths ===\n");
    console.log(`Detecting conflicts among ${reasoningPaths.length} reasoning paths`);
    
    // Debug the reasoning paths
    reasoningPaths.forEach((path, index) => {
        console.log(`Path #${index + 1}:`);
        console.log(`- Framework: ${path.framework}`);
        console.log(`- Action: ${path.action}`);
        console.log(`- Priority: ${path.priority}`);
    });
    
    // Create granular elements for the paths
    let granularElements = [];
    
    // Utilitarianism Path Elements
    const utilElements = createGranularElements(
        reasoningPaths[0].framework, // framework
        reasoningPaths[0].action,     // action
        "Maximize welfare",         // principle
        "Surveillance increases security",        // justification
        "Privacy concerns",               // objection
        "Security outweighs privacy",                         // response
        reasoningPaths[0].conclusion,
        reasoningPaths[0].strength || 'strong'
    );
    
    // Add conflicting_principles to create a PRINCIPLE conflict
    utilElements[0].conflicting_principles = ["Respect rights"];
    utilElements[0].type = "PRINCIPLE"; // Ensure uppercase type
    
    // Set relevance manually
    utilElements[0].relevance = 0.9;
    if (utilElements[1]) utilElements[1].relevance = 0.8;
    if (utilElements[2]) utilElements[2].relevance = 0.7;
    
    // Add elements to the path's source_elements
    reasoningPaths[0].source_elements = utilElements;
    
    // Add to granular elements collection
    granularElements = granularElements.concat(utilElements);
    
    // Rights-Based Ethics Path Elements
    const rightsElements = createGranularElements(
        reasoningPaths[1].framework,
        reasoningPaths[1].action,
        "Respect rights",
        "Surveillance violates privacy",
        "Security concerns",       // objection
        "Rights outweigh security",                         // response
        reasoningPaths[1].conclusion,
        reasoningPaths[1].strength || 'strong'
    );
    
    // Add conflicting_principles to create a PRINCIPLE conflict
    rightsElements[0].conflicting_principles = ["Maximize welfare"];
    rightsElements[0].type = "PRINCIPLE"; // Ensure uppercase type
    
    // Set relevance manually
    rightsElements[0].relevance = 0.8; 
    if (rightsElements[1]) rightsElements[1].relevance = 0.7;
    if (rightsElements[2]) rightsElements[2].relevance = 0.6;
    
    // Add elements to the path's source_elements
    reasoningPaths[1].source_elements = rightsElements;
    
    // Add to granular elements collection
    granularElements = granularElements.concat(rightsElements);
    
    // Detect conflicts using the enhanced function that can handle cross-action conflicts
    const conflictResult = detectAllConflicts(reasoningPaths, dilemma, granularElements);
    const conflicts = conflictResult.all;

    console.log("Detected", conflicts.length, "conflicts between reasoning paths\n");
    if (conflicts.length > 0) {
        console.log("=== Conflict Details ===");
        conflicts.forEach((conflict, index) => {
            console.log(`\nConflict #${index + 1}: ${conflict.type} CONFLICT`);
            console.log(`Frameworks: ${conflict.framework1_name || conflict.framework1} vs. ${conflict.framework2_name || conflict.framework2}`);
            console.log(`Action: ${conflict.action}`);
            console.log(`Severity: ${conflict.severity}`);
            console.log(`Description: ${conflict.description}`);
            console.log(`\nResolution Strategies:`);
            // Simplified strategy suggestions (for brevity in output)
            const framework1 = conflict.framework1_name || conflict.framework1;
            const framework2 = conflict.framework2_name || conflict.framework2;
            console.log(`1. [balance] Balance the competing priorities by implementing safeguards for ${framework2?.includes('Rights')? 'rights': framework2?.includes('Community')? 'community' : 'care'} while primarily pursuing ${framework1?.includes('Utilitarianism') ? 'welfare' : framework1?.includes('Community') ? 'community' : 'rights'}`);
            console.log(`2. [stakeholder] Determine priority based on the values of the most affected stakeholders`);
            console.log(`3. [compromise] Identify a compromise position that accommodates core concerns from both frameworks`);
            if (conflict.type === 'VALUE') {
                console.log(`4. [pluralism] Accept both frameworks as valid, provide arguments for both, but do not reconcile`);
            }
        });
    }

    console.log("\n=== Resolving Conflicts and Generating Reconciled Paths ===\n");
    
    // Add complete structure to each conflict
    conflicts.forEach(conflict => {
        // Ensure frameworks array exists and is properly structured
        if (!conflict.frameworks || !Array.isArray(conflict.frameworks)) {
            conflict.frameworks = [
                conflict.framework1_name || conflict.framework1, 
                conflict.framework2_name || conflict.framework2
            ];
        }
        
        // Ensure conflicting_elements is properly structured
        if (!conflict.conflicting_elements || !Array.isArray(conflict.conflicting_elements)) {
            // Determine element type based on conflict type
            let element_type = 'value';
            if (conflict.type === 'PRINCIPLE') {
                element_type = 'principle';
            } else if (conflict.type === 'PRIORITY') {
                element_type = 'priority';
            }
            
            // Create proper conflicting_elements structure
            conflict.conflicting_elements = [
                { 
                    element_type: element_type, 
                    content: conflict.details?.value1 || conflict.details?.principle1 || conflict.details?.priority1 || 'unknown',
                    framework: conflict.framework1_name || conflict.framework1,
                    strength: 'strong'
                },
                { 
                    element_type: element_type, 
                    content: conflict.details?.value2 || conflict.details?.principle2 || conflict.details?.priority2 || 'unknown',
                    framework: conflict.framework2_name || conflict.framework2,
                    strength: 'moderate'
                }
            ];
        }
        
        // Ensure severity is set
        if (!conflict.severity) {
            conflict.severity = 'medium';
        }
    });
    
    const resolutionResult = resolveConflicts(reasoningPaths, conflicts, dilemma);
    const resolutions = resolutionResult.resolutions || [];
    console.log("Generated", resolutions.length, "reconciled paths\n");

    if (resolutions.length > 0) {
        console.log("=== Reconciled Path Details ===");
        resolutions.forEach((path, index) => {
            console.log(`\nReconciled Path #${index + 1}:`);
            console.log(`Framework: ${path.framework}`);
            console.log(`Action: ${path.action}`);
            console.log(`Strength: ${path.strength}`);
            console.log(`Original Frameworks: ${path.originalFrameworks}`);
            console.log(`Conflict Type: ${path.conflictType}`);
            console.log(`Resolution Strategy: ${path.resolutionStrategy}`);
            console.log(`Resolution Description: ${path.resolutionDescription}`);

            console.log(`\nArgument Preview:`);
            console.log(path.argument);
        });
    }

    // Save the reconciled paths to a JSON file
    const outputPath = path.join(__dirname, 'resolved-paths-output.json');
    fs.writeFileSync(outputPath, JSON.stringify(resolutions, null, 2), 'utf8');
    console.log(`\nSaved reconciled paths to ${outputPath}`);

    console.log("\n=== Test Complete ===");
}

main();
