import React, { useState, useEffect } from 'react';
import { RefreshCcw, TrendingUp, HardHat, Clock } from 'lucide-react';

const UptimeView = ({ cometBftRpcApi, cosmosSdkApi, navigate, ROUTES }) => {
  const [validators, setValidators] = useState([]);
  const [uptimeData, setUptimeData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchValidatorsAndUptime = async () => {
      try {
        setIsLoading(true);
        
        // Fetch validators
        const validatorsResponse = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
        const validatorsData = await validatorsResponse.json();
        
        if (validatorsData.validators) {
          // Fetch validator sets to get voting power and status
          const validatorSetResponse = await fetch(`${cometBftRpcApi}/validators`);
          const validatorSetData = await validatorSetResponse.json();
          
          // Create a mapping of consensus address to operator address
          const consensusToOperatorMap = {};
          if (validatorSetData.result?.validators) {
            validatorSetData.result.validators.forEach(validator => {
              consensusToOperatorMap[validator.address] = validator.pub_key?.value || validator.pub_key?.key;
            });
          }
          
          // Combine validator info with current validator set data
          const combinedValidators = validatorsData.validators.map(validator => {
            // Find if this validator is in the current validator set
            const inCurrentSet = validatorSetData.result?.validators?.some(
              v => {
                // Check if the validator's consensus key matches the one in the validator set
                const consensusPubKey = validator.consensus_pubkey?.key || validator.consensus_pubkey?.value;
                return v.address === validator.operator_address || 
                       consensusPubKey === consensusToOperatorMap[v.address] ||
                       v.pub_key?.value === consensusPubKey ||
                       v.pub_key?.key === consensusPubKey;
              }
            );
            
            return {
              ...validator,
              moniker: validator.description?.moniker || 'Unknown',
              inCurrentSet: !!inCurrentSet,
              voting_power: inCurrentSet ? inCurrentSet.voting_power : 0
            };
          });
          
          setValidators(combinedValidators);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidatorsAndUptime();
  }, [cometBftRpcApi, cosmosSdkApi]);

  const refreshData = () => {
    const fetchValidatorsAndUptime = async () => {
      try {
        setIsLoading(true);
        
        // Fetch validators
        const validatorsResponse = await fetch(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
        const validatorsData = await validatorsResponse.json();
        
        if (validatorsData.validators) {
          // Fetch validator sets to get voting power and status
          const validatorSetResponse = await fetch(`${cometBftRpcApi}/validators`);
          const validatorSetData = await validatorSetResponse.json();
          
          // Create a mapping of consensus address to operator address
          const consensusToOperatorMap = {};
          if (validatorSetData.result?.validators) {
            validatorSetData.result.validators.forEach(validator => {
              consensusToOperatorMap[validator.address] = validator.pub_key?.value || validator.pub_key?.key;
            });
          }
          
          // Combine validator info with current validator set data
          const combinedValidators = validatorsData.validators.map(validator => {
            // Find if this validator is in the current validator set
            const inCurrentSet = validatorSetData.result?.validators?.some(
              v => {
                // Check if the validator's consensus key matches the one in the validator set
                const consensusPubKey = validator.consensus_pubkey?.key || validator.consensus_pubkey?.value;
                return v.address === validator.operator_address || 
                       consensusPubKey === consensusToOperatorMap[v.address] ||
                       v.pub_key?.value === consensusPubKey ||
                       v.pub_key?.key === consensusPubKey;
              }
            );
            
            return {
              ...validator,
              moniker: validator.description?.moniker || 'Unknown',
              inCurrentSet: !!inCurrentSet,
              voting_power: inCurrentSet ? inCurrentSet.voting_power : 0
            };
          });
          
          setValidators(combinedValidators);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidatorsAndUptime();
  };

  if (isLoading) return <div className="p-4 text-center">Loading uptime data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400">Validator Uptime</h1>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden neon-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Validator</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Voting Power</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase">Uptime</th>
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
                    <div className="flex items-center">
                      <HardHat className="w-5 h-5 text-green-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">{validator.description?.moniker || 'Unknown'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">{validator.operator_address}</div>
                      </div>
                    </div>
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
                    {validator.voting_power ? parseFloat(validator.voting_power).toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-sm text-white">
                        {validator.inCurrentSet ? '100%' : '0%'}
                      </span>
                    </div>
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

export default UptimeView;
