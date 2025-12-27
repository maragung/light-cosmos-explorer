"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Zap } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

export default function TransactionsPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(5000);
    const [summaryData, setSummaryData] = useState({ totalTransactions: "Loading...", recentTransactions: "Loading...", tps: "Loading..." });

    const getLatestBlockHeight = useCallback(async () => {
        try {
            const statusData = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`);
            return parseInt(statusData.result?.sync_info?.latest_block_height);
        } catch (error) {
            console.error('Failed to fetch latest block height:', error);
            return null;
        }
    }, [selectedConfig]);

    const formatMessageType = (message) => {
        if (!message) return 'Unknown';
        const msg = Array.isArray(message) ? message[0] : message;
        if (typeof msg === 'string') {
            const parts = msg.split('.');
            return parts[parts.length - 1];
        }
        return 'Unknown';
    };

    const fetchRecentTransactions = useCallback(async (latestHeight) => {
        if (!latestHeight) return [];
        try {
            const query = `tx.height>=${Math.max(1, latestHeight - 24)} AND tx.height<=${latestHeight}`;
            const url = `${selectedConfig.COMETBFT_RPC_API}/tx_search?query="${query}"&per_page=100&order_by="desc"`;
            const data = await fetchWithRetry(url);
            if (!data.result?.txs) return [];
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
                }
            }).slice(0, 50);
        } catch (error) {
            console.error('Error fetching recent transactions:', error);
            return [];
        }
    }, [selectedConfig]);

    const fetchAllData = useCallback(async () => {
        if (!selectedConfig) return;
        setLoading(true);
        setError(null);
        try {
            const latestHeight = await getLatestBlockHeight();
            if (!latestHeight) throw new Error('Could not get latest block height');
            
            const transactions = await fetchRecentTransactions(latestHeight);
            setTxs(transactions);

            // Mocking stats for now as exact global counts require indexer
            setSummaryData({
                totalTransactions: Math.floor(latestHeight * 1.5).toLocaleString(), 
                recentTransactions: transactions.length.toLocaleString(),
                tps: (transactions.length / (25 * 5)).toFixed(2)
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedConfig, getLatestBlockHeight, fetchRecentTransactions]);

    useEffect(() => {
        if (isLoaded) fetchAllData();
    }, [isLoaded, fetchAllData]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchAllData, refreshInterval);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchAllData]);

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp), now = new Date();
        const diffMinutes = Math.floor(Math.abs(now - date) / 60000);
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        return new Date(timestamp).toLocaleString();
    };

    if (!isLoaded) return <Loader message="Initializing..." />;

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-green-400">Transactions</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={fetchAllData}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                        <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} className="form-checkbox h-4 w-4 text-green-600" />
                        <span>Auto Refresh</span>
                    </label>
                </div>
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

            {loading ? <Loader message="Loading transactions..." /> : error ? (
                <div className="bg-red-900 border-l-4 border-red-500 p-4 rounded text-white">{error}</div>
            ) : (
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
                                {txs.map((tx, index) => (
                                    <tr key={index} className="hover:bg-gray-700 transition duration-150 cursor-pointer" onClick={() => router.push(`/tx/${tx.hash}`)}>
                                        <td className="px-6 py-4 text-sm font-mono text-green-400 truncate max-w-[150px]">
                                            {tx.hash.substring(0, 20)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${tx.code === 0 ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
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
                                ))}
                                {txs.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No recent transactions found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}