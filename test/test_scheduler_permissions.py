#!/usr/bin/env python3
"""
Test suite for scheduler permissions backend implementation
Tests the secure web modules for proper permission validation
"""

import json
import sys
import os
from datetime import datetime, timedelta

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class SchedulerPermissionsTest:
    """Test class for scheduler permissions backend"""
    
    def __init__(self):
        self.test_results = []
        self.passed = 0
        self.failed = 0
    
    def log_test(self, test_name, passed, message=""):
        """Log test result"""
        status = "PASS" if passed else "FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if passed:
            self.passed += 1
            print(f"✓ {test_name}: {status}")
        else:
            self.failed += 1
            print(f"✗ {test_name}: {status} - {message}")
    
    def test_permissions_module_structure(self):
        """Test that permissions.web.js has correct structure"""
        try:
            permissions_file = "apps/wv/backend/permissions.web.js"
            
            if not os.path.exists(permissions_file):
                self.log_test("Permissions Module Exists", False, "permissions.web.js not found")
                return
            
            with open(permissions_file, 'r') as f:
                content = f.read()
            
            # Check for required imports
            required_imports = [
                "import { webMethod, Permissions } from 'wix-web-module'",
                "import wixUsersBackend from 'wix-users-backend'"
            ]
            
            for import_stmt in required_imports:
                if import_stmt not in content:
                    self.log_test("Permissions Module Structure", False, f"Missing import: {import_stmt}")
                    return
            
            # Check for required functions
            required_functions = [
                "isCurrentUserAdmin",
                "isCurrentUserLoggedIn",
                "getCurrentUserRoles",
                "validateAdminPermissions",
                "validateMemberPermissions",
                "getCurrentUserId"
            ]
            
            for func in required_functions:
                if f"export const {func}" not in content:
                    self.log_test("Permissions Module Structure", False, f"Missing function: {func}")
                    return
            
            self.log_test("Permissions Module Structure", True, "All required components present")
            
        except Exception as e:
            self.log_test("Permissions Module Structure", False, str(e))
    
    def test_secure_appointments_module(self):
        """Test that getAppointmentsSecure.web.js has correct structure"""
        try:
            appointments_file = "apps/wv/backend/getAppointmentsSecure.web.js"
            
            if not os.path.exists(appointments_file):
                self.log_test("Secure Appointments Module Exists", False, "getAppointmentsSecure.web.js not found")
                return
            
            with open(appointments_file, 'r') as f:
                content = f.read()
            
            # Check for security validations
            security_checks = [
                "const roles = await wixUsersBackend.currentUser.getRoles()",
                "const isAdmin = roles.some(r => r.name === \"Administrator\" || r.name === \"Developer\")",
                "Permission Denied"
            ]
            
            for check in security_checks:
                if check not in content:
                    self.log_test("Secure Appointments Module", False, f"Missing security check: {check}")
                    return
            
            # Check for required functions
            required_functions = [
                "getAppointments",
                "getPublicAvailability", 
                "getUserAppointments"
            ]
            
            for func in required_functions:
                if f"export const {func}" not in content:
                    self.log_test("Secure Appointments Module", False, f"Missing function: {func}")
                    return
            
            self.log_test("Secure Appointments Module", True, "All security checks and functions present")
            
        except Exception as e:
            self.log_test("Secure Appointments Module", False, str(e))
    
    def test_secure_conflict_resolution_module(self):
        """Test that resolveConflictSecure.web.js has correct structure"""
        try:
            conflict_file = "apps/wv/backend/resolveConflictSecure.web.js"
            
            if not os.path.exists(conflict_file):
                self.log_test("Secure Conflict Resolution Module Exists", False, "resolveConflictSecure.web.js not found")
                return
            
            with open(conflict_file, 'r') as f:
                content = f.read()
            
            # Check for admin-only validations
            admin_checks = [
                "const isAdmin = roles.some(r => r.name === \"Administrator\" || r.name === \"Developer\")",
                "if (!isAdmin) {",
                "throw new Error(\"Permission Denied: You cannot perform this action.\")"
            ]
            
            for check in admin_checks:
                if check not in content:
                    self.log_test("Secure Conflict Resolution Module", False, f"Missing admin check: {check}")
                    return
            
            # Check for audit logging
            audit_checks = [
                "ConflictResolutionLog",
                "adminAction: true"
            ]
            
            for check in audit_checks:
                if check not in content:
                    self.log_test("Secure Conflict Resolution Module", False, f"Missing audit feature: {check}")
                    return
            
            self.log_test("Secure Conflict Resolution Module", True, "All admin checks and audit features present")
            
        except Exception as e:
            self.log_test("Secure Conflict Resolution Module", False, str(e))
    
    def test_secure_appointment_creation_module(self):
        """Test that createAppointmentSecure.web.js has correct structure"""
        try:
            create_file = "apps/wv/backend/createAppointmentSecure.web.js"
            
            if not os.path.exists(create_file):
                self.log_test("Secure Appointment Creation Module Exists", False, "createAppointmentSecure.web.js not found")
                return
            
            with open(create_file, 'r') as f:
                content = f.read()
            
            # Check for permission validations
            permission_checks = [
                "const isAdmin = roles.some(r => r.name === \"Administrator\" || r.name === \"Developer\")",
                "if (!isAdmin && appointmentData.patientId && appointmentData.patientId !== userId)",
                "Permission Denied: You can only create appointments for yourself"
            ]
            
            for check in permission_checks:
                if check not in content:
                    self.log_test("Secure Appointment Creation Module", False, f"Missing permission check: {check}")
                    return
            
            # Check for business logic validations
            business_checks = [
                "Check for double booking",
                "Check user's appointment limits",
                "AppointmentAuditLog"
            ]
            
            for check in business_checks:
                if check not in content:
                    self.log_test("Secure Appointment Creation Module", False, f"Missing business logic: {check}")
                    return
            
            # Check for required functions
            required_functions = [
                "createAppointment",
                "updateAppointment",
                "cancelAppointment"
            ]
            
            for func in required_functions:
                if f"export const {func}" not in content:
                    self.log_test("Secure Appointment Creation Module", False, f"Missing function: {func}")
                    return
            
            self.log_test("Secure Appointment Creation Module", True, "All security and business logic checks present")
            
        except Exception as e:
            self.log_test("Secure Appointment Creation Module", False, str(e))
    
    def test_web_module_format(self):
        """Test that all modules use proper web module format"""
        try:
            web_modules = [
                "apps/wv/backend/permissions.web.js",
                "apps/wv/backend/getAppointmentsSecure.web.js",
                "apps/wv/backend/resolveConflictSecure.web.js",
                "apps/wv/backend/createAppointmentSecure.web.js"
            ]
            
            for module_path in web_modules:
                if not os.path.exists(module_path):
                    continue
                
                with open(module_path, 'r') as f:
                    content = f.read()
                
                # Check for web module format
                if "webMethod(Permissions." not in content:
                    self.log_test("Web Module Format", False, f"{module_path} missing webMethod format")
                    return
                
                if "export const" not in content:
                    self.log_test("Web Module Format", False, f"{module_path} missing proper exports")
                    return
            
            self.log_test("Web Module Format", True, "All modules use proper web module format")
            
        except Exception as e:
            self.log_test("Web Module Format", False, str(e))
    
    def test_security_best_practices(self):
        """Test that security best practices are implemented"""
        try:
            security_files = [
                "apps/wv/backend/getAppointmentsSecure.web.js",
                "apps/wv/backend/resolveConflictSecure.web.js",
                "apps/wv/backend/createAppointmentSecure.web.js"
            ]
            
            security_patterns = [
                "wixUsersBackend.currentUser.getRoles()",  # Server-side role validation
                "Permission Denied",  # Proper error messages
                "console.log",  # Logging for debugging
                "try {",  # Error handling
                "catch (error)"  # Error handling
            ]
            
            for file_path in security_files:
                if not os.path.exists(file_path):
                    continue
                
                with open(file_path, 'r') as f:
                    content = f.read()
                
                for pattern in security_patterns:
                    if pattern not in content:
                        self.log_test("Security Best Practices", False, f"{file_path} missing: {pattern}")
                        return
            
            self.log_test("Security Best Practices", True, "All security best practices implemented")
            
        except Exception as e:
            self.log_test("Security Best Practices", False, str(e))
    
    def test_documentation_compliance(self):
        """Test that implementation follows documentation requirements"""
        try:
            # Check that secure versions exist alongside original files
            original_files = [
                "apps/wv/backend/getAppointments.web.js",
                "apps/wv/backend/resolveConflict.web.js",
                "apps/wv/backend/createAppointment.web.js"
            ]
            
            secure_files = [
                "apps/wv/backend/getAppointmentsSecure.web.js",
                "apps/wv/backend/resolveConflictSecure.web.js",
                "apps/wv/backend/createAppointmentSecure.web.js"
            ]
            
            for secure_file in secure_files:
                if not os.path.exists(secure_file):
                    self.log_test("Documentation Compliance", False, f"Missing secure version: {secure_file}")
                    return
            
            # Check that permissions utility exists
            if not os.path.exists("apps/wv/backend/permissions.web.js"):
                self.log_test("Documentation Compliance", False, "Missing permissions utility module")
                return
            
            self.log_test("Documentation Compliance", True, "Implementation follows documentation requirements")
            
        except Exception as e:
            self.log_test("Documentation Compliance", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("SCHEDULER PERMISSIONS BACKEND TESTS")
        print("=" * 60)
        
        self.test_permissions_module_structure()
        self.test_secure_appointments_module()
        self.test_secure_conflict_resolution_module()
        self.test_secure_appointment_creation_module()
        self.test_web_module_format()
        self.test_security_best_practices()
        self.test_documentation_compliance()
        
        print("\n" + "=" * 60)
        print(f"TEST RESULTS: {self.passed} PASSED, {self.failed} FAILED")
        print("=" * 60)
        
        # Save detailed results
        results_file = "test/scheduler_permissions_test_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_tests": len(self.test_results),
                    "passed": self.passed,
                    "failed": self.failed,
                    "success_rate": f"{(self.passed / len(self.test_results) * 100):.1f}%"
                },
                "tests": self.test_results,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\nDetailed results saved to: {results_file}")
        
        return self.failed == 0

if __name__ == "__main__":
    tester = SchedulerPermissionsTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
