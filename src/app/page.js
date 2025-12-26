"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RefreshCcw, Wifi, Zap, 
  Table, Badge, Clock, TrendingUp, DollarSign, 
  List, Search, Users, LayoutDashboard, ChevronLeft, 
  HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, 
  Code, Minus, MessageSquare, Database, Share2, AlertTriangle,
  Eye, Hash, Calendar, BarChart3, Network, FileText, 
  GitBranch, User, Key, Wallet, Activity, Filter,
  EyeOff, EyeIcon, ExternalLink, Copy, Download,
  Upload, Play, Pause, RotateCcw, Info
} from 'lucide-react';
import { bech32 } from 'bech32';
import { Buffer } from 'buffer';

// Utility functions
const convertBech32Address = (address, targetPrefix) => {
  if (!address) return 'N/A';
  try {
    const decoded = bech32.decode(address);
    return bech32.encode(targetPrefix, decoded.words);
  } catch (error) {
    console.error('Bech32 conversion error:', error);
    if (address.startsWith('wardenvaloper') && targetPrefix === 'warden') {
      return address.replace('valoper', '');
    }
    if (address.startsWith('wardenvaloper') && targetPrefix === 'wardenvalcons') {
      return address.replace('valoper', 'valcons');
    }
    return 'N/A';
  }
};

const convertToConsensusAddress = (operatorAddress) => {
  if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
    return null;
  }
  try {
    const words = bech32.decode(operatorAddress).words;
    return bech32.encode('wardenvalcons', words);
  } catch (error) {
    console.error('Error converting to consensus address:', error);
    return null;
  }
};

const getHexFromConsensusAddress = (consensusAddress) => {
  if (!consensusAddress || !consensusAddress.startsWith('wardenvalcons')) {
    return null;
  }
  try {
    const decoded = bech32.decode(consensusAddress);
    const bytes = bech32.fromWords(decoded.words);
    return Buffer.from(bytes).toString('hex').toUpperCase();
  } catch (error) {
    console.error('Error converting consensus to hex:', error);
    return null;
  }
};

const getHexAddressFromOperator = (operatorAddress) => {
  if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
    return 'N/A';
  }
  try {
    const decoded = bech32.decode(operatorAddress);
    const bytes = bech32.fromWords(decoded.words);
    return Buffer.from(bytes).toString('hex').toUpperCase();
  } catch (error) {
    console.error('Hex conversion error:', error);
    return 'N/A';
  }
};

const convertOperatorToAccountAddress = (operatorAddress) => {
  return convertBech32Address(operatorAddress, 'warden');
};

const getConsensusAddress = (operatorAddress) => {
  return convertBech32Address(operatorAddress, 'wardenvalcons');
};

const getHexAddress = (operatorAddress) => {
  return getHexAddressFromOperator(operatorAddress);
};

// RPC Configuration
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
  {
    "label": "Warden Testnet",
    "COMETBFT_RPC_API": "https://warden-testnet-rpc.polkachu.com",
    "COSMOS_SDK_API": "https://warden-testnet-api.polkachu.com"
  }
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

// Routing system
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
  PARAMETERS: 'PARAMETERS',
  UPTIME: 'UPTIME',
  STAKING: 'STAKING',
  GOVERNANCE: 'GOVERNANCE',
  ACCOUNTS: 'ACCOUNTS',
  NODES: 'NODES',
  TOKENS: 'TOKENS',
  FEES: 'FEES',
  EVENTS: 'EVENTS'
};

