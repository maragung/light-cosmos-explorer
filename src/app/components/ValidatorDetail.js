import React, { useState, useEffect } from 'react';
import { ChevronLeft, HardHat, Badge, Clock, TrendingUp, DollarSign } from 'lucide-react';

const ValidatorDetail = ({ currentParams, cometBftRpcApi, cosmosSdkApi, navigate }) => {
  const [validator, setValidator] = useState(null);
  const [delegations, setDelegations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchValidatorDetails = async () => {
      try {
        setIsLoading(true);
        // Fetch validator details
        const response = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${currentParams.address}`);
        const data = await response.json();
        setValidator(data.validator);

        // Fetch delegations to this validator
        const delegationsResponse = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators/${currentParams.address}/delegations`);
        const delegationsData = await delegationsResponse.json();
        setDelegations(delegationsData.delegation_responses || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentParams.address) {
      fetchValidatorDetails();
    }
  }, [currentParams.address, cosmosSdkApi]);

  if (isLoading) return <div className="p-4 text-center">Loading validator details...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  if (!validator) return <div className="p-4 text-center">Validator not found</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('validators')}
        className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Validators</span>
      </button>

      <div className="bg-gray-800 rounded-xl p-6 neon-border">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gray-700 rounded-lg">
            <HardHat className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{validator.description?.moniker || 'Unknown'}</h1>
            <p className="text-gray-400 text-sm">{validator.operator_address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <Badge className="w-4 h-4" />
              <span className="text-xs font-semibold">Status</span>
            </div>
            <p className="text-white font-bold">
              {validator.status === 'BOND_STATUS_BONDED' ? 'Active' : 
               validator.status === 'BOND_STATUS_UNBONDING' ? 'Unbonding' : 
               validator.status === 'BOND_STATUS_UNBONDED' ? 'Unbonded' : 'Unknown'}
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold">Tokens</span>
            </div>
            <p className="text-white font-bold">
              {validator.tokens ? parseFloat(validator.tokens).toLocaleString() : '0'}
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold">Commission</span>
            </div>
            <p className="text-white font-bold">
              {validator.commission?.commission_rates?.rate ? 
                (parseFloat(validator.commission.commission_rates.rate) * 100).toFixed(2) + '%' : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">Min Self Delegation</span>
            </div>
            <p className="text-white font-bold">
              {validator.min_self_delegation ? parseFloat(validator.min_self_delegation).toLocaleString() : '0'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Description</h2>
          <p className="text-gray-300">{validator.description?.details || 'No description provided'}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3">Delegations</h2>
          {delegations.length > 0 ? (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-400 uppercase">Delegator</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-green-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {delegations.map((delegation, index) => (
                    <tr key={index} className="hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-white truncate max-w-xs">
                        {delegation.delegation?.delegator_address}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {delegation.balance?.amount ? 
                          parseFloat(delegation.balance.amount).toLocaleString() + ' ' + (delegation.balance.denom || 'tokens') : 
                          '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No delegations found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidatorDetail;
