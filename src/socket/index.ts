import { io } from "socket.io-client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: any = {
    'force new connection': true,
    reconnectionAttempts: 'Infinity',
    timeout: 10000,
     transports: ['websocket']
}

const socket = io('http://localhost:3001', options)

export default socket