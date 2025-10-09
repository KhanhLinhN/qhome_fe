'use client'
import {useTranslations} from 'next-intl';
import FilterForm from "../../../components/customer-interaction/FilterForm";
import Table from "../../../components/customer-interaction/Table";
import StatusTabs from "@/src/components/customer-interaction/StatusTabs";
import RequestInfoAndContext from '@/src/components/customer-interaction/RequestInfo';
import ProcessLog from '@/src/components/customer-interaction/ProcessLog';
import RequestLogUpdate from '@/src/components/customer-interaction/RequestLogUpdate';
import Arrow from '@/src/assets/Arrow.svg';
import Image from 'next/image';

export default function Home() {
  const t = useTranslations('customer-interaction.Request');
  const headers = [t('requestNumber'), t('requestTitle'), t('residentName'), t('assignee'), t('dateCreated'), t('priority'), t('status')];
  let isDetail = true;
    

  //sample data
  const requestData = {
      id: 123501835824,
      projectCode: 12234356778,
      residentId: 987654321,
      residentName: 'Anaxagoras',
      imagePath: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      title: 'In Digdag, workflows are packaged together with other files used in the workflows',
      context: "The reason why sessions and attempts are separated is that an execution may fall. When you list sessions up, the expected status is that all sessions are green. If you find a failing session, you check attempts of it, and debugs the problem from the logs. You may upload a new revision to fix the issue, then start a new attempt. Sessions let you easily confirm that all planned executions are successfully done.",
      status: 'Processing',
      priority: 'High',
      createdDate: '04/10/2025',
      updatedDate: '06/10/2025'
  };

  //sample data
    const sampleLogData = [
    {
        id: 3,
        recordId: 123501835824,
        recordType: 'Request',
        staffInChargeId: 1,
        staffInChargeName: 'Staff B',
        requestStatus: 'Completed',
        logType: 'Update',
        content: 'Staff B đã gửi phản hồi và đóng yêu cầu.',
        createdDate: '2025/10/08 15:30:00',
    },
    {
        id: 2,
        recordId: 123501835824,
        recordType: 'Request',
        staffInChargeId: 1,
        staffInChargeName: 'Staff B',
        requestStatus: 'Processing',
        logType: 'Update',
        content: 'Yêu cầu được gán cho Staff B để xử lý.',
        createdDate: '2025/10/07 10:00:00',
    },
    {
        id: 1,
        recordId: 123501835824,
        recordType: 'Request',
        staffInChargeId: 1,
        staffInChargeName: 'Staff B',
        requestStatus: 'New',
        logType: 'Create',
        content: 'Cư dân Anaxagoras tạo yêu cầu mới.',
        createdDate: '2025/10/06 09:15:00',
    },
  ];

  // const titleRequestInfo = [
  //     { title: t('requestNumber'), key: 'number' },
  //     { title: t('projectCode'), key: 'projectCode' },
  //     { title: t('residentName'), key: 'residentName' },
  //     { title: t('dateCreated'), key: 'createdDate' },
  //     { title: t('priority'), key: 'priority' }
  // ];

  const handleBack = () => {
    isDetail = false;
  }

  
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
       
        <div className="flex-grow min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 space-y-6">
              <RequestInfoAndContext
                value={requestData}
                isTicket={true}
                contextTitle={t('contextTitle')}
                contextContextTitle={t('contextContextTitle')}
                contextImageTitle={t('contextImageTitle')}
              ></RequestInfoAndContext>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <RequestLogUpdate
                initialStatusValue={"Processing"}
                onSave={() => {
                    console.log('Saved status:');
                    console.log('Saved content:');
                }}
                onCancel={() => {
                    console.log('Update canceled');
                }}
              ></RequestLogUpdate>
            </div>
          </div>
        </div>
      </div>
    )
};
