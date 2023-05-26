import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { Socket, io } from "socket.io-client";

class PlayerIdentity {
    name: string;
    uuid: string;
    ready: boolean = false;

    constructor(name: string, uuid: string) {
        this.name = name;
        this.uuid = uuid;
    }

    setReady(ready: boolean) {
        this.ready = ready;
    }
}

export const useGameSocket = defineStore("gameSocket", () => {

    const socketRef = ref<any>(
        io(process.env.API_URL, {
            transports: ["websocket"],
            upgrade: false,
        })
    );
    const socket = computed(() => socketRef.value as Socket);

    const playerIdentity = ref<PlayerIdentity | null>(null);

    socket.value.on("connected", () => {
        console.log("connected to server!");
    });

    socket.value.on("playerIdentity", (data: { name: string; id: string }) => {
        console.log(data);
        playerIdentity.value = new PlayerIdentity(data.name, data.id);
    });

    socket.value.on("error", (error) => {
        console.log("error connecting to server!", error);
    });

    socket.value.on("ready", (data: { ready: boolean }) => {
        console.log("readiness state", data.ready);
        playerIdentity.value?.setReady(data.ready);
    });

    return {
        connectAsPlayer: (playerName: string) => {
            socket.value.emit("playerIdentity", { name: playerName });
        },
        joinGame: (gameId: string) => {
            socket.value.emit("joinGame", { gameId });
        },
        socket,
        playerIdentity: computed(() => playerIdentity),
        getSocket: (sck: (sock: Socket) => void) => {
            sck(socket.value);
        },
    };
});
