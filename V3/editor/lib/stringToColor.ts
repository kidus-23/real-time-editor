function stringToColor(str: string) {
    // Predefined vibrant colors for better visual distinction
    const vibrantColors = [
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#45B7D1", // Blue
        "#96CEB4", // Green
        "#FECA57", // Yellow
        "#FF9FF3", // Pink
        "#54A0FF", // Light Blue
        "#5F27CD", // Purple
        "#00D2D3", // Cyan
        "#FF9F43", // Orange
        "#10AC84", // Mint
        "#EE5A24", // Red Orange
        "#0984E3", // Blue
        "#6C5CE7", // Violet
        "#A29BFE", // Light Purple
        "#FD79A8", // Pink
        "#E17055", // Salmon
        "#00B894", // Green
        "#FDCB6E", // Light Orange
        "#E84393", // Magenta
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use modulo to select from predefined colors for more consistent, vibrant results
    const colorIndex = Math.abs(hash) % vibrantColors.length;
    return vibrantColors[colorIndex];
}

export default stringToColor;