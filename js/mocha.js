// Initialize the first map
var map = L.map('map').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// I used ChatGPT to help with debugging and formatting
// Separate country layer for mocha.js
var countryLayer1 = L.geoJSON(null, {
    style: styleMocha,
    onEachFeature: onEachCountryMocha
}).addTo(map);

// Color scale for mocha.js
function getColorMocha(d) {
    return d >= 100 ? '#800026' :
           d >= 50 ? '#BD0026' :
           d >= 25 ? '#E31A1C' :
           d >= 10 ? '#FC4E2A' :
           d >= 5 ? '#FD8D3C' :
           d >= 1 ? '#FEB24C' :
                    '#FFEDA0';
}

function styleMocha(feature) {
    return {
        fillColor: getColorMocha(feature.properties.cityCount || 0),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function onEachCountryMocha(feature, layer) {
    layer.on("click", function (e) {
        let countryName = feature.properties.shapeName || "Unknown Country";
        let cityCount = feature.properties.cityCount || 0;

        let popupContent = `<strong>${countryName}</strong><br>Cities with Population >500k: <strong>${cityCount}</strong>`;

        layer.bindPopup(popupContent).openPopup();
    });
}

// Fetch and load data for mocha.js
fetch("data/cities5.geojson")
    .then(response => response.json())
    .then(cityData => {
        return fetch("data/Countries_Pop_Simplified.geojson")
            .then(response => response.json())
            .then(countryData => {
                countryData.features.forEach(country => {
                    let count = 0;
                    cityData.features.forEach(city => {
                        let point = turf.point(city.geometry.coordinates);
                        let polygon = country.geometry;
                        if (turf.booleanPointInPolygon(point, polygon)) {
                            count++;
                        }
                    });
                    country.properties.cityCount = count;
                });
                countryLayer1.addData(countryData);
            });
    });

// **Legend for mocha.js**
var legendMocha = L.control({ position: 'bottomright' });

legendMocha.onAdd = function (map) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>Number of Cities > 500k</h4>";

    var grades = [1, 5, 10, 25, 50, 100];
    var colors = ["#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#BD0026", "#800026"];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="width: 20px; height: 20px; background:${colors[i]}; display: inline-block; margin-right: 8px; border: 1px solid black;"></span>
            ${grades[i]}&ndash;${grades[i + 1] ? grades[i + 1] : '+'}
        </div>`;
    }

    return div;
};

legendMocha.addTo(map);
