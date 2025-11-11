"use client";

import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';
import Edit from '@/src/assets/Edit.svg';
import Delete from '@/src/assets/Delete.svg';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import DetailField from '@/src/components/base-service/DetailField';
import { useServiceDetailPage } from '@/src/hooks/useServiceDetailPage';
import { useNotifications } from '@/src/hooks/useNotifications';
import {
  ServiceBookingType,
  ServicePricingType,
  ServiceCombo,
  ServiceOption,
  ServiceOptionGroup,
  ServiceTicket,
  ServiceTicketType,
} from '@/src/types/service';

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return '-';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

const mapPricingType = (type?: ServicePricingType | string) => {
  switch (type) {
    case ServicePricingType.HOURLY:
      return 'Service.pricing.hourly';
    case ServicePricingType.SESSION:
      return 'Service.pricing.session';
    case ServicePricingType.FREE:
      return 'Service.pricing.free';
    default:
      return 'Service.pricing.unknown';
  }
};

const mapBookingType = (type?: ServiceBookingType | string) => {
  switch (type) {
    case ServiceBookingType.COMBO_BASED:
      return 'Service.booking.combo';
    case ServiceBookingType.TICKET_BASED:
      return 'Service.booking.ticket';
    case ServiceBookingType.OPTION_BASED:
      return 'Service.booking.option';
    case ServiceBookingType.STANDARD:
      return 'Service.booking.standard';
    default:
      return 'Service.booking.unknown';
  }
};

const mapTicketType = (type?: ServiceTicketType | string) => {
  switch (type) {
    case ServiceTicketType.DAY:
      return 'Service.ticketType.day';
    case ServiceTicketType.NIGHT:
      return 'Service.ticketType.night';
    case ServiceTicketType.HOURLY:
      return 'Service.ticketType.hourly';
    case ServiceTicketType.DAILY:
      return 'Service.ticketType.daily';
    case ServiceTicketType.FAMILY:
      return 'Service.ticketType.family';
    default:
      return 'Service.ticketType.unknown';
  }
};

