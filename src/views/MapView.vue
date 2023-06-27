<script setup>
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';
import { ref, onMounted, watch } from 'vue';
import Navigation from '@/components/Navigation.vue';
import Login from '@/components/Login.vue';
import Register from '@/components/Register.vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user.js';
import { storeToRefs } from 'pinia';

const route = useRoute();

const LBM_API = 'https://api.lebusmagique.fr';
const UPLOADS = LBM_API + '/uploads/api/genshin/maps';

const mapName = (typeof route.params.slug !== 'undefined') ? route.params.slug : 'teyvat';
const user = useUserStore();
user.setMap(mapName);

const { userMarkers } = storeToRefs(user);

let genshinMap;
let icons = {};
let groups = {};
let markers = {};

const maps = ref([]);
const menu = ref([]);
const menuOpen = ref(true);
const loading = ref(true);
const modal = ref(null);
const modalMedia = ref(null);
const markersCount = ref(0);



// Leaflet functions

function unproject(coord) {
  return genshinMap.unproject(coord, genshinMap.getMaxZoom());
}

function onMapClick(e) {
  console.log("@" + genshinMap.project([e.latlng.lat, e.latlng.lng], genshinMap.getMaxZoom()) + " @Zoom(" + genshinMap.getZoom() + ")");
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

function handleModal(name = null) {
  modal.value = name;
}

function handleGoTo(x, y, z) {
  genshinMap.flyTo(unproject([x, y]), z);
}

function updateMarkerCheckbox(markerId, add) {
  user.updateMarker(add, markerId);
  if (add) {
    markers[markerId].setOpacity(.5);
  } else {
    markers[markerId].setOpacity(1);
  }
}

function popUpOpen(e) {
  const { markerId, format, title, image, video, text, checkbox, guide, icon } = e.popup.options;

  let popupContent = '';

  // Titre
  popupContent += '<h4 class="text-sm font-bold mb-2 flex items-center gap-1">';
  popupContent += '<img src="' + icon.options.iconUrl + '" class="h-6 w-6 self-start" />'
  if (format === 'todo') {
    popupContent += 'Marqueur ' + markerId;
  } else {
    popupContent += title;
  }
  popupContent += '</h4>';

  // Média
  if (format === 'image' && image) {
    popupContent += '<a href="' + UPLOADS + '/medias/' + image + '" target="_blank" class="block mb-2 relative aspect-video overflow-hidden rounded-lg modal-image"><div class="flex w-full h-full justify-center items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-20 h-20 text-white"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg></div><img src="' + UPLOADS + '/medias/' + image + '" alt="" class=" absolute top-0 w-full h-full object-cover" /></a>';
  } else if (format === 'banner' && image) {
    popupContent += '<img src="' + UPLOADS + '/medias/' + image + '" alt="" class="block mb-2 rounded-lg" />';
  } else if (format === 'video' && video) {
    const match = video.match(/^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (match && match[1]) {
      popupContent += '<a class="block mb-2 relative aspect-video overflow-hidden rounded-lg modal-video" href="https://youtu.be/' + match[1] + '" data-video-id="' + match[1] + '" target="_blank"><div class="flex w-full h-full justify-center items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-20 h-20 text-white"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg></div><img src="https://i.ytimg.com/vi/' + match[1] + '/hqdefault.jpg" class="absolute top-0 w-full h-full object-cover" /></a>';
    }
  }

  // Texte
  if (format === 'todo') {
    popupContent += '<p class="!mt-0 !mb-2 text-sm italic">Information pour ce marqueur prochainement disponible...</p>';
  } else if (text) {
    popupContent += '<p class="!mt-0 !mb-2 text-sm">' + text + '</p>';
  }

  if (!user.loggedIn) {
    popupContent += '<div class="alert alert-info rounded-lg"><div><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Créez un compte et/ou connectez-vous pour utiliser le suivi des marqueurs.</span></div></div>';
  }

  // Guide
  // Checkbox
  if (checkbox || guide) {
    popupContent += '<div class="flex gap-2 items-center justify-between mt-2">';
    if (checkbox && user.loggedIn) {
      popupContent += '<div class="form-control"><label class="label cursor-pointer gap-1 p-0"><input type="checkbox" class="toggle toggle-sm toggle-success" data-popup-checkbox="' + markerId + '" ';
      if (user.userMarkers && user.userMarkers.indexOf(markerId) >= 0) {
        popupContent += 'checked="checked"'
      }
      popupContent += ' /><span class="label-text text-black font-semibold">Terminé</span></label></div>';
    }
    if (guide) {
      popupContent += '<a href="' + guide + '" target="_blank" class="btn btn-sm gap-2 justify-between">Guide <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" /></svg></a>';
    }
    popupContent += '</div>';
  }

  e.popup.setContent(popupContent);
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
    genshinMap.on('popupopen', popUpOpen);

    // Initialisation de icons
    data.icons.forEach(icon => {
      icons[icon.id] = L.icon({
        iconUrl: UPLOADS + '/icons/' + icon.icon,
        iconSize: icon.iconSize,
        iconAnchor: icon.iconAnchor,
        popupAnchor: icon.popupAnchor
      });
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

      const marker = L.marker(unproject([(m.x), (m.y)]), { icon: icons[icon], riseOnHover: true });

      if (format === 'region') {
        marker.bindTooltip(m.title, { permanent: true, className: 'region', offset: [0, 13], direction: 'top' }).openTooltip();
      } else if (format !== 'simple') {
        marker.bindPopup('', {
          format: format,
          title: m.title,
          text: (m.text) ? m.text : g.text,
          guide: (m.guide) ? m.guide : g.guide,
          image: m.image,
          video: m.video,
          checkbox: g.checkbox,
          markerId: m.id,
          icon: icons[icon]
        });
      }

      marker.addTo(groups[m.groupId]);
      markers[m.id] = marker;
      markersCount.value++;
    });

    const resizeObserver = new ResizeObserver(() => {
      genshinMap.invalidateSize();
    });
    resizeObserver.observe(document.getElementById('map'));

    const { x, y, z, g, m } = route.query;

    if (typeof (g) !== 'undefined') {
      g.split(',').forEach(id => {
        if (typeof groups[id] !== 'undefined') {
          genshinMap.addLayer(groups[id]);
          const i = menu.value.findIndex(m => m.type === 'group' && m.group === parseInt(id));
          if (i >= 0) {
            menu.value[i].active = true;
          }
        }
      });
    }

    if (typeof (x) !== 'undefined' && typeof (y) !== 'undefined') {
      if (typeof (z) !== 'undefined' && z >= genshinMap.getMinZoom() && z <= genshinMap.getMaxZoom()) {
        genshinMap.setView(unproject([x, y]), z);
      } else {
        genshinMap.setView(unproject([x, y]), genshinMap.getMaxZoom());
      }
    }

    if (typeof (m) !== 'undefined' && parseInt(m) === 0) {
      menuOpen.value = false;
    }

    loading.value = false;
  });

  document.addEventListener('click', (e) => {
    if (e.target && e.target.dataset.popupCheckbox) {
      updateMarkerCheckbox(e.target.dataset.popupCheckbox, e.target.checked);
    } else if (e.target && e.target.closest('.modal-image')) {
      e.preventDefault();
      modal.value = 'image';
      modalMedia.value = e.target.closest('.modal-image').href;
    } else if (e.target && e.target.closest('.modal-video')) {
      e.preventDefault();
      modal.value = 'video';
      modalMedia.value = e.target.closest('.modal-video').dataset.videoId;
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.keyCode === 27) {
      if (modal.value) {
        modal.value = null;
      }
    }
  });

  watch(userMarkers, () => {
    if (Object.keys(userMarkers.value).length === 0) {
      Object.entries(markers).forEach(m => {
        markers[m[0]] = m[1].setOpacity(1);
      });
    } else {
      userMarkers.value.forEach(m => {
        markers[m].setOpacity(.5);
      });
    }
  });

});

