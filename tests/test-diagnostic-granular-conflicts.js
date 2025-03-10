/**
 * test-diagnostic-granular-conflicts.js
 * 
 * A highly focused diagnostic version to identify why we're getting 
 * "Cannot read properties of undefined (reading 'framework')" error
 */

// Import necessary modules
console.log('Starting granular conflicts diagnostic test...');

const { detectAllConflicts } = require('../src/conflictDetection');
const { resolveConflicts } = require('../src/conflictResolution');
const { getFrameworkByName } = require('../src/frameworkRegistry');
const { createGranularElements, determineFrameworkType } = require('../src/utils');
const fs = require('fs');

// Define test dilemma with minimal structure
const dilemmaData = {
  id: 'diagnostic_dilemma',
  title: 'Diagnostic Dilemma',
  description: 'A test dilemma for diagnostic purposes.',
  possible_actions: [
    { action: 'action_a', predicted_consequences: 'Consequence A' },
    { action: 'action_b', predicted_consequences: 'Consequence B' }
  ],
  actions: {
    "action_a": { description: "Action A" },
    "action_b": { description: "Action B" }
  },
  frameworks: ["utilitarianism", "deontology"],
  parameters: {
    parameter_1: { value: 0.5, description: "Parameter 1" }
  }
};

// Function to format text for display
function formatText(text, maxLength = 80) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
}

