'use client'
import {useTranslations} from 'next-intl';
import RequestInfoAndContext from '@/src/components/customer-interaction/RequestInfo';
import ProcessLog from '@/src/components/customer-interaction/ProcessLog';
import RequestLogUpdate from '@/src/components/customer-interaction/RequestLogUpdate';
import Arrow from '@/src/assets/Arrow.svg';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useRequestDetails } from '@/src/hooks/useRequestDetails'; 
import { LogUpdateData } from '@/src/components/customer-interaction/RequestLogUpdate'; // Import type


export default function RequestDetailPage() {
    const t = useTranslations('customer-interaction.Request');
    const router = useRouter();
    const params = useParams();

    const requestId = params.id
    const { requestData, logData, loading, error, addLog, isSubmitting } = useRequestDetails(requestId);
    const isUnactive = requestData?.status === 'Done'

    const handleBack = () => {
        router.back(); // Navigate to the previous page
    }

    const handleSaveLog = async (data: LogUpdateData) => {
        try {
            await addLog(data);
        } catch (err) {
          console.error("Save failed:", err);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{t('error')}: {error.message}</div>;
    }
    
    if (!requestData) {
        return <div className="flex justify-center text-xl font-bold items-center h-screen">{t('noData')}</div>;
    }

    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
        <div className="flex items-center text-xl font-bold text-gray-800 pb-4 text-[#02542D] flex-none">
            <Image 
              src={Arrow} 
              alt="Back" 
              className="h-6 w-6 mr-2 cursor-pointer" 
              onClick={() => {
                  handleBack();
              }}/>
            {t('requestDetails')}
        </div>
        <div className="flex-grow min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="lg:col-span-1 space-y-6">
              <RequestInfoAndContext
                value={requestData}
                contextTitle={t('contextTitle')}
                contextContextTitle={t('contextContextTitle')}
                contextImageTitle={t('contextImageTitle')}
              ></RequestInfoAndContext>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <ProcessLog 
                logData={logData}
                title={t('requestLog')}
              ></ProcessLog>
              {!isUnactive && (
                <RequestLogUpdate
                  initialStatusValue={requestData.status ?? 'Processing'}
                  onSave={handleSaveLog}
                  unactive={false}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        </div>
      </div>

    )
}
