// Extract coordinates from Google Maps link or direct coordinates
export const extractCoordinates = (input: string): { lat: number; lng: number } | null => {
  try {
    const trimmed = input.trim();

    // Pattern 1: Direct coordinates: "13.7563, 100.5018" or "13.7563,100.5018"
    const directPattern = /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/;
    const directMatch = trimmed.match(directPattern);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      // Validate coordinates range
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    // Pattern 2: https://www.google.com/maps/place/.../@13.7563,100.5018,17z
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = trimmed.match(atPattern);
    if (atMatch) {
      return {
        lat: parseFloat(atMatch[1]),
        lng: parseFloat(atMatch[2])
      };
    }

    // Pattern 3: https://www.google.com/maps?q=13.7563,100.5018
    const qPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = trimmed.match(qPattern);
    if (qMatch) {
      return {
        lat: parseFloat(qMatch[1]),
        lng: parseFloat(qMatch[2])
      };
    }

    // Pattern 4: https://www.google.com/maps/@13.7563,100.5018,17z
    const simpleAtPattern = /\/maps\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const simpleAtMatch = trimmed.match(simpleAtPattern);
    if (simpleAtMatch) {
      return {
        lat: parseFloat(simpleAtMatch[1]),
        lng: parseFloat(simpleAtMatch[2])
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
};
