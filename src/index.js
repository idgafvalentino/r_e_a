// src/index.js (TEMPORARY - for focused testing)

const fs = require('fs');
const path = require('path');
const { generateReasoningPaths } = require('./reasoningPath');
const { detectAllConflicts } = require('./conflictDetection');
const { resolveConflicts } = require('./conflictResolution');
const { getPrecedentDatabase } = require('./precedents');
const { loadDilemma } = require('./dilemmaLoader');

async function main() {
    // HARDCODED PATH to test dilemma
    const dilemmaPath = path.join(__dirname, '..', 'dilemmas', 'test-cross-action-conflict.json');
    const dilemma = loadDilemma(dilemmaPath);

    if (!dilemma) {
        console.error("Failed to load dilemma.");
        return;
    }

    console.log("Loaded dilemma:", dilemma.title);
    
    const precedents = getPrecedentDatabase();
    console.log(`Loaded ${precedents.length} precedents from database`);
    
    const reasoningPathOptions = {
        precedents: precedents,
        threshold: 0.2,
        maxPrecedents: 5,
        returnAllPaths: false,
        skipAdaptation: false
    };
    
    console.log("Generating reasoning paths...");
    const result = await generateReasoningPaths(dilemma, precedents, reasoningPathOptions);

    if (!result || !result.reasoningPaths) {
        console.error("No reasoning paths generated.");
        return;
    }

    console.log(`Generated ${result.reasoningPaths.length} reasoning paths.`);
    
    console.log("Detecting conflicts...");
    const conflicts = detectAllConflicts(result.reasoningPaths, dilemma, result.granularElements);
    console.log(`Detected ${conflicts.all.length} conflicts.`);
    console.log("Conflicts:", JSON.stringify(conflicts, null, 2));

    console.log("Resolving conflicts...");
    const resolved = resolveConflicts(result.reasoningPaths, conflicts.all, dilemma, result.granularElements);
    
    if (!resolved || !resolved.resolutions) {
        console.warn("Strategy returned no resolutions.");
    } else {
        console.log(`Generated ${resolved.resolutions.length} resolutions.`);
        console.log("Resolved Paths:", JSON.stringify(resolved, null, 2));
    }
}

main().catch(error => {
    console.error("Unhandled error:", error);
});
