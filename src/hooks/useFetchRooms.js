import { useCallback } from "react";
import { API_URL } from "../config";

export function useFetchRooms(token, setRooms) {
  return useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
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
