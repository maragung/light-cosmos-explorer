"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const RPC_CONFIGS = [
    {
        label: "Warden Indonesia - Mainnet",
        COMETBFT_RPC_API: "https://warden-mainnet-rpc.itrocket.net",
        COSMOS_SDK_API: "https://warden-mainnet-api.itrocket.net",
        network: "mainnet"
    },
    {
        label: "Itrocket - Mainnet",
        COMETBFT_RPC_API: "https://warden-mainnet-rpc.itrocket.net",
        COSMOS_SDK_API: "https://warden-mainnet-api.itrocket.net",
        network: "mainnet"
    },
    {
        label: "Warden Testnet - Indonesia",
        COMETBFT_RPC_API: "https://testnet-rpc.warden.clogs.id",
        COSMOS_SDK_API: "https://testnet-api.warden.clogs.id",
        network: "testnet"
    },
    {
        label: "Warden Testnet - Itrocket",
        COMETBFT_RPC_API: "https://warden-testnet-rpc.itrocket.net",
        COSMOS_SDK_API: "https://warden-testnet-api.itrocket.net",
        network: "testnet"
    }
];

const RpcContext = createContext();

export const RpcProvider = ({ children }) => {
    const [selectedConfig, setSelectedConfig] = useState(RPC_CONFIGS[0]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('rpcConfig');
        let config = RPC_CONFIGS[0];

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const validConfig = RPC_CONFIGS.find(c => c.label === parsed.label);
                if (validConfig) {
                    config = validConfig;
                }
            } catch (e) {}
        }

        setSelectedConfig(config);
        setIsLoaded(true);
    }, []);

    const setRpcConfig = (config) => {
        setSelectedConfig(config);
        if (typeof window !== 'undefined') {
            localStorage.setItem('rpcConfig', JSON.stringify(config));
        }
    };

    return (
        <RpcContext.Provider value={{ selectedConfig, setRpcConfig, isLoaded, rpcConfigs: RPC_CONFIGS }}>
            {children}
        </RpcContext.Provider>
    );
};

export const useRpc = () => useContext(RpcContext);