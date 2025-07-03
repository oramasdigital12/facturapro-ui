import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[200]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-white p-0 shadow-lg relative flex flex-col max-h-[90vh]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 z-10"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default Modal;