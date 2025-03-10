const { findRelevantPrecedents } = require('../src/similarity');
const assert = require('assert');

describe('Find Relevant Precedents', () => {
    let dilemma;
    let precedentDatabase;

    beforeEach(() => {
        dilemma = {
            title: "Medical Ethics Dilemma",
            description: "A hospital with limited resources must decide how to allocate ventilators during a pandemic. Should they prioritize patients most likely to survive, those who arrived first, younger patients, or use a lottery system?",
            situation: "Limited ventilators during a pandemic",
            possible_actions: [
                { id: 'prioritize_young_patients', description: 'Give ventilators to younger patients first.' },
                { id: 'prioritize_survival_chance', description: 'Give ventilators to those with the highest chance of survival.' },
                { id: 'first_come_first_served', description: 'Give ventilators to patients based on arrival time.' },
                { id: 'random_lottery', description: 'Allocate ventilators randomly.' }
            ]
        };

        precedentDatabase = [
            {
                id: 'trolley_problem',
                title: 'Trolley Problem',
                description: 'A runaway trolley is heading down the tracks toward five people who will be killed if it continues. You can switch the trolley to a side track, but there is one person on that track who will be killed. Should you pull the lever?',
                situation: 'Trolley heading towards people',
                possible_actions: [{ id: 'pull_lever', description: 'Divert the trolley, killing one person to save five.' }, { id: 'do_nothing', description: 'Allow the trolley to continue, killing five people.' }],
                reasoning_paths: [
                    { action: 'pull_lever', principles: ['utilitarianism'], outcomes: ['one_killed', 'five_saved'] },
                    { action: 'do_nothing', principles: ['deontology'], outcomes: ['five_killed', 'one_unharmed'] }
                ]
            },
            {
                id: 'crying_baby_dilemma',
                title: 'Crying Baby Dilemma',
                description: 'During wartime, you are hiding in a basement with a group of people, including a baby. Enemy soldiers are approaching, and if the baby cries, they will discover your hiding place and kill everyone. Should you smother the baby to save yourself and the others?',
                situation: 'Hiding from enemy soldiers',
                possible_actions: [{ id: 'smother_baby', description: 'Smother the baby to silence it.' }, { id: 'do_nothing', description: 'Risk discovery by letting the baby cry.' }],
                reasoning_paths: [
                    { action: 'smother_baby', principles: ['utilitarianism'], outcomes: ['baby_killed', 'others_saved'] },
                    { action: 'do_nothing', principles: ['deontology'], outcomes: ['everyone_killed'] }
                ]
            },
            {
                id: 'transplant_dilemma',
                title: 'Transplant Dilemma',
                description: 'You are a doctor with five patients who need organ transplants. Each needs a different organ, and all will die without the transplant. A healthy patient walks in for a checkup.  Should you kill the healthy patient and use their organs to save the five?',
                situation: 'Five patients need organs; one healthy patient available.',
                possible_actions: [{id: "take_organs", description: "Kill healthy patient and take organs."}, {id: "do_nothing", description: "Do not take organs."}],
                reasoning_paths: [
                    {action: "take_organs", principles: ["utilitarianism"], outcomes: ["five_saved", "one_killed"]},
                    {action: "do_nothing", principles: ["deontology"], outcomes: ["five_die", "one_lives"]}
                ]

            },
            {
                id: 'medical_triage',
                title: 'Medical Triage',
                description: 'In a mass casualty event, doctors must decide which patients to treat first when resources are limited.  Should they prioritize those with the best chance of survival, the most severely injured, or treat on a first-come, first-served basis?',
                situation: 'Mass casualty event with limited resources.',
                possible_actions: [{id: "prioritize_survival", description: "Treat those most likely to survive"}, {id: "prioritize_severe", description: "Treat the most severely injured"}, {id:"first_come", description: "Treat based on arrival order"}],
                reasoning_paths: [
                    {action: "prioritize_survival", principles: ["utilitarianism"], outcomes: ["more_survivors"]},
                    {action: "prioritize_severe", principles: ["fairness"], outcomes: ["most_severe_treated"]},
                    {action: "first_come", principles: ["equality"], outcomes: ["orderly_treatment"]}
                ]
            }

        ];
    });


    it('should find precedents above the threshold', async () => {
        const threshold = 0.2;
        const relevantPrecedents = await findRelevantPrecedents(dilemma, precedentDatabase, threshold);

        assert.ok(relevantPrecedents.length > 0, 'No precedents found above threshold');
        assert.ok(relevantPrecedents.every(p => p.totalSimilarityScore >= threshold), 'Precedent found below threshold');
         //Added title checks
        assert.ok(relevantPrecedents.every(p => typeof p.title === 'string' && p.title.length > 0), 'Precedent found without a valid title');
    });

    it('should find more medical precedents with adjusted description weight', async () => {
        const threshold = 0.2;
        const relevantPrecedentsDefault = await findRelevantPrecedents(dilemma, precedentDatabase, threshold);
        const relevantPrecedentsAdjusted = await findRelevantPrecedents(dilemma, precedentDatabase, threshold, { descriptionWeight: 0.3, titleWeight: 0.7 });

        assert.ok(relevantPrecedentsAdjusted.length >= relevantPrecedentsDefault.length, 'Fewer precedents found with adjusted description weight');
        //Added title checks
        assert.ok(relevantPrecedentsAdjusted.every(p => typeof p.title === 'string' && p.title.length > 0), 'Precedent found without a valid title');
    });


    it('should find more medical precedents with adjusted action weight', async () => {
        const threshold = 0.3; // Higher threshold
        const relevantPrecedentsDefault = await findRelevantPrecedents(dilemma, precedentDatabase, threshold);
        const relevantPrecedentsAdjusted = await findRelevantPrecedents(dilemma, precedentDatabase, threshold, { actionWeight: 0.8 });

        assert.ok(relevantPrecedentsAdjusted.length >= relevantPrecedentsDefault.length, "Fewer medical precedents found with higher action weight.");
          //Added title checks
        assert.ok(relevantPrecedentsAdjusted.every(p => typeof p.title === 'string' && p.title.length > 0), 'Precedent found without a valid title');
    });



    it('should handle empty or null inputs gracefully', async () => {
        const emptyDilemma = {};
        const nullPrecedents = null;

        const result1 = await findRelevantPrecedents(emptyDilemma, precedentDatabase, 0.2);
        assert.deepStrictEqual(result1, [], 'Should return empty array for empty dilemma');

        const result2 = await findRelevantPrecedents(dilemma, nullPrecedents, 0.2);
        assert.deepStrictEqual(result2, [], 'Should return empty array for null precedents');

        const result3 = await findRelevantPrecedents(null, precedentDatabase, 0.2);
        assert.deepStrictEqual(result3, [], 'Should return empty array for null dilemma');

    });

    it('should handle precedents with empty reasoning paths array', async () => {
        const threshold = 0.2;
        //Precedent with empty array
        precedentDatabase.push({
            id: 'empty_reasoning_paths',
            title: 'Empty Reasoning Paths',
            description: 'A test precedent with empty reasoning paths',
            situation: 'test',
            possible_actions: [{id:'test_action', description: 'test'}],
            reasoning_paths: [] // Empty array
        });

        const relevantPrecedents = await findRelevantPrecedents(dilemma, precedentDatabase, threshold);

        assert.ok(relevantPrecedents.length > 0, 'No precedents found with valid reasoning paths');
        assert.ok(relevantPrecedents.every(p => p.totalSimilarityScore >= threshold), 'Precedent found below threshold');
        // Check to ensure the precedent with empty reasoning_paths is NOT included
        assert.ok(!relevantPrecedents.some(p => p.id === 'empty_reasoning_paths'), 'Precedent with empty reasoning paths was included');
        //Added title checks
        assert.ok(relevantPrecedents.every(p => typeof p.title === 'string' && p.title.length > 0), 'Precedent found without a valid title');

    });

});
