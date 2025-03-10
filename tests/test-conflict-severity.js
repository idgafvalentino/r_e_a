// test-conflict-severity.js

const { detectAllConflicts, calculateConflictSeverity } = require('../src/conflictDetection');
const { generateReasoningPaths } = require('../src/reasoningPath');
const { getFrameworkByName, getAllFrameworks } = require('../src/frameworkRegistry'); // Import
const { createGranularElements, actionRelevanceScore } = require('../src/utils');
const assert = require('assert');

describe('Conflict Severity Tests', () => {
    it('should calculate conflict severity correctly with artificially introduced conflicts', async () => { // Use async
        // 1. Create a BASE dilemma and precedents (can be simple)
        const dilemma = {
            title: "Test Dilemma", // Add a title
            description: "A doctor must decide whether to perform a risky surgery on a patient.",
            context: "medical", // Add context for relevance boosting
            actions: ['perform_surgery', 'do_not_perform_surgery'] // IMPORTANT: Define actions
        };
        const precedents = []; // Precedents not needed for this test

        // 2. Generate INITIAL reasoning paths (these don't need to be conflicting YET)
        const util = getFrameworkByName("Utilitarianism");
        const deont = getFrameworkByName("Kantian Deontology");

        const reasoningPaths = [
            {
                framework: util.name, // Use framework registry!
                conclusion: 'perform_surgery',
                strength: 'strong',
                action: 'perform_surgery',
                argument: "Utilitarianism suggests performing surgery to save a life", //Provide arguments
            },
            {
                framework: deont.name, // Use framework registry!
                conclusion: 'do_not_perform_surgery',
                strength: 'strong',
                action: 'do_not_perform_surgery',
                argument: "Deontology suggests respecting patient autonomy and not performing surgery.", //Provide arguments.
            },
        ];

        // 3.  **MANIPULATE** the reasoning paths to CREATE CONFLICTS.
        //    This is the KEY step.  We'll create a direct conclusion conflict.

        // Ensure we have at least two reasoning paths for a conflict
        if (reasoningPaths.length < 2) {
            throw new Error("Insufficient reasoning paths for conflict testing.");
        }

        // 4. Create GRANULAR ELEMENTS for the reasoning paths.  This is KEY!
        let granularElements = [];

        // Utilitarianism Path Elements
        granularElements = granularElements.concat(createGranularElements(
            reasoningPaths[0].framework, // framework
            reasoningPaths[0].action,     // action
            "Maximize happiness",         // principle
            "Surgery saves a life",        // justification
            "Causes pain",               // objection
            null,                         // response
            reasoningPaths[0].conclusion,
            reasoningPaths[0].strength
        ));

        // Deontology Path Elements
        granularElements = granularElements.concat(createGranularElements(
            reasoningPaths[1].framework,
            reasoningPaths[1].action,
            "Respect autonomy",
            "Surgery violates patient choice",
            "Ignores consequences",       // objection
            null,                         // response
            reasoningPaths[1].conclusion,
            reasoningPaths[1].strength
        ));

        // Now we have reasoning paths and their associated granular elements.

        //Manually set relevance to high values to boost severity
        for (const element of granularElements){
            if (element.framework === "Utilitarianism"){
                // Set high relevance for Utilitarianism elements to boost severity
                element.relevance = 0.9;
            }
            else if (element.framework === "Kantian Deontology"){
                // Set high relevance for Kantian Deontology elements
                element.relevance = 0.8;
            }
        }
        // 5. NOW call detectAllConflicts
        const conflicts = detectAllConflicts(reasoningPaths, dilemma, granularElements);

        // 6. Assertions
        assert.ok(conflicts.all.length > 0, 'Conflicts should be detected'); // Check that conflicts were found

        // Verify that we have a CROSS_ACTION_VALUE conflict
        const crossActionValueConflicts = conflicts.all.filter(c => c.type === 'CROSS_ACTION_VALUE');
        assert.ok(crossActionValueConflicts.length > 0, 'A CROSS_ACTION_VALUE conflict should exist');

         // Example assertion (check severity of the FIRST detected conflict)
         if (conflicts.all.length > 0) {
            const firstConflict = conflicts.all[0];
            console.log("Conflict:", firstConflict)
            const severity = calculateConflictSeverity(firstConflict, granularElements, reasoningPaths);
            assert.strictEqual(severity, 'high', "Severity check") // Or whatever you expect
        }
        // --- Example: Test a PRINCIPLE Conflict --- (This is *within* a single path)
        const reasoningPaths2 = [
            {
                framework: 'Utilitarianism',
                conclusion: 'perform_surgery',
                strength: 'strong',
                action: 'perform_surgery',
                argument: 'Utilitarianism suggests performing surgery to save a life', // Add an argument
                source_elements: [] // Initialize source_elements
            }
        ];
         // First approach: testing with conflicting_principles array
        let granularElements2 = [];

        granularElements2 = granularElements2.concat(createGranularElements(
            reasoningPaths2[0].framework,
            reasoningPaths2[0].action,
            "Maximize happiness",
            "Surgery saves a life",
            "Causes pain", // Add an objection (conflicting principle)
            null,
            reasoningPaths2[0].conclusion,
            reasoningPaths2[0].strength
        ));
        //Directly set principle to principle conflict
        granularElements2[0].conflicting_principles = ["Minimize suffering"]; // Directly set conflicting principle

        // Second approach: create separate granular elements for each principle
        granularElements2 = granularElements2.concat(createGranularElements(
            reasoningPaths2[0].framework,
            reasoningPaths2[0].action,
            "Minimize suffering", // The conflicting principle as a separate element
            "Surgery causes pain", // Justification for this principle
            null, // No objection needed 
            null,
            reasoningPaths2[0].conclusion, // Same conclusion
            "moderate" // Different strength
        ));

         // Set high relevance for principle conflict elements
          for (const element of granularElements2) {
            if (element.framework === 'Utilitarianism') {
              element.relevance = 0.9; // High relevance to boost severity
            }
        }

        const conflicts2 = detectAllConflicts(reasoningPaths2, dilemma, granularElements2);
        const principleConflicts = conflicts2.all.filter(c => c.type === 'PRINCIPLE');
        assert.ok(principleConflicts.length > 0, 'A PRINCIPLE conflict should exist');
    });

    // You can add more `it` blocks here to test different conflict types and severity factors
    //  - Different conflict types (VALUE, PRINCIPLE, CROSS_ACTION_PRINCIPLE)
    //  - Different combinations of framework importance and action relevance
});
