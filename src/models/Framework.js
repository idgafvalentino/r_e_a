/**
 * Framework Class
 * 
 * Represents an ethical framework with standardized naming and properties.
 * This class is the foundation of the framework registry system.
 */

class Framework {
  /**
   * Create a new Framework
   * @param {string} id - Canonical ID (snake_case, e.g., "utilitarianism")
   * @param {string} name - Display name (PascalCase with spaces, e.g., "Utilitarianism")
   * @param {string} description - Description of the framework
   * @param {Array<string>} aliases - Alternative names/spellings
   * @param {Object} options - Additional options for the framework
   */
  constructor(id, name, description = '', aliases = [], options = {}) {
    if (!id || !name) {
      throw new Error("Framework must have an ID and a name");
    }
    
    this.id = id;                     // Canonical ID (e.g., "utilitarianism")
    this.name = name;                 // Display name (e.g., "Utilitarianism")
    this.description = description;   // Description of the framework
    this.aliases = aliases;           // Alternative names/spellings
    
    // Default properties
    this.isHybrid = false;
    this.isUnknown = false;
    
    // Apply any additional options
    if (options && typeof options === 'object') {
      Object.keys(options).forEach(key => {
        this[key] = options[key];
      });
    }
  }

  /**
   * Check if this framework is a specific framework by ID
   * @param {string} id - The framework ID to check against
   * @returns {boolean} True if this framework has the specified ID
   */
  is(id) {
    return this.id === id;
  }

  /**
   * Check if this framework matches a name (either exact or alias)
   * @param {string} name - The name to check
   * @returns {boolean} True if the framework matches the name
   */
  matches(name) {
    if (!name) return false;
    
    return (
      this.name === name || 
      this.aliases.includes(name)
    );
  }

  /**
   * Check if this framework matches a name with case-insensitive comparison
   * @param {string} name - The name to check
   * @returns {boolean} True if the framework matches the name (case-insensitive)
   */
  matchesCaseInsensitive(name) {
    if (!name) return false;
    
    const lowerName = name.toLowerCase();
    return (
      this.name.toLowerCase() === lowerName || 
      this.aliases.some(alias => alias.toLowerCase() === lowerName)
    );
  }

  /**
   * Check if this framework matches a normalized name
   * (normalized = lowercase with spaces, hyphens, and underscores removed)
   * @param {string} name - The name to check
   * @returns {boolean} True if the framework matches the normalized name
   */
  matchesNormalized(name) {
    if (!name) return false;
    
    const normalizedName = name.toLowerCase().replace(/[-_\s]+/g, '');
    return (
      this.name.toLowerCase().replace(/[-_\s]+/g, '') === normalizedName || 
      this.aliases.some(alias => alias.toLowerCase().replace(/[-_\s]+/g, '') === normalizedName)
    );
  }

  /**
   * Convert the framework to a string representation
   * @returns {string} String representation of the framework
   */
  toString() {
    return this.name;
  }

  /**
   * Convert the framework to a JSON representation
   * @returns {Object} JSON representation of the framework
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      aliases: this.aliases,
      isHybrid: this.isHybrid,
      isUnknown: this.isUnknown
    };
  }
}

module.exports = Framework;
