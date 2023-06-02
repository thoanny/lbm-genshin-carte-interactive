<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user.js';

const emit = defineEmits(['modal']);

const loading = ref(false);
const error = ref(null);
const email = ref(null);
const password = ref(null);

const user = useUserStore()

async function handleSubmit() {
    error.value = null;
    loading.value = true;

    if (!email.value || !password.value) {
        error.value = 'Vous devez saisir un e-mail et un mot de passe.';
        loading.value = false;
        return;
    }

    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.value))) {
        error.value = 'Adresse e-mail invalide.';
        loading.value = false;
        return;
    }

    user.login(email.value, password.value).then(() => {
        email.value = null;
        emit('modal');
    }).catch(e => {
        error.value = e;
    }).finally(() => {
        loading.value = false;
        password.value = null;
    });
}

</script>
<template>
    <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="$emit('modal')">✕</button>
    <h4 class="text-xl font-bold -mt-3 mb-4">Connexion</h4>

    <form @submit.prevent="handleSubmit">
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
                <span class="label-text">Adresse e-mail</span>
            </label>
            <input type="email" placeholder="john@doe.fr" class="input input-bordered bg-white" v-model="email" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Mot de passe</span>
            </label>
            <input type="password" placeholder="************" class="input input-bordered bg-white" v-model="password" />
        </div>
        <div class="modal-action justify-start">
            <button class="btn btn-block mt-2" type="submit" :class="{ 'loading': loading }"
                v-text="(loading) ? 'Veuillez patienter...' : 'Se connecter'"></button>
        </div>
    </form>
</template>
