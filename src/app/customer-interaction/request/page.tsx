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
import { Request } from '@/src/types/request';
import { RequestListForTable } from '@/src/hooks/useTableRequest';
import { useState } from 'react';
import { GetRequestsParams } from '@/src/services/customer-interaction/requestService';


export default function Home() {
  const t = useTranslations('customer-interaction.Request');
  const headers = [t('requestNumber'), t('requestTitle'), t('residentName'), t('assignee'), t('dateCreated'), t('priority'), t('status')];
  const [filterparam, setFilterParam] = useState<GetRequestsParams>({});
  const { requestPage, loading: groupsLoading, error: groupsError } = RequestListForTable(filterparam);
  let isDetail = true;
    //sample data
  const requestsData = [
    { id: 1, action: false, number: '01', title: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'High', status: 'New' },
    { id: 2, action: true, number: '02', title: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'Medium', status: 'New' },
    { id: 3, action: false, number: '03', title: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'Low', status: 'New' },
    { id: 4, action: false, number: '04', title: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'High', status: 'New' },
    { id: 5, action: false, number: '05', title: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'Medium', status: 'New' },
  ];
  //sample data
  const tabData = [
    { title: t('totalRequests'), count: 0, status: '' },
    { title: t('newRequests'), count: 0, status: 'new' },
    { title: t('processingRequests'), count: 0, status: 'processing' },
    { title: t('respondedRequests'), count: 10, status: 'responded' },
    { title: t('closedRequests'), count: 10, status: 'closed' },
  ];

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

  const handleRowClick = () => {
    isDetail = true;
  }
  
  // Handle loading and error states
  if (groupsLoading) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-2 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
    );
  }

  if (groupsError) {
    return (
        <div className="px-[41px] py-12 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {t('error')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-2 text-white rounded-md hover:bg-primary-3"
            >
              {t('retry')}
            </button>
          </div>
        </div>
    );
  }

  if (!isDetail) {
    return (
      <div className="lg:col-span-1 space-y-6">
        <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA] p-6 md:p-10">
            <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('requestlist')}</h1>
            <div className="bg-white p-6 rounded-xl w-full">
                <FilterForm
                    type="requests"
                ></FilterForm>
                <StatusTabs 
                    tabList={tabData}
                    type="requests"
                ></StatusTabs>
                <Table 
                    data={requestsData} 
                    // onRowClick={handleRowClick}
                    headers={headers}
                ></Table>
            </div>
        </div>
      </div>
    )
  }
  if(isDetail){
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 space-y-6">
              <RequestInfoAndContext
                value={requestData}
                // titleRequestInfo={titleRequestInfo}
                contextTitle={t('contextTitle')}
                contextContextTitle={t('contextContextTitle')}
                contextImageTitle={t('contextImageTitle')}
              ></RequestInfoAndContext>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <ProcessLog 
                logData={sampleLogData}
                title={t('requestLog')}
              ></ProcessLog>
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
  }

};
