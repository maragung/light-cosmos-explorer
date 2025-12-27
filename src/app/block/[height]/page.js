"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { fetchWithRetry, decodeBase64 } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { DetailRow } from '@/components/Shared';

export default function BlockDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [block, setBlock] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlock = async () => {
            if (!selectedConfig || !params.height) return;
            setLoading(true);
            try {
                const data = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/block?height=${params.height}`);
                setBlock(data.result?.block);
            } catch (error) {
                console.error('Error fetching block:', error);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchBlock();
    }, [isLoaded, selectedConfig, params.height]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading) return <Loader message={`Loading Block #${params.height}...`} />;
    if (!block) return <div className="p-4 text-red-400">Block not found</div>;

    const txs = block.data?.txs || [];

    return (
        <div className="p-4 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-green-400 hover:text-green-300 transition-colors">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>
            
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4 shadow-xl">
                <h2 className="text-2xl font-bold text-green-400 mb-6">Block #{params.height}</h2>
                
                <div className="grid grid-cols-1 gap-1">
                    <DetailRow label="Time" value={new Date(block.header.time).toLocaleString()} />
                    <DetailRow label="Hash" value={block.last_commit?.block_id?.hash || 'N/A'} isCode={true} />
                    <DetailRow label="Proposer" value={block.header.proposer_address} isCode={true} />
                    <DetailRow label="Transactions" value={txs.length} />
                    <DetailRow label="Chain ID" value={block.header.chain_id} />
                </div>
                
                <div className="pt-6 border-t border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Block Transactions ({txs.length})</h3>
                    <div className="space-y-3">
                        {txs.length > 0 ? txs.map((txBase64, i) => {
                             const preview = decodeBase64(txBase64).substring(0, 64);
                             return (
                                <div 
                                    key={i} 
                                    className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-green-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 mb-1 font-bold uppercase">Raw Data Preview</div>
                                        <div className="text-gray-300 font-mono text-sm break-all">
                                            {preview}...
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-500 whitespace-nowrap self-start md:self-center">
                                        INDEX #{i}
                                    </div>
                                </div>
                             )
                        }) : (
                            <div className="text-center py-10 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                                <p className="text-gray-500">This block contains no transactions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}