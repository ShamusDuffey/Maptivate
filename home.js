const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);

createNewLayer.addEventListener('click', async() =>
{
	const layerNameInput=document.getElementById('layerNameInput');
	const layerName=layerNameInput.value.trim();
	if(!layerName) return alert('Name your layer based on what it shows!');
	const { count, error: countError } = await supabase
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
      	}
})
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
L.marker([42.6431, -71.336262]).addTo(map);
