async function castVote(targetType, targetId, value, creatorId)
{
	if(!USER) { alert("You must be signed in to vote."); return null; }
	if(creatorId&&USER.user_id===creatorId) { alert("You can't vote on your own pin."); return null; }
	const {data: existingVote, error: fetchError}=await sb.from('Votes').select('*').eq('user_id', USER.user_id).eq('target_id', targetId).eq('target_type', targetType).maybeSingle();
	if(fetchError) { console.error(fetchError.message); return null; }
	let scoreDelta=0;
	let newUserVote=0;
	if(existingVote)
	{
		if(existingVote.value===value)
		{
			const {error}=await sb.from('Votes').delete().eq('vote_id', existingVote.vote_id);
			if(error) { console.error(error.message); return null; }
			scoreDelta=-value;
			newUserVote=0;
		}
		else
		{
			const {error}=await sb.from('Votes').update({value: value}).eq('vote_id', existingVote.vote_id);
			if(error) { console.error(error.message); return null; }
			scoreDelta=value-existingVote.value;
			newUserVote=value;
		}
	}
	else
	{
		const {error}=await sb.from('Votes').insert({user_id: USER.user_id, target_id: targetId, target_type: targetType, value: value});
		if(error) { console.error(error.message); return null; }
		scoreDelta=value;
		newUserVote=value;
	}
	if(targetType==='pin')
	{
		const {data: pinData, error: pinFetchError}=await sb.from('Pin Posts').select('score').eq('pin_id', targetId).single();
		if(pinFetchError) { console.error(pinFetchError.message); return null; }
		const newScore=(pinData.score||0)+scoreDelta;
		const {error: updateError}=await sb.from('Pin Posts').update({score: newScore}).eq('pin_id', targetId);
		if(updateError) { console.error(updateError.message); return null; }
		return {newScore: newScore, newUserVote: newUserVote};
	}
	return {newScore: null, newUserVote: newUserVote};
}
async function getUserVote(targetType, targetId)
{
	if(!USER) return 0;
	const {data, error}=await sb.from('Votes').select('value').eq('user_id', USER.user_id).eq('target_id', targetId).eq('target_type', targetType).maybeSingle();
	if(error) { console.error(error.message); return 0; }
	return data ? data.value : 0;
}
function buildVoteWidget(targetType, targetId, score, creatorId, onScoreUpdate)
{
	const container=document.createElement('div');
	container.style.cssText='display:flex; align-items:center; gap:8px; margin-top:6px;';
	const upBtn=document.createElement('button');
	upBtn.textContent='▲';
	upBtn.style.cssText='cursor:pointer; background:none; border:none; font-size:16px;';
	const scoreSpan=document.createElement('span');
	scoreSpan.textContent=score;
	scoreSpan.style.cssText='font-weight:bold; min-width:24px; text-align:center;';
	const downBtn=document.createElement('button');
	downBtn.textContent='▼';
	downBtn.style.cssText='cursor:pointer; background:none; border:none; font-size:16px;';
	let currentUserVote=0;
	function updateButtonStyles()
	{
		upBtn.style.color=currentUserVote===1?'orange':'gray';
		downBtn.style.color=currentUserVote===-1?'royalblue':'gray';
	}
	updateButtonStyles();
	getUserVote(targetType, targetId).then(vote=>
	{
		currentUserVote=vote;
		updateButtonStyles();
	});
	upBtn.addEventListener('click', async(e)=>
	{
		e.stopPropagation();
		const result=await castVote(targetType, targetId, 1, creatorId);
		if(result===null) return;
		scoreSpan.textContent=result.newScore;
		currentUserVote=result.newUserVote;
		updateButtonStyles();
		if(onScoreUpdate) onScoreUpdate(result.newScore);
	});
	downBtn.addEventListener('click', async(e)=>
	{
		e.stopPropagation();
		const result=await castVote(targetType, targetId, -1, creatorId);
		if(result===null) return;
		scoreSpan.textContent=result.newScore;
		currentUserVote=result.newUserVote;
		updateButtonStyles();
		if(onScoreUpdate) onScoreUpdate(result.newScore);
	});
	container.appendChild(upBtn);
	container.appendChild(scoreSpan);
	container.appendChild(downBtn);
	return container;
}
