import { useEffect, useState } from 'react';
import { Vehicle } from '@/src/types/vehicle';
import { getVehicle } from '@/src/services/base/vehicleService';
import { getErrorMessage } from '../types/error';

export function useVehicleDetailPage(vehicleId?: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!vehicleId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await getVehicle(vehicleId);
        setVehicle(data);
      } catch (err: unknown) {
        console.error('Failed to load vehicle detail:', err);
        setError(getErrorMessage(err) || 'Failed to load vehicle detail');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

  return { vehicle, loading, error };
}


