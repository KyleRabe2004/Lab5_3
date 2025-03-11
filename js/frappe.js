// Initialize the second map
var map2 = L.map('map2').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map2);

// I used ChatGPT to help with debugging and formatting
// Separate country layer for frappe.js
var countryLayer2 = L.geoJSON(null, {
    style: styleFrappe,
    onEachFeature: onEachCountryFrappe
}).addTo(map2);

// Color scale for frappe.js with new classifications
function getColorFrappe(d) {
    return d > 10 ? '#E31A1C' :  // Dark Red
           d >= 5 ? '#FC4E2A' :  // Red
           d >= 3 ? '#FD8D3C' :  // Dark Orange-Red
           d >= 1 ? '#FEB24C' :  // Orange
                    '#FFEDA0';   // Light Yellow (<1)
}

// Function to style country polygons based on adjusted city density (cities per 100,000 square miles)
function styleFrappe(feature) {
    return {
        fillColor: getColorFrappe(feature.properties.cityDensityAdjusted || 0),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

// Function to handle country click event
function onEachCountryFrappe(feature, layer) {
    layer.on("click", function (e) {
        let countryName = feature.properties.shapeName || "Unknown Country";
        let cityCount = feature.properties.cityCount || 0;
        let area = feature.properties.country_Area || 1;
        let densityAdjusted = feature.properties.cityDensityAdjusted || 0;

        let popupContent = `<strong>${countryName}</strong><br>
            Cities >500k: <strong>${cityCount}</strong><br>
            Country Area: <strong>${area.toFixed(2)}</strong> sq mi<br>
            Cities per 100,000 Sq Miles: <strong>${densityAdjusted.toFixed(2)}</strong>`;

        layer.bindPopup(popupContent).openPopup();
    });
}

// Fetch and load data for frappe.js
fetch("data/cities5.geojson")
    .then(response => response.json())
    .then(cityData => {
        return fetch("data/Countries_Pop_Simplified.geojson")
            .then(response => response.json())
            .then(countryData => {
                countryData.features.forEach(country => {
                    let count = 0;
                    let area = country.properties.country_Area;
                    if (!area || area < 0.1) area = 1; // Prevent division by very small numbers

                    cityData.features.forEach(city => {
                        let point = turf.point(city.geometry.coordinates);
                        let polygon = country.geometry;
                        if (turf.booleanPointInPolygon(point, polygon)) {
                            count++;
                        }
                    });

                    // Compute normalized city density (Cities per 100,000 square miles)
                    let densityAdjusted = (count / area) * 100000;
                    country.properties.cityCount = count;
                    country.properties.cityDensityAdjusted = densityAdjusted;
                });

                countryLayer2.addData(countryData);
            });
    });

// **Legend for frappe.js (Cities per 100,000 Sq Miles)**
var legendFrappe = L.control({ position: 'bottomright' });

legendFrappe.onAdd = function (map2) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>City Density (Cities per 100,000 Sq Miles)</h4>";

    var grades = [0, 1, 3, 5, 10];
    var colors = ["#FFEDA0", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C"];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="width: 20px; height: 20px; background:${colors[i]}; display: inline-block; margin-right: 8px; border: 1px solid black;"></span>
            ${grades[i]}${grades[i + 1] ? `–${grades[i + 1] - 1}` : '+'}
        </div>`;
    }

    return div;
};

legendFrappe.addTo(map2);
