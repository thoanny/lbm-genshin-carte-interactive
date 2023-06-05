import { defineStore } from 'pinia';
import { ref } from 'vue';

const LBM_API = 'https://api.lebusmagique.fr/api';

export const useUserStore = defineStore('user', () => {
    const loading = ref(false);
    const loggedIn = ref(false);
    const token = ref(null);
    const user = ref(null);
    const markers = ref([]);

    async function login(email, password) {

        await fetch(LBM_API + '/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: email, password: password })
        }).then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Identifiants invalides');
                }

                throw new Error('Erreur ' + res.status + ': (' + res.statusText + ')');
            }
            return res.json()
        }).then(data => {
            if (typeof data.token === 'undefined') {
                throw new Error('Impossible de vous connecter.');
            }
            token.value = data.token;
            loggedIn.value = true;
            document.cookie = "token=" + data.token + "; samesite=strict; max-age=" + 119 * 60;
            getUser();
        });
    }

    function logout() {
        if (token.value) {
            document.cookie = "token=" + token.value + "; samesite=strict; max-age=0";
            token.value = null;
            loggedIn.value = false;
            user.value = null;
        }

    }

    function getToken() {
        const cookieToken = document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1];
        if (typeof cookieToken !== 'undefined') {
            token.value = cookieToken;
        }
    }

    async function getUser() {
        if (!token.value) {
            return;
        }

        loading.value = true;

        await fetch(LBM_API + '/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.value
            }
        }).then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    logout();
                    throw new Error('Identifiants invalides.');
                }

                throw new Error('Erreur ' + res.status + ': (' + res.statusText + ')');
            }
            return res.json()
        }).then(data => {
            loggedIn.value = true;
            user.value = data;
        }).finally(() => {
            loading.value = false;
        });
    }

    async function register(nickname, email, password) {
        await fetch(LBM_API + '/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname: nickname, email: email, password: password })
        }).then(res => {
            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error('Un compte existe déjà avec ce pseudonyme ou cette adresse e-mail.');
                }

                throw new Error('Erreur ' + res.status + ': (' + res.statusText + ')');
            }
            return res.json()
        }).then(() => {
            return true;
        });
    }

    getToken();
    getUser();

    return { loggedIn, user, markers, loading, login, logout, register }
})