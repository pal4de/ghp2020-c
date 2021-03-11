const initMap = () => {
    const basicMap = new L.tileLayer(
        'https://tile.openstreetmap.jp/styles/maptiler-basic-ja/{z}/{x}/{y}.png',
        {
            attribution: `&copy; <a href="www.openstreetmap.org" target="_blank">OpenStreetMap</a> contributors`
        }
    );
    const map = L.map('map', {
        center: [37.45741810262938, 137.54882812500003],
        zoom: 5,
        zoomControl: false,
        layers: [basicMap],
    });

    L.control.zoom({
        position: 'bottomleft',
    }).addTo(map);

    L.control.scale({
        imperial: false,
        position: 'bottomright',
    }).addTo(map);

    L.Control.ControlToggler = L.Control.extend({
        onAdd: (map) => {
            let button = L.DomUtil.create('button', 'custom-panel leaflet-bar material-icons');
            button.id = 'control-toggler';
            button.innerText = 'menu';
            button.onclick = L.Control.ControlToggler.prototype.toggle;
            return button;
        },
        toggle: (show) => {
            const body = document.querySelector('body');
            if (show === undefined) {
                body.classList.toggle('control-opened');
            } else {
                if (show) {
                    body.classList.add('control-opened');
                } else {
                    body.classList.remove('control-opened');
                }
            }
        }
    });
    L.control.controlToggler = function(opts) {
        return new L.Control.ControlToggler(opts);
    }
    L.control.controlToggler({
        position: 'topleft',
    }).addTo(map);

    return map;
}
const map = initMap();

class LayerList extends Array {
    swap(a, b) {
        [this[a], this[b]] = [this[b], this[a]];
        this[a].number = a;
        this[b].number = b;
    }

    render() {
        const toggleLayerVisibility = (layer, visible) => {
            layer.removeFrom(map);
            if (visible) {
                layer.addTo(map);
            }
            this.arrayLayers();
        }

        const layerControlTemplate = document.querySelector('#layer-control-template');
        const layerControlContainer = document.querySelector('#layer-control-container');

        layerControlContainer.innerHTML = '';

        for (const layer of this) {
            const layerControl = layerControlTemplate.content.cloneNode(true);

            if (layer.options.displayName) {
                layerControl.querySelector('h6').prepend(layer.options.displayName);
                layerControl.querySelector('h6 .subtext').append(layer.options.layerName);
            } else {
                layerControl.querySelector('h6 .subtext').prepend(layer.options.layerName);
            }

            layerControl.querySelector('[data-table-name]').dataset.tableName = layer.options.layerName;
            layerControl.querySelector('[data-layer-number]').dataset.layerNumber = layer.number;
            layerControl.querySelector('.layer-visibility').onchange = (e) => toggleLayerVisibility(layer, e.target.checked);
            layerControl.querySelector('.layer-control-mover[data-direction="up"]').onclick = (e) => {
                if (layer.number === 0) return;
                this.swap(layer.number, layer.number - 1);
                this.render();
            };
            layerControl.querySelector('.layer-control-mover[data-direction="down"]').onclick = (e) => {
                if (layer.number === layersList - 1) return;
                this.swap(layer.number, layer.number + 1);
                this.render();
            };
            layerControl.querySelector('.layer-visibility').checked = map.hasLayer(layer);
            layerControlContainer.appendChild(layerControl);
        }
        this.arrayLayers(layersList);
    }

    arrayLayers() {
        for (const layer of this) {
            layer.bringToBack();
        }
    }
}
const layersList = new LayerList();
const complementalsList = [];
document.querySelector('#toggle-complementals').onchange = (e) => {
    for (const complemental of complementalsList) {
        if (e.target.checked) {
            complemental.addTo(map);
        } else {
            complemental.removeFrom(map);
        }
    }
    layersList.render();
};

