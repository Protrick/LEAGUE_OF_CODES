"use client";

import { useEffect, useState } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      console.log("Socket connected:", socketInstance.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    // already connected before effect ran
    if (socketInstance.connected) {
      setIsConnected(true);
    }

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket, isConnected };
}

export function useRoomSocket(roomCode: string | null) {
  const { socket, isConnected } = useSocket();
  const [participants, setParticipants] = useState<any[]>([]);

  // fetch initial participants from API
  useEffect(() => {
    if (!roomCode) return;

    fetch(`/api/rooms/${roomCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.room?.participants) {
          setParticipants(data.room.participants);
        }
      })
      .catch(console.error);
  }, [roomCode]);

  // socket listeners
  useEffect(() => {
    if (!socket || !roomCode || !isConnected) return;

    // join the socket room
    socket.emit("join_room", roomCode);

    // fix: backend emits "update_participants" — listen to same event
    const handleUpdate = (data: { roomCode: string; participants: any[] }) => {
      if (data.roomCode === roomCode) {
        setParticipants(data.participants);
      }
    };

    // when another user joins, re-fetch participants from API
    const handleUserJoined = (data: { socketId: string; roomCode: string }) => {
      if (data.roomCode === roomCode) {
        fetch(`/api/rooms/${roomCode}`)
          .then((res) => res.json())
          .then((d) => {
            if (d?.room?.participants) {
              setParticipants(d.room.participants);
            }
          })
          .catch(console.error);
      }
    };

    socket.on("update_participants", handleUpdate);
    socket.on("user_joined", handleUserJoined);

    return () => {
      socket.emit("leave_room", roomCode);
      socket.off("update_participants", handleUpdate);
      socket.off("user_joined", handleUserJoined);
    };
  }, [socket, roomCode, isConnected]);

  return { socket, isConnected, participants };
}
