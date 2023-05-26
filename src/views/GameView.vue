<script setup lang="ts">
import { ref } from "vue";
import { useGame } from "../store/game";
import { useGameSocket } from "../store/socket";
import router from "@/router";
const socketStore = useGameSocket();
const gameStore = useGame();

if (socketStore.playerIdentity.value == null) router.push("/");
if (gameStore.activeGame == null) router.push("/join");
if (gameStore.activeGame?.state == "waiting") router.push("/join");

const NotAllowToAnswer = () => {
    if (gameStore.activeGame?.wasWrongWithIndex != null) return true;
    return !gameStore.activeGame?.canAnswer(socketStore.playerIdentity.value?.uuid || 'id');
};

const sendAnswerIndex = (index: number) => {
    console.log('sending answer', index);
    socketStore.socket.emit("answer", { index: index });
}

const answerColor = (index: number) => {
    if (index == gameStore.activeGame?.wasWrongWithIndex) return "red";
    if (index == gameStore.activeGame?.correctAnswer?.answer) return "green";

    return "";
}

</script>
<template>
    <div class="center">
        <div style="display: flex; flex-direction: column;">
            <v-card style="margin-bottom: 12px;">
                <v-card-title>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>Players</div>
                        <span style="font-size: 0.8rem; color: #888;">{{
                            socketStore.playerIdentity.value?.name }}</span>
                    </div>
                </v-card-title>
                <v-card-text class="d-flex justify-center">
                    <v-chip v-for="player in gameStore.activeGame?.players" :key="player.id" class="mx-2"
                        :color="player.id == gameStore.activeGame?.playerTurn?.id ? 'green' : ''">
                        {{ player.name }}
                    </v-chip>
                </v-card-text>
            </v-card>
            <v-card :disabled="NotAllowToAnswer()">
                <v-card-title>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>Question</div>
                        <span style="font-size: 0.8rem; color: #888;"
                            v-if="gameStore.activeGame?.timeBeforeAllowAnswersFromEveryone != null">open to everyone in
                            {{ Math.ceil(gameStore.activeGame?.timeBeforeAllowAnswersFromEveryone / 1000) }}
                            seconds</span>
                        <span style="font-size: 0.8rem; color: #888;"
                            v-if="gameStore.activeGame?.timeBeforeNextQuestion != null">time left {{
                                Math.ceil(gameStore.activeGame?.timeBeforeNextQuestion / 1000) }} seconds</span>
                    </div>
                </v-card-title>
                <v-card-subtitle style="word-break: break-word;">
                    {{ gameStore.activeGame?.question }}
                </v-card-subtitle>
                <v-card-actions>
                    <v-container>
                        <v-row class="mb-2" v-for="(answer, index) in gameStore.activeGame?.answers" :key="index">
                            <v-btn variant="outlined" class="mr-2" style="width: 100%" @click="sendAnswerIndex(index)"
                                :color="answerColor(index)">
                                {{ answer }}
                            </v-btn>
                        </v-row>
                    </v-container>
                </v-card-actions>
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
