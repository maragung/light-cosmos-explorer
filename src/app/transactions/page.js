"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

const BLOCK_TIME_MS = 5000; // Sesuaikan dengan block time jaringan Anda

export default function TransactionsPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [allTxs, setAllTxs] = useState([]); // Simpan semua transaksi yang pernah diambil
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true); // Default aktif, tapi bisa di-stop
    const [summaryData, setSummaryData] = useState({
        totalTransactions: "Loading...",
        recentTransactions: "Loading...",
        tps: "Loading...",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const getLatestBlockHeight = useCallback(async () => {
        if (!selectedConfig) return null;
        try {
            const statusData = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`);
            return parseInt(statusData.result?.sync_info?.latest_block_height);
        } catch (error) {
            console.error('Failed to fetch latest block height:', error);
            return null;
        }
    }, [selectedConfig]);

    const formatMessageType = (message) => {
        if (!message || message.length === 0) return 'Unknown';
        const msg = Array.isArray(message) ? message[0] : message;
        if (typeof msg === 'string') {
            const parts = msg.split('.');
            return parts[parts.length - 1];
        }
        return 'Unknown';
    };

    const fetchRecentTransactions = useCallback(async (latestHeight) => {
        if (!latestHeight || !selectedConfig) return [];
        try {
            const minHeight = Math.max(1, latestHeight - 24);
            const query = `tx.height>=${minHeight} AND tx.height<=${latestHeight}`;
            const url = `${selectedConfig.COMETBFT_RPC_API}/tx_search?query="${encodeURIComponent(query)}"&per_page=100&order_by="desc"`;
            const data = await fetchWithRetry(url);
            if (!data?.result?.txs) return [];

            return data.result.txs.map((tx) => {
                const messageEvents = tx.tx_result?.events?.filter(e => e.type === 'message') || [];
                const messages = messageEvents.flatMap(event =>
                    event.attributes?.filter(attr => attr.key === 'action')?.map(attr => attr.value) || []
                );

                return {
                    hash: (tx.hash?.startsWith('0x') ? tx.hash.substring(2) : tx.hash) || 'N/A',
                    height: tx.height || 'N/A',
                    code: tx.tx_result?.code ?? 1,
                    messages: messages,
                    timestamp: tx.tx_result?.timestamp || new Date().toISOString(),
                };
            });
        } catch (error) {
            console.error('Error fetching recent transactions:', error);
            return [];
        }
    }, [selectedConfig]);

    const fetchAllData = useCallback(async () => {
        if (!selectedConfig) return;
        // Only show loader on first load
        if (allTxs.length === 0) setLoading(true);
        setError(null);
        try {
            const latestHeight = await getLatestBlockHeight();
            if (!latestHeight) throw new Error('Could not get latest block height');

            const newTxs = await fetchRecentTransactions(latestHeight);
            // Gabungkan & hindari duplikat berdasarkan hash
            const existingHashes = new Set(allTxs.map(tx => tx.hash));
            const uniqueNewTxs = newTxs.filter(tx => !existingHashes.has(tx.hash));
            const updatedTxs = [...uniqueNewTxs, ...allTxs];

            setAllTxs(updatedTxs);

            setSummaryData({
                totalTransactions: Math.floor(latestHeight * 1.5).toLocaleString(),
                recentTransactions: updatedTxs.length.toLocaleString(),
                tps: (updatedTxs.length / (25 * 5)).toFixed(2),
            });
        } catch (err) {
            setError(err.message);
        } finally {
            if (allTxs.length === 0) setLoading(false);
        }
    }, [selectedConfig, getLatestBlockHeight, fetchRecentTransactions, allTxs]);

    // Initial load
    useEffect(() => {
        if (isLoaded) {
            fetchAllData();
        }
    }, [isLoaded, fetchAllData]);

    // Auto-refresh interval
    useEffect(() => {
        let interval = null;
        if (autoRefresh && isLoaded) {
            interval = setInterval(fetchAllData, BLOCK_TIME_MS);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, isLoaded, fetchAllData]);

    // Reset ke halaman 1 saat ada data baru masuk
    useEffect(() => {
        setCurrentPage(1);
    }, [allTxs.length]);

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        if (diffMs < 60000) return 'Just now';
        if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
        return date.toLocaleString();
    };

    // Pagination
    const totalPages = Math.max(1, Math.ceil(allTxs.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentTxs = useMemo(
        () => allTxs.slice(startIndex, startIndex + ITEMS_PER_PAGE),
        [allTxs, currentPage]
    );

    if (!isLoaded) return <Loader message="Initializing..." />;

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-green-400">Transactions</h2>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-green-600 rounded"
                    />
                    <span>Auto refresh</span>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Recent Tx (25 Blocks)</div>
                    <div className="text-xl font-bold text-blue-400">{summaryData.recentTransactions}</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Estimated TPS</div>
                    <div className="text-xl font-bold text-purple-400">{summaryData.tps}</div>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading transactions..." />
            ) : error ? (
                <div className="bg-red-900 border-l-4 border-red-500 p-4 rounded text-white">
                    {error}
                </div>
            ) : (
                <>
                    <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-750">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Hash</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Message</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Block</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {currentTxs.length > 0 ? (
                                        currentTxs.map((tx, index) => (
                                            <tr
                                                key={`${tx.hash}-${index}`}
                                                className="hover:bg-gray-700 transition duration-150 cursor-pointer"
                                                onClick={() => router.push(`/tx/${tx.hash}`)}
                                            >
                                                <td className="px-6 py-4 text-sm font-mono text-green-400 truncate max-w-[150px]">
                                                    {tx.hash.substring(0, 20)}...
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                        tx.code === 0 ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                                                    }`}>
                                                        {tx.code === 0 ? 'Success' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300 truncate max-w-[200px]">
                                                    {formatMessageType(tx.messages)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-blue-400 hover:text-blue-300">
                                                    {tx.height}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {formatRelativeTime(tx.timestamp)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="text-gray-300">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
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
