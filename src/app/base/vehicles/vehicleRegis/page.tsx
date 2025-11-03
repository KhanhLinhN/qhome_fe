'use client'
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useVehiclePage } from '@/src/hooks/useVehiclePage';
import Image from 'next/image';
import DropdownArrow from '@/src/assets/DropdownArrow.svg';
import { VehicleKind } from '@/src/types/vehicle';

export default function VehicleRegistrationPage() {
  const t = useTranslations('Vehicle');
  const router = useRouter();
  const { buildings, loading, error, toggleBuilding, toggleUnit, refresh } = useVehiclePage('pending');
  console.log("buildings", buildings);

  const getVehicleKindLabel = (kind: VehicleKind) => {
    switch (kind) {
      case VehicleKind.CAR:
        return t('car');
      case VehicleKind.MOTORCYCLE:
        return t('motorcycle');
      case VehicleKind.BICYCLE:
        return t('bicycle');
      case VehicleKind.OTHER:
        return t('other');
      default:
        return kind;
    }
  };

  const handleNavigateToActive = () => {
    router.push('/base/vehicles/vehicleAll');
  };

  if (loading) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('error')}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="max-w-screen overflow-x-hidden ">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-[#02542D]">{t('registrationList')}</h1>
          <button
            onClick={handleNavigateToActive}
            className="px-4 py-2 bg-[#02542D] text-white rounded-md hover:bg-[#024428] transition-colors"
          >
            {t('showActiveVehicles')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl w-full min-h-[200px]">
          {buildings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('noData')}
            </div>
          ) : (
            <div className="space-y-4">
              {buildings.map((building) => (
                <div key={building.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Building Header */}
                  <div
                    className="flex items-center justify-between p-4  cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleBuilding(building.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={DropdownArrow}
                        alt="dropdown"
                        width={16}
                        height={16}
                        className={`transition-transform duration-200 ${
                          building.isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-[#02542D]">
                          {t('building')}: {building.name}
                        </span>
                        <span className="ml-3 text-gray-600">({building.code})</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {building.units?.length || 0} {t('unit')}
                    </span>
                  </div>

                  {/* Units List */}
                  {building.isExpanded && building.units && (
                    <div className="bg-white">
                      {building.units.map((unit) => (
                        <div key={unit.id} className="border-t border-gray-200">
                          {/* Unit Header */}
                          <div
                            className="flex items-center justify-between p-4 pl-12 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleUnit(building.id, unit.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Image
                                src={DropdownArrow}
                                alt="dropdown"
                                width={14}
                                height={14}
                                className={`transition-transform duration-200 ${
                                  unit.isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                              <div>
                                <span className="font-medium text-[#02542D]">
                                  {t('unit')}: {unit.name}
                                </span>
                                <span className="ml-3 text-gray-600 text-sm">({unit.code})</span>
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {unit.vehicles?.length || 0} {t('vehicleList')}
                            </span>
                          </div>

                          {/* Vehicles List */}
                          {unit.isExpanded && unit.vehicles && (
                            <div className="bg-gray-50 px-4 pb-4">
                              <table className="w-full ml-12">
                                <thead>
                                  <tr className="border-b border-gray-300">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                      {t('plateNo')}
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                      {t('residentName')}
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                      {t('vehicleKind')}
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                      {t('color')}
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                      {t('registrationDate')}
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {unit.vehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="border-b border-gray-200 hover:bg-white">
                                      <td className="py-3 px-4 text-gray-800 font-medium">
                                        {vehicle.plateNo}
                                      </td>
                                      <td className="py-3 px-4 text-gray-800">
                                        {vehicle.residentName}
                                      </td>
                                      <td className="py-3 px-4 text-gray-800">
                                        {getVehicleKindLabel(vehicle.kind)}
                                      </td>
                                      <td className="py-3 px-4 text-gray-800">
                                        {vehicle.color}
                                      </td>
                                      <td className="py-3 px-4 text-gray-800">
                                        {vehicle.createdAt?.slice(0, 10).replace(/-/g, '/')}
                                      </td>
                                      <td className="py-3 px-4">
                                        <button
                                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                          onClick={() => {
                                            // Handle approve action
                                            console.log('Approve vehicle:', vehicle.id);
                                          }}
                                        >
                                          {t('approveVehicle')}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

