import { defineStore } from 'pinia';
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

const LBM_API = 'https://api.lebusmagique.fr/api';

export const useUserStore = defineStore('user', () => {
    const loading = ref(false);
    const loggedIn = ref(false);
    const token = ref(null);
    const user = ref(null);
    const userMarkers = ref([]);
    const map = ref(null);

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
            userMarkers.value = [];
            toast.success("Vous avez été déconnecté·e.", {
                autoClose: 3000,
            });
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
            getUserMarkers();
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

    async function getUserMarkers() {
        if (!token.value || !map.value) {
            return;
        }
        await fetch(LBM_API + '/user/genshin/map/' + map.value, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.value
            }
        }).then(res => {
            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error('Un compte existe déjà avec ce pseudonyme ou cette adresse e-mail.');
                }

                throw new Error('Erreur ' + res.status + ': (' + res.statusText + ')');
            }
            return res.json()
        }).then(data => {
            userMarkers.value = data;
        });
    }

    async function updateMarker(add, marker) {

        if (!token.value || !map.value) {
            return;
        }

        await fetch(LBM_API + '/user/genshin/map/marker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.value
            },
            body: JSON.stringify({ map: map.value, action: (add) ? 'add' : 'remove', marker: marker })
        }).then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    logout();
                    throw new Error('Un compte existe déjà avec ce pseudonyme ou cette adresse e-mail.');
                } else {
                    throw new Error('Erreur ' + res.status + ': (' + res.statusText + ')');
                }
            }

            if (add) {
                userMarkers.value.push(parseInt(marker));
                toast.success('Marqueur ajouté.', {
                    autoClose: 3000,
                });
            } else {
                userMarkers.value = userMarkers.value.filter(m => m !== parseInt(marker));
                toast.success('Marqueur supprimé.', {
                    autoClose: 3000,
                });
            }
        }).catch(() => {
            toast.error('Erreur lors de l\'ajout ou la suppression du suivi du marqueur...', {
                autoClose: 3000,
            });
        });

    }

    function setMap(m) {
        map.value = m;
    }

    function getLoggedIn() {
        return loggedIn.value;
    }

    async function resetMarkers() {
        if (!token.value) {
            return;
        }
        await fetch(LBM_API + '/user/genshin/map/markers/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.value
            },
            body: JSON.stringify({ map: map.value })
        }).then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    logout();
                    throw new Error('Vous n\'êtes pas ou plus connecté·e.');
                } else {
                    throw new Error('Erreur ' + res.status + ': (' + res.statusText + ')');
                }
            }

            userMarkers.value = [];
            toast.success('Suivi des marqueurs réinitialisé.', {
                autoClose: 3000,
            });
        }).catch(() => {
            toast.error('Erreur lors de la réinitialisation du suivi des marqueurs...', {
                autoClose: 3000,
            });
        });
    }

    getToken();
    getUser();

    return { loggedIn, user, loading, userMarkers, login, logout, register, getUserMarkers, updateMarker, setMap, getLoggedIn, resetMarkers }
})