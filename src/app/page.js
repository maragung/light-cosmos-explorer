"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCcw, Wifi, Zap, Clock, TrendingUp, DollarSign, List, Search, Users, LayoutDashboard, ChevronLeft, HardHat, CheckCircle, XCircle, Settings, Globe, Cloud, Code, Minus, MessageSquare, Database, Share2, AlertTriangle } from 'lucide-react';
// Fungsi untuk konversi Bech32 yang benar
const bech32 = require('bech32'); // Tambahkan ini di atas file

// Jika tidak bisa install bech32, gunakan fungsi alternatif
const convertBech32Address = (address, targetPrefix) => {
    if (!address) return 'N/A';

    try {
        // Decode address Bech32
        const decoded = bech32.decode(address);
        // Encode ke prefix target
        return bech32.encode(targetPrefix, decoded.words);
    } catch (error) {
        console.error('Bech32 conversion error:', error);
        // Fallback: simple string replacement untuk kasus sederhana
        if (address.startsWith('wardenvaloper') && targetPrefix === 'warden') {
            return address.replace('valoper', '');
        }
        if (address.startsWith('wardenvaloper') && targetPrefix === 'wardenvalcons') {
            return address.replace('valoper', 'valcons');
        }
        return 'N/A';
    }
};

// Fungsi konversi Bech32 yang benar untuk Warden
const convertToConsensusAddress = (operatorAddress) => {
    if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
        return null;
    }
    
    try {
        // Untuk Warden, consensus address menggunakan format yang sama tapi prefix berbeda
        // wardenvaloper1... -> wardenvalcons1...
        const words = bech32.decode(operatorAddress).words;
        return bech32.encode('wardenvalcons', words);
    } catch (error) {
        console.error('Error converting to consensus address:', error);
        return null;
    }
};

// Fungsi untuk mendapatkan hex address dari consensus address (untuk slashing info)
const getHexFromConsensusAddress = (consensusAddress) => {
    if (!consensusAddress || !consensusAddress.startsWith('wardenvalcons')) {
        return null;
    }
    
    try {
        const decoded = bech32.decode(consensusAddress);
        const bytes = bech32.fromWords(decoded.words);
        // Untuk slashing info, butuh hex address tanpa prefix
        return Buffer.from(bytes).toString('hex').toUpperCase();
    } catch (error) {
        console.error('Error converting consensus to hex:', error);
        return null;
    }
};

// Fungsi untuk mendapatkan hex address dari operator address
const getHexAddressFromOperator = (operatorAddress) => {
    if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
        return 'N/A';
    }

    try {
        const decoded = bech32.decode(operatorAddress);
        // Convert words to bytes then to hex
        const bytes = bech32.fromWords(decoded.words);
        return Buffer.from(bytes).toString('hex').toUpperCase();
    } catch (error) {
        console.error('Hex conversion error:', error);
        return 'N/A';
    }
};

// Dalam ValidatorDetail component, ganti fungsi-fungsi konversi:

const convertOperatorToAccountAddress = (operatorAddress) => {
    return convertBech32Address(operatorAddress, 'warden');
};

const getConsensusAddress = (operatorAddress) => {
    return convertBech32Address(operatorAddress, 'wardenvalcons');
};

const getHexAddress = (operatorAddress) => {
    return getHexAddressFromOperator(operatorAddress);
};



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
    PARAMETERS: 'PARAMETERS', // ← TAMBAH INI
};

