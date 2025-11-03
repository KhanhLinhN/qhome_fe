import axios from "@/src/lib/axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

// Types for Reading Cycle
export type ReadingCycleStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface ReadingCycleDto {
  id: string;
  name: string;
  periodFrom: string; // ISO date string
  periodTo: string; // ISO date string
  status: ReadingCycleStatus;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  // Keep these for backward compatibility
  fromDate?: string;
  toDate?: string;
  serviceId?: string;
}

export interface ReadingCycleCreateReq {
  name: string;
  periodFrom: string;
  periodTo: string;
  description?: string;
  createdBy?: string;
  // Keep for backward compatibility
  fromDate?: string;
  toDate?: string;
  serviceId?: string;
}

export interface ReadingCycleUpdateReq {
  name?: string;
  periodFrom?: string;
  periodTo?: string;
  description?: string;
  // Keep for backward compatibility
  fromDate?: string;
  toDate?: string;
}

// Types for Meter
export interface MeterDto {
  id: string;
  unitId: string;
  serviceId: string;
  meterCode: string;
  meterType: string;
  location?: string;
  active: boolean;
  lastReading?: number;
  lastReadingDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MeterCreateReq {
  unitId: string;
  serviceId: string;
  meterCode: string;
  meterType: string;
  location?: string;
}

// Types for Meter Reading
export interface MeterReadingDto {
  id: string;
  meterId: string;
  reading: number;
  readingDate: string;
  sessionId?: string;
  assignmentId?: string;
  createdBy: string;
  createdAt: string;
}

export interface MeterReadingCreateReq {
  meterId: string;
  reading: number;
  readingDate: string;
  sessionId?: string;
  assignmentId?: string;
}

// Types for Meter Reading Assignment
export interface MeterReadingAssignmentDto {
  id: string;
  cycleId: string;
  assignedTo: string;
  assignedBy: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  floors: number[];
  buildingId: string;
  createdAt: string;
  completedAt?: string;
}

export interface MeterReadingAssignmentCreateReq {
  cycleId: string;
  assignedTo: string;
  floors: number[];
  buildingId: string;
}

export interface AssignmentProgressDto {
  totalMeters: number;
  readMeters: number;
  remainingMeters: number;
  progressPercentage: number;
}

// Water Formula (stored as metadata or separate endpoint - assuming it's part of cycle config)
export interface WaterFormula {
  id: string;
  fromAmount: number;
  toAmount: number | null;
  price: number;
}

export interface WaterCycleConfig {
  cycleId: string;
  formula: WaterFormula[];
}

// Reading Cycle API
export async function getAllReadingCycles(): Promise<ReadingCycleDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/reading-cycles`,
    { withCredentials: true }
  );
  const data = response.data;
  // Map periodFrom/periodTo to fromDate/toDate for backward compatibility
  return data.map((cycle: any) => ({
    ...cycle,
    fromDate: cycle.periodFrom,
    toDate: cycle.periodTo,
  }));
}

export async function getReadingCycleById(cycleId: string): Promise<ReadingCycleDto> {
  const response = await axios.get(
    `${BASE_URL}/api/reading-cycles/${cycleId}`,
    { withCredentials: true }
  );
  const data = response.data;
  // Map periodFrom/periodTo to fromDate/toDate for backward compatibility
  return {
    ...data,
    fromDate: data.periodFrom,
    toDate: data.periodTo,
  };
}

export async function getReadingCyclesByStatus(status: ReadingCycleStatus): Promise<ReadingCycleDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/reading-cycles/status/${status}`,
    { withCredentials: true }
  );
  const data = response.data;
  // Map periodFrom/periodTo to fromDate/toDate for backward compatibility
  return data.map((cycle: any) => ({
    ...cycle,
    fromDate: cycle.periodFrom,
    toDate: cycle.periodTo,
  }));
}

