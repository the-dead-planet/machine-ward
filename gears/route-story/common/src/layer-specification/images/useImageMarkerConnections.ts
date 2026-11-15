import { useMemo } from "react";
import { ImageMarkerSource } from "./images-sources";
import { getImageMarkerConnections } from "./grouped-image-source";

export const useImageMarkerConnections = (
    original: ImageMarkerSource,
    grouped: ImageMarkerSource,
) => {
    const connections = getImageMarkerConnections(original, grouped);
    const geometryKey = JSON.stringify(connections);
    
    // Preserve source identity when selection or thumbnail size changes without moving a line.
    return useMemo(() => connections, [geometryKey]);
};
