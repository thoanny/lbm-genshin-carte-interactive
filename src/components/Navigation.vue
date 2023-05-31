<script setup>
const props = defineProps(['menu']);
const emit = defineEmits(['toggleGroup']);

function toggleGroup(id) {
    const i = props.menu.findIndex(m => m.type === 'group' && m.group === id);
    if (i >= 0) {
        props.menu[i].active = !props.menu[i].active;
        emit('toggleGroup', props.menu[i]);
    }
}
</script>

<template>
    <!-- <div class="hidden overflow-y-auto" id="menu"></div> -->
    <div class="overflow-y-auto flex-shrink-0" id="menu">
        <div class="p-4 text-center text-white shadow-lg" id="header">
            <div>
                <h1 title="J'ici" class="text-2xl">G·I·C·I</h1>
                <h2 class="text-xs uppercase mt-2">Genshin Impact &bull; Carte&nbsp;Interactive</h2>
            </div>
        </div>

        <div class="p-4">
            <ul class="flex flex-col gap-2" id="navMenu">
                <li v-for="m in menu" :class="m.type" class="flex gap-2">
                    <a href="#!" @click.prevent="toggleGroup(m.group)" v-if="m.type === 'group'"
                        class="btn btn-accent btn-block btn-sm gap-2" :class="{ 'grayscale opacity-50': !m.active }">
                        <img :src="m.icon" alt="" class="h-4 w-4">
                        <span>{{ m.title }}</span>
                    </a>
                    <span v-else>{{ m.title }}</span>
                </li>
            </ul>
            <ul class="grid grid-cols-2 gap-2 space-y-2 text-gray-600 text-sm">
                <li class="text-xs col-span-2 pt-4 text-center uppercase font-semibold leading-5">
                    ·&nbsp;·&nbsp;·<br /><span id="total-visits">0</span>&nbsp;visites<br /><span
                        id="total">0</span>&nbsp;marqueurs<br /><span id="total-users">0</span>&nbsp;utilisateurs
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
#menu {
    width: 250px;
    height: 100%;
    overflow: auto;
    background: #e8e2d7;
}

#menu h1 {
    font-family: 'Genshin', serif;
}

#menu #header {
    position: sticky;
    top: 0;
    background: #3d4555;
    z-index: 9;
}

#menu .title {
    @apply text-sm;
    font-family: 'Genshin', sans-serif;
}
</style>