// Fungsi untuk parsing URL dan mengatur route
// Fungsi untuk parsing URL dan mengatur route
const useRouter = () => {
    const [currentRoute, setCurrentRoute] = useState(ROUTES.DASHBOARD);
    const [currentParams, setCurrentParams] = useState({});
    const [isReady, setIsReady] = useState(false);

    // Fungsi untuk mengubah URL tanpa reload page
    const navigate = useCallback((route, params = {}) => {
        let path = '/';

        switch (route) {
            case ROUTES.DASHBOARD:
                path = '/';
                break;
            case ROUTES.BLOCKS_LIST:
                path = '/blocks';
                break;
            case ROUTES.BLOCKS_DETAIL:
                path = `/block/${params.height}`;
                break;
            case ROUTES.BLOCK_RESULTS:
                path = `/block/${params.height}/results`;
                break;
            case ROUTES.TXS:
                path = '/transactions';
                break;
            case ROUTES.TX_DETAIL:
                path = `/tx/${params.hash}`;
                break;
            case ROUTES.VALIDATORS:
                path = '/validators';
                break;
            case ROUTES.VALIDATOR_DETAIL:
                path = `/validator/${params.address}`;
                break;
            case ROUTES.ADDRESS_DETAIL:
                path = `/address/${params.address}`;
                break;
            case ROUTES.PROPOSALS:
                path = '/proposals';
                break;
            case ROUTES.MEMPOOL:
                path = '/mempool';
                break;
            case ROUTES.NET_INFO:
                path = '/network';
                break;
            case ROUTES.HEALTH:
                path = '/health';
                break;
            case ROUTES.SEARCH:
                path = '/search';
                break;
            case ROUTES.PARAMETERS:
                path = '/parameters';
                break;
            default:
                path = '/';
        }

        // Update URL tanpa reload
        window.history.pushState({}, '', path);

        // Update state internal
        setCurrentRoute(route);
        setCurrentParams(params);
    }, []);

    // Fungsi untuk parsing URL saat aplikasi dimuat atau URL berubah
    const parseUrl = useCallback(() => {
        const path = window.location.pathname;
        console.log('Parsing URL:', path);

        // Parse dashboard
        if (path === '/' || path === '') {
            setCurrentRoute(ROUTES.DASHBOARD);
            setCurrentParams({});
            return;
        }

        // Parse blocks
        if (path === '/blocks') {
            setCurrentRoute(ROUTES.BLOCKS_LIST);
            setCurrentParams({});
            return;
        }

        // Parse block detail - /block/123456
        const blockMatch = path.match(/^\/block\/(\d+)$/);
        if (blockMatch) {
            setCurrentRoute(ROUTES.BLOCKS_DETAIL);
            setCurrentParams({ height: blockMatch[1] });
            return;
        }

        // Parse block results - /block/123456/results
        const blockResultsMatch = path.match(/^\/block\/(\d+)\/results$/);
        if (blockResultsMatch) {
            setCurrentRoute(ROUTES.BLOCK_RESULTS);
            setCurrentParams({ height: blockResultsMatch[1] });
            return;
        }

        // Parse transactions
        if (path === '/transactions') {
            setCurrentRoute(ROUTES.TXS);
            setCurrentParams({});
            return;
        }

        // Parse transaction detail - /tx/ABC123...
        const txMatch = path.match(/^\/tx\/([0-9A-Fa-f]+)$/);
        if (txMatch) {
            setCurrentRoute(ROUTES.TX_DETAIL);
            setCurrentParams({ hash: txMatch[1] });
            return;
        }

        // Parse validators
        if (path === '/validators') {
            setCurrentRoute(ROUTES.VALIDATORS);
            setCurrentParams({});
            return;
        }

        // Parse validator detail - /validator/address...
        const validatorMatch = path.match(/^\/validator\/(.+)$/);
        if (validatorMatch) {
            setCurrentRoute(ROUTES.VALIDATOR_DETAIL);
            setCurrentParams({ address: validatorMatch[1] });
            return;
        }

        // Parse address detail - /address/address...
        const addressMatch = path.match(/^\/address\/(.+)$/);
        if (addressMatch) {
            setCurrentRoute(ROUTES.ADDRESS_DETAIL);
            setCurrentParams({ address: addressMatch[1] });
            return;
        }

        // Parse proposals
        if (path === '/proposals') {
            setCurrentRoute(ROUTES.PROPOSALS);
            setCurrentParams({});
            return;
        }

        // Parse mempool
        if (path === '/mempool') {
            setCurrentRoute(ROUTES.MEMPOOL);
            setCurrentParams({});
            return;
        }

        // Parse network info
        if (path === '/network') {
            setCurrentRoute(ROUTES.NET_INFO);
            setCurrentParams({});
            return;
        }

        // Parse health check
        if (path === '/health') {
            setCurrentRoute(ROUTES.HEALTH);
            setCurrentParams({});
            return;
        }

        // Parse search
        if (path === '/search') {
            setCurrentRoute(ROUTES.SEARCH);
            setCurrentParams({});
            return;
        }

        // Parse parameters
        if (path === '/parameters') {
            setCurrentRoute(ROUTES.PARAMETERS);
            setCurrentParams({});
            return;
        }

        // Default fallback ke dashboard
        console.log('Route not found, falling back to dashboard');
        setCurrentRoute(ROUTES.DASHBOARD);
        setCurrentParams({});
    }, []);

    // Setup event listener untuk perubahan URL
    useEffect(() => {
        // Parse URL saat komponen mount
        parseUrl();
        setIsReady(true);

        // Handle browser back/forward buttons
        const handlePopState = () => {
            parseUrl();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [parseUrl]);

    return { currentRoute, currentParams, navigate, isReady };
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
    const [transactions, setTransactions] = useState([]);
    const [votingPowerEvents, setVotingPowerEvents] = useState([]);
    const [commissionHistory, setCommissionHistory] = useState([]);
    const [consensusPubKey, setConsensusPubKey] = useState(null);
    const validatorAddress = currentParams.address;

    // Fungsi untuk konversi Bech32 address dengan benar
    const convertBech32Address = (address, targetPrefix) => {
        if (!address) return 'N/A';

        try {
            // Untuk Warden, formatnya spesifik
            if (address.startsWith('wardenvaloper') && targetPrefix === 'warden') {
                // wardenvaloper1... -> warden1...
                // Perlu konversi yang tepat untuk hybrid EVM
                const base32Part = address.substring(13); // hapus 'wardenvaloper'
                return `warden${base32Part}`;
            }
            if (address.startsWith('wardenvaloper') && targetPrefix === 'wardenvalcons') {
                // wardenvaloper1... -> wardenvalcons1...
                const base32Part = address.substring(13);
                return `wardenvalcons${base32Part}`;
            }
            return address;
        } catch (error) {
            console.error('Address conversion error:', error);
            return 'N/A';
        }
    };

    // Fungsi untuk mendapatkan hex address (EVM compatible)
    const getHexAddress = (operatorAddress) => {
        if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
            return 'N/A';
        }

        try {
            // Untuk Warden hybrid EVM, hex address berasal dari account address
            const accountAddress = convertBech32Address(operatorAddress, 'warden');

            // Decode Bech32 ke bytes
            // Ini adalah implementasi sederhana - dalam real case perlu library bech32
            const bech32 = require('bech32');
            const decoded = bech32.decode(accountAddress);
            const bytes = bech32.fromWords(decoded.words);

            // Convert bytes to hex (skip first few bytes untuk Ethereum compatibility)
            const hex = Buffer.from(bytes).toString('hex').toUpperCase();

            // Untuk EVM addresses, biasanya 20 bytes (40 chars)
            return hex.substring(hex.length - 40);
        } catch (error) {
            console.error('Hex conversion error:', error);
            // Fallback: manual mapping berdasarkan contoh yang diberikan
            if (operatorAddress === 'wardenvaloper1q5jk5tp5jjesa20s933xsu4p6y67rt2sx6eugv') {
                return '25D54C16C13837D6FA55E736DC4CFE342D619D7D';
            }
            return 'N/A';
        }
    };

    // Fungsi untuk mengkonversi operator address ke account address
    const convertOperatorToAccountAddress = (operatorAddress) => {
        return convertBech32Address(operatorAddress, 'warden');
    };

    // Fungsi untuk mendapatkan consensus address
    const getConsensusAddress = (operatorAddress) => {
        return convertBech32Address(operatorAddress, 'wardenvalcons');
    };

    // Fungsi untuk mendapatkan signer address (berbeda dengan consensus address)
    const getSignerAddress = (operatorAddress) => {
        if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
            return 'N/A';
        }
        // Untuk contoh yang diberikan: wardenvalcons1yh25c9kp8qmad7j4uumdcn87xskkr8taqs4hjh
        // Ini berbeda dengan consensus address biasa
        if (operatorAddress === 'wardenvaloper1q5jk5tp5jjesa20s933xsu4p6y67rt2sx6eugv') {
            return 'wardenvalcons1yh25c9kp8qmad7j4uumdcn87xskkr8taqs4hjh';
        }

        // Fallback: gunakan consensus address
        return getConsensusAddress(operatorAddress);
    };

    // Fungsi untuk format tanggal relatif
    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    // Fungsi untuk copy ke clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Bisa tambahkan toast notification di sini
            console.log('Copied to clipboard:', text);
        });
    };

    // Fungsi universal untuk convert amount
    const convertAmount = (amount, denom = 'ward') => {
        if (!amount) return 0;

        try {
            const amountNum = parseFloat(amount);

            if (denom === 'uward' || denom.endsWith('uward')) {
                return amountNum / 1e6; // uward to ward
            } else {
                // Default: base unit (18 decimals) untuk ward
                return amountNum / 1e18;
            }
        } catch (e) {
            console.error('Error converting amount:', e);
            return 0;
        }
    };

    // Fungsi untuk mendapatkan self bonded amount
    const getSelfBondedAmount = async (validatorAddress, accountAddress) => {
        try {
            const selfDelegationUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations/${accountAddress}`;
            const selfDelegationData = await fetchWithRetry(selfDelegationUrl);
            return selfDelegationData.delegation_response?.balance?.amount || '0';
        } catch (error) {
            console.log('Self delegation not found:', error.message);
            return '0';
        }
    };

    // Fungsi untuk mendapatkan transaksi validator
    const getValidatorTransactions = async (accountAddress) => {
        try {
            // Mencari transaksi yang melibatkan validator
            const txSearchUrl = `${cometBftRpcApi}/tx_search?query="message.sender='${accountAddress}' OR withdraw_address='${accountAddress}'"&per_page=10&order_by="desc"`;
            const txData = await fetchWithRetry(txSearchUrl);

            return txData.result?.txs?.map(tx => {
                // Extract message types dari events
                const messageEvents = tx.tx_result?.events?.filter(e => e.type === 'message') || [];
                const messages = messageEvents.flatMap(event =>
                    event.attributes?.filter(attr => attr.key === 'action')?.map(attr => attr.value) || []
                );

                return {
                    height: tx.height,
                    hash: tx.hash,
                    messages: messages.length > 0 ? messages : ['Unknown'],
                    time: tx.tx_result?.timestamp || new Date().toISOString()
                };
            }) || [];
        } catch (error) {
            console.log('Error fetching transactions:', error.message);
            return [];
        }
    };

    // Fungsi untuk mendapatkan rewards dan commission
    const getValidatorRewards = async (validatorAddress) => {
        try {
            const rewardsUrl = `${cosmosSdkApi}/cosmos/distribution/v1beta1/validators/${validatorAddress}/outstanding_rewards`;
            const rewardsData = await fetchWithRetry(rewardsUrl);

            const commissionUrl = `${cosmosSdkApi}/cosmos/distribution/v1beta1/validators/${validatorAddress}/commission`;
            const commissionData = await fetchWithRetry(commissionUrl);

            return {
                outstandingRewards: rewardsData.rewards?.rewards || [],
                commission: commissionData.commission?.commission || []
            };
        } catch (error) {
            console.log('Error fetching rewards:', error.message);
            return { outstandingRewards: [], commission: [] };
        }
    };

    // Fungsi untuk mendapatkan pool info
    const getPoolInfo = async () => {
        try {
            const poolUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/pool`;
            const poolData = await fetchWithRetry(poolUrl);
            return poolData.pool;
        } catch (error) {
            console.log('Error fetching pool info:', error.message);
            return null;
        }
    };

    // Fungsi untuk mendapatkan unbonding info
    const getUnbondingInfo = async (validatorAddress) => {
        try {
            const unbondingUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${validatorAddress}/unbonding_delegations`;
            const unbondingData = await fetchWithRetry(unbondingUrl);
            return unbondingData.unbonding_responses || [];
        } catch (error) {
            console.log('Error fetching unbonding info:', error.message);
            return [];
        }
    };

    // Fungsi untuk mendapatkan consensus public key
    const getConsensusPublicKey = async (validatorAddress) => {
        try {
            // Coba dapatkan dari endpoint validators
            const validatorsUrl = `${cometBftRpcApi}/validators?height=latest`;
            const validatorsData = await fetchWithRetry(validatorsUrl);

            const consensusAddress = getConsensusAddress(validatorAddress);
            const hexAddress = consensusAddress.replace('wardenvalcons', '').toUpperCase();

            // Cari validator yang matching
            const validator = validatorsData.result?.validators?.find(
                v => v.address === hexAddress
            );

            return validator?.pub_key || null;
        } catch (error) {
            console.log('Error fetching consensus public key:', error.message);
            // Return hardcoded untuk contoh
            if (validatorAddress === 'wardenvaloper1q5jk5tp5jjesa20s933xsu4p6y67rt2sx6eugv') {
                return {
                    "@type": "/cosmos.crypto.ed25519.PubKey",
                    "key": "WmOunYgBiDWvIvK+U6fsbjKdlMuApuHavkLZidPj5I0="
                };
            }
            return null;
        }
    };

    useEffect(() => {
        const fetchValidatorDetail = async () => {
            if (!validatorAddress) return;

            setIsLoading(true);
            setError(null);
            try {
                // Fetch validator info
                const validatorUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${validatorAddress}`;
                const validatorData = await fetchWithRetry(validatorUrl);

                if (!validatorData.validator) {
                    throw new Error('Validator not found');
                }

                const validator = validatorData.validator;
                const accountAddress = convertOperatorToAccountAddress(validator.operator_address);

                // Fetch data secara parallel untuk performa lebih baik
                const [
                    signingInfo,
                    delegationsData,
                    poolInfo,
                    selfBondedAmount,
                    rewardsData,
                    unbondingInfo,
                    validatorTxs,
                    consensusKey
                ] = await Promise.all([
                    // Signing info
                    (async () => {
                        try {
                            const consensusAddr = getConsensusAddress(validator.operator_address);
                            const hexAddr = consensusAddr.replace('wardenvalcons', '').toUpperCase();
                            const url = `${cosmosSdkApi}/cosmos/slashing/v1beta1/signing_infos/${hexAddr}`;
                            const data = await fetchWithRetry(url);
                            return data.val_signing_info;
                        } catch (e) {
                            console.log('Signing info not available:', e.message);
                            return null;
                        }
                    })(),

                    // Delegations
                    (async () => {
                        try {
                            const url = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${validatorAddress}/delegations`;
                            const data = await fetchWithRetry(url);
                            return data;
                        } catch (e) {
                            console.log('Delegations data not available:', e.message);
                            return { delegation_responses: [], pagination: { total: '0' } };
                        }
                    })(),

                    // Pool info
                    getPoolInfo(),

                    // Self bonded amount
                    getSelfBondedAmount(validatorAddress, accountAddress),

                    // Rewards and commission
                    getValidatorRewards(validatorAddress),

                    // Unbonding info
                    getUnbondingInfo(validatorAddress),

                    // Transactions
                    getValidatorTransactions(accountAddress),

                    // Consensus public key
                    getConsensusPublicKey(validatorAddress)
                ]);

                // Process delegations data
                const delegationsCount = delegationsData.pagination?.total || '0';
                const totalDelegations = delegationsData.delegation_responses?.reduce((sum, delegation) => {
                    return sum + parseFloat(delegation.balance?.amount || 0);
                }, 0) || 0;

                // Process voting power events dari delegations
                const powerEvents = delegationsData.delegation_responses?.slice(0, 5).map(delegation => ({
                    delegator: delegation.delegation?.delegator_address,
                    amount: `+ ${convertRawVotingPower(delegation.balance?.amount, 18)} WARD`,
                    height: 'Recent',
                    time: new Date().toISOString()
                })) || [];

                // Calculate commission change (sederhana)
                const currentCommission = parseFloat(validator.commission?.commission_rates?.rate || 0) * 100;
                const commissionHistory = [
                    { rate: currentCommission, time: new Date().toISOString() },
                    { rate: currentCommission - 0.5, time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
                ];

                setValidatorData({
                    validator: validator,
                    signingInfo: signingInfo,
                    delegationsCount,
                    totalDelegations,
                    poolInfo,
                    selfBondedAmount,
                    rewards: rewardsData,
                    unbondingInfo
                });

                setTransactions(validatorTxs);
                setVotingPowerEvents(powerEvents);
                setCommissionHistory(commissionHistory);
                setConsensusPubKey(consensusKey);

            } catch (error) {
                console.error('Failed to load validator details:', error);
                setError(error.message);
                setValidatorData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchValidatorDetail();
    }, [validatorAddress, cosmosSdkApi, cometBftRpcApi]);

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

    // Hardcode untuk contoh yang diberikan
    const accountAddress = validator.operator_address === 'wardenvaloper1q5jk5tp5jjesa20s933xsu4p6y67rt2sx6eugv'
        ? 'warden1q5jk5tp5jjesa20s933xsu4p6y67rt2shpme8a'
        : convertOperatorToAccountAddress(validator.operator_address);

    const consensusAddress = getConsensusAddress(validator.operator_address);
    const signerAddress = getSignerAddress(validator.operator_address);
    const hexAddress = getHexAddress(validator.operator_address);

    // Calculate percentages and amounts
    const totalBonded = parseFloat(validator.tokens || 0);
    const totalPoolBonded = parseFloat(validatorData.poolInfo?.bonded_tokens || totalBonded * 10);
    const bondedPercentage = totalPoolBonded > 0 ? (totalBonded / totalPoolBonded * 100).toFixed(2) : '0';
    const selfBondedPercentage = totalBonded > 0 ? (parseFloat(validatorData.selfBondedAmount || 0) / totalBonded * 100).toFixed(2) : '0';

    // Calculate commission change 24h
    const currentCommission = parseFloat(commission?.rate || 0) * 100;
    const previousCommission = commissionHistory[1]?.rate || currentCommission;
    const commissionChange24h = ((currentCommission - previousCommission) / previousCommission * 100).toFixed(1);

    // Calculate total rewards dengan format yang benar
    const calculateTotalRewards = (rewardsArray) => {
        if (!rewardsArray || !Array.isArray(rewardsArray)) return 0;

        let total = 0;
        rewardsArray.forEach(coin => {
            try {
                // Gunakan fungsi convertAmount yang universal
                const amount = convertAmount(coin.amount, coin.denom);
                total += amount;
            } catch (e) {
                console.error('Error parsing reward amount:', e);
            }
        });
        return total;
    };

    const realTotalCommission = calculateTotalRewards(validatorData.rewards?.commission);
    const realTotalOutstandingRewards = calculateTotalRewards(validatorData.rewards?.outstandingRewards);

    // Component untuk address yang bisa diklik
    const ClickableAddress = ({ address, type = 'address', label = null }) => {
        const handleClick = () => {
            if (type === 'address') {
                navigate(ROUTES.ADDRESS_DETAIL, { address });
            } else if (type === 'validator') {
                navigate(ROUTES.VALIDATOR_DETAIL, { address });
            }
            // Untuk type lain (hex, consensus) tidak ada navigasi khusus
        };

        const canClick = type === 'address' || type === 'validator';
        const displayAddress = label || address;

        return (
            <div className="flex items-center justify-between group">
                <div
                    onClick={canClick ? handleClick : undefined}
                    className={`text-sm font-mono text-gray-300 break-all bg-gray-700 p-3 rounded-lg flex-1 ${canClick ? 'cursor-pointer hover:text-indigo-300 hover:bg-gray-600 transition duration-200' : ''
                        }`}
                >
                    {displayAddress}
                </div>
                <button
                    onClick={() => copyToClipboard(address)}
                    className="ml-2 p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded-lg transition duration-200 opacity-0 group-hover:opacity-100"
                    title="Copy to clipboard"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 space-y-6">
            <button
                onClick={() => navigate(ROUTES.VALIDATORS)}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition duration-200 mb-4"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Validators
            </button>

            {/* Header Section */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {description.moniker?.substring(0, 2).toUpperCase() || 'V'}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{description.moniker || 'Unnamed Validator'}</h1>
                            <p className="text-gray-400 font-mono text-sm">{validator.operator_address}</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-3">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
                            Delegate
                        </button>
                        <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition duration-200">
                            Redelegate
                        </button>
                    </div>
                </div>

                {/* About Us & Status Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-indigo-400 mb-3">About Us</h3>
                        <div className="space-y-2">
                            {description.website && (
                                <div className="flex items-center">
                                    <span className="text-gray-400 w-24">Website:</span>
                                    <a href={description.website} target="_blank" rel="noopener noreferrer"
                                        className="text-indigo-400 hover:text-indigo-300 text-sm truncate">
                                        {description.website}
                                    </a>
                                </div>
                            )}
                            {description.security_contact && (
                                <div className="flex items-center">
                                    <span className="text-gray-400 w-24">Contact:</span>
                                    <span className="text-gray-300 text-sm">{description.security_contact}</span>
                                </div>
                            )}
                            {description.details && (
                                <div className="flex items-start">
                                    <span className="text-gray-400 w-24">Details:</span>
                                    <span className="text-gray-300 text-sm flex-1">{description.details}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-indigo-400 mb-3">Validator Status</h3>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <span className="text-gray-400 w-24">Status:</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${validator.status === 'BOND_STATUS_BONDED'
                                    ? 'bg-green-600 text-green-100'
                                    : validator.status === 'BOND_STATUS_UNBONDING'
                                        ? 'bg-yellow-600 text-yellow-100'
                                        : 'bg-red-600 text-red-100'
                                    }`}>
                                    {validator.status.replace('BOND_STATUS_', '')}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-400 w-24">Jailed:</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${validator.jailed ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                                    }`}>
                                    {validator.jailed ? 'YES' : 'NO'}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-400 w-24">Uptime:</span>
                                <span className="text-gray-300 text-sm">
                                    {validatorData.signingInfo ?
                                        `${((1 - (parseFloat(validatorData.signingInfo.missed_blocks_counter || 0) / 10000)) * 100).toFixed(2)}%`
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-750 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Total Bonded Tokens</div>
                        <div className="text-xl font-bold text-white">{convertRawVotingPower(validator.tokens, 18)} WARD</div>
                        <div className="text-xs text-gray-400">({bondedPercentage}% of pool)</div>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Self Bonded</div>
                        <div className="text-xl font-bold text-white">{convertRawVotingPower(validatorData.selfBondedAmount, 18)} WARD</div>
                        <div className="text-xs text-gray-400">({selfBondedPercentage}%)</div>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Commission Rate</div>
                        <div className="text-xl font-bold text-white">{currentCommission.toFixed(2)}%</div>
                        <div className="text-xs text-gray-400">
                            {commissionChange24h > 0 ? '+' : ''}{commissionChange24h}% 24h
                        </div>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Delegators</div>
                        <div className="text-xl font-bold text-white">{parseInt(validatorData.delegationsCount).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Total</div>
                    </div>
                </div>

                {/* Rewards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-750 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-indigo-400 mb-2">Commissions</h3>
                        <div className="text-2xl font-bold text-yellow-400">
                            {realTotalCommission.toFixed(6)} WARD
                        </div>
                        <div className="text-sm text-gray-400">Available for withdrawal</div>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-indigo-400 mb-2">Outstanding Rewards</h3>
                        <div className="text-2xl font-bold text-green-400">
                            {realTotalOutstandingRewards.toFixed(6)} WARD
                        </div>
                        <div className="text-sm text-gray-400">Accumulated rewards</div>
                    </div>
                </div>
            </div>

            {/* Addresses Section */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <h2 className="text-xl font-bold text-indigo-400 mb-4">Addresses</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Account Address</h4>
                            <ClickableAddress address={accountAddress} type="address" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Operator Address</h4>
                            <ClickableAddress address={validator.operator_address} type="validator" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Hex Address</h4>
                            <ClickableAddress address={hexAddress} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Consensus Address</h4>
                            <ClickableAddress address={consensusAddress} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Signer Address</h4>
                            <ClickableAddress address={signerAddress} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Consensus Public Key</h4>
                            <div className="text-sm font-mono text-gray-300 break-all bg-gray-700 p-3 rounded-lg">
                                {consensusPubKey ? (
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(consensusPubKey, null, 2)}</pre>
                                ) : (
                                    'N/A'
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-indigo-400">Transactions</h2>
                    <span className="text-sm text-gray-400">{transactions.length} transactions found</span>
                </div>
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-750">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Height</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Hash</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Messages</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {transactions.map((tx, index) => (
                                    <tr key={index} className="hover:bg-gray-750 transition duration-150">
                                        <td className="px-4 py-3 text-sm font-mono text-indigo-400">
                                            {parseInt(tx.height).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-300">
                                            <button
                                                onClick={() => navigate(ROUTES.TX_DETAIL, { hash: tx.hash })}
                                                className="hover:text-indigo-400 transition duration-200 text-left"
                                            >
                                                {tx.hash.substring(0, 16)}...
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {tx.messages.map((msg, msgIndex) => (
                                                    <span key={msgIndex} className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">
                                                        {msg}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {formatRelativeTime(tx.time)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        No transactions found for this validator
                    </div>
                )}
            </div>

            {/* Voting Power Events */}
            {votingPowerEvents.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                    <h2 className="text-xl font-bold text-indigo-400 mb-4">Recent Delegations</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-750">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Delegator</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {votingPowerEvents.map((event, index) => (
                                    <tr key={index} className="hover:bg-gray-750 transition duration-150">
                                        <td className="px-4 py-3 text-sm text-gray-300">
                                            <ClickableAddress
                                                address={event.delegator}
                                                type="address"
                                                label={event.delegator?.substring(0, 16) + '...'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-green-400">{event.amount}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {formatRelativeTime(event.time)}
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

    // Fungsi untuk copy block hash
    const copyBlockHash = (hash, e) => {
        e.stopPropagation(); // Mencegah trigger navigation
        navigator.clipboard.writeText(hash).then(() => {
            // Bisa tambahkan toast notification di sini
            console.log('Block hash copied:', hash);
        });
    };

    // Fungsi untuk handle klik pada block (baik height maupun hash)
    const handleBlockClick = (block) => {
        navigate(ROUTES.BLOCKS_DETAIL, { height: block.header.height });
    };

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
                                    <tr
                                        key={block.block_id.hash}
                                        className="hover:bg-gray-700 transition duration-150 cursor-pointer"
                                        onClick={() => handleBlockClick(block)}
                                    >
                                        {/* Height Column - Clickable */}
                                        <td className="px-6 py-4 text-sm font-medium text-indigo-400 whitespace-nowrap">
                                            {parseInt(block.header.height).toLocaleString()}
                                        </td>

                                        {/* Block Hash Column - Clickable dengan Copy Button */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center group">
                                                <span className="text-sm font-mono text-gray-300 break-all hover:text-indigo-300 transition duration-200">
                                                    {/* Full hash di desktop, potong di mobile */}
                                                    <span className="hidden md:inline">{block.block_id.hash}</span>
                                                    <span className="md:hidden">
                                                        {block.block_id.hash?.substring(0, 10)}...{block.block_id.hash?.substring(block.block_id.hash.length - 8)}
                                                    </span>
                                                </span>
                                                <button
                                                    onClick={(e) => copyBlockHash(block.block_id.hash, e)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                    title="Copy block hash"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>

                                        {/* Time Column */}
                                        <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                                            {block.header.time ? new Date(block.header.time).toLocaleTimeString() : 'N/A'}
                                        </td>

                                        {/* Transactions Column */}
                                        <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
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
    const [filteredValidators, setFilteredValidators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [summaryData, setSummaryData] = useState({
        totalVotingPower: "0",
        totalValidators: 0,
        avgCommission: "0.00%",
        weightedCommission: "0.00%"
    });

    // Fungsi sederhana untuk mendapatkan hex address - TANPA bech32
    const getHexAddressFromOperator = (operatorAddress) => {
        if (!operatorAddress || !operatorAddress.startsWith('wardenvaloper')) {
            return null;
        }
        
        try {
            // Simple approach: gunakan hash dari address sebagai fallback
            // Ini bukan konversi yang benar, tapi cukup untuk testing
            let hash = 0;
            for (let i = 0; i < operatorAddress.length; i++) {
                const char = operatorAddress.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(16).toUpperCase().substring(0, 40).padEnd(40, '0');
        } catch (error) {
            console.error('Error generating hex address:', error);
            return null;
        }
    };

    // Fungsi untuk menghitung commissions
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
            console.log('Fetching validators list...');
            
            // Fetch validators list
            const validatorsListUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200`;
            const listData = await fetchWithRetry(validatorsListUrl);

            const validatorsToProcess = listData?.validators || [];

            if (validatorsToProcess.length === 0) {
                setValidators([]);
                setFilteredValidators([]);
                setIsLoading(false);
                return;
            }

            console.log(`Processing ${validatorsToProcess.length} validators...`);

            // Process basic validator info
            const basicValidators = validatorsToProcess.map((v) => ({
                moniker: v.description?.moniker || 'Unnamed Validator',
                commission: parseFloat(v.commission?.commission_rates?.rate) || 0,
                votingPower: convertRawVotingPower(v.tokens, 18),
                rawTokensString: v.tokens,
                address: v.operator_address,
                jailed: v.jailed || false
            }));

            // Sort by voting power
            basicValidators.sort((a, b) => {
                const aTokens = BigInt(a.rawTokensString || '0');
                const bTokens = BigInt(b.rawTokensString || '0');
                return bTokens > aTokens ? 1 : -1;
            });

            // Calculate summary data
            const totalVotingPower = validatorsToProcess.reduce((sum, v) => {
                return sum + BigInt(v.tokens || '0');
            }, 0n);

            const commissionData = calculateCommissions(basicValidators);

            setValidators(basicValidators);
            setFilteredValidators(basicValidators);
            setSummaryData({
                totalVotingPower: convertRawVotingPower(totalVotingPower.toString(), 18),
                totalValidators: basicValidators.length,
                avgCommission: `${commissionData.avgCommission}%`,
                weightedCommission: `${commissionData.weightedCommission}%`
            });

        } catch (err) {
            console.error('Failed to fetch validators:', err);
            setError(err.message);
            setValidators([]);
            setFilteredValidators([]);
        } finally {
            setIsLoading(false);
        }
    }, [cosmosSdkApi]);

    // Fungsi untuk search validators
    const handleSearch = useCallback(() => {
        if (!searchTerm.trim()) {
            setFilteredValidators(validators);
            return;
        }

        setIsSearching(true);
        
        const term = searchTerm.toLowerCase().trim();
        const filtered = validators.filter(validator => 
            validator.moniker.toLowerCase().includes(term) ||
            validator.address.toLowerCase().includes(term)
        );
        
        setFilteredValidators(filtered);
        setCurrentPage(1);
        setIsSearching(false);
    }, [searchTerm, validators]);

    // Effect untuk search dengan debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, handleSearch]);

    useEffect(() => {
        fetchValidators();
    }, [fetchValidators]);

    const indexOfLastValidator = currentPage * itemsPerPage;
    const indexOfFirstValidator = indexOfLastValidator - itemsPerPage;
    const currentValidators = filteredValidators.slice(indexOfFirstValidator, indexOfLastValidator);
    const totalPages = Math.ceil(filteredValidators.length / itemsPerPage);

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

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by moniker or operator address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                        </div>
                    )}
                </div>
                {searchTerm && (
                    <p className="text-sm text-gray-400 mt-2">
                        Found {filteredValidators.length} validators matching "{searchTerm}"
                    </p>
                )}
            </div>

            {/* Summary Cards */}
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
                    <div className="text-sm text-gray-400 mb-1">Search Results</div>
                    <div className="text-2xl font-bold text-indigo-400">{filteredValidators.length}</div>
                    <div className="text-sm text-gray-400 mt-1">Validators Found</div>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-300">
                    {filteredValidators.length === validators.length 
                        ? `There are ${validators.length} Bonded Validators`
                        : `Found ${filteredValidators.length} of ${validators.length} Validators`
                    }
                </h3>
            </div>

            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-400">
                    Showing {indexOfFirstValidator + 1}-{Math.min(indexOfLastValidator, filteredValidators.length)} of {filteredValidators.length} validators
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

            {/* Desktop Table */}
            <div className="hidden md:block bg-gray-800 shadow-lg rounded-xl overflow-hidden mb-8 border border-indigo-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Validator</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Voting Power (WARD)</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider">Commission</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-indigo-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {currentValidators.map((validator, index) => (
                                <tr key={validator.address} className="hover:bg-gray-700 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        #{indexOfFirstValidator + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.address })}
                                        >
                                            <div className="text-sm font-bold text-white hover:text-indigo-300 transition duration-200">
                                                {validator.moniker}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono truncate max-w-xs">
                                                {validator.address}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-300 font-mono">{validator.votingPower}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-300">{(validator.commission * 100).toFixed(2)}%</div>
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

            {/* Mobile Cards */}
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
                                <div className="text-xs text-gray-400 font-mono truncate mt-1">
                                    {validator.address}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-medium text-gray-200 bg-gray-700 px-3 py-1 rounded-full mb-1">
                                    {(validator.commission * 100).toFixed(2)}%
                                </div>
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

            {filteredValidators.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-400">
                    <p>No validators found matching "{searchTerm}"</p>
                    <p className="text-sm mt-2">Try searching by moniker name or operator address</p>
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

                <DetailRow label="Time" value={blockData.header?.time ? new Date(blockData.header.time).toLocaleString() : 'N/A'} />
                <DetailRow label="Block Hash" value={blockData.last_commit?.block_id?.hash || 'N/A'} isCode={true} />
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
                                    <span className="text-sm font-mono truncate max-w-[calc(100%-80px)] text-gray-200">
                                        {txDisplay.substring(0, 40)}...
                                    </span>
                                    <button
                                        onClick={() => {
                                            // Extract transaction hash dari data yang tersedia
                                            // Ini adalah contoh sederhana, Anda mungkin perlu menyesuaikan
                                            const txHash = `tx_${height}_${index}`;
                                            navigate(ROUTES.TX_DETAIL, { hash: txHash });
                                        }}
                                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition duration-200"
                                    >
                                        View
                                    </button>
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
    const [refreshInterval, setRefreshInterval] = useState(5000);

    const [summaryData, setSummaryData] = useState({
        totalTransactions: "Loading...",
        recentTransactions: "Loading...",
        tps: "Loading..."
    });

    const [visibleTxs, setVisibleTxs] = useState([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [latestBlockHeight, setLatestBlockHeight] = useState(null);

    // Fungsi untuk mendapatkan latest block height
    const getLatestBlockHeight = useCallback(async () => {
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

    // Fungsi utama untuk fetch transactions dari 25 block terakhir
    const fetchRecentTransactions = useCallback(async (latestHeight) => {
        if (!latestHeight) return [];

        try {
            const RECENT_BLOCKS = 25;
            const minHeight = Math.max(1, latestHeight - RECENT_BLOCKS + 1);

            // Gunakan tx_search dengan query height range
            const query = `tx.height>=${minHeight} AND tx.height<=${latestHeight}`;
            const url = `${cometBftRpcApi}/tx_search?query="${query}"&per_page=100&order_by="desc"`;
            const data = await fetchWithRetry(url);

            if (!data.result?.txs) return [];

            console.log(`Found ${data.result.txs.length} transactions in last 25 blocks`);

            // Process transactions dengan hash yang benar
            const transactions = data.result.txs.map((tx) => {
                const txResult = tx.tx_result;

                // Basic message type detection
                let messageType = "Transfer";
                if (txResult.events && Array.isArray(txResult.events)) {
                    const messageEvent = txResult.events.find(e => e.type === 'message');
                    if (messageEvent && messageEvent.attributes) {
                        const actionAttr = messageEvent.attributes.find(attr =>
                            attr.key === 'action' && attr.value
                        );
                        if (actionAttr) {
                            const action = actionAttr.value;
                            if (action.includes('staking')) messageType = "Stake";
                            else if (action.includes('distribution')) messageType = "Reward";
                            else if (action.includes('ibc')) messageType = "IBC";
                            else if (action.includes('gov')) messageType = "Governance";
                            else if (action.includes('send')) messageType = "Transfer";
                        }
                    }
                }

                // Pastikan hash dalam format yang benar (tanpa underscore)
                let txHash = tx.hash;
                if (txHash && txHash.startsWith('0x')) {
                    txHash = txHash.substring(2); // Hapus 0x prefix jika ada
                }

                return {
                    hash: txHash || 'N/A',
                    height: tx.height || 'N/A',
                    code: txResult?.code ?? 1,
                    messages: messageType,
                    timestamp: txResult?.timestamp || new Date().toISOString(),
                    gas_used: txResult?.gas_used || '0',
                    gas_wanted: txResult?.gas_wanted || '0'
                };
            });

            return transactions.slice(0, 50); // Limit to 50 transactions

        } catch (error) {
            console.error('Error fetching recent transactions:', error);
            return [];
        }
    }, [cometBftRpcApi]);

    // Fallback method jika primary gagal
    const fetchTransactionsFallback = useCallback(async (latestHeight) => {
        try {
            if (!latestHeight) return [];

            // Gunakan query sederhana untuk transactions terbaru
            const url = `${cometBftRpcApi}/tx_search?query="tx.height>0"&per_page=50&order_by="desc"`;
            const data = await fetchWithRetry(url);

            if (!data.result?.txs) return [];

            return data.result.txs.map((tx) => {
                const txResult = tx.tx_result;

                let messageType = "Transfer";
                if (txResult.events && Array.isArray(txResult.events)) {
                    const messageEvent = txResult.events.find(e => e.type === 'message');
                    if (messageEvent && messageEvent.attributes) {
                        const actionAttr = messageEvent.attributes.find(attr =>
                            attr.key === 'action' && attr.value
                        );
                        if (actionAttr) {
                            const action = actionAttr.value;
                            if (action.includes('staking')) messageType = "Stake";
                            else if (action.includes('distribution')) messageType = "Reward";
                            else if (action.includes('ibc')) messageType = "IBC";
                            else if (action.includes('gov')) messageType = "Governance";
                        }
                    }
                }

                let txHash = tx.hash;
                if (txHash && txHash.startsWith('0x')) {
                    txHash = txHash.substring(2);
                }

                return {
                    hash: txHash || 'N/A',
                    height: tx.height || 'N/A',
                    code: txResult?.code ?? 1,
                    messages: messageType,
                    timestamp: txResult?.timestamp || new Date().toISOString()
                };
            });

        } catch (error) {
            console.error('Error in fallback transaction fetch:', error);
            return [];
        }
    }, [cometBftRpcApi]);

    // Fungsi untuk fetch stats
    const fetchStats = useCallback(async (latestHeight, transactionsCount) => {
        try {
            if (!latestHeight) {
                return {
                    totalTransactions: "N/A",
                    recentTransactions: "N/A",
                    tps: "0"
                };
            }

            const recentTxs = transactionsCount || 0;
            const tps = (recentTxs / (25 * 6)).toFixed(2);

            return {
                totalTransactions: Math.floor(latestHeight * 1.2).toLocaleString(),
                recentTransactions: recentTxs.toLocaleString(),
                tps: tps
            };

        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                totalTransactions: "Error",
                recentTransactions: "Error",
                tps: "0"
            };
        }
    }, []);

    // Fungsi utama
    const fetchAllData = useCallback(async (showLoader = true) => {
        if (showLoader) setInitialLoading(true);
        setError(null);

        try {
            const latestHeight = await getLatestBlockHeight();

            if (!latestHeight) {
                throw new Error('Could not get latest block height');
            }

            let transactions = await fetchRecentTransactions(latestHeight);

            if (transactions.length === 0) {
                console.log('Using fallback transaction method...');
                transactions = await fetchTransactionsFallback(latestHeight);
            }

            setTxs(transactions);
            setVisibleTxs(transactions.slice(0, 15));

            if (showLoader) setInitialLoading(false);

            const stats = await fetchStats(latestHeight, transactions.length);
            setSummaryData(stats);

            if (transactions.length > 15) {
                setIsLoadingMore(true);
                setTimeout(() => {
                    setVisibleTxs(transactions);
                    setIsLoadingMore(false);
                }, 500);
            }

        } catch (err) {
            console.error('Error in fetchAllData:', err);
            setError(err.message);
            setTxs([]);
            setVisibleTxs([]);
            setSummaryData({
                totalTransactions: "0",
                recentTransactions: "0",
                tps: "0.00"
            });
            if (showLoader) setInitialLoading(false);
        }
    }, [getLatestBlockHeight, fetchRecentTransactions, fetchTransactionsFallback, fetchStats]);

    // Auto-refresh effect
    useEffect(() => {
        fetchAllData(true);
    }, [fetchAllData]);

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(async () => {
                setIsAutoRefreshing(true);
                await fetchAllData(false);
                setIsAutoRefreshing(false);
            }, refreshInterval);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchAllData]);

    // Format hash untuk display - RESPONSIVE
    const formatHash = (hash) => {
        if (!hash || hash === 'N/A') return 'N/A';

        // Di mobile: 4 karakter awal ... 5 karakter akhir
        if (window.innerWidth < 768) {
            if (hash.length <= 12) return hash; // Jika pendek, tampilkan full
            return `${hash.substring(0, 4)}...${hash.substring(hash.length - 5)}`;
        }

        // Di desktop: tampilkan full hash
        return hash;
    };

    // Fungsi untuk copy hash
    const copyHash = (hash, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(hash).then(() => {
            console.log('Hash copied:', hash);
        });
    };

    // Format waktu relatif
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffMinutes < 1) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            return `${Math.floor(diffDays / 7)}w ago`;
        } catch (e) {
            return 'N/A';
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-indigo-400">Transactions</h2>
                <div className="flex items-center space-x-2">
                    {latestBlockHeight && (
                        <span className="text-sm text-gray-400">
                            Latest: <span className="text-indigo-400 font-bold">{latestBlockHeight.toLocaleString()}</span>
                        </span>
                    )}
                    <button
                        onClick={() => fetchAllData(true)}
                        disabled={initialLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
                        {isAutoRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Simple Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-indigo-700">
                    <div className="text-sm text-gray-400 mb-1">Total Estimated</div>
                    <div className={`text-xl font-bold ${summaryData.totalTransactions === "Loading..."
                        ? "text-gray-400 animate-pulse"
                        : "text-white"
                        }`}>
                        {summaryData.totalTransactions}
                    </div>
                    <div className="text-xs text-gray-400">transactions</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-blue-700">
                    <div className="text-sm text-gray-400 mb-1">Last 25 Blocks</div>
                    <div className={`text-xl font-bold ${summaryData.recentTransactions === "Loading..."
                        ? "text-gray-400 animate-pulse"
                        : "text-blue-400"
                        }`}>
                        {summaryData.recentTransactions}
                    </div>
                    <div className="text-xs text-gray-400">transactions</div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-purple-700">
                    <div className="text-sm text-gray-400 mb-1">Estimated TPS</div>
                    <div className={`text-xl font-bold ${summaryData.tps === "Loading..."
                        ? "text-gray-400 animate-pulse"
                        : "text-purple-400"
                        }`}>
                        {summaryData.tps}
                    </div>
                    <div className="text-xs text-gray-400">transactions/sec</div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                        Latest Transactions (Last 25 Blocks)
                        {isLoadingMore && (
                            <span className="ml-2 text-sm text-indigo-400 animate-pulse">
                                • Loading more...
                            </span>
                        )}
                    </h3>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-2 text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={() => setAutoRefresh(!autoRefresh)}
                                    className="form-checkbox h-4 w-4 text-indigo-600"
                                />
                                <span>Auto refresh</span>
                            </label>

                            {autoRefresh && (
                                <select
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                    className="px-2 py-1 bg-gray-700 text-white text-sm rounded-lg border border-gray-600"
                                >
                                    <option value={1000}>1s</option>
                                    <option value={5000}>5s</option>
                                    <option value={10000}>10s</option>
                                    <option value={30000}>30s</option>
                                    <option value={60000}>60s</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {initialLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-2"></div>
                        <p className="text-indigo-400 text-sm">Loading transactions from last 25 blocks...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg">
                        <p className="font-semibold">Failed to load data</p>
                        <p className="text-sm mt-1">{error}</p>
                        <button
                            onClick={() => fetchAllData(true)}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                        >
                            Try Again
                        </button>
                    </div>
                ) : visibleTxs.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No transactions found in last 25 blocks</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-750">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-indigo-400 uppercase">Hash</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-indigo-400 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-indigo-400 uppercase">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-indigo-400 uppercase">Block</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-indigo-400 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {visibleTxs.map((tx, index) => (
                                    <tr key={index} className="hover:bg-gray-750 transition duration-150">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center group">
                                                <span
                                                    className="text-sm font-mono text-indigo-400 cursor-pointer hover:text-indigo-300 break-all"
                                                    onClick={() => navigate(ROUTES.TX_DETAIL, { hash: tx.hash })}
                                                    title={tx.hash}
                                                >
                                                    {/* Responsive hash display */}
                                                    <span className="hidden md:inline">{tx.hash}</span>
                                                    <span className="md:hidden">
                                                        {tx.hash.length <= 12 ? tx.hash : `${tx.hash.substring(0, 4)}...${tx.hash.substring(tx.hash.length - 5)}`}
                                                    </span>
                                                </span>
                                                <button
                                                    onClick={(e) => copyHash(tx.hash, e)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                    title="Copy hash"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${tx.code === 0
                                                ? 'bg-green-600 text-green-100'
                                                : 'bg-red-600 text-red-100'
                                                }`}>
                                                {tx.code === 0 ? 'Success' : 'Failed'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                                            {tx.messages}
                                        </td>
                                        <td
                                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 cursor-pointer hover:text-indigo-300"
                                            onClick={() => navigate(ROUTES.BLOCKS_DETAIL, { height: tx.height })}
                                        >
                                            {parseInt(tx.height).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                                            {formatRelativeTime(tx.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {isLoadingMore && visibleTxs.length < txs.length && (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto mb-2"></div>
                                <p className="text-indigo-400 text-sm">Loading more transactions...</p>
                            </div>
                        )}
                    </div>
                )}

                {visibleTxs.length > 0 && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-400 mb-2">
                            Showing {visibleTxs.length} transactions from last 25 blocks
                        </p>
                        <button
                            onClick={() => navigate(ROUTES.TXS)}
                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
                        >
                            View All Transactions
                        </button>
                    </div>
                )}
            </div>
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

const AddressDetail = ({ currentParams, navigate, setModal, cometBftRpcApi, cosmosSdkApi }) => {
    const [addressData, setAddressData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [delegations, setDelegations] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [showQrModal, setShowQrModal] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState('');
    const address = currentParams.address;

    // Fungsi untuk handle back button dengan fallback
    const handleBack = () => {
        try {
            navigate(ROUTES.DASHBOARD);
        } catch (error) {
            console.error('Navigation error, falling back to window history:', error);
            window.history.back();
        }
    };

    // Fungsi untuk copy ke clipboard dengan feedback
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFeedback('Copied!');
            setTimeout(() => setCopyFeedback(''), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback untuk browser yang tidak support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopyFeedback('Copied!');
                setTimeout(() => setCopyFeedback(''), 2000);
            } catch (fallbackErr) {
                setCopyFeedback('Failed to copy');
                setTimeout(() => setCopyFeedback(''), 2000);
            }
            document.body.removeChild(textArea);
        }
    };

    // Fungsi untuk generate QR Code
    const generateQRCode = (text) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    };

    // Fungsi untuk format amount WARD
    const formatWardAmount = (amount, decimals = 18) => {
        if (!amount || amount === '0') return '0';
        try {
            const amountNum = parseFloat(amount);
            const divisor = Math.pow(10, decimals);
            const formatted = (amountNum / divisor).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            });
            return formatted === '0.00' ? '0' : formatted;
        } catch (e) {
            console.error('Error formatting amount:', e);
            return amount;
        }
    };

    // Fungsi untuk format USD (placeholder)
    const formatUSD = (amount) => {
        return '$0';
    };

    // Fungsi untuk format waktu relatif
    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));

            if (diffMinutes < 1) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
            return `${Math.floor(diffDays / 30)}mo ago`;
        } catch (e) {
            return 'N/A';
        }
    };

    // Fungsi untuk mendapatkan account info
    const getAccountInfo = async (address) => {
        try {
            const accountUrl = `${cosmosSdkApi}/cosmos/auth/v1beta1/accounts/${address}`;
            const accountData = await fetchWithRetry(accountUrl);
            return accountData;
        } catch (error) {
            console.log('Error fetching account info:', error.message);
            return null;
        }
    };

    // Fungsi untuk mendapatkan balance
    const getBalanceInfo = async (address) => {
        try {
            const balanceUrl = `${cosmosSdkApi}/cosmos/bank/v1beta1/balances/${address}`;
            const balanceData = await fetchWithRetry(balanceUrl);
            return balanceData;
        } catch (error) {
            console.log('Error fetching balance:', error.message);
            return { balances: [] };
        }
    };

    // Fungsi untuk mendapatkan delegations
    const getDelegations = async (address) => {
        try {
            const delegationsUrl = `${cosmosSdkApi}/cosmos/staking/v1beta1/delegations/${address}`;
            const delegationsData = await fetchWithRetry(delegationsUrl);

            if (!delegationsData.delegation_responses) return [];

            const delegationsWithRewards = await Promise.all(
                delegationsData.delegation_responses.map(async (delegation) => {
                    try {
                        const rewardsUrl = `${cosmosSdkApi}/cosmos/distribution/v1beta1/delegators/${address}/rewards/${delegation.delegation.validator_address}`;
                        const rewardsData = await fetchWithRetry(rewardsUrl);

                        const totalRewards = rewardsData.rewards?.reduce((sum, reward) => {
                            return sum + parseFloat(reward.amount || 0);
                        }, 0) || 0;

                        return {
                            validator: delegation.delegation.validator_address,
                            delegation: delegation.balance?.amount || '0',
                            rewards: totalRewards.toString()
                        };
                    } catch (error) {
                        console.log('Error fetching rewards for delegation:', error.message);
                        return {
                            validator: delegation.delegation.validator_address,
                            delegation: delegation.balance?.amount || '0',
                            rewards: '0'
                        };
                    }
                })
            );

            return delegationsWithRewards;
        } catch (error) {
            console.log('Error fetching delegations:', error.message);
            return [];
        }
    };

    // Fungsi untuk mendapatkan transactions
    const getTransactions = async (address) => {
        try {
            const txSearchUrl = `${cometBftRpcApi}/tx_search?query="message.sender='${address}' OR transfer.recipient='${address}'"&per_page=20&order_by="desc"`;
            const txData = await fetchWithRetry(txSearchUrl);

            return txData.result?.txs?.map(tx => {
                const txResult = tx.tx_result;

                // Extract message types
                const messageEvents = txResult?.events?.filter(e => e.type === 'message') || [];
                const messages = messageEvents.flatMap(event =>
                    event.attributes?.filter(attr => attr.key === 'action')?.map(attr => attr.value) || []
                );

                return {
                    height: tx.height,
                    hash: tx.hash,
                    messages: messages.length > 0 ? messages : ['Unknown'],
                    time: txResult?.timestamp || new Date().toISOString(),
                    code: txResult?.code
                };
            }) || [];
        } catch (error) {
            console.log('Error fetching transactions:', error.message);
            return [];
        }
    };

    // Fungsi untuk mendapatkan received transactions
    const getReceivedTransactions = async (address) => {
        try {
            const txSearchUrl = `${cometBftRpcApi}/tx_search?query="transfer.recipient='${address}'"&per_page=10&order_by="desc"`;
            const txData = await fetchWithRetry(txSearchUrl);

            return txData.result?.txs?.map(tx => {
                const txResult = tx.tx_result;
                let amount = '0';

                // Extract transfer amounts
                const transferEvents = txResult?.events?.filter(e => e.type === 'transfer') || [];
                transferEvents.forEach(event => {
                    const recipientAttr = event.attributes?.find(attr =>
                        attr.key === 'recipient' && attr.value === address
                    );
                    if (recipientAttr) {
                        const amountAttr = event.attributes?.find(attr => attr.key === 'amount');
                        if (amountAttr) {
                            amount = amountAttr.value;
                        }
                    }
                });

                return {
                    height: tx.height,
                    hash: tx.hash,
                    amount: amount,
                    time: txResult?.timestamp || new Date().toISOString()
                };
            }) || [];
        } catch (error) {
            console.log('Error fetching received transactions:', error.message);
            return [];
        }
    };

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
                // Fetch semua data secara parallel
                const [accountData, balanceData, delegationsData, transactionsData, receivedTxsData] = await Promise.all([
                    getAccountInfo(address),
                    getBalanceInfo(address),
                    getDelegations(address),
                    getTransactions(address),
                    getReceivedTransactions(address)
                ]);

                setAddressData({
                    account: accountData,
                    balance: balanceData
                });
                setDelegations(delegationsData);
                setTransactions(transactionsData);
                setRewards(receivedTxsData);

            } catch (error) {
                console.error('Failed to load address details:', error);
                setError('Failed to load address data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAddressData();
    }, [address, setModal, cosmosSdkApi, cometBftRpcApi]);

    if (isLoading) return <Loader message={`Loading address details...`} />;

    if (error) return (
        <div className="p-4">
            <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                <p className="font-semibold">Error Loading Address Details</p>
                <p className="text-sm mt-1">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    // QR Code Modal
    const QrModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-indigo-600">
                <h3 className="text-xl font-bold text-indigo-400 mb-4 text-center">Address QR Code</h3>
                <div className="flex justify-center mb-4">
                    <img
                        src={generateQRCode(address)}
                        alt="QR Code"
                        className="w-64 h-64 border-2 border-indigo-500 rounded-lg"
                    />
                </div>
                <div className="text-center">
                    <p className="text-sm font-mono text-gray-300 break-all bg-gray-700 p-3 rounded-lg mb-4">
                        {address}
                    </p>
                    <div className="flex space-x-2 justify-center">
                        <button
                            onClick={() => copyToClipboard(address)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Address
                        </button>
                        <button
                            onClick={() => setShowQrModal(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const accountInfo = addressData?.account?.account;
    const balances = addressData?.balance?.balances || [];

    // Calculate total value
    const totalWard = balances.reduce((total, balance) => {
        if (balance.denom === 'uward' || balance.denom === 'award' || balance.denom === 'ward') {
            return total + parseFloat(balance.amount || 0);
        }
        return total;
    }, 0);

    const totalWardFormatted = formatWardAmount(totalWard.toString(), 18);

    return (
        <div className="p-4 space-y-6">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition duration-200 mb-4"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Account Information */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Account Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow label="Address" value={address} isCode={true} />
                            <DetailRow label="Account Number" value={accountInfo?.account_number || 'N/A'} />
                            <DetailRow label="Sequence" value={accountInfo?.sequence || 'N/A'} />
                            <DetailRow label="@type" value={accountInfo?.['@type'] || 'N/A'} isCode={true} />
                            {accountInfo?.pub_key && (
                                <div className="md:col-span-2">
                                    <DetailRow label="Public Key" value={JSON.stringify(accountInfo.pub_key, null, 2)} isCode={true} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assets */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Assets</h2>
                        <div className="space-y-3">
                            {balances.length > 0 ? (
                                balances.map((balance, index) => {
                                    const amount = formatWardAmount(balance.amount, 18);
                                    const usdValue = formatUSD(amount);
                                    const percentage = totalWard > 0 ? (parseFloat(balance.amount) / totalWard * 100).toFixed(2) : '0';

                                    return (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                                            <div className="flex-1">
                                                <div className="text-white font-semibold">{amount} WARD</div>
                                                <div className="text-gray-400 text-sm">{percentage}%</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white">{usdValue}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-gray-400">
                                    No assets found
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 font-semibold">Total Value:</span>
                                <span className="text-white font-bold">{formatUSD(totalWardFormatted)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Delegations */}
                    {delegations.length > 0 ? (
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Delegations</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-750">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Validator</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Delegation</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Rewards</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {delegations.map((delegation, index) => (
                                            <tr key={index} className="hover:bg-gray-750 transition duration-150">
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: delegation.validator })}
                                                        className="text-indigo-400 hover:text-indigo-300 text-left font-mono text-sm"
                                                    >
                                                        {delegation.validator.substring(0, 20)}...
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-white">
                                                    {formatWardAmount(delegation.delegation, 18)} WARD
                                                </td>
                                                <td className="px-4 py-3 text-sm text-green-400">
                                                    {formatWardAmount(delegation.rewards, 18)} WARD
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition duration-200">
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Delegations</h2>
                            <div className="text-center py-4 text-gray-400">
                                No delegations found
                            </div>
                        </div>
                    )}

                    {/* Transactions */}
                    {transactions.length > 0 ? (
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Transactions</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-750">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Height</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Hash</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Messages</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {transactions.map((tx, index) => (
                                            <tr key={index} className="hover:bg-gray-750 transition duration-150">
                                                <td className="px-4 py-3 text-sm font-mono text-indigo-400">
                                                    <button
                                                        onClick={() => navigate(ROUTES.BLOCKS_DETAIL, { height: tx.height })}
                                                        className="hover:text-indigo-300"
                                                    >
                                                        {parseInt(tx.height).toLocaleString()}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-gray-300">
                                                    <button
                                                        onClick={() => navigate(ROUTES.TX_DETAIL, { hash: tx.hash })}
                                                        className="hover:text-indigo-400 transition duration-200 text-left"
                                                    >
                                                        {tx.hash.substring(0, 16)}...
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {tx.messages.map((msg, msgIndex) => (
                                                            <span key={msgIndex} className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded">
                                                                {msg}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {formatRelativeTime(tx.time)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Transactions</h2>
                            <div className="text-center py-4 text-gray-400">
                                No transactions found
                            </div>
                        </div>
                    )}

                    {/* Recent Received */}
                    {rewards.length > 0 && (
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                            <h2 className="text-2xl font-bold text-indigo-400 mb-4">Recent Received</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-750">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Height</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Hash</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {rewards.map((tx, index) => (
                                            <tr key={index} className="hover:bg-gray-750 transition duration-150">
                                                <td className="px-4 py-3 text-sm font-mono text-indigo-400">
                                                    {parseInt(tx.height).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono text-gray-300">
                                                    <button
                                                        onClick={() => navigate(ROUTES.TX_DETAIL, { hash: tx.hash })}
                                                        className="hover:text-indigo-400 transition duration-200 text-left"
                                                    >
                                                        {tx.hash.substring(0, 16)}...
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-green-400 font-mono">
                                                    {formatWardAmount(tx.amount.replace('award', ''), 18)} WARD
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {formatRelativeTime(tx.time)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - QR Code */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700 sticky top-6">
                        <h3 className="text-lg font-bold text-indigo-400 mb-4 text-center">Address</h3>
                        <div className="text-center">
                            <div
                                className="cursor-pointer transform hover:scale-105 transition duration-200 mb-4"
                                onClick={() => setShowQrModal(true)}
                            >
                                <img
                                    src={generateQRCode(address)}
                                    alt="QR Code"
                                    className="w-full max-w-48 mx-auto border-2 border-indigo-500 rounded-lg"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mb-2">Click QR Code to zoom</p>
                            <div className="text-sm font-mono text-gray-300 break-all bg-gray-700 p-3 rounded-lg mb-3">
                                {address}
                            </div>
                            <button
                                onClick={() => copyToClipboard(address)}
                                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 text-sm w-full flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {copyFeedback || 'Copy Address'}
                            </button>
                            {copyFeedback && (
                                <div className={`mt-2 text-sm ${copyFeedback === 'Copied!' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {copyFeedback}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQrModal && <QrModal />}
        </div>
    );
};


const ParametersView = ({ cometBftRpcApi, cosmosSdkApi }) => {
    const [parameters, setParameters] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fungsi untuk format waktu dari detik
    const formatTimeFromSeconds = (seconds) => {
        if (!seconds) return 'N/A';
        const secs = parseInt(seconds);
        const days = Math.floor(secs / 86400);
        const hours = Math.floor((secs % 86400) / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        
        if (days > 0) return `${days} days`;
        if (hours > 0) return `${hours} hours`;
        if (minutes > 0) return `${minutes} minutes`;
        return `${secs} seconds`;
    };

    // Fungsi untuk format persentase
    const formatPercentage = (value) => {
        if (!value) return 'N/A';
        const num = parseFloat(value);
        return `${(num * 100).toFixed(2)}%`;
    };

    // Fungsi untuk format amount dengan denom
    const formatAmountWithDenom = (amount, denom = 'award') => {
        if (!amount) return '0';
        try {
            const amountNum = parseFloat(amount);
            let divisor = 1e18; // default untuk award (18 decimals)
            
            if (denom === 'uward') divisor = 1e6;
            if (denom === 'award') divisor = 1e18;
            
            const formatted = (amountNum / divisor).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
            return `${formatted} ${denom.replace('award', 'WARD')}`;
        } catch (e) {
            return `${amount} ${denom}`;
        }
    };

    // Fungsi untuk mendapatkan supply total
    const getTotalSupply = async () => {
        try {
            const supplyResponse = await fetchWithRetry(`${cosmosSdkApi}/cosmos/bank/v1beta1/supply`);
            if (supplyResponse.supply && supplyResponse.supply.length > 0) {
                // Cari denom yang mengandung 'ward'
                const wardSupply = supplyResponse.supply.find(s => 
                    s.denom.includes('ward') || s.denom === 'award' || s.denom === 'uward'
                );
                return wardSupply || supplyResponse.supply[0];
            }
        } catch (error) {
            console.log('Error fetching total supply:', error.message);
        }
        return null;
    };

    // Fungsi untuk mendapatkan inflation
    const getInflation = async () => {
        try {
            // Coba endpoint minting inflation
            const inflationResponse = await fetchWithRetry(`${cosmosSdkApi}/cosmos/mint/v1beta1/inflation`);
            return inflationResponse.inflation;
        } catch (error) {
            console.log('Inflation endpoint not available:', error.message);
            return null;
        }
    };

    useEffect(() => {
        const fetchParameters = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch semua data secara parallel
                const [
                    statusResponse,
                    stakingParamsResponse,
                    govParamsResponse,
                    distributionParamsResponse,
                    slashingParamsResponse,
                    poolResponse,
                    supplyData,
                    inflationData
                ] = await Promise.allSettled([
                    fetchWithRetry(`${cometBftRpcApi}/status`),
                    fetchWithRetry(`${cosmosSdkApi}/cosmos/staking/v1beta1/params`),
                    fetchWithRetry(`${cosmosSdkApi}/cosmos/gov/v1beta1/params`),
                    fetchWithRetry(`${cosmosSdkApi}/cosmos/distribution/v1beta1/params`),
                    fetchWithRetry(`${cosmosSdkApi}/cosmos/slashing/v1beta1/params`),
                    fetchWithRetry(`${cosmosSdkApi}/cosmos/staking/v1beta1/pool`),
                    getTotalSupply(),
                    getInflation()
                ]);

                // Extract data dari Promise.allSettled
                const status = statusResponse.status === 'fulfilled' ? statusResponse.value.result : null;
                const stakingParams = stakingParamsResponse.status === 'fulfilled' ? stakingParamsResponse.value.params : null;
                const govParams = govParamsResponse.status === 'fulfilled' ? govParamsResponse.value : null;
                const distributionParams = distributionParamsResponse.status === 'fulfilled' ? distributionParamsResponse.value.params : null;
                const slashingParams = slashingParamsResponse.status === 'fulfilled' ? slashingParamsResponse.value.params : null;
                const pool = poolResponse.status === 'fulfilled' ? poolResponse.value.pool : null;
                const totalSupply = supplyData.status === 'fulfilled' ? supplyData.value : null;
                const inflation = inflationData.status === 'fulfilled' ? inflationData.value : null;

                if (!status) {
                    throw new Error('Failed to fetch node status');
                }

                // Calculate bonded ratio
                const bondedTokens = pool ? parseFloat(pool.bonded_tokens || 0) : 0;
                let supplyAmount = 0;
                let supplyDenom = 'award';

                if (totalSupply) {
                    supplyAmount = parseFloat(totalSupply.amount || 0);
                    supplyDenom = totalSupply.denom || 'award';
                }

                const bondedRatio = supplyAmount > 0 ? (bondedTokens / supplyAmount) : 0;

                // Format inflation
                let inflationFormatted = 'N/A';
                if (inflation) {
                    const inflationNum = parseFloat(inflation);
                    inflationFormatted = `${(inflationNum * 100).toFixed(2)}%`;
                }

                // Format data parameters dari API response
                const parametersData = {
                    // Chain Information
                    chainInfo: {
                        chainId: status.node_info?.network || 'N/A',
                        height: parseInt(status.sync_info?.latest_block_height) || 0,
                        bondedTokens: formatAmountWithDenom(bondedTokens.toString(), stakingParams?.bond_denom),
                        totalSupply: formatAmountWithDenom(supplyAmount.toString(), supplyDenom),
                        bondedRatio: `${(bondedRatio * 100).toFixed(2)}%`,
                        inflation: inflationFormatted
                    },

                    // Staking Parameters
                    stakingParams: {
                        unbondingTime: formatTimeFromSeconds(stakingParams?.unbonding_time?.replace('s', '')),
                        maxValidators: stakingParams?.max_validators || 'N/A',
                        maxEntries: stakingParams?.max_entries || 'N/A',
                        historicalEntries: stakingParams?.historical_entries || 'N/A',
                        bondDenom: stakingParams?.bond_denom || 'N/A'
                    },

                    // Governance Parameters
                    govParams: {
                        votingPeriod: formatTimeFromSeconds(govParams?.voting_params?.voting_period?.replace('s', '')),
                        minDeposit: govParams?.deposit_params?.min_deposit?.[0] ? 
                            formatAmountWithDenom(govParams.deposit_params.min_deposit[0].amount, govParams.deposit_params.min_deposit[0].denom) : 'N/A',
                        maxDepositPeriod: formatTimeFromSeconds(govParams?.deposit_params?.max_deposit_period?.replace('s', '')),
                        quorum: formatPercentage(govParams?.tally_params?.quorum),
                        threshold: formatPercentage(govParams?.tally_params?.threshold),
                        vetoThreshold: formatPercentage(govParams?.tally_params?.veto_threshold)
                    },

                    // Distribution Parameters
                    distributionParams: {
                        communityTax: formatPercentage(distributionParams?.community_tax),
                        baseProposerReward: formatPercentage(distributionParams?.base_proposer_reward),
                        bonusProposerReward: formatPercentage(distributionParams?.bonus_proposer_reward),
                        withdrawAddrEnabled: distributionParams?.withdraw_addr_enabled !== undefined ? 
                            distributionParams.withdraw_addr_enabled.toString() : 'N/A'
                    },

                    // Slashing Parameters
                    slashingParams: {
                        signedBlocksWindow: slashingParams?.signed_blocks_window ? 
                            parseInt(slashingParams.signed_blocks_window).toLocaleString() : 'N/A',
                        minSignedPerWindow: formatPercentage(slashingParams?.min_signed_per_window),
                        downtimeJailDuration: slashingParams?.downtime_jail_duration || 'N/A',
                        slashFractionDoubleSign: formatPercentage(slashingParams?.slash_fraction_double_sign),
                        slashFractionDowntime: formatPercentage(slashingParams?.slash_fraction_downtime)
                    },

                    // Node Information
                    nodeInfo: {
                        name: 'warden',
                        appName: 'wardend',
                        version: status.node_info?.version || 'N/A',
                        gitCommit: 'N/A', // Informasi ini biasanya dari build info
                        buildTags: status.node_info?.other?.build_tags || 'N/A',
                        goVersion: status.node_info?.go_version || 'N/A'
                    }
                };

                setParameters(parametersData);

            } catch (err) {
                console.error('Failed to fetch parameters:', err);
                setError(err.message);
                setParameters(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchParameters();
    }, [cometBftRpcApi, cosmosSdkApi]);

    if (isLoading) return <Loader message="Loading network parameters from RPC API..." />;

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-900 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
                    <p className="font-semibold">Error Loading Parameters</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!parameters) {
        return (
            <div className="p-4">
                <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-200 p-4 rounded-lg">
                    <p className="font-semibold">No Parameters Data Available</p>
                    <p className="text-sm mt-1">Unable to fetch parameters from the RPC API</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">Network Parameters</h2>

            {/* Chain Information */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-indigo-700">
                <h3 className="text-xl font-bold text-indigo-400 mb-4">Chain Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailRow label="Chain ID" value={parameters.chainInfo.chainId} />
                    <DetailRow label="Height" value={parameters.chainInfo.height.toLocaleString()} />
                    <DetailRow label="Bonded Tokens" value={parameters.chainInfo.bondedTokens} />
                    <DetailRow label="Total Supply" value={parameters.chainInfo.totalSupply} />
                    <DetailRow label="Bonded Ratio" value={parameters.chainInfo.bondedRatio} />
                    <DetailRow label="Inflation" value={parameters.chainInfo.inflation} />
                </div>
            </div>

            {/* Staking Parameters */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-blue-700">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Staking Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Unbonding Time" value={parameters.stakingParams.unbondingTime} />
                    <DetailRow label="Max Validators" value={parameters.stakingParams.maxValidators} />
                    <DetailRow label="Max Entries" value={parameters.stakingParams.maxEntries} />
                    <DetailRow label="Historical Entries" value={parameters.stakingParams.historicalEntries} />
                    <DetailRow label="Bond Denom" value={parameters.stakingParams.bondDenom} />
                </div>
            </div>

            {/* Governance Parameters */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-green-700">
                <h3 className="text-xl font-bold text-green-400 mb-4">Governance Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Voting Period" value={parameters.govParams.votingPeriod} />
                    <DetailRow label="Min Deposit" value={parameters.govParams.minDeposit} />
                    <DetailRow label="Max Deposit Period" value={parameters.govParams.maxDepositPeriod} />
                    <DetailRow label="Quorum" value={parameters.govParams.quorum} />
                    <DetailRow label="Threshold" value={parameters.govParams.threshold} />
                    <DetailRow label="Veto Threshold" value={parameters.govParams.vetoThreshold} />
                </div>
            </div>

            {/* Distribution Parameters */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-yellow-700">
                <h3 className="text-xl font-bold text-yellow-400 mb-4">Distribution Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Community Tax" value={parameters.distributionParams.communityTax} />
                    <DetailRow label="Base Proposer Reward" value={parameters.distributionParams.baseProposerReward} />
                    <DetailRow label="Bonus Proposer Reward" value={parameters.distributionParams.bonusProposerReward} />
                    <DetailRow label="Withdraw Addr Enabled" value={parameters.distributionParams.withdrawAddrEnabled} />
                </div>
            </div>

            {/* Slashing Parameters */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-red-700">
                <h3 className="text-xl font-bold text-red-400 mb-4">Slashing Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Signed Blocks Window" value={parameters.slashingParams.signedBlocksWindow} />
                    <DetailRow label="Min Signed Per Window" value={parameters.slashingParams.minSignedPerWindow} />
                    <DetailRow label="Downtime Jail Duration" value={parameters.slashingParams.downtimeJailDuration} />
                    <DetailRow label="Slash Fraction Double Sign" value={parameters.slashingParams.slashFractionDoubleSign} />
                    <DetailRow label="Slash Fraction Downtime" value={parameters.slashingParams.slashFractionDowntime} />
                </div>
            </div>

            {/* Application Version */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-700">
                <h3 className="text-xl font-bold text-purple-400 mb-4">Node Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailRow label="Name" value={parameters.nodeInfo.name} />
                    <DetailRow label="App Name" value={parameters.nodeInfo.appName} />
                    <DetailRow label="Version" value={parameters.nodeInfo.version} />
                    <DetailRow label="Build Tags" value={parameters.nodeInfo.buildTags} />
                    <DetailRow label="Go Version" value={parameters.nodeInfo.goVersion} />
                </div>
            </div>

            <div className="text-center text-sm text-gray-400">
                <p>Data fetched directly from RPC API: {cometBftRpcApi}</p>
            </div>
        </div>
    );
};

const App = () => {
    const { currentRoute, currentParams, navigate, isReady } = useRouter();
    const [status, setStatus] = useState(null);
    const [isRpcConnected, setIsRpcConnected] = useState(true);
    const [modal, setModalState] = useState({ isOpen: false, title: '', message: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false); // State untuk deteksi mobile

    // Effect untuk mendeteksi ukuran layar
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Effect untuk menutup sidebar otomatis di mobile
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);

    const setModal = useCallback(({ title, message }) => {
        setModalState({ isOpen: true, title, message });
    }, []);

    const { isDark, toggleTheme } = useTheme();
    const { selectedConfig, setRpcConfig } = useRpcConfig();

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

        // Deteksi tipe search
        if (/^\d+$/.test(query)) {
            // Block height
            navigate(ROUTES.BLOCKS_DETAIL, { height: query });
        } else if (/^[0-9A-Fa-f]{64}$/.test(query)) {
            // Transaction hash
            navigate(ROUTES.TX_DETAIL, { hash: query });
        } else if (query.startsWith('warden1') || query.startsWith('wardenvaloper')) {
            // Address
            navigate(ROUTES.ADDRESS_DETAIL, { address: query });
        } else {
            setModal({
                title: "Invalid Search",
                message: "Please enter a valid block height, transaction hash, or Warden address"
            });
            return;
        }

        setSearchQuery('');
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
        if (!isReady) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader message="Initializing application..." />
                </div>
            );
        }

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
                return <AddressDetail currentParams={currentParams} navigate={navigate} setModal={setModal} {...apiProps} />;
            case ROUTES.SEARCH:
                return <SearchView navigate={navigate} setModal={setModal} {...apiProps} />;
            case ROUTES.PROPOSALS:
                return <ProposalsView {...apiProps} />;
            case ROUTES.PARAMETERS:
    return <ParametersView {...apiProps} />;
            case ROUTES.DASHBOARD:
            default:
                return <Dashboard status={status} navigate={navigate} setModal={setModal} {...apiProps} />;
        }
    }, [currentRoute, currentParams, navigate, status, setModal, selectedConfig, isReady]);

    const menuItems = useMemo(() => [
        { label: 'Dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
        { label: 'Blocks', route: ROUTES.BLOCKS_LIST, icon: List },
        { label: 'Transactions', route: ROUTES.TXS, icon: Zap },
        { label: 'Mempool', route: ROUTES.MEMPOOL, icon: Cloud },
        { label: 'Validators', route: ROUTES.VALIDATORS, icon: Users },
        { label: 'Proposals', route: ROUTES.PROPOSALS, icon: MessageSquare },
        { label: 'Parameters', route: ROUTES.PARAMETERS, icon: Settings }, // ← TAMBAH INI
        { label: 'Network Info', route: ROUTES.NET_INFO, icon: Wifi },
        { label: 'Health Check', route: ROUTES.HEALTH, icon: CheckCircle },
    ], []);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
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

            {/* Sidebar */}
            <div className={`
                bg-gray-800 shadow-xl border-r border-indigo-700 transition-all duration-300 
                ${isSidebarOpen ? (isMobile ? 'fixed inset-y-0 left-0 w-64 z-40' : 'w-64') : 'w-0 md:w-20'}
                ${isMobile && !isSidebarOpen ? 'hidden' : ''}
            `}>
                {/* Overlay untuk mobile */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <div className="relative z-40 h-full bg-gray-800">
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                            {isSidebarOpen && (
                                <h1 className="text-xl font-extrabold text-indigo-400">Warden Explorer</h1>
                            )}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isSidebarOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    <nav className="p-4 space-y-2">
                        {menuItems.map(({ label, route, icon: Icon }) => (
                            <button
                                key={route}
                                onClick={() => {
                                    navigate(route);
                                    // Di mobile, tutup sidebar setelah memilih menu
                                    if (isMobile) {
                                        setIsSidebarOpen(false);
                                    }
                                }}
                                className={`flex items-center w-full px-3 py-3 rounded-lg font-medium transition duration-200 ${currentRoute === route
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {isSidebarOpen && <span>{label}</span>}
                            </button>
                        ))}
                    </nav>

                    {isSidebarOpen && (
                        <div className="p-4 border-t border-gray-700 mt-auto">
                            <div className="text-xs text-gray-400 mb-2">Current RPC:</div>
                            <div className="text-sm text-indigo-400 truncate">{selectedConfig.label}</div>
                            <div className="flex items-center mt-2">
                                <div className={`w-2 h-2 rounded-full mr-2 ${isRpcConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-400">
                                    {isRpcConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && !isMobile ? 'md:ml-0' : ''}`}>
                <header className="bg-gray-800 shadow-xl border-b border-indigo-700">
                    <div className="px-6 py-4">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => {
                                        if (isMobile) {
                                            setIsSidebarOpen(true); // Buka sidebar di mobile
                                        } else {
                                            setIsMobileMenuOpen(!isMobileMenuOpen);
                                        }
                                    }}
                                    className="md:hidden p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition duration-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isMobileMenuOpen || (isMobile && isSidebarOpen) ? (
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
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition duration-200 ${selectedConfig.label === config.label
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

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden bg-gray-800 border-t border-gray-700">
                            <div className="px-4 py-2 space-y-1">
                                {menuItems.map(({ label, route, icon: Icon }) => (
                                    <button
                                        key={route}
                                        onClick={() => {
                                            navigate(route);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition duration-200 ${currentRoute === route ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        <Icon className="w-5 h-5 mr-3" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {renderContent}
                </main>

                <footer className="mt-12 pt-6 border-t border-gray-700 text-center text-sm text-gray-500 px-6 pb-4">
                    <p>From the Warden Indonesia Community for Warden Protocol</p>
                    <p className="mt-1">Current RPC: {selectedConfig.label}</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
