"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Wifi, Zap, TableCell, Badge, Clock, TrendingUp, DollarSign, List, Search, Users, LayoutDashboard, ChevronLeft, HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, Code, Minus, MessageSquare, Database, Share2, AlertTriangle } from 'lucide-react';
import { useRpcConfig, useRouter, useTheme, RPC_CONFIGS, ROUTES, createFetchWithCookies } from './components/hooks';
import ValidatorDetail from './components/ValidatorDetail';
import DashboardView from './views/DashboardView';
import ValidatorsView from './views/ValidatorsView';
import UptimeView from './views/UptimeView';
import BlocksView from './views/BlocksView';
import ProposalsView from './views/ProposalsView';
import TransactionsView from './views/TransactionsView';
import { RouterProvider, ThemeProvider, RpcConfigProvider } from './components/hooks';

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
            const fetchWithCookies = createFetchWithCookies(selectedConfig);
            const response = await fetchWithCookies(`${cometBftRpcApi}/status`);
            const data = await response.json();
            setStatus(data.result);
        } catch (error) {
            console.error('Failed to fetch status:', error);
            setStatus(null);
        } finally {
            setIsLoading(false);
        }
    }, [cometBftRpcApi, selectedConfig]);

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

    const apiProps = { cometBftRpcApi, cosmosSdkApi, navigate, status, selectedConfig };

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



export default MainLayout;

// Wrap the main layout with all providers
import { RouterProvider, ThemeProvider, RpcConfigProvider } from './components/hooks';

const WrappedMainLayout = () => {
  return (
    <RpcConfigProvider>
      <ThemeProvider>
        <RouterProvider>
          <MainLayout />
        </RouterProvider>
      </ThemeProvider>
    </RpcConfigProvider>
  );
};

export { WrappedMainLayout as Page };
