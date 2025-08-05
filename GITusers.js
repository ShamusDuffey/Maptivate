import {loadPin, getUser, checkSession} from './GIThome.js';
const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const userId=localStorage.getItem("selectedUserId");
let USER=sb.from("Users").select("*").eq("user_id", userId).single();
document.getElementById=("usernameHeader").textContent=USER.display_name;
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);
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
const {data: usersPins, count: postCount, error: pinsError}=sb.from("Pin Posts").select('*', {count: exact}).eq("creator_id", USER.user_id);
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
	console.error(LUR.message);
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

