"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { DetailRow } from '@/components/Shared';

export default function TxDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [tx, setTx] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTx = async () => {
            if (!selectedConfig || !params.hash) return;
            setLoading(true);
            try {
                // Remove 0x if present
                const hash = params.hash.replace('0x', '').toUpperCase();
                const data = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/tx?hash=0x${hash}`);
                setTx(data.result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchTx();
    }, [isLoaded, selectedConfig, params.hash]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading) return <Loader message="Loading Transaction..." />;
    if (!tx) return <div className="p-4 text-red-400">Transaction not found</div>;

    const res = tx.tx_result;

    return (
        <div className="p-4 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-green-400 hover:text-green-300">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <h2 className="text-2xl font-bold text-green-400">Transaction Details</h2>
                <DetailRow label="Hash" value={tx.hash} isCode={true} />
                <DetailRow label="Height" value={tx.height} />
                <DetailRow label="Status" value={res.code === 0 ? 'Success' : `Failed (Code ${res.code})`} />
                <DetailRow label="Gas Used" value={`${res.gas_used} / ${res.gas_wanted}`} />
                <div className="pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Raw Data</h3>
                     <textarea readOnly value={tx.tx} className="w-full bg-gray-900 text-gray-400 p-3 rounded h-32 font-mono text-sm" />
                </div>
            </div>
        </div>
    );
}