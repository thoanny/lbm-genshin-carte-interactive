<script setup>
import { useUserStore } from '@/stores/user.js';

const props = defineProps(['menuOpen', 'menu', 'maps', 'markersCount']);
const emit = defineEmits(['toggleGroup', 'modal']);

const user = useUserStore();

function toggleGroup(id) {
    const i = props.menu.findIndex(m => m.type === 'group' && m.group === id);
    if (i >= 0) {
        props.menu[i].active = !props.menu[i].active;
        emit('toggleGroup', props.menu[i]);
    }
}

</script>

<template>
    <div class="overflow-y-auto flex-shrink-0" id="menu" :class="{ 'hidden': !menuOpen }">
        <div class="p-4 pb-0 text-center text-white" id="header">
            <div>
                <h2 class="text-xs uppercase ff-genshin"><span class="text-base">Genshin Impact</span><br />&bull;
                    Carte&nbsp;Interactive &bull; </h2>
            </div>
        </div>
        <div class="p-4">
            <ul class="grid grid-cols-4 gap-2">
                <li class="col-span-4" v-if="user.loading">
                    <button class="btn btn-sm btn-block gap-2 text-xs btn-ghost loading">Connexion...</button>
                </li>
                <li class="col-span-2" v-if="!user.loggedIn">
                    <button class="btn btn-sm btn-block gap-2 text-xs" @click="$emit('modal', 'login')">Connexion</button>
                </li>
                <li class="col-span-2" v-if="!user.loggedIn">
                    <button class="btn btn-sm btn-block gap-2 text-xs"
                        @click="$emit('modal', 'register')">Inscription</button>
                </li>
                <li v-if="user.user" class="col-span-4">
                    <div class="flex gap-2 items-center bg-neutral-focus p-2 rounded-xl">
                        <div class="avatar">
                            <div class="w-14 rounded-lg">
                                <img :src="user.user.avatar" />
                            </div>
                        </div>
                        <div class="flex flex-1 flex-col gap-2 items-center">
                            <div class="text-sm font-semibold uppercase">
                                {{ user.user.nickname }}
                            </div>
                            <button class="btn btn-xs btn-error gap-2  text-xs btn-block" @click="user.logout">
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </li>
                <li v-for="m in maps" class="tooltip" :data-tip="m.name">
                    <a :href="$router.resolve({ name: 'map', params: { slug: m.slug } }).href"
                        class="btn btn-primary btn-block btn-square gap-2"
                        :class="{ 'opacity-50 hover:opacity-100': !m.active }">
                        <img :src="m.icon" alt="" class="w-8 h-8 grayscale brightness-200" />
                    </a>
                </li>
            </ul>
            <ul class="grid grid-cols-4 gap-2 mt-2">
                <li v-for="m in menu" :class="{ 'col-span-4 ff-genshin text-sm': m.type === 'title' }">
                    <span v-if="m.type === 'group'">
                        <a href="#!" @click.prevent="toggleGroup(m.group)" :title="m.title" class="btn btn-square gap-2"
                            :class="{ 'grayscale btn-outline opacity-25': !m.active }">
                            <img :src="m.icon" alt="" class="h-8 w-8">
                        </a>
                    </span>
                    <span v-else>{{ m.title }}</span>
                </li>
            </ul>

            <div class="text-xs flex flex-col justify-center items-center mt-4 uppercase gap-2 font-bold text-center">
                <span class="opacity-75">·&nbsp;·&nbsp;·</span>
                <span class="opacity-75"
                    v-text="(markersCount > 1) ? markersCount + ' marqueurs' : markersCount + ' marqueur'"></span>
                <span class="opacity-75">·&nbsp;·&nbsp;·</span>
                <span class="opacity-75">Fait avec ❤ par <a href="https://thoanny.fr" target="_blank"
                        class="underline">Thoanny</a><br />pour
                    <a href="https://gaming.lebusmagique.fr" target="_blank" class="underline">Le Bus
                        Magique</a></span>
                <img src="@/assets/logo.png" alt="">
            </div>

        </div>
    </div>
</template>

<style scoped>
#menu {
    width: 250px;
    height: 100%;
    overflow: auto;
}

#menu h1 {
    font-family: 'Genshin', serif;
}

#menu #header {
    position: sticky;
    top: 0;
    z-index: 9;
}

#menu .title {
    @apply text-sm;
    font-family: 'Genshin', sans-serif;
}
</style>