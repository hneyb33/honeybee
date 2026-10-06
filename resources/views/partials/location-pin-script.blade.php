@once
    <style>
        [x-cloak] { display: none !important; }
        .hb-pin-map { height: 16rem; }
    </style>
    <script>
        window.hbLocationPin = function (config) {
            return {
                city: config.city || '',
                area: config.area || '',
                lat: config.lat || '',
                lng: config.lng || '',
                status: 'idle',
                manual: !!config.manual,
                mapsKey: config.mapsKey || '',
                resolveUrl: config.resolveUrl || '',
                pinned: false,
                timer: null,
                map: null,
                marker: null,
                init() {
                    if (this.manual) {
                        this.status = 'pin';
                        this.$nextTick(() => this.mountMap());
                        return;
                    }

                    this.watchExternalFields();

                    if ((this.area || '').trim() !== '') {
                        this.queueLookup();
                    }
                },
                watchExternalFields() {
                    if (this.$root.querySelector('[name="neighborhood"]')) {
                        return;
                    }

                    const form = this.$root.closest('form');

                    if (! form) {
                        return;
                    }

                    const cityInput = form.querySelector('input[id$=".city"]');
                    const areaInput = form.querySelector('input[id$=".neighborhood"]');

                    if (! areaInput) {
                        return;
                    }

                    const sync = () => {
                        const nextCity = cityInput ? cityInput.value : '';
                        const nextArea = areaInput.value;

                        if (nextCity === this.city && nextArea === this.area) {
                            return;
                        }

                        this.city = nextCity;
                        this.area = nextArea;
                        this.onNameInput();
                    };

                    areaInput.addEventListener('change', sync);
                    cityInput?.addEventListener('change', sync);
                },
                onNameInput() {
                    this.lat = '';
                    this.lng = '';
                    this.pinned = false;
                    this.queueLookup();
                },
                queueLookup() {
                    clearTimeout(this.timer);
                    const area = (this.area || '').trim();

                    if (area.length < 2) {
                        this.status = 'idle';
                        this.destroyMap();
                        return;
                    }

                    this.status = 'checking';
                    this.destroyMap();
                    this.timer = setTimeout(() => this.lookup(), 400);
                },
                async lookup() {
                    const area = (this.area || '').trim();

                    if (area.length < 2) {
                        return;
                    }

                    try {
                        const url = new URL(this.resolveUrl, window.location.origin);
                        url.searchParams.set('city', this.city || '');
                        url.searchParams.set('area', area);
                        const response = await fetch(url, { headers: { Accept: 'application/json' } });
                        const data = await response.json();

                        if ((this.area || '').trim() !== area) {
                            return;
                        }

                        if (data.found) {
                            this.lat = data.latitude;
                            this.lng = data.longitude;
                            this.status = 'found';
                            this.pinned = false;
                            this.destroyMap();
                            return;
                        }
                    } catch (error) {}

                    this.status = 'pin';
                    this.$nextTick(() => this.mountMap());
                },
                async mountMap() {
                    if (! this.$refs.map) {
                        return;
                    }

                    const center = this.coordsOrKampala();
                    await this.ensureLeaflet();
                    this.mountLeaflet(center);
                },
                coordsOrKampala() {
                    const lat = parseFloat(this.lat);
                    const lng = parseFloat(this.lng);

                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                        return { lat, lng, zoom: 16, placed: true };
                    }

                    return { lat: 0.3476, lng: 32.5825, zoom: 12, placed: false };
                },
                setCoords(lat, lng) {
                    this.lat = lat;
                    this.lng = lng;
                    this.pinned = true;
                    this.$dispatch('location-pinned', { latitude: lat, longitude: lng });
                },
                ensureGoogle() {
                    if (window.google && window.google.maps) {
                        return Promise.resolve();
                    }

                    window.hbGoogleMapsPromise ??= new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(this.mapsKey) + '&v=weekly';
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () => reject();
                        document.head.appendChild(script);
                    });

                    return window.hbGoogleMapsPromise;
                },
                mountGoogle(center) {
                    if (this.map) {
                        return;
                    }

                    this.map = new window.google.maps.Map(this.$refs.map, {
                        center: { lat: center.lat, lng: center.lng },
                        zoom: center.zoom,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                    });

                    const drop = (position) => {
                        if (! this.marker) {
                            this.marker = new window.google.maps.Marker({ map: this.map, draggable: true, position });
                            this.marker.addListener('dragend', (event) => {
                                this.setCoords(event.latLng.lat(), event.latLng.lng());
                            });
                        } else {
                            this.marker.setPosition(position);
                        }

                        this.setCoords(position.lat(), position.lng());
                    };

                    this.map.addListener('click', (event) => drop(event.latLng));

                    if (center.placed) {
                        drop(new window.google.maps.LatLng(center.lat, center.lng));
                    }

                    window.google.maps.event.trigger(this.map, 'resize');
                },
                ensureLeaflet() {
                    if (window.L) {
                        return Promise.resolve();
                    }

                    window.hbLeafletPromise ??= new Promise((resolve) => {
                        const style = document.createElement('link');
                        style.rel = 'stylesheet';
                        style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                        document.head.appendChild(style);
                        const script = document.createElement('script');
                        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                        script.onload = () => resolve();
                        document.head.appendChild(script);
                    });

                    return window.hbLeafletPromise;
                },
                mountLeaflet(center) {
                    if (this.map) {
                        this.map.invalidateSize();
                        return;
                    }

                    this.map = window.L.map(this.$refs.map).setView([center.lat, center.lng], center.zoom);
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap',
                    }).addTo(this.map);

                    const drop = (latlng) => {
                        if (! this.marker) {
                            this.marker = window.L.marker(latlng, { draggable: true }).addTo(this.map);
                            this.marker.on('dragend', (event) => {
                                const point = event.target.getLatLng();
                                this.setCoords(point.lat, point.lng);
                            });
                        } else {
                            this.marker.setLatLng(latlng);
                        }

                        this.setCoords(latlng.lat, latlng.lng);
                    };

                    this.map.on('click', (event) => drop(event.latlng));

                    if (center.placed) {
                        drop(window.L.latLng(center.lat, center.lng));
                    }

                    setTimeout(() => this.map && this.map.invalidateSize(), 200);
                },
                destroyMap() {
                    if (this.map && this.map.remove) {
                        this.map.remove();
                    }

                    if (this.$refs.map) {
                        this.$refs.map.innerHTML = '';
                    }

                    this.map = null;
                    this.marker = null;
                },
            };
        };
    </script>
@endonce
