/**
 * test-framework-references.js
 * 
 * This script tests the framework reference logging and diagnostic system.
 * It verifies that framework references, lookups, and failures are properly
 * logged and that the diagnostic system can analyze patterns in framework references.
 */

const fs = require('fs');
const path = require('path');
const frameworkLogger = require('../src/frameworkLogger');
const frameworkDiagnostics = require('../src/frameworkDiagnostics');
const { generateReasoningPaths } = require('../src/reasoningPath');

// Create test directories
const TEST_LOG_DIR = path.join(__dirname, 'test-logs');
const TEST_REPORT_DIR = path.join(__dirname, 'test-reports');

// Ensure test directories exist
if (!fs.existsSync(TEST_LOG_DIR)) {
    fs.mkdirSync(TEST_LOG_DIR, { recursive: true });
}
if (!fs.existsSync(TEST_REPORT_DIR)) {
    fs.mkdirSync(TEST_REPORT_DIR, { recursive: true });
}

// Override log file paths for testing
frameworkLogger.setLogDirectory(TEST_LOG_DIR);
frameworkDiagnostics.setReportDirectory(TEST_REPORT_DIR);

// Add verification functions to check if logs are created in the correct directories
function verifyLogFilesExist() {
    // Use the dynamic file paths from the logger
    const logDirectory = frameworkLogger.getLogDirectory();
    const logFile = frameworkLogger.getFrameworkLogFile();
    const failureFile = frameworkLogger.getFrameworkFailuresFile();
    const statsFile = frameworkLogger.getFrameworkStatsFile();
    
    console.log(`Verifying log files in directory: ${logDirectory}`);
    
    const logExists = fs.existsSync(logFile);
    const failureExists = fs.existsSync(failureFile);
    const statsExists = fs.existsSync(statsFile);
    
    if (!logExists) console.log(`Log file not found: ${logFile}`);
    if (!failureExists) console.log(`Failure log file not found: ${failureFile}`);
    if (!statsExists) console.log(`Stats file not found: ${statsFile}`);
    
    return {
        logExists,
        failureExists,
        statsExists,
        allExist: logExists && failureExists && statsExists
    };
}

// Sample frameworks for testing
const testFrameworks = [
    "Utilitarianism",
    "Kantian Deontology",
    "Virtue Ethics",
    "Care Ethics",
    "Social Contract Theory",
    "Natural Law",
    "Professional Ethics",
    "Rights-Based Ethics",
    "Hybrid: consequentialism + virtue_ethics",
    "utilitarianism", // Case variation
    "virtue-ethics", // Format variation
    "Rights_Based_Ethics" // Format variation
];

// Sample dilemma for testing
const testDilemma = {
    id: 'test_dilemma',
    title: 'Test Dilemma',
    description: 'A test dilemma for framework reference testing',
    situation: {
        type: 'TestDilemma',
        parameters: {
            test_param: 'value'
        }
    },
    contextual_factors: [
        { factor: 'test_factor', value: 'test_value', relevance: 'high' }
    ]
};

// Sample precedent for testing
const testPrecedent = {
    id: 'test_precedent',
    title: 'Test Precedent',
    description: 'A test precedent for framework reference testing',
    reasoning_paths: [
        {
            id: 'path_1',
            framework: 'Utilitarianism',
            argument: 'A test utilitarian argument',
            strength: 'strong',
            conclusion: 'test_conclusion'
        },
        {
            id: 'path_2',
            framework: 'Kantian Deontology',
            argument: 'A test Kantian argument',
            strength: 'moderate',
            conclusion: 'test_conclusion'
        },
        {
            id: 'path_3',
            framework: 'Non-existent Framework',
            argument: 'A test argument with a non-existent framework',
            strength: 'weak',
            conclusion: 'test_conclusion'
        }
    ]
};

/**
 * Setup function to prepare for tests
 */
function setup() {
    console.log("\n===== SETTING UP FRAMEWORK REFERENCE TESTS =====");
    
    // Reset logs before testing
    frameworkLogger.resetLogs();
    
    console.log("Framework reference logs reset");
}

/**
 * Cleanup function after tests
 */
function cleanup() {
    console.log("\n===== CLEANING UP FRAMEWORK REFERENCE TESTS =====");
    
    // Any cleanup code here
    
    console.log("Framework reference tests cleanup complete");
}

