const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);

async function signUp(email, password, phone, displayName)
{
	if(!email||!password||!phone)
	{
		alert("You need an email, phone number, and password to sign up.");
		return 0;
	}
	const {data: emailExists, error: eExistenceError}=await sb.from('Users').select('email').eq('email', email).maybeSingle();
	if(eExistenceError)
	{
		console.error("Failed to check if the email exists: "+eExistenceError.message);
		return 0;
	}
	if(emailExists)
	{
		alert("There's already an accout with this email; no additional accounts were made.");
		return 0;
	}
	const {data: phoneExists, error: pExistenceError}=await sb.from('Users').select("phone_number").eq("phone_number", phone).maybeSingle();
	if(pExistenceError)
	{
		console.error("Failed to check if the phone number exists: "+pExistenceError.message);
		return 0;
	}
	if(phoneExists)
	{
		alert("There's already an account with this phone number; no additional accounts were made.");
		return 0;
	}
	const {data: displayNameExists, error: dExistenceError}=await sb.from('Users').select('display_name').eq('display_name', displayName).maybeSingle();
	if(dExistenceError)
	{
		console.error("Failed to check if the display name exists: "+dExistenceError.message);
		return 0;
	}
	if(displayNameExists)
	{
		alert("There's already an account with this display name; no additional accounts were made.");
		return 0;
	}
	const {data: emailData, error: emailError}=await sb.auth.signUp({email: email, password: password, options: {data: {phone: phone}}});
	if (emailError)
	{
		alert("There was an issue signing you up with your email: " + error.message);
		return 0;
	}
	/*const {data: phoneData, error: phoneError}=await sb.auth.signUp({phone: phone, password: password});
	if(phoneError)
	{
		alert("There was an issue with your phone number while signing you up: "+phoneError.message);
		const {data: deletionResult, error: deletionError}=await sb.from('Users').delete().eq('email', email);
		if(deletionError)
			console.error("An account has been made but an unfixed error occurred. The account must be manually deleted. Here's the error: "+error.message);
		return 0;
	}*/
	const {error: userTableFillError}=await sb.from("Users").insert({user_id: emailData.user.id, email: email, password: password, phone_number: phone, display_name: displayName});
	if(userTableFillError)
	{
		console.error("The phone number could not be updated. Here's why: "+userTableFillError.message);
		return;
	}
       	alert("Welcome! You've been signed up! Just confirm your identity via email and text to gain access to your account.");
	return 1;
}
async function signin(email, password)
{
	const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
	if (error)
	{
		alert("There was an issue signing you in: " + error.message);
	}
	else
	{
		alert(`Welcome back, ${data.user.email}`);
		document.getElementById("signinForm").style.display = "none";
		document.getElementById("signupForm").style.display = "none";
		const {data: session}=await sb.auth.getSession(); 
		if(session) 
			window.location.href="https://shamusduffey.github.io/Maptivate/prototype.html"; 
		else
			console.error("No user signed in on this client.");
	}
}
document.getElementById("signupForm").addEventListener("submit", async (e) =>
{
	e.preventDefault();
	const email = document.getElementById("signupEmail").value;
	const password = document.getElementById("signupPassword").value;
	const phone = document.getElementById("signupPhone").value;
	if(!await signUp(email, password, phone))
		alert("You're going to have to sign up successfully in order to post, but you can view the world's most nuanced map for now.");
	const {data: session}=await sb.auth.getSession();
	if(session)
		window.location.href="https://shamusduffey.github.io/Maptivate/prototype.html";
});
document.getElementById("signinForm").addEventListener("submit", async (e) =>
{
	e.preventDefault();
	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;
	await signin(email, password);
});
