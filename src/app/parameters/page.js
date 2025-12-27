"use client";

import React, { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { DetailRow } from '@/components/Shared';

export default function ParametersPage() {
    const { selectedConfig, isLoaded } = useRpc();
    const [parameters, setParameters] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchParameters = async () => {
            if (!selectedConfig) return;
            setLoading(true);
            try {
                const [status, staking, gov, dist, slashing, pool, supply, mint] = await Promise.allSettled([
                    fetchWithRetry(`${selectedConfig.COMETBFT_RPC_API}/status`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/staking/v1beta1/params`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1beta1/params`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/distribution/v1beta1/params`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/slashing/v1beta1/params`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/staking/v1beta1/pool`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/bank/v1beta1/supply`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/mint/v1beta1/inflation`)
                ]);

                const getVal = (res) => res.status === 'fulfilled' ? res.value : null;

                const statusData = getVal(status);
                const stakingParams = getVal(staking)?.params;
                const govParams = getVal(gov);
                const distParams = getVal(dist)?.params;
                const slashingParams = getVal(slashing)?.params;
                const poolData = getVal(pool)?.pool;
                const supplyData = getVal(supply)?.supply;
                const inflationData = getVal(mint);

                const bonded = parseFloat(poolData?.bonded_tokens || 0);
                const totalSupp = parseFloat(supplyData?.[0]?.amount || 0); // Simplified
                
                setParameters({
                    chainInfo: {
                        chainId: statusData?.node_info?.network || 'N/A',
                        height: statusData?.sync_info?.latest_block_height || '0',
                        bondedTokens: (bonded / 1e18).toLocaleString() + ' WARD',
                        inflation: inflationData?.inflation ? `${(parseFloat(inflationData.inflation) * 100).toFixed(2)}%` : 'N/A'
                    },
                    staking: stakingParams,
                    gov: govParams,
                    dist: distParams,
                    slashing: slashingParams
                });

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded) fetchParameters();
    }, [isLoaded, selectedConfig]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading) return <Loader message="Loading parameters..." />;
    if (error) return <div className="p-4 text-red-400">Error: {error}</div>;

    const formatTime = (s) => s ? `${parseInt(s)/3600/24} days` : 'N/A';

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-green-400">Network Parameters</h2>
            
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-green-400 mb-4">Chain Info</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <DetailRow label="Chain ID" value={parameters.chainInfo.chainId} />
                    <DetailRow label="Height" value={parameters.chainInfo.height} />
                    <DetailRow label="Bonded Tokens" value={parameters.chainInfo.bondedTokens} />
                    <DetailRow label="Inflation" value={parameters.chainInfo.inflation} />
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Staking</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <DetailRow label="Unbonding Time" value={formatTime(parameters.staking?.unbonding_time)} />
                    <DetailRow label="Max Validators" value={parameters.staking?.max_validators} />
                    <DetailRow label="Bond Denom" value={parameters.staking?.bond_denom} />
                </div>
            </div>

             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-red-400 mb-4">Slashing</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <DetailRow label="Signed Blocks Window" value={parameters.slashing?.signed_blocks_window} />
                    <DetailRow label="Downtime Jail Duration" value={parameters.slashing?.downtime_jail_duration} />
                    <DetailRow label="Min Signed Per Window" value={parameters.slashing?.min_signed_per_window} />
                </div>
            </div>
        </div>
    );
}