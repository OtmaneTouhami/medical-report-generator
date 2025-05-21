import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  customWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions, customWidth = 'max-w-md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${customWidth} w-full transition-all transform scale-100 opacity-100 max-h-[90vh] flex flex-col`}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto">
          {children}
        </div>
        
        {actions && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
