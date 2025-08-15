import { useCallback } from "react";

export function useFetchRooms(token, setRooms) {
  return useCallback(async () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    try {
      const res = await fetch(`${apiUrl}/rooms`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setRooms([]);
    }
  }, [token, setRooms]);
}
