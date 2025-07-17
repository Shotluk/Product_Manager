import React, { useState } from 'react';
import { Modal } from '../component/Modal';

const AddOrder = ({ orders, addOrder, setCurrentPage }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  
  const [newOrder, setNewOrder] = useState({
    pharmacyName: '',
    pharmacyLocation: '',
    productName: '',
    quantity: '',
    unitPrice: '',
    urgency: 'Normal'
  });

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

  const handleSubmit = async () => {
    if (!newOrder.pharmacyName || !newOrder.pharmacyLocation || !newOrder.productName || 
        !newOrder.quantity || !newOrder.unitPrice) {
      showErrorModal('Please fill in all fields before submitting.');
      return;
    }
    
    const totalPrice = parseFloat(newOrder.quantity) * parseFloat(newOrder.unitPrice);
    const orderData = {
      pharmacyname: newOrder.pharmacyName,
      pharmacylocation: newOrder.pharmacyLocation,
      productname: newOrder.productName,
      quantity: parseInt(newOrder.quantity),
      unitprice: parseFloat(newOrder.unitPrice),
      totalprice: totalPrice,
      urgency: newOrder.urgency,
      dateordered: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    const result = await addOrder(orderData);
    
    if (result.success) {
      setNewOrder({
        pharmacyName: '',
        pharmacyLocation: '',
        productName: '',
        quantity: '',
        unitPrice: '',
        urgency: 'Normal'
      });
      showSuccessModal('Order added successfully! You can add another order or view all orders.');
    } else {
      showErrorModal(`Failed to add order: ${result.error}`);
    }
  };

  // Styles
  const bgPattern = "bg-gradient-to-br from-blue-50 to-blue-100";
  const cardStyle = "bg-white rounded-2xl shadow-lg border border-gray-200";
  const btnPrimary = "bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200";

  // Header Component
  // In your AddOrder.jsx file, modify the Header component:

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
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setCurrentPage('view-orders')} 
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200"
        >
          📋 View Orders
        </button>
        <button 
          onClick={() => setCurrentPage('home')} 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
        >
          🏠 Home
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
          <div className="max-w-2xl mx-auto">
            
            <div className={`${cardStyle} p-8`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Product Order Details
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pharmacy Name</label>
                    <input
                      type="text"
                      value={newOrder.pharmacyName}
                      onChange={(e) => setNewOrder({...newOrder, pharmacyName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Enter pharmacy name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newOrder.pharmacyLocation}
                      onChange={(e) => setNewOrder({...newOrder, pharmacyLocation: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Enter location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newOrder.productName}
                    onChange={(e) => setNewOrder({...newOrder, productName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newOrder.unitPrice}
                      onChange={(e) => setNewOrder({...newOrder, unitPrice: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency</label>
                    <select
                      value={newOrder.urgency}
                      onChange={(e) => setNewOrder({...newOrder, urgency: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                {newOrder.quantity && newOrder.unitPrice && (
                  <div className={`${cardStyle} p-4 bg-blue-50`}>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Total Price</p>
                      <p className="text-2xl font-bold text-blue-600">
                        AED {(parseFloat(newOrder.quantity || 0) * parseFloat(newOrder.unitPrice || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubmit} 
                  className={`${btnPrimary} w-full py-4 text-lg`}
                >
                  ➕ Add Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        type={modalConfig.type}
      >
        {modalConfig.message}
      </Modal>
    </>
  );
};

export default AddOrder;