"use client";

import React, { useState, useEffect } from 'react';
import { Database, Zap, Minus } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

const decodeBase64 = (base64) => {
    if (!base64) return 'N/A';
    try {
        if (typeof window !== 'undefined') {
            const bytes = atob(base64);
            if (bytes.length < 50) {
                return '0x' + Array.from(bytes).map(b => b.charCodeAt(0).toString(16).padStart(2, '0')).join('');
            }
            return bytes;
        }
        return 'Decoding...';
    } catch (e) {
        return base64.substring(0, 15) + '...';
    }
};

export default function MempoolPage() {
    const { selectedConfig, isLoaded } = useRpc();
    const [mempool, setMempool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMempool = async () => {
            if (!selectedConfig) return;
            setLoading(true);
            try {
                const url = `${selectedConfig.COMETBFT_RPC_API}/unconfirmed_txs?limit=50`;
                const data = await fetchWithRetry(url);
                setMempool(data.result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded) fetchMempool();
        const interval = setInterval(() => { if (isLoaded) fetchMempool() }, 10000);
        return () => clearInterval(interval);
    }, [isLoaded, selectedConfig]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading && !mempool) return <Loader message="Loading mempool..." />;

    const txs = mempool?.txs || [];

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Mempool Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-400">Total Txs</div>
                        <div className="text-2xl font-bold text-white">{mempool?.n_txs || '0'}</div>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-400">Total Bytes</div>
                        <div className="text-2xl font-bold text-white">{(mempool?.total_bytes || 0).toLocaleString()}</div>
                    </div>
                    <Database className="w-8 h-8 text-blue-500" />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Unconfirmed Transactions</h3>
                {txs.length > 0 ? (
                    <div className="space-y-3">
                        {txs.map((tx, index) => (
                            <div key={index} className="bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-500">
                                <div className="text-xs text-gray-400 mb-1">Tx #{index + 1} • {tx.length} bytes</div>
                                <div className="text-sm font-mono text-gray-200 break-all">
                                    {decodeBase64(tx).substring(0, 100)}...
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">Mempool is empty</p>
                        <p className="text-sm">No unconfirmed transactions pending</p>
                    </div>
                )}
            </div>
        </div>
    );
}