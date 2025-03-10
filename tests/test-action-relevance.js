/**
 * test-action-relevance.js
 * 
 * Tests for the actionRelevanceScore function, which calculates
 * how relevant an action is to a specific dilemma using cosine similarity.
 */

const assert = require('assert');
const {
  actionRelevanceScore,
  extractDilemmaText,
  prepareActionText,
  calculateCosineSimilarity,
  tokenizeAndNormalize,
  createTermFrequencyVector,
  applyContextualBoosting
} = require('../src/utils.js');

describe('Action Relevance Score', () => {
  // Sample dilemmas for testing
  const surveillanceDilemma = {
    title: "Public Surveillance Ethics",
    description: "A city is considering implementing facial recognition surveillance in public spaces to reduce crime. Privacy advocates argue this violates civil liberties, while security experts point to potential safety benefits.",
    contexts: ["privacy", "security", "technology", "urban", "surveillance"],
    parameters: {
      privacy_impact: 0.8,
      technology_accuracy: 0.75,
      crime_rate: 0.6,
      alternatives_exhausted: 0.4
    }
  };
  
  const medicalDilemma = {
    title: "Medical Resource Allocation",
    description: "A hospital with limited resources must decide how to allocate life-saving treatments during a crisis. Some argue for prioritizing those most likely to survive, while others advocate for equal access regardless of prognosis.",
    contexts: ["healthcare", "resource allocation", "emergency", "medical ethics"],
    parameters: {
      resource_scarcity: 0.9,
      survival_difference: 0.7,
      vulnerable_populations: 0.8
    }
  };

  describe('Core Function', () => {
    it('should return a number between 0 and 1', async () => {
      const score = await actionRelevanceScore(
        surveillanceDilemma, 
        'implement_surveillance_system',
        { description: "A security system was implemented with privacy protections." }
      );
      assert.ok(typeof score === 'number', 'Score should be a number');
      assert.ok(score >= 0 && score <= 1, 'Score should be between 0 and 1');
    });

    it('should give higher scores to actions relevant to the dilemma', async () => {
      const relevantAction = 'implement_facial_recognition_cameras';
      const irrelevantAction = 'increase_hospital_funding';
      
      const relevantScore = await actionRelevanceScore(
        surveillanceDilemma, 
        relevantAction,
        { description: "Surveillance cameras were installed in public areas." }
      );
      
      const irrelevantScore = await actionRelevanceScore(
        surveillanceDilemma, 
        irrelevantAction,
        { description: "Hospital funding was increased for better care." }
      );
      
      assert.ok(relevantScore > irrelevantScore, 'Relevant action should score higher');
    });

    it('should handle empty or undefined inputs gracefully', async () => {
      const emptyActionScore = await actionRelevanceScore(
        surveillanceDilemma, 
        '',
        { description: "Some precedent description" }
      );
      
      const undefinedActionScore = await actionRelevanceScore(
        surveillanceDilemma, 
        undefined,
        { description: "Some precedent description" }
      );
      
      const emptyDilemmaScore = await actionRelevanceScore(
        {}, 
        'test_action',
        { description: "Some precedent description" }
      );
      
      const undefinedDilemmaScore = await actionRelevanceScore(
        undefined, 
        'test_action',
        { description: "Some precedent description" }
      );
      
      assert.strictEqual(emptyActionScore, 0.5, 'Empty action should return default score');
      assert.strictEqual(undefinedActionScore, 0.5, 'Undefined action should return default score');
      assert.strictEqual(emptyDilemmaScore, 0.5, 'Empty dilemma should return default score');
      assert.strictEqual(undefinedDilemmaScore, 0.5, 'Undefined dilemma should return default score');
    });
  });

  describe('extractDilemmaText', () => {
    it('should extract text from dilemma components', () => {
      const text = extractDilemmaText(surveillanceDilemma);
      
      assert.ok(text.includes(surveillanceDilemma.title), 'Should include title');
      assert.ok(text.includes(surveillanceDilemma.description), 'Should include description');
      assert.ok(surveillanceDilemma.contexts.every(context => text.includes(context)), 'Should include all contexts');
    });

    it('should handle missing components gracefully', () => {
      const partialDilemma = {
        title: "Partial Dilemma",
        // Missing description and contexts
      };
      
      const text = extractDilemmaText(partialDilemma);
      assert.strictEqual(text, "Partial Dilemma", 'Should extract available components');
      
      const emptyText = extractDilemmaText({});
      assert.strictEqual(emptyText, "general ethical considerations", 'Should return default string for empty dilemma');
    });
  });

  describe('prepareActionText', () => {
    it('should convert snake_case to spaces', () => {
      const result = prepareActionText('implement_surveillance_system');
      assert.strictEqual(result, 'implement surveillance system', 'Should replace underscores with spaces');
    });

    it('should expand abbreviations when option is enabled', () => {
      const result = prepareActionText('impl_tech_sys', { expandAbbreviations: true });
      assert.ok(result.includes('implement'), 'Should expand impl to implement');
      assert.ok(result.includes('technology'), 'Should expand tech to technology');
      assert.ok(result.includes('system'), 'Should expand sys to system');
    });

    it('should not expand abbreviations when option is disabled', () => {
      const result = prepareActionText('impl_tech_sys', { expandAbbreviations: false });
      assert.strictEqual(result, 'impl tech sys', 'Should not expand abbreviations');
    });

    it('should not expand abbreviations when option is missing', () => {
      const result = prepareActionText('impl_tech_sys');
      assert.strictEqual(result, 'impl tech sys', 'Should not expand abbreviations');
    });
  });

  describe('calculateCosineSimilarity', () => {
    it('should return 1 for identical texts', () => {
      const text = "This is a test";
      const similarity = calculateCosineSimilarity(text, text);
      assert.strictEqual(similarity, 1, 'Identical texts should have similarity of 1');
    });

    it('should return 0 for completely different texts', () => {
      const text1 = "facial recognition surveillance privacy";
      const text2 = "banana apple orange fruit";
      const similarity = calculateCosineSimilarity(text1, text2);
      assert.strictEqual(similarity, 0, 'Completely different texts should have similarity of 0');
    });

    it('should return values between 0 and 1 for partially similar texts', () => {
      const text1 = "privacy concerns in public surveillance";
      const text2 = "surveillance systems monitor public spaces";
      const similarity = calculateCosineSimilarity(text1, text2);
      
      assert.ok(similarity > 0 && similarity < 1, 'Partially similar texts should have similarity between 0 and 1');
    });
  });

  describe('tokenizeAndNormalize', () => {
    it('should convert to lowercase and remove stopwords', () => {
      const tokens = tokenizeAndNormalize('The Privacy and Security Issues are important');
      
      // Should not contain 'the', 'and', 'are'
      assert.ok(!tokens.includes('the'), 'Should remove stopword "the"');
      assert.ok(!tokens.includes('and'), 'Should remove stopword "and"');
      assert.ok(!tokens.includes('are'), 'Should remove stopword "are"');
      
      // Should contain lowercase versions of content words
      assert.ok(tokens.includes('privacy'), 'Should include "privacy"');
      assert.ok(tokens.includes('security'), 'Should include "security"');
      assert.ok(tokens.includes('issues'), 'Should include "issues"');
      assert.ok(tokens.includes('important'), 'Should include "important"');
    });

    it('should handle empty strings', () => {
      const tokens = tokenizeAndNormalize('');
      assert.deepStrictEqual(tokens, [], 'Should return empty array for empty string');
    });
  });

  describe('createTermFrequencyVector', () => {
    it('should count term frequencies correctly', () => {
      const tokens = ['privacy', 'security', 'privacy', 'surveillance', 'privacy'];
      const vector = createTermFrequencyVector(tokens);
      
      assert.strictEqual(vector['privacy'], 3, 'Should count 3 occurrences of "privacy"');
      assert.strictEqual(vector['security'], 1, 'Should count 1 occurrence of "security"');
      assert.strictEqual(vector['surveillance'], 1, 'Should count 1 occurrence of "surveillance"');
    });
  });

  describe('applyContextualBoosting', () => {
    it('should boost score for relevant parameters', async () => {
      const baseScore = 0.5;
      const action = 'implement privacy protection measures';
      const boostedScore = applyContextualBoosting(baseScore, action, surveillanceDilemma);
      
      assert.ok(boostedScore > baseScore, 'Score should be boosted for relevant action');
    });

    it('should boost score more for actions mentioned in description', async () => {
      const baseScore = 0.5;
      const mentionedAction = 'implement facial recognition surveillance';
      const unmentionedAction = 'create ethical guidelines document';
      
      const mentionedScore = applyContextualBoosting(baseScore, mentionedAction, surveillanceDilemma);
      const unmentionedScore = applyContextualBoosting(baseScore, unmentionedAction, surveillanceDilemma);
      
      assert.ok(mentionedScore > unmentionedScore, 'Actions mentioned in description should get higher boost');
    });
  });

  describe('Integration Tests', () => {
    it('should rank actions appropriately for surveillance dilemma', async () => {
      const actions = [
        'implement_facial_recognition',
        'develop_privacy_guidelines',
        'increase_police_patrols',
        'fund_medical_research'
      ];
      
      const precedent = { 
        description: "A city implemented a surveillance system with privacy protections." 
      };
      
      const scores = [];
      for (const action of actions) {
        const score = await actionRelevanceScore(
          surveillanceDilemma, 
          action, 
          precedent
        );
        scores.push({ action, score });
      }
      
      // Sort by score in descending order
      scores.sort((a, b) => b.score - a.score);
      
      // The first two should be surveillance-related, the last should be medical
      assert.ok(scores[0].action.includes('facial') || scores[0].action.includes('privacy'), 
        'Facial recognition or privacy should be most relevant');
      assert.strictEqual(scores[scores.length - 1].action, 'fund_medical_research', 
        'Medical research should be least relevant to surveillance dilemma');
    });

    it('should rank actions appropriately for medical dilemma', async () => {
      const actions = [
        'implement_facial_recognition',
        'develop_triage_protocol',
        'allocate_ventilators_fairly',
        'fund_medical_research'
      ];
      
      const precedent = { 
        description: "A hospital developed protocols for allocating resources during a pandemic." 
      };
      
      const scores = [];
      for (const action of actions) {
        const score = await actionRelevanceScore(
          medicalDilemma, 
          action, 
          precedent
        );
        scores.push({ action, score });
      }
      
      // Sort by score in descending order
      scores.sort((a, b) => b.score - a.score);
      
      // Medical-related actions should rank higher
      assert.ok(
        scores[0].action.includes('medical') || 
        scores[0].action.includes('triage') || 
        scores[0].action.includes('ventilators'), 
        'Medical actions should be most relevant'
      );
      assert.strictEqual(scores[scores.length - 1].action, 'implement_facial_recognition', 
        'Facial recognition should be least relevant to medical dilemma');
    });
  });
});
