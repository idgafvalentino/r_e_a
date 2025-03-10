/**
 * Framework Diagnostics Module
 * 
 * This module provides tools for diagnosing framework reference issues
 * and generating reports on framework lookup failures.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const frameworkLogger = require('./frameworkLogger');

/**
 * Detect framework name issues from the log file
 * @param {string} logFilePath - Path to the framework references log file
 * @returns {Object} Object containing detected name issues
 */
function detectFrameworkNameIssues(logFilePath) {
    const nameIssues = {
        caseInconsistencies: [],
        formatInconsistencies: [],
        similarNames: [],
        identified: false
    };

    const normalizedNames = new Set();
    const originalNames = {}; // Store original:normalized mapping

    try {
        const data = fs.readFileSync(logFilePath, 'utf8');
        const lines = data.split('\n');

        lines.forEach(line => {
            // Corrected Regex to extract framework names from log entries
            const match = line.match(/Framework Reference:\s*"([^"]+)"/);
            if (match) {
                let originalName = match[1].trim();
                const normalizedName = originalName.toLowerCase().replace(/[-_\s]+/g, '_');

                if (normalizedNames.has(normalizedName)) {
                    nameIssues.identified = true;
                    const otherOriginalName = originalNames[normalizedName];

                    // Check for case inconsistencies
                    if (originalName !== otherOriginalName && originalName.toLowerCase() === otherOriginalName.toLowerCase()) {
                        if (!nameIssues.caseInconsistencies.some(pair =>
                            (pair[0] === originalName && pair[1] === otherOriginalName) ||
                            (pair[0] === otherOriginalName && pair[1] === originalName)
                        )) {
                            nameIssues.caseInconsistencies.push([originalName, otherOriginalName]);
                        }
                    }

                    // Check for format inconsistencies
                    if (originalName.replace(/[-_\s]+/g, '') === otherOriginalName.replace(/[-_\s]+/g, '') && originalName !== otherOriginalName) {
                        if (!nameIssues.formatInconsistencies.some(pair =>
                            (pair[0] === originalName && pair[1] === otherOriginalName) ||
                            (pair[0] === otherOriginalName && pair[1] === originalName)
                        )) {
                            nameIssues.formatInconsistencies.push([originalName, otherOriginalName]);
                        }
                    }
                } else {
                    normalizedNames.add(normalizedName);
                    originalNames[normalizedName] = originalName;
                }
            }
        });

        // Check for similar names (potential typos)
        const originalNamesList = Object.values(originalNames);
        for (let i = 0; i < originalNamesList.length; i++) {
            for (let j = i + 1; j < originalNamesList.length; j++) {
                const name1 = originalNamesList[i];
                const name2 = originalNamesList[j];
                
                // Skip exact matches or format variants
                if (name1.toLowerCase() === name2.toLowerCase() || 
                    name1.replace(/[-_\s]+/g, '').toLowerCase() === name2.replace(/[-_\s]+/g, '').toLowerCase()) {
                    continue;
                }
                
                const distance = levenshteinDistance(name1.toLowerCase(), name2.toLowerCase());
                // Adjust threshold to be more sensitive to small differences
                const similarityThreshold = Math.min(name1.length, name2.length) * 0.2;
                
                if (distance <= similarityThreshold && distance <= 2) {
                    nameIssues.similarNames.push([name1, name2]);
                }
            }
        }

        nameIssues.identified = nameIssues.caseInconsistencies.length > 0 || 
                               nameIssues.formatInconsistencies.length > 0 || 
                               nameIssues.similarNames.length > 0;
    } catch (err) {
        console.error("Error reading framework log file:", err);
        return nameIssues; // Return empty result on error
    }

    return nameIssues;
}

// Configuration
// Default report directory
const DEFAULT_REPORT_DIRECTORY = path.join(__dirname, '..', 'reports');
let overrideReportDirectory = "";

// Ensure report directory exists
if (!fs.existsSync(getReportDirectory())) {
    fs.mkdirSync(getReportDirectory(), { recursive: true });
}

// Add report directory override functions
function setReportDirectory(newDir) {
    overrideReportDirectory = newDir;
    // Ensure the directory exists
    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
    }
}

function getReportDirectory() {
    return overrideReportDirectory || DEFAULT_REPORT_DIRECTORY;
}

// Dynamic file path getters
function getFrameworkReportFile() {
    return frameworkLogger.getFilePath(getReportDirectory(), 'framework_report.json');
}

