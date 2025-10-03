"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCcw, Wifi, Zap, Clock, TrendingUp, DollarSign, List, Search, Users, LayoutDashboard, ChevronLeft, HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, Code, Minus, MessageSquare, Database, Share2, AlertTriangle } from 'lucide-react';

const RPC_CONFIGS = [
  {
    "label": "Warden Indonesia - Mainnet", 
    "COMETBFT_RPC_API": "https://rpc.warden.clogs.id", 
    "COSMOS_SDK_API": "https://api.warden.clogs.id" 
  }, 
  {
    "label": "Itrocket - Mainnet",
    "COMETBFT_RPC_API": "https://warden-mainnet-rpc.itrocket.net",
    "COSMOS_SDK_API": "https://warden-mainnet-api.itrocket.net"
  },
];

const useRpcConfig = () => {
  const [selectedConfig, setSelectedConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rpcConfig');
      return saved ? JSON.parse(saved) : RPC_CONFIGS[0];
    }
    return RPC_CONFIGS[0];
  });

  const setRpcConfig = useCallback((config) => {
    setSelectedConfig(config);
    localStorage.setItem('rpcConfig', JSON.stringify(config));
  }, []);

  return { selectedConfig, setRpcConfig };
};

const ROUTES = {
    DASHBOARD: 'DASHBOARD',
    BLOCKS_LIST: 'BLOCKS_LIST',
    BLOCKS_DETAIL: 'BLOCKS_DETAIL',
    BLOCK_RESULTS: 'BLOCK_RESULTS',
    TXS: 'TXS',
    TX_DETAIL: 'TX_DETAIL',
    BROADCAST_TX: 'BROADCAST_TX',
    MEMPOOL: 'MEMPOOL',
    VALIDATORS: 'VALIDATORS',
    VALIDATOR_DETAIL: 'VALIDATOR_DETAIL',
    NET_INFO: 'NET_INFO',
    HEALTH: 'HEALTH',
    CONSENSUS_STATE: 'CONSENSUS_STATE',
    PROPOSALS: 'PROPOSALS',
    ADDRESS_DETAIL: 'ADDRESS_DETAIL',
    SEARCH: 'SEARCH',
};

const useTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') !== 'light';
        }
        return true;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    return { isDark, toggleTheme };
};

const convertRawVotingPower = (rawTokens, decimals = 18) => {
    if (!rawTokens) return '0.000';
    try {
        const rawBigInt = BigInt(rawTokens);
        const divisor = BigInt(10) ** BigInt(decimals);
        const integerPart = rawBigInt / divisor;
        const remainder = rawBigInt % divisor;
        const remainderScaled = remainder * BigInt(1000) / divisor;
        const formattedInteger = integerPart.toLocaleString('en-US');
        const formattedRemainder = String(remainderScaled).padStart(3, '0').substring(0, 3);
        return `${formattedInteger}.${formattedRemainder}`;
    } catch (e) {
        console.error("Error converting raw tokens:", e);
        return rawTokens.toString();
    }
}

const decodeBase64 = (base64) => {
    if (!base64) return 'N/A';
    try {
        if (typeof window !== 'undefined') {
            const bytes = atob(base64);
            if (bytes.length < 50) {
                return '0x' + Array.from(bytes).map(b => b.charCodeAt(0).toString(16).padStart(2, '0')).join('');
            }
            return bytes;
        }
        return 'Decoding not available';
    } catch (e) {
        return base64.substring(0, 15) + '... (Base64 Decode Error)';
    }
};

const fetchWithRetry = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed for ${url}:`, error.message);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } else {
                throw error;
            }
        }
    }
};

const Loader = ({ message = "Loading data..." }) => (
    <div className="flex justify-center items-center my-8 p-4">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-indigo-400 font-medium">{message}</p>
    </div>
);

const Card = ({ title, value, icon: Icon, onClick, className = '' }) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ${onClick ? 'cursor-pointer' : ''} border border-indigo-700 ${className} scale-95`}
    >
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            {Icon && <Icon className="w-5 h-5 text-indigo-400" />}
        </div>
        <p className="mt-2 text-2xl font-extrabold text-white truncate">{value}</p>
    </div>
);

const DetailRow = ({ label, value, isCode = false }) => (
    <div className="flex flex-col sm:flex-row border-b border-gray-700 py-3">
        <div className="sm:w-1/3 text-sm font-medium text-gray-400">{label}</div>
        <div className={`sm:w-2/3 mt-1 sm:mt-0 text-sm break-all ${isCode ? 'font-mono text-indigo-300 bg-gray-700 p-2 rounded-lg' : 'text-gray-100'}`}>{value}</div>
    </div>
);

const JsonViewer = ({ data, title }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
        <h3 className="text-xl font-bold text-indigo-400">{title}</h3>
        <pre className="text-sm text-gray-200 bg-gray-900 p-4 rounded-lg overflow-x-auto font-mono max-h-96">
            {JSON.stringify(data, null, 2)}
        </pre>
    </div>
);