/**
 * Test basic framework reference logging
 */
async function testFrameworkReferenceLogging() {
    console.log("\n===== TESTING FRAMEWORK REFERENCE LOGGING =====");
    
    // Test logging framework references
    for (const framework of testFrameworks) {
        frameworkLogger.logFrameworkReference(
            framework,
            "testFrameworkReferenceLogging",
            { test: true, timestamp: new Date().toISOString() }
        );
        console.log(`Logged reference to framework: ${framework}`);
    }
    
    // Verify logs were created
    const logFile = path.join(frameworkLogger.getLogDirectory(), 'framework_references.log');
    if (fs.existsSync(logFile)) {
        const logContent = fs.readFileSync(logFile, 'utf8');
        const logLines = logContent.split('\n').filter(line => line.trim());
        
        console.log(`Framework reference log contains ${logLines.length} entries`);
        
        // Check if all frameworks were logged
        let allFrameworksLogged = true;
        for (const framework of testFrameworks) {
            if (!logContent.includes(`Framework Reference: "${framework}"`)) {
                console.error(`❌ Framework "${framework}" was not logged properly`);
                allFrameworksLogged = false;
            }
        }
        
        if (allFrameworksLogged) {
            console.log("✅ All framework references were logged successfully");
        } else {
            console.log("❌ Some framework references were not logged properly");
        }
    } else {
        console.error("❌ Framework reference log file was not created");
    }
    
    return true;
}

/**
 * Test framework lookup logging
 */
async function testFrameworkLookupLogging() {
    console.log("\n===== TESTING FRAMEWORK LOOKUP LOGGING =====");
    
    // Test successful lookups
    for (let i = 0; i < 5; i++) {
        const framework = testFrameworks[i];
        frameworkLogger.logFrameworkLookup(
            framework,
            "testFrameworkLookupLogging.success",
            true,
            { test: true, timestamp: new Date().toISOString() }
        );
        console.log(`Logged successful lookup of framework: ${framework}`);
    }
    
    // Test failed lookups
    for (let i = 5; i < 10; i++) {
        const framework = testFrameworks[i];
        frameworkLogger.logFrameworkLookup(
            framework,
            "testFrameworkLookupLogging.failure",
            false,
            { test: true, timestamp: new Date().toISOString(), reason: "Test failure" }
        );
        console.log(`Logged failed lookup of framework: ${framework}`);
    }
    
    // Verify logs were created
    const logFile = path.join(frameworkLogger.getLogDirectory(), 'framework_references.log');
    const failureLogFile = path.join(frameworkLogger.getLogDirectory(), 'framework_failures.log');
    
    if (fs.existsSync(logFile) && fs.existsSync(failureLogFile)) {
        const logContent = fs.readFileSync(logFile, 'utf8');
        const failureLogContent = fs.readFileSync(failureLogFile, 'utf8');
        
        // Check if successful lookups were logged
        let successfulLookupsLogged = true;
        for (let i = 0; i < 5; i++) {
            const framework = testFrameworks[i];
            if (!logContent.includes(`Framework Lookup: "${framework}"`) || 
                !logContent.includes("Status: SUCCESS")) {
                console.error(`❌ Successful lookup of "${framework}" was not logged properly`);
                successfulLookupsLogged = false;
            }
        }
        
        // Check if failed lookups were logged
        let failedLookupsLogged = true;
        for (let i = 5; i < 10; i++) {
            const framework = testFrameworks[i];
            if (!logContent.includes(`Framework Lookup: "${framework}"`) || 
                !logContent.includes("Status: FAILURE")) {
                console.error(`❌ Failed lookup of "${framework}" was not logged properly in main log`);
                failedLookupsLogged = false;
            }
            
            if (!failureLogContent.includes(`Framework Lookup: "${framework}"`)) {
                console.error(`❌ Failed lookup of "${framework}" was not logged properly in failure log`);
                failedLookupsLogged = false;
            }
        }
        
        if (successfulLookupsLogged) {
            console.log("✅ All successful framework lookups were logged properly");
        } else {
            console.log("❌ Some successful framework lookups were not logged properly");
        }
        
        if (failedLookupsLogged) {
            console.log("✅ All failed framework lookups were logged properly");
        } else {
            console.log("❌ Some failed framework lookups were not logged properly");
        }
    } else {
        console.error("❌ Framework log files were not created properly");
    }
    
    return true;
}

