import React, { useState, useMemo } from 'react';
import { Modal, ConfirmModal } from '../component/Modal';
import ExcelJS from 'exceljs';

const ViewOrders = ({ orders, setCurrentPage, updateOrderStatus, deleteOrder, refreshOrders, setEditingOrder }) => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [confirmConfig, setConfirmConfig] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedDate, setSelectedDate] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDubaiDate = (utcDateString) => {
    if (!utcDateString) return '';
    const date = new Date(utcDateString);
    if (isNaN(date)) return 'Invalid Date';
    return date.toLocaleString('en-GB', {
      timeZone: 'Asia/Dubai',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Get unique dates from orders
  const availableDates = useMemo(() => {
    const dates = orders.map(order => {
      if (!order.created_at) return null;
      
      const date = new Date(order.created_at);
      if (isNaN(date)) return null;
      
      // Convert to Dubai timezone
      const dubaiDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      const hour = dubaiDate.getHours();
      
      // Create business date
      let businessDate = new Date(dubaiDate.getFullYear(), dubaiDate.getMonth(), dubaiDate.getDate());
      
      // If before 10 AM, count as previous day
      if (hour < 10) {
        businessDate.setDate(businessDate.getDate() - 1);
      }
      
      return businessDate.toISOString().split('T')[0];
    }).filter(Boolean);
    
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
    return uniqueDates;
  }, [orders]);

  // Get dates for current month view
  const datesInCurrentMonth = useMemo(() => {
    return availableDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === currentMonth.getMonth() && 
             date.getFullYear() === currentMonth.getFullYear();
    });
  }, [availableDates, currentMonth]);

  // Filter orders based on selected date
  const filteredOrders = useMemo(() => {
    if (selectedDate === 'all') {
      return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return orders.filter(order => {
      if (!order.created_at) return false;
      
      const date = new Date(order.created_at);
      if (isNaN(date)) return false;
      
      // Convert to Dubai timezone
      const dubaiDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      const hour = dubaiDate.getHours();
      
      // Create business date
      let businessDate = new Date(dubaiDate.getFullYear(), dubaiDate.getMonth(), dubaiDate.getDate());
      
      // If before 10 AM, count as previous day
      if (hour < 10) {
        businessDate.setDate(businessDate.getDate() - 1);
      }
      
      const orderBusinessDate = businessDate.toISOString().split('T')[0];
      return orderBusinessDate === selectedDate;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders, selectedDate]);

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateRangeText = () => {
    if (selectedDate === 'all') {
      return 'All Orders';
    }
    return `Orders for ${formatDateForDisplay(selectedDate)}`;
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setCurrentPage('add-order');
  };

  const showSuccessModal = (message) => {
    setModalConfig({ type: 'success', title: 'Success', message });
    setShowModal(true);
  };

  const showErrorModal = (message) => {
    setModalConfig({ type: 'error', title: 'Error', message });
    setShowModal(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      showSuccessModal(`Order status updated to ${newStatus}`);
    } else {
      showErrorModal('Failed to update order status');
    }
  };

  const handleDeleteOrder = (orderId, pharmacyName, productName) => {
    let pinInput = '';
    
    setConfirmConfig({
      title: 'Delete Order - PIN Required',
      message: (
        <div>
          <p className="mb-2">This action cannot be undone. Are you sure you want to delete this order?</p>
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="font-semibold">Pharmacy: {pharmacyName}</p>
            <p className="font-semibold">Product: {productName}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter PIN to confirm deletion:
            </label>
            <input
              type="text"
              onChange={(e) => { pinInput = e.target.value; }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              placeholder="Enter 4-digit PIN"
              maxLength="4"
              autoFocus
            />
          </div>
        </div>
      ),
      confirmText: 'Delete Order',
      type: 'danger',
      onConfirm: async () => {
        if (pinInput !== '5678') {
          showErrorModal('Incorrect delete PIN. Deletion cancelled.');
          return;
        }
        
        const result = await deleteOrder(orderId);
        if (result.success) {
          showSuccessModal('Order deleted successfully!');
        } else {
          showErrorModal(`Failed to delete order: ${result.error}`);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const exportToExcel = async () => {
    try {
      const ordersToExport = filteredOrders;
      
      if (ordersToExport.length === 0) {
        showErrorModal('No orders to export for the selected date range.');
        return;
      }

      const groupedOrders = ordersToExport.reduce((acc, order) => {
        const productName = order.productName;
        if (!acc[productName]) {
          acc[productName] = [];
        }
        acc[productName].push(order);
        return acc;
      }, {});

      const workbook = new ExcelJS.Workbook();
      const detailSheet = workbook.addWorksheet('Detailed Orders');
      const maxPharmacies = Math.max(...Object.values(groupedOrders).map(group => group.length));
      
      const columns = [{ header: 'Product Name', key: 'productName', width: 45 }];

      for (let i = 0; i < maxPharmacies; i++) {
        columns.push(
          { header: 'Phy Name', key: `pharmacyName${i}`, width: 10 },
          { header: 'Qty', key: `quantity${i}`, width: 10 }
        );
      }

      columns.push(
        { header: 'Total Qty', key: 'totalQuantity', width: 15 },
        { header: 'Urgency', key: 'urgency', width: 12 },
        { header: 'Date Ordered', key: 'dateOrdered', width: 20 },
        { header: 'Status', key: 'status', width: 12 }
      );

      detailSheet.columns = columns;

      Object.entries(groupedOrders).forEach(([productName, productOrders]) => {
        const firstOrder = productOrders[0];
        const totalQuantity = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        
        const rowData = {
          productName: productName,
          totalQuantity: totalQuantity,
          urgency: firstOrder.urgency,
          dateOrdered: formatDubaiDate(firstOrder.created_at),
          status: firstOrder.status
        };

        productOrders.forEach((order, index) => {
          rowData[`pharmacyName${index}`] = order.pharmacyName;
          rowData[`quantity${index}`] = order.quantity;
        });

        detailSheet.addRow(rowData);
      });

      detailSheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      for (let rowNum = 2; rowNum <= detailSheet.rowCount; rowNum++) {
        const row = detailSheet.getRow(rowNum);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (rowNum % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      }

      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Product Name', key: 'productName', width: 50 },
        { header: 'Total Quantity', key: 'totalQuantity', width: 20 }
      ];

      Object.entries(groupedOrders).forEach(([productName, productOrders]) => {
        const totalQuantity = productOrders.reduce((sum, o) => sum + o.quantity, 0);
        summarySheet.addRow({ productName, totalQuantity });
      });

      summarySheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      for (let rowNum = 2; rowNum <= summarySheet.rowCount; rowNum++) {
        const row = summarySheet.getRow(rowNum);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (rowNum % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      }

      const currentDate = selectedDate === 'all' ? new Date().toISOString().split('T')[0] : selectedDate;
      const dateText = selectedDate === 'all' ? 'all-dates' : currentDate;
      const filename = `pharmacy-orders-${dateText}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      const exportMessage = selectedDate === 'all' 
        ? `All orders exported successfully! Downloaded as ${filename}`
        : `Orders for ${formatDateForDisplay(selectedDate)} exported successfully! Downloaded as ${filename}`;
      
      showSuccessModal(exportMessage);
      
    } catch (error) {
      console.error('Export error:', error);
      showErrorModal('Failed to export orders.');
    }
  };

  // Calendar Component
  const Calendar = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = new Date(startDate);
    
    while (day <= endDate) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const hasData = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      return availableDates.includes(dateStr);
    };

    const isSelected = (date) => {
      if (selectedDate === 'all') return false;
      return date.toISOString().split('T')[0] === selectedDate;
    };

    const isCurrentMonth = (date) => {
      return date.getMonth() === currentMonth.getMonth();
    };

    const handleDateClick = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      if (hasData(date)) {
        setSelectedDate(dateStr);
      }
    };

    const previousMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

   

    // Get available months and years from orders
    const availableMonthsYears = useMemo(() => {
      const monthsYears = availableDates.map(dateStr => {
        const date = new Date(dateStr);
        return {
          month: date.getMonth(),
          year: date.getFullYear(),
          display: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: `${date.getFullYear()}-${date.getMonth()}`
        };
      });
      
      // Remove duplicates
      const unique = [];
      const seen = new Set();
      monthsYears.forEach(item => {
        if (!seen.has(item.value)) {
          seen.add(item.value);
          unique.push(item);
        }
      });
      
      return unique.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    }, [availableDates]);

    const handleMonthYearChange = (value) => {
      const [year, month] = value.split('-');
      setCurrentMonth(new Date(parseInt(year), parseInt(month)));
    };

    const currentMonthValue = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <select
            value={currentMonthValue}
            onChange={(e) => handleMonthYearChange(e.target.value)}
            className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer pr-1 -ml-1"
          >
            {availableMonthsYears.map((item) => (
              <option key={item.value} value={item.value}>
                {item.display}
              </option>
            ))}
          </select>
          <div className="flex gap-1 flex-shrink-0">
            
            <button
              onClick={previousMonth}
              className="w-6 h-6 flex items-center justify-center text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              ←
            </button>
            <button
              onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-[10px] font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {weeks.map((week, weekIdx) => (
            <React.Fragment key={weekIdx}>
              {week.map((date, dateIdx) => {
                const hasOrderData = hasData(date);
                const isSelectedDate = isSelected(date);
                const isInCurrentMonth = isCurrentMonth(date);

                return (
                  <button
                    key={dateIdx}
                    onClick={() => handleDateClick(date)}
                    disabled={!hasOrderData}
                    className={`
                      aspect-square p-1 text-xs rounded transition-all
                      ${!isInCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                      ${hasOrderData ? 'font-semibold cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-30'}
                      ${isSelectedDate ? 'bg-black text-white hover:bg-black' : ''}
                      ${hasOrderData && !isSelectedDate ? 'bg-gray-200' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {selectedDate !== 'all' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setSelectedDate('all')}
              className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Show All Orders
            </button>
          </div>
        )}
      </div>
    );
  };

  // Styles
  const cardStyle = "bg-white rounded-lg shadow-sm border border-gray-200";

  // Header Component
  const Header = () => (
    <header className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">℞</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">PharmaMed Manager</h1>
            <p className="text-[10px] text-gray-500">Product Ordering System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage('home')} 
            className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
          >
            🏠 Home
          </button>
          <button 
            onClick={refreshOrders}
            className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="py-6 px-6">
          <div className="max-w-[1600px] mx-auto">
            
            {/* Page Title and Actions */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0.5">
                  Order Management
                </h2>
                <p className="text-xs text-gray-600">
                  {getDateRangeText()} · {filteredOrders.length} orders
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={exportToExcel}
                  className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  disabled={filteredOrders.length === 0}
                >
                  <span>📊</span>
                  <span>Export</span>
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setCurrentPage('add-order')} 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="px-4 py-2 text-sm bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                  >
                    ➕ Add Order
                  </button>
                  
                  {showTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1.5 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-10">
                      Search for product name before adding
                      <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              
              {/* Calendar Sidebar */}
              <div className="lg:col-span-1">
                <Calendar />
                
                {/* Stats Cards */}
                <div className="mt-4 space-y-2">
                  <div className={`${cardStyle} p-3`}>
                    <div className="text-xs font-medium text-gray-600 mb-0.5">Total Orders</div>
                    <div className="text-xl font-bold text-gray-900">{filteredOrders.length}</div>
                  </div>
                  <div className={`${cardStyle} p-3`}>
                    <div className="text-xs font-medium text-gray-600 mb-0.5">Pending</div>
                    <div className="text-xl font-bold text-gray-900">
                      {filteredOrders.filter(o => o.status === 'Pending').length}
                    </div>
                  </div>
                  <div className={`${cardStyle} p-3`}>
                    <div className="text-xs font-medium text-gray-600 mb-0.5">Critical</div>
                    <div className="text-xl font-bold text-gray-900">
                      {filteredOrders.filter(o => o.urgency === 'Critical').length}
                    </div>
                  </div>
                  <div className={`${cardStyle} p-3`}>
                    <div className="text-xs font-medium text-gray-600 mb-0.5">Total Value</div>
                    <div className="text-xl font-bold text-gray-900">
                      AED {filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="lg:col-span-4">
                {filteredOrders.length === 0 ? (
                  <div className={`${cardStyle} p-8 text-center`}>
                    <div className="text-gray-300 text-5xl mb-3">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedDate === 'all' ? 'No Orders Found' : 'No Orders for Selected Date'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedDate === 'all' 
                        ? 'Start by adding your first order!'
                        : 'Try selecting a different date or add a new order.'}
                    </p>
                  </div>
                ) : (
                  <div className={`${cardStyle} overflow-hidden`}>
                    <div className="w-full">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Pharmacy</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Urgency</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider w-20">Status</th>
                            <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider w-16">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredOrders.map((order, index) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2 text-xs text-gray-900">{index + 1}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">{order.pharmacyName}</td>
                              <td className="px-2 py-2 text-xs font-medium text-gray-900">{order.productName}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">{order.quantity}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">{order.unitPrice.toFixed(2)}</td>
                              <td className="px-2 py-2 text-xs font-semibold text-gray-900">{order.totalPrice.toFixed(2)}</td>
                              <td className="px-2 py-2">
                                <span className={`
                                  px-1.5 py-0.5 text-[10px] font-medium rounded
                                  ${order.urgency === 'Critical' ? 'bg-black text-white' : 
                                    order.urgency === 'High' ? 'bg-gray-700 text-white' : 
                                    'bg-gray-200 text-gray-700'}
                                `}>
                                  {order.urgency}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-[10px] text-gray-600 whitespace-nowrap">{formatDubaiDate(order.created_at)}</td>
                              <td className="px-2 py-2">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black w-full"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Delivered">Delivered</option>
                                </select>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditOrder(order)}
                                    className="p-1 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition-colors"
                                    title="Edit Order"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id, order.pharmacyName, order.productName)}
                                    className="p-1 text-xs bg-black hover:bg-gray-800 text-white rounded transition-colors"
                                    title="Delete Order"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        type={modalConfig.type}
      >
        {modalConfig.message}
      </Modal>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />
    </>
  );
};

export default ViewOrders;
