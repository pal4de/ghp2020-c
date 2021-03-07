// original: https://day-journal.com/memo/try-054/

const basicMap = new L.tileLayer(
    'https://tile.openstreetmap.jp/styles/maptiler-basic-ja/{z}/{x}/{y}.png',
    {
        attribution: `&copy; <a href="www.openstreetmap.org" target="_blank">OpenStreetMap</a> contributors`
    }
);
const mapOption = {
    center: [32.805100137858226, 130.77487836209724],
    zoom: 14,
    zoomControl: true,
    layers: [basicMap],
}
const map = L.map('map', mapOption);
map.zoomControl.setPosition('bottomleft');

const scaleControlOption = {
    imperial: false,
    maxWidth: 300,
    position: 'bottomright',
};
L.control.scale(scaleControlOption).addTo(map);

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

const readAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

const loadGeoPackage = async (file) => {
    const arrayBuffer = await readAsArrayBuffer(file);
    const uint8Array = new Uint8Array(arrayBuffer);
    const gp = await geopackage.GeoPackageAPI.open(uint8Array);
    console.log(gp);
    return gp;
}

const handleGeoPackage = async (file) => {
    const gpkg = await loadGeoPackage(file);

    const hinanjyoLayer = L.geoPackageFeatureLayer([], {
        geoPackage: gpkg,
        layerName: 'hinanjyo',
        pointToLayer: (feature, layer) => {
            const marker = L.marker(layer, {icon: HinanjoIcon});
            const popupContent = `
                <h6>名称</h6>
                <p>${feature.properties.p20_002}</p>
                <h6>住所</h6>
                <p>${feature.properties.p20_003}</p>
            `;
            marker.bindPopup(popupContent);
            return marker;
        }
    });

    const dansuiAreaLayer = L.geoPackageFeatureLayer([], {
        geoPackage: gpkg,
        layerName: 'dansui_area',
    });

    const poplationLayer = L.geoPackageFeatureLayer([], {
        geoPackage: gpkg,
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
        geoPackage: gpkg,
        layerName: 'dem',
        style: () => {
            return {
                opacity: 0.5
            }
        }
    });

    const optionalLayersList = {
        '避難所': hinanjyoLayer,
        '断水エリア': dansuiAreaLayer,
        '人口': poplationLayer,
        '標高': demLayer,
    };
    L.control.layers(null, optionalLayersList).addTo(map);
    for (const optinalLayer of Object.values(optionalLayersList)) {
        optinalLayer.addTo(map);
    }
}

const toggleControl = (show) => {
    const body = document.querySelector('body');
    if (show == undefined) {
        body.classList.toggle('control-opened');
    } else {
        body.classList[show ? 'add' : 'remove']('control-opened');
    }
}
