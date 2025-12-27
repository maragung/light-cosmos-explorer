"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

const MAX_BLOCKS_TO_KEEP = 100;
const BLOCKS_PER_PAGE = 10;

export default function BlocksPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [allBlocksMap, setAllBlocksMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [lastKnownHeight, setLastKnownHeight] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const intervalRef = useRef(null);

    // Fungsi bantu: urutkan blok dari terbaru ke terlama
    const getSortedBlocks = useCallback((map) => {
        return Array.from(map.values()).sort((a, b) =>
            parseInt(b.header.height, 10) - parseInt(a.header.height, 10)
        );
    }, []);

    const fetchNewBlocks = useCallback(async () => {
        if (!selectedConfig || !selectedConfig.COMETBFT_RPC_API) return;

        try {
            // Ambil status untuk dapatkan latest height
            const statusRes = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`);
            const currentHeight = parseInt(statusRes.result?.sync_info?.latest_block_height, 10);

            if (isNaN(currentHeight)) {
                console.warn("Invalid latest block height");
                return;
            }

            let startHeight;
            if (lastKnownHeight === null) {
                // Initial load: ambil 20 blok terbaru
                startHeight = Math.max(1, currentHeight - 19);
            } else if (currentHeight <= lastKnownHeight) {
                // Tidak ada blok baru
                return;
            } else {
                // Ambil hanya blok baru
                startHeight = lastKnownHeight + 1;
            }

            const endHeight = currentHeight;

            // Ambil blok dalam rentang
            const blockchainRes = await fetchWithRetry(
                `${selectedConfig.COMETBFT_RPC_API}/blockchain?minHeight=${startHeight}&maxHeight=${endHeight}`
            );

            const newBlocks = blockchainRes.result?.block_metas || [];
            if (!newBlocks.length) return;

            // Perbarui Map
            setAllBlocksMap(prevMap => {
                const newMap = new Map(prevMap);

                // Tambahkan blok baru
                newBlocks.forEach(block => {
                    const height = block.header.height;
                    newMap.set(height, block);
                });

                // Batasi jumlah blok
                if (newMap.size > MAX_BLOCKS_TO_KEEP) {
                    const heights = Array.from(newMap.keys()).map(h => parseInt(h, 10));
                    heights.sort((a, b) => a - b); // ascending: lama ke baru
                    const toRemove = heights.slice(0, newMap.size - MAX_BLOCKS_TO_KEEP);
                    toRemove.forEach(h => newMap.delete(h.toString()));
                }

                return newMap;
            });

            setLastKnownHeight(currentHeight);
        } catch (error) {
            console.error("Failed to fetch blocks:", error);
        } finally {
            if (loading) setLoading(false);
        }
    }, [selectedConfig, lastKnownHeight, loading]);

    // Setup auto-refresh
    useEffect(() => {
        if (!isLoaded || !selectedConfig) return;

        const blockTimeSec = selectedConfig.BLOCK_TIME_SEC
            ? parseInt(selectedConfig.BLOCK_TIME_SEC, 10)
            : 6;
        const intervalMs = Math.max(2000, (blockTimeSec || 6) * 1000); // minimal 2 detik

        if (autoRefresh) {
            fetchNewBlocks(); // Fetch pertama kali
            intervalRef.current = setInterval(fetchNewBlocks, intervalMs);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isLoaded, selectedConfig, autoRefresh, fetchNewBlocks]);

    // Siapkan data untuk tampilan
    const sortedBlocks = getSortedBlocks(allBlocksMap);
    const totalPages = Math.ceil(sortedBlocks.length / BLOCKS_PER_PAGE);
    const startIndex = (currentPage - 1) * BLOCKS_PER_PAGE;
    const currentBlocks = sortedBlocks.slice(startIndex, startIndex + BLOCKS_PER_PAGE);

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    if (!isLoaded) {
        return <Loader message="Initializing..." />;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-green-400">Latest Blocks</h2>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">
                        Auto-refresh: {selectedConfig?.BLOCK_TIME_SEC ? `${selectedConfig.BLOCK_TIME_SEC}s` : '6s'}
                    </span>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                            autoRefresh
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                        }`}
                        title={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
                    >
                        {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading blocks..." />
            ) : sortedBlocks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No blocks loaded yet.</div>
            ) : (
                <>
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
                                    {currentBlocks.map((block) => (
                                        <tr
                                            key={block.block_id.hash}
                                            className="hover:bg-gray-700 cursor-pointer"
                                            onClick={() => router.push(`/block/${block.header.height}`)}
                                        >
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg ${
                                    currentPage === 1
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-600 text-white hover:bg-gray-500'
                                }`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-300">
                                Page {currentPage} of {totalPages} ({sortedBlocks.length} blocks)
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg ${
                                    currentPage === totalPages
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-600 text-white hover:bg-gray-500'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
