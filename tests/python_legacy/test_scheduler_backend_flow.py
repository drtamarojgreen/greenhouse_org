import requests
import json
from datetime import datetime, timedelta

# --- Configuration ---
# This would be the base URL of the live Wix site.
# It's a placeholder and needs to be replaced with the actual URL.
WIX_SITE_URL = "https://your-username.wixsite.com/your-site-name"
BASE_URL = f"{WIX_SITE_URL}/_functions"

def run_backend_test():
    """
    This script tests the end-to-end backend flow for the scheduler.
    It simulates a user booking an appointment by calling the Velo backend functions directly.

    NOTE: This is an illustrative script. It requires the 'requests' library
    and the correct WIX_SITE_URL to be configured.
    """
    print("--- Starting Scheduler Backend Flow Test ---")

    try:
        # --- 1. Get Services ---
        print("\nStep 1: Fetching services...")
        services_response = requests.get(f"{BASE_URL}/getServices")
        services_response.raise_for_status()
        services = services_response.json()['services']
        if not services:
            print("No services found. Test cannot proceed.")
            return
        selected_service = services[0]
        print(f"Success. Selected service: '{selected_service['name']}'")

        # --- 2. Get Therapists for the Service ---
        print(f"\nStep 2: Fetching therapists for service ID {selected_service['_id']}...")
        therapists_response = requests.get(f"{BASE_URL}/getTherapistsByService?serviceId={selected_service['_id']}")
        therapists_response.raise_for_status()
        therapists = therapists_response.json()['therapists']
        if not therapists:
            print("No therapists found for this service. Test cannot proceed.")
            return
        selected_therapist = therapists[0]
        print(f"Success. Selected therapist: '{selected_therapist['name']}'")

        # --- 3. Check Availability ---
        # We'll check for appointments tomorrow to have a clean slate.
        tomorrow = datetime.now() + timedelta(days=1)
        start_of_day = tomorrow.replace(hour=0, minute=0, second=0).isoformat()
        end_of_day = tomorrow.replace(hour=23, minute=59, second=59).isoformat()

        print(f"\nStep 3: Checking availability for {selected_therapist['name']} on {tomorrow.date()}...")
        availability_response = requests.get(
            f"{BASE_URL}/getAppointmentsByDateRange?therapistId={selected_therapist['_id']}&startDate={start_of_day}&endDate={end_of_day}"
        )
        availability_response.raise_for_status()
        booked_slots = availability_response.json()['items']
        print(f"Success. Found {len(booked_slots)} existing appointments.")

        # Let's try to book for 10 AM tomorrow.
        booking_time = tomorrow.replace(hour=10, minute=0, second=0)

        # --- 4. Book a New Appointment ---
        print(f"\nStep 4: Attempting to book an appointment for {booking_time}...")
        appointment_payload = {
            "therapistId": selected_therapist['_id'],
            "therapistName": selected_therapist['name'],
            "serviceId": selected_service['_id'],
            "startDate": booking_time.isoformat(),
            "endDate": (booking_time + timedelta(minutes=60)).isoformat(),
            "patientName": "Test User",
            "patientEmail": "test@example.com",
            "patientPhone": "123-456-7890",
            "notes": "This is a test booking from an automated script."
        }

        create_response = requests.post(f"{BASE_URL}/createAppointment", json=appointment_payload)
        create_response.raise_for_status()
        new_appointment = create_response.json()
        print(f"Success. Appointment created with ID: {new_appointment['_id']}")

        # --- 5. Attempt to Double Book ---
        print(f"\nStep 5: Attempting to book the same slot again (should fail)...")
        double_book_response = requests.post(f"{BASE_URL}/createAppointment", json=appointment_payload)

        if double_book_response.status_code == 409:
            print("Success. Received status 409 (Conflict) as expected.")
        else:
            print(f"FAILURE. Expected status 409 but got {double_book_response.status_code}.")

        print("\n--- Test Completed ---")

    except requests.exceptions.RequestException as e:
        print(f"\nAN ERROR OCCURRED: {e}")
        print("Please ensure the WIX_SITE_URL is correct and the site is live.")
    except Exception as e:
        print(f"\nAN UNEXPECTED ERROR OCCURRED: {e}")

if __name__ == "__main__":
    run_backend_test()
