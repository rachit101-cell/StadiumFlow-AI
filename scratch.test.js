import { describe, it, expect } from 'vitest';
import { streamGeminiResponse } from './src/services/gemini';
import { INITIAL_VENUE_STATE } from './src/contexts/VenueContext.jsx';

describe('streamGeminiResponse test', () => {
  it('does not throw an exception on Nearest washroom', async () => {
    const venueState = INITIAL_VENUE_STATE;
    const userProfile = {
      role: 'attendee',
      seatSection: 'A',
      accessibilityMode: false,
      wheelchairMode: false,
      familyGroupMode: false,
      foodPreference: 'any'
    };

    let chunks = [];
    try {
      for await (const chunk of streamGeminiResponse("Nearest washroom", "attendee", venueState, userProfile)) {
        chunks.push(chunk);
      }
      console.log('Result:', chunks);
      expect(chunks.length).toBeGreaterThan(0);
    } catch(e) {
      console.error("CAUGHT EXCEPTION:", e);
      throw e;
    }
  });
});
