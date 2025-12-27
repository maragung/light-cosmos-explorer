"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { List, Wifi, Code, Database, Settings, Clock, Share2, Globe } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { Card, DetailRow } from '@/components/Shared';

export default function DashboardPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [status, setStatus] = useState(null);
    const [abciInfo, setAbciInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!selectedConfig) return;
        setLoading(true);
        try {
            const [statusData, abciData] = await Promise.all([
                fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`, 1),
                fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/abci_info`, 1)
            ]);
            setStatus(statusData.result);
            setAbciInfo(abciData.result?.response);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedConfig]);

    useEffect(() => {
        if (isLoaded) {
            fetchData();
            const interval = setInterval(fetchData, 15000);
            return () => clearInterval(interval);
        }
    }, [isLoaded, fetchData]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading && !status) return <Loader message="Loading dashboard..." />;

    const latestBlock = status?.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height) : 'N/A';
    const networkName = status?.node_info?.network || 'Unknown';
    const catchingUp = status?.sync_info?.catching_up;

    return (
        <div className="p-4 space-y-8">
            <h2 className="text-2xl font-bold text-white mb-6">Network Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card 
                    title="Latest Block" 
                    value={latestBlock !== 'N/A' ? latestBlock.toLocaleString('en-US') : 'N/A'} 
                    icon={List} 
                    onClick={latestBlock !== 'N/A' ? () => router.push(`/block/${latestBlock}`) : null}
                    className="cursor-pointer"
                />
                <Card title="Network ID" value={networkName} icon={Wifi} />
                <Card title="Node Version" value={status?.node_info?.version || 'N/A'} icon={Code} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card 
                    title="App Block Height" 
                    value={abciInfo?.last_block_height ? parseInt(abciInfo.last_block_height).toLocaleString('en-US') : 'N/A'} 
                    icon={Database} 
                />
                <Card title="App Version" value={abciInfo?.version || 'N/A'} icon={Settings} />
                <Card 
                    title="Catching Up" 
                    value={catchingUp ? 'Yes' : 'No'} 
                    icon={Clock} 
                    className={catchingUp ? 'border-yellow-500' : 'border-green-500'} 
                />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold text-green-400 border-b border-gray-700 pb-2 mb-4">Node Status Details</h2>
                <DetailRow label="Latest Block Hash" value={status?.sync_info?.latest_block_hash || 'N/A'} isCode={true} />
                <DetailRow label="Block Time" value={status?.sync_info?.latest_block_time ? new Date(status.sync_info.latest_block_time).toLocaleString() : 'N/A'} />
                <DetailRow label="Validator Address" value={status?.validator_info?.address || 'N/A'} isCode={true} />
                <DetailRow label="Voting Power" value={status?.validator_info?.voting_power || 'N/A'} />
            </div>
        </div>
    );
}