import { useCallback, useEffect, useState } from 'react';
import { Vehicle } from '@/src/types/vehicle';
import { Building } from '@/src/types/building';
import { Unit } from '@/src/types/unit';
import { getBuildings } from '@/src/services/base/buildingService';
import { getUnitsByBuilding } from '@/src/services/base/unitService';
import { getActiveVehicles, getPendingVehicles, getAllVehiclesRequest } from '@/src/services/base/vehicleService';
import { useAuth } from '../contexts/AuthContext';

export interface BuildingWithUnits extends Building {
  units?: UnitWithVehicles[];
  isExpanded?: boolean;
}

export interface UnitWithVehicles extends Unit {
  vehicles?: Vehicle[];
  isExpanded?: boolean;
}

export const useVehiclePage = (type: 'active' | 'pending') => {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<BuildingWithUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadData = async () => {
      // if (!user) {
      //   setLoading(false);
      //   return;
      // }
      
      console.log("use");
      setLoading(true);
      setError(null);

      try {
        // Lấy danh sách buildings
        const buildingsData = await getBuildings();
        console.log("buildingsData", buildingsData);
        
        // Lấy danh sách vehicles theo type
        const vehiclesData = type === 'active' 
          ? await getActiveVehicles()
          : await getAllVehiclesRequest();
        // const vehiclesData = await getActiveVehicles();
        console.log("vehiclesData", vehiclesData);

        // Nhóm vehicles theo unitId
        const vehiclesByUnit = vehiclesData.reduce((acc, vehicle) => {
          if (!acc[vehicle.unitId]) {
            acc[vehicle.unitId] = [];
          }
          acc[vehicle.unitId].push(vehicle);
          return acc;
        }, {} as Record<string, Vehicle[]>);

        const buildingsWithData: BuildingWithUnits[] = [];

        for (const building of buildingsData) {
          const units = await getUnitsByBuilding(building.id);
          
          // Filter units có vehicles
          const unitsWithVehicles = units
            .filter(unit => vehiclesByUnit[unit.id]?.length > 0)
            .map(unit => ({
              ...unit,
              vehicles: vehiclesByUnit[unit.id] || [],
              isExpanded: false
            }));

          // Chỉ thêm building nếu có ít nhất 1 unit có vehicles
          if (unitsWithVehicles.length > 0) {
            buildingsWithData.push({
              ...building,
              units: unitsWithVehicles,
              isExpanded: false
            });
          }
        }

        setBuildings(buildingsWithData);
        console.log("buildingsWithData", buildingsWithData)
      } catch (err) {
        console.error('Error loading vehicle data:', err);
        setError('Failed to load vehicle data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [type]);

  // Toggle building expansion
  const toggleBuilding = useCallback((buildingId: string) => {
    setBuildings(prev => 
      prev.map(building => 
        building.id === buildingId 
          ? { ...building, isExpanded: !building.isExpanded }
          : building
      )
    );
  }, []);

  // Toggle unit expansion
  const toggleUnit = useCallback((buildingId: string, unitId: string) => {
    setBuildings(prev => 
      prev.map(building => 
        building.id === buildingId
          ? {
              ...building,
              units: building.units?.map(unit =>
                unit.id === unitId
                  ? { ...unit, isExpanded: !unit.isExpanded }
                  : unit
              )
            }
          : building
      )
    );
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {

    setLoading(true);
    setError(null);

    try {
      const buildingsData = await getBuildings();
      const vehiclesData = type === 'active' 
          ? await getActiveVehicles()
          : await getAllVehiclesRequest();

      const vehiclesByUnit = vehiclesData.reduce((acc, vehicle) => {
        if (!acc[vehicle.unitId]) {
          acc[vehicle.unitId] = [];
        }
        acc[vehicle.unitId].push(vehicle);
        return acc;
      }, {} as Record<string, Vehicle[]>);

      const buildingsWithData: BuildingWithUnits[] = [];

      for (const building of buildingsData) {
        const units = await getUnitsByBuilding(building.id);
        
        const unitsWithVehicles = units
          .filter(unit => vehiclesByUnit[unit.id]?.length > 0)
          .map(unit => ({
            ...unit,
            vehicles: vehiclesByUnit[unit.id] || [],
            isExpanded: false
          }));

        if (unitsWithVehicles.length > 0) {
          buildingsWithData.push({
            ...building,
            units: unitsWithVehicles,
            isExpanded: false
          });
        }
      }

      setBuildings(buildingsWithData);
    } catch (err) {
      console.error('Error refreshing vehicle data:', err);
      setError('Failed to refresh vehicle data');
    } finally {
      setLoading(false);
    }
  }, [type]);

  return {
    buildings,
    loading,
    error,
    toggleBuilding,
    toggleUnit,
    refresh
  };
};

