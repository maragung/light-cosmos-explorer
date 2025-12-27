import React, { useState, useEffect, useCallback } from 'react';
import { createFetchWithCookies, ROUTES } from '../components/hooks';

const ValidatorsView = ({ cometBftRpcApi, cosmosSdkApi, navigate, selectedConfig }) => {
    const [validators, setValidators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchValidators = async () => {
            try {
                setIsLoading(true);
                const fetchWithCookies = createFetchWithCookies(selectedConfig);
                const response = await fetchWithCookies(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
                const data = await response.json();
                setValidators(data.validators || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchValidators();
    }, [cosmosSdkApi, selectedConfig]);

    if (isLoading) return <div className="p-4 text-center">Loading validators...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-400">Validators</h1>
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-750">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Moniker</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Voting Power</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {validators.map((validator) => (
                                <tr 
                                    key={validator.operator_address} 
                                    className="hover:bg-gray-700 cursor-pointer transition duration-150"
                                    onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.operator_address })}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{validator.description?.moniker || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-xs">{validator.operator_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            validator.status === 'BOND_STATUS_BONDED' ? 'bg-green-800 text-green-200' : 
                                            validator.status === 'BOND_STATUS_UNBONDING' ? 'bg-yellow-800 text-yellow-200' : 
                                            'bg-red-800 text-red-200'
                                        }`}>
                                            {validator.status?.replace('BOND_STATUS_', '') || 'UNKNOWN'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {validator.tokens ? parseFloat(validator.tokens).toLocaleString() : '0'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {validator.commission?.commission_rates?.rate ? 
                                            (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) + '%' : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ValidatorsView;