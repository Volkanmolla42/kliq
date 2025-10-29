/**
 * Network Status Monitoring
 * 
 * Kullanıcının internet bağlantısını izler ve offline durumunda bildirim gösterir.
 */

import NetInfo from "@react-native-community/netinfo";
import { useState, useEffect } from "react";

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

/**
 * Network durumunu izleyen hook
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    // İlk durumu al
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    // Değişiklikleri dinle
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}

/**
 * Offline durumunda gösterilecek mesaj
 */
export function getOfflineMessage(networkState: NetworkState): string | null {
  if (!networkState.isConnected) {
    return "İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.";
  }

  if (!networkState.isInternetReachable) {
    return "İnternet erişimi yok. Lütfen bağlantınızı kontrol edin.";
  }

  return null;
}

/**
 * Network durumunu kontrol et ve hata fırlat
 */
export async function checkNetworkConnection(): Promise<void> {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new Error("İnternet bağlantınız yok");
  }

  if (!state.isInternetReachable) {
    throw new Error("İnternet erişimi yok");
  }
}