watch(modal, (a, b) => {
  if (b === 'video') {
    modalMedia.value = null;
  }
});

</script>

<template>
  <div v-if="loading" class="flex h-screen w-screen items-center justify-center absolute top-0 left-0 bg-base-100"
    id="loading">
    <span class="btn btn-ghost loading">Chargement de la carte en cours...</span>
  </div>
  <div class="flex h-screen overflow-hidden">
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

        <div class="tooltip tooltip-right" data-tip="Réinitialiser le suivi des marqueurs" v-if="user.loggedIn">
          <button class="btn btn-accent btn-square shadow btn-sm" @click="handleModal('reset')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <div class="tooltip tooltip-right" data-tip="À propos">
          <button class="btn btn-accent btn-square shadow btn-sm" @click="handleModal('about')">
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
  <div class="modal bg-opacity-90">
    <div class="modal-box">
      <h4 class="text-xl font-bold">Genshin Impact • Carte Interactive</h4>
      <p>Réalisée par Thoanny pour <a href="https://gaming.lebusmagique.fr" target="_blank"
          class="font-semibold underline">Le Bus
          Magique</a>. <br />Cartes mises à jour par l'équipe LBM Gaming.</p>
      <h4 class="text-xl font-bold mt-4">Suivi des marqueurs</h4>
      <p>Vous devez vous connecter pour utiliser la fonction de suivi des marqueurs. Un cookie de connexion est créé à la
        connexion pour une durée de 1&nbsp;heure.</p>
      <h4 class="text-xl font-bold mt-4">Menu de navigation</h4>
      <p>Les catégories activées dans le menu sont enregistrées dans votre navigateur avec la fonction "localStorage".</p>
      <h4 class="text-xl font-bold mt-4">Se connecter avec Discord</h4>
      <p>Cette fonction a été supprimée. Pour vous connecter, vous devez créer un compte Le Bus Magique en
        cliquant sur le bouton "Inscription".</p>
      <div class="modal-action">
        <button @click="handleModal" class="btn btn-block">Fermer</button>
      </div>
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'login'" />
  <div class="modal bg-opacity-90">
    <div class="modal-box relative">
      <Login @modal="handleModal" />
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'register'" />
  <div class="modal bg-opacity-90">
    <div class="modal-box relative">
      <Register @modal="handleModal" />
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'image'" />
  <div class="modal bg-opacity-90">
    <div class="modal-box relative max-w-3xl p-0">
      <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="handleModal">✕</button>
      <img :src="modalMedia" alt="">
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'video'" />
  <div class="modal bg-opacity-90">
    <div class="modal-box relative max-w-3xl p-0">
      <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="handleModal">✕</button>
      <iframe v-if="modalMedia" class="aspect-video w-full h-full" width="560" height="315"
        :src="'https://www.youtube-nocookie.com/embed/' + modalMedia" title="YouTube video player" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>
    </div>
  </div>

  <input type="checkbox" class="modal-toggle" :checked="modal === 'reset'" />
  <div class="modal bg-opacity-90">
    <div class="modal-box relative">
      <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="handleModal">✕</button>
      <h4 class="text-xl font-bold -mt-3 mb-4">Réinitialiser le suivi des marqueurs</h4>
      <p>Êtes-vous sûr de vouloir supprimer le suivi de tous vos marqueurs pour cette carte&nbsp;? <strong>Cette action
          est irréversible.</strong></p>
      <div class="modal-action">
        <button class="btn btn-error btn-block btn-outline"
          @click="() => { user.resetMarkers(); handleModal(); }">Confirmer la
          réinitialisation</button>
      </div>
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
