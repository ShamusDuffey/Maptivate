const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);
let user_has_already_made_a_layer='f';
let current_layer;
let current_layer_id;
window.addEventListener('DOMContentLoaded',()=>{
async function saveNewPin(newTitle, newContent, lng, lat)//have to add creator_id later
{
	const { count, error: countError } = await sb
        .from('Pin Posts')
        .select('*', { count: 'exact', head: true });
        if (countError)
        {
                console.error('Error fetching count:', countError);
                alert('Error fetching count: ' + countError.message);
                return;
        }
	const {data, error} = await sb.from(`Pin Posts`).insert([{pin_id: count, title: newTitle, content: newContent, longitude: lng, latitude: lat }]);
	return count;
};

createNewLayer.addEventListener('click', async() =>
{
	const layerNameInput=document.getElementById('layerNameInput');
	const layerName=layerNameInput.value.trim();
	if(!layerName) return alert('Name your layer based on what it shows!');
	const { count, error: countError } = await sb
        .from('Layers')
        .select('*', { count: 'exact', head: true });
    	if (countError)
	{
        	console.error('Error fetching count:', countError);
        	alert('Error fetching count: ' + countError.message);
        	return;
    	}
	const {data, error} = await sb.from('Layers').insert([{layer_id: count, name: layerName}]);
	if (error)
	{
        	console.error('Error inserting data:', error);
        	alert('Error inserting data: ' + error.message);
      	}
	else
	{
        	console.log('Data inserted successfully:', data);
        	alert('Data inserted successfully!');
		user_has_already_created_a_layer='t';
		current_layer=layerName;
		current_layer_id=count;
      	}
});
var map = L.map('map').setView([42.63583, -71.314167], 14);
L.tileLayer(
	'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=a5ic5yAL7H7RtI0ALklW',
	{
		attribution:
			'<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>' +
			' <a href="https://www.openstreetmap.org/copyright" target="_blank">' +
			'&copy; OpenStreetMap contributors</a>',
	}
).addTo(map);
map.on('click', async(e)=>
{
	const pin_latitude=e.latlng.lat;
	const pin_longitude=e.latlng.lng;
	let title=prompt("Enter the title of your pin: ");
	let content=prompt("Add a discription for nuanced details (or don't): ");
	if(!title) return;
	const new_pin=L.marker([pin_latitude, pin_longitude]).addTo(map);
	const popupContent=`
		<div>
			<h4>${title}</h4>
			<p>${content}</p>
		</div>`;
	new_pin.bindPopup(popupContent).openPopup();
	try {
        let pinId=await saveNewPin(title, content, pin_longitude, pin_latitude);
        alert("Pin saved successfully!");
    	} catch (error) {
        console.error("Failed to save pin:", error);
        alert("Failed to save pin: " + error.message);
	}
	await sb.from(`Layers_Pins_Relation`).insert([{pin_id: pinId, layer_id: current_layer_id}]);

});
});
