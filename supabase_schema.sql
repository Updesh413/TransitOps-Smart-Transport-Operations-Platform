-- SQL Schema script for TransitOps Smart Transport Operations database
-- Copy and run this script in your Supabase SQL Editor

-- 1. Create Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 0,
    odometer INTEGER NOT NULL DEFAULT 0,
    cost INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Available',
    documents JSONB DEFAULT '[]'::jsonb
);

-- 2. Create Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY, -- maps to licenseNumber
    name TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseCategory" TEXT NOT NULL,
    "licenseExpiry" TEXT NOT NULL,
    contact TEXT NOT NULL,
    "safetyScore" INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'Available',
    email TEXT
);

-- 3. Create Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    "vehicleId" TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    "driverId" TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
    "cargoWeight" INTEGER NOT NULL DEFAULT 0,
    distance INTEGER NOT NULL DEFAULT 0,
    revenue INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    "startDate" TEXT,
    "endDate" TEXT,
    "fuelConsumed" INTEGER DEFAULT 0,
    "endOdometer" INTEGER DEFAULT 0
);

-- 4. Create Maintenance Table
CREATE TABLE IF NOT EXISTS public.maintenance (
    id TEXT PRIMARY KEY,
    "vehicleId" TEXT REFERENCES public.vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    cost INTEGER NOT NULL DEFAULT 0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    status TEXT NOT NULL DEFAULT 'Active'
);

-- 5. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    "vehicleId" TEXT REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    notes TEXT
);

-- Enable Row Level Security (RLS) policies or leave public depending on access controls:
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users read/write permissions for demo purposes
CREATE POLICY "Allow read for authenticated users" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.vehicles FOR ALL USING (true);

CREATE POLICY "Allow read for authenticated users" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.drivers FOR ALL USING (true);

CREATE POLICY "Allow read for authenticated users" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.trips FOR ALL USING (true);

CREATE POLICY "Allow read for authenticated users" ON public.maintenance FOR SELECT USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.maintenance FOR ALL USING (true);

CREATE POLICY "Allow read for authenticated users" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow write for authenticated users" ON public.expenses FOR ALL USING (true);
