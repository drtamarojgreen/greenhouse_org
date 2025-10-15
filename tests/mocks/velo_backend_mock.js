/**
 * Mock Wix Velo Backend Functions
 * 
 * This file simulates the Wix Velo backend functions for local testing.
 * It provides realistic responses and error handling without requiring
 * connection to the live Wix backend.
 * 
 * Test Case Coverage: TC-WIX-03
 */

// Load mock data
let mockAppointments = [];
let mockServices = [];
let mockUsers = [];
let currentUser = null;

// Simulate network delay
const NETWORK_DELAY = 100; // milliseconds

// Helper function to simulate async operations
function simulateAsync(fn, delay = NETWORK_DELAY) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fn()), delay);
  });
}

// Helper function to generate unique IDs
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize mock data
async function initializeMockData() {
  try {
    // Load appointments
    const appointmentsResponse = await fetch('../fixtures/mock_appointments.json');
    const appointmentsData = await appointmentsResponse.json();
    mockAppointments = appointmentsData.appointments || [];

    // Load services
    const servicesResponse = await fetch('../fixtures/mock_services.json');
    const servicesData = await servicesResponse.json();
    mockServices = servicesData.services || [];

    // Load users
    const usersResponse = await fetch('../fixtures/mock_users.json');
    const usersData = await usersResponse.json();
    mockUsers = usersData.users || [];

    console.log('[Mock Backend] Initialized with mock data');
    return true;
  } catch (error) {
    console.error('[Mock Backend] Failed to initialize:', error);
    return false;
  }
}

// Authentication and Authorization
const wixUsers = {
  currentUser: {
    loggedIn: async () => {
      return simulateAsync(() => currentUser !== null);
    },
    
    getEmail: async () => {
      return simulateAsync(() => {
        if (!currentUser) throw new Error('User not logged in');
        return currentUser.email;
      });
    },
    
    getRoles: async () => {
      return simulateAsync(() => {
        if (!currentUser) return [];
        return [{ name: currentUser.role }];
      });
    }
  }
};

// Mock login function (for testing)
function mockLogin(email) {
  const user = mockUsers.find(u => u.email === email);
  if (user) {
    currentUser = user;
    console.log(`[Mock Backend] User logged in: ${email} (${user.role})`);
    return true;
  }
  console.log(`[Mock Backend] Login failed: User not found`);
  return false;
}

// Mock logout function (for testing)
function mockLogout() {
  currentUser = null;
  console.log('[Mock Backend] User logged out');
}

// Check if user has permission
function hasPermission(permission) {
  if (!currentUser) return false;
  return currentUser.permissions.includes(permission);
}

