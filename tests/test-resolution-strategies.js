/**
 * test-resolution-strategies.js
 * 
 * Comprehensive tests for conflict resolution strategies including:
 * - balance
 * - stakeholder
 * - compromise
 * - pluralistic
 * 
 * Tests include individual strategy validation, fallback mechanisms,
 * strategy selection logic, and handling of hybrid frameworks.
 */

const assert = require('assert');
const { resolveConflicts, resolutionStrategies, selectResolutionStrategy } = require('../src/conflictResolution.js');
const { getFrameworkByName } = require('../src/frameworkRegistry');

// Test helper function to resolve with a specific strategy
function resolveWithStrategy(conflicts, reasoningPaths, dilemma, strategyName) {
  const options = { strategy: strategyName };
  return resolveConflicts(reasoningPaths, conflicts, dilemma, options);
}

describe('Resolution Strategies', () => {
  // Mock test data
  const mockFramework1 = {
    framework: "utilitarianism",
    action: "yes",
    argument: "A utilitarian approach aims to maximize overall welfare. The benefits outweigh the costs."
  };

  const mockFramework2 = {
    framework: "kantian_deontology",
    action: "no",
    argument: "A deontological approach focuses on respecting rights and dignity. This action violates fundamental rights."
  };

  const mockDilemma = {
    title: "Surveillance Dilemma",
    description: "A city is considering deploying advanced surveillance technology with facial recognition capabilities to reduce crime rates in high-crime areas.",
    contexts: ["urban", "technology", "security", "privacy", "discrimination"],
    parameters: [
      { name: "privacy_impact", value: 0.8 },
      { name: "technology_accuracy", value: 0.85 },
      { name: "alternatives_exhausted", value: 0.4 }
    ]
  };

  const mockValueConflict = {
    type: "VALUE",
    frameworks: ["utilitarianism", "kantian_deontology"],
    action: "deploy_surveillance",
    conflicting_elements: [
      {
        element_type: "principle",
        content: "Utilitarian principle",
        framework: "utilitarianism",
        strength: "strong",
      },
      {
        element_type: "principle",
        content: "Deontological principle",
        framework: "kantian_deontology",
        strength: "moderate",
      },
    ],
  };

  // Test reasoning paths
  const mockReasoningPaths = [
    { framework: "utilitarianism", action: "yes", ...mockFramework1 },
    { framework: "kantian_deontology", action: "no", ...mockFramework2 }
  ];

  // Test each strategy individually
  describe('Balance Strategy', () => {
    it('produces a valid resolution object', () => {
      const resolution = resolutionStrategies.balance.resolve(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.ok(resolution, 'Resolution should not be null or undefined');
      assert.ok(resolution.resolutions, 'Resolution should have resolutions array');
      assert.ok(resolution.resolutions.length > 0, 'Resolution should have at least one item');
      assert.ok(resolution.resolutions[0].framework, 'Resolution should have a framework');
      assert.ok(resolution.resolutions[0].argument, 'Resolution should have an argument');
      assert.equal(resolution.resolutions[0].resolutionStrategy, 'balance', 'Resolution should have correct strategy type');
    });

    it('uses proper framework objects', () => {
      const resolution = resolutionStrategies.balance.resolve(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.ok(resolution.resolutions[0].originalFrameworks.includes('Utilitarianism'), 'Should include the proper framework name');
      assert.ok(resolution.resolutions[0].originalFrameworks.includes('Kantian Deontology'), 'Should include the proper framework name');
    });

    it('generates a relevant argument', () => {
      const resolution = resolutionStrategies.balance.resolve(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.ok(resolution.resolutions[0].argument.includes('Utilitarianism'), 'Argument should mention the first framework');
      assert.ok(resolution.resolutions[0].argument.includes('Kantian Deontology'), 'Argument should mention the second framework');
      assert.ok(resolution.resolutions[0].argument.includes('balanced'), 'Argument should mention balancing');
    });

    it('handles edge cases gracefully', () => {
      // Test with empty conflicts
      const emptyResolution = resolutionStrategies.balance.resolve(mockReasoningPaths, [], mockDilemma);
      assert.deepStrictEqual(emptyResolution.resolutions, [], 'Should handle empty conflicts gracefully');

      // Test with missing frameworks in conflict
      const badConflict = { ...mockValueConflict, frameworks: [] };
      const badResolution = resolutionStrategies.balance.resolve(mockReasoningPaths, [badConflict], mockDilemma);
      assert.deepStrictEqual(badResolution.resolutions, [], 'Should handle missing frameworks gracefully');
    });
  });

  describe('Stakeholder Strategy', () => {
    it('produces a valid resolution object', () => {
      const resolution = resolutionStrategies.stakeholder.resolve(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.ok(resolution, 'Resolution should not be null or undefined');
      assert.ok(resolution.resolutions, 'Resolution should have resolutions array');
      if (resolution.resolutions.length > 0) {
        assert.ok(resolution.resolutions[0].framework, 'Resolution should have a framework');
        assert.ok(resolution.resolutions[0].argument, 'Resolution should have an argument');
        assert.equal(resolution.resolutions[0].resolutionStrategy, 'stakeholder', 'Resolution should have correct strategy type');
      }
    });
  });

  describe('Compromise Strategy', () => {
    it('produces a valid resolution object', () => {
      const resolution = resolutionStrategies.compromise.resolve(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.ok(resolution, 'Resolution should not be null or undefined');
      assert.ok(resolution.resolutions, 'Resolution should have resolutions array');
      if (resolution.resolutions.length > 0) {
        assert.ok(resolution.resolutions[0].framework, 'Resolution should have a framework');
        assert.ok(resolution.resolutions[0].argument, 'Resolution should have an argument');
        assert.equal(resolution.resolutions[0].resolutionStrategy, 'compromise', 'Resolution should have correct strategy type');
      }
    });
  });

  describe('Pluralistic Strategy', () => {
    it('produces a valid resolution object', () => {
      const resolution = resolutionStrategies.pluralistic.resolve(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.ok(resolution, 'Resolution should not be null or undefined');
      assert.ok(resolution.resolutions, 'Resolution should have resolutions array');
      if (resolution.resolutions.length > 0) {
        assert.ok(resolution.resolutions[0].framework, 'Resolution should have a framework');
        assert.ok(resolution.resolutions[0].argument, 'Resolution should have an argument');
        assert.equal(resolution.resolutions[0].resolutionStrategy, 'pluralistic', 'Resolution should have correct strategy type');
      }
    });
  });

  // Test fallback mechanisms
  describe('Fallback Mechanism', () => {
    it('falls back to another strategy when primary fails', () => {
      // Create a situation where the primary strategy would fail
      const nonExistentStrategy = 'nonexistent';
      const result = resolveWithStrategy([mockValueConflict], mockReasoningPaths, mockDilemma, nonExistentStrategy);
      
      assert.ok(result, 'Should still produce a result using fallback');
      assert.ok(result.resolutions, 'Should produce resolutions array');
      // The fallback should have happened in selectResolutionStrategy
    });
  });

  // Test strategy selection logic
  describe('Strategy Selection', () => {
    it('selects appropriate strategy based on options', () => {
      const strategy = selectResolutionStrategy(mockReasoningPaths, [mockValueConflict], mockDilemma, { strategy: 'balance' });
      assert.equal(strategy.type, 'balance', 'Should select the strategy specified in options');
    });

    it('defaults to balance strategy when no strategy is specified', () => {
      const strategy = selectResolutionStrategy(mockReasoningPaths, [mockValueConflict], mockDilemma);
      assert.equal(strategy.type, 'balance', 'Should default to balance strategy');
    });

    it('falls back to fallback strategy for invalid strategy names', () => {
      const strategy = selectResolutionStrategy(mockReasoningPaths, [mockValueConflict], mockDilemma, { strategy: 'invalid' });
      assert.ok(strategy, 'Should return a strategy even when an invalid name is provided');
      assert.equal(strategy.type, 'fallback', 'Should use fallback strategy for invalid names');
    });
  });

  // Test with resolveConflicts function
  describe('Integration with resolveConflicts', () => {
    it('properly resolves conflicts with specified strategy', () => {
      const result = resolveWithStrategy([mockValueConflict], mockReasoningPaths, mockDilemma, 'balance');
      assert.ok(result.resolutions, 'Result should have resolutions array');
      if (result.resolutions.length > 0) {
        assert.equal(result.resolutions[0].resolutionStrategy, 'balance', 'Should use the specified strategy');
      }
    });

    it('handles empty conflicts array', () => {
      const result = resolveWithStrategy([], mockReasoningPaths, mockDilemma, 'balance');
      assert.deepStrictEqual(result.resolutions, [], 'Should return empty resolutions for empty conflicts');
    });

    it('handles empty reasoning paths', () => {
      const result = resolveWithStrategy([mockValueConflict], [], mockDilemma, 'balance');
      assert.deepStrictEqual(result.resolutions, [], 'Should return empty resolutions for empty reasoning paths');
    });
  });
}); 