/**
 * Framework Logger Module
 * 
 * This module provides specialized logging functionality for tracking framework references,
 * lookups, and failures in the REA system. It helps diagnose issues with framework identity
 * handling and provides data for system repair.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Configuration
// Default log directory
const DEFAULT_LOG_DIRECTORY = path.join(__dirname, '..', 'logs');
let overrideLogDirectory = "";

// Use overrideLogDirectory if set; otherwise fallback to DEFAULT_LOG_DIRECTORY
function getLogDirectory() {
    return overrideLogDirectory || DEFAULT_LOG_DIRECTORY;
}

function setLogDirectory(newDir) {
    overrideLogDirectory = newDir;
    // Ensure the directory exists
    if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
    }
}

// Shared utility for dynamic file path resolution with fallback validation
function getFilePath(baseDir, fileName) {
    if (!baseDir || typeof baseDir !== 'string') {
        const tmp = require('os').tmpdir();
        console.warn("Invalid base directory. Falling back to temporary directory:", tmp);
        baseDir = tmp;
    }
    return path.join(baseDir, fileName);
}

// Dynamic file path getters
function getFrameworkLogFile() {
    return getFilePath(getLogDirectory(), 'framework_references.log');
}

function getFrameworkFailuresFile() {
    return getFilePath(getLogDirectory(), 'framework_failures.log');
}

function getFrameworkStatsFile() {
    return getFilePath(getLogDirectory(), 'framework_stats.json');
}

// Ensure log directory exists
if (!fs.existsSync(getLogDirectory())) {
    fs.mkdirSync(getLogDirectory(), { recursive: true });
}

// Initialize stats object
let frameworkStats = {
    totalReferences: 0,
    totalLookups: 0,
    successfulLookups: 0,
    failedLookups: 0,
    frameworkCounts: {},
    failureReasons: {},
    failureLocations: {},
    lastUpdated: new Date().toISOString()
};

// Load existing stats if available
try {
    if (fs.existsSync(getFrameworkStatsFile())) {
        const statsData = fs.readFileSync(getFrameworkStatsFile(), 'utf8');
        frameworkStats = JSON.parse(statsData);
    }
} catch (error) {
    console.error(`Error loading framework stats: ${error.message}`);
}

/**
 * Log levels
 */
const LogLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

/**
 * Write a log entry to the specified log file
 * @param {string} message - The log message
 * @param {string} level - The log level
 * @param {string} logFile - The log file to write to
 */
function writeLog(message, level = LogLevel.INFO, logFile) {
    if (!logFile) {
        logFile = getFrameworkLogFile();
    }
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    fs.appendFileSync(logFile, logEntry);
}

/**
 * Log a framework reference
 * @param {string} frameworkName - The name of the framework being referenced
 * @param {string} location - The location in the code where the reference occurs
 * @param {Object} context - Additional context information
 */
function logFrameworkReference(frameworkName, location, context = {}) {
    // Update stats
    frameworkStats.totalReferences++;
    frameworkStats.frameworkCounts[frameworkName] = (frameworkStats.frameworkCounts[frameworkName] || 0) + 1;
    
    // Create log message
    const contextStr = util.inspect(context, { depth: 2, compact: true });
    const message = `Framework Reference: "${frameworkName}" at ${location} | Context: ${contextStr}`;
    
    writeLog(message, LogLevel.INFO);
    updateStats();
}

/**
 * Log a framework lookup attempt
 * @param {string} frameworkName - The name of the framework being looked up
 * @param {string} location - The location in the code where the lookup occurs
 * @param {boolean} success - Whether the lookup was successful
 * @param {Object} context - Additional context information
 */
function logFrameworkLookup(frameworkName, location, success, context = {}) {
    // Update stats
    frameworkStats.totalLookups++;
    if (success) {
        frameworkStats.successfulLookups++;
    } else {
        frameworkStats.failedLookups++;
        frameworkStats.failureLocations[location] = (frameworkStats.failureLocations[location] || 0) + 1;
    }
    
    // Create log message
    const status = success ? "SUCCESS" : "FAILURE";
    const contextStr = util.inspect(context, { depth: 2, compact: true });
    const message = `Framework Lookup: "${frameworkName}" at ${location} | Status: ${status} | Context: ${contextStr}`;
    
    const logLevel = success ? LogLevel.INFO : LogLevel.WARNING;
    writeLog(message, logLevel);
    
    // If it's a failure, also log to the failures file
    if (!success) {
        writeLog(message, LogLevel.WARNING, getFrameworkFailuresFile());
    }
    
    updateStats();
}

/**
 * Log a framework lookup failure with detailed information
 * @param {string} frameworkName - The name of the framework that failed to be found
 * @param {string} location - The location in the code where the failure occurred
 * @param {string} reason - The reason for the failure
 * @param {Object} frameworkObject - The framework object that was being searched
 * @param {Object} context - Additional context information
 */
