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
      residentName: 'Anaxagoras',
      createdDate: '04/10/2025',
      assignee: 'Staff A',
      priority: 'High',
      status: 'Processing',
      title: 'In Digdag, workflows are packaged together with other files used in the workflows',
      context: "The reason why sessions and attempts are separated is that an execution may fall. When you list sessions up, the expected status is that all sessions are green. If you find a failing session, you check attempts of it, and debugs the problem from the logs. You may upload a new revision to fix the issue, then start a new attempt. Sessions let you easily confirm that all planned executions are successfully done."
  };

  //sample data
  const sampleLogData = [
    {
        id: 3,
        status: 'Completed',
        createdDate: '2025/10/08 15:30:00',
        content: 'Staff B đã gửi phản hồi và đóng yêu cầu.'    
    },
    {
        id: 2,
        status: 'Processing',
        createdDate: '2025/10/07 10:00:00',
        content: 'Yêu cầu được gán cho Staff B để xử lý.'
    },
    {
        id: 1,
        status: 'New',
        createdDate: '2025/10/06 09:15:00',
        content: 'Cư dân Anaxagoras tạo yêu cầu mới.'
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
                    onRowClick={handleRowClick}
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
