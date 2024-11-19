import freeice from 'freeice';
import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import socket from "../socket";
import { ACTIONS } from "../socket/actions";
import useStateWithCallback from "./useStateWithCallback";

export const LOCAL_VIDEO = "LOCAL_VIDEO";

type MediaStreamRef = MutableRefObject<MediaStream | null>;
type PeerMediaElements = { [key: string]: HTMLVideoElement | null };

export default function useWebRTC(roomID: string): {
  clients: string[];
  provideMediaRef: (id: string, node: HTMLVideoElement | null) => void;
} {
  const [clients, updateClients] = useStateWithCallback<string[]>([]);

  const addNewClient = useCallback(
    (newClient: string, cb?: () => void) => {
      if (!clients.includes(newClient)) {
        updateClients((list) => [...list, newClient], cb);
      }
    },
    [clients, updateClients],
  );

  const peerConnections = useRef({});
  const localMediaStream = useRef<MediaStream | null>(null) as MediaStreamRef;
  const peerMediaElements = useRef<PeerMediaElements>({ [LOCAL_VIDEO]: null });

  useEffect(() => {
    async function handleNewPeer({peerID, createOffer}:Record<string, string>) {
      if(peerID in peerConnections.current){
        console.warn("Already connected")
      }
      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice()
      })

      peerConnections.current[peerID].onicecandidate = event => {
        if (event.candidate){
          socket.emit(ACTIONS.RELAY_ICE, {
             peerID,
             iceCandidate: event.candidate
          })
        }
      }
    }
    
    socket.on(ACTIONS.ADD_PEER, handleNewPeer)
  },[])

  useEffect(() => {
    async function startCapture() {
      try {
        localMediaStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: 1280,
            height: 720,
          },
        });

        addNewClient(LOCAL_VIDEO, () => {
          const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
          if (localVideoElement) {
            localVideoElement.volume = 0;
            localVideoElement.srcObject = localMediaStream.current;
          }
        });
      } catch (e) {
        console.error(`Error getting userMedia`, e);
      }
    }

    startCapture().then(() => socket.emit(ACTIONS.JOIN, { room: roomID })).catch(e => console.log('Error getting userMedia: ', e));
    return ()=>{
       localMediaStream.current?.getTracks().forEach(track => track.stop())
       socket.emit(ACTIONS.LEAVE)
    }
  }, [addNewClient, roomID]);

  const provideMediaRef = useCallback(
    (id: string, node: HTMLVideoElement | null) => {
      peerMediaElements.current[id] = node;
    },
    [],
  );

  return { clients, provideMediaRef };
}
