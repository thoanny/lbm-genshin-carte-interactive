<script setup>
import L from 'leaflet';
import { ref, onMounted } from 'vue';
import Navigation from '@/components/Navigation.vue';

const UPLOADS = 'http://127.0.0.1:8000/uploads/api/genshin/maps';

let genshinMap;
let icons = {};
let groups = {};

const menu = ref([]);
const loading = ref(true);
const userData = ref(null);

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

onMounted(() => {

  fetch('http://127.0.0.1:8000/api/genshin/map/teyvat').then(res => res.json()).then(data => {

    genshinMap = new L.Map('map', {
      center: data.map.center,
      zoom: data.map.zoom,
      zoomControl: false
    });

    L.tileLayer(data.map.tiles + '/{z}/{x}/{y}.jpg', {
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
    <Navigation :menu="menu" @toggle-group="handleToggleGroup" />
    <div id="map-wrap">
      <div id="map"></div>
    </div>
  </div>
</template>

<style scoped>
#map-wrap {
  width: 100%;
}

#map {
  height: 100vh;
  width: 100%;
  outline: 0;
  cursor: crosshair;
}

#loading {
  z-index: 410;
}
</style>
