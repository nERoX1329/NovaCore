// --- Helper function to get computed CSS variable values ---
export function getCssVar(varName) {
    try {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    } catch (e) {
        console.warn(`Could not get CSS variable ${varName}. Using fallback. Error: ${e}`);
        // Provide sensible fallbacks if CSS variables are not found
        if (varName === '--player-color') return '#00FFFF';
        if (varName === '--bullet-color') return '#FFFF00';
        if (varName === '--enemy-color1') return '#FF0000';
        if (varName === '--enemy-color2') return '#800080';
        if (varName === '--xp-orb-color') return '#40E0D0';
        if (varName === '--health-bar-bg') return '#5a0000';
        if (varName === '--health-bar-fg') return '#ff0000';
        return '#FFFFFF'; // Default fallback
    }
}
