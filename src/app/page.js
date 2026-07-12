"use client";

import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { DEFAULT_SEED_DATA } from "./seed";

const TODAY = "2026-07-12";

export default function Home() {
  // DB State (synced with localStorage)
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // UI / Navigation State
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [showNotifications, setShowNotifications] = useState(false);

  // Search & Filters State
  const [dashboardFilter, setDashboardFilter] = useState("All");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [driverSearch, setDriverSearch] = useState("");

  // Authentication Fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [demoAccount, setDemoAccount] = useState("");
  const [loginError, setLoginError] = useState("");

  // Modals Toggles & Form States
  const [activeModal, setActiveModal] = useState(null); // 'vehicle', 'driver', 'trip', 'completeTrip', 'maintenance', 'expense', 'document'
  
  // Forms states
  const [vehicleForm, setVehicleForm] = useState({ editMode: false, id: "", name: "", type: "Van", maxCapacity: "", odometer: "", cost: "", status: "Available" });
  const [driverForm, setDriverForm] = useState({ editMode: false, id: "", name: "", licenseNumber: "", licenseCategory: "Class A CDL", licenseExpiry: "", contact: "", safetyScore: "", status: "Available" });
  const [tripForm, setTripForm] = useState({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: "", distance: "", revenue: "", status: "Draft" });
  const [completeForm, setCompleteForm] = useState({ tripId: "", vehicleId: "", finalOdometer: "", fuelLiters: "", fuelCost: "", revenue: "", notes: "", startOdometer: 0, distance: 0 });
  const [maintForm, setMaintForm] = useState({ vehicleId: "", description: "", type: "Routine", cost: "", startDate: TODAY, status: "Active" });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: "", type: "Fuel", amount: "", date: TODAY, quantity: "", notes: "" });
  const [documentForm, setDocumentForm] = useState({ vehicleId: "", name: "", expiry: "", file: "" });

  // Charts Refs
  const dashFinChartRef = useRef(null);
  const dashDistChartRef = useRef(null);
  const reportRoiChartRef = useRef(null);
  const reportCostChartRef = useRef(null);

  // 1. Initialize DB from localStorage or seed
  useEffect(() => {
    // Check if browser environment
    if (typeof window !== "undefined") {
      const isInitialized = localStorage.getItem("transitops_initialized");
      let initialData = {};
      if (!isInitialized) {
        localStorage.setItem("transitops_initialized", "true");
        localStorage.setItem("transitops_users", JSON.stringify(DEFAULT_SEED_DATA.users));
        localStorage.setItem("transitops_vehicles", JSON.stringify(DEFAULT_SEED_DATA.vehicles));
        localStorage.setItem("transitops_drivers", JSON.stringify(DEFAULT_SEED_DATA.drivers));
        localStorage.setItem("transitops_trips", JSON.stringify(DEFAULT_SEED_DATA.trips));
        localStorage.setItem("transitops_maintenance", JSON.stringify(DEFAULT_SEED_DATA.maintenanceLogs));
        localStorage.setItem("transitops_expenses", JSON.stringify(DEFAULT_SEED_DATA.expenses));
        initialData = DEFAULT_SEED_DATA;
      } else {
        initialData = {
          users: JSON.parse(localStorage.getItem("transitops_users") || "[]"),
          vehicles: JSON.parse(localStorage.getItem("transitops_vehicles") || "[]"),
          drivers: JSON.parse(localStorage.getItem("transitops_drivers") || "[]"),
          trips: JSON.parse(localStorage.getItem("transitops_trips") || "[]"),
          maintenance: JSON.parse(localStorage.getItem("transitops_maintenance") || "[]"),
          expenses: JSON.parse(localStorage.getItem("transitops_expenses") || "[]"),
        };
      }

      setUsers(initialData.users);
      setVehicles(initialData.vehicles);
      setDrivers(initialData.drivers);
      setTrips(initialData.trips);
      setMaintenance(initialData.maintenance);
      setExpenses(initialData.expenses);

      // Check active session
      const session = sessionStorage.getItem("transitops_session");
      if (session) {
        setCurrentUser(JSON.parse(session));
      }

      // Check theme
      const savedTheme = localStorage.getItem("transitops_theme") || "dark";
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  // 2. LocalStorage Syncing
  const syncDb = (key, data, setter) => {
    localStorage.setItem(`transitops_${key}`, JSON.stringify(data));
    setter(data);
  };

  // 3. Compute Compliance Alerts / Notifications
  useEffect(() => {
    if (drivers.length === 0 && vehicles.length === 0) return;
    
    const notifications = [];
    
    // Check drivers
    drivers.forEach(driver => {
      const expDate = new Date(driver.licenseExpiry);
      const todayDate = new Date(TODAY);
      const diffTime = expDate - todayDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        notifications.push({
          type: "danger",
          title: "License Expired",
          text: `Driver ${driver.name}'s license expired on ${driver.licenseExpiry}.`,
          date: TODAY
        });
      } else if (diffDays <= 30) {
        notifications.push({
          type: "warning",
          title: "License Expiring Soon",
          text: `Driver ${driver.name}'s license expires in ${diffDays} days (${driver.licenseExpiry}).`,
          date: TODAY
        });
      }
      
      if (driver.safetyScore < 70) {
        notifications.push({
          type: "warning",
          title: "Low Safety Score Alert",
          text: `Driver ${driver.name} has a critical safety score of ${driver.safetyScore}%.`,
          date: TODAY
        });
      }
    });

    // Check vehicles
    vehicles.forEach(v => {
      if (v.documents && v.documents.length > 0) {
        v.documents.forEach(doc => {
          const expDate = new Date(doc.expiry);
          const todayDate = new Date(TODAY);
          const diffTime = expDate - todayDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            notifications.push({
              type: "danger",
              title: "Vehicle Document Expired",
              text: `Vehicle ${v.id} document '${doc.name}' expired on ${doc.expiry}.`,
              date: TODAY
            });
          } else if (diffDays <= 30) {
            notifications.push({
              type: "warning",
              title: "Document Expiring",
              text: `Vehicle ${v.id} document '${doc.name}' expires in ${diffDays} days (${doc.expiry}).`,
              date: TODAY
            });
          }
        });
      }
    });

    setAlerts(notifications);
  }, [drivers, vehicles]);

  // 4. Render Dashboard Charts
  useEffect(() => {
    if (currentView !== "dashboard" || !currentUser) return;

    // Filter vehicles by dashboard Filter
    const filteredVehicles = dashboardFilter === "All" 
      ? vehicles 
      : vehicles.filter(v => v.type === dashboardFilter);

    const available = filteredVehicles.filter(v => v.status === "Available").length;
    const ontrip = filteredVehicles.filter(v => v.status === "On Trip").length;
    const inshop = filteredVehicles.filter(v => v.status === "In Shop").length;
    const retired = filteredVehicles.filter(v => v.status === "Retired").length;

    // Financial trends values
    const revenueSum = trips.filter(t => t.status === "Completed").reduce((sum, t) => sum + (t.revenue || 0), 0);
    const expenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 1. Bar Chart
    const ctxFin = document.getElementById("canvasFinancial");
    let chartFin = null;
    if (ctxFin) {
      chartFin = new Chart(ctxFin, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul (YTD)'],
          datasets: [
            {
              label: 'Revenue ($)',
              data: [0, 0, 0, 0, 0, 0, revenueSum],
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: '#10b981',
              borderWidth: 1
            },
            {
              label: 'Operational Expense ($)',
              data: [0, 0, 0, 0, 0, 0, expenseSum],
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderColor: '#ef4444',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
              ticks: { color: theme === 'dark' ? '#9ca3af' : '#475569' }
            },
            x: {
              grid: { display: false },
              ticks: { color: theme === 'dark' ? '#9ca3af' : '#475569' }
            }
          },
          plugins: {
            legend: { labels: { color: theme === 'dark' ? '#f9fafb' : '#0f172a' } }
          }
        }
      });
    }

    // 2. Donut Chart
    const ctxDist = document.getElementById("canvasDistribution");
    let chartDist = null;
    if (ctxDist) {
      chartDist = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
          labels: ['Available', 'On Trip', 'In Shop', 'Retired'],
          datasets: [{
            data: [available, ontrip, inshop, retired],
            backgroundColor: ['#10b981', '#38bdf8', '#f59e0b', '#ef4444'],
            borderColor: 'transparent',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: theme === 'dark' ? '#9ca3af' : '#475569', font: { size: 11 } }
            }
          }
        }
      });
    }

    return () => {
      if (chartFin) chartFin.destroy();
      if (chartDist) chartDist.destroy();
    };
  }, [currentView, currentUser, dashboardFilter, vehicles, trips, expenses, theme]);

  // 5. Render Reports Charts
  useEffect(() => {
    if (currentView !== "reports" || !currentUser) return;

    // ROI per vehicle calculations
    const rows = vehicles.map(v => {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
      const vExpenses = expenses.filter(e => e.vehicleId === v.id);
      const fuelCost = vExpenses.filter(e => e.type === "Fuel").reduce((sum, e) => sum + e.amount, 0);
      const maintCost = vExpenses.filter(e => e.type === "Maintenance").reduce((sum, e) => sum + e.amount, 0);
      const totalRevenue = vTrips.reduce((sum, t) => sum + t.revenue, 0);
      const roiVal = v.cost > 0 ? (((totalRevenue - (maintCost + fuelCost)) / v.cost) * 100) : 0;
      return { id: v.id, roi: roiVal };
    });

    const totalFuel = expenses.filter(e => e.type === "Fuel").reduce((sum, e) => sum + e.amount, 0);
    const totalMaint = expenses.filter(e => e.type === "Maintenance").reduce((sum, e) => sum + e.amount, 0);
    const totalOthers = expenses.filter(e => e.type !== "Fuel" && e.type !== "Maintenance").reduce((sum, e) => sum + e.amount, 0);

    // 1. ROI Chart
    const ctxRoi = document.getElementById("canvasReportsRoi");
    let chartRoi = null;
    if (ctxRoi) {
      chartRoi = new Chart(ctxRoi, {
        type: 'bar',
        data: {
          labels: rows.map(r => r.id),
          datasets: [{
            label: 'Vehicle ROI (%)',
            data: rows.map(r => r.roi),
            backgroundColor: rows.map(r => r.roi >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
            borderColor: rows.map(r => r.roi >= 0 ? '#10b981' : '#ef4444'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              grid: { color: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
              ticks: { color: theme === 'dark' ? '#9ca3af' : '#475569' }
            },
            x: {
              grid: { display: false },
              ticks: { color: theme === 'dark' ? '#9ca3af' : '#475569' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 2. Cost Centers Chart
    const ctxCost = document.getElementById("canvasReportsCost");
    let chartCost = null;
    if (ctxCost) {
      chartCost = new Chart(ctxCost, {
        type: 'pie',
        data: {
          labels: ['Fuel Logs', 'Repairs & Maint', 'Road Tolls / Misc'],
          datasets: [{
            data: [totalFuel, totalMaint, totalOthers],
            backgroundColor: ['#0ea5e9', '#f59e0b', '#8b5cf6'],
            borderColor: 'transparent'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: theme === 'dark' ? '#9ca3af' : '#475569', font: { size: 12 } }
            }
          }
        }
      });
    }

    return () => {
      if (chartRoi) chartRoi.destroy();
      if (chartCost) chartCost.destroy();
    };
  }, [currentView, currentUser, vehicles, trips, expenses, theme]);

  // 6. RBAC Verification
  const hasAccess = (module, action) => {
    if (!currentUser) return false;
    if (currentUser.role === "Fleet Manager") return true; // Superuser bypass

    if (module === "reports" && action === "view") {
      return ["Fleet Manager", "Financial Analyst"].includes(currentUser.role);
    }

    const rules = {
      vehicles: { create: ["Fleet Manager"], update: ["Fleet Manager"], delete: ["Fleet Manager"] },
      drivers: { create: ["Fleet Manager", "Safety Officer"], update: ["Fleet Manager", "Safety Officer"], delete: ["Fleet Manager"] },
      trips: { create: ["Fleet Manager", "Driver"], update: ["Fleet Manager", "Driver"], delete: ["Fleet Manager"] },
      maintenance: { create: ["Fleet Manager"], update: ["Fleet Manager"], delete: ["Fleet Manager"] },
      expenses: { create: ["Fleet Manager", "Driver", "Financial Analyst"], update: ["Fleet Manager", "Financial Analyst"], delete: ["Fleet Manager"] }
    };

    return rules[module]?.[action]?.includes(currentUser.role) || false;
  };

  // 7. Auth Handlers
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword);
    
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem("transitops_session", JSON.stringify(user));
      setLoginError("");
      setCurrentView("dashboard");
    } else {
      setLoginError("Invalid email or password credentials.");
    }
  };

  const handleDemoSelect = (val) => {
    setDemoAccount(val);
    if (val) {
      const [email, pwd] = val.split("|");
      setLoginEmail(email);
      setLoginPassword(pwd);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("transitops_session");
    setLoginEmail("");
    setLoginPassword("");
    setDemoAccount("");
  };

  const handleRoleSwitch = (role) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      sessionStorage.setItem("transitops_session", JSON.stringify(updatedUser));
    }
  };

  const toggleThemeMode = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("transitops_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // 8. CRUD Operations: Vehicles
  const openVehicleModal = (v = null) => {
    if (v) {
      setVehicleForm({
        editMode: true,
        id: v.id,
        name: v.name,
        type: v.type,
        maxCapacity: v.maxCapacity,
        odometer: v.odometer,
        cost: v.cost,
        status: v.status
      });
    } else {
      setVehicleForm({
        editMode: false,
        id: "",
        name: "",
        type: "Van",
        maxCapacity: "",
        odometer: "",
        cost: "",
        status: "Available"
      });
    }
    setActiveModal("vehicle");
  };

  const submitVehicle = (e) => {
    e.preventDefault();
    const list = [...vehicles];
    const { editMode, id, name, type, maxCapacity, odometer, cost, status } = vehicleForm;
    
    if (editMode) {
      const idx = list.findIndex(v => v.id === id);
      if (idx > -1) {
        list[idx] = { ...list[idx], name, type, maxCapacity: parseInt(maxCapacity), odometer: parseInt(odometer), cost: parseInt(cost), status };
        syncDb("vehicles", list, setVehicles);
        setActiveModal(null);
      }
    } else {
      if (list.some(v => v.id.toLowerCase() === id.toLowerCase())) {
        alert("Validation Error: Vehicle with registration number " + id + " already exists.");
        return;
      }
      list.push({ id, name, type, maxCapacity: parseInt(maxCapacity), odometer: parseInt(odometer), cost: parseInt(cost), status, documents: [] });
      syncDb("vehicles", list, setVehicles);
      setActiveModal(null);
    }
  };

  const deleteVehicle = (id) => {
    if (confirm(`Are you sure you want to delete vehicle ${id}?`)) {
      const list = vehicles.filter(v => v.id !== id);
      syncDb("vehicles", list, setVehicles);
    }
  };

  // 9. CRUD Operations: Drivers
  const openDriverModal = (d = null) => {
    if (d) {
      setDriverForm({
        editMode: true,
        id: d.id,
        name: d.name,
        licenseNumber: d.licenseNumber,
        licenseCategory: d.licenseCategory,
        licenseExpiry: d.licenseExpiry,
        contact: d.contact,
        safetyScore: d.safetyScore,
        status: d.status
      });
    } else {
      setDriverForm({
        editMode: false,
        id: "",
        name: "",
        licenseNumber: "",
        licenseCategory: "Class A CDL",
        licenseExpiry: "",
        contact: "",
        safetyScore: "",
        status: "Available"
      });
    }
    setActiveModal("driver");
  };

  const submitDriver = (e) => {
    e.preventDefault();
    const list = [...drivers];
    const { editMode, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status } = driverForm;

    if (editMode) {
      const idx = list.findIndex(d => d.id === licenseNumber);
      if (idx > -1) {
        list[idx] = { ...list[idx], name, licenseCategory, licenseExpiry, contact, safetyScore: parseInt(safetyScore), status };
        syncDb("drivers", list, setDrivers);
        setActiveModal(null);
      }
    } else {
      if (list.some(d => d.id.toLowerCase() === licenseNumber.toLowerCase())) {
        alert("Validation Error: Driver with license " + licenseNumber + " already exists.");
        return;
      }
      list.push({ id: licenseNumber, name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore: parseInt(safetyScore), status });
      syncDb("drivers", list, setDrivers);
      setActiveModal(null);
    }
  };

  const deleteDriver = (id) => {
    if (confirm(`Remove driver profile ${id}?`)) {
      const list = drivers.filter(d => d.id !== id);
      syncDb("drivers", list, setDrivers);
    }
  };

  // 10. CRUD Operations: Trips
  const openTripModal = () => {
    setTripForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: "", distance: "", revenue: "", status: "Draft" });
    setActiveModal("trip");
  };

  const checkCargoWeight = () => {
    if (!tripForm.vehicleId || !tripForm.cargoWeight) return false;
    const v = vehicles.find(v => v.id === tripForm.vehicleId);
    return v ? parseInt(tripForm.cargoWeight) > v.maxCapacity : false;
  };

  const submitTrip = (e) => {
    e.preventDefault();
    const list = [...trips];
    const { source, destination, vehicleId, driverId, cargoWeight, distance, revenue, status } = tripForm;

    // Double validation
    if (vehicleId) {
      const v = vehicles.find(v => v.id === vehicleId);
      if (parseInt(cargoWeight) > v.maxCapacity) {
        alert("Business Rule Error: Cargo weight exceeds max payload capacity of vehicle!");
        return;
      }
    }

    // Status Transitions
    if (status === "Dispatched") {
      const updatedVehicles = vehicles.map(v => v.id === vehicleId ? { ...v, status: "On Trip" } : v);
      const updatedDrivers = drivers.map(d => d.id === driverId ? { ...d, status: "On Trip" } : d);
      syncDb("vehicles", updatedVehicles, setVehicles);
      syncDb("drivers", updatedDrivers, setDrivers);
    }

    const nextId = `TRIP-${1001 + list.length}`;
    list.push({
      id: nextId,
      source, destination, vehicleId, driverId,
      cargoWeight: parseInt(cargoWeight),
      distance: parseInt(distance),
      revenue: parseInt(revenue),
      status,
      startDate: status === "Dispatched" ? TODAY : "",
      endDate: "",
      fuelConsumed: 0,
      endOdometer: 0
    });

    syncDb("trips", list, setTrips);
    setActiveModal(null);
  };

  const cancelTrip = (tripId) => {
    if (confirm(`Cancel active dispatched trip ${tripId}? assets will be released.`)) {
      const updatedTrips = trips.map(t => {
        if (t.id === tripId) {
          // Release
          const updatedVehicles = vehicles.map(v => v.id === t.vehicleId ? { ...v, status: "Available" } : v);
          const updatedDrivers = drivers.map(d => d.id === t.driverId ? { ...d, status: "Available" } : d);
          syncDb("vehicles", updatedVehicles, setVehicles);
          syncDb("drivers", updatedDrivers, setDrivers);
          return { ...t, status: "Cancelled" };
        }
        return t;
      });
      syncDb("trips", updatedTrips, setTrips);
    }
  };

  const deleteTrip = (tripId) => {
    if (confirm(`Delete draft record ${tripId}?`)) {
      const list = trips.filter(t => t.id !== tripId);
      syncDb("trips", list, setTrips);
    }
  };

  // 11. Complete Trip Process
  const openCompleteModal = (trip) => {
    const v = vehicles.find(item => item.id === trip.vehicleId);
    setCompleteForm({
      tripId: trip.id,
      vehicleId: trip.vehicleId,
      finalOdometer: v ? v.odometer + trip.distance : "",
      fuelLiters: "",
      fuelCost: "",
      revenue: trip.revenue,
      notes: `Finished delivery route for ${trip.id}`,
      startOdometer: v ? v.odometer : 0,
      distance: trip.distance
    });
    setActiveModal("completeTrip");
  };

  const submitCompleteTrip = (e) => {
    e.preventDefault();
    const finalOdom = parseInt(completeForm.finalOdometer);
    if (finalOdom < completeForm.startOdometer) {
      alert("Business Rule Violation: Final odometer cannot be less than starting odometer (" + completeForm.startOdometer + ")");
      return;
    }

    // 1. Update Trip
    const updatedTrips = trips.map(t => {
      if (t.id === completeForm.tripId) {
        return {
          ...t,
          status: "Completed",
          endDate: TODAY,
          fuelConsumed: parseInt(completeForm.fuelLiters),
          revenue: parseInt(completeForm.revenue),
          endOdometer: finalOdom
        };
      }
      return t;
    });

    // 2. Release driver and vehicle
    const targetTrip = trips.find(t => t.id === completeForm.tripId);
    const updatedVehicles = vehicles.map(v => v.id === completeForm.vehicleId ? { ...v, status: "Available", odometer: finalOdom } : v);
    const updatedDrivers = drivers.map(d => d.id === targetTrip.driverId ? { ...d, status: "Available" } : d);

    // 3. Log Fuel Expense
    const listExpenses = [...expenses];
    const nextExpId = `EXP-${3001 + listExpenses.length}`;
    listExpenses.push({
      id: nextExpId,
      vehicleId: completeForm.vehicleId,
      type: "Fuel",
      amount: parseInt(completeForm.fuelCost),
      date: TODAY,
      quantity: parseInt(completeForm.fuelLiters),
      notes: `Auto log fuel from delivery completion: ${completeForm.tripId}. ${completeForm.notes}`
    });

    syncDb("trips", updatedTrips, setTrips);
    syncDb("vehicles", updatedVehicles, setVehicles);
    syncDb("drivers", updatedDrivers, setDrivers);
    syncDb("expenses", listExpenses, setExpenses);
    
    setActiveModal(null);
  };

  // 12. Maintenance CRUD
  const openMaintenanceModal = () => {
    setMaintForm({ vehicleId: "", description: "", type: "Routine", cost: "", startDate: TODAY, status: "Active" });
    setActiveModal("maintenance");
  };

  const submitMaintenance = (e) => {
    e.preventDefault();
    const list = [...maintenance];
    const { vehicleId, description, type, cost, startDate, status } = maintForm;

    // Check status transition
    if (status === "Active") {
      const updatedVehicles = vehicles.map(v => v.id === vehicleId ? { ...v, status: "In Shop" } : v);
      syncDb("vehicles", updatedVehicles, setVehicles);
    }

    const nextId = `MAINT-${2001 + list.length}`;
    list.push({
      id: nextId,
      vehicleId, description, type, cost: parseInt(cost), startDate,
      endDate: status === "Closed" ? startDate : "",
      status
    });

    // If Closed immediately, auto expense it
    if (status === "Closed") {
      const listExpenses = [...expenses];
      const nextExpId = `EXP-${3001 + listExpenses.length}`;
      listExpenses.push({
        id: nextExpId,
        vehicleId,
        type: "Maintenance",
        amount: parseInt(cost),
        date: startDate,
        quantity: 0,
        notes: `Repair cost for ${nextId}: ${description}`
      });
      syncDb("expenses", listExpenses, setExpenses);
    }

    syncDb("maintenance", list, setMaintenance);
    setActiveModal(null);
  };

  const resolveMaintenance = (log) => {
    if (confirm(`Mark maintenance ${log.id} as completed? Vehicle will be released back to Available pool.`)) {
      const updatedMaint = maintenance.map(m => {
        if (m.id === log.id) {
          return { ...m, status: "Closed", endDate: TODAY };
        }
        return m;
      });

      // Release vehicle (unless retired)
      const v = vehicles.find(v => v.id === log.vehicleId);
      const nextStatus = v && v.status === "Retired" ? "Retired" : "Available";
      const updatedVehicles = vehicles.map(v => v.id === log.vehicleId ? { ...v, status: nextStatus } : v);

      // Log Maintenance Expense
      const listExpenses = [...expenses];
      const nextExpId = `EXP-${3001 + listExpenses.length}`;
      listExpenses.push({
        id: nextExpId,
        vehicleId: log.vehicleId,
        type: "Maintenance",
        amount: log.cost,
        date: TODAY,
        quantity: 0,
        notes: `Resolution expense for ${log.id}. Details: ${log.description}`
      });

      syncDb("maintenance", updatedMaint, setMaintenance);
      syncDb("vehicles", updatedVehicles, setVehicles);
      syncDb("expenses", listExpenses, setExpenses);
    }
  };

  // 13. Expense CRUD
  const openExpenseModal = () => {
    setExpenseForm({ vehicleId: "", type: "Fuel", amount: "", date: TODAY, quantity: "", notes: "" });
    setActiveModal("expense");
  };

  const submitExpense = (e) => {
    e.preventDefault();
    const list = [...expenses];
    const { vehicleId, type, amount, date, quantity, notes } = expenseForm;

    const nextId = `EXP-${3001 + list.length}`;
    list.push({
      id: nextId,
      vehicleId,
      type,
      amount: parseInt(amount),
      date,
      quantity: type === "Fuel" ? parseInt(quantity) : 0,
      notes
    });

    syncDb("expenses", list, setExpenses);
    setActiveModal(null);
  };

  const deleteExpense = (id) => {
    if (confirm(`Remove expense record ${id}?`)) {
      const list = expenses.filter(e => e.id !== id);
      syncDb("expenses", list, setExpenses);
    }
  };

  // 14. Document Management
  const openDocModal = (vId) => {
    setDocumentForm({ vehicleId: vId, name: "", expiry: "", file: "" });
    setActiveModal("document");
  };

  const submitDoc = (e) => {
    e.preventDefault();
    const updatedVehicles = vehicles.map(v => {
      if (v.id === documentForm.vehicleId) {
        const docs = v.documents ? [...v.documents] : [];
        docs.push({
          name: documentForm.name,
          expiry: documentForm.expiry,
          file: documentForm.file
        });
        return { ...v, documents: docs };
      }
      return v;
    });

    syncDb("vehicles", updatedVehicles, setVehicles);
    setDocumentForm({ ...documentForm, name: "", expiry: "", file: "" });
  };

  const deleteDoc = (vId, docIdx) => {
    if (confirm("Remove this document?")) {
      const updatedVehicles = vehicles.map(v => {
        if (v.id === vId && v.documents) {
          const docs = [...v.documents];
          docs.splice(docIdx, 1);
          return { ...v, documents: docs };
        }
        return v;
      });
      syncDb("vehicles", updatedVehicles, setVehicles);
    }
  };

  // 15. Reports Data Exporters
  const exportReportsToCSV = () => {
    const rows = [
      ["Vehicle ID", "Acquisition Cost", "Distance (km)", "Fuel Consumed (L)", "Fuel Economy (km/L)", "Fuel Cost ($)", "Maintenance Cost ($)", "Total Expense ($)", "Total Revenue ($)", "Net ROI (%)"]
    ];
    
    vehicles.forEach(v => {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
      const totalDistance = vTrips.reduce((sum, t) => sum + t.distance, 0);
      const totalRevenue = vTrips.reduce((sum, t) => sum + t.revenue, 0);
      
      const vExpenses = expenses.filter(e => e.vehicleId === v.id);
      const fuelCost = vExpenses.filter(e => e.type === "Fuel").reduce((sum, e) => sum + e.amount, 0);
      const maintCost = vExpenses.filter(e => e.type === "Maintenance").reduce((sum, e) => sum + e.amount, 0);
      const otherCost = vExpenses.filter(e => e.type !== "Fuel" && e.type !== "Maintenance").reduce((sum, e) => sum + e.amount, 0);
      const totalOpsCost = fuelCost + maintCost + otherCost;
      
      const totalFuelConsumed = vTrips.reduce((sum, t) => sum + t.fuelConsumed, 0);
      const fuelEfficiency = totalFuelConsumed > 0 ? (totalDistance / totalFuelConsumed).toFixed(2) : "0.00";
      
      const roiVal = v.cost > 0 ? (((totalRevenue - (maintCost + fuelCost)) / v.cost) * 100).toFixed(1) : "0.0";
      
      rows.push([
        v.id, v.cost, totalDistance, totalFuelConsumed, fuelEfficiency, fuelCost, maintCost, totalOpsCost, totalRevenue, roiVal
      ]);
    });
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TransitOps_Report_${TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  // 16. Login Authentication Guard
  if (!currentUser) {
    return (
      <div id="login-screen">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container" style={{ justifyContent: "center", marginBottom: "12px" }}>
              <div className="logo-icon">T</div>
              <span className="logo-text" style={{ color: "var(--text-primary)", WebkitTextFillColor: "initial" }}>TransitOps</span>
            </div>
            <h2>Sign In</h2>
            <p>Smart Transport Operations Platform</p>
          </div>

          {loginError && (
            <div className="alert-banner" id="login-error">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-control" placeholder="manager@transitops.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: "44px", marginTop: "8px" }}>Login</button>
          </form>

          <div className="login-demo-accounts">
            <label>Demo Quick-Select Account:</label>
            <select value={demoAccount} onChange={e => handleDemoSelect(e.target.value)}>
              <option value="">-- Choose Profile --</option>
              <option value="manager@transitops.com|password123">Sarah (Fleet Manager)</option>
              <option value="driver@transitops.com|password123">Alex (Driver)</option>
              <option value="safety@transitops.com|password123">Ripley (Safety Officer)</option>
              <option value="finance@transitops.com|password123">Bruce (Financial Analyst)</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // KPI CALCULATIONS FOR VIEW INJECTIONS
  // -----------------------------------------------------------------
  const activeVehiclesCount = vehicles.filter(v => v.status === "On Trip").length;
  const availableVehiclesCount = vehicles.filter(v => v.status === "Available").length;
  const inShopVehiclesCount = vehicles.filter(v => v.status === "In Shop").length;
  const activeTripsCount = trips.filter(t => t.status === "Dispatched").length;
  const pendingTripsCount = trips.filter(t => t.status === "Draft").length;
  const driversOnDutyCount = drivers.filter(d => d.status === "Available" || d.status === "On Trip").length;
  const operableFleetCount = vehicles.filter(v => v.status !== "Retired").length;
  const utilPct = operableFleetCount > 0 ? Math.round((activeVehiclesCount / operableFleetCount) * 100) : 0;

  // Filter lists based on Search queries
  const searchedVehicles = vehicles.filter(v => {
    const matchQ = v.id.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.name.toLowerCase().includes(vehicleSearch.toLowerCase());
    const matchT = vehicleTypeFilter === "All" || v.type === vehicleTypeFilter;
    return matchQ && matchT;
  });

  const searchedDrivers = drivers.filter(d => {
    return d.name.toLowerCase().includes(driverSearch.toLowerCase()) || d.licenseNumber.toLowerCase().includes(driverSearch.toLowerCase());
  });

  return (
    <div id="app-layout">
      {/* SIDEBAR */}
      <aside>
        <div className="sidebar-logo">
          <div className="logo-container">
            <div className="logo-icon">T</div>
            <span className="logo-text">TransitOps</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <a className={`menu-item ${currentView === "dashboard" ? "active" : ""}`} onClick={() => setCurrentView("dashboard")}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
              Dashboard
            </a>
          </li>
          <li>
            <a className={`menu-item ${currentView === "vehicles" ? "active" : ""}`} onClick={() => setCurrentView("vehicles")}>
              <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              Vehicles Registry
            </a>
          </li>
          <li>
            <a className={`menu-item ${currentView === "drivers" ? "active" : ""}`} onClick={() => setCurrentView("drivers")}>
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Drivers Directory
            </a>
          </li>
          <li>
            <a className={`menu-item ${currentView === "trips" ? "active" : ""}`} onClick={() => setCurrentView("trips")}>
              <svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="18" r="3"></circle><line x1="12" y1="6" x2="12" y2="18"></line><line x1="6" y1="12" x2="18" y2="12"></line><path d="M18 6h-6"></path><path d="M6 18h6"></path></svg>
              Trip Management
            </a>
          </li>
          <li>
            <a className={`menu-item ${currentView === "maintenance" ? "active" : ""}`} onClick={() => setCurrentView("maintenance")}>
              <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
              Maintenance Log
            </a>
          </li>
          <li>
            <a className={`menu-item ${currentView === "expenses" ? "active" : ""}`} onClick={() => setCurrentView("expenses")}>
              <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Fuel & Expenses
            </a>
          </li>
          <li>
            <a className={`menu-item ${currentView === "reports" ? "active" : ""}`} onClick={() => setCurrentView("reports")}>
              <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              Reports & Analytics
            </a>
          </li>
        </ul>

        {/* SIDEBAR FOOTER (USER & ROLE SWITCHER) */}
        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar">{currentUser.name.split(" ").map(n => n[0]).join("")}</div>
            <div className="user-meta">
              <div className="name">{currentUser.name}</div>
              <div className="role-badge">{currentUser.role}</div>
            </div>
          </div>
          
          <div className="role-selector-container">
            <label>RBAC Role Switcher</label>
            <select className="role-select" value={currentUser.role} onChange={e => handleRoleSwitch(e.target.value)}>
              <option value="Fleet Manager">Fleet Manager</option>
              <option value="Driver">Driver</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Financial Analyst">Financial Analyst</option>
            </select>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <svg style={{ width: "14px", height: "14px", fill: "none", stroke: "currentColor", strokeWidth: "2" }} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main>
        <header>
          <div className="header-title-container">
            <h1 style={{ textTransform: "capitalize" }}>{currentView === "trips" ? "Trip Dispatcher" : `${currentView} Management`}</h1>
          </div>

          <div className="header-controls">
            {/* Alerts Bell */}
            <button className="notifications-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
            </button>

            {/* Dark/Light Switch */}
            <button className="theme-toggle-btn" onClick={toggleThemeMode} title="Toggle Theme">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path>
              </svg>
            </button>

            {/* Notification Drawer popover */}
            {showNotifications && (
              <div className="notifications-panel active">
                <div className="notifications-header">
                  <span>Compliance Alerts</span>
                  <button onClick={() => setAlerts([])} style={{ background: "none", border: "none", color: "var(--accent-primary)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}>Clear All</button>
                </div>
                <div className="notifications-body">
                  {alerts.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No compliance concerns.</div>
                  ) : (
                    alerts.map((notif, idx) => (
                      <div key={idx} className="notification-item" style={{ borderLeft: `3px solid ${notif.type === 'danger' ? 'var(--danger)' : 'var(--warning)'}` }}>
                        <div className="notif-title" style={{ color: notif.type === 'danger' ? 'var(--danger)' : 'var(--warning)' }}>{notif.title}</div>
                        <div className="notif-text">{notif.text}</div>
                        <div className="notif-time">{notif.date}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="content-panel">
          {/* ========================================================= */}
          {/* DASHBOARD VIEW */}
          {/* ========================================================= */}
          {currentView === "dashboard" && (
            <div>
              <div className="glass-card d-flex justify-between align-center" style={{ padding: "16px", marginBottom: "24px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Fleet Metrics</h3>
                <div className="d-flex align-center gap-12">
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Filter Vehicle Type:</label>
                  <select className="form-control" style={{ width: "200px", padding: "6px 12px" }} value={dashboardFilter} onChange={e => setDashboardFilter(e.target.value)}>
                    <option value="All">All Vehicles</option>
                    {[...new Set(vehicles.map(v => v.type))].map(type => (
                      <option key={type} value={type}>{type}s Only</option>
                    ))}
                  </select>
                </div>
              </div>

              {alerts.some(a => a.type === "danger") && (
                <div className="alert-banner">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <div>
                    <strong>Compliance Warning:</strong> Urgent driver safety or vehicle documents expired! Check alerts bell.
                  </div>
                </div>
              )}

              <div className="kpi-grid">
                <div className="kpi-card kpi-info">
                  <span className="kpi-label">Active Deliveries</span>
                  <span className="kpi-val">{activeTripsCount}</span>
                  <span className="kpi-sub">{pendingTripsCount} Draft Trips Saved</span>
                </div>
                <div className="kpi-card kpi-available">
                  <span className="kpi-label">Available Vehicles</span>
                  <span className="kpi-val">{availableVehiclesCount}</span>
                  <span className="kpi-sub">Out of {vehicles.length} Total Fleet</span>
                </div>
                <div className="kpi-card kpi-maintenance">
                  <span className="kpi-label">Vehicles in Shop</span>
                  <span className="kpi-val">{inShopVehiclesCount}</span>
                  <span className="kpi-sub">Active Maintenance</span>
                </div>
                <div className="kpi-card kpi-danger">
                  <span className="kpi-label">Drivers On Duty</span>
                  <span className="kpi-val">{driversOnDutyCount}</span>
                  <span className="kpi-sub">From {drivers.length} Drivers</span>
                </div>
                <div className="kpi-card kpi-info" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <span className="kpi-label">Fleet Utilization</span>
                  <span className="kpi-val" style={{ color: "var(--accent-primary)" }}>{utilPct}%</span>
                  <span className="kpi-sub">Active vs Operable Fleet</span>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="glass-card chart-card">
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>Financial Trends (YTD Performance)</h3>
                  <div style={{ height: "calc(100% - 40px)" }}><canvas id="canvasFinancial"></canvas></div>
                </div>
                <div className="glass-card chart-card">
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>Fleet Status Distribution</h3>
                  <div style={{ height: "calc(100% - 40px)", display: "flex", justifyContent: "center", alignItems: "center" }}><canvas id="canvasDistribution"></canvas></div>
                </div>
              </div>

              <div className="glass-card">
                <div className="d-flex justify-between align-center" style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Live Dispatch Board</h3>
                  {hasAccess("trips", "create") && <button className="btn btn-primary" onClick={openTripModal}>Dispatch Wizard</button>}
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Trip ID</th>
                        <th>Origin & Destination</th>
                        <th>Vehicle ID</th>
                        <th>Assigned Driver</th>
                        <th>Cargo Load</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.slice(-4).reverse().map(trip => (
                        <tr key={trip.id}>
                          <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{trip.id}</td>
                          <td>{trip.source} &rarr; {trip.destination}</td>
                          <td>{trip.vehicleId || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}</td>
                          <td>{trip.driverId ? (drivers.find(d => d.id === trip.driverId)?.name || trip.driverId) : <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}</td>
                          <td>{trip.cargoWeight} kg</td>
                          <td>
                            <span className={`badge ${trip.status === 'Completed' ? 'badge-completed' : trip.status === 'Cancelled' ? 'badge-cancelled' : trip.status === 'Dispatched' ? 'badge-dispatched' : 'badge-draft'}`}>
                              {trip.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VEHICLES REGISTRY VIEW */}
          {/* ========================================================= */}
          {currentView === "vehicles" && (
            <div className="glass-card">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                <div className="d-flex align-center gap-12" style={{ flexWrap: "wrap" }}>
                  <input type="text" className="form-control" placeholder="Search vehicle reg # or model..." style={{ width: "250px" }} value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} />
                  <select className="form-control" style={{ width: "150px" }} value={vehicleTypeFilter} onChange={e => setVehicleTypeFilter(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="Van">Van</option>
                    <option value="Semi-Truck">Semi-Truck</option>
                    <option value="Delivery Truck">Delivery Truck</option>
                    <option value="Electric SUV">Electric SUV</option>
                    <option value="Sedan">Sedan</option>
                  </select>
                </div>

                {hasAccess("vehicles", "create") ? (
                  <button className="btn btn-primary" onClick={() => openVehicleModal()}>
                    <svg style={{ width: "16px", height: "16px", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Register Vehicle
                  </button>
                ) : (
                  <div className="badge badge-draft">Read-only Registry</div>
                )}
              </div>

              <div className="vehicle-grid">
                {searchedVehicles.map(v => {
                  const docCount = v.documents ? v.documents.length : 0;
                  const expiredDocs = v.documents ? v.documents.filter(d => d.expiry < TODAY).length : 0;
                  return (
                    <div key={v.id} className="entity-card">
                      <div className="card-header">
                        <div>
                          <div className="title">{v.name}</div>
                          <div className="subtitle">{v.type} &bull; Reg: <strong>{v.id}</strong></div>
                        </div>
                        <span className={`badge ${v.status === 'Available' ? 'badge-available' : v.status === 'On Trip' ? 'badge-ontrip' : v.status === 'In Shop' ? 'badge-inshop' : 'badge-retired'}`}>{v.status}</span>
                      </div>

                      <div>
                        <div className="details-row">
                          <span>Max Payload:</span>
                          <span>{v.maxCapacity} kg</span>
                        </div>
                        <div className="details-row">
                          <span>Odometer:</span>
                          <span>{v.odometer.toLocaleString()} km</span>
                        </div>
                        <div className="details-row">
                          <span>Acquisition Cost:</span>
                          <span>${v.cost.toLocaleString()}</span>
                        </div>
                        <div className="details-row">
                          <span>Documents:</span>
                          <span onClick={() => openDocModal(v.id)} style={{ color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>
                            {docCount} Files {expiredDocs > 0 && <span style={{ color: "var(--danger)" }}>({expiredDocs} Expired)</span>}
                          </span>
                        </div>
                      </div>

                      <div className="actions">
                        <button className="btn btn-secondary btn-icon-only" onClick={() => openDocModal(v.id)} title="Certificates">
                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </button>
                        {hasAccess("vehicles", "update") && (
                          <button className="btn btn-secondary btn-icon-only" onClick={() => openVehicleModal(v)} title="Edit">
                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                        )}
                        {hasAccess("vehicles", "delete") && (
                          <button className="btn btn-danger btn-icon-only" onClick={() => deleteVehicle(v.id)} title="Delete">
                            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DRIVERS DIRECTORY VIEW */}
          {/* ========================================================= */}
          {currentView === "drivers" && (
            <div className="glass-card">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                <input type="text" className="form-control" placeholder="Search driver name or license..." style={{ width: "250px" }} value={driverSearch} onChange={e => setDriverSearch(e.target.value)} />
                
                {hasAccess("drivers", "create") ? (
                  <button className="btn btn-primary" onClick={() => openDriverModal()}>
                    <svg style={{ width: "16px", height: "16px", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Driver Profile
                  </button>
                ) : (
                  <div className="badge badge-draft">Read-only Database</div>
                )}
              </div>

              <div className="driver-grid">
                {searchedDrivers.map(d => {
                  const isExpired = d.licenseExpiry < TODAY;
                  let scoreColor = "var(--success)";
                  if (d.safetyScore < 85) scoreColor = "var(--warning)";
                  if (d.safetyScore < 70) scoreColor = "var(--danger)";

                  return (
                    <div key={d.id} className="entity-card">
                      <div className="card-header">
                        <div>
                          <div className="title">{d.name}</div>
                          <div className="subtitle">{d.licenseCategory} &bull; Lic: <strong>{d.licenseNumber}</strong></div>
                        </div>
                        <span className={`badge ${d.status === 'Available' ? 'badge-available' : d.status === 'On Trip' ? 'badge-ontrip' : d.status === 'Off Duty' ? 'badge-offduty' : 'badge-suspended'}`}>{d.status}</span>
                      </div>

                      <div>
                        <div className="details-row">
                          <span>License Expiry:</span>
                          <span style={{ fontWeight: 600, color: isExpired ? "var(--danger)" : "var(--text-secondary)" }}>
                            {d.licenseExpiry} {isExpired && "(EXPIRED)"}
                          </span>
                        </div>
                        <div className="details-row">
                          <span>Contact Info:</span>
                          <span>{d.contact}</span>
                        </div>
                        
                        <div className="details-row" style={{ flexDirection: "column", alignItems: "stretch", borderBottom: "none", paddingTop: "10px" }}>
                          <div className="safety-gauge-container">
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Safety Performance:</span>
                            <span style={{ fontWeight: 700, color: scoreColor, fontSize: "12px" }}>{d.safetyScore}%</span>
                          </div>
                          <div className="safety-gauge-bar">
                            <div className="safety-gauge-fill" style={{ width: `${d.safetyScore}%`, backgroundColor: scoreColor }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="actions">
                        {hasAccess("drivers", "update") && (
                          <button className="btn btn-secondary btn-icon-only" onClick={() => openDriverModal(d)} title="Edit">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                        )}
                        {hasAccess("drivers", "delete") && (
                          <button className="btn btn-danger btn-icon-only" onClick={() => deleteDriver(d.id)} title="Delete">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TRIP DISPATCHER VIEW */}
          {/* ========================================================= */}
          {currentView === "trips" && (
            <div className="glass-card">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Operation Log & Routes Ledger</h3>
                {hasAccess("trips", "create") && <button className="btn btn-primary" onClick={openTripModal}>Dispatch Wizard</button>}
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Routing Route</th>
                      <th>Vehicle Code</th>
                      <th>Driver Assigned</th>
                      <th>Load Weight</th>
                      <th>Distance</th>
                      <th>Est. Revenue</th>
                      <th>Status</th>
                      <th>Date Dispatch</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(trip => (
                      <tr key={trip.id}>
                        <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{trip.id}</td>
                        <td>{trip.source} &rarr; {trip.destination}</td>
                        <td>
                          <strong>{trip.vehicleId || "Unassigned"}</strong><br />
                          <small style={{ color: "var(--text-muted)" }}>{vehicles.find(v => v.id === trip.vehicleId)?.name || ""}</small>
                        </td>
                        <td>
                          <strong>{drivers.find(d => d.id === trip.driverId)?.name || trip.driverId || "Unassigned"}</strong><br />
                          <small style={{ color: "var(--text-muted)" }}>Safety Score: {drivers.find(d => d.id === trip.driverId)?.safetyScore || "0"}%</small>
                        </td>
                        <td>{trip.cargoWeight} kg</td>
                        <td>{trip.distance} km</td>
                        <td>${trip.revenue?.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${trip.status === 'Completed' ? 'badge-completed' : trip.status === 'Cancelled' ? 'badge-cancelled' : trip.status === 'Dispatched' ? 'badge-dispatched' : 'badge-draft'}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td>{trip.startDate || "N/A"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {trip.status === "Dispatched" && hasAccess("trips", "create") && (
                              <>
                                <button className="btn btn-success btn-icon-only" onClick={() => openCompleteModal(trip)} title="Complete Delivery">
                                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                </button>
                                <button className="btn btn-danger btn-icon-only" onClick={() => cancelTrip(trip.id)} title="Cancel Dispatch">
                                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                              </>
                            )}
                            {trip.status === "Draft" && hasAccess("trips", "delete") && (
                              <button className="btn btn-danger btn-icon-only" onClick={() => deleteTrip(trip.id)} title="Delete Draft">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MAINTENANCE LOG VIEW */}
          {/* ========================================================= */}
          {currentView === "maintenance" && (
            <div className="glass-card">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Fleet Repair & Preventive Maintenance Records</h3>
                {hasAccess("maintenance", "create") && <button className="btn btn-primary" onClick={openMaintenanceModal}>Send Vehicle to Shop</button>}
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Vehicle Code</th>
                      <th>Job Description</th>
                      <th>Service Category</th>
                      <th>Service Cost</th>
                      <th>Date Checked In</th>
                      <th>Date Finished</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{log.id}</td>
                        <td>
                          <strong>{log.vehicleId}</strong><br />
                          <small style={{ color: "var(--text-muted)" }}>{vehicles.find(v => v.id === log.vehicleId)?.name}</small>
                        </td>
                        <td>{log.description}</td>
                        <td>{log.type}</td>
                        <td>${log.cost?.toLocaleString()}</td>
                        <td>{log.startDate}</td>
                        <td>{log.endDate || <span style={{ color: "var(--text-muted)" }}>In Progress</span>}</td>
                        <td>
                          <span className={`badge ${log.status === 'Active' ? 'badge-inshop' : 'badge-completed'}`}>
                            {log.status === 'Active' ? 'In Shop' : 'Closed'}
                          </span>
                        </td>
                        <td>
                          {log.status === "Active" && hasAccess("maintenance", "create") && (
                            <button className="btn btn-success btn-icon-only" onClick={() => resolveMaintenance(log)} title="Mark Finished / Available">
                              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FUEL & EXPENSE VIEW */}
          {/* ========================================================= */}
          {currentView === "expenses" && (
            <div className="glass-card">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Fleet Operating Expense Ledger</h3>
                {hasAccess("expenses", "create") && <button className="btn btn-primary" onClick={openExpenseModal}>Record Expense</button>}
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Expense ID</th>
                      <th>Vehicle Code</th>
                      <th>Date</th>
                      <th>Expense Type</th>
                      <th>Cost Amount</th>
                      <th>Fuel Vol.</th>
                      <th>Notes / Receipts Reference</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{exp.id}</td>
                        <td>
                          <strong>{exp.vehicleId}</strong><br />
                          <small style={{ color: "var(--text-muted)" }}>{vehicles.find(v => v.id === exp.vehicleId)?.name}</small>
                        </td>
                        <td>{exp.date}</td>
                        <td>
                          <span className={`badge ${exp.type === 'Fuel' ? 'badge-ontrip' : 'badge-draft'}`}>{exp.type}</span>
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>${exp.amount?.toLocaleString()}</td>
                        <td>{exp.quantity ? `${exp.quantity} L` : "N/A"}</td>
                        <td>{exp.notes}</td>
                        <td>
                          {hasAccess("expenses", "delete") && (
                            <button className="btn btn-danger btn-icon-only" onClick={() => deleteExpense(exp.id)} title="Delete Expense">
                              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "15px", height: "15px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* REPORTS VIEW */}
          {/* ========================================================= */}
          {currentView === "reports" && (
            <div>
              {/* Reports Cards */}
              <div className="kpi-grid">
                <div className="kpi-card kpi-available">
                  <span className="kpi-label">Cumulative Operations Revenue</span>
                  <span className="kpi-val">${trips.filter(t => t.status === "Completed").reduce((sum, t) => sum + (t.revenue || 0), 0).toLocaleString()}</span>
                  <span className="kpi-sub">From completed deliveries</span>
                </div>
                <div className="kpi-card kpi-danger">
                  <span className="kpi-label">Operational Outflows</span>
                  <span className="kpi-val">${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                  <span className="kpi-sub">Total Fuel + Shop Repairs</span>
                </div>
                <div className="kpi-card kpi-info">
                  <span className="kpi-label">Net Operating Profit</span>
                  <span className="kpi-val">${(trips.filter(t => t.status === "Completed").reduce((sum, t) => sum + (t.revenue || 0), 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</span>
                  <span className="kpi-sub">Surplus Operating Budget</span>
                </div>
                <div className="kpi-card kpi-available">
                  <span className="kpi-label">Fleet Avg fuel efficiency</span>
                  <span className="kpi-val">
                    {(vehicles.map(v => {
                      const vt = trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
                      const dist = vt.reduce((sum, t) => sum + t.distance, 0);
                      const fuel = vt.reduce((sum, t) => sum + t.fuelConsumed, 0);
                      return fuel > 0 ? dist / fuel : 0;
                    }).filter(val => val > 0).reduce((sum, val, _, arr) => sum + val / arr.length, 0) || 0).toFixed(2)} km/L
                  </span>
                  <span className="kpi-sub">Operable fuel economy</span>
                </div>
              </div>

              {/* Exporters buttons */}
              <div className="reports-toolbar">
                <button className="btn btn-secondary" onClick={exportReportsToCSV}>
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Export CSV Ledger
                </button>
                <button className="btn btn-primary" onClick={printReport}>
                  <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  Print Report (PDF)
                </button>
              </div>

              {/* Analytics Graphs */}
              <div className="dashboard-grid" style={{ marginBottom: "24px" }}>
                <div className="glass-card chart-card">
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>ROI performance by Vehicle (%)</h3>
                  <div style={{ height: "calc(100% - 40px)" }}><canvas id="canvasReportsRoi"></canvas></div>
                </div>
                <div className="glass-card chart-card">
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>Fleet Cost Centers ($)</h3>
                  <div style={{ height: "calc(100% - 40px)", display: "flex", justifyContent: "center", alignItems: "center" }}><canvas id="canvasReportsCost"></canvas></div>
                </div>
              </div>

              {/* Report Ledger */}
              <div className="glass-card" id="print-area">
                <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>Detailed Fleet ROI & Consumption Ledger</h3>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Vehicle ID</th>
                        <th>Acquisition Cost</th>
                        <th>Distance Run</th>
                        <th>Fuel Consumed</th>
                        <th>Fuel Efficiency</th>
                        <th>Fuel Cost</th>
                        <th>Maintenance Cost</th>
                        <th>Total Expense</th>
                        <th>Total Revenue</th>
                        <th>Net ROI (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map(v => {
                        const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
                        const totalDistance = vTrips.reduce((sum, t) => sum + t.distance, 0);
                        const totalRevenue = vTrips.reduce((sum, t) => sum + t.revenue, 0);
                        
                        const vExpenses = expenses.filter(e => e.vehicleId === v.id);
                        const fuelCost = vExpenses.filter(e => e.type === "Fuel").reduce((sum, e) => sum + e.amount, 0);
                        const maintCost = vExpenses.filter(e => e.type === "Maintenance").reduce((sum, e) => sum + e.amount, 0);
                        const otherCost = vExpenses.filter(e => e.type !== "Fuel" && e.type !== "Maintenance").reduce((sum, e) => sum + e.amount, 0);
                        const totalOpsCost = fuelCost + maintCost + otherCost;
                        
                        const totalFuelConsumed = vTrips.reduce((sum, t) => sum + t.fuelConsumed, 0);
                        const fuelEfficiency = totalFuelConsumed > 0 ? (totalDistance / totalFuelConsumed).toFixed(2) : "0.00";
                        
                        const roiVal = v.cost > 0 ? (((totalRevenue - (maintCost + fuelCost)) / v.cost) * 100).toFixed(1) : "0.0";

                        return (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{v.id}</td>
                            <td>${v.cost?.toLocaleString()}</td>
                            <td>{totalDistance.toLocaleString()} km</td>
                            <td>{totalFuelConsumed.toLocaleString()} L</td>
                            <td>{fuelEfficiency} km/L</td>
                            <td>${fuelCost.toLocaleString()}</td>
                            <td>${maintCost.toLocaleString()}</td>
                            <td style={{ color: "var(--danger)" }}>${totalOpsCost.toLocaleString()}</td>
                            <td style={{ color: "var(--success)", fontWeight: 600 }}>${totalRevenue.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${parseFloat(roiVal) >= 0 ? 'badge-available' : 'badge-retired'}`} style={{ fontSize: "12px" }}>
                                {roiVal}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* 1. VEHICLE FORM MODAL */}
      {/* ========================================================= */}
      {activeModal === "vehicle" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{vehicleForm.editMode ? "Edit Vehicle Info" : "Register New Vehicle"}</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={submitVehicle}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Number</label>
                    <input type="text" className="form-control" placeholder="e.g. Van-05" value={vehicleForm.id} onChange={e => setVehicleForm({ ...vehicleForm, id: e.target.value })} required disabled={vehicleForm.editMode} />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Name / Model</label>
                    <input type="text" className="form-control" placeholder="e.g. Ford Transit" value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select className="form-control" value={vehicleForm.type} onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value })} required>
                      <option value="Van">Van</option>
                      <option value="Semi-Truck">Semi-Truck</option>
                      <option value="Delivery Truck">Delivery Truck</option>
                      <option value="Electric SUV">Electric SUV</option>
                      <option value="Sedan">Sedan</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Max Payload (kg)</label>
                    <input type="number" className="form-control" placeholder="e.g. 1000" value={vehicleForm.maxCapacity} onChange={e => setVehicleForm({ ...vehicleForm, maxCapacity: e.target.value })} required min="1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Odometer (km)</label>
                    <input type="number" className="form-control" placeholder="e.g. 45000" value={vehicleForm.odometer} onChange={e => setVehicleForm({ ...vehicleForm, odometer: e.target.value })} required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Acquisition Cost ($)</label>
                    <input type="number" className="form-control" placeholder="e.g. 35000" value={vehicleForm.cost} onChange={e => setVehicleForm({ ...vehicleForm, cost: e.target.value })} required min="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" value={vehicleForm.status} onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })} required>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DRIVER FORM MODAL */}
      {/* ========================================================= */}
      {activeModal === "driver" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{driverForm.editMode ? "Edit Driver Profile" : "Add Driver Profile"}</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={submitDriver}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Alex Mercer" value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>License Number</label>
                    <input type="text" className="form-control" placeholder="e.g. DL-99234" value={driverForm.licenseNumber} onChange={e => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} required disabled={driverForm.editMode} />
                  </div>
                  <div className="form-group">
                    <label>License Category</label>
                    <select className="form-control" value={driverForm.licenseCategory} onChange={e => setDriverForm({ ...driverForm, licenseCategory: e.target.value })} required>
                      <option value="Class A CDL">Class A CDL</option>
                      <option value="Class B">Class B</option>
                      <option value="Class C">Class C</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>License Expiry Date</label>
                    <input type="date" className="form-control" value={driverForm.licenseExpiry} onChange={e => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input type="text" className="form-control" placeholder="e.g. 555-0199" value={driverForm.contact} onChange={e => setDriverForm({ ...driverForm, contact: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Driver Safety Score (0-100)</label>
                    <input type="number" className="form-control" placeholder="e.g. 95" value={driverForm.safetyScore} onChange={e => setDriverForm({ ...driverForm, safetyScore: e.target.value })} required min="0" max="100" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={driverForm.status} onChange={e => setDriverForm({ ...driverForm, status: e.target.value })} required>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TRIP DISPATCH WIZARD MODAL */}
      {/* ========================================================= */}
      {activeModal === "trip" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create & Dispatch Trip</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={submitTrip}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Source / Origin</label>
                    <input type="text" className="form-control" placeholder="e.g. Chicago Hub" value={tripForm.source} onChange={e => setTripForm({ ...tripForm, source: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Destination</label>
                    <input type="text" className="form-control" placeholder="e.g. Detroit Depot" value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value })} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Assign Vehicle (Available Only)</label>
                  <select className="form-control" value={tripForm.vehicleId} onChange={e => setTripForm({ ...tripForm, vehicleId: e.target.value })} required>
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.filter(v => v.status === "Available").map(v => (
                      <option key={v.id} value={v.id}>{v.id} - {v.name} (Max Payload: {v.maxCapacity} kg)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Driver (Valid & Available Only)</label>
                  <select className="form-control" value={tripForm.driverId} onChange={e => setTripForm({ ...tripForm, driverId: e.target.value })} required>
                    <option value="">-- Choose Driver --</option>
                    {drivers.filter(d => d.status === "Available" && d.licenseExpiry >= TODAY).map(d => (
                      <option key={d.id} value={d.id}>{d.name} (License: {d.licenseCategory}) - Safety Score: {d.safetyScore}%</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cargo Load Weight (kg)</label>
                    <input type="number" className="form-control" placeholder="e.g. 500" value={tripForm.cargoWeight} onChange={e => setTripForm({ ...tripForm, cargoWeight: e.target.value })} required min="1" />
                  </div>
                  <div className="form-group">
                    <label>Planned Distance (km)</label>
                    <input type="number" className="form-control" placeholder="e.g. 350" value={tripForm.distance} onChange={e => setTripForm({ ...tripForm, distance: e.target.value })} required min="1" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Estimated Revenue ($)</label>
                    <input type="number" className="form-control" placeholder="e.g. 1500" value={tripForm.revenue} onChange={e => setTripForm({ ...tripForm, revenue: e.target.value })} required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Dispatch Mode</label>
                    <select className="form-control" value={tripForm.status} onChange={e => setTripForm({ ...tripForm, status: e.target.value })} required>
                      <option value="Draft">Draft (Save only)</option>
                      <option value="Dispatched">Dispatched (Go Live - Assets set to On Trip)</option>
                    </select>
                  </div>
                </div>

                {checkCargoWeight() && (
                  <div className="alert-banner">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>Warning: Cargo weight exceeds maximum payload of selected vehicle!</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={checkCargoWeight()}>Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. COMPLETE TRIP DIALOG MODAL */}
      {/* ========================================================= */}
      {activeModal === "completeTrip" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Complete Delivery Route</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={submitCompleteTrip}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Trip Routing Summary</label>
                  <p style={{ fontWeight: 500, fontSize: "13px", background: "var(--bg-tertiary)", padding: "12px", borderRadius: "8px" }}>
                    Route: <strong>{completeForm.tripId}</strong> &bull; Distance: <strong>{completeForm.distance} km</strong> &bull; Vehicle: <strong>{completeForm.vehicleId}</strong>
                  </p>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Final Odometer Reading (km)</label>
                    <input type="number" className="form-control" value={completeForm.finalOdometer} onChange={e => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} required min={completeForm.startOdometer} />
                    <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>Start reading: {completeForm.startOdometer.toLocaleString()} km</small>
                  </div>
                  <div className="form-group">
                    <label>Fuel Consumed (Liters)</label>
                    <input type="number" className="form-control" placeholder="e.g. 120" value={completeForm.fuelLiters} onChange={e => setCompleteForm({ ...completeForm, fuelLiters: e.target.value })} required min="1" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Total Fuel Cost ($)</label>
                    <input type="number" className="form-control" placeholder="e.g. 180" value={completeForm.fuelCost} onChange={e => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Actual Final Revenue ($)</label>
                    <input type="number" className="form-control" placeholder="e.g. 2000" value={completeForm.revenue} onChange={e => setCompleteForm({ ...completeForm, revenue: e.target.value })} required min="0" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Delivery / Fuel notes</label>
                  <input type="text" className="form-control" placeholder="Optional notes" value={completeForm.notes} onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-success">Complete Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. LOG MAINTENANCE MODAL */}
      {/* ========================================================= */}
      {activeModal === "maintenance" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Maintenance Event</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={submitMaintenance}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Vehicle (Operable Fleet)</label>
                  <select className="form-control" value={maintForm.vehicleId} onChange={e => setMaintForm({ ...maintForm, vehicleId: e.target.value })} required>
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.filter(v => v.status !== "Retired").map(v => (
                      <option key={v.id} value={v.id}>{v.id} - {v.name} ({v.status})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Maintenance/Repair Description</label>
                  <textarea className="form-control" placeholder="Engine Tune up, brake pads overhaul..." style={{ height: "80px" }} value={maintForm.description} onChange={e => setMaintForm({ ...maintForm, description: e.target.value })} required></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Maintenance Type</label>
                    <select className="form-control" value={maintForm.type} onChange={e => setMaintForm({ ...maintForm, type: e.target.value })} required>
                      <option value="Routine">Routine Service</option>
                      <option value="Repair">Unplanned Repair</option>
                      <option value="Inspection">Compliance Inspection</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Service Cost ($)</label>
                    <input type="number" className="form-control" placeholder="e.g. 350" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} required min="0" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" className="form-control" value={maintForm.startDate} onChange={e => setMaintForm({ ...maintForm, startDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Maintenance Status</label>
                    <select className="form-control" value={maintForm.status} onChange={e => setMaintForm({ ...maintForm, status: e.target.value })} required>
                      <option value="Active">Active (Vehicle set to In Shop immediately)</option>
                      <option value="Closed">Closed (Resolved/Available)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. LOG EXPENSE MODAL */}
      {/* ========================================================= */}
      {activeModal === "expense" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Fleet Expense</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <form onSubmit={submitExpense}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Code</label>
                    <select className="form-control" value={expenseForm.vehicleId} onChange={e => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })} required>
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.id} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expense Category</label>
                    <select className="form-control" value={expenseForm.type} onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })} required>
                      <option value="Fuel">Fuel Purchase</option>
                      <option value="Toll">Road Tolls</option>
                      <option value="Maintenance">Maintenance / Spare Parts</option>
                      <option value="Insurance">Insurance Payment</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cost Amount ($)</label>
                    <input type="number" className="form-control" placeholder="e.g. 80" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Transaction Date</label>
                    <input type="date" className="form-control" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                  </div>
                </div>

                {expenseForm.type === "Fuel" && (
                  <div className="form-group">
                    <label>Fuel Volume (Liters)</label>
                    <input type="number" className="form-control" placeholder="e.g. 50" value={expenseForm.quantity} onChange={e => setExpenseForm({ ...expenseForm, quantity: e.target.value })} required min="1" />
                  </div>
                )}

                <div className="form-group">
                  <label>Notes / Receipts details</label>
                  <input type="text" className="form-control" placeholder="e.g. I-90 toll booth receipt" value={expenseForm.notes} onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. VEHICLE DOCUMENTS MANAGE MODAL */}
      {/* ========================================================= */}
      {activeModal === "document" && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Vehicle Certificates ({documentForm.vehicleId})</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="glass-card" style={{ padding: "16px", marginBottom: "16px", backgroundColor: "var(--bg-tertiary)" }}>
                <form onSubmit={submitDoc} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Certificate Title</label>
                      <input type="text" className="form-control" placeholder="e.g. DOT Compliance" value={documentForm.name} onChange={e => setDocumentForm({ ...documentForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Expiration Date</label>
                      <input type="date" className="form-control" value={documentForm.expiry} onChange={e => setDocumentForm({ ...documentForm, expiry: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Mock File Name (e.g. doc.pdf)</label>
                    <input type="text" className="form-control" placeholder="cert_clearance_2026.pdf" value={documentForm.file} onChange={e => setDocumentForm({ ...documentForm, file: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Add Document</button>
                </form>
              </div>

              <h4 style={{ marginBottom: "8px" }}>Active Documents</h4>
              <div id="document-modal-list">
                {(vehicles.find(v => v.id === documentForm.vehicleId)?.documents || []).length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No documents found.</p>
                ) : (
                  (vehicles.find(v => v.id === documentForm.vehicleId)?.documents || []).map((doc, idx) => {
                    const isExpired = doc.expiry < TODAY;
                    return (
                      <div key={idx} className="document-item">
                        <div>
                          <div className="doc-name">{doc.name} ({doc.file})</div>
                          <div className={`doc-expiry ${isExpired ? 'expired' : ''}`}>Expires: {doc.expiry} {isExpired && "(EXPIRED)"}</div>
                        </div>
                        {hasAccess("vehicles", "update") && (
                          <button className="btn btn-danger btn-icon-only" style={{ padding: "4px", height: "24px", width: "24px" }} onClick={() => deleteDoc(documentForm.vehicleId, idx)} title="Remove">
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
