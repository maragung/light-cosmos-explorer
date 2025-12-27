"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, List, Zap, Cloud, Users, TrendingUp, 
    MessageSquare, Settings, Wifi, CheckCircle, Search, 
    RefreshCcw, Check, Menu, X 
} from 'lucide-react';
import { useRpc } from '@/context/RpcContext';

const MENU_ITEMS = [
    { label: 'Dashboard', route: '/', icon: LayoutDashboard },
    { label: 'Blocks', route: '/blocks', icon: List },
    { label: 'Transactions', route: '/transactions', icon: Zap },
    { label: 'Mempool', route: '/mempool', icon: Cloud },
    { label: 'Validators', route: '/validators', icon: Users },
    { label: 'Uptime', route: '/uptime', icon: TrendingUp },
    { label: 'Proposals', route: '/proposals', icon: MessageSquare },
    { label: 'Parameters', route: '/parameters', icon: Settings },
];

export default function AppShell({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { selectedConfig, setRpcConfig, isLoaded, rpcConfigs } = useRpc();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const query = searchQuery.trim();
            if (/^\d+$/.test(query)) router.push(`/block/${query}`);
            else if (/^[0-9A-Fa-f]{64}$/.test(query)) router.push(`/tx/${query}`);
            else if (query.startsWith('warden')) router.push(`/address/${query}`);
            setSearchQuery('');
        }
    };

    const isMainnet = selectedConfig?.network === 'mainnet';

    const toggleNetwork = () => {
        const targetNet = isMainnet ? 'testnet' : 'mainnet';
        const config = rpcConfigs.find(c => c.network === targetNet);
        if (config) setRpcConfig(config);
    };

    if (!isLoaded) return <div className="min-h-screen bg-gray-900 flex items-center justify-center">Loading Configuration...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-900 text-white font-sans">
            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`
                    fixed md:relative z-40 h-full bg-gray-800 border-r border-gray-700 transition-all duration-300
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                        {isSidebarOpen ? (
                            <span className="text-xl font-bold text-green-400 truncate">Warden Explorer</span>
                        ) : (
                            <span className="text-xl font-bold text-green-400 mx-auto">W</span>
                        )}
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
                        {MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.route;
                            
                            return (
                                <Link 
                                    key={item.route}
                                    href={item.route}
                                    className={`
                                        flex items-center px-3 py-3 rounded-lg transition-colors group relative
                                        ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                                        ${!isSidebarOpen && 'justify-center'}
                                    `}
                                    title={!isSidebarOpen ? item.label : ''}
                                >
                                    <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    {isSidebarOpen && (
                        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
                            <p>RPC: {selectedConfig?.label}</p>
                            <div className="flex items-center mt-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                Connected
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl mx-4 hidden md:block">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-green-500 transition duration-150 ease-in-out sm:text-sm"
                                placeholder="Search by Block Height / Tx Hash / Address"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-3">
                        {/* Network Toggle */}
                        <button
                            onClick={toggleNetwork}
                            className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden sm:block
                                ${isMainnet ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}
                            `}
                        >
                            {isMainnet ? 'Mainnet' : 'Testnet'}
                        </button>

                        {/* RPC Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsRpcDropdownOpen(!isRpcDropdownOpen)}
                                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-white transition-colors border border-gray-600"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="hidden sm:inline truncate max-w-[150px]">{selectedConfig?.label}</span>
                            </button>
                            
                            {isRpcDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                                    {rpcConfigs.map((config, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setRpcConfig(config);
                                                setIsRpcDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-between"
                                        >
                                            <span className="truncate">{config.label}</span>
                                            {selectedConfig.label === config.label && <Check className="w-4 h-4 text-green-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
}