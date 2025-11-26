'use client'
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRequests } from '@/src/hooks/useTableRequest';
import Link from 'next/link';
import axios from '@/src/lib/axios';

// Get Trello board ID from environment or config
const TRELLO_BOARD_ID = process.env.NEXT_PUBLIC_TRELLO_BOARD_ID || '692677f7e70be9a9ad46d5a6';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';

interface KanbanColumn {
  id: string;
  title: string;
  statuses: string[];
  color: string;
  targetStatus: string; // Status to set when card is moved here
}

// Normalize status from backend (NEW, PENDING) to display format (New, Pending)
const normalizeStatus = (status: string): string => {
  if (!status) return '';
  const statusUpper = status.toUpperCase();
  const statusMap: Record<string, string> = {
    'NEW': 'New',
    'PENDING': 'Pending',
    'IN_PROGRESS': 'In Progress',
    'PROCESSING': 'Processing',
    'DONE': 'Done',
    'CANCELLED': 'Cancelled'
  };
  return statusMap[statusUpper] || status;
};

// Convert display status back to backend format
const toBackendStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'New': 'NEW',
    'Pending': 'PENDING',
    'In Progress': 'IN_PROGRESS',
    'Processing': 'IN_PROGRESS',
    'Done': 'DONE',
    'Cancelled': 'CANCELLED'
  };
  return statusMap[status] || status.toUpperCase();
};

export default function TrelloBoardPage() {
  const t = useTranslations('customer-interaction');
  const { allRequestsList, loading } = useRequests();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds to sync with Trello changes
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      statuses: ['New', 'Pending', 'NEW', 'PENDING'],
      targetStatus: 'PENDING',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      statuses: ['Processing', 'In Progress', 'IN_PROGRESS', 'PROCESSING'],
      targetStatus: 'IN_PROGRESS',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'done',
      title: 'Done',
      statuses: ['Done', 'DONE'],
      targetStatus: 'DONE',
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      statuses: ['Cancelled', 'CANCELLED'],
      targetStatus: 'CANCELLED',
      color: 'bg-gray-50 border-gray-200'
    }
  ];

  const getCardsForColumn = (column: KanbanColumn) => {
    if (!allRequestsList) return [];
    return allRequestsList.filter(request => {
      const normalizedStatus = normalizeStatus(request.status || '');
      return column.statuses.some(status => 
        normalizedStatus.toLowerCase() === status.toLowerCase() ||
        (request.status || '').toUpperCase() === status.toUpperCase()
      );
    });
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault();
    if (!draggedCard) return;

    setUpdating(draggedCard);
    try {
      // Update status via API using new status endpoint
      const targetStatus = column.targetStatus;
      
      await axios.patch(
        `${BASE_URL}/api/maintenance-requests/admin/${draggedCard}/status`,
        { status: targetStatus },
        { withCredentials: true }
      );

      // Reload data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật status. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setUpdating(null);
      setDraggedCard(null);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = normalizeStatus(status || '').toLowerCase();
    if (statusLower === 'new' || statusLower === 'pending') return 'bg-blue-100 text-blue-800';
    if (statusLower === 'processing' || statusLower === 'in progress') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'done') return 'bg-green-100 text-green-800';
    if (statusLower === 'cancelled') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const trelloBoardUrl = `https://trello.com/b/${TRELLO_BOARD_ID}`;

  // Debug: Log data
  useEffect(() => {
    if (allRequestsList) {
      console.log('All requests:', allRequestsList);
      console.log('Requests count:', allRequestsList.length);
      // Log status distribution
      const statusCounts = allRequestsList.reduce((acc, req) => {
        const status = normalizeStatus(req.status || '');
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Status distribution:', statusCounts);
    } else {
      console.log('allRequestsList is null or empty');
    }
  }, [allRequestsList]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-2 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#02542D] mb-2">
            {t('trelloBoard') || 'Kanban Board - Maintenance Requests'}
          </h1>
          <p className="text-sm text-gray-600">
            {t('trelloBoardDescription') || 'Kéo thả card để cập nhật status. Tổng số: ' + (allRequestsList?.length || 0) + ' requests'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tự động refresh mỗi 30 giây để sync với Trello
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition flex items-center gap-2"
            title="Làm mới dữ liệu"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <a
            href={trelloBoardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary-2 text-white text-sm rounded-md hover:bg-primary-3 transition flex items-center gap-2"
          >
            <span>📋</span>
            <span>Mở Trello Board</span>
          </a>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column) => {
            const cards = getCardsForColumn(column);
            return (
              <div
                key={column.id}
                className={`flex-shrink-0 w-80 ${column.color} rounded-lg border-2 p-4 flex flex-col`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {column.title}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {cards.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      Không có card nào
                    </div>
                  ) : (
                    cards.map((card) => {
                      const isDragging = draggedCard === card.id;
                      const isUpdating = updating === card.id;
                      return (
                        <div
                          key={card.id}
                          draggable={!isUpdating}
                          onDragStart={(e) => handleDragStart(e, card.id)}
                          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 transition ${
                            isDragging ? 'opacity-50' : 'hover:shadow-md cursor-move'
                          } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          {isUpdating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-2"></div>
                            </div>
                          )}
                          
                          <Link
                            href={`/customer-interaction/requestDetail/${card.id}`}
                            className="block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(card.status)}`}>
                                {normalizeStatus(card.status)}
                              </span>
                              {(card as any).priority && (
                                <span className="text-xs text-gray-500">
                                  {(card as any).priority}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2">
                              {card.title}
                            </h4>
                            
                            {card.content && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {card.content}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                              <span>{formatDate(card.createdAt)}</span>
                              {card.residentName && (
                                <span className="truncate max-w-[100px]" title={card.residentName}>
                                  👤 {card.residentName}
                                </span>
                              )}
                            </div>

                            {(card as any).estimatedCost && (
                              <div className="mt-2 text-xs font-semibold text-green-600">
                                💰 {new Intl.NumberFormat('vi-VN').format((card as any).estimatedCost)} VNĐ
                              </div>
                            )}
                            
                            {(card as any).fee && (
                              <div className="mt-2 text-xs font-semibold text-green-600">
                                💰 {new Intl.NumberFormat('vi-VN').format((card as any).fee)} VNĐ
                              </div>
                            )}
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs text-blue-800">
          <p>
            💡 <strong>Hướng dẫn:</strong> Kéo thả card giữa các cột để cập nhật status trực tiếp trên web. 
            Khi bạn update status trên web, Trello card sẽ tự động được di chuyển sang list tương ứng.
            {' '}
            <a
              href={trelloBoardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-2 hover:underline font-semibold"
            >
              Mở Trello board
            </a>
            {' '}để xem chi tiết.
          </p>
          <p className="mt-2 text-green-700">
            ✅ <strong>Sync 2 chiều đã được kích hoạt:</strong> 
            {' '}Khi bạn update trên Trello, web sẽ tự động cập nhật (qua webhook). 
            Khi bạn update trên web, Trello sẽ tự động cập nhật. 
            Web tự động refresh mỗi 30 giây để đồng bộ.
          </p>
        </div>
      </div>
    </div>
  );
}