const useRouter = () => {
  const [currentRoute, setCurrentRoute] = useState(ROUTES.DASHBOARD);
  const [currentParams, setCurrentParams] = useState({});
  const [isReady, setIsReady] = useState(false);

  const navigate = useCallback((route, params = {}) => {
    let path = '/';

    switch (route) {
      case ROUTES.DASHBOARD: path = '/'; break;
      case ROUTES.BLOCKS_LIST: path = '/blocks'; break;
      case ROUTES.BLOCKS_DETAIL: path = `/block/${params.height}`; break;
      case ROUTES.BLOCK_RESULTS: path = `/block/${params.height}/results`; break;
      case ROUTES.TXS: path = '/transactions'; break;
      case ROUTES.TX_DETAIL: path = `/tx/${params.hash}`; break;
      case ROUTES.VALIDATORS: path = '/validators'; break;
      case ROUTES.VALIDATOR_DETAIL: path = `/validator/${params.address}`; break;
      case ROUTES.ADDRESS_DETAIL: path = `/address/${params.address}`; break;
      case ROUTES.PROPOSALS: path = '/proposals'; break;
      case ROUTES.MEMPOOL: path = '/mempool'; break;
      case ROUTES.NET_INFO: path = '/network'; break;
      case ROUTES.HEALTH: path = '/health'; break;
      case ROUTES.SEARCH: path = '/search'; break;
      case ROUTES.PARAMETERS: path = '/parameters'; break;
      case ROUTES.UPTIME: path = '/uptime'; break;
      case ROUTES.STAKING: path = '/staking'; break;
      case ROUTES.GOVERNANCE: path = '/governance'; break;
      case ROUTES.ACCOUNTS: path = '/accounts'; break;
      case ROUTES.NODES: path = '/nodes'; break;
      case ROUTES.TOKENS: path = '/tokens'; break;
      case ROUTES.FEES: path = '/fees'; break;
      case ROUTES.EVENTS: path = '/events'; break;
      default: path = '/';
    }

    window.history.pushState({}, '', path);
    setCurrentRoute(route);
    setCurrentParams(params);
  }, []);

  const parseUrl = useCallback(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      setCurrentRoute(ROUTES.DASHBOARD);
      setCurrentParams({});
      return;
    }

    if (path === '/blocks') {
      setCurrentRoute(ROUTES.BLOCKS_LIST);
      setCurrentParams({});
      return;
    }

    const blockMatch = path.match(/^\/block\/(\d+)$/);
    if (blockMatch) {
      setCurrentRoute(ROUTES.BLOCKS_DETAIL);
      setCurrentParams({ height: blockMatch[1] });
      return;
    }

    const blockResultsMatch = path.match(/^\/block\/(\d+)\/results$/);
    if (blockResultsMatch) {
      setCurrentRoute(ROUTES.BLOCK_RESULTS);
      setCurrentParams({ height: blockResultsMatch[1] });
      return;
    }

    if (path === '/transactions') {
      setCurrentRoute(ROUTES.TXS);
      setCurrentParams({});
      return;
    }

    const txMatch = path.match(/^\/tx\/([0-9A-Fa-f]+)$/);
    if (txMatch) {
      setCurrentRoute(ROUTES.TX_DETAIL);
      setCurrentParams({ hash: txMatch[1] });
      return;
    }

    if (path === '/validators') {
      setCurrentRoute(ROUTES.VALIDATORS);
      setCurrentParams({});
      return;
    }

    const validatorMatch = path.match(/^\/validator\/(.+)$/);
    if (validatorMatch) {
      setCurrentRoute(ROUTES.VALIDATOR_DETAIL);
      setCurrentParams({ address: validatorMatch[1] });
      return;
    }

    const addressMatch = path.match(/^\/address\/(.+)$/);
    if (addressMatch) {
      setCurrentRoute(ROUTES.ADDRESS_DETAIL);
      setCurrentParams({ address: addressMatch[1] });
      return;
    }

    if (path === '/proposals') {
      setCurrentRoute(ROUTES.PROPOSALS);
      setCurrentParams({});
      return;
    }

    if (path === '/mempool') {
      setCurrentRoute(ROUTES.MEMPOOL);
      setCurrentParams({});
      return;
    }

    if (path === '/network') {
      setCurrentRoute(ROUTES.NET_INFO);
      setCurrentParams({});
      return;
    }

    if (path === '/health') {
      setCurrentRoute(ROUTES.HEALTH);
      setCurrentParams({});
      return;
    }

    if (path === '/search') {
      setCurrentRoute(ROUTES.SEARCH);
      setCurrentParams({});
      return;
    }

    if (path === '/parameters') {
      setCurrentRoute(ROUTES.PARAMETERS);
      setCurrentParams({});
      return;
    }

    if (path === '/uptime') {
      setCurrentRoute(ROUTES.UPTIME);
      setCurrentParams({});
      return;
    }

    if (path === '/staking') {
      setCurrentRoute(ROUTES.STAKING);
      setCurrentParams({});
      return;
    }

    if (path === '/governance') {
      setCurrentRoute(ROUTES.GOVERNANCE);
      setCurrentParams({});
      return;
    }

    if (path === '/accounts') {
      setCurrentRoute(ROUTES.ACCOUNTS);
      setCurrentParams({});
      return;
    }

    if (path === '/nodes') {
      setCurrentRoute(ROUTES.NODES);
      setCurrentParams({});
      return;
    }

    if (path === '/tokens') {
      setCurrentRoute(ROUTES.TOKENS);
      setCurrentParams({});
      return;
    }

    if (path === '/fees') {
      setCurrentRoute(ROUTES.FEES);
      setCurrentParams({});
      return;
    }

    if (path === '/events') {
      setCurrentRoute(ROUTES.EVENTS);
      setCurrentParams({});
      return;
    }

    setCurrentRoute(ROUTES.DASHBOARD);
    setCurrentParams({});
  }, []);

  useEffect(() => {
    parseUrl();
    setIsReady(true);
    const handlePopState = () => parseUrl();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrl]);

  return { currentRoute, currentParams, navigate, isReady };
};

