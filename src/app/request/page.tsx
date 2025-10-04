'use client'
import {useTranslations} from 'next-intl';
import FilterForm from "../../components/customer-interaction/FilterForm";
import Table from "../../components/customer-interaction/Table";
import StatusTabs from "@/src/components/customer-interaction/StatusTabs";

export default function Home() {
  const t = useTranslations('customer-interaction.Request');
  const headers = [t('requestNumber'), t('requestTitle'), t('residentName'), t('assignee'), t('dateCreated'), t('priority'), t('status')];
    //sample data
  const requestsData = [
    { id: 1, action: false, requestNumber: '01', requestTitle: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'High', status: 'New' },
    { id: 2, action: true, requestNumber: '02', requestTitle: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'Medium', status: 'New' },
    { id: 3, action: false, requestNumber: '03', requestTitle: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'Low', status: 'New' },
    { id: 4, action: false, requestNumber: '04', requestTitle: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'High', status: 'New' },
    { id: 5, action: false, requestNumber: '05', requestTitle: 'My neighbors are very annoying.', residentName: 'Mr.Anaxagoras', assignee: 'Employee A', createdDate: '02/10/2025', priority: 'Medium', status: 'New' },
  ];
  //sample data
  const tabData = [
    { title: "Total requests", count: 0, status: '' },
    { title: "New requests", count: 0, status: 'new' },
    { title: "Processing requests", count: 0, status: 'processing' },
    { title: "Responded requests", count: 10, status: 'responded' },
    { title: "Closed requests", count: 10, status: 'closed' },
    ];

  return (
    <div className="max-w-screen overflow-x-hidden bg-[#F5F7FA] p-6 md:p-10">
        <h1 className="text-2xl font-semibold text-[#02542D] mb-4">{t('requestlist')}</h1>
        <div className="bg-white p-6 rounded-xl w-full">
            <FilterForm></FilterForm>
            <StatusTabs tab={tabData}></StatusTabs>
            <Table 
                data={requestsData} 
                headers={headers}
            ></Table>
        </div>
    </div>
  )
};
