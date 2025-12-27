"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';

export default function ProposalsPage() {
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProposals = useCallback(async () => {
        if (!selectedConfig) return;
        setLoading(true);
        try {
            const url = `${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1beta1/proposals?pagination.limit=100&pagination.reverse=true`;
            const data = await fetchWithRetry(url);
            setProposals(data.proposals || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedConfig]);

    useEffect(() => {
        if (isLoaded) fetchProposals();
    }, [isLoaded, fetchProposals]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PROPOSAL_STATUS_PASSED': return 'bg-green-600';
            case 'PROPOSAL_STATUS_REJECTED': return 'bg-red-600';
            case 'PROPOSAL_STATUS_VOTING_PERIOD': return 'bg-blue-600';
            default: return 'bg-gray-600';
        }
    };

    if (!isLoaded) return <Loader message="Initializing..." />;

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-green-400">Governance Proposals</h2>
            
            {loading ? <Loader message="Loading proposals..." /> : (
                <div className="grid gap-4">
                    {proposals.map((p) => {
                        const title = p.content?.title || p.content?.value?.title || `Proposal #${p.proposal_id}`;
                        const statusLabel = p.status.replace('PROPOSAL_STATUS_', '').replace(/_/g, ' ');
                        
                        return (
                            <div 
                                key={p.proposal_id} 
                                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-green-500 transition cursor-pointer"
                                onClick={() => router.push(`/proposal/${p.proposal_id}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-gray-500 font-mono text-sm">#{p.proposal_id}</span>
                                    <span className={`px-2 py-1 text-xs font-bold rounded text-white ${getStatusColor(p.status)}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                                <div className="text-sm text-gray-400 flex justify-between mt-4">
                                    <span>Voting End: {new Date(p.voting_end_time).toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}