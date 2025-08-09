const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);
const userId=localStorage.getItem("selectedUserId");
let USER=sb.from("Users").select("*").eq("user_id", userId).single();
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
window.addEventListener('DOMContentLoaded',()=>{
(async()=>
{
const {data: usersPins, count: postCount, error: pinsError}=await sb.from("Pin Posts").select('*', {count: "exact"}).eq("creator_id", USER.user_id);
if(pinsError)
{
	console.error(pinsError.message);
	alert(pinsError.message);
}
else
{
	document.getElementById("postNumberParagraph").innerHTML=`Number of posts: ${postCount}`;
}
const {data: LURdata, error: LURerror}=await sb.from("Layers_Users_Relation").select("layer_id").eq("user_id", USER.user_id);
if(LURerror)
{
	alert(LURerror.message);
	console.error(LURerror.message);
}
for(let id of LURdata)
{
	const {data: layersData, error: layersError}=await sb.from("Layers").select("name").eq("layer_id", id).single();
	if(layersError)
	{
		console.error(layersError.message);
		alert(layersError.message);
		break;
	}
	activeCommunities.innerHTML+=layersData.name+", ";
}
})();
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
});
