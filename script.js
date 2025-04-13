async function addcontent(event) {
    event.preventDefault();
    if (document.getElementById("Straße").value == "" || document.getElementById("Hausnummer").value == "" || document.getElementById("PLZ").value == "" || document.getElementById("Ort").value == "" || document.getElementById("Land").value == "") {
        alert("Bitte füllen Sie alle Felder aus.");
        return;
    }
    const adresse = document.getElementById("Straße").value + " " + document.getElementById("Hausnummer").value + ", " + document.getElementById("PLZ").value + " " + document.getElementById("Ort").value + ", " + document.getElementById("Land").value;
    const {latitude, longitude} = await getCoordinates(adresse);
    fetch('http://localhost:14000/api/addort', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "Name": document.getElementById("Name").value,
            "Breitengrad": latitude,
            "Längengrad": longitude,
            "Typ": document.getElementById("Typ").value || "Unbekannt",
            "Preise": document.getElementById("Preise").value || "Kostenlos",
            "Öffnungszeiten": document.getElementById("Öffnungszeiten").value || "Unbekannt",
            "Beschreibung": document.getElementById("Beschreibung").value || "Unbekannt",
        })
    }).then(response => {
        if (response.ok) {
            console.log("Daten erfolgreich gesendet");
            alert("Daten erfolgreich gesendet");
            document.getElementById("Straße").value = "";
            document.getElementById("Hausnummer").value = "";
            document.getElementById("PLZ").value = "";
            document.getElementById("Ort").value = "";
            document.getElementById("Land").value = "";
            document.getElementById("Name").value = "";
            document.getElementById("Typ").value = "";
            document.getElementById("Preise").value = "";
            document.getElementById("Öffnungszeiten").value = "";
            document.getElementById("Beschreibung").value = "";
        } else {
            console.error("Fehler beim Senden der Daten");
        }
    }
    ).catch(error => {
        console.error("Fehler beim Senden der Daten:", error);
    });
}

var map = L.map('map').setView([51.0508900, 13.7383200], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function add_marker(x, y, text) {
    L.marker([x, y]).addTo(map).bindPopup('<b>' + text + '</b>');
}

function createDraggableMarker(map, startLat, startLng, callback) {
    var marker = L.marker([startLat, startLng], {
        draggable: true  // Marker ist verschiebbar
    }).addTo(map);

    // Event-Listener für das 'dragend' Event hinzufügen
    marker.on('dragend', function (event) {
        // Hole die neuen Koordinaten nach dem Verschieben des Markers
        var position = event.target.getLatLng();

        // Führe die Callback-Funktion aus, um die neuen Koordinaten zurückzugeben
        callback(position.lat, position.lng);
    });
}

test_marker = add_marker(51.0508900, 13.7383200, 'Test Marker')
test_draggable_marker = createDraggableMarker(map, 51.0508900, 13.7383200, function (lat, lng) {
    console.log('Neuer Marker-Standort:', lat, lng);
});


function getDataDresden() {
    // const latitude = 51.0508900;
    // const longitude = 13.7383200;
    const latitude = 36.000;
    const longitude = 120.000;
}

function getdata(latitude, longitude) {
    const url = 'http://localhost:14000/api/location/' + latitude + '/' + longitude;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                console.log('No data found');
                const detailsDiv = document.getElementById('details');
                detailsDiv.innerHTML = '<p>No data found</p>'; // Clear previous content
                return;
            }
            console.log(data);
            const detailsDiv = document.getElementById('details');
            detailsDiv.innerHTML = ''; // Clear previous content
            data.forEach(item => {
                const p = document.createElement('p');
                p.textContent = item.name;
                detailsDiv.appendChild(p);
                add_marker(item.Breitengrad, item.Längengrad, item.Name);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function getDataDresden() {
    // const latitude = 51.0508900;
    // const longitude = 13.7383200;
    const latitude = 24.000;
    const longitude = 16.16000;
    getdata(latitude, longitude);
}

async function getCoordinates(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            const l = data[0].lon;
            const b = data[0].lat;
            console.log('Koordinaten:', l, b);
            return { latitude: b, longitude: l };
        } else {
            console.error('Keine Koordinaten gefunden');
            return null;
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}

async function getDataSearch() {
    const search = document.getElementById('suchleiste').value;
    const { latitude, longitude } = await getCoordinates(search);
    console.log('Koordinaten:', latitude, longitude);
    if (latitude !== null && longitude !== null) {
        getdata(latitude, longitude);
    } else {
        console.error('Koordinaten konnten nicht abgerufen werden');
    }
}

document.getElementById('suchleiste').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        getDataSearch();
    }
    if (event.key === 'Escape') {
        document.getElementById('suchleiste').value = '';
    }
});