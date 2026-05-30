async function createSubtype(layerId, name, iconSource)
{
	let iconUrl;
	if(typeof iconSource==="string")
		iconUrl=iconSource;
	else
	{
		const safeName=iconSource.name.replace(/[^a-zA-Z0-9._-]/g, '_');
		const fileName=`${layerId}_${Date.now()}_${safeName}`;
		const {error: uploadError}=await sb.storage.from('subtype-icons').upload(fileName, iconSource, {upsert: true});
		if(uploadError)
		{
			console.error("Error uploading icon: "+uploadError.message);
			return false;
		}
		const {data: {publicUrl}}=sb.storage.from('subtype-icons').getPublicUrl(fileName);
		iconUrl=publicUrl;
	}
	const {error}=await sb.from('Subtypes').insert({layer_id: layerId, name: name, icon_url: iconUrl});
	if(error)
	{
		console.error("Error creating subtype: "+error.message);
		return false;
	}
	return true;
}
async function deleteSubtype(subtypeId)
{
	const {error: relError}=await sb.from('Layers_Pins_Relation').update({subtype_id: null}).eq('subtype_id', subtypeId);
	if(relError) { console.error(relError.message); return false; }
	const {error}=await sb.from('Subtypes').delete().eq('subtype_id', subtypeId);
	if(error) { console.error(error.message); return false; }
	return true;
}
async function loadSubtypeList(layerId)
{
	const list=document.getElementById('subtypeList');
	list.innerHTML='';
	const {data: subtypes, error}=await sb.from('Subtypes').select('*').eq('layer_id', layerId);
	if(error||!subtypes||subtypes.length===0)
	{
		list.textContent='No subtypes yet.';
		return;
	}
	for(const subtype of subtypes)
	{
		const row=document.createElement('div');
		row.style.cssText='display:flex; align-items:center; gap:8px; margin-top:4px;';
		const nameSpan=document.createElement('span');
		nameSpan.textContent=subtype.name;
		const deleteBtn=document.createElement('button');
		deleteBtn.textContent='Delete';
		deleteBtn.style.cssText='cursor:pointer; color:red;';
		deleteBtn.addEventListener('click', async()=>
		{
			if(!confirm(`Delete subtype "${subtype.name}"?`)) return;
			const success=await deleteSubtype(subtype.subtype_id);
			if(success)
				row.remove();
			else
				alert('Failed to delete subtype.');
		});
		row.appendChild(nameSpan);
		row.appendChild(deleteBtn);
		list.appendChild(row);
	}
}
async function getOwnedLayers()
{
	if(!USER) return [];
	const {data, error}=await sb.from('Layers').select('layer_id, name').eq('owner_id', USER.user_id);
	if(error)
	{
		console.error(error.message);
		return [];
	}
	return data;
}
