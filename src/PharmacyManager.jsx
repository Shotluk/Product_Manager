import React, { useState, useEffect } from 'react';
import HomePage from './pages/Homepage';
import AddOrder from './pages/AddOrder';
import ViewOrders from './pages/ViewOrders';
import { supabaseHelpers } from './supabaseClient';

const PharmacyManager = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load orders from Supabase on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await supabaseHelpers.fetchOrders();
      
      if (result.success) {
        // Map database field names to UI field names
        const mappedOrders = result.data.map(order => ({
          id: order.id,
          pharmacyName: order.pharmacyname,
          pharmacyLocation: order.pharmacylocation,
          productName: order.productname,
          quantity: order.quantity,
          unitPrice: order.unitprice,
          totalPrice: order.totalprice,
          urgency: order.urgency,
          dateOrdered: order.dateordered,
          status: order.status
        }));
        setOrders(mappedOrders);
      } else {
        setError(result.error);
        // Fallback to demo data if Supabase fails
        setOrders([
          {
            id: 1,
            pharmacyName: "Central Pharmacy",
            pharmacyLocation: "Downtown Dubai",
            productName: "Paracetamol 500mg",
            quantity: 100,
            unitPrice: 2.50,
            totalPrice: 250.00,
            urgency: "Normal",
            dateOrdered: "2025-01-15",
            status: "Pending"
          },
          {
            id: 2,
            pharmacyName: "Marina Medical Center",
            pharmacyLocation: "Dubai Marina",
            productName: "Amoxicillin 250mg",
            quantity: 50,
            unitPrice: 5.75,
            totalPrice: 287.50,
            urgency: "High",
            dateOrdered: "2025-01-14",
            status: "Approved"
          },
          {
            id: 3,
            pharmacyName: "Emirates Pharmacy",
            pharmacyLocation: "Jumeirah",
            productName: "Insulin Rapid",
            quantity: 25,
            unitPrice: 45.00,
            totalPrice: 1125.00,
            urgency: "Critical",
            dateOrdered: "2025-01-13",
            status: "Delivered"
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Add new order to Supabase
  const addOrder = async (orderData) => {
    try {
      setError(null);
      
      const result = await supabaseHelpers.addOrder(orderData);
      
      if (result.success) {
        // Map database field names to UI field names and add to local state
        const mappedOrder = {
          id: result.data.id,
          pharmacyName: result.data.pharmacyname,
          pharmacyLocation: result.data.pharmacylocation,
          productName: result.data.productname,
          quantity: result.data.quantity,
          unitPrice: result.data.unitprice,
          totalPrice: result.data.totalprice,
          urgency: result.data.urgency,
          dateOrdered: result.data.dateordered,
          status: result.data.status
        };
        setOrders(prevOrders => [mappedOrder, ...prevOrders]);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Failed to add order:', err);
      setError('Failed to add order');
      return { success: false, error: 'Failed to add order' };
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    try {
      setError(null);
      
      const result = await supabaseHelpers.deleteOrder(orderId);
      
      if (result.success) {
        // Update local state by removing the deleted order
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
      setError('Failed to delete order');
      return { success: false, error: 'Failed to delete order' };
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setError(null);
      
      const result = await supabaseHelpers.updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Failed to update order:', err);
      setError('Failed to update order');
      return { success: false, error: 'Failed to update order' };
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading orders...</p>
      </div>
    </div>
  );

  // Error Alert Component
  const ErrorAlert = () => {
    if (!error) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
        <div className="flex items-center">
          <span className="mr-2">⚠️</span>
          <span className="flex-1">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Show loading spinner while fetching data
  if (loading) {
    return <LoadingSpinner />;
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'add-order':
        return (
          <AddOrder 
            orders={orders} 
            addOrder={addOrder}
            setCurrentPage={setCurrentPage} 
          />
        );
      case 'view-orders':
        return (
          <ViewOrders 
            orders={orders} 
            setCurrentPage={setCurrentPage}
            updateOrderStatus={updateOrderStatus}
            deleteOrder={deleteOrder}
            refreshOrders={loadOrders}
          />
        );
      default:
        return (
          <HomePage 
            orders={orders} 
            setCurrentPage={setCurrentPage}
            refreshOrders={loadOrders}
          />
        );
    }
  };

  return (
    <>
      <ErrorAlert />
      {renderPage()}
    </>
  );
};

export default PharmacyManager;