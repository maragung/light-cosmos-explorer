"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

export default function HealthPage() {
    const { selectedConfig, isLoaded } = useRpc();
    const [isHealthy, setIsHealthy] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkHealth = async () => {
        if (!selectedConfig) return;
        setLoading(true);
        try {
            const response = await fetch(`${selectedConfig.COMETBFT_RPC_API}/health`);
            setIsHealthy(response.ok);
        } catch (error) {
            setIsHealthy(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded) checkHealth();
    }, [isLoaded, selectedConfig]);

    if (!isLoaded) return <Loader message="Initializing..." />;

    return (
        <div className="p-4 text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-6">RPC Health Check</h2>
            {loading ? <Loader message="Checking..." /> : isHealthy ? (
                <div className="bg-green-900 border-l-4 border-green-500 text-green-200 p-6 rounded-xl shadow-lg inline-block text-left">
                    <div className="flex items-center mb-3">
                        <CheckCircle className="w-10 h-10 mr-3" />
                        <span className="text-3xl font-bold">HEALTHY</span>
                    </div>
                    <p className="text-lg">Node: {selectedConfig.COMETBFT_RPC_API}</p>
                </div>
            ) : (
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-6 rounded-xl shadow-lg inline-block text-left">
                     <div className="flex items-center mb-3">
                        <XCircle className="w-10 h-10 mr-3" />
                        <span className="text-3xl font-bold">FAILED</span>
                    </div>
                    <p className="text-lg">Failed to connect to RPC node</p>
                </div>
            )}
            <div className="mt-6">
                <button onClick={checkHealth} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto">
                    <RefreshCcw className="w-5 h-5 mr-2" /> Re-check
                </button>
            </div>
        </div>
    );
}