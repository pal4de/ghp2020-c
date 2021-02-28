// source: https://day-journal.com/memo/try-054/

const attribution = `
    <a href="https://maptiler.jp/" target="_blank">&copy; MIERUNE</a>
    <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>
    <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>`

const m_streets = new L.tileLayer(
    `https://tile.openstreetmap.jp/styles/maptiler-basic-ja/{z}/{x}/{y}.png`,
    {
        attribution: attribution
    }
);
const map = L.map('map', {
    center: [32.805100137858226, 130.77487836209724],
    zoom: 14,
    zoomControl: true,
    layers: [m_streets],
});

L.control
    .scale({
        imperial: false,
        maxWidth: 300,
    })
    .addTo(map);

const IconTemplate = L.Icon.extend({
    options: {
        iconSize: [15, 15],
        shadowSize: [0, 0],
        iconAnchor: [7.5, 7.5],
        shadowAnchor: [0, 0],
        popupAnchor: [7.5, 0]
    }
});
const ShokasenIcon = new IconTemplate({iconUrl: './icons/shokasen.png'});
const KyusuishaIcon = new IconTemplate({iconUrl: './icons/kyusuisha.png'});
const HinanjoIcon = new IconTemplate({iconUrl: './icons/hinanjo.png'});

const hinanjyoLayer = L.geoPackageFeatureLayer([], {
    geoPackageUrl: './data/db.gpkg',
    layerName: 'hinanjyo',
    pointToLayer: function (feature, layer) {
        return L.marker(layer, {icon: HinanjoIcon});
    }
});

const dansuiAreaLayer = L.geoPackageFeatureLayer([], {
    geoPackageUrl: './data/db.gpkg',
    layerName: 'dansui_area',
});

const poplationLayer = L.geoPackageFeatureLayer([], {
    geoPackageUrl: './data/db.gpkg',
    layerName: '500m_mesh_2018_43',
    style: (geoJsonFeature) => {
        const population = geoJsonFeature.properties.ptn_2020;
        const color = population < 770  ? '#fef0d9' :
                      population < 1540 ? '#fdcc8a' :
                      population < 2311 ? '#fc8d59' :
                      population < 3081 ? '#e34a33' :
                                          '#b30000' ;
        return {
            color: '#ffffff',
            weight: 1,
            fillColor: color,
            fillOpacity: 0.5,
        }
    }
});

const demLayer = L.geoPackageFeatureLayer([], {
    geoPackageUrl: './data/db.gpkg',
    layerName: 'dem',
    style: () => {
        return {
            opacity: 0.5
        }
    }
});

//背景レイヤ
const optionLayersList = {
    '避難所': hinanjyoLayer,
    '断水エリア': dansuiAreaLayer,
    '人口': poplationLayer,
    '標高': demLayer,
};

//レイヤ設定
L.control.layers(null, optionLayersList).addTo(map);
