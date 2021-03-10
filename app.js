// original: https://day-journal.com/memo/try-054/

const basicMap = new L.tileLayer(
    'https://tile.openstreetmap.jp/styles/maptiler-basic-ja/{z}/{x}/{y}.png',
    {
        attribution: `&copy; <a href="www.openstreetmap.org" target="_blank">OpenStreetMap</a> contributors`
    }
);
const mapOption = {
    center: [37.45741810262938, 137.54882812500003],
    zoom: 5,
    zoomControl: false,
    layers: [basicMap],
}
const map = L.map('map', mapOption);

const zoomControlOption = {
    position: 'bottomleft',
}
L.control.zoom(zoomControlOption).addTo(map);

const scaleControlOption = {
    imperial: false,
    position: 'bottomright',
};
L.control.scale(scaleControlOption).addTo(map);

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
const controlTogglerOption = {
    position: 'topleft',
};
const controlToggler = new L.Control.ControlToggler(controlTogglerOption);
controlToggler.addTo(map);

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

            if (layer.displayName) {
                layerControl.querySelector('h6').prepend(layer.displayName);
                layerControl.querySelector('h6 .subtext').append(layer.options.layerName);
            } else {
                layerControl.querySelector('h6').prepend(layer.options.layerName);
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
                if (layer.number === layerList - 1) return;
                this.swap(layer.number, layer.number + 1);
                this.render();
            };
            layerControl.querySelector('.layer-visibility').checked = map.hasLayer(layer);
            layerControlContainer.appendChild(layerControl);
        }
        this.arrayLayers(layerList);
    }

    arrayLayers() {
        for (const layer of this) {
            layer.bringToBack();
        }
    }
}
const layerList = new LayerList();

const handleGeoPackage = async (fileList) => {
    if (fileList.length === 0) return;
    const file = fileList[0];

    clear();

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

    const gpkgSelectorContainer = document.querySelector('#gpkg-selector-container');
    gpkgSelectorContainer.classList.add('gpkg-loading');
    const gpkg = await loadGeoPackage(file);

    for (const tableName of gpkg.getFeatureTables()) {
        const layerOption = {
            geoPackage: gpkg,
            layerName: tableName,
        };
        const fieldNameDictionary = {};

        let layerDisplayName = '';
        if (tableName === '500m_mesh_2018_43') {
            layerDisplayName = '人口';
            layerOption.style = (geoJsonFeature) => {
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
            fieldNameDictionary['ptn_2020'] = '人口';
        } else if (tableName === 'dansui_area' || tableName === 'dansui_area2' || tableName === 'dansui_area3') {
            layerDisplayName = '断水エリア';
        } else if (tableName === 'hinanjyo') {
            layerDisplayName = '避難所';
            layerOption.pointToLayer = (feature, layer) => {
                const marker = L.marker(layer, {icon: HinanjoIcon});
                // marker.bindLabel(feature.properties.p20_002, {
                //     noHide: true,
                //     direction: 'auto'
                // });
                return marker;
            };
            fieldNameDictionary['p20_002'] = '名称';
            fieldNameDictionary['p20_003'] = '住所';
        } else if (tableName === 'dem') {
            layerDisplayName = '標高';
            layerOption.style = () => ({
                opacity: 0.5,
                weight: 1,
                color: '#f34545',
            });
        } else if (tableName === 'qgis:voronoipolygons_1:kyusui_voronoi') {
            layerDisplayName = 'ボロノイ分析結果';
        } else if (tableName === 'native:joinattributestable_1:target_kyusui') {
            layerDisplayName = '給水所配置候補地点';
        }

        layerOption.onEachFeature = (feature, layer) => {
            let knownFieldContent = '';
            let unknownFieldContent = '';
            for (const [key, value] of Object.entries(feature.properties)) {
                if (key in fieldNameDictionary) {
                    const fieldName = `${fieldNameDictionary[key]}<div class="subtext">${key}</div>`;
                    knownFieldContent += `<h6>${fieldName}</h6><p>${value}</p>`;
                } else {
                    unknownFieldContent += `<div class="subtext"><h6>${key}</h6><p>${value}</p></div>`
                }
            }
            layer.bindPopup(knownFieldContent + unknownFieldContent);
        }
        const layer = L.geoPackageFeatureLayer([], layerOption);
        layer.number = layerList.length;
        layer.displayName = layerDisplayName;
        layer.addTo(map);
        layer.onAdd = (map) => L.GeoJSON.prototype.onAdd.call(layer, map); // 同じデータが重複して登録されることを防止

        layerList.push(layer);
    }
    layerList.render();

    const allLayersGroup = L.featureGroup(layerList);
    map.fitBounds(allLayersGroup.getBounds());

    gpkgSelectorContainer.classList.remove('gpkg-loading');
}

const clear = () => {
    for (const layer of layerList) {
        layer.remove();
    }
    layerList.splice(0);

    document.querySelector('#layer-control-container').innerHTML = '';
    document.querySelector('#gpkg-selector').value = '';
}

const loadGpkgfromServer = async () => {
    const gpkgSelectorContainer = document.querySelector('#gpkg-selector-container');
    const gpkgSelector = document.querySelector('#gpkg-selector');
    gpkgSelectorContainer.classList.add('gpkg-loading');

    const response = await fetch('/data/db.gpkg');
    const blob = await response.blob();
    const file = new File([blob], 'db.gpkg')

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    gpkgSelector.files = dataTransfer.files;
    gpkgSelectorContainer.classList.remove('gpkg-loading');

    gpkgSelector.onchange();
}
