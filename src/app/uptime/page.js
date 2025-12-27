"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, ChevronsDown } from 'lucide-react';
import { fetchWithRetry, convertRawVotingPower } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

const INITIAL_VISIBLE_COUNT = 15;
const LOAD_MORE_STEP = 15;
const BLOCK_TIME = 5000;

const REFRESH_INTERVALS = {
    'off': 0,
    'auto': null,
    '5s': 5000,
    '10s': 10000,
    '30s': 30000,
    '60s': 60000
};

const BlockPattern = ({ patternWithHeights, blockRange, onBlockClick }) => {
    return (
        <div className="flex flex-wrap gap-0.5 justify-center">
            {patternWithHeights.map((p, i) => (
                <div
                    key={`${p.height}-${i}`}
                    title={`Block #${p.height}: ${p.signed ? 'Signed' : 'Missed'} (${new Date(p.timestamp).toLocaleTimeString()})`}
                    className={`w-1.5 h-4 cursor-pointer hover:scale-125 transition-transform rounded-sm ${p.signed ? 'bg-green-500' : 'bg-red-500'}`}
                    onClick={(e) => { e.stopPropagation(); onBlockClick(p.height); }}
                />
            ))}
        </div>
    );
};

export default function UptimePage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState('auto');
    const [filterStatus, setFilterStatus] = useState('all');
    const [blockRange, setBlockRange] = useState(100);
    const [latestBlockHeight, setLatestBlockHeight] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [blockDataLoaded, setBlockDataLoaded] = useState(false);
    const [lastProcessedBlock, setLastProcessedBlock] = useState(0);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
    const [slashingParams, setSlashingParams] = useState(null);
    const [signedBlocksWindow, setSignedBlocksWindow] = useState(10000);
    
    const blockCache = useMemo(() => new Map(), []);

    const getAutoRefreshInterval = () => {
        if (autoRefreshInterval === 'auto') {
            return BLOCK_TIME + 1000;
        }
        return REFRESH_INTERVALS[autoRefreshInterval] || 0;
    };

    /**
     * Derives consensus address correctly.
     * CometBFT often uses a hex address derived from the pubkey hash.
     */
    const deriveValcons = async (consensus_pubkey) => {
        if (!consensus_pubkey || !consensus_pubkey.key) return null;
        try {
            const keyString = atob(consensus_pubkey.key);
            const keyBuf = new Uint8Array(keyString.length);
            for (let i = 0; i < keyString.length; i++) {
                keyBuf[i] = keyString.charCodeAt(i);
            }
            // Follow Cosmos SDK standard for Ed25519 PubKey
            const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuf);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            // Validator address is the first 20 bytes of SHA256(pubkey)
            return hashArray.slice(0, 20).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        } catch (e) {
            return null;
        }
    };

    const fetchValidatorSigningInfo = async (valcons) => {
        if (!valcons) return null;
        try {
            // We may need to convert hex back to bech32 here if required,
            // but typically the signing_infos API accepts bech32 valcons.
            // For simplicity, we assume valcons is already valid or handled in loadInitialData
            const url = `${selectedConfig.COSMOS_SDK_API}/cosmos/slashing/v1beta1/signing_infos/${valcons}`;
            const data = await fetchWithRetry(url);
            return data.val_signing_info;
        } catch (e) {
            return null;
        }
    };

    const fetchSlashingParams = async () => {
        try {
            const data = await fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/slashing/v1beta1/params`);
            if (data?.params) {
                setSlashingParams(data.params);
                const window = parseInt(data.params.signed_blocks_window || '10000', 10) || 10000;
                setSignedBlocksWindow(window);
            }
        } catch (error) {
            setSignedBlocksWindow(10000);
        }
    };

    const fetchAllValidators = async () => {
        const validators = [];
        let nextKey = null;

        try {
            do {
                const params = nextKey
                    ? `?pagination.key=${encodeURIComponent(nextKey)}`
                    : `?pagination.limit=300`;

                const url = `${selectedConfig.COSMOS_SDK_API}/cosmos/staking/v1beta1/validators${params}`;
                const data = await fetchWithRetry(url);

                if (Array.isArray(data.validators)) {
                    for (const v of data.validators) {
                        const valconsHex = await deriveValcons(v.consensus_pubkey);

                        validators.push({
                            moniker: v.description?.moniker || v.moniker || "unknown",
                            operator_address: v.operator_address,
                            jailed: !!v.jailed,
                            status: v.status,
                            tokens: v.tokens,
                            consensus_pubkey: v.consensus_pubkey,
                            valconsHex: valconsHex, // Used to match blocks
                            patternWithHeights: [],
                            counts: { signed: 0, missed: 0 },
                            uptime: "0.00",
                            isActive: v.status === 'BOND_STATUS_BONDED' && !v.jailed,
                            isJailed: v.jailed,
                            isUnbonding: v.status === 'BOND_STATUS_UNBONDING',
                            isUnbonded: v.status === 'BOND_STATUS_UNBONDED',
                            signingInfo: null,
                        });
                    }
                }
                nextKey = data.pagination?.next_key;
            } while (nextKey);
        } catch (e) {
            throw new Error(`Failed to fetch validator data: ${e.message}`);
        }
        return validators;
    };

    const getNodeStatus = async () => {
        const data = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`);
        return data.result;
    };

    const getBlockByHeight = async (height) => {
        if (blockCache.has(height)) return blockCache.get(height);
        try {
            const data = await fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/block?height=${height}`);
            if (blockCache.size > 200) {
                const firstKey = blockCache.keys().next().value;
                if (firstKey) blockCache.delete(firstKey);
            }
            blockCache.set(height, data.result);
            return data.result;
        } catch (error) {
            throw error;
        }
    };

    const calculateUptime = (signed, missed) => {
        const total = signed + missed;
        if (total === 0) return "0.00";
        return ((signed / total) * 100).toFixed(2);
    }

    /**
     * Processes block data to determine who signed.
     */
    const processBlockData = (blockRes, validators) => {
        const block = blockRes.block;
        const lastCommit = block.last_commit || {};
        const sigs = Array.isArray(lastCommit.signatures) ? lastCommit.signatures : [];
        const currentBlockRange = Number(blockRange);

        // Collect all addresses that signed this block
        const signedAddresses = new Set();
        sigs.forEach(s => {
            // Flag 2 means BLOCK_ID_FLAG_COMMIT (already signed)
            if (s.block_id_flag === 2 || (s.signature && s.signature.length > 0)) {
                if (s.validator_address) {
                    signedAddresses.add(s.validator_address.toUpperCase());
                }
            }
        });

        validators.forEach((v) => {
            // Only track uptime for active (Bonded) validators
            if (!v.isActive && v.patternWithHeights.length === 0) return;

            const isSigned = v.valconsHex ? signedAddresses.has(v.valconsHex) : false;

            // Add to pattern
            v.patternWithHeights.push({
                height: parseInt(block.header.height),
                signed: isSigned,
                timestamp: block.header?.time
            });

            // Update counts (manual sliding window)
            if (isSigned) v.counts.signed++;
            else v.counts.missed++;

            if (v.patternWithHeights.length > currentBlockRange) {
                const removed = v.patternWithHeights.shift();
                if (removed.signed) v.counts.signed--;
                else v.counts.missed--;
            }

            v.uptime = calculateUptime(v.counts.signed, v.counts.missed);
        });
    };

    const loadInitialData = async () => {
        if (!selectedConfig) return;
        setLoading(true);
        setError(null);
        setVisibleCount(INITIAL_VISIBLE_COUNT);
        try {
            await fetchSlashingParams();
            const validators = await fetchAllValidators();

            validators.sort((a, b) => {
                const powerA = BigInt(a.tokens || '0');
                const powerB = BigInt(b.tokens || '0');
                return powerB > powerA ? 1 : -1;
            });

            // Fetch Signing Info for Slashing Window status (total missed across window)
            // Note: Requires proper address prefix
            const signingInfoPromises = validators.map(v => {
                if (!v.isActive) return Promise.resolve(null);
                // We try to fetch bech32 consensus address if utility available;
                // otherwise we skip this part to avoid crashing.
                return Promise.resolve(null); 
            });
            
            await Promise.all(signingInfoPromises);

            const status = await getNodeStatus();
            const latest = parseInt(status.sync_info.latest_block_height, 10);

            setLatestBlockHeight(latest);
            setLastUpdateTime(new Date());
            setLastProcessedBlock(latest - 1); // Start from block before latest

            setResults(validators);
            setBlockDataLoaded(true);
            setLoading(false);

            // Trigger processing of recent blocks immediately after load
            const initialBlocksToScan = Math.min(latest, 10); 
            for (let i = latest - initialBlocksToScan; i <= latest; i++) {
                try {
                    const b = await getBlockByHeight(i);
                    processBlockData(b, validators);
                } catch(e){}
            }
            setResults([...validators]);
            setLastProcessedBlock(latest);

        } catch (e) {
            setError(e.message);
            setLoading(false);
        } finally {
            setIsRefreshing(false);
        }
    };

    const incrementalUpdate = async () => {
        if (!blockDataLoaded || isRefreshing || !selectedConfig) return;

        setIsRefreshing(true);
        try {
            const status = await getNodeStatus();
            const currentLatest = parseInt(status.sync_info.latest_block_height, 10);

            if (currentLatest <= lastProcessedBlock) {
                setIsRefreshing(false);
                return;
            }

            const updatedValidators = [...results];
            let lastH = lastProcessedBlock;

            // Limit scan range if significantly behind
            const startH = Math.max(lastProcessedBlock + 1, currentLatest - 50);

            for (let h = startH; h <= currentLatest; h++) {
                try {
                    const blockRes = await getBlockByHeight(h);
                    processBlockData(blockRes, updatedValidators);
                    lastH = h;
                } catch (err) {
                    console.warn(`Failed to process block ${h}`, err);
                }
            }

            setLatestBlockHeight(currentLatest);
            setLastUpdateTime(new Date());
            setResults(updatedValidators);
            setLastProcessedBlock(lastH);

        } catch (error) {
            console.error(error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            loadInitialData();
        }
    }, [isLoaded, selectedConfig]);

    useEffect(() => {
        let intervalId;
        const interval = getAutoRefreshInterval();

        if (interval > 0 && blockDataLoaded) {
            intervalId = setInterval(incrementalUpdate, interval);
        }
        return () => clearInterval(intervalId);
    }, [autoRefreshInterval, blockDataLoaded, lastProcessedBlock]);

    // If user changes range, reset data to ensure accuracy per new window
    useEffect(() => {
        if (blockDataLoaded && !loading) {
            loadInitialData();
        }
    }, [blockRange]);

    const handleManualRefresh = () => {
        loadInitialData();
    };

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + LOAD_MORE_STEP);
    };

    const filteredResults = useMemo(() => {
        let filtered = results;
        if (filterStatus === 'active') filtered = filtered.filter(v => v.isActive);
        else if (filterStatus === 'jailed') filtered = filtered.filter(v => v.isJailed);
        else if (filterStatus === 'unbonding') filtered = filtered.filter(v => v.isUnbonding);

        if (search.trim()) {
            const term = search.toLowerCase().trim();
            filtered = filtered.filter(v => v.moniker.toLowerCase().includes(term) || (v.operator_address && v.operator_address.toLowerCase().includes(term)));
        }
        return filtered;
    }, [results, filterStatus, search]);

    const displayedResults = useMemo(() => {
        return filteredResults.slice(0, visibleCount);
    }, [filteredResults, visibleCount]);

    const formatVotingPower = (tokens) => {
        try { return convertRawVotingPower(tokens, 18); } catch (e) { return "0"; }
    };

    if (!isLoaded) return <Loader message="Setting up RPC..." />;

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-green-400">Validator Uptime</h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center text-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Syncing...' : 'Refresh'}
                    </button>

                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-md text-sm transition ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>Grid</button>
                        <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-md text-sm transition ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>List</button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase">Search Validator</label>
                        <input
                            type="text"
                            placeholder="Moniker / Address"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="jailed">Jailed</option>
                            <option value="unbonding">Unbonding</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase">Visualization Window</label>
                        <select
                            value={blockRange}
                            onChange={(e) => setBlockRange(Number(e.target.value))}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                        >
                            <option value={50}>Last 50 Blocks</option>
                            <option value={100}>Last 100 Blocks</option>
                            <option value={200}>Last 200 Blocks</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase">Auto Refresh</label>
                        <select
                            value={autoRefreshInterval}
                            onChange={(e) => setAutoRefreshInterval(e.target.value)}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
                        >
                            <option value="off">Off</option>
                            <option value="auto">Every New Block</option>
                            <option value="10s">10 Seconds</option>
                            <option value="30s">30 Seconds</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400 pt-4 border-t border-gray-700">
                    <div className="flex gap-4">
                        <div>Latest Block: <span className="text-green-400 font-mono font-bold">{latestBlockHeight.toLocaleString()}</span></div>
                        <div>Total Validators: <span className="text-white font-bold">{results.length}</span></div>
                    </div>
                    <div>Last Updated: {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : '-'}</div>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading Validator Data..." />
            ) : error ? (
                <div className="bg-red-900/30 border border-red-500/50 p-6 rounded-xl text-white text-center">
                    <h3 className="font-bold text-red-400 mb-2">An Error Occurred</h3>
                    <p className="text-sm opacity-80 mb-4">{error}</p>
                    <button onClick={handleManualRefresh} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg text-sm font-bold transition">Retry</button>
                </div>
            ) : (
                <>
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                        {displayedResults.map((v) => (
                            <div 
                                key={v.operator_address} 
                                className={`bg-gray-800 rounded-xl p-5 shadow-lg hover:border-green-500/30 transition border border-gray-700 cursor-pointer ${!v.isActive ? 'opacity-60' : ''}`}
                                onClick={() => router.push(`/validator/${v.operator_address}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="overflow-hidden pr-2">
                                        <h3 className="font-bold text-white truncate text-lg group-hover:text-green-400">{v.moniker}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            {v.jailed ? (
                                                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-600/50 px-2 py-0.5 rounded font-bold uppercase">Jailed</span>
                                            ) : v.status === 'BOND_STATUS_BONDED' ? (
                                                <span className="text-[10px] bg-green-600/20 text-green-400 border border-green-600/50 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-600 text-white px-2 py-0.5 rounded font-bold uppercase">{v.status.replace('BOND_STATUS_', '')}</span>
                                            )}
                                            <span className="text-xs text-gray-500 font-mono">{formatVotingPower(v.tokens)} WARD</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-black leading-none ${Number(v.uptime) >= 99 ? 'text-green-400' : Number(v.uptime) >= 90 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {v.uptime}%
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Current Uptime</div>
                                    </div>
                                </div>

                                {v.patternWithHeights.length < blockRange && v.isActive && (
                                    <div className="mb-3 bg-gray-900/50 rounded-lg p-2 text-center text-[10px] text-gray-500 border border-gray-700/50 italic">
                                        Syncing window ({v.patternWithHeights.length}/{blockRange})
                                    </div>
                                )}

                                {v.patternWithHeights.length > 0 ? (
                                    <div className="mb-4 bg-gray-900/80 rounded-lg p-3 border border-gray-700">
                                        <BlockPattern 
                                            patternWithHeights={v.patternWithHeights} 
                                            blockRange={blockRange} 
                                            onBlockClick={(height) => router.push(`/block/${height}`)} 
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-4 h-10 flex items-center justify-center text-[10px] text-gray-600 uppercase font-bold">
                                        Waiting for blocks...
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700/50">
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Missed (Window)</div>
                                        <div className={`text-sm font-bold ${v.counts.missed > 0 ? 'text-red-400' : 'text-gray-300'}`}>{v.counts.missed}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">Signed (Window)</div>
                                        <div className="text-sm font-bold text-green-400">{v.counts.signed}</div>
                                    </div>
                                </div>

                                {slashingParams && (
                                    <div className="mt-3 text-[10px] text-gray-500 pt-2 border-t border-gray-700/30 flex justify-between items-center">
                                        <span>Slashing Window: <span className="text-gray-300 font-bold">{signedBlocksWindow.toLocaleString()} Blocks</span></span>
                                        {v.signingInfo && (
                                            <span className={v.signingInfo.missed_blocks_counter > 0 ? 'text-red-400' : 'text-green-500'}>
                                                {v.signingInfo.missed_blocks_counter} Missed Total
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {visibleCount < filteredResults.length && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleLoadMore}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition border border-gray-700 flex items-center justify-center mx-auto text-sm shadow-xl hover:scale-105 active:scale-95"
                            >
                                <ChevronsDown className="w-5 h-5 mr-2 text-green-400" />
                                Show More ({filteredResults.length - visibleCount})
                            </button>
                        </div>
                    )}

                    {filteredResults.length === 0 && (
                        <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 mt-4">
                            <p className="text-gray-500 font-bold">No validators found.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}