// Use frameworkLogger's file path getters where available
function getFrameworkLogFile() {
    return frameworkLogger.getFrameworkLogFile();
}

function getFrameworkFailuresFile() {
    return frameworkLogger.getFrameworkFailuresFile();
}

function getFrameworkStatsFile() {
    return frameworkLogger.getFrameworkStatsFile();
}

/**
 * Generate a comprehensive report on framework references and failures
 * @param {boolean} saveToFile - Whether to save the report to a file
 * @returns {Object} The generated report
 */
function generateFrameworkReport(saveToFile = true) {
    try {
        // Read the framework logs
        const logContent = fs.existsSync(getFrameworkLogFile()) 
            ? fs.readFileSync(getFrameworkLogFile(), 'utf8') 
            : '';
        
        const failuresContent = fs.existsSync(getFrameworkFailuresFile())
            ? fs.readFileSync(getFrameworkFailuresFile(), 'utf8')
            : '';
        
        const statsContent = fs.existsSync(getFrameworkStatsFile())
            ? fs.readFileSync(getFrameworkStatsFile(), 'utf8')
            : '{}';
        
        // Get basic failure report from the logger
        const baseReport = frameworkLogger.generateFailureReport();
        
        // Extract framework names from log content
        const frameworkNameRegex = /Framework Reference:\s*"([^"]+)"/g;
        const matches = [...logContent.matchAll(frameworkNameRegex)];
        const frameworkNames = matches.map(match => match[1]);
        
        console.log(`Extracted ${frameworkNames.length} framework names from log file`);
        if (frameworkNames.length > 0) {
            console.log(`Sample framework names: ${frameworkNames.slice(0, 3).join(', ')}`);
        } else {
            console.log('No framework names found in log file. Check regex pattern and log format.');
        }
        
        // Analyze name issues
        const nameIssues = identifyNameIssues(frameworkNames);
        
        // Create the failures analysis
        const failuresAnalysis = analyzeFrameworkFailures(failuresContent);
        
        // Create the enhanced report with detailed analysis
        const enhancedReport = {
            ...baseReport,
            detailedAnalysis: {
                ...failuresAnalysis,
                nameIssues: nameIssues
            },
            patternAnalysis: analyzeFailurePatterns(),
            frameworkStructureAnalysis: analyzeFrameworkStructures()
        };
        
        // Add recommendations based on the analysis
        enhancedReport.recommendations = enhancedReport.recommendations || [];
        
        // Add name-related recommendations
        if (nameIssues.identified) {
            // Create a list of all variant pairs
            const variantPairs = [];
            
            // Add case inconsistencies
            nameIssues.caseInconsistencies.forEach(issue => {
                for (let i = 0; i < issue.variants.length; i++) {
                    for (let j = i + 1; j < issue.variants.length; j++) {
                        variantPairs.push(`"${issue.variants[i]}" and "${issue.variants[j]}"`);
                    }
                }
            });
            
            // Add format inconsistencies
            nameIssues.formatInconsistencies.forEach(issue => {
                issue.matches.forEach(match => {
                    variantPairs.push(`"${issue.original}" and "${match}"`);
                });
            });
            
            // Add similar names
            nameIssues.similarNames.forEach(issue => {
                variantPairs.push(`"${issue.name1}" and "${issue.name2}"`);
            });
            
            if (variantPairs.length > 0) {
                enhancedReport.recommendations.push(
                    `Potential naming inconsistencies detected: ${variantPairs.join(', ')}. Consider standardizing these names.`
                );
            }
        }
        
        if (saveToFile) {
            try {
                fs.writeFileSync(
                    getFrameworkReportFile(), 
                    JSON.stringify(enhancedReport, null, 2)
                );
                console.log(`Framework report saved to ${getFrameworkReportFile()}`);
            } catch (error) {
                console.error(`Error saving framework report: ${error.message}`);
            }
        }
        
        return enhancedReport;
    } catch (error) {
        console.error(`Error generating framework report: ${error.message}`);
        return { error: error.message };
    }
}

/**
 * Analyze framework failures to identify patterns and issues
 * @param {string} content - The failures log content
 * @returns {Object} Analysis results
 */
