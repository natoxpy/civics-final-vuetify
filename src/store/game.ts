import { ref } from "vue";
import { defineStore } from "pinia";
import { useGameSocket } from "./socket";
import router from "@/router";

export class Player {
    constructor(
        public name: string,
        public id: string,
        public ready: boolean,
        public score: number = 0
    ) { }

    setReady(ready: boolean) {
        this.ready = ready;
    }
}

export class Game {
    gameId: string;
    players: Player[] = [];
    playerTurn: Player | null = null;
    state: string = "";
    public startTime: number | null = null;
    public wasWrongWithIndex: number | null = null;
    public alreadyScoreInRound = false;
    public question: string = "";
    public answers: string[] = [];
    public timeBeforeAllowAnswersFromEveryone: number | null = null;
    public timeBeforeNextQuestion: number | null = null;
    public allowAnswersFromEveryone: boolean = false;
    public correctAnswer: {
        player: Player,
        answer: number
    } | null = null;

    constructor(gameId: string) {
        this.gameId = gameId;
        this.state = "waiting";
    }

    setGameState(state: string) {
        this.state = state;
    }

    setPlayerTurn(player: Player | null) {
        this.playerTurn = player;
    }

    addPlayer(player: Player) {
        this.players.push(player);
    }

    removePlayer(playerId: string) {
        this.players = this.players.filter((player) => player.id !== playerId);
    }

    isMyTurn(playerId: string) {
        return this.playerTurn?.id === playerId;
    }

    canAnswer(playerId: string) {
        return this.isMyTurn(playerId) || this.allowAnswersFromEveryone;
    }

    getSortedPlayers() {
        return this.players.sort((a, b) => b.score - a.score);
    }
}

export const useGame = defineStore("game", () => {
    const gameSocket = useGameSocket();
    const activeGame = ref<Game | null>(null);

    gameSocket.socket.on('playerScore', (data: { playerId: string }) => {
        const player = activeGame.value?.players.find(p => p.id === data.playerId);
        if (activeGame.value?.alreadyScoreInRound) return;

        if (!player || !activeGame.value) return;

        activeGame.value.alreadyScoreInRound = true;

        console.log(player);

        player.score++;
    });

    gameSocket.socket.on("timeBeforeAllowAnswersFromEveryone", (data: { time: number }) => {
        if (!activeGame.value) return;
        activeGame.value.timeBeforeAllowAnswersFromEveryone = data.time;
    });

    gameSocket.socket.on('gameEnded', () => {
        router.push('/ended');
    });

    gameSocket.socket.on('timeBeforeNextQuestion', (data: { time: number }) => {
        if (!activeGame.value) return;
        activeGame.value.timeBeforeAllowAnswersFromEveryone = null;
        activeGame.value.timeBeforeNextQuestion = data.time;
    });

    gameSocket.socket.on('allowEveryone', () => {
        if (!activeGame.value) return;
        activeGame.value.allowAnswersFromEveryone = true;
    });

    gameSocket.socket.on('answerIncorrect', (data: { index: number }) => {
        if (!activeGame.value) return;
        activeGame.value.wasWrongWithIndex = data.index;

    });

    gameSocket.socket.on('question', (data: { question: string, answers: string[] }) => {
        if (!activeGame.value) return;

        activeGame.value.alreadyScoreInRound = false;
        activeGame.value.correctAnswer = null;
        activeGame.value.wasWrongWithIndex = null;
        activeGame.value.timeBeforeAllowAnswersFromEveryone = null;
        activeGame.value.timeBeforeNextQuestion = null;
        activeGame.value.allowAnswersFromEveryone = false;
        activeGame.value.question = data.question;
        activeGame.value.answers = data.answers;
    });

    gameSocket.socket.on('answerCorrect', (data: {
        name: string,
        id: string,
        correctIndex: number
    }) => {
        const player = activeGame.value?.players.find(p => p.id === data.id);

        if (!player || !activeGame.value) return;

        activeGame.value.correctAnswer = {
            player,
            answer: data.correctIndex
        }
    });

    gameSocket.socket.on(
        "playerTurn",
        (player: { name: string; id: string }) => {
            console.log("player turn", player);

            const playerTurn = activeGame.value?.players.find(
                (p) => p.id === player.id
            );

            activeGame.value?.setPlayerTurn(playerTurn ? playerTurn : null);
        }
    );

    /**
     * Listens for the "joinedGame" event, which is emitted when a player joins a game.
     */
    gameSocket.socket.on(
        "joinedGame",
        (data: {
            gameId: string;
            players: [{ id: string; name: string; ready: boolean }];
        }) => {
            console.log("joined game", data.gameId);
            activeGame.value = new Game(data.gameId);

            console.log(data);

            data.players.forEach((player) => {
                activeGame.value?.addPlayer(
                    new Player(player.name, player.id, player.ready)
                );
            });
        }
    );

    /**
     * Listens for the "playerReadyState" event, which is emitted when a player's ready state changes.
     */
    gameSocket.socket.on(
        "playerReadyState",
        (player: { name: string; id: string }, state: boolean) => {
            console.log("player", player, "ready state", state);
            activeGame.value?.players.forEach((p) => {
                if (p.id === player.id) p.setReady(state);
            });
        }
    );


    gameSocket.socket.on('startGame', () => {
        router.push('/game');
    })

    gameSocket.socket.on("updateTimeToStart", (data: { time: number }) => {
        if (!activeGame.value) return;
        activeGame.value.startTime = data.time;
    })

    gameSocket.socket.on('timeToStart', (data: { startTime: number }) => {
        if (!activeGame.value) return;
        activeGame.value.startTime = data.startTime;
    });

    gameSocket.socket.on('cancelStart', () => {
        if (!activeGame.value) return;
        activeGame.value.startTime = null;
    })

    gameSocket.socket.on("gameState", (gameState: string) => {
        activeGame.value?.setGameState(gameState);
    });

    gameSocket.socket.on("leftGame", (gameId: string) => {
        console.log("left game", gameId);
        activeGame.value = null;
    });

    gameSocket.socket.on(
        "failedToJoinGame",
        (gameId: string, reason: string) => {
            console.log("failed to join game", gameId);
            console.log("reason", reason);
        }
    );

    gameSocket.socket.on(
        "playerJoined",
        (player: { name: string; id: string }) => {
            console.log("player joined", player);
            activeGame.value?.addPlayer(
                new Player(player.name, player.id, false)
            );
        }
    );

    gameSocket.socket.on(
        "playerLeft",
        (player: { name: string; id: string }) => {
            console.log("player left", player.name);
            activeGame.value?.removePlayer(player.id);
        }
    );

    const joinGame = (gameId: string) => {
        gameSocket.socket.emit("joinGame", { gameId });
    };

    const cleanup = () => {
        activeGame.value = null;
    };

    return {
        joinGame,
        activeGame,
        cleanup,
        run_test: () => { },
        // activateListeners
    };
});
