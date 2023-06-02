<script setup>
import L from 'leaflet';
import { ref, onMounted } from 'vue';
import Navigation from '@/components/Navigation.vue';
import Login from '@/components/Login.vue';
import Register from '@/components/Register.vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const LBM_API = 'https://api.lebusmagique.fr';
const UPLOADS = LBM_API + '/uploads/api/genshin/maps';

const mapName = (typeof route.params.slug !== 'undefined') ? route.params.slug : 'teyvat';

let genshinMap;
let icons = {};
let groups = {};

const maps = ref([]);
const menu = ref([]);
const menuOpen = ref(true);
const loading = ref(true);
const modal = ref(null);
const markersCount = ref(0);

// Leaflet functions

function unproject(coord) {
  return genshinMap.unproject(coord, genshinMap.getMaxZoom());
}

function onMapClick(e) {
  console.log("@" + genshinMap.project([e.latlng.lat, e.latlng.lng], genshinMap.getMaxZoom()));
}

function handleToggleGroup(m) {
  if (m.active) {
    genshinMap.addLayer(groups[m.group]);
  } else {
    genshinMap.removeLayer(groups[m.group]);
  }
}

function handleZoomIn() {
  // console.log(genshinMap, genshinMap.getZoom(), genshinMap.getMinZoom(), genshinMap.getMaxZoom())
  if (genshinMap.getZoom() < genshinMap.getMaxZoom()) {
    genshinMap.setZoom(genshinMap.getZoom() + 1);
  }
}

function handleZoomOut() {
  if (genshinMap.getZoom() > genshinMap.getMinZoom()) {
    genshinMap.setZoom(genshinMap.getZoom() - 1);
  }
}

function handleMenu() {
  menuOpen.value = !menuOpen.value;
}

function handleResetUserMarkers() {
  alert('TODO');
}

function handleAboutPopup() {
  modal.value = 'about';
}

function handleModal(name = null) {
  modal.value = name;
}

function handleGoTo(x, y, z) {
  genshinMap.flyTo(unproject([x, y]), z);
}

onMounted(() => {

  fetch(LBM_API + '/api/genshin/map/' + mapName).then(res => res.json()).then(data => {

    genshinMap = new L.Map('map', {
      center: data.map.center,
      zoom: data.map.zoom,
      zoomControl: false
    });

    L.tileLayer(LBM_API + data.map.tiles + '/{z}/{x}/{y}.jpg', {
      attribution: '<a href="https://gaming.lebusmagique.fr">LBM Gaming</a>',
      maxZoom: data.map.maxZoom,
      minZoom: data.map.minZoom,
      maxBoundsViscosity: 0.8,
      noWrap: true
    }).addTo(genshinMap);

    genshinMap.setMaxBounds(new L.LatLngBounds(unproject([data.map.bounds[0], data.map.bounds[1]]), unproject([data.map.bounds[2], data.map.bounds[3]])));

    genshinMap.on('click', onMapClick);
    // genshinMap.on('popupopen', popUpOpen);

    // Initialisation de icons
    data.icons.forEach(icon => {
      icons[icon.id] = L.icon({ iconUrl: UPLOADS + '/icons/' + icon.icon, iconSize: icon.iconSize, iconAnchor: icon.iconAnchor, popupAnchor: icon.popupAnchor });
    });

    // Initialisation de groups
    data.groups.forEach(group => {
      groups[group.id] = L.layerGroup();
      // genshinMap.addLayer(groups[group.id]);
    });

    // Création du menu
    data.maps.forEach((m) => {
      maps.value.push({
        name: m.name,
        slug: m.slug,
        icon: UPLOADS + '/icons/' + m.iconUrl,
        active: m.slug === mapName
      });
    });
    data.sections.forEach(section => {
      menu.value.push({
        type: 'title',
        title: section.name,
      });

      const sectionGroups = data.groups.filter(group => group.sectionId === section.id);
      sectionGroups.forEach(g => {
        menu.value.push({
          type: 'group',
          title: g.title,
          group: g.id,
          icon: UPLOADS + '/icons/' + g.iconUrl,
          active: false,
        });
      });
    });

    // Création des marqueurs
    data.markers.forEach(m => {
      const g = data.groups.find(g => g.id === m.groupId);

      const icon = (m.iconId) ? m.iconId : g.iconId;
      const format = (m.format) ? m.format : g.format;
      const text = (m.text) ? m.text : g.text;
      const checkbox = g.checkbox;
      const image = m.image;
      const video = m.video;
      const guide = (m.guide) ? m.guide : g.guide;

      const marker = L.marker(unproject([(m.x), (m.y)]), { icon: icons[icon], riseOnHover: true });

      const _guide_ = (guide) ? '<a href="' + guide + '" class="guide" target="_blank">Guide</a>' : '';
      const _checkbox_ = (checkbox) ? '<label><input type="checkbox" id="user-marker" data-id="' + m.slug + '" /><span>Terminé</span></label>' : '';
      const _video_ = (video) ? 'TODO' : '';

      if (format === 'popup') {
        marker.bindPopup(m.title + text + _guide_ + _checkbox_);
      } else if (format === 'video') {
        marker.bindPopup(m.title + '<a class="video" href="//www.youtube.com/watch?v=' + _video_ + '" data-lity><img src="https://i.ytimg.com/vi/' + _video_ + '/hqdefault.jpg" /></a>' + text + _guide_ + _checkbox_);
      } else if (format === 'image') {
        marker.bindPopup(m.title + '<a href="' + UPLOADS + '/medias/' + image + '" class="image" data-lity><img src="thumb/' + image + '" /></a>' + text + _guide_ + _checkbox_);
      } else if (format === 'banner') {
        marker.bindPopup(m.title + '<img src="' + UPLOADS + '/medias/' + image + '" />' + text + _guide_ + _checkbox_);
      } else if (format === 'region') {
        marker.bindTooltip(m.title, { permanent: true, className: 'region', offset: [0, 13], direction: 'top' }).openTooltip();
      } else if (format === 'todo') {
        marker.bindPopup('<h4>' + m.slug + '</h4>' + '<p><em>Information pour ce marqueur prochainement disponible...</em></p>' + _checkbox_);
      }

      marker.addTo(groups[m.groupId]);
      markersCount.value++;
    });

    loading.value = false;
  });


})
</script>

