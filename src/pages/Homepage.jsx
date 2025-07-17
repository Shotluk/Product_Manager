import React from 'react';

const HomePage = ({ orders, setCurrentPage, refreshOrders }) => {
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
    <div className={`h-screen ${bgPattern} overflow-hidden`}>
      <Header title="" />
      
      <div className="flex justify-center pt-16">
        <div className="text-center max-w-4xl mx-auto px-8">
          
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Pharmacy Product Manager
            </h2>
            <p className="text-lg text-gray-600">
              Streamline your pharmacy inventory ordering and management
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className={`${cardStyle} p-6`}>
              <div className="text-3xl font-bold text-blue-600 mb-2">{orders.length}</div>
              <div className="text-sm font-semibold text-gray-600">Total Orders</div>
            </div>
            <div className={`${cardStyle} p-6`}>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {orders.filter(o => o.status === 'Delivered').length}
              </div>
              <div className="text-sm font-semibold text-gray-600">Delivered</div>
            </div>
            <div className={`${cardStyle} p-6`}>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                AED {orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
              </div>
              <div className="text-sm font-semibold text-gray-600">Total Value</div>
            </div>
          </div>

          <div className="flex justify-center space-x-6">
            <button 
              onClick={() => setCurrentPage('add-order')} 
              className={`${btnPrimary} px-8 py-3 text-lg`}
            >
              ➕ Add New Order
            </button>
            <button 
              onClick={() => setCurrentPage('view-orders')} 
              className="px-8 py-3 text-lg bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-200 rounded-lg font-semibold transition-colors duration-200"
            >
              📋 View All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;