# Schedule Path

This directory holds the frontend Velo code for running the schedule section of the main site.

## How it works

The `Schedule.js` file contains the Velo code that interacts with the backend to manage and display appointments on the `https://greenhousementalhealth.org/schedule/` page.

### Example Velo Code for `Schedule.js`:

```javascript
import { getAppointments } from 'backend/getAppointments';

$w.onReady(function () {
  loadAppointments();
});

async function loadAppointments() {
  try {
    const appointments = await getAppointments();
    // Code to display appointments on the frontend
    console.log("Loaded appointments:", appointments);
  } catch (error) {
    console.error("Error loading appointments:", error);
  }
}
```
