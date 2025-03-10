# REA System: Reasoning by Ethical Analogy

A sophisticated system for analyzing ethical dilemmas through analogical reasoning with precedents, adapting ethical frameworks, and generating nuanced moral analyses.

## Overview

The REA (Reasoning by Ethical Analogy) system helps reason about complex ethical dilemmas by:

1. Finding similar past ethical dilemmas (precedents)
2. Identifying relevant similarities and differences  
3. Adapting the ethical reasoning from precedents to the new situation
4. Handling conflicts between different ethical perspectives
5. Generating synthetic precedents when no single precedent applies

The system is designed to provide thoughtful ethical analysis that considers multiple ethical frameworks, including:
- Utilitarianism
- Kantian Deontology
- Virtue Ethics
- Care Ethics
- Social Contract Theory
- Professional Ethics
- Natural Law Theory
- And hybrid frameworks that combine elements from multiple traditions

## Features

- Similarity calculation between ethical dilemmas
- Precedent-based reasoning by analogy
- Detection and resolution of ethical conflicts
- Multiple ethical frameworks support
- Adaptation of reasoning from previous cases
- Robust error handling for inconsistent data structures
- Support for medical triage and other complex ethical scenarios

## Installation

1. Ensure you have Node.js installed (v14+ recommended)
2. Clone this repository
3. Run `npm install` to install dependencies

## Project Structure

The codebase is organized as follows:

- `src/` - Core system modules
  - `similarity.js` - Similarity calculation between dilemmas and elements
  - `conflictDetection.js` - Detecting ethical conflicts between reasoning paths
  - `conflictResolution.js` - Resolving ethical conflicts between approaches
  - `adaptation.js` - Adapting reasoning from precedents to new dilemmas
  - `adaptationRules.js` - Rules for adapting ethical frameworks to specific dilemmas
  - `reasoningPath.js` - Generating reasoning paths for dilemmas
  - `precedents.js` - Precedent database management
  - `utils.js` - Common utility functions including:
    - `diffText` - Plain text diffing for tests and internal logic
    - `highlightChangesCLI` - Colorized text diffing for CLI display
    - String comparison and calculation functions
    - Parameter and factor extraction utilities
  - `index.js` - CLI interface for the system
- `tests/` - Test scripts for system validation
  - `test-comprehensive-adaption.js` - Tests for adaptation functionality
  - `test-path-conflicts.js` - Tests for conflict detection and resolution
  - `test-similarity.js` - Tests for dilemma similarity calculation
  - And other specialized test files
- `dilemmas/` - Example ethical dilemmas in JSON format
- `data/` - Data files including precedent database
- `backups/` - Archive of previous implementation versions

## Running Tests

You can run all tests using:

```
npm run test:all
```

Alternatively, you can use the legacy method:

```
node run-tests.js
```

To run individual tests:

```
node tests/test-conflict-resolution.js
node tests/test-adaptation-fix.js
node tests/test-similarity.js
node tests/test-comprehensive-adaption.js
```

## Using the CLI Interface

The REA system includes a command-line interface for analyzing ethical dilemmas:

```
node src/index.js
```

The CLI allows you to:
1. Browse example dilemmas
2. Create new dilemmas
3. Load dilemmas from JSON files
4. View ethical analyses from different frameworks
5. Compare dilemmas with relevant precedents

For a quick demo, run the CLI and select option 1 to view example dilemmas.

## Recent Improvements

The codebase has recently undergone significant improvements:

1. **Enhanced Conflict Resolution Strategies**:
   - Implemented sophisticated strategies for resolving conflicts between ethical frameworks
   - Balance strategy: Weighs competing values in context and proposes contextually appropriate resolutions
   - Stakeholder strategy: Prioritizes interests of the most affected stakeholders using Conditional Value at Risk (CVaR) analysis
   - Compromise strategy: Finds middle-ground solutions that moderately satisfy multiple ethical perspectives
   - Pluralistic strategy: Acknowledges the validity of multiple ethical perspectives without forcing a single resolution

2. **Improved Text Diff and Display**:
   - Refactored text highlighting into a dual-approach system:
     - `diffText`: Plain text version for internal logic and testing
     - `highlightChangesCLI`: ANSI color-enhanced version for CLI output
   - Separated concerns between text processing logic and display formatting
   - Improved test stability by removing ANSI color codes from test comparisons
   - Enhanced user experience with colored output in the CLI interface
   - Maintained backward compatibility with existing code

3. **Improved Similarity Metrics**:
   - Enhanced semantic matching with synonym recognition for ethical terminology
   - Implemented multi-dimensional similarity calculation combining containment, word overlap, edit distance, and semantic similarity
   - Added performance optimization through caching for repeated calculations
   - Implemented Levenshtein distance for edit distance measurement
   - Created a comprehensive test suite for similarity metrics

4. **Enhanced Precedent Structure**:
   - Added proper `actions` field to precedents like the medical_triage example
   - Added parameter and factor objects to reasoning paths for consistency
   - Improved handling of reasoning path adaptation from precedent to new dilemma

5. **Robust Error Handling**:
   - Added comprehensive error handling in adaptation rules to handle missing or undefined properties
   - Fixed type errors related to accessing properties of undefined objects
   - Added graceful fallbacks when expected data structures are missing

