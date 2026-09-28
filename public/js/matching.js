/**
 * CampusFind - AI Smart Match Engine
 * Calculates weighted similarity between Lost and Found reports
 * SIH 2026 Showcase Prototype
 */
window.MatchingEngine = {
    // Stop words to remove from keyword extraction
    stopWords: new Set([
        'the', 'a', 'an', 'in', 'on', 'at', 'with', 'for', 'by', 'of', 'and', 'or',
        'is', 'was', 'to', 'near', 'under', 'desk', 'room', 'block', 'floor', 'hall',
        'case', 'pro', 'gen', 'white', 'black', 'blue', 'red', 'new', 'old'
    ]),

    extractTokens(text) {
        if (!text) return new Set();
        return new Set(
            text.toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2 && !this.stopWords.has(word))
        );
    },

    calculateSimilarity(lostItem, foundItem) {
        // Only match opposite item types
        if (lostItem.type === foundItem.type) return { score: 0, matchedFeatures: [] };

        let score = 0;
        const matchedFeatures = [];

        // 1. Category Match (35 points)
        if (lostItem.category && foundItem.category &&
            lostItem.category.toLowerCase() === foundItem.category.toLowerCase()) {
            score += 35;
            matchedFeatures.push({ name: 'Category Match', desc: lostItem.category, weight: '+35%' });
        }

        // 2. Campus Location Proximity (25 points)
        if (lostItem.location && foundItem.location &&
            lostItem.location.toLowerCase() === foundItem.location.toLowerCase()) {
            score += 25;
            matchedFeatures.push({ name: 'Location Proximity', desc: `Same location: ${lostItem.location}`, weight: '+25%' });
        } else if (
            (lostItem.location && foundItem.location_detail && foundItem.location_detail.toLowerCase().includes(lostItem.location.toLowerCase())) ||
            (foundItem.location && lostItem.location_detail && lostItem.location_detail.toLowerCase().includes(foundItem.location.toLowerCase()))
        ) {
            score += 15;
            matchedFeatures.push({ name: 'Location Proximity', desc: 'Adjacent campus sector', weight: '+15%' });
        }

        // 3. Item Name & Keyword Overlap (Up to 30 points)
        const nameTokensA = this.extractTokens(lostItem.item_name);
        const nameTokensB = this.extractTokens(foundItem.item_name);
        
        let tokenOverlap = 0;
        nameTokensA.forEach(t => {
            if (nameTokensB.has(t)) tokenOverlap++;
        });

        if (tokenOverlap > 0) {
            const overlapScore = Math.min(30, tokenOverlap * 15);
            score += overlapScore;
            matchedFeatures.push({ name: 'Keyword Similarity', desc: `${tokenOverlap} matching identifiers in title`, weight: `+${overlapScore}%` });
        }

        // 4. Description Content Overlap (Up to 10 points)
        const descTokensA = this.extractTokens(lostItem.description);
        const descTokensB = this.extractTokens(foundItem.description);
        let descOverlap = 0;
        descTokensA.forEach(t => {
            if (descTokensB.has(t)) descOverlap++;
        });
        if (descOverlap > 0) {
            const descScore = Math.min(10, descOverlap * 5);
            score += descScore;
            matchedFeatures.push({ name: 'Attribute Match', desc: 'Matching description characteristics', weight: `+${descScore}%` });
        }

        // Cap at 98% for realistic AI match presentation
        const finalScore = Math.min(98, Math.max(0, score));

        return {
            score: finalScore,
            isStrongMatch: finalScore >= 60,
            matchedFeatures: matchedFeatures
        };
    },

    findCandidateMatches(targetItem, allItems) {
        if (!targetItem) return [];
        const oppositeType = targetItem.type === 'lost' ? 'found' : 'lost';

        return allItems
            .filter(item => item.item_id !== targetItem.item_id && item.type === oppositeType && item.status !== 'returned')
            .map(candidate => {
                const matchResult = this.calculateSimilarity(targetItem, candidate);
                return {
                    candidate,
                    score: matchResult.score,
                    isStrongMatch: matchResult.isStrongMatch,
                    matchedFeatures: matchResult.matchedFeatures
                };
            })
            .filter(res => res.score >= 35)
            .sort((a, b) => b.score - a.score);
    }
};
