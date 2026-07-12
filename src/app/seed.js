// TransitOps Seed Data
export const DEFAULT_SEED_DATA = {
  users: [
    { id: "u-1", name: "Sarah Connor", email: "manager@transitops.com", password: "password123", role: "Fleet Manager" },
    { id: "u-2", name: "Alex Mercer", email: "driver@transitops.com", password: "password123", role: "Driver" },
    { id: "u-3", name: "Ellen Ripley", email: "safety@transitops.com", password: "password123", role: "Safety Officer" },
    { id: "u-4", name: "Bruce Wayne", email: "finance@transitops.com", password: "password123", role: "Financial Analyst" }
  ],
  vehicles: [
    { 
      id: "Van-05", 
      name: "Ford Transit Cargo Van", 
      type: "Van", 
      maxCapacity: 500, 
      odometer: 12450, 
      cost: 25000, 
      status: "Available",
      documents: [
        { name: "Insurance Certificate", file: "ins_van_05.pdf", expiry: "2027-01-15" },
        { name: "Registration", file: "reg_van_05.pdf", expiry: "2027-06-30" }
      ]
    },
    { 
      id: "Truck-01", 
      name: "Freightliner Cascadia", 
      type: "Semi-Truck", 
      maxCapacity: 15000, 
      odometer: 145200, 
      cost: 120000, 
      status: "On Trip",
      documents: [
        { name: "Insurance Certificate", file: "ins_truck_01.pdf", expiry: "2026-12-10" },
        { name: "DOT Inspection", file: "dot_truck_01.pdf", expiry: "2026-09-15" }
      ]
    },
    { 
      id: "Semi-02", 
      name: "Volvo VNL 860", 
      type: "Semi-Truck", 
      maxCapacity: 18000, 
      odometer: 85200, 
      cost: 140000, 
      status: "Available",
      documents: [
        { name: "Insurance Certificate", file: "ins_semi_02.pdf", expiry: "2027-03-22" }
      ]
    },
    { 
      id: "Van-03", 
      name: "Mercedes-Benz Sprinter", 
      type: "Van", 
      maxCapacity: 1200, 
      odometer: 32600, 
      cost: 45000, 
      status: "In Shop",
      documents: []
    },
    { 
      id: "Sedan-04", 
      name: "Toyota Prius", 
      type: "Sedan", 
      maxCapacity: 350, 
      odometer: 185000, 
      cost: 22000, 
      status: "Retired",
      documents: []
    }
  ],
  drivers: [
    { 
      id: "DL-99234", 
      name: "Alex Mercer", 
      licenseNumber: "DL-99234", 
      licenseCategory: "Class A CDL", 
      licenseExpiry: "2027-05-15", 
      contact: "555-0199", 
      safetyScore: 95, 
      status: "Available" 
    },
    { 
      id: "DL-48190", 
      name: "Sarah Connor", 
      licenseNumber: "DL-48190", 
      licenseCategory: "Class A CDL", 
      licenseExpiry: "2026-12-01", 
      contact: "555-0144", 
      safetyScore: 98, 
      status: "On Trip" 
    },
    { 
      id: "DL-88231", 
      name: "John Miller", 
      licenseNumber: "DL-88231", 
      licenseCategory: "Class B", 
      licenseExpiry: "2026-10-15", 
      contact: "555-0122", 
      safetyScore: 82, 
      status: "Off Duty" 
    },
    { 
      id: "DL-11029", 
      name: "Mike Tyson", 
      licenseNumber: "DL-11029", 
      licenseCategory: "Class C", 
      licenseExpiry: "2026-11-20", 
      contact: "555-0155", 
      safetyScore: 55, 
      status: "Suspended" 
    },
    { 
      id: "DL-55201", 
      name: "David Smith", 
      licenseNumber: "DL-55201", 
      licenseCategory: "Class A CDL", 
      licenseExpiry: "2026-05-10", 
      contact: "555-0177", 
      safetyScore: 90, 
      status: "Available" 
    }
  ],
  trips: [
    { 
      id: "TRIP-1001", 
      source: "Chicago Hub", 
      destination: "Detroit Depot", 
      vehicleId: "Semi-02", 
      driverId: "DL-99234", 
      cargoWeight: 14000, 
      distance: 450, 
      revenue: 2200, 
      status: "Completed",
      startDate: "2026-07-04",
      endDate: "2026-07-05",
      fuelConsumed: 150,
      endOdometer: 85200
    },
    { 
      id: "TRIP-1002", 
      source: "Los Angeles Port", 
      destination: "San Francisco Warehouse", 
      vehicleId: "Truck-01", 
      driverId: "DL-48190", 
      cargoWeight: 12000, 
      distance: 610, 
      revenue: 3500, 
      status: "Dispatched",
      startDate: "2026-07-10",
      endDate: "",
      fuelConsumed: 0,
      endOdometer: 0
    },
    { 
      id: "TRIP-1003", 
      source: "New York Terminal", 
      destination: "Boston Station", 
      vehicleId: "", 
      driverId: "", 
      cargoWeight: 400, 
      distance: 350, 
      revenue: 1200, 
      status: "Draft",
      startDate: "",
      endDate: "",
      fuelConsumed: 0,
      endOdometer: 0
    },
    { 
      id: "TRIP-1004", 
      source: "Houston Logistics", 
      destination: "Dallas Terminal", 
      vehicleId: "Van-03", 
      driverId: "DL-55201", 
      cargoWeight: 600, 
      distance: 380, 
      revenue: 950, 
      status: "Cancelled",
      startDate: "",
      endDate: "",
      fuelConsumed: 0,
      endOdometer: 0
    }
  ],
  maintenanceLogs: [
    { 
      id: "MAINT-2001", 
      vehicleId: "Van-03", 
      description: "Engine Oil & Filter Change + Tire Rotation", 
      type: "Routine", 
      cost: 180, 
      startDate: "2026-07-10", 
      endDate: "", 
      status: "Active" 
    },
    { 
      id: "MAINT-2002", 
      vehicleId: "Semi-02", 
      description: "Air Brake System Overhaul and Brake Pads Replacement", 
      type: "Repair", 
      cost: 850, 
      startDate: "2026-06-05", 
      endDate: "2026-06-07", 
      status: "Closed" 
    }
  ],
  expenses: [
    { id: "EXP-3001", vehicleId: "Semi-02", type: "Fuel", amount: 225, date: "2026-07-05", quantity: 150, notes: "Fuel log for TRIP-1001" },
    { id: "EXP-3002", vehicleId: "Semi-02", type: "Toll", amount: 65, date: "2026-07-05", quantity: 0, notes: "Tolls on I-94 Eastbound" },
    { id: "EXP-3003", vehicleId: "Semi-02", type: "Maintenance", amount: 850, date: "2026-06-07", quantity: 0, notes: "Brake system overhaul (MAINT-2002)" },
    { id: "EXP-3004", vehicleId: "Van-03", type: "Maintenance", amount: 180, date: "2026-07-10", quantity: 0, notes: "Engine oil change (MAINT-2001)" },
    { id: "EXP-3005", vehicleId: "Truck-01", type: "Fuel", amount: 375, date: "2026-07-08", quantity: 250, notes: "Pre-trip fueling" }
  ]
};
