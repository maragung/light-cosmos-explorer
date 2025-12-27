"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { fetchWithRetry, convertRawVotingPower } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { DetailRow } from '@/components/Shared';

export default function ValidatorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [validator, setValidator] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVal = async () => {
            if (!selectedConfig || !params.address) return;
            setLoading(true);
            try {
                const res = await fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/staking/v1beta1/validators/${params.address}`);
                setValidator(res.validator);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchVal();
    }, [isLoaded, selectedConfig, params.address]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading) return <Loader message="Loading Validator..." />;
    if (!validator) return <div className="p-4 text-red-400">Validator not found</div>;

    const moniker = validator.description?.moniker || 'Unknown';
    const status = validator.status.replace('BOND_STATUS_', '');

    return (
        <div className="p-4 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-green-400 hover:text-green-300">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-green-400">{moniker}</h2>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${status === 'BONDED' ? 'bg-green-600' : 'bg-yellow-600'}`}>{status}</span>
                </div>
                
                <DetailRow label="Operator Address" value={validator.operator_address} isCode={true} />
                <DetailRow label="Voting Power" value={`${convertRawVotingPower(validator.tokens, 18)} WARD`} />
                <DetailRow label="Commission Rate" value={`${(parseFloat(validator.commission?.commission_rates?.rate || 0)*100).toFixed(2)}%`} />
                <DetailRow label="Website" value={validator.description?.website || 'N/A'} />
                <DetailRow label="Details" value={validator.description?.details || 'N/A'} />
            </div>
        </div>
    );
}