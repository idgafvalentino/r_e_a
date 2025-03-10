/**
 * test-summary.js
 * 
 * This script analyzes the results of the comprehensive granular conflict detection test
 * and provides a summary report.
 */

const fs = require('fs');

// Function to format text for display
function formatText(text, maxLength = 80) {
  if (!text) return '';
  
  // Clean up whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if necessary
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}

// Function to analyze conflicts
function analyzeConflicts(conflictsFile) {
  console.log(`Analyzing conflicts from ${conflictsFile}...`);
  
  try {
    // Load conflicts data
    const data = JSON.parse(fs.readFileSync(conflictsFile, 'utf8'));
    
    if (!data || !data.all) {
      console.log('No valid conflict data found.');
      return {
        totalCount: 0,
        sameActionCount: 0,
        crossActionCount: 0,
        typeCounts: {},
        frameworkConflicts: {},
        severityCounts: {}
      };
    }
    
    // Basic counts
    const totalCount = data.all.length;
    const sameActionCount = data.sameAction ? data.sameAction.length : 0;
    const crossActionCount = data.crossAction ? data.crossAction.length : 0;
    
    // Count by type
    const typeCounts = {};
    const elementTypeCounts = {};
    const frameworkConflicts = {};
    const severityCounts = {};
    const actionConflicts = {};
    
    data.all.forEach(conflict => {
      // Count conflict types
      typeCounts[conflict.type] = (typeCounts[conflict.type] || 0) + 1;
      
      // Count element types
      if (conflict.element_type) {
        elementTypeCounts[conflict.element_type] = (elementTypeCounts[conflict.element_type] || 0) + 1;
      }
      
      // Count framework conflicts
      const frameworkPair = `${conflict.framework1_name || 'unknown'} vs ${conflict.framework2_name || 'unknown'}`;
      frameworkConflicts[frameworkPair] = (frameworkConflicts[frameworkPair] || 0) + 1;
      
      // Count by severity
      severityCounts[conflict.severity || 'unknown'] = (severityCounts[conflict.severity || 'unknown'] || 0) + 1;
      
      // Count by action
      if (conflict.action) {
        actionConflicts[conflict.action] = (actionConflicts[conflict.action] || 0) + 1;
      } else if (conflict.action1 && conflict.action2) {
        const actionPair = `${conflict.action1} vs ${conflict.action2}`;
        actionConflicts[actionPair] = (actionConflicts[actionPair] || 0) + 1;
      }
    });
    
    return {
      totalCount,
      sameActionCount,
      crossActionCount,
      typeCounts,
      elementTypeCounts,
      frameworkConflicts,
      severityCounts,
      actionConflicts
    };
  } catch (error) {
    console.error(`Error analyzing conflicts: ${error.message}`);
    return null;
  }
}

// Function to analyze reasoning paths
function analyzeReasoningPaths(pathsFile) {
  console.log(`Analyzing reasoning paths from ${pathsFile}...`);
  
  try {
    // Load reasoning paths data
    const paths = JSON.parse(fs.readFileSync(pathsFile, 'utf8'));
    
    if (!Array.isArray(paths)) {
      console.log('No valid reasoning paths data found.');
      return {
        totalCount: 0,
        frameworkCounts: {},
        actionCounts: {},
        strengthCounts: {}
      };
    }
    
    // Basic counts
    const totalCount = paths.length;
    
    // Count by framework
    const frameworkCounts = {};
    const actionCounts = {};
    const strengthCounts = {};
    const elementCounts = {};
    
    paths.forEach(path => {
      // Count frameworks
      frameworkCounts[path.framework] = (frameworkCounts[path.framework] || 0) + 1;
      
      // Count actions/conclusions
      const action = path.conclusion || path.action;
      if (action) {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      }
      
      // Count by strength
      strengthCounts[path.strength || 'unknown'] = (strengthCounts[path.strength || 'unknown'] || 0) + 1;
      
      // Count elements
      if (path.source_elements && Array.isArray(path.source_elements)) {
        path.source_elements.forEach(element => {
          if (element.type) {
            elementCounts[element.type] = (elementCounts[element.type] || 0) + 1;
          }
        });
      }
    });
    
    return {
      totalCount,
      frameworkCounts,
      actionCounts,
      strengthCounts,
      elementCounts
    };
  } catch (error) {
    console.error(`Error analyzing reasoning paths: ${error.message}`);
    return null;
  }
}

