// source: https://day-journal.com/memo/try-054/

const basicMap = new L.tileLayer(
    'https://tile.openstreetmap.jp/styles/maptiler-basic-ja/{z}/{x}/{y}.png',
    {
        attribution: `&copy; <a href="www.openstreetmap.org" target="_blank">OpenStreetMap</a> contributors`
    }
);
const map = L.map('map', {
    center: [32.805100137858226, 130.77487836209724],
    zoom: 14,
    zoomControl: true,
    layers: [basicMap],
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
        const selectColor = (population) => {
            if (population < 770) {
                return '#fef0d9';
            } else if (population < 1540) {
                return '#fdcc8a';
            } else if (population < 2310) {
                return '#fc8d59';
            } else if (population < 3080) {
                return '#e34a33';
            } else {
                return '#b30000';
            }
        }

        const population = geoJsonFeature.properties.ptn_2020;
        return {
            color: '#ffffff',
            weight: 1,
            fillColor: selectColor(population),
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