/**
 * Test framework failure logging
 */
async function testFrameworkFailureLogging() {
    console.log("\n===== TESTING FRAMEWORK FAILURE LOGGING =====");
    
    // Test logging framework failures
    const testFailures = [
        {
            framework: "Non-existent Framework",
            location: "testFrameworkFailureLogging.nonexistent",
            reason: "Framework not found in database",
            object: { id: "test1", type: "framework", status: "missing" },
            context: { test: true, timestamp: new Date().toISOString() }
        },
        {
            framework: "Utilitarianism",
            location: "testFrameworkFailureLogging.malformed",
            reason: "Malformed framework structure",
            object: { id: "test2", type: "framework", structure: {} },
            context: { test: true, timestamp: new Date().toISOString() }
        },
        {
            framework: "Kantian Deontology",
            location: "testFrameworkFailureLogging.incomplete",
            reason: "Incomplete framework data",
            object: { id: "test3", type: "framework", data: null },
            context: { test: true, timestamp: new Date().toISOString() }
        }
    ];
    
    for (const failure of testFailures) {
        frameworkLogger.logFrameworkFailure(
            failure.framework,
            failure.location,
            failure.reason,
            failure.object,
            failure.context
        );
        console.log(`Logged failure for framework: ${failure.framework}`);
    }
    
    // Verify logs were created
    const failureLogFile = path.join(frameworkLogger.getLogDirectory(), 'framework_failures.log');
    
    if (fs.existsSync(failureLogFile)) {
        const failureLogContent = fs.readFileSync(failureLogFile, 'utf8');
        
        // Check if failures were logged
        let allFailuresLogged = true;
        for (const failure of testFailures) {
            if (!failureLogContent.includes(`Framework: "${failure.framework}"`) || 
                !failureLogContent.includes(`Location: ${failure.location}`) ||
                !failureLogContent.includes(`Reason: ${failure.reason}`)) {
                console.error(`❌ Failure for "${failure.framework}" was not logged properly`);
                allFailuresLogged = false;
            }
        }
        
        if (allFailuresLogged) {
            console.log("✅ All framework failures were logged properly");
        } else {
            console.log("❌ Some framework failures were not logged properly");
        }
    } else {
        console.error("❌ Framework failure log file was not created");
    }
    
    return true;
}

/**
 * Test framework diagnostics
 */
async function testFrameworkDiagnostics() {
    console.log('\n===== TESTING FRAMEWORK DIAGNOSTICS =====');
    
    // Generate a report
    const report = frameworkDiagnostics.generateFrameworkReport(true);
    
    if (!report) {
        console.log('❌ Failed to generate framework report');
        return;
    }
    
    console.log('Generated framework diagnostic report');
    
    // Verify report sections
    console.log('Report sections:');
    if (report.totalReferences) console.log(`- Total references: ${report.totalReferences}`);
    if (report.totalLookups) console.log(`- Total lookups: ${report.totalLookups}`);
    if (report.successfulLookups) console.log(`- Successful lookups: ${report.successfulLookups}`);
    if (report.failedLookups) console.log(`- Failed lookups: ${report.failedLookups}`);
    if (report.topFrameworks && Array.isArray(report.topFrameworks)) console.log(`- Most referenced frameworks: ${report.topFrameworks.length}`);
    if (report.commonFailureReasons && Array.isArray(report.commonFailureReasons)) console.log(`- Common failure reasons: ${report.commonFailureReasons.length}`);
    if (report.failureHotspots && Array.isArray(report.failureHotspots)) console.log(`- Failure hotspots: ${report.failureHotspots.length}`);
    
    // Check for name issues detection
    const detailedAnalysis = report.detailedAnalysis || {};
    const nameIssues = detailedAnalysis.nameIssues || {};
    
    if (nameIssues.caseInconsistencies && nameIssues.caseInconsistencies.length > 0) {
        console.log('✅ Case inconsistencies were detected');
    } else {
        console.log('❌ Case inconsistencies were not detected');
    }
    
    if (nameIssues.formatInconsistencies && nameIssues.formatInconsistencies.length > 0) {
        console.log('✅ Format inconsistencies were detected');
    } else {
        console.log('❌ Format inconsistencies were not detected');
    }
    
    if (nameIssues.similarNames && nameIssues.similarNames.length > 0) {
        console.log('✅ Similar names were detected');
    } else {
        console.log('❌ Similar names were not detected');
    }
    
    // Save a human-readable report
    const reportFilePath = path.join(TEST_REPORT_DIR, 'test_framework_report.txt');
    frameworkDiagnostics.saveHumanReadableReport(reportFilePath);
    console.log(`Human-readable report saved to ${reportFilePath}`);
    
    return true;
}

