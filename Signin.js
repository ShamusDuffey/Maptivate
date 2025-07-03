const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);

async function signUp(email, password, phone) {
    const { data, error } = await sb.auth.signUp({ email: email, password: password, options: { data: {phone: phone} } });

    const userId = data.user.id;
    const { error: insertError } = await sb
        .from('users')  // Match actual table name
        .insert([{ id: userId, phone }]); // Manually insert phone # from metadata

    if (insertError) {
        console.error("Database insert failed:", insertError); // Manual insert failed
    }
    
    console.log("Signup Response:", data, error); // Log the response for debugging
    if (error) {
        alert("There was an issue signing you up: " + error.message);
    } else {
        alert("Welcome! You've been signed up! Just confirm your identity in your email to gain access to your account.");
    }
}

async function signin(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
    if (error) {
        alert("There was an issue signing you in: " + error.message);
    } else {
        alert(`Welcome back, ${data.user.email}`);
        document.getElementById("signin-form").style.display = "none";
        document.getElementById("signup-form").style.display = "none";
        window.location.href = "https://shamusduffey.github.io/Maptivate/prototype.html"
    }
}

document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const phone = document.getElementById("signup-phone").value;
    await signUp(email, password, phone);
});

document.getElementById("signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    await signin(email, password);
});
