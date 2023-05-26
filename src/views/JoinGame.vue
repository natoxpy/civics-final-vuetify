<script lang="ts" setup>
import { ref } from "vue";
import { useGame } from "../store/game";
import { useGameSocket } from "../store/socket";
import router from "@/router";
const socketStore = useGameSocket();
const gameStore = useGame();

if (socketStore.playerIdentity.value == null) router.push("/");

const gameCodeInput = ref("");

let creatingNewGame = false;

const createGame = () => {
    if (creatingNewGame) return;

    setTimeout(() => {
        creatingNewGame = false;
    }, 1000);

    creatingNewGame = true;
    console.log("create new game");

    socketStore.socket.emit("createGame");
};

const joinGame = () => {
    socketStore.socket.emit("joinGame", { gameId: gameCodeInput.value });
};

const leaveGame = () => {
    socketStore.socket.emit("leaveGame");
};
</script>
<template>
    <div>
        <div class="center">
            <v-card variant="outlined" style="width: 220px;" v-if="gameStore.activeGame == null">
                <v-card-text>
                    <v-text-field label="Game Code" clearable maxlength="3" v-model="gameCodeInput"></v-text-field>
                    <v-btn variant="tonal" class="ml-auto mr-2" @click="joinGame">
                        Join
                    </v-btn>
                    <v-btn variant="tonal" color="blue" class="ml-auto" @click="createGame">
                        Create
                    </v-btn>
                </v-card-text>
            </v-card>
            <v-card v-if="gameStore.activeGame != null">
                <v-card-title>
                    Game Code: {{ gameStore.activeGame.gameId }}
                </v-card-title>
                <v-card-subtitle v-if="gameStore.activeGame.startTime != null">
                    starts in {{ Math.ceil(gameStore.activeGame.startTime / 1000) }}
                </v-card-subtitle>
                <v-card-text>
                    <div class="players-container mb-2">
                        <v-chip v-for="player in gameStore.activeGame.players" :key="player.id"
                            :prepend-icon="player.ready ? 'mdi-check' : 'mdi-close'" :color="player.ready ? 'green' : 'red'"
                            class="mr-2 mb-2">
                            {{ player.name }}
                        </v-chip>
                    </div>
                    <v-btn :color="!socketStore.playerIdentity.value?.ready ? 'green' : 'red'" class="mr-2" @click="
                        socketStore.socket.emit('ready', {
                            ready: !socketStore.playerIdentity.value?.ready,
                        })
                    ">
                        {{ socketStore.playerIdentity.value?.ready ? "Not Ready" : "Ready" }}
                    </v-btn>

                    <v-btn @click="leaveGame">Leave</v-btn>
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>

<style scoped lang="sass">
.center
    display: flex
    justify-content: center
    align-items: center
    height: 100vh
    width: 100vw
</style>