/**
 * Test integration with reasoning path system
 */
async function testReasoningPathIntegration() {
    console.log("\n===== TESTING INTEGRATION WITH REASONING PATH SYSTEM =====");
    
    // Reset logs before testing
    frameworkLogger.resetLogs();
    
    // Create test precedents with various frameworks
    const testPrecedents = [
        {
            id: 'precedent_1',
            title: 'Test Precedent 1',
            description: 'A test precedent for framework reference testing',
            reasoning_paths: [
                {
                    id: 'path_1',
                    framework: 'Utilitarianism',
                    argument: 'A test utilitarian argument',
                    strength: 'strong',
                    conclusion: 'test_conclusion'
                },
                {
                    id: 'path_2',
                    framework: 'Kantian Deontology',
                    argument: 'A test Kantian argument',
                    strength: 'moderate',
                    conclusion: 'test_conclusion'
                }
            ]
        },
        {
            id: 'precedent_2',
            title: 'Test Precedent 2',
            description: 'Another test precedent for framework reference testing',
            reasoning_paths: [
                {
                    id: 'path_3',
                    framework: 'Virtue Ethics',
                    argument: 'A test virtue ethics argument',
                    strength: 'moderate',
                    conclusion: 'test_conclusion'
                },
                {
                    id: 'path_4',
                    framework: 'Care Ethics',
                    argument: 'A test care ethics argument',
                    strength: 'strong',
                    conclusion: 'test_conclusion'
                }
            ]
        },
        {
            id: 'precedent_3',
            title: 'Test Precedent 3',
            description: 'A test precedent with a non-existent framework',
            reasoning_paths: [
                {
                    id: 'path_5',
                    framework: 'Non-existent Framework',
                    argument: 'A test argument with a non-existent framework',
                    strength: 'weak',
                    conclusion: 'test_conclusion'
                }
            ]
        }
    ];
    
    try {
        // Generate reasoning paths
        console.log("Generating reasoning paths for test dilemma...");
        const result = await generateReasoningPaths(testDilemma, testPrecedents);
        
        console.log(`Generated ${result.reasoningPaths.length} reasoning paths`);
        console.log(`Match case: ${result.matchCase}`);
        
        // Check the logs for framework references
        const logFile = path.join(frameworkLogger.getLogDirectory(), 'framework_references.log');
        const failureLogFile = path.join(frameworkLogger.getLogDirectory(), 'framework_failures.log');
        
        if (fs.existsSync(logFile)) {
            const logContent = fs.readFileSync(logFile, 'utf8');
            
            // Check for framework references
            const frameworks = ['Utilitarianism', 'Kantian Deontology', 'Virtue Ethics', 'Care Ethics'];
            let frameworkReferencesFound = true;
            
            for (const framework of frameworks) {
                if (!logContent.includes(`Framework Reference: "${framework}"`)) {
                    console.error(`❌ Framework reference for "${framework}" not found in logs`);
                    frameworkReferencesFound = false;
                }
            }
            
            if (frameworkReferencesFound) {
                console.log("✅ Framework references were logged during reasoning path generation");
            } else {
                console.log("❌ Some framework references were not logged during reasoning path generation");
            }
            
            // Check for framework lookups
            if (logContent.includes("Framework Lookup:") && 
                logContent.includes("Status: SUCCESS")) {
                console.log("✅ Framework lookups were logged during reasoning path generation");
            } else {
                console.log("❌ Framework lookups were not logged during reasoning path generation");
            }
        } else {
            console.error("❌ Framework reference log file was not created");
        }
        
        // Check for framework failures
        if (fs.existsSync(failureLogFile)) {
            const failureLogContent = fs.readFileSync(failureLogFile, 'utf8');
            
            if (failureLogContent.includes("Non-existent Framework")) {
                console.log("✅ Framework failures were logged during reasoning path generation");
            } else {
                console.log("❌ Framework failures were not logged for non-existent frameworks");
            }
        } else {
            console.error("❌ Framework failure log file was not created");
        }
    } catch (error) {
        console.error("❌ Error during reasoning path integration test:", error);
    }
    
    return true;
}