<template>
  <div v-if="loading" class="flex h-screen w-screen items-center justify-center absolute top-0 left-0 bg-base-100"
    id="loading">
    <span class="btn btn-ghost loading">Chargement de la carte en cours...</span>
  </div>
  <div class="flex h-screen">
    <Navigation :menuOpen="menuOpen" :menu="menu" :maps="maps" :markersCount="markersCount"
      @toggle-group="handleToggleGroup" @modal="handleModal" />
    <div id="map-wrap">
      <div class="toolbar flex flex-col gap-3 absolute top-3 left-3">
        <div class="tooltip tooltip-right" data-tip="Afficher/Masquer le menu">
          <button class="btn btn-accent btn-square shadow btn-sm" @click="handleMenu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="flex flex-col gap-1">
          <div class="tooltip tooltip-right" data-tip="Zoomer">
            <button class="btn btn-accent btn-square shadow btn-sm" @click="handleZoomIn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path
                  d="M9 6a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 6z" />
                <path fill-rule="evenodd"
                  d="M2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm7-5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div class="tooltip tooltip-right" data-tip="Dézoomer">
            <button class="btn btn-accent btn-square shadow btn-sm" @click="handleZoomOut">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M6.75 8.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" />
                <path fill-rule="evenodd"
                  d="M9 2a7 7 0 104.391 12.452l3.329 3.328a.75.75 0 101.06-1.06l-3.328-3.329A7 7 0 009 2zM3.5 9a5.5 5.5 0 1111 0 5.5 5.5 0 01-11 0z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div class="tooltip tooltip-right" data-tip="Réinitialiser le suivi des marqueurs">
          <button class="btn btn-accent btn-square shadow btn-sm" @click="handleResetUserMarkers">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="tooltip tooltip-right" data-tip="À propos">
          <button class="btn btn-accent btn-square shadow btn-sm" @click="handleAboutPopup">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="flex flex-col gap-1" v-if="mapName == 'teyvat'">
          <div class="tooltip tooltip-right" data-tip="Zoomer sur Mondstadt">
            <button class="btn btn-accent btn-circle shadow btn-sm ff-genshin"
              @click="handleGoTo(9551, 4389, 5)">M</button>
          </div>
          <div class="tooltip tooltip-right" data-tip="Zoomer sur Liyue">
            <button class="btn btn-accent btn-circle shadow btn-sm ff-genshin"
              @click="handleGoTo(8414, 7222, 5)">L</button>
          </div>
          <div class="tooltip tooltip-right" data-tip="Zoomer sur Inazuma">
            <button class="btn btn-accent btn-circle shadow btn-sm ff-genshin"
              @click="handleGoTo(13210, 9878, 5)">I</button>
          </div>
          <div class="tooltip tooltip-right" data-tip="Zoomer sur Sumeru">
            <button class="btn btn-accent btn-circle shadow btn-sm ff-genshin"
              @click="handleGoTo(5878, 7046, 5)">S</button>
          </div>
        </div>
      </div>
      <div id="map"></div>
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'about'" />
  <div class="modal">
    <div class="modal-box">
      <h4 class="text-xl font-bold">Genshin Impact • Carte Interactive</h4>
      <p>Réalisée par Thoanny pour <a href="https://gaming.lebusmagique.fr" target="_blank"
          class="font-semibold underline">Le Bus
          Magique</a>. <br />Mise à jour par l'équipe LBM Gaming.</p>
      <h4 class="text-xl font-bold mt-4">Suivi des marqueurs</h4>
      <p>Si vous n'êtes pas connecté·e, cette carte interactive utilise la fonction "localStorage" pour enregistrer le
        suivi de vos
        marqueurs. Ces informations sont stockées directement dans votre navigateur.</p>
      <h4 class="text-xl font-bold mt-4">Se connecter avec Discord</h4>
      <p>En vous identifiant avec Discord, le suivi de vos marqueurs ainsi que l'état de votre menu
        (éléments actifs/inactifs) sont enregistrés dans une base de données, pour vous offrir une expérience continue
        entre vos différentes sessions.</p>
      <div class="modal-action">
        <button @click="handleModal" class="btn btn-block">Fermer</button>
      </div>
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'login'" />
  <div class="modal">
    <div class="modal-box relative">
      <Login @modal="handleModal" />
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'register'" />
  <div class="modal">
    <div class="modal-box relative">
      <Register @modal="handleModal" />
    </div>
  </div>
</template>

<style scoped>
#map-wrap {
  width: 100%;
  position: relative;
}

#map {
  background: #000;
  height: 100vh;
  width: 100%;
  outline: 0;
  cursor: crosshair;
}

#loading {
  z-index: 420;
}

.toolbar {
  z-index: 410;
}
</style>