// Theme hook
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

// Utility functions
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
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }
      return await response.json();
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

// UI Components
const Loader = ({ message = "Loading data..." }) => (
  <div className="flex justify-center items-center my-8 p-4">
    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg text-green-400 font-medium">{message}</p>
  </div>
);

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

const DetailRow = ({ label, value, isCode = false, copyable = false }) => {
  const copyToClipboard = () => {
    if (copyable) {
      navigator.clipboard.writeText(value).then(() => {
        console.log('Copied to clipboard:', value);
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row border-b border-gray-700 py-3">
      <div className="sm:w-1/3 text-sm font-medium text-gray-400 flex items-center">
        {label}
        {copyable && (
          <button 
            onClick={copyToClipboard}
            className="ml-2 text-gray-500 hover:text-green-400"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className={`sm:w-2/3 mt-1 sm:mt-0 text-sm break-all ${isCode ? 'font-mono text-green-300 bg-gray-700 p-2 rounded-lg' : 'text-gray-100'}`}>
        {value}
      </div>
    </div>
  );
};

const JsonViewer = ({ data, title }) => (
  <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-4 neon-border">
    <h3 className="text-xl font-bold text-green-400">{title}</h3>
    <pre className="text-sm text-gray-200 bg-gray-900 p-4 rounded-lg overflow-x-auto font-mono max-h-96">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

const SearchBar = ({ onSearch, placeholder = "Search blocks, transactions, addresses..." }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r-lg transition duration-200"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
};

// Main components
const Dashboard = ({ navigate, cometBftRpcApi, cosmosSdkApi }) => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [latestBlock, setLatestBlock] = useState(null);
  const [totalValidators, setTotalValidators] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalProposals, setTotalProposals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch network info
        const netInfo = await fetchWithRetry(`${cometBftRpcApi}/status`);
        setNetworkInfo(netInfo.result);

        // Fetch latest block
        const blockInfo = await fetchWithRetry(`${cometBftRpcApi}/block`);
        setLatestBlock(blockInfo.result.block);

        // Fetch validator count
        const validators = await fetchWithRetry(`${cometBftRpcApi}/validators`);
        setTotalValidators(validators.result.validators.length);

        // Fetch staking info
        const stakingInfo = await fetchWithRetry(`${cosmosSdkApi}/cosmos/staking/v1beta1/pool`);
        setTotalStaked(stakingInfo.pool.bonded_tokens);

        // Fetch proposals count
        const proposals = await fetchWithRetry(`${cosmosSdkApi}/cosmos/gov/v1beta1/proposals`);
        setTotalProposals(proposals.proposals.length);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [cometBftRpcApi, cosmosSdkApi]);

  if (isLoading) {
    return <Loader message="Loading dashboard data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Warden Protocol Explorer</h1>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          title="Latest Block" 
          value={latestBlock?.header?.height || 'N/A'} 
          icon={Hash}
          onClick={() => navigate(ROUTES.BLOCKS_LIST)}
        />
        <Card 
          title="Network" 
          value={networkInfo?.node_info?.network || 'N/A'} 
          icon={Globe}
        />
        <Card 
          title="Validators" 
          value={totalValidators} 
          icon={Users}
          onClick={() => navigate(ROUTES.VALIDATORS)}
        />
        <Card 
          title="Proposals" 
          value={totalProposals} 
          icon={FileText}
          onClick={() => navigate(ROUTES.PROPOSALS)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Network Status</h2>
          {networkInfo && (
            <div className="space-y-3">
              <DetailRow label="Node ID" value={networkInfo.node_info.id} isCode={true} />
              <DetailRow label="Listen Address" value={networkInfo.node_info.listen_addr} isCode={true} />
              <DetailRow label="Network" value={networkInfo.node_info.network} />
              <DetailRow label="Version" value={networkInfo.node_info.version} />
              <DetailRow label="Latest Block Height" value={networkInfo.sync_info.latest_block_height} />
              <DetailRow label="Latest Block Time" value={new Date(networkInfo.sync_info.latest_block_time).toLocaleString()} />
              <DetailRow label="Catching Up" value={networkInfo.sync_info.catching_up ? 'Yes' : 'No'} />
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Latest Block</h2>
          {latestBlock && (
            <div className="space-y-3">
              <DetailRow label="Height" value={latestBlock.header.height} isCode={true} />
              <DetailRow label="Hash" value={latestBlock.header.hash} isCode={true} />
              <DetailRow label="Time" value={new Date(latestBlock.header.time).toLocaleString()} />
              <DetailRow label="Num Transactions" value={latestBlock.data.txs?.length || 0} />
              <DetailRow label="Proposer Address" value={latestBlock.header.proposer_address} isCode={true} />
              <DetailRow label="Last Block ID" value={latestBlock.last_block_id?.hash || 'N/A'} isCode={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BlocksList = ({ navigate, cometBftRpcApi }) => {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        // Get latest block height
        const status = await fetchWithRetry(`${cometBftRpcApi}/status`);
        const latestHeight = parseInt(status.result.sync_info.latest_block_height);
        setTotalBlocks(latestHeight);

        // Calculate start and end heights for pagination
        const startHeight = Math.max(1, latestHeight - (currentPage - 1) * itemsPerPage);
        const endHeight = Math.max(1, startHeight - itemsPerPage + 1);

        // Fetch blocks in range
        const blockPromises = [];
        for (let height = startHeight; height >= endHeight; height--) {
          blockPromises.push(fetchWithRetry(`${cometBftRpcApi}/block?height=${height}`));
        }

        const blockResponses = await Promise.all(blockPromises);
        const blockData = blockResponses.map(response => response.result.block).filter(Boolean);
        setBlocks(blockData);

      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [currentPage, cometBftRpcApi]);

  const totalPages = Math.ceil(totalBlocks / itemsPerPage);

  if (isLoading) {
    return <Loader message="Loading blocks..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Blocks</h1>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg neon-border">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Height</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Txs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Proposer</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {blocks.map((block, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-750 cursor-pointer"
                onClick={() => navigate(ROUTES.BLOCKS_DETAIL, { height: block.header.height })}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">{block.header.height}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono truncate max-w-xs">{block.header.hash.substring(0, 16)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(block.header.time).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{block.data.txs?.length || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono truncate max-w-xs">{block.header.proposer_address.substring(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          Previous
        </button>
        
        <span className="text-white">
          Page {currentPage} of {totalPages} ({totalBlocks} total blocks)
        </span>
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-4 py-2 rounded-lg ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const BlocksDetail = ({ currentParams, navigate, cometBftRpcApi }) => {
  const [blockData, setBlockData] = useState(null);
  const [blockResults, setBlockResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        const height = currentParams.height;
        const [blockResponse, resultsResponse] = await Promise.all([
          fetchWithRetry(`${cometBftRpcApi}/block?height=${height}`),
          fetchWithRetry(`${cometBftRpcApi}/block_results?height=${height}`)
        ]);

        setBlockData(blockResponse.result);
        setBlockResults(resultsResponse.result);
      } catch (error) {
        console.error('Error fetching block data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentParams.height) {
      fetchBlockData();
    }
  }, [currentParams.height, cometBftRpcApi]);

  if (isLoading) {
    return <Loader message="Loading block data..." />;
  }

  if (!blockData) {
    return <div className="text-center text-white text-xl py-10">Block not found</div>;
  }

  const block = blockData.block;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(ROUTES.BLOCKS_LIST)}
          className="flex items-center text-green-400 hover:text-green-300"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Blocks
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-white">Block #{block.header.height}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Block Header</h2>
          <div className="space-y-3">
            <DetailRow label="Height" value={block.header.height} isCode={true} copyable={true} />
            <DetailRow label="Hash" value={block.header.hash} isCode={true} copyable={true} />
            <DetailRow label="Previous Block Hash" value={block.header.last_block_id?.hash || 'N/A'} isCode={true} copyable={true} />
            <DetailRow label="Time" value={new Date(block.header.time).toLocaleString()} />
            <DetailRow label="Chain ID" value={block.header.chain_id} />
            <DetailRow label="Num Transactions" value={block.data.txs?.length || 0} />
            <DetailRow label="Proposer Address" value={block.header.proposer_address} isCode={true} copyable={true} />
            <DetailRow label="Version Block" value={block.header.version.block} />
            <DetailRow label="Version App" value={block.header.version.app} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Block Results</h2>
          <div className="space-y-3">
            <DetailRow label="Height" value={blockResults.height} />
            <DetailRow label="Num Transactions" value={blockResults.txs_results?.length || 0} />
            <DetailRow label="Begin Block Events" value={blockResults.begin_block_events?.length || 0} />
            <DetailRow label="End Block Events" value={blockResults.end_block_events?.length || 0} />
            <DetailRow label="Validator Updates" value={blockResults.validator_updates?.length || 0} />
            <DetailRow label="Consensus Params Updates" value={blockResults.consensus_param_updates ? 'Yes' : 'No'} />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
        <h2 className="text-xl font-bold text-green-400 mb-4">Transactions</h2>
        {block.data.txs && block.data.txs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Index</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {block.data.txs.map((tx, index) => {
                  const txHash = btoa(String.fromCharCode(...new Uint8Array(sha256(tx))));
                  return (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-750 cursor-pointer"
                      onClick={() => navigate(ROUTES.TX_DETAIL, { hash: txHash })}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">{index}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono truncate max-w-xs">{txHash.substring(0, 16)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Success</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No transactions in this block</p>
        )}
      </div>
    </div>
  );
};

// Add a simple sha256 implementation for transaction hash calculation
const sha256 = (str) => {
  // Simple implementation for demo purposes
  // In a real application, you would use a proper cryptographic library
  return new TextEncoder().encode(str);
};

const Transactions = ({ navigate, cometBftRpcApi }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMempoolTxs = async () => {
      try {
        // Get latest block to check recent transactions
        const status = await fetchWithRetry(`${cometBftRpcApi}/status`);
        const latestHeight = parseInt(status.result.sync_info.latest_block_height);
        
        // Fetch a few recent blocks to get transactions
        const recentBlocks = [];
        for (let i = 0; i < 5; i++) {
          const height = Math.max(1, latestHeight - i);
          const block = await fetchWithRetry(`${cometBftRpcApi}/block?height=${height}`);
          if (block.result.block.data.txs && block.result.block.data.txs.length > 0) {
            block.result.block.data.txs.forEach((tx, index) => {
              recentBlocks.push({
                hash: btoa(String.fromCharCode(...new Uint8Array(sha256(tx)))),
                height: block.result.block.header.height,
                index: index,
                time: block.result.block.header.time
              });
            });
          }
        }
        
        setTransactions(recentBlocks);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMempoolTxs();
  }, [cometBftRpcApi]);

  if (isLoading) {
    return <Loader message="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Transactions</h1>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg neon-border">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Height</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {transactions.map((tx, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-750 cursor-pointer"
                onClick={() => navigate(ROUTES.TX_DETAIL, { hash: tx.hash })}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono truncate max-w-xs">{tx.hash.substring(0, 16)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{tx.height}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(tx.time).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Success</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Validators = ({ navigate, cometBftRpcApi, cosmosSdkApi }) => {
  const [validators, setValidators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchValidators = async () => {
      try {
        const validatorsResponse = await fetchWithRetry(`${cometBftRpcApi}/validators`);
        const stakingValidators = await fetchWithRetry(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
        
        // Combine data from both APIs
        const combinedValidators = validatorsResponse.result.validators.map((validator, index) => {
          const stakingValidator = stakingValidators.validators.find(v => 
            v.operator_address === convertBech32Address(validator.address, 'wardenvaloper')
          );
          
          return {
            ...validator,
            ...stakingValidator,
            voting_power: validator.voting_power,
            voting_power_percent: stakingValidator ? 
              (parseFloat(validator.voting_power) / parseFloat(stakingValidators.pagination.total)) * 100 : 0
          };
        });
        
        setValidators(combinedValidators);
      } catch (error) {
        console.error('Error fetching validators:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidators();
  }, [cometBftRpcApi, cosmosSdkApi]);

  if (isLoading) {
    return <Loader message="Loading validators..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Validators</h1>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg neon-border">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Voting Power</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Uptime</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {validators.map((validator, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-750 cursor-pointer"
                onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.operator_address || convertBech32Address(validator.address, 'wardenvaloper') })}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">{validator.description?.moniker || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    validator.status === 'BOND_STATUS_BONDED' ? 'bg-green-100 text-green-800' : 
                    validator.status === 'BOND_STATUS_UNBONDING' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {validator.status?.replace('BOND_STATUS_', '') || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{validator.voting_power}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{validator.commission?.commission_rates?.rate ? (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) + '%' : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">N/A</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SearchPage = ({ navigate, cometBftRpcApi, cosmosSdkApi }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchResults(null);
    
    try {
      // Check if query is a block height
      if (/^\d+$/.test(query)) {
        const block = await fetchWithRetry(`${cometBftRpcApi}/block?height=${query}`);
        if (block) {
          setSearchResults({
            type: 'block',
            data: block.result.block,
            height: query
          });
          return;
        }
      }
      
      // Check if query is a transaction hash
      if (/^[A-Fa-f0-9]{64}$/.test(query)) {
        // For transaction search, we'll simulate a search result
        setSearchResults({
          type: 'transaction',
          data: { hash: query },
          hash: query
        });
        return;
      }
      
      // Check if query is an address (starts with warden)
      if (query.startsWith('warden')) {
        // For address search, we'll simulate a search result
        setSearchResults({
          type: 'address',
          data: { address: query },
          address: query
        });
        return;
      }
      
      // If no match, show no results
      setSearchResults({
        type: 'none',
        message: 'No results found for your query.'
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({
        type: 'error',
        message: 'Error performing search. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Search</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter block height, transaction hash, or address..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r-lg transition duration-200 disabled:opacity-50"
          >
            {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {searchResults && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Search Results</h2>
          
          {searchResults.type === 'block' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Block #{searchResults.height}</h3>
              <DetailRow label="Hash" value={searchResults.data.header.hash} isCode={true} />
              <DetailRow label="Time" value={new Date(searchResults.data.header.time).toLocaleString()} />
              <button 
                onClick={() => navigate(ROUTES.BLOCKS_DETAIL, { height: searchResults.height })}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                View Block Details
              </button>
            </div>
          )}
          
          {searchResults.type === 'transaction' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Transaction</h3>
              <DetailRow label="Hash" value={searchResults.hash} isCode={true} />
              <button 
                onClick={() => navigate(ROUTES.TX_DETAIL, { hash: searchResults.hash })}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                View Transaction Details
              </button>
            </div>
          )}
          
          {searchResults.type === 'address' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Address</h3>
              <DetailRow label="Address" value={searchResults.address} isCode={true} />
              <button 
                onClick={() => navigate(ROUTES.ADDRESS_DETAIL, { address: searchResults.address })}
                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                View Address Details
              </button>
            </div>
          )}
          
          {searchResults.type === 'none' && (
            <p className="text-gray-400">{searchResults.message}</p>
          )}
          
          {searchResults.type === 'error' && (
            <p className="text-red-400">{searchResults.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

const NetworkInfo = ({ cometBftRpcApi }) => {
  const [netInfo, setNetInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const [netInfoRes, healthRes] = await Promise.all([
          fetchWithRetry(`${cometBftRpcApi}/net_info`),
          fetchWithRetry(`${cometBftRpcApi}/health`)
        ]);
        
        setNetInfo(netInfoRes.result);
        setHealth(healthRes.result);
      } catch (error) {
        console.error('Error fetching network info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkInfo();
  }, [cometBftRpcApi]);

  if (isLoading) {
    return <Loader message="Loading network information..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Network Information</h1>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Network Status</h2>
          <div className="space-y-3">
            <DetailRow label="Listening" value={netInfo?.listening ? 'Yes' : 'No'} />
            <DetailRow label="Listen Address" value={netInfo?.listen_addr || 'N/A'} isCode={true} />
            <DetailRow label="Number of Peers" value={netInfo?.n_peers || 0} />
            <DetailRow label="Number of Unconnected" value={netInfo?.n_unconnected || 0} />
            <DetailRow label="Health Status" value={health ? 'Healthy' : 'Unhealthy'} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
          <h2 className="text-xl font-bold text-green-400 mb-4">Peers</h2>
          {netInfo?.peers && netInfo.peers.length > 0 ? (
            <div className="space-y-2">
              {netInfo.peers.slice(0, 5).map((peer, index) => (
                <div key={index} className="p-2 bg-gray-700 rounded-lg">
                  <DetailRow label="Node ID" value={peer.node_info.id} isCode={true} />
                  <DetailRow label="Listen Address" value={peer.node_info.listen_addr} isCode={true} />
                  <DetailRow label="Network" value={peer.node_info.network} />
                </div>
              ))}
              {netInfo.peers.length > 5 && (
                <p className="text-gray-400">And {netInfo.peers.length - 5} more peers...</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No peers connected</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Parameters = ({ cosmosSdkApi }) => {
  const [stakingParams, setStakingParams] = useState(null);
  const [govParams, setGovParams] = useState(null);
  const [mintParams, setMintParams] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const [stakingRes, govRes, mintRes] = await Promise.all([
          fetchWithRetry(`${cosmosSdkApi}/cosmos/staking/v1beta1/params`),
          fetchWithRetry(`${cosmosSdkApi}/cosmos/gov/v1beta1/params`),
          fetchWithRetry(`${cosmosSdkApi}/cosmos/mint/v1beta1/params`)
        ]);
        
        setStakingParams(stakingRes.params);
        setGovParams(govRes.deposit_params || govRes.voting_params || govRes.tally_params);
        setMintParams(mintRes.params);
      } catch (error) {
        console.error('Error fetching parameters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParameters();
  }, [cosmosSdkApi]);

  if (isLoading) {
    return <Loader message="Loading network parameters..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Network Parameters</h1>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stakingParams && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
            <h2 className="text-xl font-bold text-green-400 mb-4">Staking Parameters</h2>
            <div className="space-y-3">
              <DetailRow label="Unbonding Time" value={stakingParams.unbonding_time} />
              <DetailRow label="Max Validators" value={stakingParams.max_validators} />
              <DetailRow label="Max Entries" value={stakingParams.max_entries} />
              <DetailRow label="Historical Entries" value={stakingParams.historical_entries} />
              <DetailRow label="Bond Denom" value={stakingParams.bond_denom} />
            </div>
          </div>
        )}

        {govParams && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
            <h2 className="text-xl font-bold text-green-400 mb-4">Governance Parameters</h2>
            <div className="space-y-3">
              <DetailRow label="Deposit Period" value={govParams.deposit_period || 'N/A'} />
              <DetailRow label="Min Deposit" value={JSON.stringify(govParams.min_deposit || 'N/A')} />
              <DetailRow label="Voting Period" value={govParams.voting_period || 'N/A'} />
            </div>
          </div>
        )}

        {mintParams && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg neon-border">
            <h2 className="text-xl font-bold text-green-400 mb-4">Mint Parameters</h2>
            <div className="space-y-3">
              <DetailRow label="Mint Denom" value={mintParams.mint_denom} />
              <DetailRow label="Inflation Rate Change" value={mintParams.inflation_rate_change} />
              <DetailRow label="Inflation Max" value={mintParams.inflation_max} />
              <DetailRow label="Inflation Min" value={mintParams.inflation_min} />
              <DetailRow label="Goal Bonded" value={mintParams.goal_bonded} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const { currentRoute, currentParams, navigate, isReady } = useRouter();
  const { selectedConfig, setRpcConfig } = useRpcConfig();
  const { isDark, toggleTheme } = useTheme();
  
  const cometBftRpcApi = selectedConfig.COMETBFT_RPC_API;
  const cosmosSdkApi = selectedConfig.COSMOS_SDK_API;

  if (!isReady) {
    return <Loader message="Initializing explorer..." />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <style jsx global>{`
        .dark {
          --tw-bg-opacity: 1;
          background-color: rgba(17, 24, 39, var(--tw-bg-opacity));
          color: rgba(255, 255, 255, var(--tw-text-opacity));
        }
        .neon-border {
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
        }
        .dark .neon-border {
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
        }
        .light .neon-border {
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
        }
        .bg-gray-750 {
          background-color: #1f2937;
        }
        .dark .bg-gray-750 {
          background-color: #1f2937;
        }
        .light .bg-gray-750 {
          background-color: #e5e7eb;
        }
      `}</style>

      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-green-400 mr-3" />
              <h1 className="text-2xl font-bold text-white">Warden Explorer</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={JSON.stringify(selectedConfig)}
                onChange={(e) => setRpcConfig(JSON.parse(e.target.value))}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {RPC_CONFIGS.map((config, index) => (
                  <option key={index} value={JSON.stringify(config)}>
                    {config.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={toggleTheme}
                className="bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition duration-200"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-3">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.DASHBOARD
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 inline mr-1" />
              Dashboard
            </button>
            <button
              onClick={() => navigate(ROUTES.BLOCKS_LIST)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.BLOCKS_LIST
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Hash className="w-5 h-5 inline mr-1" />
              Blocks
            </button>
            <button
              onClick={() => navigate(ROUTES.TXS)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.TXS
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Activity className="w-5 h-5 inline mr-1" />
              Transactions
            </button>
            <button
              onClick={() => navigate(ROUTES.VALIDATORS)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.VALIDATORS
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5 inline mr-1" />
              Validators
            </button>
            <button
              onClick={() => navigate(ROUTES.PROPOSALS)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.PROPOSALS
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-1" />
              Proposals
            </button>
            <button
              onClick={() => navigate(ROUTES.NET_INFO)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.NET_INFO
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Network className="w-5 h-5 inline mr-1" />
              Network
            </button>
            <button
              onClick={() => navigate(ROUTES.PARAMETERS)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.PARAMETERS
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-1" />
              Parameters
            </button>
            <button
              onClick={() => navigate(ROUTES.SEARCH)}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${
                currentRoute === ROUTES.SEARCH
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300'
              }`}
            >
              <Search className="w-5 h-5 inline mr-1" />
              Search
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRoute === ROUTES.DASHBOARD && (
          <Dashboard navigate={navigate} cometBftRpcApi={cometBftRpcApi} cosmosSdkApi={cosmosSdkApi} />
        )}
        {currentRoute === ROUTES.BLOCKS_LIST && (
          <BlocksList navigate={navigate} cometBftRpcApi={cometBftRpcApi} />
        )}
        {currentRoute === ROUTES.BLOCKS_DETAIL && (
          <BlocksDetail currentParams={currentParams} navigate={navigate} cometBftRpcApi={cometBftRpcApi} />
        )}
        {currentRoute === ROUTES.TXS && (
          <Transactions navigate={navigate} cometBftRpcApi={cometBftRpcApi} />
        )}
        {currentRoute === ROUTES.VALIDATORS && (
          <Validators navigate={navigate} cometBftRpcApi={cometBftRpcApi} cosmosSdkApi={cosmosSdkApi} />
        )}
        {currentRoute === ROUTES.NET_INFO && (
          <NetworkInfo cometBftRpcApi={cometBftRpcApi} />
        )}
        {currentRoute === ROUTES.PARAMETERS && (
          <Parameters cosmosSdkApi={cosmosSdkApi} />
        )}
        {currentRoute === ROUTES.SEARCH && (
          <SearchPage navigate={navigate} cometBftRpcApi={cometBftRpcApi} cosmosSdkApi={cosmosSdkApi} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-400">
            <p>Warden Protocol Explorer - Client-Side Blockchain Explorer</p>
            <p className="mt-2">Powered by Warden Protocol APIs</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;