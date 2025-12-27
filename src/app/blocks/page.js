"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, List } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

export default function BlocksPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [blockList, setBlockList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [latestHeight, setLatestHeight] = useState(null);

    const fetchBlocks = useCallback(async () => {
        if (!selectedConfig) return;
        setLoading(true);
        try {
            const status = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`);
            const height = parseInt(status.result?.sync_info?.latest_block_height);
            setLatestHeight(height);

            const minHeight = Math.max(1, height - 20);
            const blockchainData = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/blockchain?minHeight=${minHeight}&maxHeight=${height}`);
            
            if (blockchainData.result?.block_metas) {
                const sorted = blockchainData.result.block_metas.sort((a, b) => 
                    parseInt(b.header.height) - parseInt(a.header.height)
                );
                setBlockList(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedConfig]);

    useEffect(() => {
        if (isLoaded) fetchBlocks();
    }, [isLoaded, fetchBlocks]);

    if (!isLoaded) return <Loader message="Initializing..." />;

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-green-400">Latest Blocks</h2>
                <button
                    onClick={fetchBlocks}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                >
                    <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                </button>
            </div>

            {loading ? <Loader message="Loading blocks..." /> : (
                <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-750">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Height</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Proposer</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Txs</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {blockList.map((block) => (
                                    <tr key={block.block_id.hash} className="hover:bg-gray-700 cursor-pointer" onClick={() => router.push(`/block/${block.header.height}`)}>
                                        <td className="px-6 py-4 text-sm font-bold text-green-400">
                                            {block.header.height}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-300 truncate max-w-[150px]">
                                            {block.header.proposer_address}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {block.num_txs}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(block.header.time).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}