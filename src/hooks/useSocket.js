import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/', '') : "http://localhost:5001";

let socketInstance = null;

export const useSocket = () => {
    const [socket, setSocket] = useState(socketInstance);
    const { user } = useSelector((state) => state.auth);
    const initialized = useRef(false);

    useEffect(() => {
        if (user && !socketInstance) {
            socketInstance = io(SOCKET_URL, {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketInstance.on('connect', () => {
                console.log('Frontend Socket Connected');
                // Basic setup
                const type = (user.role === 'Admin' || user.role === 'Super Admin') ? 'user' : 'employee';
                socketInstance.emit("setup", { id: user.id, type: type });
            });

            setSocket(socketInstance);
        }

        return () => {
            // We usually don't want to close the singleton globally on every unmount
            // but for this task, the singleton pattern works fine.
        };
    }, [user]);

    return socketInstance;
};
