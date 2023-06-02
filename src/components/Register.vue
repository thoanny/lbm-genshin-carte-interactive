<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user.js';

const emit = defineEmits(['modal']);

const loading = ref(false);
const success = ref(false);
const error = ref(null);
const nickname = ref(null);
const email = ref(null);
const emailRepeat = ref(null);
const password = ref(null);
const passwordRepeat = ref(null);

const user = useUserStore()

async function handleSubmit() {
    error.value = null;
    loading.value = true;

    if (!nickname.value || !email.value || !emailRepeat.value || !password.value || !passwordRepeat.value) {
        error.value = 'Tous les champs sont obligatoires.';
        loading.value = false;
        return;
    }

    if (!(/^[a-zA-Z0-9]+$/.test(nickname.value))) {
        error.value = 'Seuls les caractères alphanumériques sont autorisés pour votre pseudonyme (lettres et chiffres).';
        loading.value = false;
        return;
    }

    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.value))) {
        error.value = 'Adresse e-mail invalide.';
        loading.value = false;
        return;
    }

    if (email.value !== emailRepeat.value) {
        error.value = 'Les adresses e-mail ne correspondent pas.';
        loading.value = false;
        return;
    }

    if (password.value.length < 8) {
        error.value = 'Votre mot de passe doit contenir au moins 8 caractères.';
        loading.value = false;
        return;
    }

    if (password.value !== passwordRepeat.value) {
        error.value = 'Les mots de passe ne correspondent pas.';
        loading.value = false;
        return;
    }

    user.register(nickname.value, email.value, password.value).then(() => {
        nickname.value = null;
        password.value = null;
        passwordRepeat.value = null;
        email.value = null;
        emailRepeat.value = null;
        success.value = true;
    }).catch(e => {
        password.value = null;
        passwordRepeat.value = null;
        error.value = e;
    }).finally(() => {
        loading.value = false;
    });
}

</script>
<template>
    <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="$emit('modal')">✕</button>
    <h4 class="text-xl font-bold -mt-3 mb-4">Inscription</h4>

    <div class="alert alert-success shadow-lg" v-if="success">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Votre compte a été créé.</span>
        </div>
    </div>
    <form @submit.prevent="handleSubmit" v-else>
        <div class="alert alert-error shadow-lg mb-2" v-if="error">
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ error }}</span>
            </div>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Pseudonyme</span>
            </label>
            <input type="text" placeholder="JohnDoe" class="input input-bordered bg-white" v-model="nickname" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Adresse e-mail</span>
            </label>
            <input type="email" placeholder="john@doe.fr" class="input input-bordered bg-white" v-model="email" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Répétez l'adresse e-mail</span>
            </label>
            <input type="email" placeholder="john@doe.fr" class="input input-bordered bg-white" v-model="emailRepeat" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Mot de passe</span>
            </label>
            <input type="password" placeholder="************" class="input input-bordered bg-white w-full"
                v-model="password" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Répétez le mot de passe</span>
            </label>
            <input type="password" placeholder="************" class="input input-bordered bg-white"
                v-model="passwordRepeat" />
        </div>
        <div class="modal-action justify-start">
            <button class="btn btn-block mt-2" type="submit" :class="{ 'loading': loading }"
                v-text="(loading) ? 'Veuillez patienter...' : 'S\'inscrire'"></button>
        </div>
    </form>
</template>
