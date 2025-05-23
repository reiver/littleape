import { useState, useEffect } from 'react';


export function useServerHistory(storageKey: string) {
  const [servers, setServers] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setServers(JSON.parse(saved));
    }
  }, []);

  const addServer = (url: string) => {
    if (!url || servers.includes(url)) return;
    const updated = [url, ...servers];
    setServers(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const removeServer = (url: string) => {
    const updated = servers.filter(s => s !== url);
    setServers(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return { servers, addServer, removeServer };
}
