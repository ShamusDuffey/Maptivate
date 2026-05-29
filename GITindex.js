const signInPage = "https://shamusduffey.github.io/Maptivate/GITsignin.html";
const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const userPage = "https://shamusduffey.github.io/Maptivate/GITusers.html";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
let session = null;
let USER = null;
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);
async function checkSession()
{
	const{data, error}=await sb.auth.getSession();
	if(error) console.error(error.message);
	else return data.session;
}
async function getUser()
{
	if(!session)
	{
		console.error("Session is null in getUser.\n");
		return null;
	}
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
		const {data, error}=await sb.from('Layers_Pins_Relation').select('pin_id, subtype_id').eq("layer_id", layer);
		downloadedPins[workingIndex]=[];
		for(const relation of data)
		{
			const {data: returnedRow, error: returnError}=await sb.from('Pin Posts').select('*').eq("pin_id", relation.pin_id).single();
			if(returnError)
			{
				console.error("Error fetching pin "+relation.pin_id+":", returnError);
				continue;
			}
			let subtypeIconUrl=null;
			if(relation.subtype_id)
			{
				const {data: subtypeData, error: subtypeError}=await sb.from('Subtypes').select('icon_url').eq('subtype_id', relation.subtype_id).single();
				if(!subtypeError)
					subtypeIconUrl=subtypeData.icon_url;
			}
			const pin=L.marker([returnedRow.latitude, returnedRow.longitude]);
			downloadedPins[workingIndex].push({sRow: returnedRow, lMarker: pin, subtypeIconUrl: subtypeIconUrl});
			console.log("Downloaded pin "+relation.pin_id+"\n with this sRow content: "+JSON.stringify(returnedRow, null, 4));
		}
		return;
	}
	else
		console.error("downloadLayer is being called with an inappropriate type.\n");
}
async function loadLayer(workingIndex)
{
	const zoom=map.getZoom();
	let maxPins;
	if(zoom>=14) maxPins=Infinity;
	else if(zoom>=12) maxPins=150;
	else if(zoom>=10) maxPins=75;
	else if(zoom>=8) maxPins=30;
	else maxPins=10;
	const sortedPins=downloadedPins[workingIndex]
		.filter(r=>r!==null)
		.sort((a,b)=>(b.sRow.score??0)-(a.sRow.score??0));
	const pinsToShow=maxPins===Infinity?sortedPins:sortedPins.slice(0, maxPins);
	for(const row of pinsToShow)
	{
		const pinLayerIds=[null, null, null, null];
		for(let j=0; j<4; j++)
		{
			if(selected_layer_ids[j]===null) continue;
			const inSlot=downloadedPins[j].find(r=>r!==null&&r.sRow.pin_id===row.sRow.pin_id);
			if(inSlot) pinLayerIds[j]=selected_layer_ids[j];
		}
		const pinColor=getPinColor(workingIndex, pinLayerIds);
		if(pinColor===null) continue;
		let iconUrl=row.subtypeIconUrl;
		for(let j=0; j<workingIndex; j++)
		{
			if(selected_layer_ids[j]===null) continue;
			const higherPin=downloadedPins[j].find(r=>r!==null&&r.sRow.pin_id===row.sRow.pin_id);
			if(higherPin&&higherPin.subtypeIconUrl)
			{
				iconUrl=higherPin.subtypeIconUrl;
				break;
			}
		}
		if(iconUrl)
		{
			row.lMarker.setIcon(L.icon({
				iconUrl: iconUrl,
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32]
			}));
		}
		else
		{
			row.lMarker.setIcon(L.icon({
				iconUrl: 'pinIcons/'+colorToPinIcon[pinColor],
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34]
			}));
		}
		const {data, error}=await sb.from("Users").select("*").eq("user_id", row.sRow.creator_id).single();
		if(error)
		{
			console.error(error.message);
			continue;
		}
		const link=document.createElement("a");
		link.href=userPage;
		link.textContent=data.display_name;
		link.style.textDecoration="underline";
		link.style.color=pinColor;
		link.addEventListener("click", ()=>
		{
			localStorage.setItem("selectedUserId", row.sRow.creator_id);
		});
		const popupContent=document.createElement("div");
		const pinTitle=document.createElement("h4");
		pinTitle.textContent=row.sRow.title;
		popupContent.appendChild(pinTitle);
		const pinDescription=document.createElement("p");
		pinDescription.textContent=row.sRow.content;
		popupContent.appendChild(pinDescription);
		const userParagraph=document.createElement("p");
		userParagraph.textContent="By user: ";
		userParagraph.appendChild(link);
		popupContent.appendChild(userParagraph);
		const voteWidget=buildVoteWidget('pin', row.sRow.pin_id, row.sRow.score??0, row.sRow.creator_id, (newScore)=>
		{
			row.sRow.score=newScore;
		});
		popupContent.appendChild(voteWidget);
		const detailBtn=document.createElement('button');
		detailBtn.textContent='View Details';
		detailBtn.style.cssText='margin-top:6px; cursor:pointer; display:block;';
		detailBtn.addEventListener('click', (e)=>
		{
			e.stopPropagation();
			openPinDetailModal(row.sRow, data.display_name, iconUrl, pinColor);
		});
		popupContent.appendChild(detailBtn);
		row.lMarker.addTo(map).bindPopup(popupContent);
	}
}
async function hideLayer(workingIndex)
{
	for(const row of downloadedPins[workingIndex])
	{
		if(row===null) continue;
		map.removeLayer(row.lMarker);
	}
}
async function saveNewPin(newTitle, newContent, lat, lng, marker, creator_id, selectedLayerIndices, subtypeIds)
{
	const {data, error}=await sb.from('Pin Posts').insert([{title: newTitle, content: newContent, longitude: lng, latitude: lat, creator_id: USER.user_id}]).select().single();
	if(error)
	{
		console.error("There was an issue inserting a pin into the database: "+error.message);
		return;
	}
	let sRow=data;
	for(let index of selectedLayerIndices)
	{
		const subtypeId=subtypeIds[index]||null;
		const {error: relationError}=await sb.from('Layers_Pins_Relation').insert([{pin_id: sRow.pin_id, layer_id: selected_layer_ids[index], subtype_id: subtypeId}]);
		if(relationError)
		{
			console.error("Error inserting into the relation table for pins and layers\n");
			return;
		}
	}
	for(let i of selectedLayerIndices)
	{
		let subtypeIconUrl=null;
		if(subtypeIds[i])
		{
			const {data: subtypeData, error: subtypeError}=await sb.from('Subtypes').select('icon_url').eq('subtype_id', subtypeIds[i]).single();
			if(!subtypeError)
				subtypeIconUrl=subtypeData.icon_url;
		}
		downloadedPins[i].push({sRow: sRow, lMarker: marker, subtypeIconUrl: subtypeIconUrl});
		console.log("Pushed pin to downloadedPins at index "+i);
	}
	return sRow.pin_id;
}
async function getLayerIdOrName(argument)
{
	if(typeof argument==="string")
	{
		const{data, error}=await sb.from('Layers').select("layer_id").eq("name", argument).single();
		if(error)
		{
			console.error('Error querying Supabase: ', error);
			alert('Error fetching id: '+error.message);
			return null;
		}
		return data.layer_id;
	}
	else if(typeof argument==="number")
	{
		const{data, error}=await sb.from('Layers').select("name").eq("layer_id", argument).single();
		if(error)
		{
			console.error('Error querying Supabase: ', error);
			alert('Error fetching name: '+error.message);
			return null;
		}
		return data.name;
	}
	else
	{
		console.log("Invalid type in getLayerIdOrName\n");
		return;
	}
}
async function clearMap()
{
	for(const layer of downloadedPins)
	{
		if(layer===null) continue;
		for(const row of layer)
		{
			if(row===null) continue;
			map.removeLayer(row.lMarker);
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
let detailMap=null;
function openPinDetailModal(sRow, displayName, iconUrl, pinColor)
{
	document.getElementById('detailPinTitle').textContent=sRow.title;
	document.getElementById('detailPinContent').textContent=sRow.content;
	document.getElementById('detailPinCreator').textContent='By: '+displayName;
	const widgetContainer=document.getElementById('detailVoteWidget');
	widgetContainer.innerHTML='';
	widgetContainer.appendChild(buildVoteWidget('pin', sRow.pin_id, sRow.score??0, sRow.creator_id, (newScore)=>
	{
		sRow.score=newScore;
	}));
	document.getElementById('pinDetailModal').style.display='block';
	if(detailMap) detailMap.remove();
	detailMap=L.map('detailMap').setView([sRow.latitude, sRow.longitude], 15);
	L.tileLayer(
		'https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=a5ic5yAL7H7RtI0ALklW',
		{
			attribution:
				'<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>' +
				' <a href="https://www.openstreetmap.org/copyright" target="_blank">' +
				'&copy; OpenStreetMap contributors</a>',
		}
	).addTo(detailMap);
	let markerIcon;
	if(iconUrl)
	{
		markerIcon=L.icon({
			iconUrl: iconUrl,
			iconSize: [32, 32],
			iconAnchor: [16, 32],
			popupAnchor: [0, -32]
		});
	}
	else
	{
		markerIcon=L.icon({
			iconUrl: 'pinIcons/'+colorToPinIcon[pinColor],
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34]
		});
	}
	L.marker([sRow.latitude, sRow.longitude], {icon: markerIcon}).addTo(detailMap);
}
document.getElementById('closePinDetailBtn').addEventListener('click', ()=>
{
	document.getElementById('pinDetailModal').style.display='none';
});
async function showSubtypeModal(sliIndices)
{
	const selectors=document.getElementById('subtypeSelectors');
	selectors.innerHTML='';
	let hasSubtypes=false;
	for(const i of sliIndices)
	{
		const {data: subtypes, error}=await sb.from('Subtypes').select('*').eq('layer_id', selected_layer_ids[i]);
		if(error||!subtypes||subtypes.length===0) continue;
		hasSubtypes=true;
		const layerName=await getLayerIdOrName(selected_layer_ids[i]);
		const label=document.createElement('p');
		label.textContent=`Layer ${i+1} (${layerName}):`;
		selectors.appendChild(label);
		const select=document.createElement('select');
		select.id=`subtypeSelect_${i}`;
		const noneOpt=document.createElement('option');
		noneOpt.value='';
		noneOpt.textContent='(none)';
		select.appendChild(noneOpt);
		for(const subtype of subtypes)
		{
			const opt=document.createElement('option');
			opt.value=subtype.subtype_id;
			opt.textContent=subtype.name;
			select.appendChild(opt);
		}
		selectors.appendChild(select);
	}
	if(!hasSubtypes)
		return {};
	const modal=document.getElementById('pinCreationModal');
	modal.style.display='block';
	return new Promise((resolve)=>
	{
		document.getElementById('confirmPinBtn').onclick=()=>
		{
			modal.style.display='none';
			const result={};
			for(const i of sliIndices)
			{
				const sel=document.getElementById(`subtypeSelect_${i}`);
				if(sel&&sel.value)
					result[i]=parseInt(sel.value);
			}
			resolve(result);
		};
		document.getElementById('cancelPinBtn').onclick=()=>
		{
			modal.style.display='none';
			resolve(null);
		};
	});
}
const createNewLayer=document.getElementById("createNewLayer");
createNewLayer.addEventListener('click', async()=>
{
	if(!session){alert("You must be signed in to create layers and pins."); return;}
	const layerNameInput=document.getElementById('layerNameInput');
	const layerName=layerNameInput.value.trim().toLowerCase();
	const {data: layerExists, error: existenceError}=await sb.from('Layers').select('name').eq('name', layerName).maybeSingle();
	if(existenceError)
	{
		console.error(existenceError.message);
		return;
	}
	if(layerExists)
	{
		alert("This layer already exists; no new layer was created.");
		return;
	}
	if(!layerName) return alert('Name your layer based on what it shows!');
	const {data, error}=await sb.from('Layers').insert({name: layerName, owner_id: USER.user_id}).select().single();
	if(error)
	{
		console.error('Error inserting data:', error);
		alert('Error inserting data: '+error.message);
		return;
	}
	else
	{
		console.log('Data inserted successfully:', data);
		alert('Data inserted successfully!');
	}
	const {error: relationError}=await sb.from("Layers_Users_Relation").insert({layer_id: data.layer_id, user_id: USER.user_id});
	if(relationError) console.error(relationError.message);
});
document.getElementById('manageSubtypesBtn').addEventListener('click', async()=>
{
	if(!session){alert("You must be signed in to manage subtypes."); return;}
	const container=document.getElementById('subtypeFormContainer');
	if(container.style.display!=='none')
	{
		container.style.display='none';
		return;
	}
	const ownedLayers=await getOwnedLayers();
	if(ownedLayers.length===0){alert("You don't own any layers yet."); return;}
	const select=document.getElementById('subtypeLayerSelect');
	select.innerHTML='';
	for(const layer of ownedLayers)
	{
		const opt=document.createElement('option');
		opt.value=layer.layer_id;
		opt.textContent=layer.name;
		select.appendChild(opt);
	}
	container.style.display='block';
});
document.getElementById('saveSubtypeBtn').addEventListener('click', async()=>
{
	const layerId=parseInt(document.getElementById('subtypeLayerSelect').value);
	const name=document.getElementById('subtypeNameInput').value.trim();
	const urlInput=document.getElementById('subtypeIconUrlInput').value.trim();
	const fileInput=document.getElementById('subtypeIconFileInput');
	if(!name){alert("Please enter a subtype name."); return;}
	if(!urlInput&&!fileInput.files[0]){alert("Please provide an icon URL or upload an image."); return;}
	const iconSource=fileInput.files[0]||urlInput;
	const success=await createSubtype(layerId, name, iconSource);
	if(success)
	{
		alert("Subtype created successfully!");
		document.getElementById('subtypeNameInput').value='';
		document.getElementById('subtypeIconUrlInput').value='';
		fileInput.value='';
	}
	else
		alert("Failed to create subtype.");
});
document.addEventListener('keydown', (e)=>
{
	if(e.key==='1') layer1Box.click();
	else if(e.key==='2') layer2Box.click();
	else if(e.key==='3') layer3Box.click();
	else if(e.key==='4') layer4Box.click();
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
map.on('zoomend', ()=>
{
	reloadMap();
});
map.on('click', async(e)=>
{
	if(!session){alert("You must be signed in to create layers and pins."); return;}
	const pin_latitude=e.latlng.lat;
	const pin_longitude=e.latlng.lng;
	let title=prompt("Enter the title of your pin: ");
	if(!title) return;
	let content=prompt("Add a description for nuanced details (or don't): ");
	let sliIndices=[];
	for(let i=0; i<selected_layer_ids.length; i++)
	{
		if(selected_layer_ids[i]!=null)
			sliIndices.push(i);
	}
	const subtypeIds=await showSubtypeModal(sliIndices);
	if(subtypeIds===null) return;
	const new_pin=L.marker([pin_latitude, pin_longitude]);
	try
	{
		await saveNewPin(title, content, pin_latitude, pin_longitude, new_pin, USER.user_id, sliIndices, subtypeIds);
		alert("Pin saved successfully!");
		reloadMap();
	}
	catch(error)
	{
		console.error("Failed to save pin:", error);
		alert("Failed to save pin: "+error.message);
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
			if(working_layer_ids.includes(id)){alert("You may not pick the same layer for multiple slots."); return;}
			if(Number(layerSwapDropdown.value)==0){document.getElementById("layer1Box").checked=false; hideLayer(0); layer1Box.parentElement.childNodes[1].nodeValue=result;}
			if(Number(layerSwapDropdown.value)==1){document.getElementById("layer2Box").checked=false; hideLayer(1); layer2Box.parentElement.childNodes[1].nodeValue=result;}
			if(Number(layerSwapDropdown.value)==2){document.getElementById("layer3Box").checked=false; hideLayer(2); layer3Box.parentElement.childNodes[1].nodeValue=result;}
			if(Number(layerSwapDropdown.value)==3){document.getElementById("layer4Box").checked=false; hideLayer(3); layer4Box.parentElement.childNodes[1].nodeValue=result;}
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
		selected_layer_ids[0]=null;
	else
		selected_layer_ids[0]=working_layer_ids[0];
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
		selected_layer_ids[1]=null;
	else
		selected_layer_ids[1]=working_layer_ids[1];
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
		selected_layer_ids[2]=null;
	else
		selected_layer_ids[2]=working_layer_ids[2];
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
		selected_layer_ids[3]=null;
	else
		selected_layer_ids[3]=working_layer_ids[3];
	reloadMap();
});
if(session)
{
	document.getElementById("signInButton").value="SIGN OUT";
}
signInButton.addEventListener('click', async()=>
{
	if(session)
	{
		const {error}=await sb.auth.signOut();
		if(error)
			console.error(error.message);
	}
	window.location.href=signInPage;
});
});
