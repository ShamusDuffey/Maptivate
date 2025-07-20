const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
let session;
let USER;
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);
async function checkSession()
{
	const{data, error}=await sb.auth.getSession();
	if(error) console.error(error.message);
	else return data.session;
}
async function getUser()
{
	const{data, error}=await sb.from("Users").select("*").eq("email", session.user.email).single();
	if(error) console.error(error.message);
	else return data;
}
(async () =>
{
	session=await checkSession();
	USER=await getUser();
})();
let working_layer_ids=[null, null, null, null];
let selected_layer_ids=[null, null, null, null];
let downloadedPins=[[null], [null], [null], [null]];
window.addEventListener('DOMContentLoaded',()=>{
async function downloadLayer(layer, workingIndex)
{
	if(typeof layer==="number")
        {
                const {data, error}=await sb.from('Layers_Pins_Relation').select('pin_id').eq("layer_id", layer);
                const idsOfPins=data.map(relationRow=>relationRow.pin_id);
		downloadedPins[workingIndex]=[];
                for(const id of idsOfPins)
                {
                        const {data: returnedRow, error: returnError}=await sb.from('Pin Posts').select('*').eq("pin_id", id).single();
			if(returnError)
			{
				console.error("Error fetching pin "+id+":", returnError);
				continue;
			}
			const pin=L.marker([returnedRow.latitude, returnedRow.longitude]);
			downloadedPins[workingIndex].push({sRow: returnedRow, lMarker: pin});
			console.log("Downloaded pin "+id+"\n with this sRow content: "+JSON.stringify(returnedRow, null, 4));
                }
		return;
        }
	else
		console.error("downloadLayer is being called with an inappropriate type.\n");
}
async function loadLayer(workingIndex)
{
	for(const row of downloadedPins[workingIndex])
	{
		if(row===null) continue;
		let pinColor;
		switch(workingIndex)
		{
			case 0: pinColor="red"; 
			if(selected_layer_ids[1]&&selected_layer_ids[2]&&selected_layer_ids[3]) pinColor="black";
			else if(selected_layer_ids[1]&&selected_layer_ids[2]) pinColor="brown";
			else if(selected_layer_ids[2]&&selected_layer_ids[3]) pinColor="#ffb77d";//light orange
			else if(selected_layer_ids[1]&&selected_layer_ids[3]) pinColor="#d132d1";//light purple
			else if(selected_layer_ids[1]) pinColor="purple";
			else if(selected_layer_ids[2]) pinColor="orange";
			else if(selected_layer_ids[3]) pinColor="pink";
			break;
			case 1: pinColor="blue";
			if(selected_layer_ids[0]&&selected_layer_ids[2]&&selected_layer_ids[3]) pinColor="black";
			else if(selected_layer_ids[0]&&selected_layer_ids[2]) pinColor="brown";
			else if(selected_layer_ids[2]&&selected_layer_ids[3]) pinColor="#96ff96";//light green
			else if(selected_layer_ids[0]&&selected_layer_ids[3]) pinColor="#d132d1";//light purple
			else if(selected_layer_ids[0]) pinColor="purple";
			else if(selected_layer_ids[2]) pinColor="green";
			else if(selected_layer_ids[3]) pinColor="#8787ff";//light blue
			break;
			case 2: pinColor="yellow";
			if(selected_layer_ids[0]&&selected_layer_ids[1]&&selected_layer_ids[3]) pinColor="black";
			else if(selected_layer_ids[0]&&selected_layer_ids[1]) pinColor="brown";
			else if(selected_layer_ids[1]&&selected_layer_ids[3]) pinColor="#96ff96";//light green
			else if(selected_layer_ids[0]&&selected_layer_ids[3]) pinColor="#ffb77d";//light orange
			else if(selected_layer_ids[0]) pinColor="orange";
			else if(selected_layer_ids[1]) pinColor="green";
			else if(selected_layer_ids[3]) pinColor="#d132d1";//light yellow
			break;
			case 3: pinColor="white";
			if(selected_layer_ids[0]&&selected_layer_ids[1]&&selected_layer_ids[2]) pinColor="black";
			else if(selected_layer_ids[0]&&selected_layer_ids[1]) pinColor="#d132d1";//light purple
			else if(selected_layer_ids[1]&&selected_layer_ids[2]) pinColor="#96ff96";//light green
			else if(selected_layer_ids[0]&&selected_layer_ids[2]) pinColor="#ffb77d";//light orange
			else if(selected_layer_ids[0]) pinColor="pink";
			else if(selected_layer_ids[1]) pinColor="#8787ff";//light blue
			else if(selected_layer_ids[2]) pinColor="#d132d1";//light yellow
			break;
			default: pinColor="undefined color"; return;
		}
		const popupContent=
                `<div>
                        <h4>${row.sRow.title}</h4>
                        <p>${row.sRow.content}</p>
			<p style="color: ${pinColor}">By user: ${USER.display_name}</p>
                </div>`;

		row.lMarker.addTo(map).bindPopup(popupContent);
	}
} 
async function hideLayer(workingIndex)
{
	for(const row of downloadedPins[workingIndex])
	{
		if(row===null) continue;
		map.removeLayer(row.lMarker)
	}
}
async function loadPin(pin_id, ...credentials)
{
	if(credentials.length===0&&typeof pin_id==="number")
	{
		const sRow=sb.from('Pin Posts').select('*').eq('pin_id', pin_id).single();
		const lat=sRow.latitude;
		const lng=sRow.longitude;
		const title=sRow.title;
		const content=sRow.content;
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
	let pin=L.marker([lat, lng]).addTo(map).bindPopup(popupContent);
	return pin;
}
	
async function saveNewPin(newTitle, newContent, lat, lng, marker, creator_id, selectedLayerIndices)
{
	const { count, error: countError } = await sb.from('Pin Posts').select('*', { count: 'exact', head: true });
        if (countError)
        {
                console.error('Error fetching count:', countError);
                alert('Error fetching count: ' + countError.message);
                return;
        }
	const {data, error} = await sb.from(`Pin Posts`).insert([{pin_id: count, title: newTitle, content: newContent, longitude: lng, latitude: lat, creator_id: USER.user_id }]).select().single();
	if(error)
	{
		console.error("There was an issue inserting a pin into the database: "+error.message);
		return;
	}
	let sRow=data;
	for(let index of selectedLayerIndices)
	{
		const {data, error: relationError}=await sb.from('Layers_Pins_Relation').insert([{pin_id: count, layer_id: selected_layer_ids[index]}]);
		if(relationError)
		{
			console.error("Error inserting into the relation table for pins and layers\n");
			return;
		}
	}
	for(let i of selectedLayerIndices)
	{
		downloadedPins[i].push({sRow: sRow, lMarker: marker});
		console.log("Pushed row with sRow information:");
		console.log(sRow);
		console.log("and marker information:");
		console.log(marker);
		console.log("to downloadedPins at index "+i);
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
		for(const row of layer)
		{
			if(row===null) continue; //might remove this in correspondance with the below comment 6/24 12:35
			map.removeLayer(row.lMarker);//not sure if every lMarker is being assigned to the row structure 6/24 12:33
		}
	}
}
async function reloadMap()
{
	clearMap();
	for(let i=0; i<downloadedPins.length; i++)
	{
		if(selected_layer_ids[i]!=null)
			loadLayer(i);
	}
} 

createNewLayer.addEventListener('click', async() =>
{
	if(!session){alert("You must be signed in to create layers and pins."); return;}
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
	const {data, error} = await sb.from('Layers').insert({layer_id: count, name: layerName, owner_id: USER.user_id});
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
	const {error: relationError}=await sb.from("Layers_Users_Relation").insert({layer_id: count, user_id: USER.user_id});
	if(relationError) console.error(relationError.message);
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
	if(!session){alert("You must be signed in to create layers and pins."); return;}
	const pin_latitude=e.latlng.lat;
	const pin_longitude=e.latlng.lng;
	let title=prompt("Enter the title of your pin: ");
	let content=prompt("Add a discription for nuanced details (or don't): ");
	if(!title) return;
	const new_pin=L.marker([pin_latitude, pin_longitude]);
	let sliIndices=[];
	for(let i=0; i<selected_layer_ids.length; i++)
	{
		if(selected_layer_ids[i]!=null)
		sliIndices.push(i);
	}
	console.log("sliIndices: "); console.log(sliIndices);//
	try
	{
        	await saveNewPin(title, content, pin_latitude, pin_longitude, new_pin, USER.user_id, sliIndices);
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
			if(working_layer_ids.includes(id)) {alert("You may not pick the same layer for multiple slots."); return;}
			if(Number(layerSwapDropdown.value)==0) {document.getElementById("layer1Box").checked=false; hideLayer(0); layer1Box.parentElement.childNodes[1].nodeValue=result;}
			if(Number(layerSwapDropdown.value)==1) {document.getElementById("layer2Box").checked=false; hideLayer(1); layer2Box.parentElement.childNodes[1].nodeValue=result;}
			if(Number(layerSwapDropdown.value)==2) {document.getElementById("layer3Box").checked=false; hideLayer(2); layer3Box.parentElement.childNodes[1].nodeValue=result;}
			if(Number(layerSwapDropdown.value)==3) {document.getElementById("layer4Box").checked=false; hideLayer(3); layer4Box.parentElement.childNodes[1].nodeValue=result;}
			working_layer_ids[Number(layerSwapDropdown.value)]=id;
			await downloadLayer(id, Number(layerSwapDropdown.value));
		});
	}
		
});
layer1Box.addEventListener('click', async()=>
{
	if(working_layer_ids[0]===null)
	{
		alert("Search for a layer first.");
		document.getElementById("layer1Box").checked=false;
		return;
	}
	else if(selected_layer_ids.includes(working_layer_ids[0]))
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
	if(working_layer_ids[1]===null)
        {
                alert("Search for a layer first.");
                document.getElementById("layer2Box").checked=false;
                return;
        }

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
	if(working_layer_ids[2]===null)
        {
                alert("Search for a layer first.");
                document.getElementById("layer3Box").checked=false;
                return;
        }

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
	if(working_layer_ids[3]===null)
        {
                alert("Search for a layer first.");
                document.getElementById("layer4Box").checked=false;
                return;
        }
	if(selected_layer_ids.includes(working_layer_ids[3]))
	{
		selected_layer_ids[3]=null;
	}
	else
	{
		selected_layer_ids[3]=working_layer_ids[3];
	}
	reloadMap();
});
signoutButton.addEventListener('click', async()=>
{
	if(session)
	const {error}=sb.auth.signOut();
	if(error)
		console.error(error.message);
});
});