const handleGeoPackage = async (fileList) => {
    if (fileList.length === 0) return;
    const file = fileList[0];

    const loadGeoPackage = async (file) => {
        const asyncReadAsArrayBuffer = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(file);
            });
        }

        const arrayBuffer = await asyncReadAsArrayBuffer(file);
        const uint8Array = new Uint8Array(arrayBuffer);
        const gpkg = await geopackage.GeoPackageAPI.open(uint8Array);
        return gpkg;
    }

    const knownLayersList = [
        {
            layerName: 'hinanjyo_with_priority',
            displayName: '候補地 (優先度付き)',
            visible: true,
            fieldName: {
                'p20_002': '名称',
                'p20_003': '住所',
                'p20_004': '施設の種類',
                'p20_005': '収容人数',
                'p20_007': '施設規模',
                'priority': '優先度',
            },
            pointToLayer: (feature, latlng) => {
                const priority = feature.properties.priority;
                if (priority === 0) return null;

                const selectIcon = (priority) => {
                    if (priority < 500) {
                        return './icons/marker_green.png';
                    } else if (priority < 1000) {
                        return './icons/marker_yellow.png';
                    } else {
                        return './icons/marker_red.png';
                    }
                }

                const icon = new L.Icon({
                    ...L.Icon.Default.prototype.options,
                    iconUrl: selectIcon(priority),
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                });
                return L.marker(latlng, {icon});
            },
        },
        {
            layerName: 'native:joinattributestable_1:target_kyusui',
            displayName: '候補地',
            visible: true,
            fieldName: {
                'p20_002': '名称',
                'p20_003': '住所',
                'p20_004': '施設の種類',
                'p20_005': '収容人数',
                'p20_007': '施設規模',
            },
        },
        {
            layerName: 'qgis:voronoipolygons_1:kyusui_voronoi',
            displayName: 'ボロノイ分析結果',
            complemental: true,
            style: {
                color: '#000000',
                fillColor: 'transparent',
                weight: 1
            },
        },
        {
            layerName: 'hinanjyo',
            displayName: '避難所',
            visible: true,
            fieldName: {
                'p20_002': '名称',
                'p20_003': '住所',
                'p20_004': '施設の種類',
                'p20_005': '収容人数',
                'p20_007': '施設規模',
            },
            pointToLayer: (feature, latlng) => {
                const icon = L.icon({
                    iconUrl: './icons/hinanjo.png',
                    iconSize: [15, 15],
                    shadowSize: [0, 0],
                });
                return L.marker(latlng, {icon});
            },
        },
        {
            layerName: 'dansui_area',
            displayName: '断水エリア',
            visible: true,
        },
        // { layerName: 'dansui_area2' },
        // { layerName: 'dansui_area3' },
        {
            layerName: '500m_mesh_2018_43',
            displayName: '人口',
            complemental: true,
            fieldName: {
                'ptn_2020': '人口'
            },
            style: (feature) => {
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

                const population = feature.properties.ptn_2020;
                return {
                    color: 'transparent',
                    weight: 1,
                    fillColor: selectColor(population),
                    fillOpacity: 0.3,
                }
            },
        },
        {
            layerName: 'dem',
            displayName: '等高線',
            complemental: true,
            style: {
                opacity: 1,
                weight: 1,
                color: '#f34545',
            },
        }
    ];

    clear();

    const gpkgControl = document.querySelector('#gpkg-control');
    gpkgControl.classList.add('gpkg-loading');
    const gpkg = await loadGeoPackage(file);

    for (const tableName of gpkg.getFeatureTables()) {
        const preset = knownLayersList.find((preset) => preset.layerName == tableName) ?? {};
        const layerOption = {
            geoPackage: gpkg,
            layerName: tableName,
            displayName: preset.displayName ?? null,
            number: layersList.length,
            style: preset.style ?? undefined,
            pointToLayer: preset.pointToLayer ?? undefined,
            onEachFeature: (feature, layer) => {
                let knownFieldContent = '';
                let unknownFieldContent = '';
                for (const [key, value] of Object.entries(feature.properties)) {
                    if (key in (preset.fieldName ?? {})) {
                        const fieldName = `${preset.fieldName[key]}<div class="subtext">${key}</div>`;
                        knownFieldContent += `<h6>${fieldName}</h6><p>${value}</p>`;
                    } else {
                        unknownFieldContent += `<div class="subtext"><h6>${key}</h6><p>${value}</p></div>`
                    }
                }
                layer.bindPopup(knownFieldContent + unknownFieldContent);
            }
        };
        const initiallyVisible = preset.visible ?? false;

        const layer = L.geoPackageFeatureLayer([], layerOption);
        layer.onAdd(map); // データの読み込み
        layer.onAdd = (map) => L.GeoJSON.prototype.onAdd.call(layer, map); // 同じデータが重複して登録されることを防止
        if (initiallyVisible) layer.addTo(map);

        layersList.push(layer);
        if (preset.complemental ?? false) {
            complementalsList.push(layer);
        }
    }
    layersList.sort((layerA, layerB) => {
        const keysList = knownLayersList.map(preset => preset.layerName);
        const indexA = keysList.indexOf(layerA.options.layerName);
        const indexB = keysList.indexOf(layerB.options.layerName);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    layersList.render();

    const allLayersGroup = L.featureGroup(layersList);
    map.flyToBounds(allLayersGroup.getBounds(), {
        duration: 1.5,
        easeLinearity: 0.5,
    });

    gpkgControl.classList.remove('gpkg-loading');
    document.querySelector('#layer-control-panel').style.display = 'block';
}

const clear = () => {
    for (const layer of layersList) {
        layer.remove();
    }
    layersList.splice(0);

    document.querySelector('#layer-control-container').innerHTML = '';
    document.querySelector('#gpkg-selector').value = '';
}

const loadGpkgfromServer = async () => {
    document.querySelector('#gpkg-control').classList.add('gpkg-loading');

    const response = await fetch('/data/db.gpkg');
    const blob = await response.blob();
    const file = new File([blob], 'db.gpkg');
    handleGeoPackage([file]);
}
