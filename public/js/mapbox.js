/*eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYWxleC0xOTAwIiwiYSI6ImNram1udHRwYTI0NTcyc3FvbmVlM2g3YnMifQ.ZXN9qAVrkks02CL796HCgQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/alex-1900/ckjmoixu022kw19kd3jmb7dou',
    scrollZoom: false,
    //   center: [-118.113491, 34.111745],
    //   zoom: 4,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    //Create a marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //ADD POPUP
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}:${loc.description}</p>`)
      .addTo(map);

    //Extend Map bound to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
