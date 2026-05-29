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
