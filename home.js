const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);
let user_has_already_made_a_layer='f';
let working_layer_ids=[null, null, null, null];
let selected_layer_ids=[null, null, null, null];
let downloadedPins=[[null], [null], [null], [null]];
window.addEventListener('DOMContentLoaded',()=>{
async function downloadLayer(layer, workingIndex)
{
	if(typeof layer==="number")
        {
                const {data, error}=sb.from('Layers_Pins_Relation').select('pin_id').eq("layer_id", layer);
                const idsOfPins=data.map(relationRow=>relationRow.pin_id);
		downloadedPins[workingIndex]=[];
                for(const id of idsOfPins)
                {
                        const {data: returnedPin, error: returnError}=sb.from('Pin Posts').select('*').eq("pin_id", id).single();
			if(returnError)
			{
				console.error("Error fetching pin ${id}: ", returnError);
				continue;
			}
			downloadedPins[workingIndex].push(returnedPin);
                }
		return;
        }
	else
		console.error("downloadLayer is being called with an inappropriate type.\n");
}
async function loadLayer(workingIndex)
{
	for(const row of downloadedLayers[workingIndex])
	{
		loadPin(row.pin_id, row.latitude, row.longitude, row.title, row.content);
	}
} 
	
async function loadPin(pin_id, ...credentials)
{
	if(credentials.length===0&&typeof pin_id==="number")
	{
		const row=sb.from('Pin Posts').select('*').eq('pin_id', pin_id).single());
		const lat=row.latitude;
		const lng=row.longitude;
		const title=row.title;
		const content=row.content;
	}
	else if(typeof credentials[0]==="number"&&typeof credentials[1]==="number"&&typeof credentials[2]==="string"&&typeof credentials[3]==="string")
	{
		const lat=credentials[0];
		const lng=credentials[1];
		const title=credentials[2];
		const content=credentials[3];
	}
	else
	{
		console.error("Incorrectly formatted arguments in loadPin function\n");
		return;
	}
	const popupContent=
		`<div>
			<h4>${title}</h4>
			<p>${content}</p>
		</div>`;
	L.marker([lat, lng]).addTo(map).bindPopup(popupContent);
	return row;
}
	
async function saveNewPin(newTitle, newContent, lat, lng, ...selectedLayerIds)//have to add creator_id later
{
	const { count, error: countError } = await sb.from('Pin Posts').select('*', { count: 'exact', head: true });
        if (countError)
        {
                console.error('Error fetching count:', countError);
                alert('Error fetching count: ' + countError.message);
                return;
        }
	const {data, error} = await sb.from(`Pin Posts`).insert([{pin_id: count, title: newTitle, content: newContent, longitude: lng, latitude: lat }]);
	for(let id of selectedLayerIds)
	{
		if(id===null)
			continue;
		const {data, error: relationError}=await sb.from('Layers_Pins_Relation').insert([{pin_id: count, layer_id: id}]);
		if(relationError)
		{
			console.error("Error inserting into the relation table for pins and layers\n");
			return;
		}
	}
	return count;
};
async function getLayerIdOrName(argument)
{
	if(typeof argument==="string")
	{
		const{data, error}=await sb.from(`Layers`).select("layer_id").eq("name", argument).single();
		if (error)
		{
   		 	console.error('Error querying Supabase: ', error);
			alert('Error fetching id: ' + error.message);
    			return null;
  		}
		return data.layer_id;
	}
	else if(typeof argument==="number")
	{
		const{data, error}=await sb.from(`Layers`).select("name").eq("layer_id", argument).single();
		if(error)
		{
			console.error('Error querying Supabase: ', error);
			alert('Error fetching name: ' + error.message);
			return null;
		}
		return data.name;//this line may be causing an error
	}
	else
	{
		console.log("Invalid type in getLayerIdOrName\n");
		return;
	}
};
async function clearMap()
{
	for(const layer of downloadedPins)
	{
		if(layer===null)
			continue;
		for(const pin of layer)
		{
			map.removeLayer(pin);
		}
	}
}
async function reloadMap()
{
	clearMap();
	for(let i=0; i<downloadedPins.length; i++)
	{
		loadLayer(i);
	}
} 

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
		user_has_already_made_a_layer='t';
		working_layer_ids.push(count);
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
	try
	{
        	await saveNewPin(title, content, pin_longitude, pin_latitude, selected_layer_ids[0], selected_layer_ids[1], selected_layer_ids[2], selcted_layer_ids[3]);
		alert("Pin saved successfully!");
		reloadMap();
    	}
	catch (error)
	{
        	console.error("Failed to save pin:", error);
        	alert("Failed to save pin: " + error.message);
	}
});
searchBar.addEventListener('input', async()=>
{
	const {data, error}=await sb.from("Layers").select("name");
	let allLayerNames=[];

	if(error){console.error(error); return;}
	else{allLayerNames=data.map(row=>row.name);}
	let query=searchBar.value.toLowerCase();
	resultsList.innerHTML='';
	const searchResults=allLayerNames.filter(result=>result.toLowerCase().includes(query));
	for(let i=0; (i<8)&&(i<searchResults.length); i++)
	{
		const result=searchResults[i];
		const LI=document.createElement('li');
		LI.textContent=result;
		resultsList.appendChild(LI);
		LI.addEventListener('click', async()=>
		{
			searchBar.placeholder=result;
			let id=await getLayerIdOrName(result);
			selected_layer_ids[Number(layerSwapDropdown.value)]=id;
			working_layer_ids[Number(layerSwapDropdown.value)]=id;
			downloadLayer(id, Number(layerSwapDropdown.value));
			if(Number(layerSwapDropdown.value)==0) layer1Box.parentElement.childNodes[1].nodeValue=result;
			if(Number(layerSwapDropdown.value)==1) layer2Box.parentElement.childNodes[1].nodeValue=result; 
			if(Number(layerSwapDropdown.value)==2) layer3Box.parentElement.childNodes[1].nodeValue=result;
			if(Number(layerSwapDropdown.value)==3) layer4Box.parentElement.childNodes[1].nodeValue=result;
		});
	}
		
});
layer1Box.addEventListener('click', async()=>
{
	if(selected_layer_ids.includes(working_layer_ids[0]))
	{
		selected_layer_ids[0]=null;
	}
	else
	{
		selected_layer_ids[0]=working_layer_ids[0];
	}
	reloadMap();
});
layer2Box.addEventListener('click', async()=>
{
	if(selected_layer_ids.includes(working_layer_ids[1]))
	{
		selected_layer_ids[1]=null;
	}
	else
	{
        	selected_layer_ids[1]=working_layer_ids[1];
	}
	reloadMap();
});
layer3Box.addEventListener('click', async()=>
{
	if(selected_layer_ids.includes(working_layer_ids[2]))
	{
		selected_layer_ids[2]=null;
	}
        else
	{
		selected_layer_ids[2]=working_layer_ids[2];
	}
	reloadMap();
});
layer4Box.addEventListener('click', async()=>
{
	if(selected_layer_ids.includes(working_layer_ids[3]))
	{
		selected_layer_ids[3]=null;
	}
        selected_layer_ids[3]=working_layer_ids[3];
	reloadMap();
});

});
