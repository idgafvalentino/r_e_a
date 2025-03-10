/**
 * Specialized logger for adaptation rules
 * This module provides logging functions for debugging adaptation rules
 */

const fs = require('fs');
const path = require('path');

// Configure log file path
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'adaptation_rules.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Clear log file on startup
fs.writeFileSync(LOG_FILE, '');

/**
 * Log rule application with inputs and outputs
 * @param {string} ruleName - Name of the adaptation rule
 * @param {Object} inputs - Input parameters to the rule
 * @param {Object} outputs - Output results from the rule
 */
function logRuleApplication(ruleName, inputs, outputs) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'RULE_APPLICATION',
    ruleName,
    inputs: sanitizeForLogging(inputs),
    outputs: sanitizeForLogging(outputs)
  };
  
  appendToLog(logEntry);
  console.log(`[${timestamp}] ${ruleName} applied`);
}

/**
 * Log parameter validation results
 * @param {string} ruleName - Name of the adaptation rule
 * @param {Object} parameters - Parameters being validated
 * @param {boolean} isValid - Whether validation passed
 * @param {string} reason - Reason for validation failure (if any)
 */
function logParameterValidation(ruleName, parameters, isValid, reason = '') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: isValid ? 'VALIDATION_SUCCESS' : 'VALIDATION_FAILURE',
    ruleName,
    parameters: sanitizeForLogging(parameters),
    reason
  };
  
  appendToLog(logEntry);
  if (!isValid) {
    console.warn(`[${timestamp}] ${ruleName} validation failed: ${reason}`);
  }
}

/**
 * Log argument modifications
 * @param {string} ruleName - Name of the adaptation rule
 * @param {string} before - Argument before modification
 * @param {string} after - Argument after modification
 * @param {string} reason - Reason for the modification
 */
function logArgumentModification(ruleName, before, after, reason = '') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'ARGUMENT_MODIFICATION',
    ruleName,
    before: before ? before.substring(0, 100) + '...' : null,
    after: after ? after.substring(0, 100) + '...' : null,
    reason,
    modified: before !== after
  };
  
  appendToLog(logEntry);
  if (before !== after) {
    console.log(`[${timestamp}] ${ruleName} modified argument: ${reason}`);
  }
}

/**
 * Log strength changes
 * @param {string} ruleName - Name of the adaptation rule
 * @param {string} before - Strength before modification
 * @param {string} after - Strength after modification
 * @param {string} reason - Reason for the strength change
 */
function logStrengthChange(ruleName, before, after, reason = '') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'STRENGTH_CHANGE',
    ruleName,
    before,
    after,
    reason,
    changed: before !== after
  };
  
  appendToLog(logEntry);
  if (before !== after) {
    console.log(`[${timestamp}] ${ruleName} changed strength from ${before} to ${after}: ${reason}`);
  }
}

/**
 * Log test execution details
 * @param {string} testName - Name of the test
 * @param {Object} precedent - Precedent object
 * @param {Object} newSituation - New situation object
 * @param {boolean} passed - Whether the test passed
 * @param {string} error - Error message if test failed
 */
function logTestExecution(testName, precedent, newSituation, passed, error = '') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: passed ? 'TEST_PASSED' : 'TEST_FAILED',
    testName,
    precedent: {
      id: precedent?.precedent_id || 'unknown',
      hasParams: !!(precedent?.situation?.parameters),
      hasContextFactors: !!(precedent?.contextual_factors),
      reasoningPathsCount: precedent?.reasoning_paths?.length || 0
    },
    newSituation: {
      hasParams: !!(newSituation?.situation?.parameters),
      hasContextFactors: !!(newSituation?.contextual_factors)
    },
    error
  };
  
  appendToLog(logEntry);
  if (!passed) {
    console.error(`[${timestamp}] Test failed: ${testName} - ${error}`);
  } else {
    console.log(`[${timestamp}] Test passed: ${testName}`);
  }
}

/**
 * Log a successful test
 * @param {string} testName - Name of the test that succeeded
 */
function logTestSuccess(testName) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'TEST_PASSED',
    testName
  };
  
  appendToLog(logEntry);
  console.log(`[${timestamp}] Test passed: ${testName}`);
}

/**
 * Log a failed test
 * @param {string} testName - Name of the test that failed
 * @param {Error} error - Error object from the test failure
 */
function logTestFailure(testName, error) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'TEST_FAILED',
    testName,
    error: error.message,
    stack: error.stack
  };
  
  appendToLog(logEntry);
  console.error(`[${timestamp}] Test failed: ${testName} - ${error.message}`);
}

/**
 * Sanitize objects for logging by removing circular references
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeForLogging(obj) {
  if (!obj) return null;
  
  try {
    // Use a cache to handle circular references
    const cache = new Set();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        // Skip circular references
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      
      // Truncate long strings
      if (typeof value === 'string' && value.length > 200) {
        return value.substring(0, 200) + '...';
      }
      
      return value;
    }));
  } catch (error) {
    return { error: 'Could not serialize object for logging' };
  }
}

/**
 * Append a log entry to the log file
 * @param {Object} logEntry - Log entry to append
 */
function appendToLog(logEntry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

module.exports = {
  logRuleApplication,
  logParameterValidation,
  logArgumentModification,
  logStrengthChange,
  logTestExecution,
  logTestSuccess,
  logTestFailure
};