export async function getReadingCyclesByPeriod(fromDate: string, toDate: string): Promise<ReadingCycleDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/reading-cycles/period`,
    { 
      params: { from: fromDate, to: toDate },
      withCredentials: true 
    }
  );
  const data = response.data;
  // Map periodFrom/periodTo to fromDate/toDate for backward compatibility
  return data.map((cycle: any) => ({
    ...cycle,
    fromDate: cycle.periodFrom,
    toDate: cycle.periodTo,
  }));
}

export async function createReadingCycle(req: ReadingCycleCreateReq): Promise<ReadingCycleDto> {
  // Map fromDate/toDate to periodFrom/periodTo if provided
  const requestBody = {
    name: req.name,
    periodFrom: req.periodFrom || req.fromDate,
    periodTo: req.periodTo || req.toDate,
    description: req.description,
    createdBy: req.createdBy,
  };
  
  const response = await axios.post(
    `${BASE_URL}/api/reading-cycles`,
    requestBody,
    { withCredentials: true }
  );
  const data = response.data;
  return {
    ...data,
    fromDate: data.periodFrom,
    toDate: data.periodTo,
  };
}

export async function updateReadingCycle(
  cycleId: string, 
  req: ReadingCycleUpdateReq
): Promise<ReadingCycleDto> {
  // Map fromDate/toDate to periodFrom/periodTo if provided
  const requestBody: any = {};
  if (req.name !== undefined) requestBody.name = req.name;
  if (req.periodFrom !== undefined) requestBody.periodFrom = req.periodFrom;
  else if (req.fromDate !== undefined) requestBody.periodFrom = req.fromDate;
  if (req.periodTo !== undefined) requestBody.periodTo = req.periodTo;
  else if (req.toDate !== undefined) requestBody.periodTo = req.toDate;
  if (req.description !== undefined) requestBody.description = req.description;
  
  const response = await axios.put(
    `${BASE_URL}/api/reading-cycles/${cycleId}`,
    requestBody,
    { withCredentials: true }
  );
  const data = response.data;
  // Map periodFrom/periodTo to fromDate/toDate for backward compatibility
  return {
    ...data,
    fromDate: data.periodFrom,
    toDate: data.periodTo,
  };
}

export async function changeReadingCycleStatus(
  cycleId: string, 
  status: ReadingCycleStatus
): Promise<ReadingCycleDto> {
  const response = await axios.patch(
    `${BASE_URL}/api/reading-cycles/${cycleId}/status`,
    null,
    { 
      params: { status },
      withCredentials: true 
    }
  );
  const data = response.data;
  // Map periodFrom/periodTo to fromDate/toDate for backward compatibility
  return {
    ...data,
    fromDate: data.periodFrom,
    toDate: data.periodTo,
  };
}

export async function deleteReadingCycle(cycleId: string): Promise<void> {
  await axios.delete(
    `${BASE_URL}/api/reading-cycles/${cycleId}`,
    { withCredentials: true }
  );
}

// Meter API
export async function getAllMeters(params?: {
  unitId?: string;
  serviceId?: string;
  buildingId?: string;
  active?: boolean;
}): Promise<MeterDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meters`,
    { 
      params,
      withCredentials: true 
    }
  );
  return response.data;
}

export async function getMeterById(meterId: string): Promise<MeterDto> {
  const response = await axios.get(
    `${BASE_URL}/api/meters/${meterId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMetersByUnit(unitId: string): Promise<MeterDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meters/unit/${unitId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMetersByService(serviceId: string): Promise<MeterDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meters/service/${serviceId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMetersByBuilding(buildingId: string): Promise<MeterDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meters/building/${buildingId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function createMeter(req: MeterCreateReq): Promise<MeterDto> {
  const response = await axios.post(
    `${BASE_URL}/api/meters`,
    req,
    { withCredentials: true }
  );
  return response.data;
}

export async function updateMeter(meterId: string, req: Partial<MeterCreateReq>): Promise<MeterDto> {
  const response = await axios.put(
    `${BASE_URL}/api/meters/${meterId}`,
    req,
    { withCredentials: true }
  );
  return response.data;
}

export async function deactivateMeter(meterId: string): Promise<void> {
  await axios.patch(
    `${BASE_URL}/api/meters/${meterId}/deactivate`,
    null,
    { withCredentials: true }
  );
}

export async function deleteMeter(meterId: string): Promise<void> {
  await axios.delete(
    `${BASE_URL}/api/meters/${meterId}`,
    { withCredentials: true }
  );
}

// Meter Reading API
export async function createMeterReading(req: MeterReadingCreateReq): Promise<MeterReadingDto> {
  const response = await axios.post(
    `${BASE_URL}/api/meter-readings`,
    req,
    { withCredentials: true }
  );
  return response.data;
}

// Meter Reading Assignment API
export async function createMeterReadingAssignment(
  req: MeterReadingAssignmentCreateReq
): Promise<MeterReadingAssignmentDto> {
  const response = await axios.post(
    `${BASE_URL}/api/meter-reading-assignments`,
    req,
    { withCredentials: true }
  );
  return response.data;
}

export async function getAssignmentById(assignmentId: string): Promise<MeterReadingAssignmentDto> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/${assignmentId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getAssignmentsByCycle(cycleId: string): Promise<MeterReadingAssignmentDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/cycle/${cycleId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getAssignmentsByStaff(staffId: string): Promise<MeterReadingAssignmentDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/staff/${staffId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getActiveAssignmentsByStaff(staffId: string): Promise<MeterReadingAssignmentDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/staff/${staffId}/active`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMyAssignments(): Promise<MeterReadingAssignmentDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/my-assignments`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMyActiveAssignments(): Promise<MeterReadingAssignmentDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/my-assignments/active`,
    { withCredentials: true }
  );
  return response.data;
}

