"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, List, Zap, Cloud, Users, TrendingUp, 
    MessageSquare, Settings, Search, Menu, X, Check, Plus 
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

const CUSTOM_RPC_KEY = 'customRpcConfigs';

export default function AppShell({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { selectedConfig, setRpcConfig, isLoaded, rpcConfigs } = useRpc();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customRpcUrl, setCustomRpcUrl] = useState('');
    const [customApiUrl, setCustomApiUrl] = useState('');
    const [customConfigs, setCustomConfigs] = useState([]);

    // Load custom RPCs
    useEffect(() => {
        const saved = localStorage.getItem(CUSTOM_RPC_KEY);
        if (saved) {
            try {
                setCustomConfigs(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse custom RPC configs');
            }
        }
    }, []);

    // Save custom RPCs
    useEffect(() => {
        localStorage.setItem(CUSTOM_RPC_KEY, JSON.stringify(customConfigs));
    }, [customConfigs]);

    // Handle mobile detection
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

    const addCustomRpc = useCallback(() => {
        if (!customName.trim() || !customRpcUrl.trim() || !customApiUrl.trim()) {
            alert('Please fill all fields.');
            return;
        }

        const newCustom = {
            label: customName.trim(),
            rpcUrl: customRpcUrl.trim(),
            apiUrl: customApiUrl.trim(),
            network: 'custom',
            isCustom: true,
        };

        setCustomConfigs(prev => [...prev, newCustom]);
        setRpcConfig(newCustom);
        setShowCustomForm(false);
        setCustomName('');
        setCustomRpcUrl('');
        setCustomApiUrl('');
        setIsRpcDropdownOpen(false);
    }, [customName, customRpcUrl, customApiUrl, setRpcConfig]);

    const handleCustomSelect = () => {
        setShowCustomForm(true);
        setIsRpcDropdownOpen(false);
    };

    const allRpcOptions = [...rpcConfigs, ...customConfigs];

    // Close sidebar on mobile after menu click
    const handleMenuClick = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    if (!isLoaded) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            Loading Configuration...
        </div>
    );

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
                    ${isSidebarOpen 
                        ? 'w-64 translate-x-0' 
                        : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                        {/* Logo */}
                        {!isMobile && (
                            <span className="text-xl font-bold text-green-400">
                                {isSidebarOpen ? 'Warden Explorer' : 'W'}
                            </span>
                        )}

                        {/* Close button for mobile */}
                        {isMobile && isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                                aria-label="Close sidebar"
                            >
                                <X className="w-5 h-5" />
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
                                    onClick={handleMenuClick}
                                    className={`
                                        flex items-center px-3 py-3 rounded-lg transition-colors group relative
                                        ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                                        ${!isSidebarOpen ? 'justify-center px-0' : ''}
                                    `}
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer — desktop only */}
                    {!isMobile && isSidebarOpen && (
                        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
                            <p>RPC: {selectedConfig?.label}</p>
                            <div className="flex items-center mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                Connected
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* RPC Indicator — Desktop Only, Top Right Corner */}
                {!isMobile && (
                    <div className="absolute top-3 right-3 z-10">
                        <div className="relative">
                            <button
                                onClick={() => setIsRpcDropdownOpen(!isRpcDropdownOpen)}
                                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-xs text-white border border-gray-600"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="truncate max-w-[140px]">
                                    {selectedConfig?.label || 'Select RPC'}
                                </span>
                            </button>
                            
                            {isRpcDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-60 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                                    {allRpcOptions.map((config, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setRpcConfig(config);
                                                setIsRpcDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-between"
                                        >
                                            <span className="truncate">{config.label}</span>
                                            {selectedConfig?.label === config.label && (
                                                <Check className="w-4 h-4 text-green-500" />
                                            )}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button
                                        onClick={handleCustomSelect}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span>Add Custom RPC</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Top Header */}
                <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-3 md:px-6">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none flex-shrink-0"
                        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Centered Search */}
                    <div className="flex-1 max-w-2xl mx-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-green-500 transition text-sm"
                                placeholder="Search: Block / Tx / Address"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Mobile RPC Selector */}
                    {isMobile && (
                        <div className="flex-shrink-0 ml-2 relative">
                            <button
                                onClick={() => setIsRpcDropdownOpen(!isRpcDropdownOpen)}
                                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-white border border-gray-600"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="truncate max-w-[100px]">
                                    {selectedConfig?.label || 'RPC'}
                                </span>
                            </button>
                            
                            {isRpcDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                                    {allRpcOptions.map((config, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setRpcConfig(config);
                                                setIsRpcDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-between"
                                        >
                                            <span className="truncate">{config.label}</span>
                                            {selectedConfig?.label === config.label && (
                                                <Check className="w-4 h-4 text-green-500" />
                                            )}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-700 my-1"></div>
                                    <button
                                        onClick={handleCustomSelect}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span>Add Custom</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-900">
                    {children}
                </main>
            </div>

            {/* Custom RPC Modal */}
            {showCustomForm && (
                <>
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCustomForm(false)}
                    >
                        <div 
                            className="bg-gray-800 rounded-lg w-full max-w-md p-6 border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Add Custom RPC</h3>
                                <button 
                                    onClick={() => setShowCustomForm(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                                        placeholder="e.g. My Node"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">RPC URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                                        placeholder="https://rpc.example.com"
                                        value={customRpcUrl}
                                        onChange={(e) => setCustomRpcUrl(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">API URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                                        placeholder="https://api.example.com"
                                        value={customApiUrl}
                                        onChange={(e) => setCustomApiUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowCustomForm(false)}
                                    className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addCustomRpc}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
