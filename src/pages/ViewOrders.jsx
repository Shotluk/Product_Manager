import React, { useState } from 'react';
import { Modal, ConfirmModal } from '../component/Modal';
import ExcelJS from 'exceljs';

const ViewOrders = ({ orders, setCurrentPage, updateOrderStatus, deleteOrder, refreshOrders , setEditingOrder}) => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [confirmConfig, setConfirmConfig] = useState({});

  const [showTooltip, setShowTooltip] = useState(false);

  const [deletePin, setDeletePin] = useState('');
  const [currentDeleteOrder, setCurrentDeleteOrder] = useState(null);

  const handleEditOrder = (order) => {
  setEditingOrder(order);
  setCurrentPage('add-order');
};

  const formatDubaiDate = (utcDateString) => {
  if (!utcDateString) return '';

  const date = new Date(utcDateString);
  if (isNaN(date)) return 'Invalid Date';

  // Format date in Dubai timezone
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};



// ALSO REPLACE the formatDateForExcel function with this:

const formatDateForExcel = (dateString) => {
  const date = new Date(dateString);
  
  // Use toLocaleString to get the local timezone
  const localDateTime = date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Use 24-hour format
  });
  
  return localDateTime.replace(',', ''); // Remove comma between date and time
};

const exportToExcel = async () => {
  try {
    // Group orders by product name
    const groupedOrders = orders.reduce((acc, order) => {
      const productName = order.productName;
      if (!acc[productName]) {
        acc[productName] = [];
      }
      acc[productName].push(order);
      return acc;
    }, {});

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // ===== FIRST SHEET: Detailed Orders =====
    const detailSheet = workbook.addWorksheet('Detailed Orders');

    // Define dynamic columns based on max pharmacies per product
    const maxPharmacies = Math.max(...Object.values(groupedOrders).map(group => group.length));
    
    const columns = [
      { header: 'Product Name', key: 'productName', width: 45 }
    ];

    // Add pharmacy columns dynamically
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

    // Add data rows to detail sheet
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

      // Add pharmacy data
      productOrders.forEach((order, index) => {
        rowData[`pharmacyName${index}`] = order.pharmacyName;
        rowData[`quantity${index}`] = order.quantity;
      });

      // Fill empty pharmacy columns
      for (let i = productOrders.length; i < maxPharmacies; i++) {
        rowData[`pharmacyName${i}`] = '';
        rowData[`quantity${i}`] = '';
      }

      detailSheet.addRow(rowData);
    });

    // Style the detail sheet header row
    const detailHeaderRow = detailSheet.getRow(1);
    detailHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Style detail sheet data rows
    for (let rowNum = 2; rowNum <= detailSheet.rowCount; rowNum++) {
      const row = detailSheet.getRow(rowNum);
      
      row.eachCell((cell, colNum) => {
        // Add borders to all cells
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };

        // Alternating row colors
        if (rowNum % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }

        // Center align quantity columns and specific columns
        const isQuantityCol = cell._column._key && (cell._column._key.startsWith('quantity') || cell._column._key === 'totalQuantity');
        if (colNum === 1 || isQuantityCol || colNum >= columns.length - 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          
          // Make total quantity column bold and highlighted
          if (cell._column._key === 'totalQuantity') {
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE6F3FF' }
            };
          }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    }

    // Add autofilter to detail sheet
    detailSheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(65 + columns.length - 1)}${detailSheet.rowCount}`
    };

    // ===== SECOND SHEET: Summary =====
    const summarySheet = workbook.addWorksheet('Summary');

    // Define columns for summary sheet
    summarySheet.columns = [
      { header: 'Product Name', key: 'productName', width: 45 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 }
    ];

    // Add summary data
    Object.entries(groupedOrders).forEach(([productName, productOrders]) => {
      const totalQuantity = productOrders.reduce((sum, o) => sum + o.quantity, 0);
      
      summarySheet.addRow({
        productName: productName,
        totalQuantity: totalQuantity
      });
    });

    const summaryHeaderRow = summarySheet.getRow(1);
summaryHeaderRow.eachCell((cell) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' } // Same blue as detail sheet
  };
  cell.font = {
    color: { argb: 'FFFFFFFF' },
    bold: true
  };
  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
});

// Style summary sheet data rows
for (let rowNum = 2; rowNum <= summarySheet.rowCount; rowNum++) {
  const row = summarySheet.getRow(rowNum);
  
  row.eachCell((cell, colNum) => {
    // Add borders to all cells
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Alternating row colors
    if (rowNum % 2 === 0) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' } // Same gray as detail sheet
      };
    }

    // Center align for both columns (same as detail sheet pattern)
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Make total quantity column bold and highlighted (same as detail sheet)
    if (cell._column._key === 'totalQuantity') {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' } // Same light blue background as detail sheet
      };
    }
  });
}


    // Generate filename and download
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `pharmacy-orders-${currentDate}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    showSuccessModal(`Orders exported successfully! Downloaded as ${filename} with 2 sheets: Detailed Orders & Summary`);
    
  } catch (error) {
    console.error('Export error:', error);
    showErrorModal('Failed to export orders. Please try again.');
  }
};
  const showSuccessModal = (message) => {
    setModalConfig({
      type: 'success',
      title: 'Success',
      message: message
    });
    setShowModal(true);
  };

  const showErrorModal = (message) => {
    setModalConfig({
      type: 'error',
      title: 'Error',
      message: message
    });
    setShowModal(true);
  };

  const handleDeleteOrder = async (orderId, pharmacyName, productName) => {
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
    }
  });
  setShowConfirmModal(true);
};
  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success) {
      showSuccessModal(`Order status updated to ${newStatus}!`);
    } else {
      showErrorModal(`Failed to update status: ${result.error}`);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'Normal': return 'bg-gray-100 text-gray-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Styles
  const bgPattern = "bg-gradient-to-br from-blue-50 to-blue-100";
  const cardStyle = "bg-white rounded-2xl shadow-lg border border-gray-200";
  const btnPrimary = "bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200";

  // Header Component
  const Header = ({ title }) => (
    <header className="bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-8 py-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">℞</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PharmaMed Manager</h1>
            <p className="text-xs text-gray-500">Product Ordering System</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{title}</div>
        </div>
        
        <div>
          <button 
            onClick={() => setCurrentPage('home')} 
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 mr-2"
          >
            🏠 Home
          </button>
          <button 
            onClick={refreshOrders}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
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
      <div className={`min-h-screen ${bgPattern}`}>
        <Header title="" />
        
        <div className="py-8 px-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Management ({orders.length} orders)
              </h2>
              
              <div className="flex space-x-3">
                <button 
                  onClick={exportToExcel}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                  title="Export to Excel"
                >
                  <span>📊</span>
                  <span>Export Excel</span>
                </button>
                
                {/* Wrap the button in a relative container */}
                <div className="relative">
                  <button 
                    onClick={() => setCurrentPage('add-order')} 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className={`${btnPrimary} px-6 py-3`}
                  >
                    ➕ Add New Order
                  </button>
                  
                  {/* Tooltip - positioned to the right instead of center */}
                  {showTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                      Look for the product name before adding new product
                      <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${cardStyle} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Pharmacy</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Urgency</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">#{order.id.toString().padStart(3, '0')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{order.pharmacyName}</div>
                          
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{order.productName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{order.quantity}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">AED {order.unitPrice.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-blue-600">AED {order.totalPrice.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(order.urgency)}`}>
                            {order.urgency}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDubaiDate(order.created_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            style={{
                              backgroundColor: order.status === 'Pending' ? '#fef3c7' : 
                                             order.status === 'Approved' ? '#dbeafe' : '#dcfce7',
                              color: order.status === 'Pending' ? '#92400e' : 
                                    order.status === 'Approved' ? '#1e40af' : '#166534'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                             <button
                              onClick={() => handleEditOrder(order)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title="Edit Order"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id, order.pharmacyName, order.productName)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Delete Order"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className={`${cardStyle} p-4 text-center`}>
                <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                <div className="text-sm font-semibold text-gray-600">Total Orders</div>
              </div>
              <div className={`${cardStyle} p-4 text-center`}>
                <div className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'Pending').length}
                </div>
                <div className="text-sm font-semibold text-gray-600">Pending</div>
              </div>
              <div className={`${cardStyle} p-4 text-center`}>
                <div className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.urgency === 'Critical').length}
                </div>
                <div className="text-sm font-semibold text-gray-600">Critical</div>
              </div>
              <div className={`${cardStyle} p-4 text-center`}>
                <div className="text-2xl font-bold text-green-600">
                  AED {orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
                </div>
                <div className="text-sm font-semibold text-gray-600">Total Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modals */}
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