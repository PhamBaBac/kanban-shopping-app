import io, { Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8099";

let sharedSocket: Socket | null = null;
let currentToken: string | undefined = undefined;

export const getSharedSocket = (accessToken?: string): Socket => {
  if (!sharedSocket || currentToken !== accessToken) {
    if (sharedSocket) {
      sharedSocket.disconnect();
    }
    currentToken = accessToken;
    const queryParam = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : "";
    sharedSocket = io(`${SOCKET_URL}${queryParam}`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return sharedSocket;
};

export const initSocket = (accessToken?: string): Socket => {
  const queryParam = accessToken ? `?accessToken=${encodeURIComponent(accessToken)}` : "";
  const socket: Socket = io(`${SOCKET_URL}${queryParam}`, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socket;
};
