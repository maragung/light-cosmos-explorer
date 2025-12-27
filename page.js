"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Wifi, Zap, TableCell, Badge, Clock, TrendingUp, DollarSign, List, Search, Users, LayoutDashboard, ChevronLeft, HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, Code, Minus, MessageSquare, Database, Share2, AlertTriangle } from 'lucide-react';
import { useRpcConfig, useRouter, useTheme, RpcConfigProvider, RouterProvider, ThemeProvider } from './components/hooks';
import { RPC_CONFIGS, ROUTES } from './components/constants';
import ValidatorDetail from './components/ValidatorDetail';
import UptimeView from './components/UptimeView';
import BlocksView from './components/BlocksView';
import ProposalsView from './components/ProposalsView';
import TransactionsView from './components/TransactionsView';

const MainLayout = () => {
    const { selectedConfig, setRpcConfig } = useRpcConfig();
    const { currentRoute, currentParams, navigate, isReady } = useRouter();
    const { isDark, toggleTheme } = useTheme();
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const cometBftRpcApi = selectedConfig.COMETBFT_RPC_API;
    const cosmosSdkApi = selectedConfig.COSMOS_SDK_API;

    const fetchStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            // Include credentials/cookies in the request
            const response = await fetch(`${cometBftRpcApi}/status`, {
                credentials: 'include'
            });
            const data = await response.json();
            setStatus(data.result);
        } catch (error) {
            console.error('Failed to fetch status:', error);
            setStatus(null);
        } finally {
            setIsLoading(false);
        }
    }, [cometBftRpcApi]);

    useEffect(() => {
        if (isReady) fetchStatus();
    }, [isReady, fetchStatus]);

    const menuItems = [
        { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
        { label: 'Blocks', route: ROUTES.BLOCKS_LIST, icon: TableCell },
        { label: 'Transactions', route: ROUTES.TXS, icon: List },
        { label: 'Validators', route: ROUTES.VALIDATORS, icon: Users },
        { label: 'Uptime', route: ROUTES.UPTIME, icon: TrendingUp },
        { label: 'Proposals', route: ROUTES.PROPOSALS, icon: MessageSquare },
        { label: 'Mempool', route: ROUTES.MEMPOOL, icon: Zap },
        { label: 'Network', route: ROUTES.NET_INFO, icon: Wifi },
        { label: 'Health', route: ROUTES.HEALTH, icon: CheckCircle },
        { label: 'Search', route: ROUTES.SEARCH, icon: Search },
    ];

    const apiProps = { cometBftRpcApi, cosmosSdkApi, navigate, status };

    const renderCurrentView = () => {
        if (!isReady) return <div className="p-4 text-center text-gray-400">Loading...</div>;

        switch (currentRoute) {
            case ROUTES.DASHBOARD:
                return <DashboardView {...apiProps} />;
            case ROUTES.VALIDATORS:
                return <ValidatorsView {...apiProps} />;
            case ROUTES.VALIDATOR_DETAIL:
                return <ValidatorDetail currentParams={currentParams} {...apiProps} />;
            case ROUTES.UPTIME:
                return <UptimeView {...apiProps} ROUTES={ROUTES} />;
            case ROUTES.BLOCKS_LIST:
                return <BlocksView {...apiProps} />;
            case ROUTES.TXS:
                return <TransactionsView {...apiProps} />;
            case ROUTES.PROPOSALS:
                return <ProposalsView {...apiProps} />;
            default:
                return <DashboardView {...apiProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-green-400">WardenScan</h1>
                            <div className="hidden md:flex items-center space-x-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>{status ? 'Connected' : 'Disconnected'}</span>
                                {status && (
                                    <span className="text-gray-400">
                                        Height: {status.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height).toLocaleString() : 'N/A'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <select 
                                value={selectedConfig.label}
                                onChange={(e) => {
                                    const config = RPC_CONFIGS.find(c => c.label === e.target.value);
                                    if (config) setRpcConfig(config);
                                }}
                                className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                                {RPC_CONFIGS.map((config, index) => (
                                    <option key={index} value={config.label}>{config.label}</option>
                                ))}
                            </select>
                            <button 
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition duration-200"
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-800 min-h-screen border-r border-gray-700">
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {menuItems.map((item) => (
                                <li key={item.route}>
                                    <button
                                        onClick={() => navigate(item.route)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                                            currentRoute === item.route
                                                ? 'bg-green-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {renderCurrentView()}
                </main>
            </div>
        </div>
    );
};

// Placeholder components for other views
const DashboardView = ({ cometBftRpcApi, cosmosSdkApi, status }) => {
    const [networkInfo, setNetworkInfo] = useState(null);

    useEffect(() => {
        const fetchNetworkInfo = async () => {
            try {
                const response = await fetch(`${cometBftRpcApi}/status`);
                const data = await response.json();
                setNetworkInfo(data.result);
            } catch (error) {
                console.error('Error fetching network info:', error);
            }
        };
        fetchNetworkInfo();
    }, [cometBftRpcApi]);

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

const ValidatorsView = ({ cometBftRpcApi, cosmosSdkApi, navigate }) => {
    const [validators, setValidators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchValidators = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
                const data = await response.json();
                setValidators(data.validators || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchValidators();
    }, [cosmosSdkApi]);

    if (isLoading) return <div className="p-4 text-center">Loading validators...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-400">Validators</h1>
            <div className="bg-gray-800 rounded-xl overflow-hidden neon-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Moniker</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Voting Power</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {validators.map((validator) => (
                                <tr 
                                    key={validator.operator_address} 
                                    className="hover:bg-gray-700 cursor-pointer transition duration-150"
                                    onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.operator_address })}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{validator.description?.moniker || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-xs">{validator.operator_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            validator.status === 'BOND_STATUS_BONDED' ? 'bg-green-800 text-green-200' : 
                                            validator.status === 'BOND_STATUS_UNBONDING' ? 'bg-yellow-800 text-yellow-200' : 
                                            'bg-red-800 text-red-200'
                                        }`}>
                                            {validator.status?.replace('BOND_STATUS_', '') || 'UNKNOWN'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {validator.tokens ? parseFloat(validator.tokens).toLocaleString() : '0'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {validator.commission?.commission_rates?.rate ? 
                                            (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) + '%' : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Card = ({ title, value, icon: Icon, onClick, className = '' }) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 neon-border ${onClick ? 'cursor-pointer' : ''} ${className} scale-95`}
    >
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            {Icon && <Icon className="w-5 h-5 text-green-400" />}
        </div>
        <p className="mt-2 text-2xl font-extrabold text-white truncate">{value}</p>
    </div>
);

export default function Home() {
    return (
        <ThemeProvider>
            <RpcConfigProvider>
                <RouterProvider>
                    <MainLayout />
                </RouterProvider>
            </RpcConfigProvider>
        </ThemeProvider>
    );
}