// Appointment Management Functions
const appointmentBackend = {
  /**
   * Get all appointments
   * Test Coverage: TC-WIX-12
   */
  getAppointments: async (filters = {}) => {
    return simulateAsync(() => {
      if (!hasPermission('view_all_appointments')) {
        throw new Error('Unauthorized: Insufficient permissions');
      }

      let results = [...mockAppointments];

      // Apply filters
      if (filters.date) {
        results = results.filter(apt => apt.date === filters.date);
      }
      if (filters.status) {
        results = results.filter(apt => apt.status === filters.status);
      }
      if (filters.serviceId) {
        results = results.filter(apt => apt.serviceId === filters.serviceId);
      }

      console.log(`[Mock Backend] getAppointments: Returning ${results.length} appointments`);
      return { items: results, totalCount: results.length };
    });
  },

  /**
   * Get appointment by ID
   * Test Coverage: TC-WIX-12
   */
  getAppointmentById: async (appointmentId) => {
    return simulateAsync(() => {
      if (!hasPermission('view_all_appointments')) {
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const appointment = mockAppointments.find(apt => apt.id === appointmentId);
      if (!appointment) {
        throw new Error(`Appointment not found: ${appointmentId}`);
      }

      console.log(`[Mock Backend] getAppointmentById: Found ${appointmentId}`);
      return appointment;
    });
  },

  /**
   * Create new appointment
   * Test Coverage: TC-WIX-12, TC-WIX-14
   */
  createAppointment: async (appointmentData) => {
    return simulateAsync(() => {
      if (!hasPermission('create_appointment') && !hasPermission('request_appointment')) {
        throw new Error('Unauthorized: Insufficient permissions');
      }

      // Validate required fields
      const required = ['patientName', 'patientEmail', 'serviceId', 'date', 'time'];
      for (const field of required) {
        if (!appointmentData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Create new appointment
      const newAppointment = {
        id: generateId('appt'),
        ...appointmentData,
        status: appointmentData.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockAppointments.push(newAppointment);
      console.log(`[Mock Backend] createAppointment: Created ${newAppointment.id}`);
      return newAppointment;
    });
  },

  /**
   * Update existing appointment
   * Test Coverage: TC-WIX-12, TC-WIX-14
   */
  updateAppointment: async (appointmentId, updates) => {
    return simulateAsync(() => {
      if (!hasPermission('update_appointment')) {
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const index = mockAppointments.findIndex(apt => apt.id === appointmentId);
      if (index === -1) {
        throw new Error(`Appointment not found: ${appointmentId}`);
      }

      mockAppointments[index] = {
        ...mockAppointments[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      console.log(`[Mock Backend] updateAppointment: Updated ${appointmentId}`);
      return mockAppointments[index];
    });
  },

  /**
   * Delete appointment
   * Test Coverage: TC-WIX-12, TC-WIX-14
   */
  deleteAppointment: async (appointmentId) => {
    return simulateAsync(() => {
      if (!hasPermission('delete_appointment')) {
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const index = mockAppointments.findIndex(apt => apt.id === appointmentId);
      if (index === -1) {
        throw new Error(`Appointment not found: ${appointmentId}`);
      }

      mockAppointments.splice(index, 1);
      console.log(`[Mock Backend] deleteAppointment: Deleted ${appointmentId}`);
      return { success: true, id: appointmentId };
    });
  },

  /**
   * Detect scheduling conflicts
   * Test Coverage: TC-WIX-12
   */
  detectConflicts: async (date) => {
    return simulateAsync(() => {
      if (!hasPermission('view_all_appointments')) {
        throw new Error('Unauthorized: Insufficient permissions');
      }

      const dayAppointments = mockAppointments.filter(apt => apt.date === date);
      const conflicts = [];

      for (let i = 0; i < dayAppointments.length; i++) {
        for (let j = i + 1; j < dayAppointments.length; j++) {
          const apt1 = dayAppointments[i];
          const apt2 = dayAppointments[j];

          // Simple time overlap check
          const time1 = parseInt(apt1.time.replace(':', ''));
          const time2 = parseInt(apt2.time.replace(':', ''));
          const end1 = time1 + (apt1.duration || 60);
          const end2 = time2 + (apt2.duration || 60);

          if ((time1 < end2 && end1 > time2)) {
            conflicts.push({
              conflictId: generateId('conflict'),
              appointments: [apt1.id, apt2.id],
              reason: 'Overlapping time slots',
              severity: 'high'
            });
          }
        }
      }

      console.log(`[Mock Backend] detectConflicts: Found ${conflicts.length} conflicts`);
      return conflicts;
    });
  }
};

// Service Management Functions
const serviceBackend = {
  /**
   * Get all services
   * Test Coverage: TC-WIX-12
   */
  getServices: async () => {
    return simulateAsync(() => {
      console.log(`[Mock Backend] getServices: Returning ${mockServices.length} services`);
      return { items: mockServices, totalCount: mockServices.length };
    });
  },

  /**
   * Get service by ID
   * Test Coverage: TC-WIX-12
   */
  getServiceById: async (serviceId) => {
    return simulateAsync(() => {
      const service = mockServices.find(svc => svc.id === serviceId);
      if (!service) {
        throw new Error(`Service not found: ${serviceId}`);
      }

      console.log(`[Mock Backend] getServiceById: Found ${serviceId}`);
      return service;
    });
  }
};

// Permission Check Functions
const permissionBackend = {
  /**
   * Check if current user has permission
   * Test Coverage: TC-WIX-15, TC-WIX-16, TC-WIX-17, TC-WIX-18
   */
  checkPermission: async (permission) => {
    return simulateAsync(() => {
      const result = hasPermission(permission);
      console.log(`[Mock Backend] checkPermission: ${permission} = ${result}`);
      return result;
    });
  },

  /**
   * Get current user's role
   * Test Coverage: TC-WIX-15, TC-WIX-16, TC-WIX-17
   */
  getCurrentUserRole: async () => {
    return simulateAsync(() => {
      if (!currentUser) {
        return 'public';
      }
      console.log(`[Mock Backend] getCurrentUserRole: ${currentUser.role}`);
      return currentUser.role;
    });
  }
};

// Error simulation for testing error handling (TC-WIX-13)
const errorSimulation = {
  simulateNetworkError: () => {
    throw new Error('Network error: Unable to connect to server');
  },

  simulateServerError: () => {
    throw new Error('Server error: Internal server error (500)');
  },

  simulateValidationError: (field) => {
    throw new Error(`Validation error: Invalid ${field}`);
  },

  simulateAuthError: () => {
    throw new Error('Authentication error: Invalid credentials');
  }
};

// Export mock backend API
window.mockVeloBackend = {
  // Initialization
  initialize: initializeMockData,
  
  // Authentication
  wixUsers,
  mockLogin,
  mockLogout,
  
  // Appointments
  ...appointmentBackend,
  
  // Services
  ...serviceBackend,
  
  // Permissions
  ...permissionBackend,
  
  // Error simulation
  errors: errorSimulation,
  
  // Direct data access (for testing)
  _getMockData: () => ({
    appointments: mockAppointments,
    services: mockServices,
    users: mockUsers,
    currentUser
  })
};

console.log('[Mock Backend] Velo backend mock loaded');
