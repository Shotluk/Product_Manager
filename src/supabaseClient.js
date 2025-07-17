import { createClient } from '@supabase/supabase-js';

// Your Supabase project configuration
const supabaseUrl = 'https://xfjbwjgraovghfkpgjap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmamJ3amdyYW92Z2hma3BnamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MzE5OTYsImV4cCI6MjA2ODMwNzk5Nn0.ZqP8HZOmZhNUkX9QhSnLxIe0S5xpd3kqoCnNoLQxGZc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for database operations
export const supabaseHelpers = {
  // Fetch all orders
  async fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('pharmacy_orders')
        .select('*')
        .order('dateordered', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, error: error.message };
    }
  },

  // Add new order
  async addOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('pharmacy_orders')
        .insert([orderData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error adding order:', error);
      return { success: false, error: error.message };
    }
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('pharmacy_orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating order:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete order
  async deleteOrder(orderId) {
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }
  }
};