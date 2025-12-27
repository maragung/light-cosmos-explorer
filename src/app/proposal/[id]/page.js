"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { fetchWithRetry } from '@/lib/utils';
import { useRpc } from '@/context/RpcContext';
import Loader from '@/components/Loader';
import { DetailRow, JsonViewer } from '@/components/Shared';

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedConfig, isLoaded } = useRpc();
    const [proposal, setProposal] = useState(null);
    const [tally, setTally] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProp = async () => {
            if (!selectedConfig || !params.id) return;
            setLoading(true);
            try {
                const [pData, tData] = await Promise.all([
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1beta1/proposals/${params.id}`),
                    fetchWithRetry(`${selectedConfig.COSMOS_SDK_API}/cosmos/gov/v1beta1/proposals/${params.id}/tally`)
                ]);
                setProposal(pData.proposal);
                setTally(tData.tally);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchProp();
    }, [isLoaded, selectedConfig, params.id]);

    if (!isLoaded) return <Loader message="Initializing..." />;
    if (loading) return <Loader message={`Loading Proposal #${params.id}...`} />;
    if (!proposal) return <div className="p-4 text-red-400">Proposal not found</div>;

    const title = proposal.content?.title || proposal.content?.value?.title || 'Unknown Title';
    const desc = proposal.content?.description || proposal.content?.value?.description || 'No description';

    return (
        <div className="p-4 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-green-400 hover:text-green-300">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
            </button>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-green-400">Proposal #{params.id}</h2>
                    <span className="text-sm text-gray-400">{proposal.status.replace('PROPOSAL_STATUS_', '')}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                
                <div className="grid md:grid-cols-2 gap-4 my-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-gray-400 text-sm mb-2">Voting Start</h4>
                        <p>{new Date(proposal.voting_start_time).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-gray-400 text-sm mb-2">Voting End</h4>
                        <p>{new Date(proposal.voting_end_time).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg text-gray-300 whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                    {desc}
                </div>

                {tally && (
                    <div className="grid grid-cols-4 gap-2 text-center mt-4">
                        <div className="bg-green-900 p-2 rounded text-green-200">
                            <div className="text-xs">YES</div>
                            <div className="font-bold">{parseInt(tally.yes).toLocaleString()}</div>
                        </div>
                        <div className="bg-red-900 p-2 rounded text-red-200">
                            <div className="text-xs">NO</div>
                            <div className="font-bold">{parseInt(tally.no).toLocaleString()}</div>
                        </div>
                        <div className="bg-red-950 p-2 rounded text-red-300">
                            <div className="text-xs">VETO</div>
                            <div className="font-bold">{parseInt(tally.no_with_veto).toLocaleString()}</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-gray-300">
                            <div className="text-xs">ABSTAIN</div>
                            <div className="font-bold">{parseInt(tally.abstain).toLocaleString()}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}