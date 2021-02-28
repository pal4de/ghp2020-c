// source: https://day-journal.com/memo/try-054/
// todo: ダミーデータを用意し、そこに任意のマーカー (消火栓など) を表示できるかを調査

const attribution = `
    <a href="https://maptiler.jp/" target="_blank">&copy; MIERUNE</a>
    <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>
    <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>`

const m_streets = new L.tileLayer(
    `https://api.maptiler.com/maps/jp-mierune-streets/256/{z}/{x}/{y}.png?key=${API_KEY}`,
    {
        attribution: attribution
    }
);

const m_gray = new L.tileLayer(
    `https://api.maptiler.com/maps/jp-mierune-gray/256/{z}/{x}/{y}.png?key=${API_KEY}`,
    {
        attribution: attribution
    }
);

const map = L.map('map', {
    center: [32.80953813626903, 130.71637940099387],
    zoom: 12,
    zoomControl: true,
    layers: [m_streets],
});

const Map_BaseLayer = {
    'MIERUNE Streets': m_streets,
    'MIERUNE Gray': m_gray,
};

L.control.layers(Map_BaseLayer, null).addTo(map);

L.control
    .scale({
        imperial: false,
        maxWidth: 300,
    })
    .addTo(map);

// // GeoPackage読み込み
// L.geoPackageFeatureLayer([], {
//     // GeoPackageファイル指定
//     geoPackageUrl: './data/shop.gpkg',
//     // レイヤ名指定
//     layerName: 'shop',
//     pointToLayer: function (feature, layer) {
//         return L.circleMarker(layer, {
//             color: '#014c86',
//             radius: 3,
//             weight: 1,
//             opacity: 0.7,
//             fill: true,
//             fillColor: '#014c86',
//             fillOpacity: 0.7
//         });
//     },
//     onEachFeature: function (feature, layer) {
//         const field =
//             `fid: ${feature.properties.fid} <br>
//             full_id: ${feature.properties.full_id} <br>
//             osm_id: ${feature.properties.osm_id} <br>
//             name: ${feature.properties.name} <br>
//             shop: ${feature.properties.shop}`;
//         layer.bindPopup(field);
//     }
// }).addTo(map);