const ValidatorDetail = ({ currentParams, navigate, cometBftRpcApi, cosmosSdkApi }) => {
    const [validatorData, setValidatorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const validatorAddress = currentParams.address;

    useEffect(() => {
        const fetchValidatorDetail = async () => {
            if (!validatorAddress) return;

            setIsLoading(true);
            setError(null);
            try {
                const validatorUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${validatorAddress}`;
                const validatorData = await fetchWithRetry(validatorUrl);

                const signingInfoUrl = `${cosmosSdkApi}/cosmos/slashing/v1beta1/signing_infos/${validatorAddress}`;
                let signingInfo = null;
                try {
                    signingInfo = await fetchWithRetry(signingInfoUrl);
                } catch (e) {
                    console.log('Signing info not available:', e.message);
                }

                const delegationsUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations`;
                let delegationsCount = 0;
                try {
                    const delegationsData = await fetchWithRetry(delegationsUrl);
                    delegationsCount = delegationsData.pagination?.total || 0;
                } catch (e) {
                    console.log('Delegations data not available:', e.message);
                }

                setValidatorData({
                    validator: validatorData.validator,
                    signingInfo: signingInfo?.val_signing_info,
                    delegationsCount
                });
            } catch (error) {
                console.error('Failed to load validator details:', error);
                setError(error.message);
                setValidatorData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchValidatorDetail();
    }, [validatorAddress, cosmosSdkApi]);

    if (isLoading) return <Loader message="Loading validator details..." />;
    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Validator Details</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    const validator = validatorData?.validator;
    const description = validator?.description || {};
    const commission = validator?.commission?.commission_rates;

    if (!validator) return (
        <div className="p-4">
            <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-200 p-4 rounded-lg">
                <p className="font-semibold">Validator Not Found</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 space-y-6">
            <button
                onClick={() => navigate(ROUTES.VALIDATORS)}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition duration-200 mb-4"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Validators
            </button>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{description.moniker || 'Unnamed Validator'}</h1>
                        <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${validator.jailed ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'}`}>
                                {validator.jailed ? 'Jailed' : 'Active'}
                            </span>
                            <span className="ml-3 text-gray-400">VALIDATORS • STATS</span>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
                            Delegate
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Validator Address</h3>
                        <p className="text-sm font-mono text-gray-300 break-all">{validator.operator_address}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Account Address</h3>
                        <p className="text-sm font-mono text-gray-300 break-all">
                            {validator.operator_address.replace('valoper', '')}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {description.website && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-1">Web Site</h3>
                            <a href={description.website} target="_blank" rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 text-sm">
                                {description.website}
                            </a>
                        </div>
                    )}
                    {description.details && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-1">Details</h3>
                            <p className="text-gray-300 text-sm">{description.details}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <h2 className="text-xl font-bold text-indigo-400 mb-4">Operation Time</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">D+1204</span>
                            <span className="text-white font-semibold">Total Bonded {convertRawVotingPower(validator.tokens, 18)} (14.63%)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Set</span>
                            <span className="text-white font-semibold">2</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Self Bonded</span>
                            <span className="text-white font-semibold">2</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">LSM Delegation</span>
                            <span className="text-white font-semibold">5.48</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Upline</span>
                            <span className="text-white font-semibold">100.00% (0 / 500)</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Window Block Miss</span>
                            <span className="text-white font-semibold">0 / 10,000</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Commission</span>
                            <span className="text-white font-semibold">
                                {commission ? `${(parseFloat(commission.rate) * 100).toFixed(2)}%` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Expect APR</span>
                            <span className="text-white font-semibold">13.63%</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                            <span className="text-gray-400">Delegators</span>
                            <span className="text-white font-semibold">
                                {validatorData.delegationsCount?.toLocaleString() || '9,318'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <h2 className="text-xl font-bold text-indigo-400 mb-4">Additional Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Identity</h3>
                        <p className="text-gray-300">{description.identity || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Security Contact</h3>
                        <p className="text-gray-300">{description.security_contact || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProposalsView = ({ cometBftRpcApi, cosmosSdkApi }) => {
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('live');
    const itemsPerPage = 10;

    const [summaryData, setSummaryData] = useState({
        total: 0,
        votingPeriod: 0,
        passed: 0,
        rejected: 0
    });

    const fetchProposals = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const proposalsUrl = `${cosmosSdkApi}/cosmos/gov/v1beta1/proposals?pagination.limit=1000`;
            const proposalsData = await fetchWithRetry(proposalsUrl);

            const allProposals = proposalsData?.proposals || [];

            const votingPeriod = allProposals.filter(p => p.status === 'PROPOSAL_STATUS_VOTING_PERIOD').length;
            const passed = allProposals.filter(p => p.status === 'PROPOSAL_STATUS_PASSED').length;
            const rejected = allProposals.filter(p => p.status === 'PROPOSAL_STATUS_REJECTED').length;

            setSummaryData({
                total: allProposals.length,
                votingPeriod,
                passed,
                rejected
            });

            const formattedProposals = allProposals.map(proposal => ({
                id: proposal.proposal_id,
                title: proposal.content?.title || proposal.content?.value?.title || 'No Title',
                status: proposal.status,
                votingStartTime: proposal.voting_start_time,
                votingEndTime: proposal.voting_end_time,
                submitTime: proposal.submit_time,
                totalDeposit: proposal.total_deposit?.[0] ?
                    `${parseInt(proposal.total_deposit[0].amount) / 1000000} ${proposal.total_deposit[0].denom}` : '0',
                finalTally: proposal.final_tally_result
            }));

            setProposals(formattedProposals);

        } catch (err) {
            console.error('Failed to fetch proposals:', err);
            setError(err.message);
            setProposals([]);
        } finally {
            setIsLoading(false);
        }
    }, [cosmosSdkApi]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const filteredProposals = useMemo(() => {
        if (activeTab === 'live') {
            return proposals.filter(p => p.status === 'PROPOSAL_STATUS_VOTING_PERIOD');
        }
        return proposals;
    }, [proposals, activeTab]);

    const indexOfLastProposal = currentPage * itemsPerPage;
    const indexOfFirstProposal = indexOfLastProposal - itemsPerPage;
    const currentProposals = filteredProposals.slice(indexOfFirstProposal, indexOfLastProposal);
    const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PROPOSAL_STATUS_VOTING_PERIOD': { color: 'bg-blue-600', text: 'Voting' },
            'PROPOSAL_STATUS_PASSED': { color: 'bg-green-600', text: 'Passed' },
            'PROPOSAL_STATUS_REJECTED': { color: 'bg-red-600', text: 'Rejected' },
            'PROPOSAL_STATUS_DEPOSIT_PERIOD': { color: 'bg-yellow-600', text: 'Deposit' },
            'PROPOSAL_STATUS_FAILED': { color: 'bg-red-600', text: 'Failed' },
        };

        const statusInfo = statusMap[status] || { color: 'bg-gray-600', text: status };
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color} text-white`}>
                {statusInfo.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (isLoading) return <Loader message="Loading proposals..." />;

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                    <p className="font-semibold">Error Loading Proposals</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        onClick={fetchProposals}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">Governance Proposals</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg border border-indigo-700">
                    <div className="text-sm text-gray-400 mb-1">Total Proposals</div>
                    <div className="text-2xl font-bold text-white">{summaryData.total}</div>
                    <div className="text-xs text-gray-400 mt-1">All Time</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-blue-700">
                    <div className="text-sm text-gray-400 mb-1">Voting Period</div>
                    <div className="text-2xl font-bold text-blue-400">{summaryData.votingPeriod}</div>
                    <div className="text-xs text-gray-400 mt-1">Active Now</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-green-700">
                    <div className="text-sm text-gray-400 mb-1">Passed</div>
                    <div className="text-2xl font-bold text-green-400">{summaryData.passed}</div>
                    <div className="text-xs text-gray-400 mt-1">Successful</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-red-700">
                    <div className="text-sm text-gray-400 mb-1">Rejected</div>
                    <div className="text-2xl font-bold text-red-400">{summaryData.rejected}</div>
                    <div className="text-xs text-gray-400 mt-1">Not Passed</div>
                </div>
            </div>

            <div className="flex space-x-4 border-b border-gray-700">
                <button
                    onClick={() => { setActiveTab('live'); setCurrentPage(1); }}
                    className={`px-4 py-2 font-medium text-sm transition duration-200 border-b-2 ${activeTab === 'live'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Live Proposals ({summaryData.votingPeriod})
                </button>
                <button
                    onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                    className={`px-4 py-2 font-medium text-sm transition duration-200 border-b-2 ${activeTab === 'all'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                >
                    All Proposals ({summaryData.total})
                </button>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-300">
                    {activeTab === 'live' ? 'Live Proposals' : 'All Proposals'} ({filteredProposals.length})
                </h3>
                <button
                    onClick={fetchProposals}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
                >
                    <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                </button>
            </div>

            <div className="flex justify-between items-center">
                <p className="text-gray-400">
                    Showing {indexOfFirstProposal + 1}-{Math.min(indexOfLastProposal, filteredProposals.length)} of {filteredProposals.length} proposals
                </p>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {filteredProposals.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-xl text-center border border-indigo-700">
                    <div className="text-gray-400 text-lg mb-2">
                        {activeTab === 'live' ? 'No live proposals at the moment' : 'No proposals found'}
                    </div>
                    <div className="text-gray-500 text-sm">
                        {activeTab === 'live'
                            ? 'Check back later for new governance proposals'
                            : 'Proposals will appear here once created'
                        }
                    </div>
                </div>
            ) : (
                <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-indigo-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Voting Start</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Voting End</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Deposit</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {currentProposals.map((proposal) => (
                                    <tr key={proposal.id} className="hover:bg-gray-700 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-400">
                                            #{proposal.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-white max-w-xs truncate">
                                                {proposal.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(proposal.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {formatDate(proposal.votingStartTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {formatDate(proposal.votingEndTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                                            {proposal.totalDeposit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const SearchView = ({ navigate, setModal, cometBftRpcApi, cosmosSdkApi }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('auto');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState(null);

    const detectSearchType = (query) => {
        const cleanQuery = query.trim();
        if (/^\d+$/.test(cleanQuery)) return 'height';
        if (/^[0-9a-fA-F]{64}$/.test(cleanQuery)) return 'tx';
        if (/^(warden|cosmos|terra|osmo)[a-zA-Z0-9]{39}$/.test(cleanQuery)) return 'address';
        return 'unknown';
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setModal({ title: "Search Error", message: "Please enter a search query" });
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setSearchResult(null);

        try {
            const query = searchQuery.trim();
            const detectedType = searchType === 'auto' ? detectSearchType(query) : searchType;

            let result = null;

            switch (detectedType) {
                case 'height':
                    const blockUrl = `${cometBftRpcApi}/block?height=${query}`;
                    const blockData = await fetchWithRetry(blockUrl);
                    result = {
                        type: 'block',
                        data: blockData.result?.block,
                        detectedType: detectedType
                    };
                    break;

                case 'tx':
                    const txHash = query.toUpperCase();
                    const txUrl = `${cometBftRpcApi}/tx?hash=0x${txHash}`;
                    const txData = await fetchWithRetry(txUrl);
                    result = {
                        type: 'transaction',
                        data: txData.result,
                        detectedType: detectedType
                    };
                    break;

                case 'address':
                    const accountUrl = `${cosmosSdkApi}/cosmos/auth/v1beta1/accounts/${query}`;
                    const accountData = await fetchWithRetry(accountUrl);
                    result = {
                        type: 'address',
                        data: accountData,
                        detectedType: detectedType
                    };
                    break;

                default:
                    throw new Error(`Unable to determine search type for: ${query}. Please specify the type manually.`);
            }

            setSearchResult(result);
            setSearchQuery('');

            if (result.type === 'block' && result.data) {
                navigate(ROUTES.BLOCKS_DETAIL, { height: result.data.header.height });
            } else if (result.type === 'transaction' && result.data) {
                navigate(ROUTES.TX_DETAIL, { hash: query });
            } else if (result.type === 'address' && result.data) {
                navigate(ROUTES.ADDRESS_DETAIL, { address: query });
            }

        } catch (error) {
            console.error('Search error:', error);
            setSearchError(error.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Search Blockchain</h2>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-300 mb-2">
                            Search Query
                        </label>
                        <input
                            type="text"
                            id="searchQuery"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter block height, transaction hash, or account address"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div className="w-full md:w-48">
                        <label htmlFor="searchType" className="block text-sm font-medium text-gray-300 mb-2">
                            Search Type
                        </label>
                        <select
                            id="searchType"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="auto">Auto-detect</option>
                            <option value="height">Block Height</option>
                            <option value="tx">Transaction Hash</option>
                            <option value="address">Account Address</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="w-5 h-5 mr-2" />
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-400">
                    <p>Examples:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Block Height: <span className="font-mono text-indigo-300">1234567</span></li>
                        <li>Transaction Hash: <span className="font-mono text-indigo-300">A1B2C3... (64 hex characters)</span></li>
                        <li>Account Address: <span className="font-mono text-indigo-300">warden1...</span></li>
                    </ul>
                </div>
            </div>

            {isSearching && <Loader message="Searching blockchain data..." />}

            {searchError && (
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                    <p className="font-semibold">Search Error</p>
                    <p className="text-sm mt-1">{searchError}</p>
                </div>
            )}

            {searchResult && !isSearching && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-green-700">
                    <h3 className="text-xl font-bold text-green-400">Search Result Found</h3>
                    <DetailRow label="Detected Type" value={searchResult.detectedType} />
                    <DetailRow label="Result Type" value={searchResult.type} />

                    {searchResult.type === 'block' && (
                        <div className="space-y-2">
                            <p className="text-gray-300">Block #{searchResult.data?.header?.height} found successfully.</p>
                            <button
                                onClick={() => navigate(ROUTES.BLOCKS_DETAIL, { height: searchResult.data.header.height })}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                            >
                                View Block Details
                            </button>
                        </div>
                    )}

                    {searchResult.type === 'transaction' && (
                        <div className="space-y-2">
                            <p className="text-gray-300">Transaction found successfully.</p>
                            <button
                                onClick={() => navigate(ROUTES.TX_DETAIL, { hash: searchQuery })}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                            >
                                View Transaction Details
                            </button>
                        </div>
                    )}

                    {searchResult.type === 'address' && (
                        <div className="space-y-2">
                            <p className="text-gray-300">Account address found.</p>
                            <button
                                onClick={() => navigate(ROUTES.ADDRESS_DETAIL, { address: searchQuery })}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                            >
                                View Account Details
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const BlocksList = ({ navigate, cometBftRpcApi, cosmosSdkApi }) => {
    const [blockList, setBlockList] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [latestBlockHeight, setLatestBlockHeight] = useState(null);

    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(() => {
        return Number(localStorage.getItem("blocksRefreshInterval")) || 10000;
    });

    const fetchLatestBlockHeight = useCallback(async () => {
        try {
            const statusUrl = `${cometBftRpcApi}/status`;
            const statusData = await fetchWithRetry(statusUrl);
            const height = parseInt(statusData.result?.sync_info?.latest_block_height);
            setLatestBlockHeight(height);
            return height;
        } catch (error) {
            console.error('Failed to fetch latest block height:', error);
            return null;
        }
    }, [cometBftRpcApi]);

    const fetchBlocks = useCallback(async (showLoader = true) => {
        if (showLoader) setInitialLoading(true);
        setError(null);

        try {
            const latestHeight = await fetchLatestBlockHeight();

            if (!latestHeight) {
                throw new Error('Could not get latest block height');
            }

            console.log('Latest block height:', latestHeight);

            const minHeight = Math.max(1, latestHeight - 100);
            const blockchainUrl = `${cometBftRpcApi}/blockchain?minHeight=${minHeight}&maxHeight=${latestHeight}`;
            const blockchainData = await fetchWithRetry(blockchainUrl);

            if (blockchainData.result && blockchainData.result.block_metas) {
                const blocks = blockchainData.result.block_metas
                    .sort((a, b) => parseInt(b.header.height) - parseInt(a.header.height))
                    .slice(0, 20);

                console.log('Fetched blocks:', blocks.length, 'Latest in list:', blocks[0]?.header?.height);

                setBlockList(blocks);
            } else {
                throw new Error('Invalid response format from blockchain endpoint');
            }

        } catch (err) {
            console.error('Error fetching blocks:', err);
            setError(err.message);

            try {
                console.log('Trying alternative method...');
                const latestHeight = await fetchLatestBlockHeight();
                if (latestHeight) {
                    const blocksToFetch = [];
                    for (let i = 0; i < 20; i++) {
                        if (latestHeight - i > 0) {
                            blocksToFetch.push(latestHeight - i);
                        }
                    }

                    const blockPromises = blocksToFetch.map(height =>
                        fetchWithRetry(`${cometBftRpcApi}/block?height=${height}`)
                            .then(data => ({
                                block_id: {
                                    hash: data.result?.block_id?.hash
                                },
                                header: {
                                    height: data.result?.block?.header?.height,
                                    time: data.result?.block?.header?.time
                                },
                                num_txs: data.result?.block?.data?.txs?.length || 0
                            }))
                            .catch(err => {
                                console.warn(`Failed to fetch block ${height}:`, err.message);
                                return null;
                            })
                    );

                    const blocksData = await Promise.all(blockPromises);
                    const validBlocks = blocksData.filter(block => block !== null)
                        .sort((a, b) => parseInt(b.header.height) - parseInt(a.header.height));

                    console.log('Alternative method result:', validBlocks.length, 'blocks');
                    setBlockList(validBlocks);
                }
            } catch (fallbackErr) {
                console.error('Fallback method also failed:', fallbackErr);
                setBlockList([]);
            }
        } finally {
            if (showLoader) setInitialLoading(false);
        }
    }, [fetchLatestBlockHeight, cometBftRpcApi]);

    useEffect(() => {
        fetchBlocks(true);
    }, [fetchBlocks]);

    useEffect(() => {
        localStorage.setItem("blocksRefreshInterval", refreshInterval);
    }, [refreshInterval]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(async () => {
                setIsAutoRefreshing(true);
                await fetchBlocks(false);
                setIsAutoRefreshing(false);
            }, refreshInterval);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchBlocks]);

    useEffect(() => {
        if (blockList.length > 0) {
            console.log('Block List State - Latest:', blockList[0]?.header?.height, 'Total:', blockList.length);
        }
    }, [blockList]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-400">Latest Blocks</h2>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Latest:</span>
                        <span className="text-sm font-bold text-indigo-400">
                            {latestBlockHeight ? latestBlockHeight.toLocaleString() : '...'}
                        </span>
                        <span className="text-sm text-gray-400">in list:</span>
                        <span className="text-sm font-bold text-green-400">
                            {blockList[0]?.header?.height ? parseInt(blockList[0].header.height).toLocaleString() : '...'}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchBlocks(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={() => setAutoRefresh(!autoRefresh)}
                            className="form-checkbox h-4 w-4 text-indigo-600"
                        />
                        <span>Auto Refresh</span>
                        {isAutoRefreshing && (
                            <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </label>
                    {autoRefresh && (
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="px-2 py-1 bg-gray-700 text-white text-sm rounded-lg"
                        >
                            <option value={5000}>5s</option>
                            <option value={10000}>10s</option>
                            <option value={30000}>30s</option>
                        </select>
                    )}
                </div>
            </div>

            {initialLoading ? (
                <Loader message="Loading latest blocks..." />
            ) : error ? (
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                    <p className="font-semibold">Error Loading Blocks</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        onClick={() => fetchBlocks(true)}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                        Try Again
                    </button>
                </div>
            ) : blockList.length === 0 ? (
                <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-200 p-4 rounded-lg">
                    <p className="font-semibold">No Blocks Found</p>
                    <p className="text-sm mt-1">Unable to load block data. The API might be experiencing issues.</p>
                </div>
            ) : (
                <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-indigo-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Height</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Block Hash</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Txs</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {blockList.map((block) => (
                                    <tr key={block.block_id.hash} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm font-medium text-indigo-400 cursor-pointer"
                                            onClick={() => navigate(ROUTES.BLOCKS_DETAIL, { height: block.header.height })}>
                                            {parseInt(block.header.height).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-300">
                                            {block.block_id.hash?.substring(0, 20)}...
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {block.header.time ? new Date(block.header.time).toLocaleTimeString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {block.num_txs || 0}
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
};

const BlockResultsView = ({ currentParams, status, cometBftRpcApi, cosmosSdkApi }) => {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const defaultHeight = status?.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height) : null;
    const height = currentParams.height || defaultHeight;

    useEffect(() => {
        if (!height) {
            setIsLoading(false);
            return;
        }
        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${cometBftRpcApi}/block_results?height=${height}`;
                const data = await fetchWithRetry(url);
                setResults(data.result);
            } catch (error) {
                console.error('Failed to load block results:', error);
                setError(error.message);
                setResults(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [height, cometBftRpcApi]);

    if (!height) return (
        <div className="p-4">
            <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-200 p-4 rounded-lg">
                <p className="font-semibold">Block height not available</p>
            </div>
        </div>
    );

    if (isLoading) return <Loader message={`Loading results for Block #${height}...`} />;

    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Block Results</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">Block Results</h2>
            <p className="text-gray-400 mb-4">Application execution results for Block #{height}</p>
            {results && <JsonViewer data={results} title={`Results for Block #${results.height || height}`} />}
        </div>
    );
};

const NetworkInfo = ({ cometBftRpcApi, cosmosSdkApi }) => {
    const [netInfo, setNetInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInfo = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${cometBftRpcApi}/net_info`;
                const data = await fetchWithRetry(url);
                setNetInfo(data.result);
            } catch (error) {
                console.error('Failed to load network info:', error);
                setError(error.message);
                setNetInfo(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInfo();
    }, [cometBftRpcApi]);

    if (isLoading) return <Loader message="Loading network information..." />;
    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Network Info</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Network Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Active Peers" value={netInfo?.n_peers || '0'} icon={Share2} />
                <Card title="Listening" value={netInfo?.listening ? 'Yes' : 'No'} icon={Globe} />
            </div>

            {netInfo?.peers && <JsonViewer data={netInfo.peers} title="Active Peers List" />}
        </div>
    );
};

const HealthView = ({ cometBftRpcApi, cosmosSdkApi }) => {
    const [isHealthy, setIsHealthy] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkHealth = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = `${cometBftRpcApi}/health`;
            const response = await fetch(url);
            setIsHealthy(response.ok);
        } catch (error) {
            console.error('Failed to check RPC health:', error);
            setIsHealthy(false);
        } finally {
            setIsLoading(false);
        }
    }, [cometBftRpcApi]);

    useEffect(() => {
        checkHealth();
    }, [checkHealth]);

    return (
        <div className="p-4 text-center">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">RPC Health Check</h2>
            {isLoading ? (
                <Loader message="Checking health status..." />
            ) : isHealthy === true ? (
                <div className="bg-green-900 border-l-4 border-green-500 text-green-200 p-6 rounded-xl shadow-lg">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-3xl font-bold">STATUS: HEALTHY</p>
                    <p className="mt-2 text-lg">The RPC node is responding successfully</p>
                </div>
            ) : (
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-6 rounded-xl shadow-lg">
                    <XCircle className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-3xl font-bold">STATUS: FAILED</p>
                    <p className="mt-2 text-lg">Failed to get a healthy response from the RPC node</p>
                </div>
            )}
            <button
                onClick={checkHealth}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center mx-auto"
            >
                <RefreshCcw className="w-5 h-5 mr-2" /> Re-check Health
            </button>
        </div>
    );
};

const MempoolView = ({ cometBftRpcApi, cosmosSdkApi }) => {
    const [mempool, setMempool] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMempool = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${cometBftRpcApi}/unconfirmed_txs?limit=50`;
                const data = await fetchWithRetry(url);
                setMempool(data.result);
            } catch (error) {
                console.error('Failed to load mempool:', error);
                setError(error.message);
                setMempool(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMempool();
    }, [cometBftRpcApi]);

    if (isLoading) return <Loader message="Loading mempool..." />;
    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Mempool</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    const txs = mempool?.txs || [];

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Mempool (Unconfirmed Transactions)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Total Transactions" value={mempool?.n_txs || '0'} icon={Zap} />
                <Card title="Total Bytes" value={(mempool?.total_bytes || 0).toLocaleString('en-US')} icon={Database} />
                <Card title="Max Tx Bytes" value={(mempool?.max_txs_bytes || 0).toLocaleString('en-US')} icon={Minus} />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                <h3 className="text-xl font-bold text-gray-200">Unconfirmed Transactions ({txs.length} shown)</h3>
                {txs.length > 0 ? (
                    <div className="space-y-3">
                        {txs.map((txBase64, index) => (
                            <div key={index} className="bg-gray-700 p-3 rounded-lg text-sm font-mono break-all text-gray-300">
                                {decodeBase64(txBase64).substring(0, 100)}...
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">The mempool is currently empty</p>
                )}
            </div>
        </div>
    );
};

const ConsensusStateView = ({ cometBftRpcApi, cosmosSdkApi }) => {
    const [consensusState, setConsensusState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchState = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${cometBftRpcApi}/consensus_state`;
                const data = await fetchWithRetry(url);
                setConsensusState(data.result);
            } catch (err) {
                console.error('Failed to load consensus status:', err);
                setError(err.message);
                setConsensusState(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchState();
    }, [cometBftRpcApi]);

    if (isLoading) return <Loader message="Loading consensus state..." />;

    if (error) return (
        <div className="p-4 text-center">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Consensus State</h2>
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-6 rounded-xl shadow-lg">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
                <p className="text-xl font-bold">DATA UNAVAILABLE</p>
                <p className="mt-2 text-lg">Error: {error}</p>
                <p className="mt-4 text-sm text-gray-300">This endpoint might be disabled for security reasons</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Consensus State</h2>

            {consensusState?.round_state && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                    <h3 className="text-xl font-bold text-indigo-400">Round State</h3>
                    <DetailRow label="Height" value={consensusState.round_state.height || 'N/A'} />
                    <DetailRow label="Round" value={consensusState.round_state.round || 'N/A'} />
                    <DetailRow label="Step" value={consensusState.round_state.step || 'N/A'} />
                    <DetailRow label="Proposal Block Hash" value={consensusState.round_state.proposal_block_hash || 'N/A'} isCode={true} />
                    <DetailRow label="Locked Block Hash" value={consensusState.round_state.locked_block_hash || 'N/A'} isCode={true} />
                    <DetailRow label="Valid Block Hash" value={consensusState.round_state.valid_block_hash || 'N/A'} isCode={true} />
                </div>
            )}

            {consensusState?.peers && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                    <h3 className="text-xl font-bold text-indigo-400">Peers ({Object.keys(consensusState.peers).length})</h3>
                    {Object.entries(consensusState.peers).map(([peerId, peerData]) => (
                        <div key={peerId} className="border-b border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                            <DetailRow label="Peer ID" value={peerId.substring(0, 20) + '...'} isCode={true} />
                            <DetailRow label="Node Info" value={peerData.node_info?.moniker || 'N/A'} />
                            <DetailRow label="Round State" value={`Round: ${peerData.round_state?.round || 'N/A'}, Step: ${peerData.round_state?.step || 'N/A'}`} />
                        </div>
                    ))}
                </div>
            )}

            {consensusState && <JsonViewer data={consensusState} title="Full Consensus State" />}
        </div>
    );
};

const BroadcastTxView = ({ setModal, cometBftRpcApi, cosmosSdkApi }) => {
    useEffect(() => {
        setModal({
            title: "Transaction Broadcast Not Available",
            message: "To broadcast a transaction, you need signed, Base64-encoded transaction data. This feature requires wallet/key integration and is not implemented in this explorer."
        });
    }, [setModal]);

    return (
        <div className="p-4 text-center">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">Broadcast Transaction</h2>
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-6 rounded-xl shadow-lg">
                <Share2 className="w-10 h-10 mx-auto mb-3" />
                <p className="text-xl font-bold">Action: Send Transaction</p>
                <p className="mt-2 text-lg">This is the endpoint for submitting on-chain transactions</p>
                <p className="mt-4 text-sm text-gray-300">Please use a real Wallet/Client to submit transactions. This application is an explorer only.</p>
            </div>
        </div>
    );
};

const useAbciInfo = (cometBftRpcApi) => {
    const [abciInfo, setAbciInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInfo = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = `${cometBftRpcApi}/abci_info`;
            const data = await fetchWithRetry(url, 1);
            setAbciInfo(data.result?.response);
        } catch (error) {
            console.error('Failed to load ABCI info:', error);
            setAbciInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [cometBftRpcApi]);

    useEffect(() => {
        fetchInfo();
        const interval = setInterval(fetchInfo, 60000);
        return () => clearInterval(interval);
    }, [fetchInfo]);

    return { abciInfo, isAbciLoading: isLoading };
}

const ValidatorsList = ({ navigate, setModal, cometBftRpcApi, cosmosSdkApi }) => {
    const [validators, setValidators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);

    const [summaryData, setSummaryData] = useState({
        totalVotingPower: "0",
        totalValidators: 0,
        avgCommission: "0.00%",
        weightedCommission: "0.00%",
        uptime: "99.8%"
    });

    const calculateCommissions = (validators) => {
        if (validators.length === 0) {
            return { avgCommission: 0, weightedCommission: 0 };
        }

        let totalCommission = 0;
        let totalWeightedCommission = 0;
        let totalTokens = 0n;

        validators.forEach(validator => {
            totalTokens += BigInt(validator.rawTokensString || '0');
        });

        validators.forEach(validator => {
            const commission = validator.commission;
            const tokens = BigInt(validator.rawTokensString || '0');

            totalCommission += commission;

            if (totalTokens > 0) {
                const weight = Number(tokens) / Number(totalTokens);
                totalWeightedCommission += commission * weight;
            }
        });

        const avgCommission = (totalCommission / validators.length) * 100;
        const weightedCommission = totalWeightedCommission * 100;

        return {
            avgCommission: avgCommission.toFixed(2),
            weightedCommission: weightedCommission.toFixed(2)
        };
    };

    const fetchValidators = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const validatorsListUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200`;
            const listData = await fetchWithRetry(validatorsListUrl);

            const validatorsToProcess = listData?.validators || [];

            if (validatorsToProcess.length === 0) {
                setValidators([]);
                setIsLoading(false);
                return;
            }

            const detailedValidators = validatorsToProcess.map(v => ({
                moniker: v.description?.moniker || 'Unnamed Validator',
                commission: parseFloat(v.commission?.commission_rates?.rate) || 0,
                votingPower: convertRawVotingPower(v.tokens, 18),
                rawTokensString: v.tokens,
                address: v.operator_address,
                jailed: v.jailed || false,
                uptime: "99%"
            }));

            detailedValidators.sort((a, b) => {
                const aTokens = BigInt(a.rawTokensString || '0');
                const bTokens = BigInt(b.rawTokensString || '0');
                return bTokens > aTokens ? 1 : -1;
            });

            const totalVotingPower = validatorsToProcess.reduce((sum, v) => {
                return sum + BigInt(v.tokens || '0');
            }, 0n);

            const commissionData = calculateCommissions(detailedValidators);

            setValidators(detailedValidators);
            setSummaryData({
                totalVotingPower: convertRawVotingPower(totalVotingPower.toString(), 18),
                totalValidators: detailedValidators.length,
                avgCommission: `${commissionData.avgCommission}%`,
                weightedCommission: `${commissionData.weightedCommission}%`,
                uptime: "99.8%"
            });

        } catch (err) {
            console.error('Failed to fetch validators:', err);
            setError(err.message);
            setValidators([]);
        } finally {
            setIsLoading(false);
        }
    }, [cosmosSdkApi]);

    useEffect(() => {
        fetchValidators();
    }, [fetchValidators]);

    const indexOfLastValidator = currentPage * itemsPerPage;
    const indexOfFirstValidator = indexOfLastValidator - itemsPerPage;
    const currentValidators = validators.slice(indexOfFirstValidator, indexOfLastValidator);
    const totalPages = Math.ceil(validators.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleDelegate = (validator) => {
        setModal({
            title: 'Delegate Action',
            message: `You are about to delegate to ${validator.moniker} (Commission: ${(validator.commission * 100).toFixed(2)}%). This is a placeholder - actual delegation requires wallet integration.`,
        });
    };

    if (isLoading) return <Loader message="Loading validators..." />;

    if (error || validators.length === 0) {
        return (
            <div className="p-4 text-center">
                <p className="text-2xl text-red-400 font-bold mb-4">Failed to Load Validators</p>
                <p className="text-lg text-gray-400">{error || "No active validators found"}</p>
                <button
                    onClick={fetchValidators}
                    className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-400">Active Validator Set</h2>
                <button
                    onClick={fetchValidators}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
                >
                    <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg border border-indigo-700">
                    <div className="text-sm text-gray-400 mb-1">Total Voting Power</div>
                    <div className="text-xl font-bold text-white">{summaryData.totalVotingPower} WARD</div>
                    <div className="text-sm text-indigo-400 mt-1">From {summaryData.totalValidators} Active Validators</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-indigo-700">
                    <div className="text-sm text-gray-400 mb-1">Commission Rates</div>
                    <div className="text-lg font-bold text-white">Avg: {summaryData.avgCommission}</div>
                    <div className="text-sm text-gray-400 mt-1">Weighted: {summaryData.weightedCommission}</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-indigo-700">
                    <div className="text-sm text-gray-400 mb-1">Network Uptime</div>
                    <div className="text-2xl font-bold text-green-400">{summaryData.uptime}</div>
                    <div className="text-sm text-gray-400 mt-1">Overall Network Performance</div>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-300">
                    There are {validators.length} Bonded Validators
                </h3>
            </div>

            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-400">
                    Showing {indexOfFirstValidator + 1}-{Math.min(indexOfLastValidator, validators.length)} of {validators.length} validators
                </p>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Next
                    </button>
                </div>
            </div>

            <div className="hidden md:block bg-gray-800 shadow-lg rounded-xl overflow-hidden mb-8 border border-indigo-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Validator</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Voting Power (WARD)</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Commission</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Uptime</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {currentValidators.map((validator, index) => (
                                <tr key={validator.address} className="hover:bg-gray-700 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.address })}
                                        >
                                            <div className="text-sm font-bold text-white hover:text-indigo-300 transition duration-200">
                                                {validator.moniker}
                                            </div>
                                            <div className="text-xs text-gray-400">Rank #{indexOfFirstValidator + index + 1}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-300 font-mono">{validator.votingPower}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-300">{(validator.commission * 100).toFixed(2)}%</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-green-400">{validator.uptime}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelegate(validator);
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
                                        >
                                            Delegate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="md:hidden space-y-4">
                {currentValidators.map((validator, index) => (
                    <div
                        key={validator.address}
                        className="bg-gray-800 shadow-lg rounded-xl p-5 border-t-4 border-indigo-500 border border-indigo-700 cursor-pointer"
                        onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.address })}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="text-xs text-gray-400 mb-1">Rank #{indexOfFirstValidator + index + 1}</div>
                                <h2 className="text-xl font-bold text-indigo-400 hover:text-indigo-300 transition duration-200">
                                    {validator.moniker}
                                </h2>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-medium text-gray-200 bg-gray-700 px-3 py-1 rounded-full mb-1">
                                    {(validator.commission * 100).toFixed(2)}%
                                </div>
                                <div className="text-sm text-green-400">{validator.uptime}</div>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-300 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Voting Power:</span>
                                <span className="font-mono">{validator.votingPower} WARD</span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelegate(validator);
                            }}
                            className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
                        >
                            Delegate
                        </button>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Previous
                    </button>
                    <span className="text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ status, navigate, setModal, cometBftRpcApi, cosmosSdkApi }) => {
    const { abciInfo, isAbciLoading } = useAbciInfo(cometBftRpcApi);

    const latestBlock = status?.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height) : 'N/A';
    const networkName = status?.node_info?.network || 'Warden Protocol';
    const catchingUp = status?.sync_info?.catching_up;

    return (
        <div className="space-y-8 p-4">
            <h2 className="text-2xl font-bold text-white mb-6">Network Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    title="Latest Block"
                    value={latestBlock !== 'N/A' ? latestBlock.toLocaleString('en-US') : 'N/A'}
                    icon={List}
                    onClick={latestBlock !== 'N/A' ? () => navigate(ROUTES.BLOCKS_DETAIL, { height: latestBlock }) : null}
                />
                <Card
                    title="Network ID"
                    value={networkName}
                    icon={Wifi}
                />
                <Card
                    title="Node Version"
                    value={status?.node_info?.version || 'N/A'}
                    icon={Code}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    title="App Block Height"
                    value={isAbciLoading ? '...' : (abciInfo?.last_block_height ? parseInt(abciInfo.last_block_height).toLocaleString('en-US') : 'N/A')}
                    icon={Database}
                />
                <Card
                    title="App Version"
                    value={isAbciLoading ? '...' : (abciInfo?.version || 'N/A')}
                    icon={Settings}
                />
                <Card
                    title="Catching Up"
                    value={catchingUp ? 'Yes' : 'No'}
                    icon={Clock}
                    className={catchingUp ? 'bg-yellow-900 border-yellow-700' : 'bg-green-900 border-green-700'}
                />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                <h2 className="text-xl font-bold text-indigo-400 border-b border-gray-700 pb-2">Node Status Details</h2>
                <DetailRow label="Latest Block Hash" value={status?.sync_info?.latest_block_hash || 'N/A'} isCode={true} />
                <DetailRow label="Block Time" value={status?.sync_info?.latest_block_time || 'N/A'} />
                <DetailRow label="Validator Address" value={status?.validator_info?.address || 'N/A'} isCode={true} />
                <DetailRow label="Voting Power" value={status?.validator_info?.voting_power || 'N/A'} />
            </div>
        </div>
    );
};

const BlocksDetail = ({ navigate, currentParams, cometBftRpcApi, cosmosSdkApi }) => {
    const [blockData, setBlockData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const height = currentParams.height;

    useEffect(() => {
        const fetchBlock = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const url = `${cometBftRpcApi}/block?height=${height}`;
                const data = await fetchWithRetry(url);
                setBlockData(data.result?.block);
            } catch (error) {
                console.error('Failed to load block details:', error);
                setError(error.message);
                setBlockData(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlock();
    }, [height, cometBftRpcApi]);

    if (isLoading) return <Loader message={`Loading block details for #${height}...`} />;
    if (error) return (
        <div className="p-4">
            <button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition duration-200 mb-4"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
            </button>
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Block</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    const txs = blockData?.data?.txs || [];

    return (
        <div className="p-4 space-y-6">
            <button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition duration-200"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
            </button>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                <h2 className="text-2xl font-bold text-indigo-400">Block #{height}</h2>
                <DetailRow label="Time" value={blockData.header?.time || 'N/A'} />
                <DetailRow label="Block Hash" value={blockData.header?.last_block_id?.hash || 'N/A'} isCode={true} />
                <DetailRow label="Proposer" value={blockData.header?.proposer_address || 'N/A'} isCode={true} />
                <DetailRow label="Transaction Count" value={txs.length} />

                <button
                    onClick={() => navigate(ROUTES.BLOCK_RESULTS, { height: height })}
                    className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 flex items-center"
                >
                    <MessageSquare className="w-5 h-5 mr-2" /> View Block Results
                </button>

                <h3 className="text-xl font-semibold text-gray-200 pt-4 border-t border-gray-700 mt-4">Transactions ({txs.length})</h3>
                <div className="space-y-2">
                    {txs.length > 0 ? (
                        txs.map((txBase64, index) => {
                            const txDisplay = decodeBase64(txBase64);
                            return (
                                <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                    <span className="text-sm font-mono truncate max-w-[calc(100%-80px)] text-gray-200">{txDisplay.substring(0, 40)}...</span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-400">No transactions in this block</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TransactionsList = ({ navigate, cometBftRpcApi, cosmosSdkApi }) => {
    const [txs, setTxs] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(() => {
        return Number(localStorage.getItem("txsRefreshInterval")) || 10000;
    });

    const fetchTxs = useCallback(async (showLoader = true) => {
        if (showLoader) setInitialLoading(true);
        setError(null);
        try {
            const url = `${cometBftRpcApi}/tx_search?query="tx.height > 0"&per_page=20&page=1&order_by="desc"`;
            const data = await fetchWithRetry(url);
            const formattedTxs = (data.result?.txs || []).map(tx => ({
                hash: tx.hash,
                height: tx.height,
                gasUsed: tx.tx_result?.gas_used,
                code: tx.tx_result?.code,
            }));
            setTxs(formattedTxs);
        } catch (err) {
            setError(err.message);
            setTxs([]);
        } finally {
            if (showLoader) setInitialLoading(false);
        }
    }, [cometBftRpcApi]);

    useEffect(() => { fetchTxs(true); }, [fetchTxs]);

    useEffect(() => {
        localStorage.setItem("txsRefreshInterval", refreshInterval);
    }, [refreshInterval]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(async () => {
                setIsAutoRefreshing(true);
                await fetchTxs(false);
                setIsAutoRefreshing(false);
            }, refreshInterval);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchTxs]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-400">Latest Transactions</h2>
                <div className="flex items-center space-x-3">
                    <button onClick={() => fetchTxs(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center">
                        <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                        <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} className="form-checkbox h-4 w-4 text-indigo-600" />
                        <span>Auto Refresh</span>
                        {isAutoRefreshing && (
                            <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </label>
                    {autoRefresh && (
                        <select
                            value={refreshInterval}
                            onChange={(e) => setRefreshInterval(Number(e.target.value))}
                            className="px-2 py-1 bg-gray-700 text-white text-sm rounded-lg"
                        >
                            <option value={5000}>5s</option>
                            <option value={10000}>10s</option>
                            <option value={30000}>30s</option>
                        </select>
                    )}
                </div>
            </div>

            {initialLoading ? (
                <Loader message="Loading latest transactions..." />
            ) : error ? (
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">{error}</div>
            ) : txs.length === 0 ? (
                <p className="text-center text-gray-400">No transactions found</p>
            ) : (
                <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-indigo-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Hash</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Block</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Gas Used</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {txs.map(tx => (
                                    <tr key={tx.hash} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm font-mono text-indigo-400 cursor-pointer" onClick={() => navigate(ROUTES.TX_DETAIL, { hash: tx.hash })}>{tx.hash.substring(0, 10)}...</td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{tx.height}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.code === 0 ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>
                                                {tx.code === 0 ? 'Success' : `Failed (${tx.code || 'N/A'})`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">{tx.gasUsed?.toLocaleString() || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const TransactionDetail = ({ currentParams, cometBftRpcApi, cosmosSdkApi }) => {
    const [txData, setTxData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const txHash = currentParams.hash;
    const [rawFormat, setRawFormat] = useState("base64");

    useEffect(() => {
        const fetchTx = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const hashCaps = txHash.toUpperCase();
                const url = `${cometBftRpcApi}/tx?hash=0x${hashCaps}`;
                const data = await fetchWithRetry(url);
                setTxData(data.result);
            } catch (error) {
                console.error('Failed to load transaction details:', error);
                setError(error.message);
                setTxData(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTx();
    }, [txHash, cometBftRpcApi]);

    if (isLoading) return <Loader message={`Loading transaction details...`} />;
    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Transaction</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    const txResult = txData?.tx_result || {};

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Transaction Detail</h2>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                <h3 className="text-xl font-semibold text-gray-200">Summary</h3>
                <DetailRow label="Transaction Hash" value={txData?.hash || 'N/A'} isCode={true} />
                <DetailRow label="Block Height" value={txData?.height || 'N/A'} />
                <DetailRow
                    label="Status"
                    value={txResult.code === 0 ? 'Success' : `Failed (Code ${txResult.code})`}
                />
                <DetailRow label="Gas Used" value={txResult.gas_used?.toLocaleString('en-US') || 'N/A'} />
                <DetailRow label="Gas Wanted" value={txResult.gas_wanted?.toLocaleString('en-US') || 'N/A'} />

                <h3 className="text-xl font-semibold text-gray-200 pt-4 border-t border-gray-700 mt-4">Raw Data</h3>

                <div className="flex items-center space-x-4 mb-2">
                    <label className="text-sm font-medium text-gray-300">View as:</label>
                    <select
                        value={rawFormat}
                        onChange={(e) => setRawFormat(e.target.value)}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                        <option value="base64">Base64</option>
                        <option value="hex">Hex</option>
                    </select>
                </div>

                <textarea
                    readOnly
                    value={
                        rawFormat === "hex"
                            ? (() => {
                                try {
                                    const bytes = atob(txData?.tx || "");
                                    return Array.from(bytes).map(b =>
                                        b.charCodeAt(0).toString(16).padStart(2, "0")
                                    ).join("");
                                } catch {
                                    return "Failed to decode Base64 → Hex";
                                }
                            })()
                            : txData?.tx || "N/A"
                    }
                    className="w-full p-3 bg-gray-900 text-gray-200 font-mono text-sm rounded-lg border border-gray-700 resize-none"
                    style={{ height: "200px" }}
                />

            </div>
        </div>
    );
};

const AddressDetail = ({ currentParams, setModal, cometBftRpcApi, cosmosSdkApi }) => {
    const [addressData, setAddressData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const address = currentParams.address;

    useEffect(() => {
        const fetchAddressData = async () => {
            if (!address) {
                setModal({
                    title: "Address Required",
                    message: "Please provide an address to view details."
                });
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const accountUrl = `${cosmosSdkApi}/cosmos/auth/v1beta1/accounts/${address}`;
                const accountData = await fetchWithRetry(accountUrl);

                const balanceUrl = `${cosmosSdkApi}/cosmos/bank/v1beta1/balances/${address}`;
                const balanceData = await fetchWithRetry(balanceUrl);

                setAddressData({
                    account: accountData,
                    balance: balanceData
                });
            } catch (error) {
                console.error('Failed to load address details:', error);
                setError(error.message);
                setAddressData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAddressData();
    }, [address, setModal, cosmosSdkApi]);

    if (isLoading) return <Loader message={`Loading address details...`} />;
    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Address Details</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Address Detail</h2>

            {addressData && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 border border-indigo-700">
                    <h3 className="text-xl font-semibold text-gray-200">Account Information</h3>
                    <DetailRow label="Address" value={address} isCode={true} />
                    <DetailRow label="Account Number" value={addressData.account?.account?.account_number || 'N/A'} />
                    <DetailRow label="Sequence" value={addressData.account?.account?.sequence || 'N/A'} />

                    <h3 className="text-xl font-semibold text-gray-200 pt-4 border-t border-gray-700 mt-4">Balances</h3>
                    {addressData.balance?.balances && addressData.balance.balances.length > 0 ? (
                        addressData.balance.balances.map((balance, index) => (
                            <DetailRow
                                key={index}
                                label={balance.denom}
                                value={convertRawVotingPower(balance.amount, 6)}
                            />
                        ))
                    ) : (
                        <p className="text-gray-400">No balances found</p>
                    )}
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [currentRoute, setCurrentRoute] = useState(ROUTES.DASHBOARD);
    const [currentParams, setCurrentParams] = useState({});
    const [status, setStatus] = useState(null);
    const [isRpcConnected, setIsRpcConnected] = useState(true);
    const [modal, setModalState] = useState({ isOpen: false, title: '', message: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    
    const { isDark, toggleTheme } = useTheme();
    const { selectedConfig, setRpcConfig } = useRpcConfig();

    const navigate = useCallback((route, params = {}) => {
        setCurrentRoute(route);
        setCurrentParams(params);
        setIsMobileMenuOpen(false);
    }, []);

    const setModal = useCallback(({ title, message }) => {
        setModalState({ isOpen: true, title, message });
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const url = `${selectedConfig.COMETBFT_RPC_API}/status`;
            const data = await fetchWithRetry(url, 1);
            setStatus(data.result);
            setIsRpcConnected(true);
        } catch (error) {
            console.error('Failed to connect to RPC:', error);
            setIsRpcConnected(false);
            setStatus(null);
        }
    }, [selectedConfig]);

    const handleGlobalSearch = async () => {
        if (!searchQuery.trim()) {
            setModal({ title: "Search Error", message: "Please enter a search query" });
            return;
        }

        const query = searchQuery.trim();
        const detectedType = (query) => {
            if (/^\d+$/.test(query)) return 'height';
            if (/^[0-9a-fA-F]{64}$/.test(query)) return 'tx';
            if (/^(warden)[a-zA-Z0-9]{39}$/.test(query)) return 'address';
            return 'unknown';
        };

        const type = detectedType(query);

        try {
            if (type === 'height') {
                navigate(ROUTES.BLOCKS_DETAIL, { height: query });
            } else if (type === 'tx') {
                navigate(ROUTES.TX_DETAIL, { hash: query });
            } else if (type === 'address') {
                navigate(ROUTES.ADDRESS_DETAIL, { address: query });
            } else {
                navigate(ROUTES.SEARCH, { query });
            }
            setSearchQuery('');
        } catch (err) {
            console.error("Search navigation error:", err);
            navigate(ROUTES.SEARCH, { query });
            setSearchQuery('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGlobalSearch();
        }
    };

    const handleRpcChange = (config) => {
        setRpcConfig(config);
        setIsRpcDropdownOpen(false);
        setStatus(null);
        fetchStatus();
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const renderContent = useMemo(() => {
        const getBlockHeight = () => status?.sync_info?.latest_block_height ? parseInt(status.sync_info.latest_block_height) : null;
        const height = currentParams.height || getBlockHeight();

        const apiProps = {
            cometBftRpcApi: selectedConfig.COMETBFT_RPC_API,
            cosmosSdkApi: selectedConfig.COSMOS_SDK_API
        };

        switch (currentRoute) {
            case ROUTES.NET_INFO:
                return <NetworkInfo {...apiProps} />;
            case ROUTES.HEALTH:
                return <HealthView {...apiProps} />;
            case ROUTES.MEMPOOL:
                return <MempoolView {...apiProps} />;
            case ROUTES.CONSENSUS_STATE:
                return <ConsensusStateView {...apiProps} />;
            case ROUTES.BROADCAST_TX:
                return <BroadcastTxView setModal={setModal} {...apiProps} />;
            case ROUTES.BLOCKS_LIST:
                return <BlocksList navigate={navigate} {...apiProps} />;
            case ROUTES.BLOCKS_DETAIL:
                return <BlocksDetail navigate={navigate} currentParams={{ ...currentParams, height: height }} {...apiProps} />;
            case ROUTES.BLOCK_RESULTS:
                return <BlockResultsView currentParams={{ ...currentParams, height: height }} status={status} {...apiProps} />;
            case ROUTES.TXS:
                return <TransactionsList navigate={navigate} {...apiProps} />;
            case ROUTES.TX_DETAIL:
                return <TransactionDetail currentParams={currentParams} {...apiProps} />;
            case ROUTES.VALIDATORS:
                return <ValidatorsList navigate={navigate} setModal={setModal} {...apiProps} />;
            case ROUTES.VALIDATOR_DETAIL:
                return <ValidatorDetail currentParams={currentParams} navigate={navigate} {...apiProps} />;
            case ROUTES.ADDRESS_DETAIL:
                return <AddressDetail currentParams={currentParams} setModal={setModal} {...apiProps} />;
            case ROUTES.SEARCH:
                return <SearchView navigate={navigate} setModal={setModal} {...apiProps} />;
            case ROUTES.PROPOSALS:
                return <ProposalsView {...apiProps} />;
            case ROUTES.DASHBOARD:
            default:
                return <Dashboard status={status} navigate={navigate} setModal={setModal} {...apiProps} />;
        }
    }, [currentRoute, currentParams, navigate, status, setModal, selectedConfig]);

    const menuGroups = useMemo(() => [
        {
            title: 'Main',
            items: [
                { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
            ]
        },
        {
            title: 'Blocks & Transactions',
            items: [
                { label: 'Blocks', route: ROUTES.BLOCKS_LIST, icon: List },
                { label: 'Transactions', route: ROUTES.TXS, icon: Zap },
                { label: 'Mempool', route: ROUTES.MEMPOOL, icon: Cloud },
            ]
        },
        {
            title: 'Network & Governance',
            items: [
                { label: 'Validators', route: ROUTES.VALIDATORS, icon: Users },
                { label: 'Proposals', route: ROUTES.PROPOSALS, icon: MessageSquare },
                { label: 'Network Info', route: ROUTES.NET_INFO, icon: Wifi },
                { label: 'Health Check', route: ROUTES.HEALTH, icon: CheckCircle },
            ]
        }
    ], []);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-indigo-600">
                        <h3 className="text-xl font-bold text-indigo-400 mb-3">{modal.title}</h3>
                        <p className="text-gray-200 mb-5 whitespace-pre-wrap">{modal.message}</p>
                        <div className="text-right">
                            <button
                                onClick={() => setModalState({ isOpen: false, title: '', message: '' })}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-gray-800 shadow-xl sticky top-0 z-10 border-b border-indigo-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="flex items-center justify-between w-full md:w-auto">
                            <h1 className="text-2xl font-extrabold text-indigo-400">Warden Explorer</h1>
                            
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 max-w-2xl mx-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search by Height / Transaction Hash / Account Address"
                                    className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <button
                                    onClick={handleGlobalSearch}
                                    className="absolute right-2 top-1.5 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 text-sm"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <button
                                    onClick={() => setIsRpcDropdownOpen(!isRpcDropdownOpen)}
                                    className="flex items-center space-x-2 p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition duration-200"
                                >
                                    <div className={`w-3 h-3 rounded-full ${isRpcConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm font-medium hidden sm:inline">{selectedConfig.label}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isRpcDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-indigo-700 rounded-lg shadow-xl z-50">
                                        <div className="p-2 space-y-1">
                                            {RPC_CONFIGS.map((config, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleRpcChange(config)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 ${
                                                        selectedConfig.label === config.label
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'text-gray-300 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <div className="font-medium">{config.label}</div>
                                                    <div className="text-xs text-gray-400 truncate">
                                                        RPC: {config.COMETBFT_RPC_API}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition duration-200"
                                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={fetchStatus}
                                className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition duration-200"
                                title="Refresh Status"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <nav className="hidden md:block border-t border-gray-700 overflow-x-auto">
                    <div className="flex space-x-2 sm:space-x-4 py-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {menuGroups.flatMap(group =>
                            group.items.map(({ label, route, icon: Icon }) => (
                                <button
                                    key={route}
                                    onClick={() => navigate(route)}
                                    className={`flex items-center flex-shrink-0 px-3 py-2 rounded-lg font-medium text-sm transition duration-200 ${currentRoute === route ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
                                >
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                    <span>{label}</span>
                                </button>
                            )))}
                    </div>
                </nav>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-gray-800 border-t border-gray-700">
                        <div className="px-4 py-2 space-y-1">
                            {menuGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {group.title}
                                    </div>
                                    {group.items.map(({ label, route, icon: Icon }) => (
                                        <button
                                            key={route}
                                            onClick={() => navigate(route)}
                                            className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition duration-200 ${currentRoute === route ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                        >
                                            <Icon className="w-5 h-5 mr-3" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent}
            </main>

            <footer className="mt-12 pt-6 border-t border-gray-700 text-center text-sm text-gray-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                <p>Real-time data from CometBFT RPC and Cosmos SDK API for Warden Protocol</p>
                <p className="mt-1">Current RPC: {selectedConfig.label}</p>
            </footer>
        </div>
    );
};

export default App;