import unittest
from datetime import date, datetime, timedelta

from application.interface.backend.utils.validators import Validators, ValidationError

class TestValidators(unittest.TestCase):

    def test_validate_email(self):
        # Test valid emails
        self.assertTrue(Validators.validate_email('test@example.com'))
        self.assertTrue(Validators.validate_email('test.name@example.co.uk'))

        # Test invalid emails
        with self.assertRaises(ValidationError):
            Validators.validate_email('test@example')
        with self.assertRaises(ValidationError):
            Validators.validate_email('test@.com')
        with self.assertRaises(ValidationError):
            Validators.validate_email('test')
        with self.assertRaises(ValidationError):
            Validators.validate_email(None)
        with self.assertRaises(ValidationError):
            Validators.validate_email('')

    def test_validate_password(self):
        # Test valid password with default policy
        self.assertTrue(Validators.validate_password('Password123!'))

        # Test invalid passwords with default policy
        with self.assertRaises(ValidationError):
            Validators.validate_password('short')  # Too short
        with self.assertRaises(ValidationError):
            Validators.validate_password('password123!')  # No uppercase
        with self.assertRaises(ValidationError):
            Validators.validate_password('Password!')  # No number
        with self.assertRaises(ValidationError):
            Validators.validate_password('Password123')  # No special character
        with self.assertRaises(ValidationError):
            Validators.validate_password(None)
        with self.assertRaises(ValidationError):
            Validators.validate_password('')

    def test_validate_date_of_birth(self):
        # Test valid date of birth
        self.assertTrue(Validators.validate_date_of_birth('2000-01-01'))
        self.assertTrue(Validators.validate_date_of_birth(date(2000, 1, 1)))

        # Test future date
        future_date = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        with self.assertRaises(ValidationError):
            Validators.validate_date_of_birth(future_date)

        # Test invalid format
        with self.assertRaises(ValidationError):
            Validators.validate_date_of_birth('01-01-2000')

        # Test unreasonable age
        with self.assertRaises(ValidationError):
            Validators.validate_date_of_birth('1800-01-01')

        with self.assertRaises(ValidationError):
            Validators.validate_date_of_birth(None)

    def test_validate_phone(self):
        self.assertTrue(Validators.validate_phone(None)) # Optional
        self.assertTrue(Validators.validate_phone('123-456-7890'))
        self.assertTrue(Validators.validate_phone('(123) 456-7890'))
        with self.assertRaises(ValidationError):
            Validators.validate_phone('123')

    def test_validate_heart_rate(self):
        self.assertTrue(Validators.validate_heart_rate(None)) # Optional
        self.assertTrue(Validators.validate_heart_rate(80))
        with self.assertRaises(ValidationError):
            Validators.validate_heart_rate(20) # Too low
        with self.assertRaises(ValidationError):
            Validators.validate_heart_rate(300) # Too high
        with self.assertRaises(ValidationError):
            Validators.validate_heart_rate("80") # Invalid type

    def test_validate_blood_pressure(self):
        self.assertTrue(Validators.validate_blood_pressure(None)) # Optional
        self.assertTrue(Validators.validate_blood_pressure('120/80'))
        with self.assertRaises(ValidationError):
            Validators.validate_blood_pressure('120-80') # Invalid format
        with self.assertRaises(ValidationError):
            Validators.validate_blood_pressure('300/80') # Systolic too high
        with self.assertRaises(ValidationError):
            Validators.validate_blood_pressure('120/20') # Diastolic too low
        with self.assertRaises(ValidationError):
            Validators.validate_blood_pressure('120/130') # Systolic not > Diastolic

    def test_validate_score_range(self):
        self.assertTrue(Validators.validate_score_range(5, 0, 10))
        with self.assertRaises(ValidationError):
            Validators.validate_score_range(11, 0, 10)
        with self.assertRaises(ValidationError):
            Validators.validate_score_range(None, 0, 10)

    def test_validate_gender(self):
        self.assertTrue(Validators.validate_gender(None)) # Optional
        self.assertTrue(Validators.validate_gender('male'))
        self.assertTrue(Validators.validate_gender('FEMALE'))
        with self.assertRaises(ValidationError):
            Validators.validate_gender('robot')

    def test_validate_appointment_time(self):
        future_time = datetime.now() + timedelta(hours=1)
        past_time = datetime.now() - timedelta(hours=1)
        self.assertTrue(Validators.validate_appointment_time(future_time))
        with self.assertRaises(ValidationError):
            Validators.validate_appointment_time(past_time)
        with self.assertRaises(ValidationError):
            Validators.validate_appointment_time(None)

    def test_validate_duration(self):
        self.assertTrue(Validators.validate_duration(None)) # Optional
        self.assertTrue(Validators.validate_duration(60))
        with self.assertRaises(ValidationError):
            Validators.validate_duration(0)
        with self.assertRaises(ValidationError):
            Validators.validate_duration(1000) # Too long
        with self.assertRaises(ValidationError):
            Validators.validate_duration("60")

if __name__ == '__main__':
    unittest.main()