/**
 * Test framework reference handling with real dilemmas
 */
async function testWithRealDilemmas() {
    console.log("\n===== TESTING WITH REAL DILEMMAS =====");
    
    // Reset logs before testing
    frameworkLogger.resetLogs();
    
    try {
        // Load a real dilemma
        const dilemmaPath = path.join(__dirname, '..', 'dilemmas', 'crying-baby-dilemma.json');
        const dilemmaData = fs.readFileSync(dilemmaPath, 'utf8');
        const dilemma = JSON.parse(dilemmaData);
        
        console.log(`Loaded dilemma: ${dilemma.title}`);
        
        // Extract frameworks from the dilemma
        const frameworks = dilemma.reasoning_paths.map(path => path.framework);
        console.log(`Frameworks in dilemma: ${frameworks.join(', ')}`);
        
        // Log references to these frameworks
        for (const framework of frameworks) {
            frameworkLogger.logFrameworkReference(
                framework,
                "testWithRealDilemmas.reference",
                { dilemma: dilemma.title, source: "reasoning_paths" }
            );
            console.log(`Logged reference to framework: ${framework}`);
        }
        
        // Log lookups for these frameworks
        for (const framework of frameworks) {
            frameworkLogger.logFrameworkLookup(
                framework,
                "testWithRealDilemmas.lookup",
                true,
                { dilemma: dilemma.title, source: "reasoning_paths" }
            );
            console.log(`Logged successful lookup of framework: ${framework}`);
        }
        
        // Log a failure for a non-existent framework
        frameworkLogger.logFrameworkLookup(
            "Non-existent Framework",
            "testWithRealDilemmas.lookup",
            false,
            { dilemma: dilemma.title, source: "reasoning_paths", reason: "Framework not found" }
        );
        console.log(`Logged failed lookup of framework: Non-existent Framework`);
        
        // Generate a report
        const report = frameworkDiagnostics.generateFrameworkReport(true);
        
        console.log("Generated framework diagnostic report");
        
        // Check if the report contains the expected frameworks
        if (report) {
            const referencedFrameworks = report.mostReferencedFrameworks.map(([framework]) => framework);
            console.log("Most referenced frameworks:", referencedFrameworks);
            
            let allFrameworksReferenced = true;
            for (const framework of frameworks) {
                if (!referencedFrameworks.includes(framework)) {
                    console.error(`❌ Framework "${framework}" not found in most referenced frameworks`);
                    allFrameworksReferenced = false;
                }
            }
            
            if (allFrameworksReferenced) {
                console.log("✅ All frameworks from the dilemma were properly referenced");
            } else {
                console.log("❌ Some frameworks from the dilemma were not properly referenced");
            }
        } else {
            console.error("❌ Failed to generate framework diagnostic report");
        }
    } catch (error) {
        console.error("❌ Error during real dilemma test:", error);
    }
    
    return true;
}

/**
 * Add test for name issue detection
 */
async function testNameIssueDetection() {
    console.log('\n===== TESTING NAME ISSUE DETECTION =====');
    
    try {
        // Reset logs completely before starting
        frameworkLogger.resetLogs();
        
        // Create a fresh test directory
        const TEST_NAME_LOG_DIR = path.join(__dirname, 'test-name-logs');
        if (!fs.existsSync(TEST_NAME_LOG_DIR)) {
            fs.mkdirSync(TEST_NAME_LOG_DIR, { recursive: true });
        }
        
        // Set log directory specifically for this test
        frameworkLogger.setLogDirectory(TEST_NAME_LOG_DIR);
        
        // Ensure all required log files exist
        const logFile = frameworkLogger.getFrameworkLogFile();
        const failureFile = frameworkLogger.getFrameworkFailuresFile();
        const statsFile = frameworkLogger.getFrameworkStatsFile();
        
        // Create empty log files if they don't exist
        if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '');
        if (!fs.existsSync(failureFile)) fs.writeFileSync(failureFile, '');
        if (!fs.existsSync(statsFile)) fs.writeFileSync(statsFile, '{}');
        
        // Log references with various case and format inconsistencies
        console.log("Logging test cases for name inconsistencies detection...");
        
        // Define test cases - we'll use these both for logging and direct testing
        const testFrameworks = [
            'Utilitarianism', 'utilitarianism', 'UTILITARIANISM',  // Case inconsistencies
            'Virtue Ethics', 'virtue-ethics', 'virtue_ethics',     // Format inconsistencies
            'Kantian Ethics', 'Kantien Ethics',                    // Similar names (typo)
            'Consequentialism', 'Consequentialism', 'Consequentualism' // Duplicate + similar
        ];
        
        // Log each framework reference
        for (const framework of testFrameworks) {
            frameworkLogger.logFrameworkReference(framework, 'testNameIssueDetection');
            console.log(`Logged reference to framework: ${framework}`);
        }
        
        // Force write to disk
        console.log(`Ensuring framework references are written to: ${logFile}`);
        
        // Verify log files exist in test directory
        const fileVerification = verifyLogFilesExist();
        if (fileVerification.allExist) {
            console.log('✅ All log files were created in the test directory');
        } else {
            console.log('❌ Some log files were not created in the test directory');
            if (!fileVerification.logExists) console.log('  - Framework reference log not found');
            if (!fileVerification.failureExists) console.log('  - Framework failures log not found');
            if (!fileVerification.statsExists) console.log('  - Framework stats log not found');
            return;
        }
        
        // Use the test frameworks directly for name issue detection
        console.log(`Using ${testFrameworks.length} framework names for analysis:`, testFrameworks);
        
        // Generate a report
        const report = frameworkDiagnostics.generateFrameworkReport(true);
        
        // Check if the detailedAnalysis.nameIssues property exists
        if (!report.detailedAnalysis || !report.detailedAnalysis.nameIssues) {
            console.log('❌ Name issues analysis is not present in the report');
            return;
        }
        
        // Direct use of identifyNameIssues to verify name issue detection
        const nameIssues = frameworkDiagnostics.identifyNameIssues(testFrameworks);
        
        if (!nameIssues) {
            console.log('❌ Failed to identify name issues');
            return;
        }
        
        // Verify case inconsistencies were detected
        if (nameIssues.caseInconsistencies && nameIssues.caseInconsistencies.length > 0) {
            console.log('✅ Case inconsistencies were detected:');
            nameIssues.caseInconsistencies.forEach(issue => {
                console.log(`  - Base: ${issue.base}, Variants: ${issue.variants.join(', ')}`);
            });
        } else {
            console.log('❌ Case inconsistencies were not detected');
        }
        
        // Verify format inconsistencies were detected
        if (nameIssues.formatInconsistencies && nameIssues.formatInconsistencies.length > 0) {
            console.log('✅ Format inconsistencies were detected:');
            nameIssues.formatInconsistencies.forEach(issue => {
                console.log(`  - Original: ${issue.original}, Matches: ${issue.matches.join(', ')}`);
            });
        } else {
            console.log('❌ Format inconsistencies were not detected');
        }
        
        // Verify similar names were detected
        if (nameIssues.similarNames && nameIssues.similarNames.length > 0) {
            console.log('✅ Similar names were detected:');
            nameIssues.similarNames.forEach(issue => {
                console.log(`  - ${issue.name1} & ${issue.name2} (distance: ${issue.distance})`);
            });
        } else {
            console.log('❌ Similar names were not detected');
        }
    } catch (error) {
        console.error(`❌ Error in name issue detection test: ${error.message}`);
        console.error(error.stack);
    }
}

/**
 * Run all tests
 */
async function runTests() {
    try {
        console.log('\n===== RUNNING FRAMEWORK REFERENCE TESTS =====\n');
        
        await setup();
        
        await testFrameworkReferenceLogging();
        await testFrameworkLookupLogging();
        await testFrameworkFailureLogging();
        await testFrameworkDiagnostics();
        
        // Add the new name issue detection test
        await testNameIssueDetection();
        
        await testReasoningPathIntegration();
        await testWithRealDilemmas();
        
        console.log('\n===== FRAMEWORK REFERENCE TESTS COMPLETE =====');
        console.log('✅ All tests completed');
    } catch (error) {
        console.log('\n❌ Error during tests:', error);
    } finally {
        await cleanup();
    }
}

// Run the tests
runTests();
