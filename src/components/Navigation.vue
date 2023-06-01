<script setup>
const props = defineProps(['menu', 'maps']);
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
                <h2 class="text-xs uppercase">Genshin Impact &bull; Carte&nbsp;Interactive</h2>
            </div>
        </div>

        <div class="p-4">

            <ul class="grid grid-cols-4 gap-2">
                <li v-for="m in maps" class="tooltip" :data-tip="m.name">
                    <a :href="$router.resolve({ name: 'map', params: { slug: m.slug } }).href"
                        class="btn btn-block btn-square gap-2" :class="{ 'btn-outline': !m.active }">
                        <img :src="m.icon" alt="" class="w-8 h-8 grayscale"
                            :class="{ 'brightness-50': !m.active, 'brightness-200': m.active }" />
                    </a>
                </li>
            </ul>

            <ul class="grid grid-cols-4 gap-2 mt-2">
                <li v-for="m in menu" :class="{ 'col-span-4 ff-genshin text-sm': m.type === 'title' }">
                    <span v-if="m.type === 'group'" class="tooltip" :data-tip="m.title">
                        <a href="#!" @click.prevent="toggleGroup(m.group)" class="btn btn-accent btn-square gap-2"
                            :class="{ 'grayscale opacity-50': !m.active }">
                            <img :src="m.icon" alt="" class="h-8 w-8">
                        </a>
                    </span>
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