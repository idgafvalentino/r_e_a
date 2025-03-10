#!/usr/bin/env node
/**
 * REA System: Reasoning by Ethical Analogy
 * CLI Launcher
 * 
 * This is a simple launcher script for the REA system CLI.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Import necessary modules ---
const { deepClone, highlightChangesCLI } = require('./utils');
const { generateReasoningPaths, identifyKeyDifferences } = require('./reasoningPath');
const { findRelevantPrecedents } = require('./similarity');
const { detectConflicts } = require('./conflictDetection');
const { resolveConflicts } = require('./conflictResolution');

// Import the precedents
const precedents = require('./precedents');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function promptAsync(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

function displayWelcome() {
    console.log("===============================================");
    console.log("  Recursive Ethical Anchors (REA) System");
    console.log("  Prototype Interface");
    console.log("===============================================");
}

// Updated to correctly display titles from the loaded precedents
function showExampleList() {
    console.log("\nAvailable Examples:");
    if (precedents && precedents.length > 0) {
        precedents.forEach((precedent, index) => {
            console.log(`${index + 1}: ${precedent.title}`); // Display each precedent's title
        });
    } else {
        console.log("No examples available."); // Handle empty precedent database case
    }
}

function getExampleDilemma(exampleNum) {
    // Ensure the precedents array is populated
    if (!precedents || precedents.length === 0) {
        console.error("Error: Precedent database is empty.");
        return null;
    }

    const exampleIndex = parseInt(exampleNum) - 1; // Adjust for zero-based indexing

    if (isNaN(exampleIndex) || exampleIndex < 0 || exampleIndex >= precedents.length) {
        console.error(`Error: Invalid example number. Please enter a number between 1 and ${precedents.length}.`);
        return null;
    }
    // Return deep clone.
    return deepClone(precedents[exampleIndex]);
}

async function promptForDilemma() {
    console.log("\nHow would you like to input a dilemma?");
    console.log("1. Select an example dilemma");
    console.log("2. Describe a new dilemma");
    console.log("3. Load from JSON file");
    console.log("list - Show all example dilemmas");
    console.log("q - Quit");

    let choice = await promptAsync("> ");
    choice = choice.toLowerCase();

    if (choice === 'q') {
        return null; // Signal to quit
    }

    if (choice === 'list') {
        showExampleList();
        return promptForDilemma(); // Use Promise recursion
    }

    if (choice === '1') {
        console.log("\nSelect an example dilemma (enter number):");
        showExampleList();
        const exampleNumInput = await promptAsync("> ");
        const exampleNum = parseInt(exampleNumInput, 10);
        console.log(`Selected example: ${exampleNum}`);
        const exampleDilemma = getExampleDilemma(exampleNum);

        if (!exampleDilemma) {
            console.log("Invalid example number. Please try again.");
            return promptForDilemma(); // Recursive call on invalid input
        }

        console.log("Using example dilemma:", exampleDilemma.title || "Unnamed Dilemma");
        console.log("Description:", exampleDilemma.description || "No description available");
        return exampleDilemma;
    } else if (choice === '2') {
        console.log("\nPlease describe your ethical dilemma.");
        console.log("This feature is not fully implemented in the prototype.");
        console.log("Please use option 1 or 3 instead.");
        return promptForDilemma();
    } else if (choice === '3') {
        console.log("\nPlease enter the path to your JSON file containing the dilemma:");
        
        const inputPath = (await promptAsync("> ")).trim();
        if (!inputPath) {
            console.error("Empty input. Please enter a valid file path.");
            return promptForDilemma();
        }
        const resolvedPath = path.resolve(__dirname, inputPath);

        try {
            const dilemmaJson = fs.readFileSync(resolvedPath, 'utf8');
            console.log(`Loaded JSON from file: ${resolvedPath}`);
            
            try {
                const dilemma = JSON.parse(dilemmaJson);
                
                // Validate required structure
                if (!dilemma || typeof dilemma !== 'object') {
                    console.log("Invalid dilemma format. JSON must represent an object.");
                    return promptForDilemma();
                }
                
                // Add/validate the required fields
                dilemma.precedent_id = dilemma.precedent_id || "user_input_" + Date.now();
                dilemma.title = dilemma.title || "User-Provided Dilemma";
                
                // Ensure situation and parameters exist
                if (!dilemma.situation) {
                    dilemma.situation = {};
                }
                if (!dilemma.situation.parameters) {
                    dilemma.situation.parameters = {};
                    console.log("Warning: No parameters provided. Using empty parameters object.");
                }
                
                // Handle contextual factors
                if (!Array.isArray(dilemma.contextual_factors)) {
                    if (dilemma.contextual_factors && typeof dilemma.contextual_factors === 'object') {
                        console.log("Converting flat contextual factors structure to required format...");
                        // Convert object format to array format
                        const factorsArray = [];
                        for (const [factor, value] of Object.entries(dilemma.contextual_factors)) {
                            factorsArray.push({
                                factor: factor,
                                value: value,
                                relevance: "medium" // Default relevance when not specified
                            });
                        }
                        dilemma.contextual_factors = factorsArray;
                    } else {
                        dilemma.contextual_factors = [];
                        console.log("Warning: No contextual factors provided. Using empty factors array.");
                    }
                }
                
                if (!dilemma.description) {
                    dilemma.description = `Ethical dilemma: ${dilemma.title}`;
                    console.log("Warning: No description provided. Using title as description.");
                }
                
                if (!Array.isArray(dilemma.reasoning_paths)) {
                    dilemma.reasoning_paths = [];
                    console.log("Warning: No reasoning paths provided. Using empty array.");
                }
                
                console.log("Dilemma structure:", JSON.stringify(dilemma, null, 2));
                return dilemma;
            } catch (error) {
                console.error("Invalid JSON:", error.message);
                console.log("Please enter valid JSON file path.");
                return promptForDilemma();
            }
        } catch (error) {
            console.error(`Error loading file: ${error.message}`);
            console.log("Please enter a valid file path.");
            return promptForDilemma();
        }
    } else {
        console.log("Invalid option. Please try again.");
        return promptForDilemma();
    }
}

async function analyzeDilemma(dilemma) {
    console.log("\nAnalyzing dilemma...");
    
    // Find relevant precedents
    const relevantPrecedents = findRelevantPrecedents(dilemma, precedents);
    console.log(`Found ${relevantPrecedents.length} relevant precedents.`);
    
    // Generate reasoning paths
    console.log("Generating reasoning paths...");
    const reasoningPaths = await generateReasoningPaths(dilemma, precedents);
    console.log(`Generated ${reasoningPaths.length} reasoning paths.`);
    
    // If we have relevant precedents, identify key differences with the best match
    let keyDifferences = [];
    let bestMatch = null;
    
    if (relevantPrecedents && relevantPrecedents.length > 0) {
        bestMatch = relevantPrecedents[0];
        console.log(`Best matching precedent: ${bestMatch.precedent.title} (similarity: ${bestMatch.similarity.toFixed(2)})`);
        keyDifferences = identifyKeyDifferences(dilemma, bestMatch.precedent);
        console.log(`Identified ${keyDifferences.length} key differences with best precedent.`);
    }
    
    // Detect conflicts between reasoning paths
    console.log("Detecting conflicts in reasoning paths...");
    const conflicts = detectConflicts(reasoningPaths);
    console.log(`Detected ${conflicts.length} conflicts.`);
    
    // Resolve conflicts if any exist
    let resolvedPaths = [];
    if (conflicts.length > 0) {
        console.log("Resolving conflicts...");
        resolvedPaths = resolveConflicts(conflicts, reasoningPaths, dilemma);
        console.log(`Generated ${resolvedPaths.length} reconciled paths.`);
    }
    
    return {
        dilemma,
        bestMatch,
        reasoningPaths,
        conflicts,
        resolvedPaths,
        keyDifferences,
        syntheticAnalysis: !bestMatch
    };
}

function displayResults(results) {
    console.log("\n==== Analysis Results ====");
    
    // Display dilemma info
    console.log(`\nDilemma: ${results.dilemma.title}`);
    console.log(`Description: ${results.dilemma.description || "No description available"}`);
    
    // Display best match if available
    if (results.bestMatch) {
        console.log(`\nBest Matching Precedent: ${results.bestMatch.precedent.title}`);
        
        // Display key differences
        if (results.keyDifferences && results.keyDifferences.length > 0) {
            console.log("\nKey Differences with Precedent:");
            for (const diff of results.keyDifferences) {
                console.log(`- ${diff.type} "${diff.name}": ${diff.precedent_value} → ${diff.new_value}`);
            }
        }
    } else {
        console.log("\nNo relevant precedent found. Using synthetic reasoning.");
    }
    
    // Display reasoning paths
    if (results.reasoningPaths && results.reasoningPaths.length > 0) {
        console.log("\nReasoning Paths:");
        results.reasoningPaths.forEach((path, index) => {
            console.log(`\n[${index + 1}] Source: ${path.source}, Framework: ${path.framework}, Action: ${path.action}`);
            
            // Display a snippet of the argument
            const argumentSnippet = path.argument.split('\n').slice(0, 2).join('\n') + '...';
            console.log(highlightChangesCLI(argumentSnippet));
            
            // Display score if available
            if (path.score !== undefined) {
                console.log(`Score: ${path.score.toFixed(2)}`);
            }
        });
    }
    
    // Display conflicts
    if (results.conflicts && results.conflicts.length > 0) {
        console.log("\nDetected Conflicts:");
        results.conflicts.forEach((conflict, index) => {
            console.log(`\n[${index + 1}] Conflict between actions: ${conflict.action1} and ${conflict.action2}`);
            console.log(`Severity: ${conflict.severity || "Unknown"}`);
            console.log(`Type: ${conflict.type || "Unknown"}`);
        });
    }
    
    // Display resolved paths
    if (results.resolvedPaths && results.resolvedPaths.length > 0) {
        console.log("\nReconciled Reasoning Paths:");
        results.resolvedPaths.forEach((path, index) => {
            console.log(`\n[${index + 1}] Resolution Strategy: ${path.strategy}`);
            console.log(`Action: ${path.action}`);
            
            // Display a snippet of the reconciled argument
            const argumentSnippet = path.argument.split('\n').slice(0, 2).join('\n') + '...';
            console.log(highlightChangesCLI(argumentSnippet));
        });
    }
}

async function main() {
    displayWelcome();
    
    let running = true;
    while (running) {
        const dilemma = await promptForDilemma();
        
        if (!dilemma) {
            running = false;
            console.log("Exiting REA System. Goodbye!");
            break;
        }
        
        const results = await analyzeDilemma(dilemma);
        displayResults(results);
        
        console.log("\nWould you like to analyze another dilemma? (y/n)");
        const continueResponse = await promptAsync("> ");
        
        if (continueResponse.toLowerCase() !== 'y') {
            running = false;
            console.log("Exiting REA System. Goodbye!");
        }
    }
    
    rl.close();
}

// Start the application
main().catch(error => {
    console.error("An error occurred:", error);
    rl.close();
}); 