function analyzeFrameworkFailures(content) {
    try {
        if (!content || typeof content !== 'string' || content.trim() === '') {
            return { failures: [], analyzed: false };
        }
        
        const failures = parseFailuresLog(content);
        
        let analysis = {
            totalFailures: 0,
            frameworkNameIssues: [],
            structuralIssues: [],
            contextualIssues: []
        };
        
        analysis.totalFailures = failures.length;
        
        // Analyze framework name issues
        const frameworkNames = failures.map(f => f.framework);
        analysis.frameworkNameIssues = identifyNameIssues(frameworkNames);
        
        // Analyze structural issues
        analysis.structuralIssues = identifyStructuralIssues(failures);
        
        // Analyze contextual issues
        analysis.contextualIssues = identifyContextualIssues(failures);
        
        return { failures, analyzed: true, patterns: analyzeFailurePatterns() };
    } catch (error) {
        console.error(`Error analyzing framework failures: ${error.message}`);
        return { failures: [], analyzed: false, error: error.message };
    }
}

/**
 * Parse the failures log file into structured failure objects
 * @param {string} logContent - The content of the failures log file
 * @returns {Array} Array of structured failure objects
 */
function parseFailuresLog(logContent) {
    const failures = [];
    const failureBlocks = logContent.split('--------------------------------------------------');
    
    for (const block of failureBlocks) {
        if (!block.trim()) continue;
        
        try {
            const lines = block.trim().split('\n');
            const failure = {};
            
            // Extract basic info
            for (const line of lines) {
                if (line.startsWith('Framework:')) {
                    failure.framework = line.substring(line.indexOf(':') + 1).trim().replace(/"/g, '');
                } else if (line.startsWith('Location:')) {
                    failure.location = line.substring(line.indexOf(':') + 1).trim();
                } else if (line.startsWith('Reason:')) {
                    failure.reason = line.substring(line.indexOf(':') + 1).trim();
                }
            }
            
            // Extract framework object structure
            const structureStart = block.indexOf('Framework Object Structure:');
            const contextStart = block.indexOf('Context:');
            
            if (structureStart !== -1 && contextStart !== -1) {
                failure.structure = block.substring(
                    structureStart + 'Framework Object Structure:'.length,
                    contextStart
                ).trim();
            }
            
            // Extract context
            if (contextStart !== -1) {
                failure.context = block.substring(
                    contextStart + 'Context:'.length
                ).trim();
            }
            
            failures.push(failure);
        } catch (error) {
            console.error(`Error parsing failure block: ${error.message}`);
        }
    }
    
    return failures;
}

/**
 * Identifies name-related issues in framework references.
 * 
 * @param {Array} frameworkNames - The framework names
 * @returns {object} - The name issues
 */
function identifyNameIssues(frameworkNames) {
    console.log(`identifyNameIssues called with ${frameworkNames ? frameworkNames.length : 0} framework names`);
    
    // Add proper null checking
    if (!frameworkNames || !Array.isArray(frameworkNames) || frameworkNames.length === 0) {
        console.log('No valid framework names provided to identifyNameIssues');
        return { 
            caseInconsistencies: [], 
            formatInconsistencies: [], 
            similarNames: [],
            identified: false 
        };
    }

    try {
        const caseInconsistencies = [];
        const formatInconsistencies = [];
        const similarNames = [];
        
        // Filter and normalize names
        const validNames = frameworkNames
            .filter(name => name && typeof name === 'string')
            .map(name => name.trim()); // Trim whitespace
        
        console.log(`Processing ${validNames.length} valid framework names`);
        if (validNames.length > 0) {
            console.log(`Sample names: ${validNames.slice(0, 3).join(', ')}`);
        }
        
        // First, create a map to detect pure case inconsistencies (same text, different case)
        const nameCounts = {};
        
        validNames.forEach(name => {
            const lowercaseName = name.toLowerCase();
            if (!nameCounts[lowercaseName]) {
                nameCounts[lowercaseName] = [];
            }
            
            // Only add the name if it's not already in the array (avoid duplicates)
            if (!nameCounts[lowercaseName].includes(name)) {
                nameCounts[lowercaseName].push(name);
            }
        });
        
        // Check for pure case inconsistencies (same text, different case)
        Object.keys(nameCounts).forEach(key => {
            if (nameCounts[key].length > 1) {
                caseInconsistencies.push({
                    base: key,
                    variants: nameCounts[key]
                });
            }
        });
        
        console.log(`Found ${caseInconsistencies.length} case inconsistencies`);
        
        // Create a map for canonical names (with standardized separators)
        const formatMap = {};
        validNames.forEach(name => {
            if (!name) return;
            
            // Create normalized and canonical forms
            const normalized = name.toLowerCase().trim();
            
            // Create a canonical form with no special chars for grouping
            const canonicalNoSeparators = normalized.replace(/[-_\s]/g, '');
            
            if (!formatMap[canonicalNoSeparators]) {
                formatMap[canonicalNoSeparators] = [];
            }
            
            // Only add if not already in the array
            if (!formatMap[canonicalNoSeparators].some(entry => entry.original === name)) {
                formatMap[canonicalNoSeparators].push({
                    original: name,
                    normalized: normalized
                });
            }
        });
        
        // Check for format inconsistencies (different names with the same canonical form)
        Object.keys(formatMap).forEach(canonicalNoSeparators => {
            const entries = formatMap[canonicalNoSeparators];
            
            if (entries.length > 1) {
                // For entries with the same canonical form (ignoring separators),
                // check for case inconsistencies by comparing the normalized strings
                for (let i = 0; i < entries.length; i++) {
                    for (let j = i + 1; j < entries.length; j++) {
                        const entry1 = entries[i];
                        const entry2 = entries[j];
                        
                        // Create format-normalized versions (replace all separators with spaces)
                        const formatNormalized1 = entry1.original.replace(/[-_\s]+/g, ' ');
                        const formatNormalized2 = entry2.original.replace(/[-_\s]+/g, ' ');
                        
                        // If they have the same text when normalized for format
                        if (formatNormalized1.toLowerCase() === formatNormalized2.toLowerCase()) {
                            // Check if they differ in case
                            if (formatNormalized1 !== formatNormalized2) {
                                // Add to case inconsistencies if not already added
                                const lowerCase = formatNormalized1.toLowerCase();
                                
                                // Check if we already have this case inconsistency
                                let existingCI = caseInconsistencies.find(ci => ci.base === lowerCase);
                                
                                if (!existingCI) {
                                    existingCI = {
                                        base: lowerCase,
                                        variants: []
                                    };
                                    caseInconsistencies.push(existingCI);
                                }
                                
                                // Add the variants if not already there
                                if (!existingCI.variants.includes(entry1.original)) {
                                    existingCI.variants.push(entry1.original);
                                }
                                if (!existingCI.variants.includes(entry2.original)) {
                                    existingCI.variants.push(entry2.original);
                                }
                            }
                        }
                    }
                }
                
                // Group entries by their lowercase version for format inconsistencies
                const lowerGroups = {};
                entries.forEach(entry => {
                    const lower = entry.normalized;
                    if (!lowerGroups[lower]) {
                        lowerGroups[lower] = [];
                    }
                    lowerGroups[lower].push(entry.original);
                });
                
                // Check if the entries have different formats (ignoring case)
                const uniqueFormats = new Set();
                entries.forEach(entry => {
                    // Create a format signature that preserves separators but ignores case
                    const formatSignature = entry.original.replace(/[a-zA-Z0-9]/g, 'X');
                    uniqueFormats.add(formatSignature);
                });
                
                // If we have multiple format variants
                if (uniqueFormats.size > 1) {
                    
                    // For each unique lowercase name
                    Object.keys(lowerGroups).forEach(lower => {
                        const variants = lowerGroups[lower];
                        
                        // If we have multiple variants of the same lowercase name
                        if (variants.length > 1) {
                            formatInconsistencies.push({
                                original: variants[0],
                                matches: variants.slice(1)
                            });
                        } else {
                            // Otherwise, compare with other lowercase groups
                            const otherVariants = Object.keys(lowerGroups)
                                .filter(key => key !== lower)
                                .flatMap(key => lowerGroups[key]);
                            
                            if (otherVariants.length > 0) {
                                formatInconsistencies.push({
                                    original: variants[0],
                                    matches: otherVariants
                                });
                            }
                        }
                    });
                }
            }
        });
        
        console.log(`Found ${formatInconsistencies.length} format inconsistencies`);
        
        // Find similar names using Levenshtein distance
        for (let i = 0; i < validNames.length; i++) {
            for (let j = i + 1; j < validNames.length; j++) {
                const name1 = validNames[i].toLowerCase().trim();
                const name2 = validNames[j].toLowerCase().trim();
                
                // Skip exact matches or format variants
                if (name1 === name2 || 
                    name1.replace(/[-_\s]/g, '') === name2.replace(/[-_\s]/g, '')) {
                    continue;
                }
                
                const distance = levenshteinDistance(name1, name2);
                // Adjust threshold to be more sensitive to small differences
                const similarityThreshold = Math.min(name1.length, name2.length) * 0.2;
                
                if (distance <= similarityThreshold && distance <= 2) {
                    similarNames.push({
                        name1: validNames[i],
                        name2: validNames[j],
                        distance: distance
                    });
                }
            }
        }
        
        console.log(`Found ${similarNames.length} similar names`);
        
        const result = {
            caseInconsistencies,
            formatInconsistencies,
            similarNames,
            identified: caseInconsistencies.length > 0 || 
                       formatInconsistencies.length > 0 || 
                       similarNames.length > 0
        };
        
        console.log(`Name issues identified: ${result.identified}`);
        return result;
    } catch (error) {
        console.error(`Error identifying name issues: ${error.message}`);
        console.error(error.stack);
        return { 
            caseInconsistencies: [], 
            formatInconsistencies: [], 
            similarNames: [],
            identified: false,
            error: error.message
        };
    }
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
    // Add proper null checking
    if (!str1 || !str2 || typeof str1 !== 'string' || typeof str2 !== 'string') {
        return Number.MAX_SAFE_INTEGER;
    }
    
    const m = str1.length;
    const n = str2.length;
    
    // Create a matrix of size (m+1) x (n+1)
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialize the first row and column
    for (let i = 0; i <= m; i++) {
        d[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
        d[0][j] = j;
    }
    
    // Fill the rest of the matrix
    for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= m; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // deletion
                d[i][j - 1] + 1,      // insertion
                d[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    return d[m][n];
}

/**
 * Identify structural issues in framework objects
 * @param {Array} failures - Array of failure objects
 * @returns {Array} Array of identified structural issues
 */
function identifyStructuralIssues(failures) {
    const issues = [];
    
    for (const failure of failures) {
        // Skip if no structure information
        if (!failure.structure) continue;
        
        // Check for common structural issues
        if (failure.structure.includes('undefined') || failure.structure.includes('null')) {
            issues.push({
                type: 'null_or_undefined',
                framework: failure.framework,
                location: failure.location,
                recommendation: 'Check for null or undefined values in framework object'
            });
        }
        
        if (failure.structure.includes('{}') || failure.structure.includes('[]')) {
            issues.push({
                type: 'empty_object_or_array',
                framework: failure.framework,
                location: failure.location,
                recommendation: 'Check for empty objects or arrays in framework structure'
            });
        }
        
        // Check for missing expected properties
        const expectedProperties = ['id', 'name', 'type', 'framework'];
        const missingProperties = [];
        
        for (const prop of expectedProperties) {
            if (!failure.structure.includes(prop + ':')) {
                missingProperties.push(prop);
            }
        }
        
        if (missingProperties.length > 0) {
            issues.push({
                type: 'missing_properties',
                framework: failure.framework,
                location: failure.location,
                missingProperties: missingProperties,
                recommendation: `Check for missing properties: ${missingProperties.join(', ')}`
            });
        }
    }
    
    return issues;
}

/**
 * Identify contextual issues in framework failures
 * @param {Array} failures - Array of failure objects
 * @returns {Array} Array of identified contextual issues
 */
function identifyContextualIssues(failures) {
    const issues = [];
    
    // Group failures by location
    const locationGroups = {};
    for (const failure of failures) {
        if (!locationGroups[failure.location]) {
            locationGroups[failure.location] = [];
        }
        locationGroups[failure.location].push(failure);
    }
    
    // Analyze each location group
    for (const location in locationGroups) {
        const locationFailures = locationGroups[location];
        
        // Check if all failures at this location have the same reason
        const reasons = new Set(locationFailures.map(f => f.reason));
        if (reasons.size === 1) {
            issues.push({
                type: 'consistent_failure_reason',
                location: location,
                reason: [...reasons][0],
                count: locationFailures.length,
                recommendation: `Fix the consistent failure reason "${[...reasons][0]}" at ${location}`
            });
        }
        
        // Check if failures at this location involve similar frameworks
        const frameworks = locationFailures.map(f => f.framework);
        const nameIssues = identifyNameIssues(frameworks);
        
        if (nameIssues.length > 0) {
            issues.push({
                type: 'location_specific_naming_issues',
                location: location,
                nameIssues: nameIssues,
                recommendation: `Address framework naming inconsistencies at ${location}`
            });
        }
    }
    
    return issues;
}

/**
 * Analyze patterns in framework failures
 * @returns {Object} Pattern analysis results
 */
function analyzeFailurePatterns() {
    const patterns = {
        timeBasedPatterns: [],
        sequencePatterns: []
    };
    
    try {
        // Read the failures log file
        if (!fs.existsSync(getFrameworkFailuresFile())) {
            return patterns;
        }
        
        const failuresLog = fs.readFileSync(getFrameworkFailuresFile(), 'utf8');
        const lines = failuresLog.split('\n');
        
        // Extract timestamps and create a timeline
        const timeline = [];
        for (const line of lines) {
            if (line.startsWith('[20') && line.includes('] [')) {
                const timestamp = line.substring(1, line.indexOf(']'));
                const level = line.substring(line.indexOf('] [') + 3, line.indexOf(']', line.indexOf('] [')));
                
                let framework = '';
                if (line.includes('Framework:')) {
                    framework = line.substring(
                        line.indexOf('Framework:') + 'Framework:'.length,
                        line.indexOf('\n', line.indexOf('Framework:'))
                    ).trim().replace(/"/g, '');
                } else if (line.includes('Framework Lookup:')) {
                    framework = line.substring(
                        line.indexOf('Framework Lookup:') + 'Framework Lookup:'.length,
                        line.indexOf('" at')
                    ).trim().replace(/"/g, '');
                }
                
                timeline.push({
                    timestamp: new Date(timestamp),
                    level,
                    framework,
                    line
                });
            }
        }
        
        // Sort timeline by timestamp
        timeline.sort((a, b) => a.timestamp - b.timestamp);
        
        // Look for time-based patterns (e.g., failures at specific times)
        const hourCounts = {};
        for (const entry of timeline) {
            const hour = entry.timestamp.getHours();
            if (!hourCounts[hour]) {
                hourCounts[hour] = 0;
            }
            if (entry.level === 'WARNING' || entry.level === 'ERROR') {
                hourCounts[hour]++;
            }
        }
        
        // Find hours with high failure rates
        const hourEntries = Object.entries(hourCounts);
        if (hourEntries.length > 0) {
            const maxCount = Math.max(...hourEntries.map(([_, count]) => count));
            const highFailureHours = hourEntries
                .filter(([_, count]) => count > maxCount * 0.7)
                .map(([hour, count]) => ({ hour: parseInt(hour), count }));
            
            if (highFailureHours.length > 0) {
                patterns.timeBasedPatterns.push({
                    type: 'high_failure_hours',
                    hours: highFailureHours,
                    recommendation: 'Investigate system behavior during these hours'
                });
            }
        }
        
        // Look for sequence patterns (e.g., failures that occur in sequence)
        if (timeline.length > 0) {
            const sequences = [];
            let currentSequence = [timeline[0]];
            
            for (let i = 1; i < timeline.length; i++) {
                const prevEntry = timeline[i - 1];
                const currEntry = timeline[i];
                
                // Check if entries are close in time (within 5 seconds)
                const timeDiff = (currEntry.timestamp - prevEntry.timestamp) / 1000;
                
                if (timeDiff <= 5 && 
                    (prevEntry.level === 'WARNING' || prevEntry.level === 'ERROR') && 
                    (currEntry.level === 'WARNING' || currEntry.level === 'ERROR')) {
                    currentSequence.push(currEntry);
                } else {
                    if (currentSequence.length >= 3) {
                        sequences.push([...currentSequence]);
                    }
                    currentSequence = [currEntry];
                }
            }
            
            // Add the last sequence if it's long enough
            if (currentSequence.length >= 3) {
                sequences.push(currentSequence);
            }
            
            // Analyze the sequences
            for (const sequence of sequences) {
                const frameworks = sequence.map(entry => entry.framework).filter(Boolean);
                const uniqueFrameworks = [...new Set(frameworks)];
                
                patterns.sequencePatterns.push({
                    type: 'failure_sequence',
                    length: sequence.length,
                    startTime: sequence[0].timestamp,
                    endTime: sequence[sequence.length - 1].timestamp,
                    frameworks: uniqueFrameworks,
                    recommendation: 'Investigate this sequence of failures that occurred in rapid succession'
                });
            }
        }
        
    } catch (error) {
        console.error(`Error analyzing failure patterns: ${error.message}`);
    }
    
    return patterns;
}

/**
 * Analyze framework structures to identify common patterns
 * @returns {Object} Framework structure analysis results
 */
function analyzeFrameworkStructures() {
    const analysis = {
        commonStructures: [],
        structuralInconsistencies: []
    };
    
    try {
        // Read the failures log file
        if (!fs.existsSync(getFrameworkFailuresFile())) {
            return analysis;
        }
        
        const failuresLog = fs.readFileSync(getFrameworkFailuresFile(), 'utf8');
        const failures = parseFailuresLog(failuresLog);
        
        // Extract framework structures
        const frameworkStructures = {};
        for (const failure of failures) {
            if (!failure.structure || !failure.framework) continue;
            
            if (!frameworkStructures[failure.framework]) {
                frameworkStructures[failure.framework] = [];
            }
            
            frameworkStructures[failure.framework].push(failure.structure);
        }
        
        // Analyze structures for each framework
        for (const framework in frameworkStructures) {
            const structures = frameworkStructures[framework];
            
            // Skip if only one structure
            if (structures.length <= 1) continue;
            
            // Check for structural inconsistencies
            const structuralKeys = structures.map(extractStructuralKeys);
            
            // Find keys that appear in some but not all structures
            const allKeys = new Set();
            for (const keys of structuralKeys) {
                for (const key of keys) {
                    allKeys.add(key);
                }
            }
            
            const inconsistentKeys = [];
            for (const key of allKeys) {
                const keyCount = structuralKeys.filter(keys => keys.includes(key)).length;
                if (keyCount > 0 && keyCount < structures.length) {
                    inconsistentKeys.push({
                        key,
                        presentCount: keyCount,
                        totalCount: structures.length,
                        presentPercentage: (keyCount / structures.length * 100).toFixed(1) + '%'
                    });
                }
            }
            
            if (inconsistentKeys.length > 0) {
                analysis.structuralInconsistencies.push({
                    framework,
                    inconsistentKeys,
                    recommendation: `Standardize structure for framework "${framework}"`
                });
            }
        }
        
    } catch (error) {
        console.error(`Error analyzing framework structures: ${error.message}`);
    }
    
    return analysis;
}

/**
 * Extract structural keys from a framework structure string
 * @param {string} structureStr - The framework structure string
 * @returns {Array} Array of keys found in the structure
 */
function extractStructuralKeys(structureStr) {
    const keys = [];
    const keyRegex = /'([^']+)':|"([^"]+)":/g;
    
    let match;
    while ((match = keyRegex.exec(structureStr)) !== null) {
        const key = match[1] || match[2];
        keys.push(key);
    }
    
    return keys;
}

/**
 * Generate a human-readable report from the diagnostic data
 * @returns {string} Human-readable report
 */
function generateHumanReadableReport() {
    try {
        const report = generateFrameworkReport(false);
        let humanReport = '';
        
        // Header
        humanReport += '=======================================================\n';
        humanReport += '           FRAMEWORK REFERENCE DIAGNOSTIC REPORT        \n';
        humanReport += '=======================================================\n\n';
        
        // Summary section with null checking
        humanReport += 'SUMMARY\n';
        humanReport += '-------\n';
        humanReport += `Generated: ${report.timestamp || new Date().toISOString()}\n`;
        humanReport += `Total Framework References: ${report.totalReferences || 0}\n`;
        humanReport += `Total Framework Lookups: ${report.totalLookups || 0}\n`;
        humanReport += `Successful Lookups: ${report.successfulLookups || 0}\n`;
        humanReport += `Failed Lookups: ${report.failedLookups || 0}\n`;
        humanReport += `Success Rate: ${report.successRate || 'N/A'}\n\n`;
        
        // Most Referenced Frameworks section with null checking
        humanReport += 'MOST REFERENCED FRAMEWORKS\n';
        humanReport += '-------------------------\n';
        if (report.mostReferencedFrameworks && report.mostReferencedFrameworks.length > 0) {
            report.mostReferencedFrameworks.forEach(([framework, count], index) => {
                humanReport += `${index + 1}. "${framework}" - ${count} references\n`;
            });
        } else {
            humanReport += 'No framework references recorded\n';
        }
        humanReport += '\n';
        
        // Common Failure Reasons section with null checking
        humanReport += 'COMMON FAILURE REASONS\n';
        humanReport += '---------------------\n';
        if (report.commonFailureReasons && report.commonFailureReasons.length > 0) {
            report.commonFailureReasons.forEach(([reason, count], index) => {
                humanReport += `${index + 1}. "${reason}" - ${count} occurrences\n`;
            });
        } else {
            humanReport += 'No failure reasons recorded\n';
        }
        humanReport += '\n';
        
        // Failure Hotspots section with null checking
        humanReport += 'FAILURE HOTSPOTS\n';
        humanReport += '----------------\n';
        if (report.failureHotspots && report.failureHotspots.length > 0) {
            report.failureHotspots.forEach(([location, count], index) => {
                humanReport += `${index + 1}. ${location} - ${count} failures\n`;
            });
        } else {
            humanReport += 'No failure hotspots recorded\n';
        }
        humanReport += '\n';
        
        // Name Issues section
        humanReport += 'FRAMEWORK NAME ISSUES\n';
        humanReport += '--------------------\n';
        
        // Make sure detailedAnalysis and nameIssues exist
        const detailedAnalysis = report.detailedAnalysis || {};
        const nameIssues = detailedAnalysis.nameIssues || { 
            caseInconsistencies: [], 
            formatInconsistencies: [], 
            similarNames: [] 
        };
        
        // Case inconsistencies with null checking
        const caseInconsistencies = nameIssues.caseInconsistencies || [];
        if (caseInconsistencies.length > 0) {
            humanReport += 'Case Inconsistencies:\n';
            caseInconsistencies.forEach(issue => {
                const variants = issue.variants || [];
                humanReport += `- Base name: ${issue.base || 'unknown'}\n`;
                humanReport += `  Variants: ${variants.join(', ')}\n`;
            });
        } else {
            humanReport += 'No case inconsistencies detected.\n';
        }
        
        // Format inconsistencies with null checking
        const formatInconsistencies = nameIssues.formatInconsistencies || [];
        if (formatInconsistencies.length > 0) {
            humanReport += '\nFormat Inconsistencies:\n';
            formatInconsistencies.forEach(issue => {
                const matches = issue.matches || [];
                humanReport += `- Original: ${issue.original || 'unknown'}\n`;
                humanReport += `  Variants: ${matches.join(', ')}\n`;
            });
        } else {
            humanReport += '\nNo format inconsistencies detected.\n';
        }
        
        // Similar names with null checking
        const similarNames = nameIssues.similarNames || [];
        if (similarNames.length > 0) {
            humanReport += '\nSimilar Names (potential typos):\n';
            similarNames.forEach(issue => {
                humanReport += `- "${issue.name1 || 'unknown'}" and "${issue.name2 || 'unknown'}" (distance: ${issue.distance || 'unknown'})\n`;
            });
        } else {
            humanReport += '\nNo similar names detected.\n';
        }
        humanReport += '\n';
        
        // Structural Issues section with null checking
        humanReport += 'STRUCTURAL ISSUES\n';
        humanReport += '-----------------\n';
        const structuralIssues = detailedAnalysis.structuralIssues || [];
        if (structuralIssues.length > 0) {
            structuralIssues.forEach((issue, index) => {
                humanReport += `${index + 1}. ${issue.type || 'Unknown issue'} in "${issue.framework || 'unknown'}" at ${issue.location || 'unknown location'}\n`;
                if (issue.missingProperties && Array.isArray(issue.missingProperties)) {
                    humanReport += `   Missing properties: ${issue.missingProperties.join(', ')}\n`;
                }
                humanReport += `   Recommendation: ${issue.recommendation || 'No recommendation available'}\n`;
            });
        } else {
            humanReport += 'No structural issues detected\n';
        }
        humanReport += '\n';
        
        // Recommendations section with null checking
        humanReport += 'RECOMMENDATIONS\n';
        humanReport += '---------------\n';
        if (report.recommendations && report.recommendations.length > 0) {
            report.recommendations.forEach((recommendation, index) => {
                humanReport += `${index + 1}. ${recommendation}\n`;
            });
        } else {
            humanReport += 'No recommendations available\n';
        }
        humanReport += '\n';
        
        // Footer
        humanReport += '=======================================================\n';
        humanReport += 'End of Report\n';
        
        return humanReport;
    } catch (error) {
        console.error(`Error generating human-readable report: ${error.message}`);
        return `Error generating report: ${error.message}`;
    }
}

/**
 * Save a human-readable report to a file
 * @param {string} filePath - The file path to save the report to
 * @returns {boolean} Whether the report was successfully saved
 */
function saveHumanReadableReport(filePath = path.join(getReportDirectory(), 'framework_report.txt')) {
    try {
        const report = generateHumanReadableReport();
        fs.writeFileSync(filePath, report);
        console.log(`Human-readable report saved to ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error saving human-readable report: ${error.message}`);
        return false;
    }
}

module.exports = {
    generateFrameworkReport,
    analyzeFrameworkFailures,
    identifyNameIssues,
    identifyStructuralIssues,
    analyzeFrameworkStructures,
    generateHumanReadableReport,
    saveHumanReadableReport,
    setReportDirectory,
    getReportDirectory,
    getFrameworkReportFile,
    detectFrameworkNameIssues
};
