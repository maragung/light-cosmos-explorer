"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { fetchWithRetry, convertRawVotingPower } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { DetailRow } from '@/components/Shared';

export default function AddressDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddr = async () => {
            if (!selectedConfig || !params.address) return;
            setLoading(true);
            try {
                const [acc, bal] = await Promise.all([
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/auth/v1beta1/accounts/${params.address}`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/bank/v1beta1/balances/${params.address}`)
                ]);
                setData({ account: acc.account, balances: bal.balances });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchAddr();
    }, [isLoaded, selectedConfig, params.address]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading) return <Loader message="Loading Address..." />;
    if (!data) return <div className="p-4 text-red-400">Address not found</div>;

    return (
        <div className="p-4 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-green-400 hover:text-green-300">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <h2 className="text-2xl font-bold text-green-400">Account Details</h2>
                <DetailRow label="Address" value={params.address} isCode={true} />
                <DetailRow label="Account Number" value={data.account?.account_number || 'N/A'} />
                <DetailRow label="Sequence" value={data.account?.sequence || 'N/A'} />
                
                <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Balances</h3>
                    {data.balances?.length > 0 ? (
                        <div className="space-y-2">
                            {data.balances.map((b, i) => (
                                <div key={i} className="flex justify-between bg-gray-700 p-3 rounded">
                                    <span className="text-white font-bold">{convertRawVotingPower(b.amount, 18)}</span>
                                    <span className="text-green-400 uppercase">{b.denom.replace('award','WARD')}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500">No balances found</p>}
                </div>
            </div>
        </div>
    );
}