function logFrameworkFailure(frameworkName, location, reason, frameworkObject, context = {}) {
    try {
        if (!frameworkName) {
            console.error("Cannot log failure: frameworkName is required");
            return;
        }

        // Update stats
        frameworkStats.failedLookups++;
        frameworkStats.failureReasons[reason] = (frameworkStats.failureReasons[reason] || 0) + 1;
        frameworkStats.failureLocations[location] = (frameworkStats.failureLocations[location] || 0) + 1;
        
        // Create detailed log message
        let message = `FRAMEWORK LOOKUP FAILURE\n`;
        message += `Framework: "${frameworkName}"\n`;
        message += `Location: ${location}\n`;
        message += `Reason: ${reason}\n`;
        
        // Add framework object details
        message += `Framework Object Structure:\n`;
        message += util.inspect(frameworkObject, { depth: 4, compact: false }) + '\n';
        
        // Add context details
        message += `Context:\n`;
        message += util.inspect(context, { depth: 3, compact: false }) + '\n';
        message += `--------------------------------------------------\n`;
        
        writeLog(message, LogLevel.ERROR, getFrameworkFailuresFile());
        updateStats();
    } catch (error) {
        console.error(`Error logging framework failure: ${error.message}`);
    }
}

/**
 * Update the framework stats file
 */
function updateStats() {
    frameworkStats.lastUpdated = new Date().toISOString();
    fs.writeFileSync(getFrameworkStatsFile(), JSON.stringify(frameworkStats, null, 2));
}

/**
 * Generate a report of framework reference failures
 * @returns {Object} A report object with failure statistics
 */
function generateFailureReport() {
    const report = {
        timestamp: new Date().toISOString(),
        totalReferences: frameworkStats.totalReferences,
        totalLookups: frameworkStats.totalLookups,
        successfulLookups: frameworkStats.successfulLookups,
        failedLookups: frameworkStats.failedLookups,
        successRate: frameworkStats.totalLookups > 0 
            ? (frameworkStats.successfulLookups / frameworkStats.totalLookups * 100).toFixed(2) + '%' 
            : 'N/A',
        mostReferencedFrameworks: getTopItems(frameworkStats.frameworkCounts, 5),
        commonFailureReasons: getTopItems(frameworkStats.failureReasons, 5),
        failureHotspots: getTopItems(frameworkStats.failureLocations, 5),
        recommendations: generateRecommendations()
    };
    
    return report;
}

/**
 * Get the top N items from a count object
 * @param {Object} countObject - Object with items as keys and counts as values
 * @param {number} n - Number of top items to return
 * @returns {Array} Array of [item, count] pairs
 */
function getTopItems(countObject, n) {
    return Object.entries(countObject)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
}

/**
 * Generate recommendations based on the collected stats
 * @returns {Array} Array of recommendation strings
 */
function generateRecommendations() {
    const recommendations = [];
    
    // Check failure rate
    const failureRate = frameworkStats.totalLookups > 0 
        ? (frameworkStats.failedLookups / frameworkStats.totalLookups) 
        : 0;
    
    if (failureRate > 0.2) {
        recommendations.push("High failure rate detected. Consider standardizing framework naming conventions.");
    }
    
    // Check for inconsistent framework names
    const frameworkNames = Object.keys(frameworkStats.frameworkCounts);
    const similarNames = findSimilarFrameworkNames(frameworkNames);
    
    if (similarNames.length > 0) {
        recommendations.push(`Potential naming inconsistencies detected: ${similarNames.join(', ')}. Consider standardizing these names.`);
    }
    
    // Check for common failure locations
    const topFailureLocations = getTopItems(frameworkStats.failureLocations, 3);
    if (topFailureLocations.length > 0) {
        recommendations.push(`Focus on these failure hotspots: ${topFailureLocations.map(([loc]) => loc).join(', ')}`);
    }
    
    return recommendations;
}

/**
 * Find potentially similar framework names that might indicate inconsistencies
 * @param {Array} names - Array of framework names
 * @returns {Array} Array of groups of similar names
 */
function findSimilarFrameworkNames(names) {
    const similarGroups = [];
    
    // Simple implementation - look for names that are substrings of each other
    // or differ only by case or common separators
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const name1 = names[i].toLowerCase().replace(/[-_\s]/g, '');
            const name2 = names[j].toLowerCase().replace(/[-_\s]/g, '');
            
            if (name1.includes(name2) || name2.includes(name1) || 
                levenshteinDistance(name1, name2) <= 2) {
                similarGroups.push(`"${names[i]}" and "${names[j]}"`);
            }
        }
    }
    
    return similarGroups;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
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
 * Reset the statistics and log files
 */
function resetLogs() {
    frameworkStats = {
        totalReferences: 0,
        totalLookups: 0,
        successfulLookups: 0,
        failedLookups: 0,
        frameworkCounts: {},
        failureReasons: {},
        failureLocations: {},
        lastUpdated: new Date().toISOString()
    };
    
    // Clear log files
    fs.writeFileSync(getFrameworkLogFile(), '');
    fs.writeFileSync(getFrameworkFailuresFile(), '');
    fs.writeFileSync(getFrameworkStatsFile(), JSON.stringify(frameworkStats, null, 2));
    
    writeLog('Logs and statistics reset', LogLevel.INFO);
}

module.exports = {
    LogLevel,
    logFrameworkReference,
    logFrameworkLookup,
    logFrameworkFailure,
    generateFailureReport,
    resetLogs,
    setLogDirectory,
    getLogDirectory,
    getFrameworkLogFile,
    getFrameworkFailuresFile,
    getFrameworkStatsFile,
    getFilePath
};
