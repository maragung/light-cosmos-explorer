"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCcw } from 'lucide-react';
import { fetchWithRetry, convertRawVotingPower } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

export default function ValidatorsPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [validators, setValidators] = useState([]);
    const [filteredValidators, setFilteredValidators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchValidators = useCallback(async () => {
        if (!selectedConfig) return;
        setLoading(true);
        try {
            const url = `${selectedConfig.COSMOS_SDK_API}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=200`;
            const data = await fetchWithRetry(url);
            
            const processed = (data.validators || []).map(v => ({
                moniker: v.description?.moniker || 'Unknown',
                address: v.operator_address,
                votingPower: convertRawVotingPower(v.tokens, 18),
                rawTokens: BigInt(v.tokens || 0),
                commission: (parseFloat(v.commission?.commission_rates?.rate || 0) * 100).toFixed(2),
                jailed: v.jailed
            })).sort((a, b) => (a.rawTokens < b.rawTokens ? 1 : -1));

            setValidators(processed);
            setFilteredValidators(processed);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedConfig]);

    useEffect(() => {
        if (isLoaded) fetchValidators();
    }, [isLoaded, fetchValidators]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = validators.filter(v => 
            v.moniker.toLowerCase().includes(term) || 
            v.address.toLowerCase().includes(term)
        );
        setFilteredValidators(filtered);
    }, [searchTerm, validators]);

    if (!isLoaded) return <Loader message="Initializing..." />;

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-green-400">Active Validators</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search validator..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <button onClick={fetchValidators} className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700">
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading ? <Loader message="Loading validators..." /> : (
                <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-750">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Moniker</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Voting Power</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {filteredValidators.map((v, i) => (
                                    <tr key={v.address} className="hover:bg-gray-700 cursor-pointer" onClick={() => router.push(`/validator/${v.address}`)}>
                                        <td className="px-6 py-4 text-sm text-gray-400">#{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{v.moniker}</div>
                                            <div className="text-xs text-gray-500 font-mono">{v.address.substring(0, 16)}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                                            {v.votingPower} WARD
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {v.commission}%
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
}