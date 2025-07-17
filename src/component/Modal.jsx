import React from 'react';

const Modal = ({ isOpen, onClose, title, children, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'confirm':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      case 'confirm':
        return 'text-blue-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl border border-gray-200">
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className={`text-2xl ${getIconColor()}`}>
              {getIcon()}
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {title}
            </h3>
          </div>

          {/* Content */}
          <div className="text-gray-600 mb-6">
            {children}
          </div>

          {/* Close button for info/success/error modals */}
          {type !== 'confirm' && (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl border border-gray-200">
          
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl text-orange-600">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {title}
            </h3>
          </div>

          {/* Content */}
          <div className="text-gray-600 mb-6">
            {message}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 ${getButtonStyle()} text-white rounded-lg font-semibold transition-colors duration-200`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Modal, ConfirmModal };