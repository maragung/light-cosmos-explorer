import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, DollarSign, TrendingUp, Clock, Shield, Hash, Calendar, BarChart3 } from 'lucide-react';

const ValidatorDetail = ({ currentParams, cometBftRpcApi, cosmosSdkApi, navigate }) => {
  const [validator, setValidator] = useState(null);
  const [delegations, setDelegations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentParams.address) {
      setError('Validator address not provided');
      setIsLoading(false);
      return;
    }

    const fetchValidatorDetails = async () => {
      try {
        setIsLoading(true);
        // Fetch validator details
        const response = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${currentParams.address}`);
        const data = await response.json();
        
        if (data.validator) {
          setValidator(data.validator);
          
          // Fetch delegations for this validator
          const delegationsResponse = await fetch(
            `${cosmosSdkApi}/cosmos/staking/v1beta1/delegations?validator_addr=${currentParams.address}`
          );
          const delegationsData = await delegationsResponse.json();
          setDelegations(delegationsData.delegation_responses || []);
        } else {
          setError('Validator not found');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching validator details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidatorDetails();
  }, [currentParams.address, cosmosSdkApi]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
      <p className="text-gray-400">Loading validator details...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-500">
      <p>Error: {error}</p>
      <button 
        onClick={() => navigate('validators')}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Validators
      </button>
    </div>
  );

  if (!validator) return (
    <div className="p-4 text-gray-400">
      <p>Validator not found</p>
      <button 
        onClick={() => navigate('validators')}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Validators
      </button>
    </div>
  );

  // Helper function to format tokens
  const formatTokens = (tokens, denom = 'uward') => {
    const amount = parseFloat(tokens) || 0;
    const denominations = {
      'uward': { name: 'WARD', decimals: 6 },
      'uosmo': { name: 'OSMO', decimals: 6 },
      'uatom': { name: 'ATOM', decimals: 6 },
      'basecro': { name: 'CRO', decimals: 18 }
    };
    
    const denomInfo = denominations[denom] || { name: denom.toUpperCase(), decimals: 6 };
    const converted = amount / Math.pow(10, denomInfo.decimals);
    return `${converted.toLocaleString()} ${denomInfo.name}`;
  };

  // Calculate commission rate
  const commissionRate = validator.commission?.commission_rates?.rate 
    ? (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('validators')}
        className="flex items-center gap-2 text-green-400 hover:text-green-300 transition duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Validators
      </button>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-400" />
              {validator.description?.moniker || 'Unknown Validator'}
            </h1>
            <p className="text-gray-400 mt-1">{validator.description?.identity ? `Identity: ${validator.description.identity}` : ''}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            validator.status === 'BOND_STATUS_BONDED' 
              ? 'bg-green-800 text-green-200' 
              : validator.status === 'BOND_STATUS_UNBONDING' 
                ? 'bg-yellow-800 text-yellow-200' 
                : 'bg-red-800 text-red-200'
          }`}>
            {validator.status?.replace('BOND_STATUS_', '') || 'UNKNOWN'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Hash className="w-4 h-4" />
              Operator Address
            </div>
            <p className="text-white mt-1 text-sm truncate">{validator.operator_address}</p>
          </div>
          
          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <BarChart3 className="w-4 h-4" />
              Voting Power
            </div>
            <p className="text-white mt-1">
              {validator.tokens ? formatTokens(validator.tokens, validator.tokens_denom || 'uward') : '0'}
            </p>
          </div>
          
          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <DollarSign className="w-4 h-4" />
              Commission
            </div>
            <p className="text-white mt-1">{commissionRate}%</p>
          </div>
          
          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              Min Self Delegation
            </div>
            <p className="text-white mt-1">
              {validator.min_self_delegation ? formatTokens(validator.min_self_delegation, validator.tokens_denom || 'uward') : '0'}
            </p>
          </div>
        </div>

        {validator.description?.details && (
          <div className="bg-gray-750 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300">{validator.description.details}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-750 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Commission Rates
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Rate</span>
                <span className="text-white">{commissionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Rate</span>
                <span className="text-white">
                  {validator.commission?.commission_rates?.max_rate 
                    ? (parseFloat(validator.commission.commission_rates.max_rate) * 100).toFixed(2) + '%' 
                    : '0.00%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Change Rate</span>
                <span className="text-white">
                  {validator.commission?.commission_rates?.max_change_rate 
                    ? (parseFloat(validator.commission.commission_rates.max_change_rate) * 100).toFixed(2) + '%' 
                    : '0.00%'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Delegations
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Delegations</span>
                <span className="text-white">{delegations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Staked</span>
                <span className="text-white">
                  {delegations.reduce((sum, delegation) => {
                    return sum + (parseFloat(delegation.balance?.amount) || 0);
                  }, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {delegations.length > 0 && (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Delegators
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Delegator</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {delegations.map((delegation, index) => (
                  <tr key={index} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {delegation.delegation?.delegator_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {delegation.balance?.amount 
                        ? formatTokens(delegation.balance.amount, delegation.balance.denom) 
                        : '0'}
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

export default ValidatorDetail;