// dilemmaLoader.js - Utility to load ethical dilemmas from files

const fs = require('fs');
const path = require('path');

/**
 * Loads an ethical dilemma from a JSON file or string.
 * @param {string} input - Either a file path or JSON string
 * @returns {Object|null} The loaded dilemma object, or null if loading fails
 */
function loadDilemma(input) {
    let dilemmaJson = input;
    
    // Check if this is a file path
    if (typeof input === 'string' && (input.endsWith('.json') || input.startsWith('loadfile'))) {
        const filename = input.startsWith('loadfile') ? input.substring('loadfile'.length).trim() : input;
        
        // Check if filename includes a path
        let filePath;
        if (path.isAbsolute(filename)) {
            filePath = filename; // Direct file
        } else {
            // Resolve relative to the dilemmas directory
            filePath = path.resolve(process.cwd(), 'dilemmas', filename);
        }
        
        try {
            dilemmaJson = fs.readFileSync(filePath, 'utf8');
            console.log(`Loaded JSON from file: ${filename}`);
        } catch (error) {
            console.error(`Error loading file: ${error.message}`);
            return null;
        }
    }
    
    try {
        let dilemma = JSON.parse(dilemmaJson);
        
        // Basic validation
        if (!dilemma || typeof dilemma !== 'object') {
            console.error("Invalid dilemma format. JSON must represent an object.");
            return null;
        }
        
        // Handle name vs title consistency
        if (dilemma.name && !dilemma.title) {
            dilemma.title = dilemma.name;
        } else if (!dilemma.title && !dilemma.name) {
            dilemma.title = "Untitled Dilemma";
        }
        
        // Set default values and validate fields
        dilemma.precedent_id = dilemma.precedent_id || "user_input_" + Date.now();
        dilemma.description = dilemma.description || "";
        dilemma.parameters = dilemma.parameters || {};
        dilemma.factors = dilemma.factors || {};
        dilemma.context = dilemma.context || "";
        
        // Ensure actions are properly formatted
        if (!dilemma.actions) {
            dilemma.actions = { "default_action": { description: "Default action" } };
        } else if (Array.isArray(dilemma.actions)) {
            // Convert array to object format
            const actionsObj = {};
            dilemma.actions.forEach(action => {
                if (typeof action === 'string') {
                    actionsObj[action] = { description: action };
                }
            });
            dilemma.actions = actionsObj;
        }
        
        // Validate parameters format
        for (const key in dilemma.parameters) {
            // Convert simple value format to object format if needed
            if (typeof dilemma.parameters[key] !== 'object') {
                const value = dilemma.parameters[key];
                dilemma.parameters[key] = { 
                    value: parseFloat(value) || 0.5,
                    description: `Parameter ${key}`
                };
            }
            
            // Ensure value field exists and is a number
            if (typeof dilemma.parameters[key].value !== 'number') {
                console.warn(`Parameter ${key} value is not a number. Setting to default 0.5`);
                dilemma.parameters[key].value = 0.5;
            }
            
            // Ensure description field exists
            if (!dilemma.parameters[key].description) {
                dilemma.parameters[key].description = `Parameter ${key}`;
            }
        }
        
        // Validate frameworks
        if (!dilemma.frameworks || !Array.isArray(dilemma.frameworks) || dilemma.frameworks.length === 0) {
            console.warn("Dilemma has no frameworks defined. Some functionality may be limited.");
        }
        
        return dilemma;
    } catch (error) {
        console.error("Error parsing dilemma:", error.message);
        return null;
    }
}

/**
 * Creates a directory for dilemmas if it doesn't exist.
 * @param {string} dirPath - Path to the dilemmas directory
 * @returns {Promise<boolean>} True if directory exists or was created successfully
 */
async function ensureDilemmaDirectory(dirPath) {
    try {
        await fs.promises.mkdir(dirPath, { recursive: true });
        return true;
    } catch (error) {
        console.error(`Error creating dilemmas directory ${dirPath}:`, error.message);
        return false;
    }
}

/**
 * Saves a dilemma to a JSON file.
 * @param {Object} dilemma - The dilemma object to save
 * @param {string} filePath - Path where the dilemma should be saved
 * @returns {boolean} True if the dilemma was saved successfully
 */
function saveDilemma(dilemma, filePath) {
    try {
        const dirName = path.dirname(filePath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }
        
        const jsonData = JSON.stringify(dilemma, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        
        console.log(`Dilemma saved to ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error saving dilemma to ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Lists all available dilemmas in a directory.
 * @param {string} dirPath - Path to the dilemmas directory
 * @returns {Promise<Array<string>>} Array of dilemma filenames
 */
async function listDilemmas(dirPath) {
    try {
        const files = await fs.promises.readdir(dirPath);
        const dilemmaFiles = files.filter(file => file.endsWith('.json'));
        
        console.log(`Found ${dilemmaFiles.length} dilemma files in ${dirPath}`);
        return dilemmaFiles;
    } catch (error) {
        console.error(`Error listing dilemmas in ${dirPath}:`, error.message);
        return [];
    }
}

module.exports = {
    loadDilemma,
    saveDilemma,
    listDilemmas,
    ensureDilemmaDirectory
}; 