// Run the diagnostic test with extensive checks
async function runDiagnosticTest() {
  console.log('===== DIAGNOSTIC CONFLICT DETECTION TEST =====\n');
  
  try {
    // STEP 1: Get frameworks from registry
    console.log('STEP 1: Getting frameworks from registry...');
    let frameworks = [];
    
    try {
      const utilitarianism = getFrameworkByName("Utilitarianism");
      console.log(`Retrieved Utilitarianism framework: ${utilitarianism ? 'YES' : 'NO'}`);
      if (utilitarianism) {
        console.log(`- Name: ${utilitarianism.name}`);
        console.log(`- ID: ${utilitarianism.id}`);
        frameworks.push(utilitarianism);
      }
      
      const deontology = getFrameworkByName("Deontology");
      console.log(`Retrieved Deontology framework: ${deontology ? 'YES' : 'NO'}`);
      if (deontology) {
        console.log(`- Name: ${deontology.name}`);
        console.log(`- ID: ${deontology.id}`);
        frameworks.push(deontology);
      }
      
      console.log(`Retrieved ${frameworks.length} frameworks from registry`);
    } catch (error) {
      console.error('Error getting frameworks from registry:', error);
    }
    
    // STEP 2: Create reasoning paths manually with explicit framework objects
    console.log('\nSTEP 2: Creating reasoning paths...');
    
    let reasoningPaths = [];
    try {
      reasoningPaths = [
        // Path 1 - framework from registry if available, otherwise manual
        {
          id: 'path_1',
          framework: frameworks[0] ? frameworks[0].name : "Utilitarianism",
          framework_id: frameworks[0] ? frameworks[0].id : "utilitarianism",
          framework_type: "pure",
          conclusion: "action_a",
          strength: "strong",
          action: "action_a",
          argument: "This is a test argument for path 1.",
          source_elements: [],
          stakeholder_scores: {
            'stakeholder_1': 0.7,
            'stakeholder_2': 0.6
          }
        },
        
        // Path 2 - framework from registry if available, otherwise manual
        {
          id: 'path_2',
          framework: frameworks[1] ? frameworks[1].name : "Deontology",
          framework_id: frameworks[1] ? frameworks[1].id : "deontology",
          framework_type: "pure",
          conclusion: "action_b",
          strength: "strong",
          action: "action_b",
          argument: "This is a test argument for path 2.",
          source_elements: [],
          stakeholder_scores: {
            'stakeholder_1': 0.5,
            'stakeholder_2': 0.8
          }
        }
      ];
      
      console.log(`Created ${reasoningPaths.length} reasoning paths`);
      
      // Validate reasoning paths
      reasoningPaths.forEach((path, index) => {
        console.log(`\nPath ${index + 1} validation:`);
        console.log(`- ID: ${path.id}`);
        console.log(`- Framework: ${path.framework}`);
        console.log(`- Framework ID: ${path.framework_id}`);
        console.log(`- Action: ${path.action}`);
        console.log(`- Conclusion: ${path.conclusion}`);
        
        // Check if framework is defined
        if (!path.framework) {
          console.error(`ERROR: Framework is undefined for path ${path.id}`);
        }
      });
    } catch (error) {
      console.error('Error creating reasoning paths:', error);
      reasoningPaths = [];
    }
    
    // STEP 3: Create granular elements
    console.log('\nSTEP 3: Creating granular elements...');
    
    let allGranularElements = [];
    try {
      // Only create elements if we have valid paths
      if (reasoningPaths.length >= 2) {
        // Create granular elements for first path
        const elements1 = createGranularElements(
          reasoningPaths[0].framework,
          reasoningPaths[0].action,
          "Test principle 1",
          "Test justification 1",
          "Test objection 1",
          "Test response 1",
          reasoningPaths[0].conclusion,
          reasoningPaths[0].strength,
          { actionRelevance: 0.9 }
        );
        
        // Create granular elements for second path
        const elements2 = createGranularElements(
          reasoningPaths[1].framework,
          reasoningPaths[1].action,
          "Test principle 2",
          "Test justification 2",
          "Test objection 2",
          "Test response 2",
          reasoningPaths[1].conclusion,
          reasoningPaths[1].strength,
          { actionRelevance: 0.85 }
        );
        
        // Assign elements to their respective paths
        reasoningPaths[0].source_elements = elements1;
        reasoningPaths[1].source_elements = elements2;
        
        // Combine all elements
        allGranularElements = [...elements1, ...elements2];
        
        console.log(`Created ${allGranularElements.length} granular elements across ${reasoningPaths.length} paths`);
      } else {
        console.log('Skipping granular element creation due to insufficient paths');
      }
    } catch (error) {
      console.error('Error creating granular elements:', error);
    }
    
    // STEP 4: Detect conflicts
    console.log('\nSTEP 4: Detecting conflicts...');
    
    let conflicts = { all: [], sameAction: [], crossAction: [] };
    try {
      conflicts = detectAllConflicts(reasoningPaths);
      
      console.log('\nCONFLICT DETECTION SUMMARY:');
      console.log(`Total conflicts: ${conflicts.all.length}`);
      console.log(`Same-action conflicts: ${conflicts.sameAction.length}`);
      console.log(`Cross-action conflicts: ${conflicts.crossAction.length}`);
      
      // Validate conflict objects
      if (conflicts.all.length > 0) {
        conflicts.all.forEach((conflict, index) => {
          console.log(`\nConflict ${index + 1} validation:`);
          console.log(`- Type: ${conflict.type}`);
          console.log(`- Framework1: ${conflict.framework1}`);
          console.log(`- Framework2: ${conflict.framework2}`);
          console.log(`- Severity: ${conflict.severity}`);
          
          // Check path references
          if (conflict.paths) {
            console.log(`- Has paths array: YES (${conflict.paths.length} items)`);
            conflict.paths.forEach((path, pathIndex) => {
              console.log(`  Path ${pathIndex + 1}: ${path ? path.framework : 'UNDEFINED'}`);
            });
          } else {
            console.log(`- Has paths array: NO`);
          }
        });
      }
      
      // Save conflicts to file for inspection
      try {
        fs.writeFileSync('./tests/diagnostic-conflicts.json', JSON.stringify(conflicts, null, 2));
        console.log('Saved conflicts to tests/diagnostic-conflicts.json');
      } catch (error) {
        console.error('Error saving conflicts to file:', error);
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }
    
    // STEP 5: Test balance resolution strategy
    console.log('\nSTEP 5: Testing balance resolution strategy...');
    
    try {
      // Skip if no conflicts were detected
      if (conflicts.all.length === 0) {
        console.log('Skipping conflict resolution - no conflicts detected');
        return {
          success: true,
          reasoningPaths,
          conflicts,
          resolutions: []
        };
      }
      
      // Helper function to enhance conflicts with paths
      const enhanceConflictsWithPathsInfo = (conflicts, allPaths) => {
        if (!conflicts || !allPaths) return conflicts;
        
        console.log(`Enhancing ${conflicts.length} conflicts with path information...`);
        
        return conflicts.map((conflict, index) => {
          console.log(`\nEnhancing conflict ${index + 1}:`);
          console.log(`- Framework1: ${conflict.framework1}`);
          console.log(`- Framework2: ${conflict.framework2}`);
          
          // Skip if already enhanced
          if (conflict.paths && Array.isArray(conflict.paths) && conflict.paths.length >= 2) {
            console.log('- Already has paths array, skipping');
            return conflict;
          }
          
          // Find paths for each framework
          let path1, path2;
          
          if (conflict.framework1) {
            path1 = allPaths.find(p => p.framework === conflict.framework1);
            console.log(`- Path1 found: ${path1 ? 'YES' : 'NO'}`);
          }
          
          if (conflict.framework2) {
            path2 = allPaths.find(p => p.framework === conflict.framework2);
            console.log(`- Path2 found: ${path2 ? 'YES' : 'NO'}`);
          }
          
          // Try finding by framework ID if name doesn't work
          if (!path1 && conflict.framework1_id) {
            path1 = allPaths.find(p => p.id === conflict.framework1_id || p.framework_id === conflict.framework1_id);
            console.log(`- Path1 found by ID: ${path1 ? 'YES' : 'NO'}`);
          }
          
          if (!path2 && conflict.framework2_id) {
            path2 = allPaths.find(p => p.id === conflict.framework2_id || p.framework_id === conflict.framework2_id);
            console.log(`- Path2 found by ID: ${path2 ? 'YES' : 'NO'}`);
          }
          
          // If we found both paths, add them to the conflict
          if (path1 && path2) {
            console.log('- Successfully enhanced conflict with paths');
            return {
              ...conflict,
              paths: [path1, path2]
            };
          }
          
          console.log('- Failed to enhance conflict with paths');
          return conflict;
        });
      };
      
      // Apply the balance resolution strategy
      console.log('\nApplying balance resolution strategy...');
      
      // Enhance conflicts with path information
      let enhancedConflicts = { 
        sameAction: enhanceConflictsWithPathsInfo(conflicts.sameAction, reasoningPaths),
        crossAction: enhanceConflictsWithPathsInfo(conflicts.crossAction, reasoningPaths),
      };
      enhancedConflicts.all = [...enhancedConflicts.sameAction, ...enhancedConflicts.crossAction];
      
      // Validate enhanced conflict paths
      if (enhancedConflicts.all.length > 0) {
        enhancedConflicts.all.forEach((conflict, index) => {
          console.log(`Enhanced conflict ${index + 1} validation:`);
          if (conflict.paths) {
            console.log(`- Has paths: YES (${conflict.paths.length})`);
            if (conflict.paths.length >= 2) {
              console.log(`- Path1 framework: ${conflict.paths[0] ? conflict.paths[0].framework : 'UNDEFINED'}`);
              console.log(`- Path2 framework: ${conflict.paths[1] ? conflict.paths[1].framework : 'UNDEFINED'}`);
            } else {
              console.log(`- ISSUE: Fewer than 2 paths found (${conflict.paths.length})`);
            }
          } else {
            console.log('- Has paths: NO');
          }
        });
      }
      
      // Check if we have any valid conflicts to resolve
      const validConflicts = enhancedConflicts.all.filter(
        c => c.paths && c.paths.length >= 2 && c.paths[0] && c.paths[1]
      );
      
      if (validConflicts.length === 0) {
        console.log('No valid conflicts to resolve after enhancement, skipping resolution');
        return {
          success: true,
          reasoningPaths,
          conflicts,
          resolutions: []
        };
      }
      
      // Resolve conflicts
      console.log(`Calling resolveConflicts with ${validConflicts.length} conflicts...`);
      const balanceResolutions = resolveConflicts(
        reasoningPaths, 
        validConflicts, 
        dilemmaData, 
        allGranularElements, 
        { strategy: 'balance' }
      );
      
      console.log(`Generated ${balanceResolutions.resolutions ? balanceResolutions.resolutions.length : 0} balance resolutions`);
      
      // Save resolutions to file
      try {
        fs.writeFileSync('./tests/diagnostic-balance-result.json', JSON.stringify(balanceResolutions, null, 2));
        console.log('Saved balance resolutions to tests/diagnostic-balance-result.json');
      } catch (error) {
        console.error('Error saving balance resolutions:', error);
      }
      
      return {
        success: true,
        reasoningPaths,
        conflicts,
        resolutions: balanceResolutions.resolutions || []
      };
    } catch (error) {
      console.error('Error in balance resolution strategy testing:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  } catch (error) {
    console.error('\nFATAL ERROR in diagnostic test:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the diagnostic test
console.log('Running diagnostic test...');
runDiagnosticTest().then(results => {
  console.log('\nDiagnostic test completed!');
  if (!results.success) {
    console.error('Test encountered an error:', results.error);
  } else {
    console.log('Test completed successfully.');
  }
}).catch(error => {
  console.error('Fatal error during test execution:', error);
}); 