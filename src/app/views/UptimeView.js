import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, TrendingUp, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { createFetchWithCookies } from '../components/hooks';

const UptimeView = ({ cometBftRpcApi, cosmosSdkApi, navigate, ROUTES, selectedConfig }) => {
  const [validators, setValidators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch validators to get their names/monikers and operator_address to consensus_address mapping
  const fetchValidators = useCallback(async () => {
    try {
      const fetchWithCookies = createFetchWithCookies(selectedConfig);
      const response = await fetchWithCookies(`${cosmosSdkApi}/cosmos/staking/v1beta1/validators`);
      const data = await response.json();
      return data.validators || [];
    } catch (err) {
      console.error('Error fetching validators:', err);
      return [];
    }
  }, [cosmosSdkApi, selectedConfig]);

  // Fetch signing info to get uptime data
  const fetchSigningInfo = useCallback(async () => {
    try {
      const fetchWithCookies = createFetchWithCookies(selectedConfig);
      const response = await fetchWithCookies(`${cosmosSdkApi}/cosmos/slashing/v1beta1/signing_infos`);
      const data = await response.json();
      return data.info || [];
    } catch (err) {
      console.error('Error fetching signing info:', err);
      return [];
    }
  }, [cosmosSdkApi, selectedConfig]);

  // Get validator set to map consensus addresses to operator addresses
  const fetchValidatorSet = useCallback(async () => {
    try {
      const fetchWithCookies = createFetchWithCookies(selectedConfig);
      const response = await fetchWithCookies(`${cometBftRpcApi}/validators`);
      const data = await response.json();
      return data.result?.validators || [];
    } catch (err) {
      console.error('Error fetching validator set:', err);
      return [];
    }
  }, [cometBftRpcApi, selectedConfig]);

  // Function to convert public key to address (simplified approach)
  const pubKeyToAddress = (pubKey) => {
    // This is a simplified approach - in reality, you'd need to use proper cryptographic conversion
    // For now, we'll try to find a match by comparing parts of the key
    if (!pubKey) return null;
    
    // Different chains may have different formats for pub keys
    const pubKeyValue = pubKey.key || pubKey.value || pubKey;
    
    // In a real implementation, you would hash the public key using the appropriate algorithm
    // and then encode it to the specific address format
    return pubKeyValue ? pubKeyValue.slice(0, 20) : null; // Simplified for demo
  };

  // Combine validators and signing info to get complete uptime data
  const fetchUptimeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch validators, signing info, and validator set in parallel
      const [validatorsList, signingInfoList, validatorSet] = await Promise.all([
        fetchValidators(),
        fetchSigningInfo(),
        fetchValidatorSet()
      ]);

      // Create a mapping from consensus address to operator address using validator set
      const consensusToOperatorMap = {};
      
      // Create the mapping using the validator set
      validatorSet.forEach(validator => {
        // The validator.address is the consensus address
        // We need to find the corresponding operator address
        const consensusAddr = validator.address;
        
        // Find the corresponding validator in the staking list by matching pub keys
        const pubKeyValue = validator.pub_key?.value || validator.pub_key;
        if (pubKeyValue) {
          const matchingValidator = validatorsList.find(v => {
            const validatorPubKey = v.consensus_pubkey?.key || v.consensus_pubkey?.value;
            return validatorPubKey === pubKeyValue;
          });
          
          if (matchingValidator) {
            consensusToOperatorMap[consensusAddr] = matchingValidator.operator_address;
          }
        }
      });

      // Create a map of operator_address to validator details for name lookup
      const validatorDetailsMap = {};
      validatorsList.forEach(validator => {
        validatorDetailsMap[validator.operator_address] = validator;
      });

      // Combine the data to create uptime records with proper names
      const combinedData = signingInfoList.map(signingInfo => {
        // Get the operator address using the consensus address mapping
        const operatorAddress = consensusToOperatorMap[signingInfo.address] || null;
        const validator = operatorAddress ? validatorDetailsMap[operatorAddress] : null;
        
        return {
          address: signingInfo.address,
          operator_address: operatorAddress || signingInfo.address,
          moniker: validator?.description?.moniker || 'Unknown',
          status: validator?.status || 'UNKNOWN',
          missed_blocks_counter: signingInfo.missed_blocks_counter || 0,
          tombstoned: signingInfo.tombstoned || false,
          jailed_until: signingInfo.jailed_until || null,
          index_offset: signingInfo.index_offset || 0,
          start_height: signingInfo.start_height || 0,
        };
      });

      setValidators(combinedData);
    } catch (err) {
      setError(err.message);
      console.error('Error in fetchUptimeData:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchValidators, fetchSigningInfo, fetchValidatorSet, cometBftRpcApi, cosmosSdkApi, selectedConfig]);

  useEffect(() => {
    fetchUptimeData();
  }, [fetchUptimeData]);

  const refreshData = () => {
    fetchUptimeData();
  };

  const getStatusColor = (missedBlocks) => {
    const missed = parseInt(missedBlocks);
    if (missed === 0) return 'text-green-400';
    if (missed < 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (missedBlocks) => {
    const missed = parseInt(missedBlocks);
    if (missed === 0) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (missed < 10) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <RefreshCcw className="w-8 h-8 animate-spin text-green-400 mb-4" />
      <p className="text-gray-400">Loading uptime data...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-500">
      <p>Error: {error}</p>
      <button 
        onClick={refreshData}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Validator Uptime
        </h1>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Validator</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Missed Blocks</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Tombstoned</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider">Start Height</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {validators.map((validator, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-750 cursor-pointer transition duration-150"
                  onClick={() => navigate(ROUTES.VALIDATOR_DETAIL, { address: validator.operator_address })}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{validator.moniker}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{validator.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(validator.missed_blocks_counter)}
                      <span className={`text-sm ${getStatusColor(validator.missed_blocks_counter)}`}>
                        {validator.status?.replace('BOND_STATUS_', '') || 'UNKNOWN'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{parseInt(validator.missed_blocks_counter).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      validator.tombstoned ? 'bg-red-800 text-red-200' : 'bg-green-800 text-green-200'
                    }`}>
                      {validator.tombstoned ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {parseInt(validator.start_height).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {validators.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No uptime data available</p>
        </div>
      )}
    </div>
  );
};

export default UptimeView;