export default function ServiceDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id;
  const { show } = useNotifications();

  const { serviceData, loading, error } = useServiceDetailPage(serviceId);

  const handleBack = () => {
    router.push('/base/serviceList');
  };

  const handleEdit = () => {
    if (!serviceId) return;
    router.push(`/base/serviceEdit/${serviceId}`);
  };

  if (loading) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Service.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {t('Service.error')}
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
          >
            {t('Service.returnList')}
          </button>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="px-[41px] py-12 flex items-center justify-center">
        <div className="text-center text-gray-600">
          {t('Service.noData')}
        </div>
      </div>
    );
  }

  const serviceIdValue = Array.isArray(serviceId) ? serviceId[0] : (serviceId as string) ?? '';
  const bookingType = serviceData.bookingType;
  const isComboBooking = bookingType === ServiceBookingType.COMBO_BASED;
  const isOptionBooking = bookingType === ServiceBookingType.OPTION_BASED;
  const isTicketBooking = bookingType === ServiceBookingType.TICKET_BASED;

  const handleNavigateToCreate = (type: string) => {
    if (!serviceIdValue) return;
    router.push(`/base/serviceType?serviceId=${serviceIdValue}&type=${type}`);
  };

  const handleAddCombo = () => handleNavigateToCreate('combo');
  const handleAddOption = () => handleNavigateToCreate('option');
  const handleAddOptionGroup = () => handleNavigateToCreate('option-group');
  const handleAddTicket = () => handleNavigateToCreate('ticket');

  const handleEditCombo = (comboId?: string) => {
    if (!comboId) return;
    show('Chức năng chỉnh sửa gói dịch vụ đang được phát triển.', 'info');
  };

  const handleDeleteCombo = (comboId?: string) => {
    if (!comboId) return;
    show('Chức năng xóa gói dịch vụ đang được phát triển.', 'info');
  };

  const handleEditOption = (optionId?: string) => {
    if (!optionId) return;
    show('Chức năng chỉnh sửa tùy chọn đang được phát triển.', 'info');
  };

  const handleDeleteOption = (optionId?: string) => {
    if (!optionId) return;
    show('Chức năng xóa tùy chọn đang được phát triển.', 'info');
  };

  const handleEditOptionGroup = (groupId?: string) => {
    if (!groupId) return;
    show('Chức năng chỉnh sửa nhóm tùy chọn đang được phát triển.', 'info');
  };

  const handleDeleteOptionGroup = (groupId?: string) => {
    if (!groupId) return;
    show('Chức năng xóa nhóm tùy chọn đang được phát triển.', 'info');
  };
  const handleEditTicket = (ticketId?: string) => {
    if (!ticketId) {
      return;
    }
    show('Chức năng chỉnh sửa vé đang được phát triển.', 'info');
  };

  const handleDeleteTicket = (ticketId?: string) => {
    if (!ticketId) {
      return;
    }
    show('Chức năng xóa vé đang được phát triển.', 'info');
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans">
      <div
        className="max-w-5xl mx-auto mb-6 flex items-center cursor-pointer"
        onClick={handleBack}
      >
        <Image
          src={Arrow}
          alt="Back"
          width={20}
          height={20}
          className="w-5 h-5 mr-2"
        />
        <span className="text-[#02542D] font-bold text-2xl hover:text-opacity-80 transition duration-150">
          {t('Service.return')}
        </span>
      </div>

      <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#02542D]">
              {t('Service.detailTitle')}
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              className="p-2 rounded-lg bg-[#739559] hover:bg-opacity-80 transition duration-150 flex items-center gap-2"
              onClick={handleEdit}
            >
              <Image
                src={Edit}
                alt={t('Service.editService')}
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-white">Chỉnh sửa</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <DetailField label={t('Service.code')} value={serviceData.code ?? '-'} readonly={true} />
          <DetailField label={t('Service.name')} value={serviceData.name ?? '-'} readonly={true} />
          <DetailField
            label={t('Service.category')}
            value={serviceData.category?.name ?? '-'}
            readonly={true}
          />
          <DetailField
            label={t('Service.pricingType')}
            value={t(mapPricingType(serviceData.pricingType))}
            readonly={true}
          />
          <DetailField
            label={t('Service.bookingType')}
            value={t(mapBookingType(serviceData.bookingType))}
            readonly={true}
          />
          {serviceData.pricingType === ServicePricingType.HOURLY && (
            <DetailField
              label={t('Service.pricePerHour')}
              value={formatCurrency(serviceData.pricePerHour)}
              readonly={true}
            />
          )}
          {serviceData.pricingType === ServicePricingType.SESSION && (
            <DetailField
              label={t('Service.pricePerSession')}
              value={formatCurrency(serviceData.pricePerSession)}
              readonly={true}
            />
          )}
          <DetailField
            label={t('Service.maxCapacity')}
            value={serviceData.maxCapacity !== undefined && serviceData.maxCapacity !== null ? serviceData.maxCapacity.toString() : '-'}
            readonly={true}
          />
          <DetailField
            label={t('Service.minDuration')}
            value={
              serviceData.minDurationHours !== undefined && serviceData.minDurationHours !== null
                ? serviceData.minDurationHours.toString()
                : '-'
            }
            readonly={true}
          />
          <DetailField
            label={t('Service.maxDuration')}
            value={
              serviceData.maxDurationHours !== undefined && serviceData.maxDurationHours !== null
                ? serviceData.maxDurationHours.toString()
                : '-'
            }
            readonly={true}
          />
          <DetailField
            label={t('Service.advanceBookingDays')}
            value={
              serviceData.advanceBookingDays !== undefined && serviceData.advanceBookingDays !== null
                ? serviceData.advanceBookingDays.toString()
                : '-'
            }
            readonly={true}
          />
          <DetailField
            label={t('Service.location')}
            value={serviceData.location ?? '-'}
            readonly={true}
          />
          <DetailField
            label={t('Service.mapUrl')}
            value={serviceData.mapUrl ?? '-'}
            readonly={true}
          />
          <DetailField
            label={t('Service.description')}
            value={serviceData.description ?? '-'}
            readonly={true}
            type="textarea"
            isFullWidth
          />
          <DetailField
            label={t('Service.rules')}
            value={serviceData.rules ?? '-'}
            readonly={true}
            type="textarea"
            isFullWidth
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 gap-6">
        {isComboBooking && (
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#02542D]">
                {t('Service.combos')}
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-[#02542D] px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-80 transition"
                onClick={handleAddCombo}
              >
                {t('Service.addCombo')}
              </button>
            </div>
            {serviceData.combos && serviceData.combos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.comboName')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.comboCode')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.comboPrice')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.status')}</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">{t('Service.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serviceData.combos.map((combo: ServiceCombo) => (
                      <tr key={combo.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{combo.name ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{combo.code ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{formatCurrency(combo.price ?? null)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              combo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {combo.isActive ? t('Service.active') : t('Service.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex space-x-2 justify-center">
                            <button
                              type="button"
                              onClick={() => handleEditCombo(combo.id)}
                              className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition"
                            >
                              <Image src={Edit} alt="Edit combo" width={24} height={24} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCombo(combo.id)}
                              className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition"
                            >
                              <Image src={Delete} alt="Delete combo" width={24} height={24} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">
                {t('Service.noCombos')}
              </div>
            )}
          </section>
        )}

        {isOptionBooking && (
          <>
            <section className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#02542D]">
                  {t('Service.options')}
                </h2>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#02542D] px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-80 transition"
                  onClick={handleAddOption}
                >
                  {t('Service.addOption')}
                </button>
              </div>
              {serviceData.options && serviceData.options.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {serviceData.options.map((option: ServiceOption) => (
                    <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-[#02542D]">{option.name ?? '-'}</h3>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-1 ${
                              option.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {option.isActive ? t('Service.active') : t('Service.inactive')}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditOption(option.id)}
                            className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition"
                          >
                            <Image src={Edit} alt="Edit option" width={24} height={24} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(option.id)}
                            className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition"
                          >
                            <Image src={Delete} alt="Delete option" width={24} height={24} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{option.description || t('Service.noDescription')}</p>
                      <p className="text-sm text-gray-700">
                        <strong>{t('Service.optionPrice')}:</strong> {formatCurrency(option.price ?? null)}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>{t('Service.optionUnit')}:</strong> {option.unit || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">
                  {t('Service.noOptions')}
                </div>
              )}
            </section>
          </>
        )}

        {isTicketBooking && (
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#02542D]">
                {t('Service.tickets')}
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-[#02542D] px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-80 transition"
                onClick={handleAddTicket}
              >
                {t('Service.addTicket')}
              </button>
            </div>
            {serviceData.tickets && serviceData.tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.ticketName')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.ticketCode')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.ticketTypeLabel')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.ticketDuration')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.ticketPrice')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.ticketMaxPeople')}</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">{t('Service.status')}</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">{t('Service.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serviceData.tickets.map((ticket: ServiceTicket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{ticket.name ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{ticket.code ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{t(mapTicketType(ticket.ticketType))}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {ticket.durationHours != null ? ticket.durationHours.toString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatCurrency(ticket.price ?? null)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {ticket.maxPeople != null ? ticket.maxPeople.toString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              ticket.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {ticket.isActive ? t('Service.active') : t('Service.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex space-x-2 justify-center">
                            <button
                              type="button"
                              onClick={() => handleEditTicket(ticket.id)}
                              className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 transition"
                            >
                              <Image src={Edit} alt="Edit ticket" width={24} height={24} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="w-[47px] h-[34px] flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 transition"
                            >
                              <Image src={Delete} alt="Delete ticket" width={24} height={24} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">
                {t('Service.noTickets')}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

