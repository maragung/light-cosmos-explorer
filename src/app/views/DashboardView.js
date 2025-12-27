import React, { useState, useEffect } from 'react';
import { RefreshCcw, Wifi, Zap, TableCell, Badge, Clock, TrendingUp, DollarSign, List, Search, Users, LayoutDashboard, ChevronLeft, HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, Code, Minus, MessageSquare, Database, Share2, AlertTriangle } from 'lucide-react';
import { createFetchWithCookies } from '../components/hooks';

const DashboardView = ({ cometBftRpcApi, cosmosSdkApi, status, selectedConfig }) => {
    const [networkInfo, setNetworkInfo] = useState(null);

    useEffect(() => {
        const fetchNetworkInfo = async () => {
            try {
                const fetchWithCookies = createFetchWithCookies(selectedConfig);
                const response = await fetchWithCookies(`${cometBftRpcApi}/status`);
                const data = await response.json();
                setNetworkInfo(data.result);
            } catch (error) {
                console.error('Error fetching network info:', error);
            }
        };
        fetchNetworkInfo();
    }, [cometBftRpcApi, selectedConfig]);

    const Card = ({ title, value, icon: Icon, onClick, className = '' }) => (
        <div
            onClick={onClick}
            className={`bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 border border-gray-700 ${onClick ? 'cursor-pointer' : ''} ${className} scale-95`}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
                {Icon && <Icon className="w-5 h-5 text-green-400" />}
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white truncate">{value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-400">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Latest Block" value={status?.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height).toLocaleString() : '...'} icon={TableCell} />
                <Card title="Block Time" value={status?.validator_info?.voting_power ? `${(status.validator_info.voting_power / 1000000).toFixed(2)}s` : 'N/A'} icon={Clock} />
                <Card title="Total Validators" value={status?.validator_info ? 'N/A' : '...'} icon={Users} />
                <Card title="Sync Status" value={status?.sync_info?.catching_up ? 'Syncing' : 'Synced'} icon={RefreshCcw} />
            </div>
        </div>
    );
};

export default DashboardView;