6. **Improved Action Mapping**:
   - Enhanced the logic for matching actions between precedents and new dilemmas
   - Added fallback mechanisms when exact action matches aren't found
   - Improved the generation of synthetic reasoning paths

7. **Bug Fixes and Optimizations**:
   - Fixed issues with the adaptation process for medical triage and similar dilemmas
   - Corrected error in conflict detection and resolution
   - Improved the way parameters and factors are considered in reasoning paths

8. **Enhanced Conflict Detection**:
   - Improved detection of principle conflicts within single granular elements
   - Added support for detecting conflicts from a `conflicting_principles` array
   - Enhanced conflict severity calculations with proper relevance scoring
   - Normalized type checks to handle both uppercase and lowercase principle types
   - Improved internal conflict detection within ethical frameworks
   - Enhanced test cases for validating conflict detection accuracy

## Usage

```javascript
const { calculateSimilarity } = require('./src/similarity');
const { detectConflicts, resolveConflicts } = require('./src/conflictDetection');
const { generateReasoningPaths } = require('./src/reasoningPath');
const { getPrecedentDatabase } = require('./src/precedents');

// Example usage
const dilemma = loadDilemma('./dilemmas/example_dilemma.json');
const precedents = getPrecedentDatabase();
const reasoningPaths = await generateReasoningPaths(dilemma, precedents);
const conflicts = detectConflicts(reasoningPaths);
const resolvedPaths = resolveConflicts(conflicts, reasoningPaths, dilemma);
```

## Adaptation Rules

The REA system uses several types of adaptation rules to modify reasoning from precedents:

1. **Parameter Adjustment**: Adapts reasoning based on differences in parameters between dilemmas
2. **Factor Relevancy**: Adjusts weights of contextual factors based on their relevance to the new dilemma
3. **Contextual Mapping**: Maps general ethical principles to the specific context of the dilemma
4. **Argument Adaptation**: Modifies arguments to reflect the specifics of the new situation
5. **Strength Adjustment**: Adjusts the strength of conclusions based on contextual differences

These rules enable the system to make nuanced adaptations that respect both the ethical principles of the precedent and the specific details of the new dilemma.

## License

This project is licensed under the ISC License.

## Acknowledgments

- Based on ethical reasoning research in AI
- Inspired by analogical reasoning and case-based reasoning in cognitive science
- Developed as an exploration of computational ethical reasoning 

## Code Organization Best Practices

To maintain a clean and efficient codebase for the REA system, please follow these guidelines:

### Directory Structure

The REA system is organized into the following directories:

1. **src/**: Contains all source code files
   - Core logic for ethical reasoning
   - Adaptation, similarity, conflict resolution, etc.

2. **dilemmas/**: Contains JSON dilemma files
   - Precedent dilemmas
   - Test dilemmas
   - New dilemmas for analysis

3. **tests/**: Contains all test files
   - Test scenarios for various system components
   - Integration tests for end-to-end functionality

4. **docs/**: Contains documentation
   - Usage guides
   - API documentation
   - Implementation notes

5. **backups/**: Contains backup files
   - Deprecated or superseded code versions
   - Historical implementations

### File Naming and Organization

1. **Consistent Naming Conventions**: Use camelCase for JavaScript files (e.g., `conflictResolution.js`) and maintain consistency.

2. **Avoid Duplicate Files**: Don't create multiple files with similar names (e.g., `conflict-resolution.js` and `conflictResolution.js`). This leads to import confusion.

3. **Module Structure**: Each core component should exist in a single file with a clear purpose:
   - `src/conflictDetection.js`: For detecting conflicts between reasoning paths
   - `src/conflictResolution.js`: For resolving detected conflicts
   - `src/reasoningPath.js`: For generating reasoning paths
   - `src/adaptation.js`: For adapting frameworks to specific dilemmas

### Import Best Practices

1. **Explicit Imports**: Always be explicit about what functions you're importing:
   ```javascript
   // In test files, import from src directory
   const { detectConflicts } = require('../src/conflictDetection');
   
   // In src files, import from the same directory
   const { detectConflicts } = require('./conflictDetection');
   ```

2. **Consistent Export Structure**: Export all public functions in a single object at the end of each file:
   ```javascript
   module.exports = {
     functionA,
     functionB,
     functionC
   };
   ```

3. **Avoid Circular Dependencies**: Be careful not to create circular dependencies between modules.

4. **Directory-based Imports**: Always use paths that reflect the directory structure:
   ```javascript
   // For loading dilemmas
   const dilemma = require('../dilemmas/example_dilemma.json');
   
   // For importing from src in tests
   const { someFunction } = require('../src/someModule');
   ```

### Framework Name Handling

1. **Consistent Framework Identifiers**: Always include both an `id` and a `framework` property in reasoning paths.

2. **Framework Name Propagation**: When creating conflicts or reconciled paths, always ensure framework names are properly propagated.

3. **Validation**: Add validation to ensure framework information is not lost during processing.

### Debugging

1. **Robust Logging**: Include detailed logging for complex operations, especially when frameworks are being processed.

2. **Fallbacks**: Implement fallback values (like "Unknown Framework") only as a last resort, and always log when this happens.

Following these best practices will help maintain the REA system as a robust, maintainable codebase.