export async function completeAssignment(assignmentId: string): Promise<MeterReadingAssignmentDto> {
  const response = await axios.patch(
    `${BASE_URL}/api/meter-reading-assignments/${assignmentId}/complete`,
    null,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMetersByAssignment(assignmentId: string): Promise<MeterDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/${assignmentId}/meters`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getAssignmentProgress(assignmentId: string): Promise<AssignmentProgressDto> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-assignments/${assignmentId}/progress`,
    { withCredentials: true }
  );
  return response.data;
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await axios.delete(
    `${BASE_URL}/api/meter-reading-assignments/${assignmentId}`,
    { withCredentials: true }
  );
}

export const WATER_SERVICE_CODE = 'WATER'; // Adjust based on your system

export async function getWaterServiceId(): Promise<string | null> {
  try {
    return null;
  } catch (error) {
    console.error('Failed to get water service ID:', error);
    return null;
  }
}

// Meter Reading Session Types
export interface MeterReadingSessionDto {
  id: string;
  assignmentId: string;
  cycleId: string;
  buildingId: string;
  serviceId: string;
  readerId: string;
  startedAt: string;
  completedAt?: string;
  unitsRead: number;
  deviceInfo?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MeterReadingSessionCreateReq {
  assignmentId: string;
  deviceInfo?: string;
}

// Meter Reading Export Types
export interface MeterReadingImportResponse {
  totalReadings: number;
  invoicesCreated: number;
  message: string;
}

// Billing Cycle Types
export interface BillingCycleDto {
  id: string;
  name: string;
  periodFrom: string;
  periodTo: string;
  status: string;
}

export interface CreateBillingCycleRequest {
  name: string;
  periodFrom: string;
  periodTo: string;
  status?: string;
}

// Meter Reading Session API
export async function startMeterReadingSession(
  req: MeterReadingSessionCreateReq
): Promise<MeterReadingSessionDto> {
  const response = await axios.post(
    `${BASE_URL}/api/meter-reading-sessions`,
    req,
    { withCredentials: true }
  );
  return response.data;
}

export async function completeMeterReadingSession(sessionId: string): Promise<MeterReadingSessionDto> {
  const response = await axios.patch(
    `${BASE_URL}/api/meter-reading-sessions/${sessionId}/complete`,
    null,
    { withCredentials: true }
  );
  return response.data;
}

export async function getSessionById(sessionId: string): Promise<MeterReadingSessionDto> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-sessions/${sessionId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getSessionsByAssignment(assignmentId: string): Promise<MeterReadingSessionDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-sessions/assignment/${assignmentId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getSessionsByStaff(staffId: string): Promise<MeterReadingSessionDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-sessions/staff/${staffId}`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMySessions(): Promise<MeterReadingSessionDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-sessions/my-sessions`,
    { withCredentials: true }
  );
  return response.data;
}

export async function getMyActiveSession(): Promise<MeterReadingSessionDto | null> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-sessions/my-active-session`,
    { withCredentials: true }
  );
  return response.data || null;
}

export async function getCompletedSessionsByStaff(staffId: string): Promise<MeterReadingSessionDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/meter-reading-sessions/staff/${staffId}/completed`,
    { withCredentials: true }
  );
  return response.data;
}

// Meter Reading Export API
export async function exportReadingsByCycle(cycleId: string): Promise<MeterReadingImportResponse> {
  const response = await axios.post(
    `${BASE_URL}/api/meter-readings/export/cycle/${cycleId}`,
    null,
    { withCredentials: true }
  );
  return response.data;
}

// Billing Cycle API
export async function loadBillingPeriod(year: number): Promise<BillingCycleDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/billing-cycles/loadPeriod`,
    { 
      params: { year },
      withCredentials: true 
    }
  );
  return response.data;
}

export async function getBillingCyclesByPeriod(
  startDate: string,
  endDate: string
): Promise<BillingCycleDto[]> {
  const response = await axios.get(
    `${BASE_URL}/api/billing-cycles`,
    {
      params: { startDate, endDate },
      withCredentials: true
    }
  );
  return response.data;
}

export async function createBillingCycle(req: CreateBillingCycleRequest): Promise<BillingCycleDto> {
  const response = await axios.post(
    `${BASE_URL}/api/billing-cycles`,
    req,
    { withCredentials: true }
  );
  return response.data;
}

export async function updateBillingCycleStatus(
  cycleId: string,
  status: string
): Promise<BillingCycleDto> {
  const response = await axios.put(
    `${BASE_URL}/api/billing-cycles/${cycleId}/status`,
    null,
    {
      params: { status },
      withCredentials: true
    }
  );
  return response.data;
}

