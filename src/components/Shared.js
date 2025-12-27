import React from 'react';
import { Settings } from 'lucide-react';

export const Card = ({ title, value, icon: Icon, onClick, className = '' }) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 hover:border-green-500 transition duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            {Icon && <Icon className="w-5 h-5 text-green-400" />}
        </div>
        <p className="mt-2 text-2xl font-extrabold text-white truncate">{value}</p>
    </div>
);

export const DetailRow = ({ label, value, isCode = false }) => (
    <div className="flex flex-col sm:flex-row border-b border-gray-700 py-3 last:border-0">
        <div className="sm:w-1/3 text-sm font-medium text-gray-400">{label}</div>
        <div className={`sm:w-2/3 mt-1 sm:mt-0 text-sm break-all ${isCode ? 'font-mono text-green-300 bg-gray-900 p-2 rounded-lg' : 'text-gray-100'}`}>
            {value}
        </div>
    </div>
);

export const JsonViewer = ({ data, title }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-gray-700">
        <h3 className="text-xl font-bold text-green-400">{title}</h3>
        <pre className="text-sm text-gray-200 bg-gray-900 p-4 rounded-lg overflow-x-auto font-mono max-h-96">
            {JSON.stringify(data, null, 2)}
        </pre>
    </div>
);