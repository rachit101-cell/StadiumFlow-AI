import { streamGeminiResponse } from './src/services/gemini.js';
import { INITIAL_VENUE_STATE } from './src/constants/venue.js';

const venueState = INITIAL_VENUE_STATE;
const userProfile = {
  role: 'attendee',
  seatSection: 'A',
  accessibilityMode: false,
  wheelchairMode: false,
  familyGroupMode: false,
  foodPreference: 'any'
};

async function test() {
  try {
    for await (const chunk of streamGeminiResponse("Nearest washroom", "attendee", venueState, userProfile)) {
      console.log("Got chunk:", chunk);
    }
  } catch(e) {
    console.error("CAUGHT EXCEPTION:", e);
  }
}

test();
