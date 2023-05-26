<script setup lang="ts">
import { useGame } from "../store/game";
import { useGameSocket } from "../store/socket";
import router from "@/router";
const socketStore = useGameSocket();
const gameStore = useGame();

// if (socketStore.playerIdentity.value == null) router.push("/");
// if (gameStore.activeGame == null) router.push("/join");
// if (gameStore.activeGame?.state != "ended") router.push("/join");
</script>
<template>
    <div class="center">
        <v-card width="250px">
            <v-card-title>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>Players</div>
                    <span style="font-size: 0.8rem; color: #888;">{{ socketStore.playerIdentity.value?.name }}</span>
                </div>
            </v-card-title>
            <v-card-text>
                <v-chip v-for="player in gameStore.activeGame?.getSortedPlayers()" :key="player.id" class="mx-2 my-2">
                    {{ player.name }} scored {{ player.score }}
                </v-chip>
            </v-card-text>
            <v-card-actions>
                <v-btn variant="outlined" @click="() => {
                    gameStore.cleanup();
                    router.push('/join');
                }">Back to lobby</v-btn>
            </v-card-actions>
        </v-card>
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
