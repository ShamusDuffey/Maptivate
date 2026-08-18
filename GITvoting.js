async function recountScore(targetType, targetId)
{
	const {data, error}=await sb.from('Votes').select('value').eq('target_id', targetId).eq('target_type', targetType);
	if(error) { console.error(error.message); return null; }
	let total=0;
	for(const row of data) total+=row.value;
	return total;
}
async function castVote(targetType, targetId, value, creatorId)
{
	if(!USER) { alert("You must be signed in to vote."); return null; }
	if(creatorId&&USER.user_id===creatorId) { alert("You can't vote on your own pin."); return null; }
	const {data: existingVotes, error: fetchError}=await sb.from('Votes').select('*').eq('user_id', USER.user_id).eq('target_id', targetId).eq('target_type', targetType).order('vote_id', {ascending: true});
	if(fetchError) { console.error(fetchError.message); return null; }
	const existingVote=existingVotes.length?existingVotes[0]:null;
	if(existingVotes.length>1)
	{
		const duplicateIds=existingVotes.slice(1).map(v=>v.vote_id);
		const {error}=await sb.from('Votes').delete().in('vote_id', duplicateIds);
		if(error) { console.error(error.message); return null; }
	}
	let newUserVote=0;
	if(existingVote)
	{
		if(existingVote.value===value)
		{
			const {error}=await sb.from('Votes').delete().eq('vote_id', existingVote.vote_id);
			if(error) { console.error(error.message); return null; }
			newUserVote=0;
		}
		else
		{
			const {error}=await sb.from('Votes').update({value: value}).eq('vote_id', existingVote.vote_id);
			if(error) { console.error(error.message); return null; }
			newUserVote=value;
		}
	}
	else
	{
		const {error}=await sb.from('Votes').insert({user_id: USER.user_id, target_id: targetId, target_type: targetType, value: value});
		if(error) { console.error(error.message); return null; }
		newUserVote=value;
	}
	const newScore=await recountScore(targetType, targetId);
	if(newScore===null) return null;
	if(targetType==='pin')
	{
		const {error: updateError}=await sb.from('Pin Posts').update({score: newScore}).eq('pin_id', targetId);
		if(updateError) { console.error(updateError.message); return null; }
	}
	return {newScore: newScore, newUserVote: newUserVote};
}
async function getUserVote(targetType, targetId)
{
	if(!USER) return 0;
	const {data, error}=await sb.from('Votes').select('value').eq('user_id', USER.user_id).eq('target_id', targetId).eq('target_type', targetType).order('vote_id', {ascending: true}).limit(1);
	if(error) { console.error(error.message); return 0; }
	return data.length ? data[0].value : 0;
}
const voteWidgets=[];
function syncVoteWidgets(targetType, targetId, newScore, newUserVote, source)
{
	for(let i=voteWidgets.length-1; i>=0; i--)
	{
		const widget=voteWidgets[i];
		if(!widget.container.isConnected) { voteWidgets.splice(i, 1); continue; }
		if(widget===source||widget.targetType!==targetType||widget.targetId!==targetId) continue;
		widget.apply(newScore, newUserVote);
	}
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
	let voteInFlight=false;
	function updateButtonStyles()
	{
		upBtn.style.color=currentUserVote===1?'orange':'gray';
		downBtn.style.color=currentUserVote===-1?'royalblue':'gray';
	}
	function apply(newScore, newUserVote)
	{
		if(newScore!==null&&newScore!==undefined) scoreSpan.textContent=newScore;
		currentUserVote=newUserVote;
		updateButtonStyles();
	}
	const widget={targetType: targetType, targetId: targetId, container: container, apply: apply};
	voteWidgets.push(widget);
	updateButtonStyles();
	getUserVote(targetType, targetId).then(vote=>
	{
		currentUserVote=vote;
		updateButtonStyles();
	});
	async function handleVote(value, e)
	{
		e.stopPropagation();
		if(voteInFlight) return;
		voteInFlight=true;
		upBtn.disabled=true;
		downBtn.disabled=true;
		try
		{
			const result=await castVote(targetType, targetId, value, creatorId);
			if(result===null) return;
			apply(result.newScore, result.newUserVote);
			syncVoteWidgets(targetType, targetId, result.newScore, result.newUserVote, widget);
			if(onScoreUpdate) onScoreUpdate(result.newScore);
		}
		finally
		{
			voteInFlight=false;
			upBtn.disabled=false;
			downBtn.disabled=false;
		}
	}
	upBtn.addEventListener('click', (e)=>handleVote(1, e));
	downBtn.addEventListener('click', (e)=>handleVote(-1, e));
	container.appendChild(upBtn);
	container.appendChild(scoreSpan);
	container.appendChild(downBtn);
	return container;
}
