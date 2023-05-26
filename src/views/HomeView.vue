<script lang="ts" setup>
import router from "@/router";
import { ref } from "vue";
import { useGameSocket } from "../store/socket";
const socketStore = useGameSocket();

const usernameInput = ref("");

if (socketStore.playerIdentity.value != null) router.push("/join");

const continueWithUsername = () => {
    if (usernameInput.value.length < 2) return;
    socketStore.connectAsPlayer(usernameInput.value);

    socketStore.socket.on("playerIdentity", () => {
        router.push("/join");
    });
};
</script>

<template>
    <div class="center">
        <v-card variant="outlined" style="width: 220px;">
            <v-card-text>
                <v-text-field label="Username" clearable v-model="usernameInput" @keyup.enter="continueWithUsername"></v-text-field>
                <v-btn variant="tonal" class="ml-auto mr-2" @click="continueWithUsername">
                    Continue
                </v-btn>
            </v-card-text>
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
