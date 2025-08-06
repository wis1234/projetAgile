import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function TrackingModal({ isOpen, onClose, users, onSelectUser, selectedUserId }) {
    // Generate pastel colors for user highlights
    const getUserColor = (userId) => {
        const colors = [
            'bg-blue-100 text-blue-800',
            'bg-green-100 text-green-800',
            'bg-yellow-100 text-yellow-800',
            'bg-purple-100 text-purple-800',
            'bg-pink-100 text-pink-800',
            'bg-indigo-100 text-indigo-800',
        ];
        return colors[userId % colors.length];
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                                >
                                    <span>Suivi des modifications</span>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </Dialog.Title>
                                
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Sélectionnez un utilisateur pour voir ses modifications
                                    </p>
                                    
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {users.map((user) => (
                                            <div 
                                                key={user.id}
                                                onClick={() => onSelectUser(user.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedUserId === user.id 
                                                        ? 'bg-blue-50 border border-blue-200' 
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`h-3 w-3 rounded-full mr-3 ${getUserColor(user.id).split(' ')[0]}`} />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