// Function to generate report
function generateReport() {
  console.log('\n====== COMPREHENSIVE TEST RESULTS SUMMARY ======\n');
  
  // 1. Analyze generated paths
  const pathsAnalysis = analyzeReasoningPaths('./tests/generated-paths.json');
  
  if (pathsAnalysis) {
    console.log('\n== REASONING PATHS SUMMARY ==\n');
    console.log(`Total Paths: ${pathsAnalysis.totalCount}`);
    
    console.log('\nFramework Distribution:');
    Object.entries(pathsAnalysis.frameworkCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([framework, count]) => {
        console.log(`  ${framework}: ${count}`);
      });
    
    console.log('\nAction Distribution:');
    Object.entries(pathsAnalysis.actionCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([action, count]) => {
        console.log(`  ${action}: ${count}`);
      });
    
    console.log('\nStrength Distribution:');
    Object.entries(pathsAnalysis.strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([strength, count]) => {
        console.log(`  ${strength}: ${count}`);
      });
  }
  
  // 2. Analyze modified paths
  const modifiedPathsAnalysis = analyzeReasoningPaths('./tests/modified-paths.json');
  
  if (modifiedPathsAnalysis) {
    console.log('\n== MODIFIED PATHS SUMMARY ==\n');
    console.log(`Total Paths: ${modifiedPathsAnalysis.totalCount}`);
    
    if (Object.keys(modifiedPathsAnalysis.elementCounts).length > 0) {
      console.log('\nElement Distribution:');
      Object.entries(modifiedPathsAnalysis.elementCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([element, count]) => {
          console.log(`  ${element}: ${count}`);
        });
    }
  }
  
  // 3. Analyze conflicts
  const conflictsAnalysis = analyzeConflicts('./tests/detected-conflicts.json');
  
  if (conflictsAnalysis) {
    console.log('\n== CONFLICT DETECTION SUMMARY ==\n');
    console.log(`Total Conflicts: ${conflictsAnalysis.totalCount}`);
    console.log(`Same-Action Conflicts: ${conflictsAnalysis.sameActionCount}`);
    console.log(`Cross-Action Conflicts: ${conflictsAnalysis.crossActionCount}`);
    
    if (Object.keys(conflictsAnalysis.typeCounts).length > 0) {
      console.log('\nConflict Type Distribution:');
      Object.entries(conflictsAnalysis.typeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
    }
    
    if (Object.keys(conflictsAnalysis.elementTypeCounts).length > 0) {
      console.log('\nConflict Element Distribution:');
      Object.entries(conflictsAnalysis.elementTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([element, count]) => {
          console.log(`  ${element}: ${count}`);
        });
    }
    
    if (Object.keys(conflictsAnalysis.frameworkConflicts).length > 0) {
      console.log('\nFramework Conflict Distribution:');
      Object.entries(conflictsAnalysis.frameworkConflicts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Show top 5 
        .forEach(([pair, count]) => {
          console.log(`  ${pair}: ${count}`);
        });
    }
    
    if (Object.keys(conflictsAnalysis.severityCounts).length > 0) {
      console.log('\nSeverity Distribution:');
      Object.entries(conflictsAnalysis.severityCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([severity, count]) => {
          console.log(`  ${severity}: ${count}`);
        });
    }
    
    if (Object.keys(conflictsAnalysis.actionConflicts).length > 0) {
      console.log('\nAction Conflict Distribution:');
      Object.entries(conflictsAnalysis.actionConflicts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Show top 5
        .forEach(([action, count]) => {
          console.log(`  ${action}: ${count}`);
        });
    }
  }
  
  console.log('\n====== END OF SUMMARY ======\n');
}

// Run the report
generateReport(); 